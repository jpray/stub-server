import state from '../state';
import mkpath from 'mkpath';
import winston from 'winston';
import fs from 'fs';
import {STUB_PATH} from './constants';
import apply from './async-apply';
import path from 'path';
import {ensureJSONExtension} from './utilities';
import stringify from 'node-stringify';


const topComment = `
/***********************************************************************************
WARNING: Do not modify this file directly.  Your changes will be overwritten.
         This file is built using stub-server.  Make all changes in the source.
         See https://github.com/jpray/stub-server for more info.
************************************************************************************/
`;


async function getStubContent(k, name) {
	let content = await apply(fs.readFile, path.join(STUB_PATH, k, ensureJSONExtension(name)));
	content = content.toString().trim();
	if (!content) {
		return content;
	}
	try {
		return JSON.parse(content);
	} catch(e) {
		winston.warn('error parsing json for route/stub: '+k+'/'+name);
		return content;
	}
}

async function getDemoFileContents() {
	let stubsObj = {};

	await Promise.all(Object.keys(state.activeStubs).map(async (k) => {
		//let stub = await state.getDefaultStub(k);
		let stub = await state.getActiveStub(k);
		stubsObj[k] = {
			default: stub.replace('.json', ''),
			stubs: {}
		};
		stubsObj[k].stubs[stubsObj[k].default] = await getStubContent(k, stub);
		let hooks = await state.getActiveHooks(k, stub);

		if (hooks && (hooks.chooseStub || hooks.processStub)) {
			stubsObj[k].hooks = {
				chooseStub: stringify(hooks.chooseStub),
				processStub: stringify(hooks.processStub)
			}
		}

		if (hooks.stubsForDemo && hooks.stubsForDemo.length > 0) {
			await Promise.all(hooks.stubsForDemo.map(async (additionalStub) => {
				stubsObj[k].stubs[additionalStub] = await getStubContent(k, additionalStub);
			})).catch((e)=> {
				winston.error(e);
			});
		}

	})).catch((e)=> {
		winston.error('Error building demo stubs');
		winston.error(e);
	});

	winston.info('writing demo config');
	//return `export let stubs = ${JSON.stringify(stubsObj, null, 4)};`;
	return `${topComment}
import {setup} from './common/setup.js';
let demoConfig = ${JSON.stringify(stubsObj)}
setup(demoConfig);
`;
}


export default async function createDemoFile(name, destPath) {

	if (!name) {
		winston.error('No demo name was specified.  Demo name must match a stub server preset.');
		return;
	}

	if (!destPath) {
		winston.error('No destination file path was specified.  Aborting.')
		return;
	}

	await state.loadState();
	await state.setPreset(name);

	return new Promise(function(resolve, reject) {

	    mkpath('./server/demo-files', function (err) {
	        if (err) throw err;
	        getDemoFileContents().then(function(contents) {
		    	//fs.writeFile('./server/demo-files/'+ name + '.js', contents,function(err){
			    fs.writeFile(destPath, contents,function(err){
			        if (err) {
			            winston.error('Error writing demo file to disk. Error:'+err);
			        } else {
			            winston.debug('Demo file written to disk.');
			        }
		        })
				// Object.keys(state.activeStubs).forEach(function(k) {
				// 	console.log(k);
				// 	console.log(state.activeStubs[k]);
				// })
				resolve(true);
		    });

	    })
	});
}
