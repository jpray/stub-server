'use strict';

var _slicedToArray = require('babel-runtime/helpers/sliced-to-array')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _stateJs = require('../state.js');

var _stateJs2 = _interopRequireDefault(_stateJs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _libUtilities = require('../lib/utilities');

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _libCreateDemoFile = require('../lib/create-demo-file');

var _libCreateDemoFile2 = _interopRequireDefault(_libCreateDemoFile);

var services = (0, _express2['default'])();
/* set view path and renderer  */
services.set('view engine', 'jade');
services.set('views', _path2['default'].join(__dirname, '../views/'));

services.get('/', function (req, res) {
    (function callee$1$0() {
        var routes, presets, environments, activeEnvironment, activePreset, saveRemoteStubsAs, isRecording;
        return _regeneratorRuntime.async(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.next = 2;
                    return _regeneratorRuntime.awrap(_stateJs2['default'].getRoutes());

                case 2:
                    routes = context$2$0.sent;
                    context$2$0.next = 5;
                    return _regeneratorRuntime.awrap(_stateJs2['default'].getPresets());

                case 5:
                    presets = context$2$0.sent;
                    context$2$0.next = 8;
                    return _regeneratorRuntime.awrap(_stateJs2['default'].getEnvironments());

                case 8:
                    environments = context$2$0.sent;
                    context$2$0.next = 11;
                    return _regeneratorRuntime.awrap(_stateJs2['default'].getActiveEnvironment((0, _libUtilities.getSessionIdFromReq)(req)));

                case 11:
                    activeEnvironment = context$2$0.sent;
                    context$2$0.next = 14;
                    return _regeneratorRuntime.awrap(_stateJs2['default'].getActivePreset((0, _libUtilities.getSessionIdFromReq)(req)));

                case 14:
                    activePreset = context$2$0.sent;
                    saveRemoteStubsAs = _stateJs2['default'].saveRemoteStubsAs;
                    isRecording = _stateJs2['default'].isRecording;
                    context$2$0.next = 19;
                    return _regeneratorRuntime.awrap(splitRoutes(routes, (0, _libUtilities.getSessionIdFromReq)(req)));

                case 19:
                    routes = context$2$0.sent;

                    res.render('index', {
                        routes: routes,
                        presets: presets,
                        environments: environments,
                        activeEnvironment: activeEnvironment,
                        activePreset: activePreset,
                        saveRemoteStubsAs: saveRemoteStubsAs,
                        isRecording: isRecording
                    });

                case 21:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    })()['catch'](function (err) {
        _winston2['default'].error('A: ' + err);
        throw err;
    });
});

services.get('/setSaveRemoteStubsAs', function (req, res) {
    (function callee$1$0() {
        return _regeneratorRuntime.async(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    context$2$0.next = 2;
                    return _regeneratorRuntime.awrap(_stateJs2['default'].setSaveRemoteStubsAs(req.query.saveRemoteStubsAs, req.query.recordAction));

                case 2:
                    res.redirect('/services/');

                case 3:
                case 'end':
                    return context$2$0.stop();
            }
        }, null, this);
    })()['catch'](function (err) {
        _winston2['default'].error('B: ' + err);
        throw err;
    });
});

services.get('/setRoute', function (req, res) {
    _stateJs2['default'].setActiveStub(req.query.route, req.query.stub, (0, _libUtilities.getSessionIdFromReq)(req)).then(function () {
        res.redirect('/services/');
    })['catch'](function (err) {
        _winston2['default'].error('C: ' + err);
        throw err;
    });
});

services.get('/setPreset', function (req, res) {
    _winston2['default'].debug('****setPreset******', req.query.name, (0, _libUtilities.getSessionIdFromReq)(req));
    _stateJs2['default'].setPreset(req.query.name, (0, _libUtilities.getSessionIdFromReq)(req)).then(function () {
        res.redirect('/services/');
    })['catch'](function (err) {
        _winston2['default'].error('D: ' + err);
        throw err;
    });
});

services.get('/createUniqueSession', function (req, res) {
    var newSessionId = Math.random().toString();
    _stateJs2['default'].createBrowserSession(newSessionId);
    res.cookie('stubServerSessionId', newSessionId, { secure: false, expires: 0, httpOnly: false });
    res.send('stub-server session: ' + newSessionId);
});

services.get('/setEnvironment', function (req, res) {
    _stateJs2['default'].setEnvironment(req.query.name, (0, _libUtilities.getSessionIdFromReq)(req)).then(function () {
        res.redirect('/services/');
        services.emit('ui:restart');
    })['catch'](function (err) {
        _winston2['default'].error('E: ' + err);
        throw err;
    });
});

services.get('/reset', function (req, res) {
    _stateJs2['default'].reset().then(function () {
        res.redirect('/services/');
    })['catch'](function (err) {
        _winston2['default'].error('F: ' + err);
        throw err;
    });
});

services.post('/createPreset', function (req, res) {
    _stateJs2['default'].createPreset(req.body.name).then(function () {
        res.redirect('/services/');
    })['catch'](function (err) {
        _winston2['default'].error('G: ' + err);
        throw err;
    });
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
    _stateJs2['default'].cleanup().then(function () {
        res.redirect('/services/');
    })['catch'](function (err) {
        _winston2['default'].error('J: ' + err);
        throw err;
    });
});

function splitRoutes(routes, sessionId) {
    var res, key, _key$split, _key$split2, newRoute, method;

    return _regeneratorRuntime.async(function splitRoutes$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                res = {};
                context$1$0.prev = 1;
                context$1$0.t0 = _regeneratorRuntime.keys(routes);

            case 3:
                if ((context$1$0.t1 = context$1$0.t0()).done) {
                    context$1$0.next = 18;
                    break;
                }

                key = context$1$0.t1.value;

                if (!routes.hasOwnProperty(key)) {
                    context$1$0.next = 16;
                    break;
                }

                _key$split = key.split(/\/(GET|POST)$/);
                _key$split2 = _slicedToArray(_key$split, 2);
                newRoute = _key$split2[0];
                method = _key$split2[1];

                res[newRoute] = res[newRoute] || {};
                context$1$0.t2 = routes[key];
                context$1$0.next = 14;
                return _regeneratorRuntime.awrap(_stateJs2['default'].getActiveStub(key, sessionId));

            case 14:
                context$1$0.t3 = context$1$0.sent;
                res[newRoute][method] = {
                    stubs: context$1$0.t2,
                    active: context$1$0.t3
                };

            case 16:
                context$1$0.next = 3;
                break;

            case 18:
                context$1$0.next = 23;
                break;

            case 20:
                context$1$0.prev = 20;
                context$1$0.t4 = context$1$0['catch'](1);

                _winston2['default'].error('H: ' + context$1$0.t4);

            case 23:
                return context$1$0.abrupt('return', res);

            case 24:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this, [[1, 20]]);
}

exports['default'] = services;
module.exports = exports['default'];