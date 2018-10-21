'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$assign = require('babel-runtime/core-js/object/assign')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _libAsyncApply = require('./lib/async-apply');

var _libAsyncApply2 = _interopRequireDefault(_libAsyncApply);

var _libIsEmpty = require('./lib/is-empty');

var _libIsEmpty2 = _interopRequireDefault(_libIsEmpty);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _libConstants = require('./lib/constants');

var _libGetRoutes = require('./lib/get-routes');

var _libGetRoutes2 = _interopRequireDefault(_libGetRoutes);

var _libPickDefaultStub = require('./lib/pick-default-stub');

var _libPickDefaultStub2 = _interopRequireDefault(_libPickDefaultStub);

var _libUtilities = require('./lib/utilities');

var _libSaveRemoteStub = require('./lib/save-remote-stub');

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

var cwd = _shelljs2['default'].pwd().stdout;

require("babel-register")({
    // // Ignore can also be specified as a function.
    ignore: function ignore(filename) {
        //console.log('babel-register checking out: '+filename)
        var doIgnore = filename.indexOf('.hooks.js') === -1;
        // if (!doIgnore) {
        //     console.log('babel-register processing: '+filename)
        // }
        return doIgnore;
    }
});

var DEFAULT_ENVIRONMENT = 'local.json';
var DEFAULT_SAVE_REMOTE_STUBS_AS = '';
var defaultWildCardPatterns = [['^([a-zA-Z0-9]*-[a-zA-Z0-9]*){4}$', 'CUSTOMER_ID'], //customerId - has 4 hypens
['^[a-zA-Z0-9]{40,}$', 'AGREEMENT_ID'] //agreementId - greater than 40 characters
];

var state = {
    routes: {},
    presets: {},
    environments: {},
    wildcardPatterns: defaultWildCardPatterns, //has 4 hyphens

    activeStubs: {},
    activePreset: '',
    activeEnvironment: DEFAULT_ENVIRONMENT
};

var sessionState = {
    sessionId: 'DEFAULT',
    saveRemoteStubsAs: '',
    isRecording: false,
    recordedStubs: [],
    sessions: {}
};

function getTargetState(sessionId) {
    _winston2['default'].debug('getting targetState for sessionId: ' + sessionId);
    var targetState = sessionId ? sessionState.sessions[sessionId] : state;
    _winston2['default'].debug('targetState: ' + targetState);
    return targetState;
}

function initSession(sessionId) {
    sessionState.sessions[sessionId] = {
        activeStubs: _Object$assign({}, state.activeStubs),
        activePreset: _Object$assign({}, state.activePreset),
        activeEnvironment: _Object$assign({}, state.activeEnvironment)
    };
    _winston2['default'].info('new browser session created: ' + sessionId);
}

/**
 * @callback nodeCallback
 * @param error
 * @param result
 */

