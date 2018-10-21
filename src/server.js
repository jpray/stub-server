'use strict';

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

require('colors');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _url2 = require('url');

var _url3 = _interopRequireDefault(_url2);

var _chokidar = require('chokidar');

var _chokidar2 = _interopRequireDefault(_chokidar);

var _controllersServices = require('./controllers/services');

var _controllersServices2 = _interopRequireDefault(_controllersServices);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _state = require('./state');

var _state2 = _interopRequireDefault(_state);

var _httpProxyMiddleware = require('http-proxy-middleware');

var _httpProxyMiddleware2 = _interopRequireDefault(_httpProxyMiddleware);

var _libSaveRemoteStub = require('./lib/save-remote-stub');

var _libConstants = require('./lib/constants');

var _libUtilities = require('./lib/utilities');

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _serveIndex = require('serve-index');

var _serveIndex2 = _interopRequireDefault(_serveIndex);

var defaultConfig = {
    // Port to run the server on
    port: undefined,
    // Static paths to serve
    paths: []
};

var envHandlers = {};

var serveIndexHandler = (0, _serveIndex2['default'])(_path2['default'].resolve('.'), { 'icons': true });

function pickHandler(env, req, res, next, args) {
    var handled = false;
    var _url = (0, _libUtilities.applyWildcards)((0, _libUtilities.stripTrailingSlash)(req.url), _state2['default'].wildcardPatterns);
    var path = '';
    var bestPath = '';

    _Object$keys(envHandlers[env]).forEach(function (path) {
        if (_url.indexOf(path) === 0 && path.length > bestPath.length) {
            bestPath = path;
        }
    });

    if (bestPath && envHandlers[env][bestPath] !== 'local') {
        _winston2['default'].info(env + ' response:', _url);
        envHandlers[env][bestPath].apply(null, args);
    } else if (bestPath) {
        localStubHandler.apply(null, args);
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

    return _state2['default'].getActiveEnvironmentConfig().then(function (paths) {
        paths.forEach(function (p) {
            if (envHandlers[env][p.path]) return; //avoid duplicate handlers
            _winston2['default'].info(p.path + ' ' + p.target);

            if (!p.target || p.target === 'local') {
                envHandlers[env][p.path] = 'local';
                return;
            }

            var proxyServiceHandler = (0, _httpProxyMiddleware2['default'])(p.path, {
                target: p.target,
                secure: false,
                //logLevel: 'debug',
                onProxyRes: function onProxyRes(proxyRes /*, req, res*/) {
                    _winston2['default'].debug(proxyRes.statusCode, proxyRes.statusCode === 500);

                    //don't try to redirect to https
                    if (proxyRes.headers.location) {
                        proxyRes.headers.location = proxyRes.headers.location.replace('https', 'http');
                    }
                    if (_state2['default'].isRecording) {
                        (0, _libSaveRemoteStub.saveRemoteStub)(proxyRes);
                    }
                },
                onProxyReq: function onProxyReq(proxyReq) {
                    _winston2['default'].debug(proxyReq);
                },
                onError: function onError(err) {
                    _winston2['default'].error('Proxy Error: ' + err);
                }
            }); //end proxyMiddleware

            envHandlers[env][p.path] = proxyServiceHandler;
        }); //end forEach
    })['catch'](function (err) {
        _winston2['default'].error('I: ' + err);
    }); //then promise.then
}

function localStubHandler(req, res, next) {
    _state2['default'].getStub(_url3['default'].parse((0, _libUtilities.stripTrailingSlash)(req.url)).pathname, req.method, req).then(function (stub) {
        if (stub) {
            _winston2['default'].info('returning stub for ' + _url3['default'].parse((0, _libUtilities.stripTrailingSlash)(req.url)).pathname);
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
    })['catch'](function (err) {
        _winston2['default'].error('err: ' + err);
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
    var server = (0, _express2['default'])();

    config = (0, _extend2['default'])(defaultConfig, config);

    server.set('etag', false); // turn off etag

    /* set view path and renderer  */
    server.set('view engine', 'jade');
    server.set('views', _path2['default'].join(__dirname, 'views/'));

    /* process post requests */
    server.use(_bodyParser2['default'].json());
    server.use(_bodyParser2['default'].urlencoded({ extended: true }));

    /* App server */
    config.paths.forEach(function (p) {
        server.use(_express2['default']['static'](_path2['default'].resolve(p)));
    });

    /* Services UI */
    server.use('/services', _controllersServices2['default']);
    server.use('/services/static', _express2['default']['static'](_path2['default'].join(__dirname, 'static')));
    /* Proxies & Stubs */

    server.use(function (req, res, next) {
        var env = _state2['default'].getActiveEnvironment((0, _libUtilities.getSessionIdFromReq)(req));
        var args = arguments;

        //CORS stuff
        var allowedHeaders = req.headers['access-control-request-headers']; // .headers wasn't specified, so reflect the request headers
        if (allowedHeaders) {
            res.setHeader("Access-Control-Allow-Headers", allowedHeaders);
        }
        res.setHeader('Allow', 'GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH');
        res.setHeader("Access-Control-Request-Headers", "Vary");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Origin", req.headers.origin || '*');

        if ('OPTIONS' === req.method) {
            res.sendStatus(200);
            return;
        }

        if ((0, _libUtilities.stripTrailingSlash)(req.url).indexOf('ws/ers/public/message') > -1) {
            //log UI message to console for debugging
            _winston2['default'].error('Logging UI message...', req.body);
        }

        //if (!envHandlers[env]) {
        addEnvHandler(env, req).then(function () {
            pickHandler(env, req, res, next, args);
        })['catch'](function (err) {
            _winston2['default'].error('K: ' + err);
        });
        //} else {
        //    pickHandler(env, req, args);
        //}
    });

    /* Run the server */
    return new _Promise(function (resolve, reject) {
        _state2['default'].ensurePaths().then(function () {
            _state2['default'].loadState();
        }).then(function () {
            // Watch fs and
            // Refresh routes on add file
            _chokidar2['default'].watch(_libConstants.STUB_PATH, { ignoreInitial: true }).on('add', _state2['default'].getRoutes.bind(_state2['default'], true));
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
        })['catch'](function (err) {
            _winston2['default'].error('L: ' + err);
            reject();
        });
    });
}

exports['default'] = function (config) {
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
};

module.exports = exports['default'];