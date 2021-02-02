module.exports =
/******/ (function(modules, runtime) { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete installedModules[moduleId];
/******/ 		}
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	__webpack_require__.ab = __dirname + "/";
/******/
/******/ 	// the startup function
/******/ 	function startup() {
/******/ 		// Load entry module and return exports
/******/ 		return __webpack_require__(63);
/******/ 	};
/******/ 	// initialize runtime
/******/ 	runtime(__webpack_require__);
/******/
/******/ 	// run startup
/******/ 	return startup();
/******/ })
/************************************************************************/
/******/ ({

/***/ 63:
/***/ (function(__unusedmodule, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(898);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_actions_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _actions_github__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(654);
/* harmony import */ var _actions_github__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_actions_github__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(113);
/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_utils__WEBPACK_IMPORTED_MODULE_2__);




let isCoreInstalled = false;

async function checkAndPublish(context, path) {
	console.log(`[ ${path} ] start process`);

	let base;
	let head;
	if (context.payload.pull_request) {
		base = context.payload.pull_request.base;
		head = context.payload.pull_request.head;
	} else {
		base = context.payload.before;
		head = context.payload.after;
	}

	const isDiff = await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.getDiff)(base, head, path, context.ref);

	if (isDiff) {
		console.log('found diff !');
	} else {
		console.log('not modified !');
		return;
	}

	const ref = context.ref.split('/')[2];

	if (path != 'packages/core' && !isCoreInstalled) {
		if (ref === 'master') {
			await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.installCore)(false);
		} else {
			await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.installCore)(true);
		}
		isCoreInstalled = true;
	}

	if (ref === 'master') {
		await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.updateVersionProduction)(path);
		await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.buildAndPublishProduction)(path);

	} else if (ref.startsWith('stg')) {
		await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.updateVersionMinor)(path);
		await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.buildAndPublishBeta)(path);

	} else if (ref.startsWith('hotfix')) {
		await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.updateVersionPatch)(path);
		await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.buildAndPublishBeta)(path);

	} else if (ref === 'beta') {
		await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.updateVersionPatch)(path);
		await Object(_utils__WEBPACK_IMPORTED_MODULE_2__.buildAndPublishBeta)(path);
	}

	console.log(`[ ${path} ] end of process\n`);
}

async function run() {
	const context = _actions_github__WEBPACK_IMPORTED_MODULE_1__.context;
	console.log('context :', context);
	await checkAndPublish(context, 'packages/core');
	await checkAndPublish(context, 'packages/cws-bnb');
	await checkAndPublish(context, 'packages/cws-btc');
	await checkAndPublish(context, 'packages/cws-bch');
	await checkAndPublish(context, 'packages/cws-ltc');
	await checkAndPublish(context, 'packages/cws-zen');
	await checkAndPublish(context, 'packages/cws-eos');
	await checkAndPublish(context, 'packages/cws-eth');
	await checkAndPublish(context, 'packages/cws-icx');
	await checkAndPublish(context, 'packages/cws-qkc');
	await checkAndPublish(context, 'packages/cws-xlm');
	await checkAndPublish(context, 'packages/cws-xrp');
	await checkAndPublish(context, 'packages/cws-trx');
	await checkAndPublish(context, 'packages/cws-atom');
	await checkAndPublish(context, 'packages/transport-react-native-ble');
	await checkAndPublish(context, 'packages/transport-web-ble');
}

try {
	run();
} catch (error) {
	_actions_core__WEBPACK_IMPORTED_MODULE_0__.setFailed(error.message);
}


/***/ }),

