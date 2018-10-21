import express from 'express';
import state from '../state.js';
import path from 'path';
import {getSessionIdFromReq} from '../lib/utilities';
import winston from 'winston';
import createDemoFile from '../lib/create-demo-file';
var services = express();
/* set view path and renderer  */
services.set('view engine', 'jade');
services.set('views', path.join(__dirname, '../views/'));

services.get('/', function (req, res) {
    (async function () {
        var routes = await state.getRoutes();
        var presets = await state.getPresets();
        var environments = await state.getEnvironments();
        var activeEnvironment = await state.getActiveEnvironment(getSessionIdFromReq(req));
        var activePreset = await state.getActivePreset(getSessionIdFromReq(req));
        var saveRemoteStubsAs = state.saveRemoteStubsAs;
        var isRecording = state.isRecording;
        routes = await splitRoutes(routes, getSessionIdFromReq(req));

        res.render('index', {
            routes, 
            presets, 
            environments, 
            activeEnvironment, 
            activePreset,
            saveRemoteStubsAs, 
            isRecording
        });
    })().catch(err => { 
        winston.error('A: '+err);
        throw err });
});

services.get('/setSaveRemoteStubsAs', function (req, res) {
    (async function () {
        await state.setSaveRemoteStubsAs(req.query.saveRemoteStubsAs, req.query.recordAction);
        res.redirect('/services/');
    })().catch(err => { 
        winston.error('B: '+err);
        throw err });
});

services.get('/setRoute', function (req, res) {
    state.setActiveStub(req.query.route, req.query.stub, getSessionIdFromReq(req))
        .then(function() {
            res.redirect('/services/');
        })
        .catch(err => { 
            winston.error('C: '+err);
            throw err });
});

services.get('/setPreset', function (req, res) {
    winston.debug('****setPreset******',req.query.name, getSessionIdFromReq(req))
    state.setPreset(req.query.name, getSessionIdFromReq(req))
        .then(function () {
            res.redirect('/services/');
        })
        .catch(err => { 
            winston.error('D: '+err);
            throw err });
});

services.get('/createUniqueSession', function (req, res) {
    var newSessionId = Math.random().toString();
    state.createBrowserSession(newSessionId); 
    res.cookie('stubServerSessionId', newSessionId, { secure: false, expires: 0, httpOnly: false });
    res.send('stub-server session: '+newSessionId);
});

services.get('/setEnvironment', function (req, res) {  
    state.setEnvironment(req.query.name, getSessionIdFromReq(req))
        .then(function () {
            res.redirect('/services/');
            services.emit('ui:restart');
        })
        .catch(err => { 
            winston.error('E: '+err);
            throw err });
});

services.get('/reset', function (req, res) {
    state.reset()
        .then(function () {
            res.redirect('/services/');
        })
        .catch(err => { 
            winston.error('F: '+err);
            throw err });
});

services.post('/createPreset', function (req, res) {
    state.createPreset(req.body.name)
        .then(function () {
            res.redirect('/services/')
        })
        .catch(err => { 
            winston.error('G: '+err);
            throw err });
});

//
//

// services.post('/createDemoFile', function (req, res) {
//     createDemoFile(req.body.name)
//         .then(function () {
//             res.redirect('/services/');
//         })
//         .catch(err => { 
//             winston.error('H: '+err);
//             throw err });
// });

services.post('/cleanupState', function (req, res) {
    state.cleanup()
        .then(function () {
            res.redirect('/services/');
        })
        .catch(err => { 
            winston.error('J: '+err);
            throw err });
});

async function splitRoutes(routes, sessionId) {
    var res = {};
    try {
        for (var key in routes) {
            if (routes.hasOwnProperty(key)) {
                let [newRoute, method] = key.split(/\/(GET|POST)$/);
                res[newRoute] = res[newRoute] || {};
                res[newRoute][method] = {
                    stubs: routes[key],
                    active: await state.getActiveStub(key, sessionId)
                };
            }
        }
    } catch(err) {
        winston.error('H: '+err);
    }
    return res;
}

export default services;
