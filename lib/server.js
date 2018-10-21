import 'colors';
import path from 'path';
import extend from 'extend';
import url from 'url';
import chokidar from 'chokidar';

import services from './controllers/services';

import express from 'express';
import bodyParser from 'body-parser';
import state from './state';
import proxyMiddleware from 'http-proxy-middleware';
import {saveRemoteStub} from './lib/save-remote-stub';
import {STUB_PATH} from './lib/constants';
import {getSessionIdFromReq, applyWildcards, stripTrailingSlash} from './lib/utilities';
import winston from 'winston';
import serveIndex from 'serve-index';

var defaultConfig = {
    // Port to run the server on
    port: undefined,
    // Static paths to serve
    paths: []
};

var envHandlers = {};


let serveIndexHandler = serveIndex(path.resolve('.'), {'icons': true});


function pickHandler(env, req, res, next, args) {
    var handled = false;
    var _url = applyWildcards(stripTrailingSlash(req.url), state.wildcardPatterns);
    var path = '';
    var bestPath = '';

    Object.keys(envHandlers[env]).forEach(function(path){
        if (_url.indexOf(path) === 0 && path.length > bestPath.length) {
            bestPath = path;
        }
    })

    if (bestPath && envHandlers[env][bestPath] !== 'local') {
        winston.info(env+' response:', _url);
        envHandlers[env][bestPath].apply(null, args);
    } else if (bestPath) {
        localStubHandler.apply(null, args)
    } else {
        //skip returning 404 if it looks like this is being called
        //by a user manually hitting the url in the browser so that we can
        //show the folder index potentially
        if (req.headers.accept.indexOf('text/html') === -1) {
          res.status(404).render('404');
          next();
        } else {
          serveIndexHandler(req, res, next);
        }
    }
}

function addEnvHandler(env, req) {
    envHandlers[env] = envHandlers[env] || {};

    return state.getActiveEnvironmentConfig().then(function(paths){
        paths.forEach(function(p){
            if (envHandlers[env][p.path]) return; //avoid duplicate handlers
            winston.info(p.path + ' ' + p.target);

            if (!p.target || p.target === 'local') {
                envHandlers[env][p.path] = 'local';
                return;
            }

            var proxyServiceHandler = proxyMiddleware(p.path,{
                target: p.target,
                secure: false,
                //logLevel: 'debug',
                onProxyRes: function(proxyRes/*, req, res*/){
                    winston.debug(proxyRes.statusCode, proxyRes.statusCode === 500);

                    //don't try to redirect to https
                    if (proxyRes.headers.location) {
                        proxyRes.headers.location = proxyRes.headers.location
                            .replace('https','http')
                    }
                    if (state.isRecording) {
                        saveRemoteStub(proxyRes);
                    }

                },
                onProxyReq: function(proxyReq){
                    winston.debug(proxyReq);
                },
                onError: function(err){
                    winston.error('Proxy Error: '+err);
                }
            }) //end proxyMiddleware

            envHandlers[env][p.path] = proxyServiceHandler;
        }) //end forEach
    }).catch(err => {
        winston.error('I: '+err);
    }) //then promise.then
}

function localStubHandler(req, res, next) {
    state.getStub(url.parse(stripTrailingSlash(req.url)).pathname, req.method, req)
        .then(function (stub) {
            if(stub) {
                winston.info('returning stub for '+url.parse(stripTrailingSlash(req.url)).pathname);
                // An HTTP status code can be defined in the json
                res.status(stub ? stub['@@HTTP_STATUS'] || 200 : 200);
                // It is removed before serving
                stub['@@HTTP_STATUS'] = undefined;

                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(stub, null, '  '));
            } else if (req.headers.accept.indexOf('text/html') === -1) {
                res.status(404);
            }
            next();
        })
        .catch(function (err) {
            winston.error('err: '+err);
            if (req.headers.accept.indexOf('text/html') === -1) {
              res.status(404).render('404');
              next();
            } else {
              serveIndexHandler(req, res, next);
            }
        });
}

/**
 * @param config
 * @param {Number}          config.port     the port to run the server on
 * @param {Array<String>}   config.paths    the paths to serve
 * @returns {Promise}
 */
function server(config) {
    var server = express();

    config = extend(defaultConfig, config);

    server.set('etag', false); // turn off etag

    /* set view path and renderer  */
    server.set('view engine', 'jade');
    server.set('views', path.join(__dirname, 'views/'));

    /* process post requests */
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({extended: true}));

    /* App server */
    config.paths.forEach(function (p) {
        server.use(express.static(path.resolve(p)));
    });

    /* Services UI */
    server.use('/services', services);
    server.use('/services/static', express.static(path.join(__dirname, 'static')));
    /* Proxies & Stubs */

    server.use(function (req, res, next) {
        var env = state.getActiveEnvironment(getSessionIdFromReq(req));
        var args = arguments;

        //CORS stuff
        var allowedHeaders = req.headers['access-control-request-headers']; // .headers wasn't specified, so reflect the request headers
        if (allowedHeaders) {
          res.setHeader("Access-Control-Allow-Headers", allowedHeaders);
        }
        res.setHeader('Allow', 'GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader("Access-Control-Request-Headers", "Vary")
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin || '*');

        if ('OPTIONS' === req.method) {
            res.sendStatus(200);
            return;
        }

        if (stripTrailingSlash(req.url).indexOf('ws/ers/public/message') > -1) {
            //log UI message to console for debugging
            winston.error('Logging UI message...', req.body);
        }

        //if (!envHandlers[env]) {
            addEnvHandler(env, req).then(function(){
                pickHandler(env, req, res, next, args);
            }).catch(err => {
                winston.error('K: '+err);
            })
        //} else {
        //    pickHandler(env, req, args);
        //}

    });


    /* Run the server */
    return new Promise(function (resolve, reject) {
        state
            .ensurePaths()
            .then(()=> { state.loadState(); })
            .then(function () {
                // Watch fs and
                // Refresh routes on add file
                chokidar.watch(STUB_PATH, {ignoreInitial: true}).on('add', state.getRoutes.bind(state, true));
                var _server;
                if (config.port) {
                  // Start listening
                  _server = server.listen(config.port, function () {
                      //TODO: better way to make this available?
                      _server.version = '2.3.2';
                      resolve(_server);
                  });
                } else {
                  //TODO: better way to make this available?
                  server.version = '2.3.2';
                  resolve(server);
                }
            })
            .catch(err => {
            winston.error('L: '+err);
                reject();
            });
    });
}

export default function(config){
    return server(config);
    // .then(function(serverInstance){

    //     services.on('ui:restart',function(){
    //         // The below doesn't work as expected.  Opting for a simple message to user asking them to restart gulp
    //         // TODO: need a different implementation of this
    //         //
    //         // winston.info('restarting server...');
    //         // serverInstance.close();
    //         // serverInstance = server(config);
    //         // winston.info('restart complete');
    //     })
    // return serverInstance
    // });
}
