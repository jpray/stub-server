'use strict';

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _state = require('../state');

var _state2 = _interopRequireDefault(_state);

var _mkpath = require('mkpath');

var _mkpath2 = _interopRequireDefault(_mkpath);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _constants = require('./constants');

var _asyncApply = require('./async-apply');

var _asyncApply2 = _interopRequireDefault(_asyncApply);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _utilities = require('./utilities');

var _nodeStringify = require('node-stringify');

var _nodeStringify2 = _interopRequireDefault(_nodeStringify);

var topComment = '\n/***********************************************************************************\nWARNING: Do not modify this file directly.  Your changes will be overwritten.\n         This file is built using stub-server.  Make all changes in the source.\n         See https://github.com/jpray/stub-server for more info.\n************************************************************************************/\n';

function getStubContent(k, name) {
	var content;
	return _regeneratorRuntime.async(function getStubContent$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				context$1$0.next = 2;
				return _regeneratorRuntime.awrap((0, _asyncApply2['default'])(_fs2['default'].readFile, _path2['default'].join(_constants.STUB_PATH, k, (0, _utilities.ensureJSONExtension)(name))));

			case 2:
				content = context$1$0.sent;

				content = content.toString().trim();

				if (content) {
					context$1$0.next = 6;
					break;
				}

				return context$1$0.abrupt('return', content);

			case 6:
				context$1$0.prev = 6;
				return context$1$0.abrupt('return', JSON.parse(content));

			case 10:
				context$1$0.prev = 10;
				context$1$0.t0 = context$1$0['catch'](6);

				_winston2['default'].warn('error parsing json for route/stub: ' + k + '/' + name);
				return context$1$0.abrupt('return', content);

			case 14:
			case 'end':
				return context$1$0.stop();
		}
	}, null, this, [[6, 10]]);
}

function getDemoFileContents() {
	var stubsObj;
	return _regeneratorRuntime.async(function getDemoFileContents$(context$1$0) {
		var _this2 = this;

		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				stubsObj = {};
				context$1$0.next = 3;
				return _regeneratorRuntime.awrap(_Promise.all(_Object$keys(_state2['default'].activeStubs).map(function callee$1$0(k) {
					var stub, hooks;
					return _regeneratorRuntime.async(function callee$1$0$(context$2$0) {
						var _this = this;

						while (1) switch (context$2$0.prev = context$2$0.next) {
							case 0:
								context$2$0.next = 2;
								return _regeneratorRuntime.awrap(_state2['default'].getActiveStub(k));

							case 2:
								stub = context$2$0.sent;

								stubsObj[k] = {
									'default': stub.replace('.json', ''),
									stubs: {}
								};
								context$2$0.next = 6;
								return _regeneratorRuntime.awrap(getStubContent(k, stub));

							case 6:
								stubsObj[k].stubs[stubsObj[k]['default']] = context$2$0.sent;
								context$2$0.next = 9;
								return _regeneratorRuntime.awrap(_state2['default'].getActiveHooks(k, stub));

							case 9:
								hooks = context$2$0.sent;

								if (hooks && (hooks.chooseStub || hooks.processStub)) {
									stubsObj[k].hooks = {
										chooseStub: (0, _nodeStringify2['default'])(hooks.chooseStub),
										processStub: (0, _nodeStringify2['default'])(hooks.processStub)
									};
								}

								if (!(hooks.stubsForDemo && hooks.stubsForDemo.length > 0)) {
									context$2$0.next = 14;
									break;
								}

								context$2$0.next = 14;
								return _regeneratorRuntime.awrap(_Promise.all(hooks.stubsForDemo.map(function callee$2$0(additionalStub) {
									return _regeneratorRuntime.async(function callee$2$0$(context$3$0) {
										while (1) switch (context$3$0.prev = context$3$0.next) {
											case 0:
												context$3$0.next = 2;
												return _regeneratorRuntime.awrap(getStubContent(k, additionalStub));

											case 2:
												stubsObj[k].stubs[additionalStub] = context$3$0.sent;

											case 3:
											case 'end':
												return context$3$0.stop();
										}
									}, null, _this);
								}))['catch'](function (e) {
									_winston2['default'].error(e);
								}));

							case 14:
							case 'end':
								return context$2$0.stop();
						}
					}, null, _this2);
				}))['catch'](function (e) {
					_winston2['default'].error('Error building demo stubs');
					_winston2['default'].error(e);
				}));

			case 3:

				_winston2['default'].info('writing demo config');
				//return `export let stubs = ${JSON.stringify(stubsObj, null, 4)};`;
				return context$1$0.abrupt('return', topComment + '\nimport {setup} from \'./common/setup.js\';\nlet demoConfig = ' + JSON.stringify(stubsObj) + '\nsetup(demoConfig);\n');

			case 5:
			case 'end':
				return context$1$0.stop();
		}
	}, null, this);
}

exports['default'] = function createDemoFile(name, destPath) {
	return _regeneratorRuntime.async(function createDemoFile$(context$1$0) {
		while (1) switch (context$1$0.prev = context$1$0.next) {
			case 0:
				if (name) {
					context$1$0.next = 3;
					break;
				}

				_winston2['default'].error('No demo name was specified.  Demo name must match a stub server preset.');
				return context$1$0.abrupt('return');

			case 3:
				if (destPath) {
					context$1$0.next = 6;
					break;
				}

				_winston2['default'].error('No destination file path was specified.  Aborting.');
				return context$1$0.abrupt('return');

			case 6:
				context$1$0.next = 8;
				return _regeneratorRuntime.awrap(_state2['default'].loadState());

			case 8:
				context$1$0.next = 10;
				return _regeneratorRuntime.awrap(_state2['default'].setPreset(name));

			case 10:
				return context$1$0.abrupt('return', new _Promise(function (resolve, reject) {

					(0, _mkpath2['default'])('./server/demo-files', function (err) {
						if (err) throw err;
						getDemoFileContents().then(function (contents) {
							//fs.writeFile('./server/demo-files/'+ name + '.js', contents,function(err){
							_fs2['default'].writeFile(destPath, contents, function (err) {
								if (err) {
									_winston2['default'].error('Error writing demo file to disk. Error:' + err);
								} else {
									_winston2['default'].debug('Demo file written to disk.');
								}
							});
							// Object.keys(state.activeStubs).forEach(function(k) {
							// 	console.log(k);
							// 	console.log(state.activeStubs[k]);
							// })
							resolve(true);
						});
					});
				}));

			case 11:
			case 'end':
				return context$1$0.stop();
		}
	}, null, this);
};

module.exports = exports['default'];

//let stub = await state.getDefaultStub(k);