var State = (function () {
    function State() {
        _classCallCheck(this, State);
    }

    _createClass(State, [{
        key: 'setSaveRemoteStubsAs',

        // /**
        //  * @method wildcardPattern
        //  * @param name
        //  */
        // async setWildcardPattern(name) {
        //     state.wildcardPattern = name || DEFAULT_WILDCARD_PATTERN;
        //     await this.saveState();
        // }

        /**
         * @method setPreset
         * @param name
         */
        value: function setSaveRemoteStubsAs(name, recordAction) {
            return _regeneratorRuntime.async(function setSaveRemoteStubsAs$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        name = name.trim();
                        sessionState.isRecording = recordAction === 'record';
                        sessionState.saveRemoteStubsAs = name || DEFAULT_SAVE_REMOTE_STUBS_AS;

                        if (sessionState.isRecording) {
                            _winston2['default'].info('Starting to record service responses for new preset...');
                        } else {
                            _winston2['default'].info('Done recording service responses for new preset...');
                        }

                        if (!(!sessionState.isRecording && sessionState.recordedStubs.length > 0)) {
                            context$2$0.next = 7;
                            break;
                        }

                        context$2$0.next = 7;
                        return _regeneratorRuntime.awrap(this.savePreset());

                    case 7:
                        context$2$0.next = 9;
                        return _regeneratorRuntime.awrap(this.saveState());

                    case 9:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: 'createBrowserSession',
        value: function createBrowserSession(id) {
            return _regeneratorRuntime.async(function createBrowserSession$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        initSession(id);

                    case 1:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * ensures that all required paths exist
         */
    }, {
        key: 'ensurePaths',
        value: function ensurePaths() {
            return _regeneratorRuntime.async(function ensurePaths$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.next = 2;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_mkdirp2['default'], _libConstants.PRESET_PATH));

                    case 2:
                        context$2$0.next = 4;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_mkdirp2['default'], _libConstants.ENVIRONMENT_PATH));

                    case 4:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * gets all routes in the stub directory
         * @method getRoutes
         * @param {Boolean} reload
         */
    }, {
        key: 'getRoutes',
        value: function getRoutes(reload) {
            return _regeneratorRuntime.async(function getRoutes$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (!((0, _libIsEmpty2['default'])(state.routes) || reload === true)) {
                            context$2$0.next = 4;
                            break;
                        }

                        context$2$0.next = 3;
                        return _regeneratorRuntime.awrap((0, _libGetRoutes2['default'])());

                    case 3:
                        state.routes = context$2$0.sent;

                    case 4:
                        return context$2$0.abrupt('return', state.routes);

                    case 5:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * gets all presets in the presets directory
         */
    }, {
        key: 'getPresets',
        value: function getPresets() {
            var files, presets, i, file;
            return _regeneratorRuntime.async(function getPresets$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.next = 2;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_fs2['default'].readdir, _libConstants.PRESET_PATH));

                    case 2:
                        files = context$2$0.sent;
                        presets = {};
                        i = 0;

                    case 5:
                        if (!(i < files.length)) {
                            context$2$0.next = 15;
                            break;
                        }

                        if (!(files[i][0] === '.')) {
                            context$2$0.next = 8;
                            break;
                        }

                        return context$2$0.abrupt('continue', 12);

                    case 8:
                        context$2$0.next = 10;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_fs2['default'].readFile, _path2['default'].join(_libConstants.PRESET_PATH, files[i])));

                    case 10:
                        file = context$2$0.sent;

                        if (file) {
                            presets[files[i]] = JSON.parse(file.toString());
                        }

                    case 12:
                        i++;
                        context$2$0.next = 5;
                        break;

                    case 15:
                        return context$2$0.abrupt('return', state.presets = presets);

                    case 16:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * gets all environments in the environments directory
         */
    }, {
        key: 'getEnvironments',
        value: function getEnvironments() {
            var files, environments, i, file;
            return _regeneratorRuntime.async(function getEnvironments$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.next = 2;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_fs2['default'].readdir, _libConstants.ENVIRONMENT_PATH));

                    case 2:
                        files = context$2$0.sent;
                        environments = {};
                        i = 0;

                    case 5:
                        if (!(i < files.length)) {
                            context$2$0.next = 15;
                            break;
                        }

                        if (!(files[i][0] === '.')) {
                            context$2$0.next = 8;
                            break;
                        }

                        return context$2$0.abrupt('continue', 12);

                    case 8:
                        context$2$0.next = 10;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_fs2['default'].readFile, _path2['default'].join(_libConstants.ENVIRONMENT_PATH, files[i])));

                    case 10:
                        file = context$2$0.sent;

                        environments[files[i]] = JSON.parse(file.toString());

                    case 12:
                        i++;
                        context$2$0.next = 5;
                        break;

                    case 15:

                        //default if no environments are defined
                        if (!environments[DEFAULT_ENVIRONMENT]) {
                            environments[DEFAULT_ENVIRONMENT] = [];
                        }

                        // environments.sort(function(a,b){
                        //     return sortOrder.indexOf(a) - sortOrder.indexOf(b);
                        // })
                        return context$2$0.abrupt('return', state.environments = environments);

                    case 17:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method getStub
         * @param url
         * @param method
         */
    }, {
        key: 'getStub',
        value: function getStub(url, method, req) {
            var route, active, json, res, hooks, newActive;
            return _regeneratorRuntime.async(function getStub$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        route = [url, method].join('/');

                        route = (0, _libUtilities.applyWildcards)(route, state.wildcardPatterns);
                        context$2$0.prev = 2;
                        context$2$0.next = 5;
                        return _regeneratorRuntime.awrap(this.getActiveStub(route, (0, _libUtilities.getSessionIdFromReq)(req)));

                    case 5:
                        active = context$2$0.sent;
                        context$2$0.next = 12;
                        break;

                    case 8:
                        context$2$0.prev = 8;
                        context$2$0.t0 = context$2$0['catch'](2);

                        _winston2['default'].error('unable to determine active stub for route: ' + route);
                        _winston2['default'].error(context$2$0.t0);

                    case 12:
                        context$2$0.next = 14;
                        return _regeneratorRuntime.awrap(this.getActiveHooks(route, active));

                    case 14:
                        hooks = context$2$0.sent;

                        if (hooks.chooseStub) {
                            newActive = hooks.chooseStub((0, _libUtilities.processDemoRequestArg)(req));

                            active = newActive || active;
                        }

                        active = (0, _libUtilities.ensureJSONExtension)(active);

                        context$2$0.prev = 17;
                        context$2$0.next = 20;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_fs2['default'].readFile, _path2['default'].join(_libConstants.STUB_PATH, route, active)));

                    case 20:
                        json = context$2$0.sent;

                        res = JSON.parse(json.toString());
                        context$2$0.next = 28;
                        break;

                    case 24:
                        context$2$0.prev = 24;
                        context$2$0.t1 = context$2$0['catch'](17);

                        _winston2['default'].error('unable to read stub for route: ' + route);
                        _winston2['default'].debug(context$2$0.t1);

                    case 28:

                        if (hooks.processStub) {
                            res = hooks.processStub(res);
                        }

                        return context$2$0.abrupt('return', res);

                    case 30:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this, [[2, 8], [17, 24]]);
        }

        /**
         * @method getActiveStub
         * @param route
         */
    }, {
        key: 'getActiveStub',
        value: function getActiveStub(route, sessionId) {
            var targetState, stubName, routes, defaultStub;
            return _regeneratorRuntime.async(function getActiveStub$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        targetState = getTargetState(sessionId);

                        if (!targetState.activeStubs[route]) {
                            context$2$0.next = 5;
                            break;
                        }

                        stubName = targetState.activeStubs[route];
                        context$2$0.next = 15;
                        break;

                    case 5:
                        context$2$0.next = 7;
                        return _regeneratorRuntime.awrap(this.getRoutes(false));

                    case 7:
                        routes = context$2$0.sent;

                        if (routes[route]) {
                            context$2$0.next = 10;
                            break;
                        }

                        throw new Error('Route ' + route + ' not found');

                    case 10:
                        defaultStub = (0, _libPickDefaultStub2['default'])(routes[route]);

                        _winston2['default'].warn('No active stub defined for route: ' + route + '; Choosing default: ' + defaultStub);
                        context$2$0.next = 14;
                        return _regeneratorRuntime.awrap(this.setActiveStub(route, defaultStub));

                    case 14:
                        stubName = state.activeStubs[route];

                    case 15:
                        return context$2$0.abrupt('return', stubName);

                    case 16:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }
    }, {
        key: 'getActiveHooks',
        value: function getActiveHooks(route, active) {
            var hooksFilePath, hooksModulePath, hooksObject;
            return _regeneratorRuntime.async(function getActiveHooks$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        if (active) {
                            context$2$0.next = 2;
                            break;
                        }

                        return context$2$0.abrupt('return', {});

                    case 2:
                        hooksFilePath = _path2['default'].join(_libConstants.STUB_PATH, route, active.replace('.json', '.hooks.js'));
                        hooksModulePath = _path2['default'].join(cwd, _libConstants.STUB_PATH, route, active.replace('.json', '.hooks.js'));
                        context$2$0.prev = 4;
                        context$2$0.next = 7;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_fs2['default'].access, hooksFilePath));

                    case 7:
                        context$2$0.next = 13;
                        break;

                    case 9:
                        context$2$0.prev = 9;
                        context$2$0.t0 = context$2$0['catch'](4);

                        //normal to end up here if hooks file isn't defined
                        if (context$2$0.t0.code !== 'ENOENT') {
                            _winston2['default'].error('unable read hooks file for route: ' + route);
                            _winston2['default'].debug(context$2$0.t0);
                        }
                        return context$2$0.abrupt('return', {});

                    case 13:

                        try {
                            // we have a file: load it
                            //hooksObject = require(hooksPath);
                            //console.log(cwd);
                            //console.log(hooksModulePath);
                            hooksObject = require(hooksModulePath);
                            //console.log('printing hooksObject');
                            //console.log(hooksObject);
                        } catch (e) {
                            _winston2['default'].error('unable to load hooks module for route: ' + route);
                            _winston2['default'].debug(e);
                        }
                        return context$2$0.abrupt('return', hooksObject);

                    case 15:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this, [[4, 9]]);
        }

        /**
         * @method getDefaultStub
         * @param route
         */
    }, {
        key: 'getDefaultStub',
        value: function getDefaultStub(route) {
            var routes;
            return _regeneratorRuntime.async(function getDefaultStub$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.next = 2;
                        return _regeneratorRuntime.awrap(this.getRoutes(false));

                    case 2:
                        routes = context$2$0.sent;

                        if (routes[route]) {
                            context$2$0.next = 5;
                            break;
                        }

                        throw new Error('Route ' + route + ' not found');

                    case 5:
                        return context$2$0.abrupt('return', (0, _libPickDefaultStub2['default'])(routes[route]));

                    case 6:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method getActivePreset
         * @param route
         */
    }, {
        key: 'getActivePreset',
        value: function getActivePreset(sessionId) {
            return _regeneratorRuntime.async(function getActivePreset$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        return context$2$0.abrupt('return', sessionState.sessions[sessionId] ? sessionState.sessions[sessionId].activePreset : state.activePreset);

                    case 1:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method getActiveEnvironment
         * @param route
         */
    }, {
        key: 'getActiveEnvironment',
        value: function getActiveEnvironment(sessionId) {
            return _regeneratorRuntime.async(function getActiveEnvironment$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        return context$2$0.abrupt('return', sessionState.sessions[sessionId] ? sessionState.sessions[sessionId].activeEnvironment : state.activeEnvironment);

                    case 1:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method getActiveEnvironmentConfig
         * @param route
         */
    }, {
        key: 'getActiveEnvironmentConfig',
        value: function getActiveEnvironmentConfig() {
            return _regeneratorRuntime.async(function getActiveEnvironmentConfig$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.next = 2;
                        return _regeneratorRuntime.awrap(this.getEnvironments());

                    case 2:
                        return context$2$0.abrupt('return', state.environments[state.activeEnvironment]);

                    case 3:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method loadState
         */
    }, {
        key: 'loadState',
        value: function loadState() {
            var json;
            return _regeneratorRuntime.async(function loadState$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.prev = 0;
                        context$2$0.next = 3;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_fs2['default'].readFile, _libConstants.STATE_PATH));

                    case 3:
                        json = context$2$0.sent;

                        (0, _extend2['default'])(state, JSON.parse(json));
                        state.activeEnvironment = (0, _libUtilities.ensureJSONExtension)(state.activeEnvironment);

                        if (state.wildcardPatterns) {
                            context$2$0.next = 10;
                            break;
                        }

                        state.wildcardPatterns = defaultWildCardPatterns;
                        context$2$0.next = 10;
                        return _regeneratorRuntime.awrap(this.saveState());

                    case 10:
                        return context$2$0.abrupt('return', state);

                    case 13:
                        context$2$0.prev = 13;
                        context$2$0.t0 = context$2$0['catch'](0);

                        _winston2['default'].info('stub-server: no state file found, initializing a new one...');
                        context$2$0.next = 18;
                        return _regeneratorRuntime.awrap(this.saveState());

                    case 18:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this, [[0, 13]]);
        }

        /**
         * @method saveState
         */
    }, {
        key: 'saveState',
        value: function saveState() {
            var json;
            return _regeneratorRuntime.async(function saveState$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        json = JSON.stringify({
                            activeStubs: state.activeStubs,
                            activePreset: state.activePreset,
                            activeEnvironment: state.activeEnvironment,
                            //saveRemoteStubsAs: state.saveRemoteStubsAs,
                            wildcardPatterns: state.wildcardPatterns
                        }, null, 4);
                        context$2$0.next = 3;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_fs2['default'].writeFile, _libConstants.STATE_PATH, json));

                    case 3:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method saveState
         */
    }, {
        key: 'savePreset',
        value: function savePreset() {
            var presetName;
            return _regeneratorRuntime.async(function savePreset$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        presetName = (0, _libUtilities.ensureJSONExtension)(sessionState.saveRemoteStubsAs);

                        _winston2['default'].info('Saving Preset: ' + presetName);
                        _winston2['default'].info(sessionState.recordedStubs);
                        sessionState.recordedStubs.forEach((function (stubData) {
                            (0, _libSaveRemoteStub.writeStub)(stubData.stubPath, stubData.responseString);
                            state.activeStubs[stubData.stubRootPath] = stubData.stubName;
                        }).bind(this));
                        sessionState.recordedStubs = [];
                        sessionState.saveRemoteStubsAs = '';
                        context$2$0.next = 8;
                        return _regeneratorRuntime.awrap(this.createPreset(presetName));

                    case 8:
                        context$2$0.next = 10;
                        return _regeneratorRuntime.awrap(this.setPreset(presetName));

                    case 10:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method createPreset
         * @param name
         */
    }, {
        key: 'createPreset',
        value: function createPreset(name, stubs) {
            var dest, config;
            return _regeneratorRuntime.async(function createPreset$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        dest = _path2['default'].join(_libConstants.PRESET_PATH, (0, _libUtilities.ensureJSONExtension)(name));
                        config = stubs || state.activeStubs;
                        context$2$0.next = 4;
                        return _regeneratorRuntime.awrap((0, _libAsyncApply2['default'])(_fs2['default'].writeFile, dest, JSON.stringify(config, null, 4)));

                    case 4:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method setPreset
         * @param name
         */
    }, {
        key: 'setPreset',
        value: function setPreset(name, sessionId) {
            var targetState;
            return _regeneratorRuntime.async(function setPreset$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        _winston2['default'].info('setPreset: ' + name);
                        targetState = getTargetState(sessionId);

                        targetState.activePreset = (0, _libUtilities.ensureJSONExtension)(name);
                        if (state.presets[targetState.activePreset]) {
                            // extend the current state
                            // in the future, presets should be diffs of the defaults
                            _Object$assign(targetState.activeStubs, state.presets[targetState.activePreset]);
                        }

                        if (sessionId) {
                            context$2$0.next = 7;
                            break;
                        }

                        context$2$0.next = 7;
                        return _regeneratorRuntime.awrap(this.saveState());

                    case 7:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method setEnvironment
         * @param name
         */
    }, {
        key: 'setEnvironment',
        value: function setEnvironment(name, sessionId) {
            var targetState;
            return _regeneratorRuntime.async(function setEnvironment$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        _winston2['default'].info('setEnvironment: ' + name);
                        targetState = getTargetState(sessionId);

                        targetState.activeEnvironment = (0, _libUtilities.ensureJSONExtension)(name);

                        if (sessionId) {
                            context$2$0.next = 6;
                            break;
                        }

                        context$2$0.next = 6;
                        return _regeneratorRuntime.awrap(this.saveState());

                    case 6:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method setActiveStub
         * @param route
         * @param stub
         */
    }, {
        key: 'setActiveStub',
        value: function setActiveStub(route, stub, sessionId) {
            var targetState;
            return _regeneratorRuntime.async(function setActiveStub$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        targetState = getTargetState(sessionId);

                        route = (0, _libUtilities.applyWildcards)(route, state.wildcardPatterns);

                        targetState.activeStubs[route] = stub;
                        targetState.activePreset = '';

                        if (sessionId) {
                            context$2$0.next = 7;
                            break;
                        }

                        context$2$0.next = 7;
                        return _regeneratorRuntime.awrap(this.saveState());

                    case 7:
                        return context$2$0.abrupt('return', targetState.activeStubs[route]);

                    case 8:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method reset
         */
    }, {
        key: 'reset',
        value: function reset() {
            return _regeneratorRuntime.async(function reset$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        context$2$0.next = 2;
                        return _regeneratorRuntime.awrap(this.setPreset(null));

                    case 2:
                        context$2$0.next = 4;
                        return _regeneratorRuntime.awrap(this.setEnvironment(DEFAULT_ENVIRONMENT));

                    case 4:
                        state.activeStubs = {};
                        state.saveRemoteStubsAs = DEFAULT_SAVE_REMOTE_STUB_AS;
                        state.wildcardPatterns = defaultWildCardPatterns;
                        context$2$0.next = 9;
                        return _regeneratorRuntime.awrap(this.saveState());

                    case 9:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        /**
         * @method cleanup (clean up state and presets of invalid route/stub info)
         */
    }, {
        key: 'cleanup',
        value: function cleanup() {
            var routes, routeKeys, filePath, folderPath, activeStub, numCleaned, numInPresetCleaned, route, presetKey, route2;
            return _regeneratorRuntime.async(function cleanup$(context$2$0) {
                while (1) switch (context$2$0.prev = context$2$0.next) {
                    case 0:
                        _winston2['default'].info('running cleanup script...');
                        routes = this.getRoutes(true);
                        routeKeys = _Object$keys(routes);
                        filePath = undefined;
                        folderPath = undefined;
                        activeStub = undefined;
                        numCleaned = 0;
                        numInPresetCleaned = 0;

                        //clean state.json
                        for (route in state.activeStubs) {
                            activeStub = state.activeStubs[route];
                            if (!activeStub || !_fs2['default'].existsSync(_path2['default'].join(_libConstants.STUB_PATH, route, activeStub))) {
                                _winston2['default'].warn('state contains reference to stub file that no longer exists, cleaning...\n                removing ' + filePath + ' from state.json');
                                delete state.activeStubs[route];
                                numCleaned++;
                            }
                        }
                        context$2$0.next = 11;
                        return _regeneratorRuntime.awrap(this.saveState());

                    case 11:
                        context$2$0.next = 13;
                        return _regeneratorRuntime.awrap(this.getPresets());

                    case 13:
                        context$2$0.t0 = _regeneratorRuntime.keys(state.presets);

                    case 14:
                        if ((context$2$0.t1 = context$2$0.t0()).done) {
                            context$2$0.next = 23;
                            break;
                        }

                        presetKey = context$2$0.t1.value;

                        numInPresetCleaned = 0;
                        for (route2 in state.presets[presetKey]) {
                            filePath = _path2['default'].join(_libConstants.STUB_PATH, route2, state.presets[presetKey][route2]);
                            if (!_fs2['default'].existsSync(filePath)) {
                                // winston.warn(`preset contains reference to stub file that no longer exists, cleaning...
                                // removing ${filePath} from ${presetKey}`);
                                delete state.presets[presetKey][route2];
                                numCleaned++;
                                numInPresetCleaned++;
                            }
                        }

                        if (!(numInPresetCleaned > 0)) {
                            context$2$0.next = 21;
                            break;
                        }

                        context$2$0.next = 21;
                        return _regeneratorRuntime.awrap(this.createPreset(presetKey, state.presets[presetKey]));

                    case 21:
                        context$2$0.next = 14;
                        break;

                    case 23:

                        _winston2['default'].info('cleanup complete: ' + numCleaned + ' references cleaned.');

                    case 24:
                    case 'end':
                        return context$2$0.stop();
                }
            }, null, this);
        }

        // let docs = [{}, {}, {}];
        // let promises = docs.map((doc) => db.post(doc));

        // let results = [];
        // for (let promise of promises) {
        //   results.push(await promise);
        // }
        // console.log(results);

    }, {
        key: 'addStubToRecordedStubs',
        value: function addStubToRecordedStubs(stubPath, stubRootPath, stubName, responseString) {
            sessionState.recordedStubs.push({
                stubPath: stubPath,
                stubRootPath: stubRootPath,
                stubName: stubName,
                responseString: responseString
            });
        }
    }, {
        key: 'isRecording',

        /**
         * gets saveRemoveResponses option
         */
        get: function get() {
            return sessionState.isRecording;
        }

        /**
         * gets saveRemoveResponses option
         */
    }, {
        key: 'saveRemoteStubsAs',
        get: function get() {
            return sessionState.saveRemoteStubsAs;
        }

        /**
         * gets wildcardPattern option
         */
    }, {
        key: 'wildcardPatterns',
        get: function get() {
            return state.wildcardPatterns;
        }
    }, {
        key: 'activeStubs',
        get: function get() {
            return state.activeStubs;
        }
    }]);

    return State;
})();

exports['default'] = new State();
module.exports = exports['default'];

//avoid hanging issue caused by .DS_Store files on mac machines

//var sortOrder = ['local','unit','intg','accp'];

//avoid hanging issue caused by .DS_Store files on mac machines

// no stub has been selected
// select the first stub and set it

//var exists = fs.existsSync(hooksPath);
//console.log('exists: '+exists);

// if (!state.saveRemoteStubsAs) {
//     state.saveRemoteStubsAs = DEFAULT_SAVE_REMOTE_STUB_AS;
//     await this.saveState();
// }
// Object.keys(sessionState).forEach(function(key){
//     state[key] = sessionState[key];
// })

// Object.keys(sessionState).forEach(function(key){
//     state[key] = sessionState[key];
// })

//clean presets