/***/ 113:
/***/ (function(__unusedmodule, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = exports.getDiff = exports.updateVersionMajor = exports.updateVersionMinor = exports.updateVersionPatch = exports.updateVersionProduction = exports.buildAndPublishBeta = exports.buildAndPublishProduction = exports.installCore = void 0;
var child_process_1 = __webpack_require__(129);
function installCore(isBeta) {
    if (isBeta === void 0) { isBeta = false; }
    return __awaiter(this, void 0, void 0, function () {
        var packageName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    packageName = isBeta ? '@coolwallet/core@beta' : '@coolwallet/core';
                    return [4 /*yield*/, command('npm', ['i', packageName])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.installCore = installCore;
function buildAndPublishProduction(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, buildAndPublish(path, false)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.buildAndPublishProduction = buildAndPublishProduction;
function buildAndPublishBeta(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, buildAndPublish(path, true)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.buildAndPublishBeta = buildAndPublishBeta;
function buildAndPublish(path, isBeta) {
    return __awaiter(this, void 0, void 0, function () {
        var publishArgs, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, command('npm', ['ci'], path)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, command('npm', ['run-script', 'build'], path)];
                case 2:
                    _a.sent();
                    publishArgs = ['publish', '--access', 'public'];
                    return [4 /*yield*/, command('npm', publishArgs, path)];
                case 3:
                    result = _a.sent();
                    console.log('npm publish :', result);
                    return [2 /*return*/];
            }
        });
    });
}
function updateVersionProduction(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, updateVersion(path, 1)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.updateVersionProduction = updateVersionProduction;
function updateVersionPatch(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, updateVersion(path, 2)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.updateVersionPatch = updateVersionPatch;
function updateVersionMinor(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, updateVersion(path, 3)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.updateVersionMinor = updateVersionMinor;
function updateVersionMajor(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, updateVersion(path, 4)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.updateVersionMajor = updateVersionMajor;
// versionType 1 : production - remove beta version.
// versionType 2 : patch - add patch and init beta version. if beta exists, just add beta version.
// versionType 3 : minor - add minor and init beta version. if beta exists, just add beta version.
// versionType 4 : major - add major and init beta version. if beta exists, just add beta version.
function updateVersion(path, versionType) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, oldVersion, name, version, patch, minor, major, beta, newVersion, tag;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = getPackageInfo(path), oldVersion = _a.version, name = _a.name;
                    version = disassembleVersion(oldVersion);
                    if (versionType === 1) {
                        version.beta = undefined;
                    }
                    else if (version.beta === undefined) {
                        version.beta = '0';
                        if (versionType === 2) {
                            patch = parseInt(version.patch) + 1;
                            version.patch = patch.toString();
                        }
                        else if (versionType === 3) {
                            minor = parseInt(version.minor) + 1;
                            version.minor = minor.toString();
                        }
                        else if (versionType === 4) {
                            major = parseInt(version.major) + 1;
                            version.major = major.toString();
                        }
                    }
                    else {
                        beta = parseInt(version.beta) + 1;
                        version.beta = beta.toString();
                    }
                    newVersion = assembleVersion(version.major, version.minor, version.patch, version.beta);
                    console.log('newVersion :', newVersion);
                    return [4 /*yield*/, setVersion(path, newVersion)];
                case 1:
                    _b.sent();
                    tag = name + "@" + newVersion;
                    console.log('commit tag :', tag);
                    return [4 /*yield*/, commit(tag)];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function commit(tag) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, command('git', ['config', '--global', 'user.email', 'cw.tech@coolbitx.com'])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, command('git', ['config', '--global', 'user.name', 'coolwallet team'])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, command('git', ['add', '.'])];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, command('git', ['commit', '-m', tag])];
                case 4:
                    result = _a.sent();
                    console.log('git commit :', result);
                    return [4 /*yield*/, command('git', ['push'])];
                case 5:
                    result = _a.sent();
                    console.log('git push :', result);
                    return [4 /*yield*/, command('git', ['tag', tag])];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, command('git', ['push', '--tags'])];
                case 7:
                    result = _a.sent();
                    console.log('git push --tags :', result);
                    return [2 /*return*/];
            }
        });
    });
}
function setVersion(path, version) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, command('npm', ['version', version], path)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function assembleVersion(major, minor, patch, beta) {
    var version = [major, minor, patch].join('.');
    if (beta)
        version = version + "-beta." + beta;
    return version;
}
function disassembleVersion(ver) {
    var version = ver.split('-');
    var main = version[0].split('.');
    var major = main[0];
    var minor = main[1];
    var patch = main[2];
    var beta = (version[1]) ? version[1].split('.')[1] : undefined;
    return { major: major, minor: minor, patch: patch, beta: beta };
}
function getPackageInfo(path) {
    var data = __webpack_require__(747).readFileSync(path + "/package.json", 'utf8');
    var packageObj = JSON.parse(data);
    var version = packageObj.version;
    var name = packageObj.name;
    return { version: version, name: name };
}
function getDiff(base, head, path, ref) {
    return __awaiter(this, void 0, void 0, function () {
        var diff;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, command('git', ['fetch', '--no-tags', '--no-recurse-submodules', '--depth=10000', 'origin', ref])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, command('git', ['diff', base, head, '--name-only', '--', path + "/src"])];
                case 2:
                    diff = _a.sent();
                    console.log(diff);
                    if (!diff || diff.includes('fatal:'))
                        return [2 /*return*/, false];
                    return [2 /*return*/, true];
            }
        });
    });
}
exports.getDiff = getDiff;
function command(cmd, args, cwd) {
    return new Promise(function (resolve, reject) {
        var command = child_process_1.spawn(cmd, args, { cwd: cwd });
        var stdout = '';
        var stderr = '';
        command.stdout.on('data', function (data) {
            stdout += data.toString();
        });
        command.stderr.on('data', function (data) {
            stderr += data.toString();
        });
        command.on('error', function (err) {
            reject(err);
        });
        command.on('close', function () {
            if (stderr)
                resolve(stderr);
            if (stdout)
                resolve(stdout);
            resolve('');
        });
    });
}
exports.command = command;


/***/ }),

/***/ 129:
/***/ (function(module) {

module.exports = require("child_process");

/***/ }),

/***/ 654:
/***/ (function(module) {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 747:
/***/ (function(module) {

module.exports = require("fs");

/***/ }),

/***/ 898:
/***/ (function(module) {

module.exports = eval("require")("@actions/core");


/***/ })

/******/ },
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ 	"use strict";
/******/ 
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function getDefault() { return module['default']; } :
/******/ 				function getModuleExports() { return module; };
/******/ 			__webpack_require__.d(getter, 'a', getter);
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getter */
/******/ 	!function() {
/******/ 		// define getter function for harmony exports
/******/ 		var hasOwnProperty = Object.prototype.hasOwnProperty;
/******/ 		__webpack_require__.d = function(exports, name, getter) {
/******/ 			if(!hasOwnProperty.call(exports, name)) {
/******/ 				Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ }
);