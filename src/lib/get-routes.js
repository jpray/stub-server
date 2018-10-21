'use strict';

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _asyncApply = require('./async-apply');

var _asyncApply2 = _interopRequireDefault(_asyncApply);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _extend = require('extend');

var _extend2 = _interopRequireDefault(_extend);

var _libConstants = require('../lib/constants');

var TYPES = ['GET', 'POST', 'PUT', 'DELETE'];

exports['default'] = function getRoutes(dir) {
    var files, routes, i, file;
    return _regeneratorRuntime.async(function getRoutes$(context$1$0) {
        while (1) switch (context$1$0.prev = context$1$0.next) {
            case 0:
                dir = dir || '';

                context$1$0.next = 3;
                return _regeneratorRuntime.awrap((0, _asyncApply2['default'])(_fs2['default'].readdir, _path2['default'].join(_libConstants.STUB_PATH, dir)));

            case 3:
                files = context$1$0.sent;
                routes = {};
                i = 0;

            case 6:
                if (!(i < files.length)) {
                    context$1$0.next = 24;
                    break;
                }

                file = files[i];

                if (!(file[0] === '.' || file.indexOf('.hooks.js') !== -1)) {
                    context$1$0.next = 10;
                    break;
                }

                return context$1$0.abrupt('continue', 21);

            case 10:
                if (! ~TYPES.indexOf(file.toString())) {
                    context$1$0.next = 16;
                    break;
                }

                context$1$0.next = 13;
                return _regeneratorRuntime.awrap((0, _asyncApply2['default'])(_fs2['default'].readdir, _path2['default'].join(_libConstants.STUB_PATH, dir, file)));

            case 13:
                routes[[dir, file].join('/')] = context$1$0.sent;
                context$1$0.next = 21;
                break;

            case 16:
                context$1$0.t0 = routes;
                context$1$0.next = 19;
                return _regeneratorRuntime.awrap(getRoutes([dir, file].join('/')));

            case 19:
                context$1$0.t1 = context$1$0.sent;
                (0, _extend2['default'])(context$1$0.t0, context$1$0.t1);

            case 21:
                i++;
                context$1$0.next = 6;
                break;

            case 24:
                return context$1$0.abrupt('return', routes);

            case 25:
            case 'end':
                return context$1$0.stop();
        }
    }, null, this);
};

module.exports = exports['default'];

//avoid hanging issue caused by .DS_Store files on mac machines
//ignore .hooks.js files