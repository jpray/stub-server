/**
 * @param stubs
 * @returns {String} stubName
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
exports['default'] = pickDefaultStub;

function pickDefaultStub(stubs) {
    // some logic to select the default stub
    // first, see if there is a stub named 'default'
    // else,  see if there is a stub named '0'
    // else,  see if there is a stub named 'success'
    // else,  use the first one in the list
    var defaultNames = ['default.json', '0.json', 'success.json'];

    stubs = stubs.filter(function (fileName) {
        return fileName.indexOf('.hooks.js') === -1;
    });

    for (var i = 0; i < defaultNames.length; i++) {
        var _name = defaultNames[i];
        if (!! ~stubs.indexOf(_name)) {
            return _name;
        }
    }

    // no stub found... use the first on in the list
    return stubs[0];
}

module.exports = exports['default'];