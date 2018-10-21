import apply from './lib/async-apply';
import isEmpty from './lib/is-empty';
import extend from 'extend';
import path from 'path';
import mkdirp from 'mkdirp';
import fs from 'fs';
import {
    STUB_PATH,
    STATE_PATH,
    PRESET_PATH,
    ENVIRONMENT_PATH
    } from './lib/constants';

import getRoutes from './lib/get-routes';
import pickDefaultStub from './lib/pick-default-stub';
import {applyWildcards, 
        ensureJSONExtension, 
        getSessionIdFromReq, 
        processDemoRequestArg} from './lib/utilities';
import {writeStub} from './lib/save-remote-stub';
import winston from 'winston';
import sh from 'shelljs';

var cwd = sh.pwd().stdout;

require("babel-register")({
  // // Ignore can also be specified as a function.
  ignore: function(filename) {
    //console.log('babel-register checking out: '+filename)
    var doIgnore = filename.indexOf('.hooks.js') === -1;
    // if (!doIgnore) {
    //     console.log('babel-register processing: '+filename)
    // }
    return doIgnore;
  }
});

const DEFAULT_ENVIRONMENT = 'local.json';
const DEFAULT_SAVE_REMOTE_STUBS_AS = '';
const defaultWildCardPatterns = [
    ['^([a-zA-Z0-9]*-[a-zA-Z0-9]*){4}$', 'CUSTOMER_ID'], //customerId - has 4 hypens
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
}

function getTargetState(sessionId) {
    winston.debug('getting targetState for sessionId: '+sessionId);
    var targetState = sessionId ? sessionState.sessions[sessionId] : state;
    winston.debug('targetState: '+targetState);
    return targetState;
}

function initSession(sessionId) {
    sessionState.sessions[sessionId] = {
        activeStubs: Object.assign({}, state.activeStubs),
        activePreset: Object.assign({}, state.activePreset),
        activeEnvironment: Object.assign({}, state.activeEnvironment)
    };
    winston.info('new browser session created: ' + sessionId);
}

/**
 * @callback nodeCallback
 * @param error
 * @param result
 */

class State {

    /**
     * gets saveRemoveResponses option
     */
    get isRecording(){
        return sessionState.isRecording;
    }

    /**
     * gets saveRemoveResponses option
     */
    get saveRemoteStubsAs(){
        return sessionState.saveRemoteStubsAs;
    }

    /**
     * gets wildcardPattern option
     */
    get wildcardPatterns(){
        return state.wildcardPatterns;
    }

    get activeStubs() {
        return state.activeStubs;
    }

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
    async setSaveRemoteStubsAs(name, recordAction) {
        name = name.trim();
        sessionState.isRecording = recordAction === 'record';
        sessionState.saveRemoteStubsAs = name || DEFAULT_SAVE_REMOTE_STUBS_AS;

        if (sessionState.isRecording) {
            winston.info('Starting to record service responses for new preset...');
        } else {
            winston.info('Done recording service responses for new preset...');
        }

        if (!sessionState.isRecording && sessionState.recordedStubs.length > 0) {
            await this.savePreset();
        } 

        await this.saveState();
    }

    async createBrowserSession(id) {
        initSession(id);
    }

    /**
     * ensures that all required paths exist
     */
    async ensurePaths() {
        await apply(mkdirp, PRESET_PATH);
        await apply(mkdirp, ENVIRONMENT_PATH);
    }

    /**
     * gets all routes in the stub directory
     * @method getRoutes
     * @param {Boolean} reload
     */
    async getRoutes(reload) {
        if (isEmpty(state.routes) || reload === true) {
            state.routes = await getRoutes();
        }
        return state.routes;
    }

    /**
     * gets all presets in the presets directory
     */
    async getPresets() {
        var files = await apply(fs.readdir, PRESET_PATH);
        var presets = {};
        for (var i=0; i < files.length; i++) {
            if (files[i][0] === '.') {
                //avoid hanging issue caused by .DS_Store files on mac machines
                continue;
            }
            let file = await apply(fs.readFile, path.join(PRESET_PATH, files[i]));
            if (file) {
                presets[files[i]] = JSON.parse(file.toString());
            }
        }
        return state.presets = presets;
    }

    /**
     * gets all environments in the environments directory
     */
    async getEnvironments() {
        var files = await apply(fs.readdir, ENVIRONMENT_PATH);
        var environments = {};
        //var sortOrder = ['local','unit','intg','accp'];
        for (var i=0; i < files.length; i++) {
            if (files[i][0] === '.') {
                //avoid hanging issue caused by .DS_Store files on mac machines
                continue;
            }
            let file = await apply(fs.readFile, path.join(ENVIRONMENT_PATH, files[i]));
            environments[files[i]] = JSON.parse(file.toString());
        }

        //default if no environments are defined
        if (!environments[DEFAULT_ENVIRONMENT]) {
            environments[DEFAULT_ENVIRONMENT] = [];
        }

        // environments.sort(function(a,b){
        //     return sortOrder.indexOf(a) - sortOrder.indexOf(b);
        // })
        return state.environments = environments;
    }

