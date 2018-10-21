'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _server = require('./server');

var _server2 = _interopRequireDefault(_server);

exports['default'] = function (config) {
  (0, _server2['default'])(config);
};

module.exports = exports['default'];