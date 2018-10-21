"use strict";

var _Promise = require("babel-runtime/core-js/promise")["default"];

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports["default"] = asyncApply;

function asyncApply(fn /*, args...*/) {
    var args = Array.prototype.slice.call(arguments, 1);
    return new _Promise(function (resolve, reject) {
        args.push(function (err, res) {
            if (err) {
                return reject(err);
            }
            return resolve(res);
        });

        fn.apply(null, args);
    });
}

module.exports = exports["default"];