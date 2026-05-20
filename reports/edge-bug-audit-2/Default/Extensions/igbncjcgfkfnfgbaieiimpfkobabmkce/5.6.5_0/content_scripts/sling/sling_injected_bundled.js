/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 736
(module, __unused_webpack_exports, __webpack_require__) {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 */

function setup(env) {
	createDebug.debug = createDebug;
	createDebug.default = createDebug;
	createDebug.coerce = coerce;
	createDebug.disable = disable;
	createDebug.enable = enable;
	createDebug.enabled = enabled;
	createDebug.humanize = __webpack_require__(6585);
	createDebug.destroy = destroy;

	Object.keys(env).forEach(key => {
		createDebug[key] = env[key];
	});

	/**
	* The currently active debug mode names, and names to skip.
	*/

	createDebug.names = [];
	createDebug.skips = [];

	/**
	* Map of special "%n" handling functions, for the debug "format" argument.
	*
	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
	*/
	createDebug.formatters = {};

	/**
	* Selects a color for a debug namespace
	* @param {String} namespace The namespace string for the debug instance to be colored
	* @return {Number|String} An ANSI color code for the given namespace
	* @api private
	*/
	function selectColor(namespace) {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}

		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
	}
	createDebug.selectColor = selectColor;

	/**
	* Create a debugger with the given `namespace`.
	*
	* @param {String} namespace
	* @return {Function}
	* @api public
	*/
	function createDebug(namespace) {
		let prevTime;
		let enableOverride = null;
		let namespacesCache;
		let enabledCache;

		function debug(...args) {
			// Disabled?
			if (!debug.enabled) {
				return;
			}

			const self = debug;

			// Set `diff` timestamp
			const curr = Number(new Date());
			const ms = curr - (prevTime || curr);
			self.diff = ms;
			self.prev = prevTime;
			self.curr = curr;
			prevTime = curr;

			args[0] = createDebug.coerce(args[0]);

			if (typeof args[0] !== 'string') {
				// Anything else let's inspect with %O
				args.unshift('%O');
			}

			// Apply any `formatters` transformations
			let index = 0;
			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
				// If we encounter an escaped % then don't increase the array index
				if (match === '%%') {
					return '%';
				}
				index++;
				const formatter = createDebug.formatters[format];
				if (typeof formatter === 'function') {
					const val = args[index];
					match = formatter.call(self, val);

					// Now we need to remove `args[index]` since it's inlined in the `format`
					args.splice(index, 1);
					index--;
				}
				return match;
			});

			// Apply env-specific formatting (colors, etc.)
			createDebug.formatArgs.call(self, args);

			const logFn = self.log || createDebug.log;
			logFn.apply(self, args);
		}

		debug.namespace = namespace;
		debug.useColors = createDebug.useColors();
		debug.color = createDebug.selectColor(namespace);
		debug.extend = extend;
		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

		Object.defineProperty(debug, 'enabled', {
			enumerable: true,
			configurable: false,
			get: () => {
				if (enableOverride !== null) {
					return enableOverride;
				}
				if (namespacesCache !== createDebug.namespaces) {
					namespacesCache = createDebug.namespaces;
					enabledCache = createDebug.enabled(namespace);
				}

				return enabledCache;
			},
			set: v => {
				enableOverride = v;
			}
		});

		// Env-specific initialization logic for debug instances
		if (typeof createDebug.init === 'function') {
			createDebug.init(debug);
		}

		return debug;
	}

	function extend(namespace, delimiter) {
		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
		newDebug.log = this.log;
		return newDebug;
	}

	/**
	* Enables a debug mode by namespaces. This can include modes
	* separated by a colon and wildcards.
	*
	* @param {String} namespaces
	* @api public
	*/
	function enable(namespaces) {
		createDebug.save(namespaces);
		createDebug.namespaces = namespaces;

		createDebug.names = [];
		createDebug.skips = [];

		const split = (typeof namespaces === 'string' ? namespaces : '')
			.trim()
			.replace(/\s+/g, ',')
			.split(',')
			.filter(Boolean);

		for (const ns of split) {
			if (ns[0] === '-') {
				createDebug.skips.push(ns.slice(1));
			} else {
				createDebug.names.push(ns);
			}
		}
	}

	/**
	 * Checks if the given string matches a namespace template, honoring
	 * asterisks as wildcards.
	 *
	 * @param {String} search
	 * @param {String} template
	 * @return {Boolean}
	 */
	function matchesTemplate(search, template) {
		let searchIndex = 0;
		let templateIndex = 0;
		let starIndex = -1;
		let matchIndex = 0;

		while (searchIndex < search.length) {
			if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === '*')) {
				// Match character or proceed with wildcard
				if (template[templateIndex] === '*') {
					starIndex = templateIndex;
					matchIndex = searchIndex;
					templateIndex++; // Skip the '*'
				} else {
					searchIndex++;
					templateIndex++;
				}
			} else if (starIndex !== -1) { // eslint-disable-line no-negated-condition
				// Backtrack to the last '*' and try to match more characters
				templateIndex = starIndex + 1;
				matchIndex++;
				searchIndex = matchIndex;
			} else {
				return false; // No match
			}
		}

		// Handle trailing '*' in template
		while (templateIndex < template.length && template[templateIndex] === '*') {
			templateIndex++;
		}

		return templateIndex === template.length;
	}

	/**
	* Disable debug output.
	*
	* @return {String} namespaces
	* @api public
	*/
	function disable() {
		const namespaces = [
			...createDebug.names,
			...createDebug.skips.map(namespace => '-' + namespace)
		].join(',');
		createDebug.enable('');
		return namespaces;
	}

	/**
	* Returns true if the given mode name is enabled, false otherwise.
	*
	* @param {String} name
	* @return {Boolean}
	* @api public
	*/
	function enabled(name) {
		for (const skip of createDebug.skips) {
			if (matchesTemplate(name, skip)) {
				return false;
			}
		}

		for (const ns of createDebug.names) {
			if (matchesTemplate(name, ns)) {
				return true;
			}
		}

		return false;
	}

	/**
	* Coerce `val`.
	*
	* @param {Mixed} val
	* @return {Mixed}
	* @api private
	*/
	function coerce(val) {
		if (val instanceof Error) {
			return val.stack || val.message;
		}
		return val;
	}

	/**
	* XXX DO NOT USE. This is a temporary stub function.
	* XXX It WILL be removed in the next major release.
	*/
	function destroy() {
		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
	}

	createDebug.enable(createDebug.load());

	return createDebug;
}

