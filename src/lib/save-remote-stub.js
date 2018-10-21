'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports.writeStub = writeStub;
exports.saveRemoteStub = saveRemoteStub;

var _zlib = require('zlib');

var _zlib2 = _interopRequireDefault(_zlib);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mkpath = require('mkpath');

var _mkpath2 = _interopRequireDefault(_mkpath);

var _state = require('../state');

var _state2 = _interopRequireDefault(_state);

var _libConstants = require('../lib/constants');

var _utilities = require('./utilities');

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

function writeStub(stubPath, responseString) {
    var responseJSON;
    var directoryPath = stubPath.substring(0, stubPath.lastIndexOf('/'));

    try {
        responseJSON = JSON.parse(responseString);
    } catch (e) {
        _winston2['default'].error('skipping writing server response to disk since it could not be parsed as JSON. PATH=' + stubPath);
        return;
    }

    (0, _mkpath2['default'])(directoryPath, function (err) {
        if (err) throw err;
        _fs2['default'].writeFile(stubPath, JSON.stringify(responseJSON, null, 4), function (err) {
            if (err) {
                _winston2['default'].error('Error writing stub to disk: ' + stubPath + ' Error:' + err);
            } else {
                _winston2['default'].debug('Stub written to disk:' + stubPath);
            }
        });
    });
}

function saveRemoteStub(proxyRes) {
    var responseString = '';
    var reqPath = proxyRes.req.path.substring(1); //remove first slash

    if (reqPath.indexOf('?') !== -1) {
        reqPath = reqPath.split('?')[0];
    }

    reqPath = (0, _utilities.applyWildcards)(reqPath, _state2['default'].wildcardPatterns);

    var method = proxyRes.req.method;
    var stubName = (0, _utilities.ensureJSONExtension)(_state2['default'].saveRemoteStubsAs);
    var stubRootPath = '/' + reqPath + '/' + method;
    var stubPath = '' + _libConstants.STUB_PATH + reqPath + '/' + method + '/' + stubName;
    var dataSource;

    if (proxyRes.headers['content-encoding'] === 'gzip') {
        var gunzip = _zlib2['default'].createGunzip();
        proxyRes.pipe(gunzip);
        dataSource = gunzip;
    } else {
        dataSource = proxyRes;
    }

    dataSource.on('data', function (chunk) {
        responseString += chunk.toString();
    }).on('end', function () {
        _state2['default'].addStubToRecordedStubs(stubPath, stubRootPath, stubName, responseString);
        //writeStub(stubPath, responseString);
    });
}