    /**
     * @method getStub
     * @param url
     * @param method
     */
    async getStub(url, method, req) {
        var route = [url, method].join('/');

        route = applyWildcards(route, state.wildcardPatterns);
        var active;
        var json;
        var res;
        var hooks;

        try {
            active = await this.getActiveStub(route, getSessionIdFromReq(req));
        } catch(e) {
            winston.error('unable to determine active stub for route: '+route);
            winston.error(e);
        }
        hooks = await this.getActiveHooks(route, active);
        if (hooks.chooseStub) {
            let newActive = hooks.chooseStub(processDemoRequestArg(req));
            active = newActive || active;   
        }

        active = ensureJSONExtension(active);

        try {
            json = await apply(fs.readFile, path.join(STUB_PATH, route, active));
            res = JSON.parse(json.toString());
        } catch(e) {
            winston.error('unable to read stub for route: '+route);
            winston.debug(e);
        }

        if (hooks.processStub) {
            res = hooks.processStub(res);
        }

        return res;
    }

    /**
     * @method getActiveStub
     * @param route
     */
    async getActiveStub(route, sessionId) {
        var targetState = getTargetState(sessionId);
        var stubName;

        if (targetState.activeStubs[route]) {
            stubName = targetState.activeStubs[route];
        } else {
            // no stub has been selected
            // select the first stub and set it
            let routes = await this.getRoutes(false);

            if (!routes[route]) {
                throw new Error(`Route ${route} not found`);
            }
            let defaultStub = pickDefaultStub(routes[route]);
            winston.warn(`No active stub defined for route: ${route}; Choosing default: ${defaultStub}`);
            await this.setActiveStub(route, defaultStub);
            stubName = state.activeStubs[route];
        }
        return stubName;
    }

    async getActiveHooks(route, active) {
        if (!active) return {}
        var hooksFilePath = path.join(STUB_PATH, route, active.replace('.json', '.hooks.js'));
        var hooksModulePath = path.join(cwd, STUB_PATH, route, active.replace('.json', '.hooks.js'));
        var hooksObject;

        try {
            //var exists = fs.existsSync(hooksPath);
            //console.log('exists: '+exists);
            await apply(fs.access, hooksFilePath);
        } catch(e) {
            //normal to end up here if hooks file isn't defined
            if (e.code !== 'ENOENT') {
                winston.error(`unable read hooks file for route: ${route}`);
                winston.debug(e);
            }
            return {};
        }

        try {
            // we have a file: load it
            //hooksObject = require(hooksPath);
            //console.log(cwd);
            //console.log(hooksModulePath);
            hooksObject = require(hooksModulePath);
            //console.log('printing hooksObject');
            //console.log(hooksObject);

        } catch(e) {
            winston.error(`unable to load hooks module for route: ${route}`);
            winston.debug(e);
        }
        return hooksObject;
    }

    /**
     * @method getDefaultStub
     * @param route
     */
    async getDefaultStub(route) {
        var routes = await this.getRoutes(false);
        if (!routes[route]) {
            throw new Error(`Route ${route} not found`);
        }
        return pickDefaultStub(routes[route]);
    }

    /**
     * @method getActivePreset
     * @param route
     */
    async getActivePreset(sessionId) {
        return sessionState.sessions[sessionId] ?
            sessionState.sessions[sessionId].activePreset :
            state.activePreset;
    }

    /**
     * @method getActiveEnvironment
     * @param route
     */
    async getActiveEnvironment(sessionId) {
        return sessionState.sessions[sessionId] ?
            sessionState.sessions[sessionId].activeEnvironment :
            state.activeEnvironment;
    }

    /**
     * @method getActiveEnvironmentConfig
     * @param route
     */
    async getActiveEnvironmentConfig() {
        await this.getEnvironments();
        return state.environments[state.activeEnvironment];
    }

    /**
     * @method loadState
     */
    async loadState() {
        try {
            var json = await apply(fs.readFile, STATE_PATH);
            extend(state, JSON.parse(json));
            state.activeEnvironment = ensureJSONExtension(state.activeEnvironment);
            if (!state.wildcardPatterns) {
                state.wildcardPatterns = defaultWildCardPatterns;
                await this.saveState();
            }

            // if (!state.saveRemoteStubsAs) {
            //     state.saveRemoteStubsAs = DEFAULT_SAVE_REMOTE_STUB_AS;
            //     await this.saveState();
            // }
            // Object.keys(sessionState).forEach(function(key){
            //     state[key] = sessionState[key];
            // })

            return state;
        } catch (e) {
            winston.info('stub-server: no state file found, initializing a new one...');
            await this.saveState();
        }
    }

