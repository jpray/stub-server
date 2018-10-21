'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = isEmpty;

function isEmpty(obj) {
    return JSON.stringify(obj) === '{}';
}

module.exports = exports['default'];