module.exports = setup;


/***/ },

/***/ 2153
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   V: () => (/* binding */ Logger)
/* harmony export */ });
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7833);
/* harmony import */ var debug__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(debug__WEBPACK_IMPORTED_MODULE_0__);

class Logger {
    constructor(namespace) {
        this.namespace = namespace;
    }
    debug(debugMessage) {
        const namespace = debugMessage.methodName ? `${this.namespace}:${debugMessage.methodName}` : this.namespace;
        if (debugMessage.message) {
            debug__WEBPACK_IMPORTED_MODULE_0___default()(namespace)(debugMessage.message);
        }
        if (debugMessage.object) {
            debug__WEBPACK_IMPORTED_MODULE_0___default()(namespace)(debugMessage.object);
        }
    }
}


/***/ },

/***/ 6585
(module) {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function (val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}


/***/ },

/***/ 7833
(module, exports, __webpack_require__) {

/* eslint-env browser */

/**
 * This is the web browser implementation of `debug()`.
 */

exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = localstorage();
exports.destroy = (() => {
	let warned = false;

	return () => {
		if (!warned) {
			warned = true;
			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
		}
	};
})();

/**
 * Colors.
 */

exports.colors = [
	'#0000CC',
	'#0000FF',
	'#0033CC',
	'#0033FF',
	'#0066CC',
	'#0066FF',
	'#0099CC',
	'#0099FF',
	'#00CC00',
	'#00CC33',
	'#00CC66',
	'#00CC99',
	'#00CCCC',
	'#00CCFF',
	'#3300CC',
	'#3300FF',
	'#3333CC',
	'#3333FF',
	'#3366CC',
	'#3366FF',
	'#3399CC',
	'#3399FF',
	'#33CC00',
	'#33CC33',
	'#33CC66',
	'#33CC99',
	'#33CCCC',
	'#33CCFF',
	'#6600CC',
	'#6600FF',
	'#6633CC',
	'#6633FF',
	'#66CC00',
	'#66CC33',
	'#9900CC',
	'#9900FF',
	'#9933CC',
	'#9933FF',
	'#99CC00',
	'#99CC33',
	'#CC0000',
	'#CC0033',
	'#CC0066',
	'#CC0099',
	'#CC00CC',
	'#CC00FF',
	'#CC3300',
	'#CC3333',
	'#CC3366',
	'#CC3399',
	'#CC33CC',
	'#CC33FF',
	'#CC6600',
	'#CC6633',
	'#CC9900',
	'#CC9933',
	'#CCCC00',
	'#CCCC33',
	'#FF0000',
	'#FF0033',
	'#FF0066',
	'#FF0099',
	'#FF00CC',
	'#FF00FF',
	'#FF3300',
	'#FF3333',
	'#FF3366',
	'#FF3399',
	'#FF33CC',
	'#FF33FF',
	'#FF6600',
	'#FF6633',
	'#FF9900',
	'#FF9933',
	'#FFCC00',
	'#FFCC33'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

// eslint-disable-next-line complexity
function useColors() {
	// NB: In an Electron preload script, document will be defined but not fully
	// initialized. Since we know we're in Chrome, we'll just detect this case
	// explicitly
	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
		return true;
	}

	// Internet Explorer and Edge do not support colors.
	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
		return false;
	}

	let m;

	// Is webkit? http://stackoverflow.com/a/16459606/376773
	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
	// eslint-disable-next-line no-return-assign
	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
		// Is firebug? http://stackoverflow.com/a/398120/376773
		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
		// Is firefox >= v31?
		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
		(typeof navigator !== 'undefined' && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31) ||
		// Double check webkit in userAgent just in case we are in a worker
		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
	args[0] = (this.useColors ? '%c' : '') +
		this.namespace +
		(this.useColors ? ' %c' : ' ') +
		args[0] +
		(this.useColors ? '%c ' : ' ') +
		'+' + module.exports.humanize(this.diff);

	if (!this.useColors) {
		return;
	}

	const c = 'color: ' + this.color;
	args.splice(1, 0, c, 'color: inherit');

	// The final "%c" is somewhat tricky, because there could be other
	// arguments passed either before or after the %c, so we need to
	// figure out the correct index to insert the CSS into
	let index = 0;
	let lastC = 0;
	args[0].replace(/%[a-zA-Z%]/g, match => {
		if (match === '%%') {
			return;
		}
		index++;
		if (match === '%c') {
			// We only are interested in the *last* %c
			// (the user may have provided their own)
			lastC = index;
		}
	});

	args.splice(lastC, 0, c);
}

