import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import mkpath from 'mkpath';

import state from '../state';
import {STUB_PATH} from '../lib/constants';
import {applyWildcards, ensureJSONExtension} from './utilities';
import winston from 'winston';


export function writeStub(stubPath, responseString){
    var responseJSON;
    var directoryPath = stubPath.substring(0, stubPath.lastIndexOf('/'));

    try {
        responseJSON = JSON.parse(responseString);
    } catch(e) {
        winston.error('skipping writing server response to disk since it could not be parsed as JSON. PATH='+stubPath);
        return;
    }

    mkpath(directoryPath, function (err) {
        if (err) throw err;
        fs.writeFile(stubPath,JSON.stringify(responseJSON, null, 4),function(err){
          if (err) {
            winston.error('Error writing stub to disk: '+stubPath+' Error:'+err);
          } else {
            winston.debug('Stub written to disk:'+stubPath);
          }
        }) 
    });   
}

export function saveRemoteStub(proxyRes) {
    var responseString = '';
    var reqPath = proxyRes.req.path.substring(1); //remove first slash

    if (reqPath.indexOf('?') !== -1) {
        reqPath = reqPath.split('?')[0];
    }

    reqPath = applyWildcards(reqPath, state.wildcardPatterns);

    var method = proxyRes.req.method;
    var stubName = ensureJSONExtension(state.saveRemoteStubsAs);
    var stubRootPath = `/${reqPath}/${method}`;
    var stubPath = `${STUB_PATH}${reqPath}/${method}/${stubName}`; 
    var dataSource;

    if (proxyRes.headers['content-encoding'] === 'gzip') {
        let gunzip = zlib.createGunzip();
        proxyRes.pipe(gunzip);
        dataSource = gunzip;
    } else {
        dataSource = proxyRes;
    }

    dataSource.on('data', function(chunk){
        responseString += chunk.toString();
    }).on('end', function(){
        state.addStubToRecordedStubs(stubPath, stubRootPath, stubName, responseString);
        //writeStub(stubPath, responseString);  
    });
}