    /**
     * @method saveState
     */
    async saveState() {
        var json = JSON.stringify({
            activeStubs: state.activeStubs,
            activePreset: state.activePreset,
            activeEnvironment: state.activeEnvironment,
            //saveRemoteStubsAs: state.saveRemoteStubsAs,
            wildcardPatterns: state.wildcardPatterns
        },null, 4);

        // Object.keys(sessionState).forEach(function(key){
        //     state[key] = sessionState[key];
        // })

        await apply(fs.writeFile, STATE_PATH, json);
    }

    /**
     * @method saveState
     */
    async savePreset() {
        var presetName = ensureJSONExtension(sessionState.saveRemoteStubsAs);
        winston.info('Saving Preset: ' + presetName);
        winston.info(sessionState.recordedStubs)
        sessionState.recordedStubs.forEach(function(stubData){
            writeStub(stubData.stubPath, stubData.responseString);
            state.activeStubs[stubData.stubRootPath] = stubData.stubName;
        }.bind(this))
        sessionState.recordedStubs = [];
        sessionState.saveRemoteStubsAs = '';
        await this.createPreset(presetName);
        await this.setPreset(presetName);
    }

    /**
     * @method createPreset
     * @param name
     */
    async createPreset(name, stubs) {
        var dest = path.join(PRESET_PATH, ensureJSONExtension(name));
        var config = stubs || state.activeStubs;
        await apply(fs.writeFile, dest, JSON.stringify(config, null, 4));
    }

    /**
     * @method setPreset
     * @param name
     */
    async setPreset(name, sessionId) {
        winston.info('setPreset: '+name);
        var targetState = getTargetState(sessionId);

        targetState.activePreset = ensureJSONExtension(name);
        if (state.presets[targetState.activePreset]) {
            // extend the current state
            // in the future, presets should be diffs of the defaults
            Object.assign(targetState.activeStubs, state.presets[targetState.activePreset]);
        }

        if (!sessionId) {
            await this.saveState();
        }
    }

    /**
     * @method setEnvironment
     * @param name
     */
    async setEnvironment(name, sessionId) {
        winston.info('setEnvironment: '+name);
        var targetState = getTargetState(sessionId);
        targetState.activeEnvironment = ensureJSONExtension(name);
        if (!sessionId) {
            await this.saveState();
        }
    }

    /**
     * @method setActiveStub
     * @param route
     * @param stub
     */
    async setActiveStub(route, stub, sessionId) {
        var targetState = getTargetState(sessionId);
        route = applyWildcards(route, state.wildcardPatterns);

        targetState.activeStubs[route] = stub;
        targetState.activePreset = '';

        if (!sessionId) {
            await this.saveState();
        }
        return targetState.activeStubs[route];
    }

    /**
     * @method reset
     */
    async reset() {
        await this.setPreset(null);
        await this.setEnvironment(DEFAULT_ENVIRONMENT);
        state.activeStubs = {};
        state.saveRemoteStubsAs = DEFAULT_SAVE_REMOTE_STUB_AS;
        state.wildcardPatterns = defaultWildCardPatterns;
        await this.saveState();
    }

    /**
     * @method cleanup (clean up state and presets of invalid route/stub info)
     */
    async cleanup() {
        winston.info('running cleanup script...');
        let routes = this.getRoutes(true);
        let routeKeys = Object.keys(routes);
        let filePath;
        let folderPath;
        let activeStub;
        let numCleaned = 0;
        let numInPresetCleaned = 0;
        //clean state.json
        for (let route in state.activeStubs) {
            activeStub = state.activeStubs[route];
            if (!activeStub || !fs.existsSync(path.join(STUB_PATH, route, activeStub))) {
                winston.warn(`state contains reference to stub file that no longer exists, cleaning...
                removing ${filePath} from state.json`);
                delete state.activeStubs[route];
                numCleaned++;
            }            
        }
        await this.saveState();
        //clean presets
        await this.getPresets();
        for (let presetKey in state.presets) {
            numInPresetCleaned = 0;
            for (let route2 in state.presets[presetKey]) {
                filePath = path.join(STUB_PATH, route2, state.presets[presetKey][route2]);
                if (!fs.existsSync(filePath)) {
                    // winston.warn(`preset contains reference to stub file that no longer exists, cleaning...
                    // removing ${filePath} from ${presetKey}`);
                    delete state.presets[presetKey][route2];
                    numCleaned++;
                    numInPresetCleaned++;
                }        
            }    
            if (numInPresetCleaned > 0) {
                await this.createPreset(presetKey, state.presets[presetKey]);
            }
        }

        winston.info(`cleanup complete: ${numCleaned} references cleaned.`);
    }

// let docs = [{}, {}, {}];
// let promises = docs.map((doc) => db.post(doc));

// let results = [];
// for (let promise of promises) {
//   results.push(await promise);
// }
// console.log(results);


    addStubToRecordedStubs(stubPath, stubRootPath, stubName, responseString) {
        sessionState.recordedStubs.push({
            stubPath: stubPath,
            stubRootPath: stubRootPath,
            stubName: stubName,
            responseString: responseString
        })
    }

}

export default new State;