/**
 * Invokes `console.debug()` when available.
 * No-op when `console.debug` is not a "function".
 * If `console.debug` is not available, falls back
 * to `console.log`.
 *
 * @api public
 */
exports.log = console.debug || console.log || (() => {});

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */
function save(namespaces) {
	try {
		if (namespaces) {
			exports.storage.setItem('debug', namespaces);
		} else {
			exports.storage.removeItem('debug');
		}
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */
function load() {
	let r;
	try {
		r = exports.storage.getItem('debug') || exports.storage.getItem('DEBUG') ;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}

	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
	if (!r && typeof process !== 'undefined' && 'env' in process) {
		r = "MISSING_ENV_VAR".DEBUG;
	}

	return r;
}

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
	try {
		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
		// The Browser also has localStorage in the global context.
		return localStorage;
	} catch (error) {
		// Swallow
		// XXX (@Qix-) should we be logging these?
	}
}

module.exports = __webpack_require__(736)(exports);

const {formatters} = module.exports;

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

formatters.j = function (v) {
	try {
		return JSON.stringify(v);
	} catch (error) {
		return '[UnexpectedJSONParseError]: ' + error.message;
	}
};


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Logger = (__webpack_require__(2153)/* .Logger */ .V);
const logger = new Logger("ext:ContentScripts:Sling:sling_injected");
window.seekScriptLoaded = true;
window.offset = 0;
window.injectScriptLoaded = true;
const PLAYER_HOOK_MARK = "__patchedByExtension";
const PLAYER_ORIGINAL_MARK = "__originalBitmovinPlayer";
const PLAYBACK_METADATA_SELECTOR = "[data-testid='playback-metadata-1']";
const MAX_DAYS_BACK_FOR_UNIX_RESOLUTION = 14;
const MAX_PROGRAM_LENGTH_MS = 8 * 60 * 60 * 1000;
const findSeekUtils = function () {
    var _a, _b, _c;
    const el = document.querySelector('[data-testid="seekable"]');
    const elementRoot = el === null || el === void 0 ? void 0 : el.parentElement;
    if (elementRoot == null) {
        return null;
    }
    const keys = Object.keys(elementRoot);
    let key = null;
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith("__reactFiber")) {
            key = keys[i];
            break;
        }
    }
    if (key == null) {
        return null;
    }
    if (typeof elementRoot[key] === "undefined") {
        return null;
    }
    let seekFn;
    let duration;
    let currentPosition;
    const children = (_a = elementRoot[key].pendingProps) === null || _a === void 0 ? void 0 : _a.children;
    if (children && ((_c = (_b = children.props) === null || _b === void 0 ? void 0 : _b.children) === null || _c === void 0 ? void 0 : _c.length) > 1) {
        seekFn = children.props.children[1].props.debouncedSeekForwardOrBackWard;
        duration = children.props.children[1].props.duration;
        currentPosition = children.props.children[1].props.currentPosition;
    }
    if (!seekFn) {
        return null;
    }
    return {
        seekFn,
        duration,
        currentPosition,
    };
};
const findNavigator = function () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const element = document.querySelector(".base-screen");
    if (element == null) {
        return null;
    }
    const keys = Object.keys(element);
    let key = null;
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith("__reactFiber")) {
            key = keys[i];
            break;
        }
    }
    if (key == null) {
        return null;
    }
    try {
        return (_r = (_q = (_p = (_o = (_m = (_l = (_k = (_j = (_h = (_g = (_f = (_e = (_d = (_c = (_b = (_a = element[key]) === null || _a === void 0 ? void 0 : _a.alternate) === null || _b === void 0 ? void 0 : _b.child) === null || _c === void 0 ? void 0 : _c.child) === null || _d === void 0 ? void 0 : _d.alternate) === null || _e === void 0 ? void 0 : _e.child) === null || _f === void 0 ? void 0 : _f.dependencies) === null || _g === void 0 ? void 0 : _g.firstContext) === null || _h === void 0 ? void 0 : _h.next) === null || _j === void 0 ? void 0 : _j.next) === null || _k === void 0 ? void 0 : _k.next) === null || _l === void 0 ? void 0 : _l.next) === null || _m === void 0 ? void 0 : _m.next) === null || _o === void 0 ? void 0 : _o.next) === null || _p === void 0 ? void 0 : _p.next) === null || _q === void 0 ? void 0 : _q.memoizedValue) === null || _r === void 0 ? void 0 : _r.navigator;
    }
    catch (error) {
        logger.debug({ methodName: "findNavigator", message: `Error accessing navigator: ${error.message}` });
        return null;
    }
};
const seek = (ms) => {
    const seekUtils = findSeekUtils();
    if (seekUtils) {
        if (ms > 6000 && Math.abs(ms - seekUtils.currentPosition) > 2500) {
            seekUtils.seekFn(ms - seekUtils.currentPosition);
        }
    }
};
function createPatchedPlayer(CurrentPlayer) {
    if (!CurrentPlayer || CurrentPlayer[PLAYER_HOOK_MARK]) {
        return CurrentPlayer;
    }
    function PatchedPlayer(...args) {
        const instance = new CurrentPlayer(...args);
        window.__player = instance;
        logger.debug({
            methodName: "createPatchedPlayer",
            message: "Captured Bitmovin player instance on window.__player",
        });
        return instance;
    }
    PatchedPlayer[PLAYER_HOOK_MARK] = true;
    PatchedPlayer[PLAYER_ORIGINAL_MARK] = CurrentPlayer;
    PatchedPlayer.prototype = CurrentPlayer.prototype;
    try {
        Object.setPrototypeOf(PatchedPlayer, CurrentPlayer);
    }
    catch (error) {
        logger.debug({
            methodName: "createPatchedPlayer",
            message: `Failed to set prototype: ${error.message}`,
        });
    }
    return PatchedPlayer;
}
function patchPlayerConstructor() {
    var _a, _b;
    const CurrentPlayer = (_b = (_a = window.bitmovin) === null || _a === void 0 ? void 0 : _a.player) === null || _b === void 0 ? void 0 : _b.Player;
    if (!CurrentPlayer) {
        return false;
    }
    if (CurrentPlayer[PLAYER_HOOK_MARK]) {
        return true;
    }
    window.bitmovin.player.Player = createPatchedPlayer(CurrentPlayer);
    logger.debug({
        methodName: "patchPlayerConstructor",
        message: "Patched Bitmovin Player constructor",
    });
    return true;
}
function installPersistentBitmovinHook() {
    let installedSetter = false;
    let currentPatchedValue = null;
    const tryInstallSetter = () => {
        var _a;
        const playerObj = (_a = window.bitmovin) === null || _a === void 0 ? void 0 : _a.player;
        if (!playerObj) {
            return false;
        }
        if (playerObj.__extensionPlayerSetterInstalled) {
            return true;
        }
        let internalPlayerValue = playerObj.Player;
        Object.defineProperty(playerObj, "Player", {
            configurable: true,
            enumerable: true,
            get() {
                return internalPlayerValue;
            },
            set(value) {
                if (!value) {
                    internalPlayerValue = value;
                    return;
                }
                if (value[PLAYER_HOOK_MARK]) {
                    internalPlayerValue = value;
                    currentPatchedValue = value;
                    return;
                }
                const patched = createPatchedPlayer(value);
                internalPlayerValue = patched;
                currentPatchedValue = patched;
                logger.debug({
                    methodName: "installPersistentBitmovinHook",
                    message: "Re-hooked Bitmovin Player after reassignment",
                });
            },
        });
        playerObj.__extensionPlayerSetterInstalled = true;
        installedSetter = true;
        if (internalPlayerValue && !internalPlayerValue[PLAYER_HOOK_MARK]) {
            const patched = createPatchedPlayer(internalPlayerValue);
            internalPlayerValue = patched;
            currentPatchedValue = patched;
        }
        else {
            currentPatchedValue = internalPlayerValue;
        }
        logger.debug({
            methodName: "installPersistentBitmovinHook",
            message: "Installed persistent Bitmovin Player hook",
        });
        return true;
    };
    const interval = setInterval(() => {
        var _a, _b, _c, _d, _e;
        tryInstallSetter();
        patchPlayerConstructor();
        const latestPlayer = (_b = (_a = window.bitmovin) === null || _a === void 0 ? void 0 : _a.player) === null || _b === void 0 ? void 0 : _b.Player;
        if (latestPlayer && latestPlayer !== currentPatchedValue && !latestPlayer[PLAYER_HOOK_MARK]) {
            logger.debug({
                methodName: "installPersistentBitmovinHook",
                message: "Detected new Player constructor reference, patching again",
            });
            patchPlayerConstructor();
            currentPatchedValue = (_d = (_c = window.bitmovin) === null || _c === void 0 ? void 0 : _c.player) === null || _d === void 0 ? void 0 : _d.Player;
        }
        if (!installedSetter && ((_e = window.bitmovin) === null || _e === void 0 ? void 0 : _e.player)) {
            tryInstallSetter();
        }
    }, 250);
    return interval;
}
function getPlaybackMetadataText() {
    var _a, _b;
    return ((_b = (_a = document.querySelector(PLAYBACK_METADATA_SELECTOR)) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || null;
}
function extractLikelyTimeRange(text) {
    if (!text || typeof text !== "string") {
        return null;
    }
    const match = text.match(/(\d{1,2}(?::\d{1,2})?\s*(?:AM|PM)?\s*[-–—]\s*\d{1,2}(?::\d{1,2})?\s*(?:AM|PM)?)/i);
    return match ? match[1] : text;
}
function parseClockValue(value) {
    if (!value || typeof value !== "string") {
        return null;
    }
    const normalized = value.trim().toUpperCase().replace(/\./g, "").replace(/\s+/g, "");
    // Supports:
    // 8PM
    // 8:30PM
    // 8
    // 8:30
    // 08:30
    const match = normalized.match(/^(\d{1,2})(?::(\d{1,2}))?(AM|PM)?$/);
    if (!match) {
        return null;
    }
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2] || "0", 10);
    const meridiem = match[3] || null;
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
        return null;
    }
    let hour24 = hour;
    if (meridiem != null) {
        if (meridiem === "AM") {
            if (hour === 12) {
                hour24 = 0;
            }
        }
        else if (hour !== 12) {
            hour24 = hour + 12;
        }
    }
    return {
        hour,
        hour24,
        minute,
        meridiem,
        explicitMeridiem: meridiem != null,
    };
}
function parseTimeRangeText(text) {
    var _a, _b;
    if (!text || typeof text !== "string") {
        return null;
    }
    const cleaned = text.trim().toUpperCase().replace(/\./g, "").replace(/[–—]/g, "-").replace(/\s+/g, " ");
    const parts = cleaned.split(/\s*-\s*/);
    if (parts.length !== 2) {
        return null;
    }
    const startRaw = (_a = parts[0]) === null || _a === void 0 ? void 0 : _a.trim();
    const endRaw = (_b = parts[1]) === null || _b === void 0 ? void 0 : _b.trim();
    if (!startRaw || !endRaw) {
        return null;
    }
    let start = parseClockValue(startRaw);
    let end = parseClockValue(endRaw);
    if (!start || !end) {
        return null;
    }
    const inferWithMeridiem = (parsedValue, meridiem) => {
        if (!parsedValue || parsedValue.meridiem || !meridiem) {
            return parsedValue;
        }
        const minutesPart = parsedValue.minute ? `:${String(parsedValue.minute).padStart(2, "0")}` : "";
        return parseClockValue(`${parsedValue.hour}${minutesPart}${meridiem}`);
    };
    // Example: 8-9PM => 8PM-9PM
    if (!start.meridiem && end.meridiem) {
        start = inferWithMeridiem(start, end.meridiem);
    }
    // Example: 8PM-9 => 8PM-9PM
    // Example: 11PM-1 => 11PM-1AM
    if (start.meridiem && !end.meridiem) {
        end = inferWithMeridiem(end, start.meridiem);
        if (end) {
            const startMinutes = start.hour24 * 60 + start.minute;
            const endMinutes = end.hour24 * 60 + end.minute;
            if (endMinutes <= startMinutes) {
                const opposite = start.meridiem === "AM" ? "PM" : "AM";
                const maybeOpposite = inferWithMeridiem(parseClockValue(endRaw), opposite);
                if (maybeOpposite) {
                    const oppositeMinutes = maybeOpposite.hour24 * 60 + maybeOpposite.minute;
                    if (oppositeMinutes !== startMinutes) {
                        end = maybeOpposite;
                    }
                }
            }
        }
    }
    if (!start.meridiem && !end.meridiem) {
        return null;
    }
    if (!start.meridiem || !end.meridiem) {
        return null;
    }
    return {
        raw: cleaned,
        start,
        end,
    };
}
function looksLikeUnixTime(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return false;
    }
    if (value > 1000000000000 && value < 10000000000000) {
        return "ms";
    }
    if (value > 1000000000 && value < 10000000000) {
        return "s";
    }
    return false;
}
function normalizePossiblyUnixTimeToMs(value) {
    const unixType = looksLikeUnixTime(value);
    if (unixType === "ms") {
        return Math.round(value);
    }
    if (unixType === "s") {
        return Math.round(value * 1000);
    }
    return null;
}
function normalizePlayerCurrentTimeRaw(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return undefined;
    }
    const unixMs = normalizePossiblyUnixTimeToMs(value);
    if (unixMs != null) {
        return {
            raw: value,
            normalizedMs: unixMs,
            kind: "unix",
            unixPrecision: looksLikeUnixTime(value),
        };
    }
    return {
        raw: value,
        normalizedMs: Math.round(value * 1000),
        kind: "playback-seconds",
        unixPrecision: null,
    };
}
function makeLocalDateForClock(baseDate, hour24, minute) {
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hour24, minute, 0, 0);
}
function resolveProgramStartFromUnixTime({ metadataText, currentVideoTime, maxDaysBack = MAX_DAYS_BACK_FOR_UNIX_RESOLUTION, maxProgramLengthMs = MAX_PROGRAM_LENGTH_MS, }) {
    const parsed = parseTimeRangeText(extractLikelyTimeRange(metadataText));
    if (!parsed) {
        return null;
    }
    const currentUnixMs = normalizePossiblyUnixTimeToMs(currentVideoTime);
    if (currentUnixMs == null) {
        return null;
    }
    const currentDate = new Date(currentUnixMs);
    for (let daysBack = 0; daysBack <= maxDaysBack; daysBack++) {
        const probeDate = new Date(currentDate);
        probeDate.setDate(probeDate.getDate() - daysBack);
        const candidateStart = makeLocalDateForClock(probeDate, parsed.start.hour24, parsed.start.minute).getTime();
        let candidateEnd = makeLocalDateForClock(probeDate, parsed.end.hour24, parsed.end.minute).getTime();
        if (candidateEnd <= candidateStart) {
            candidateEnd += 24 * 60 * 60 * 1000;
        }
        const scheduledDurationMs = candidateEnd - candidateStart;
        if (scheduledDurationMs <= 0 || scheduledDurationMs > maxProgramLengthMs) {
            continue;
        }
        if (candidateStart > currentUnixMs) {
            continue;
        }
        const deltaFromStartMs = currentUnixMs - candidateStart;
        if (deltaFromStartMs < 0 || deltaFromStartMs > maxProgramLengthMs) {
            continue;
        }
        return {
            resolved: true,
            inferredFrom: "unix-current-time",
            metadataText: parsed.raw,
            startTimeUnixMs: candidateStart,
            endTimeUnixMs: candidateEnd,
            currentTimeUnixMs: currentUnixMs,
            deltaFromStartMs,
            daysBack,
            scheduledDurationMs,
        };
    }
    return null;
}
function resolveProgramTiming({ metadataText, currentVideoTime, fallbackPlaybackPositionMs, maxDaysBack = MAX_DAYS_BACK_FOR_UNIX_RESOLUTION, }) {
    const parsed = parseTimeRangeText(extractLikelyTimeRange(metadataText));
    if (!parsed) {
        return {
            resolved: false,
            reason: "metadata-unparseable",
            metadataText,
        };
    }
    const unixResolved = resolveProgramStartFromUnixTime({
        metadataText,
        currentVideoTime,
        maxDaysBack,
    });
    if (unixResolved) {
        return unixResolved;
    }
    const playbackPositionMs = typeof fallbackPlaybackPositionMs === "number" && Number.isFinite(fallbackPlaybackPositionMs)
        ? Math.round(fallbackPlaybackPositionMs)
        : null;
    if (playbackPositionMs != null) {
        return {
            resolved: true,
            inferredFrom: "playback-offset",
            metadataText: parsed.raw,
            startTimeUnixMs: null,
            endTimeUnixMs: null,
            currentTimeUnixMs: null,
            deltaFromStartMs: playbackPositionMs,
            daysBack: null,
            scheduledDurationMs: null,
        };
    }
    return {
        resolved: false,
        reason: "no-usable-current-time",
        metadataText: parsed.raw,
    };
}
installPersistentBitmovinHook();
let lastAddedTimestamp = new Date();
function areTimestampsOneMinuteApart() {
    const difference = Math.abs(new Date() - lastAddedTimestamp);
    return difference <= 60000;
}
const seekInteraction = function (event) {
    lastAddedTimestamp = new Date();
    if (event.source !== window) {
        logger.debug({ methodName: "seekInteraction", message: "event.source !== window" });
        return;
    }
    const event_type = event.data.type;
    if (!event_type) {
        return;
    }
    logger.debug({ methodName: "seekInteraction", message: `event_type[${event_type}]` });
    switch (event_type) {
        case "seek": {
            seek(event.data.timestamp);
            break;
        }
        case "UpdateState": {
            const utils = findSeekUtils();
            if (!utils) {
                return;
            }
            const evt = new CustomEvent("FromNode", {
                detail: {
                    type: "UpdateState",
                    duration: utils.duration,
                    currentPosition: utils.currentPosition,
                    updatedAt: Date.now(),
                },
            });
            window.dispatchEvent(evt);
            break;
        }
        case "GetCurrentTime": {
            let playerCurrentTimeRaw;
            try {
                if (window.__player && typeof window.__player.getCurrentTime === "function") {
                    playerCurrentTimeRaw = window.__player.getCurrentTime();
                }
            }
            catch (error) {
                logger.debug({
                    methodName: "seekInteraction",
                    message: `Error calling getCurrentTime: ${error.message}`,
                });
            }
            const seekUtils = findSeekUtils();
            const metadataText = getPlaybackMetadataText();
            const normalizedPlayerTime = normalizePlayerCurrentTimeRaw(playerCurrentTimeRaw);
            const resolvedTiming = resolveProgramTiming({
                metadataText,
                currentVideoTime: (normalizedPlayerTime === null || normalizedPlayerTime === void 0 ? void 0 : normalizedPlayerTime.kind) === "unix" ? normalizedPlayerTime.raw : undefined,
                fallbackPlaybackPositionMs: seekUtils === null || seekUtils === void 0 ? void 0 : seekUtils.currentPosition,
                maxDaysBack: MAX_DAYS_BACK_FOR_UNIX_RESOLUTION,
            });
            const evt = new CustomEvent("FromNode", {
                detail: {
                    type: "GetCurrentTime",
                    currentTime: typeof (normalizedPlayerTime === null || normalizedPlayerTime === void 0 ? void 0 : normalizedPlayerTime.normalizedMs) === "number" &&
                        !Number.isNaN(normalizedPlayerTime.normalizedMs)
                        ? normalizedPlayerTime.normalizedMs
                        : undefined,
                    currentTimeKind: normalizedPlayerTime === null || normalizedPlayerTime === void 0 ? void 0 : normalizedPlayerTime.kind,
                    currentTimeRaw: normalizedPlayerTime === null || normalizedPlayerTime === void 0 ? void 0 : normalizedPlayerTime.raw,
                    currentTimeUnixPrecision: normalizedPlayerTime === null || normalizedPlayerTime === void 0 ? void 0 : normalizedPlayerTime.unixPrecision,
                    playbackPositionMs: typeof (seekUtils === null || seekUtils === void 0 ? void 0 : seekUtils.currentPosition) === "number"
                        ? Math.round(seekUtils.currentPosition)
                        : undefined,
                    metadataText,
                    resolvedTiming,
                    updatedAt: Date.now(),
                },
            });
            window.dispatchEvent(evt);
            break;
        }
        case "NextEpisode": {
            const nextButton = document.querySelector(".skipToLiveFocused");
            if (nextButton) {
                nextButton.click();
            }
            else {
                const navigator = findNavigator();
                if (navigator && navigator.push) {
                    try {
                        navigator.push(event.data.path);
                    }
                    catch (error) {
                        if (event.data.path) {
                            window.location.href = event.data.path;
                        }
                    }
                }
                else if (event.data.path) {
                    window.location.href = event.data.path;
                }
            }
            break;
        }
    }
};
window.addEventListener("message", seekInteraction, false);
setInterval(() => {
    if (areTimestampsOneMinuteApart()) {
        window.removeEventListener("message", seekInteraction, false);
        window.addEventListener("message", seekInteraction, false);
    }
}, 25000);
console.log("SLING INJECTED SCRIPT");

})();

/******/ })()
;