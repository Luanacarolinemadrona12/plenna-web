/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 1305
() {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
;
(() => {
    if (window.__foxOneWpfBridgeInstalled)
        return;
    window.__foxOneWpfBridgeInstalled = true;
    console.log("INSTALLING BRIDGE");
    const REQUEST_TYPE = "FOX_ONE_WPF_BRIDGE_REQUEST";
    const RESPONSE_TYPE = "FOX_ONE_WPF_BRIDGE_RESPONSE";
    function getPlayer() {
        var _a, _b, _c, _d, _e, _f, _g;
        return ((_g = (_c = (_b = (_a = document.querySelector(".wpf-ui-seekbar")) === null || _a === void 0 ? void 0 : _a.component) === null || _b === void 0 ? void 0 : _b.player) !== null && _c !== void 0 ? _c : (_f = (_e = (_d = window === null || window === void 0 ? void 0 : window.wpf) === null || _d === void 0 ? void 0 : _d.playerManager) === null || _e === void 0 ? void 0 : _e.instances) === null || _f === void 0 ? void 0 : _f[0]) !== null && _g !== void 0 ? _g : null);
    }
    function safeCall(fn, fallback = undefined) {
        try {
            return fn();
        }
        catch (_a) {
            return fallback;
        }
    }
    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    function dispatchPointerLikeClick(target, clientX, clientY) {
        const base = {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            clientX,
            clientY,
            button: 0,
            buttons: 1,
        };
        if (typeof PointerEvent === "function") {
            target.dispatchEvent(new PointerEvent("pointerover", Object.assign(Object.assign({}, base), { pointerId: 1, pointerType: "mouse" })));
            target.dispatchEvent(new PointerEvent("pointerenter", Object.assign(Object.assign({}, base), { pointerId: 1, pointerType: "mouse" })));
            target.dispatchEvent(new PointerEvent("pointerdown", Object.assign(Object.assign({}, base), { pointerId: 1, pointerType: "mouse" })));
        }
        target.dispatchEvent(new MouseEvent("mouseover", base));
        target.dispatchEvent(new MouseEvent("mouseenter", base));
        target.dispatchEvent(new MouseEvent("mousemove", base));
        target.dispatchEvent(new MouseEvent("mousedown", base));
        if (typeof PointerEvent === "function") {
            target.dispatchEvent(new PointerEvent("pointerup", Object.assign(Object.assign({}, base), { pointerId: 1, pointerType: "mouse" })));
        }
        target.dispatchEvent(new MouseEvent("mouseup", base));
        target.dispatchEvent(new MouseEvent("click", base));
    }
    function clickLiveSeekbarStartThenReset() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const seekbar = (_b = (_a = document.querySelector(".wpf-ui-seekbar")) !== null && _a !== void 0 ? _a : document.querySelector('[class*="seekbar"]')) !== null && _b !== void 0 ? _b : document.querySelector('[role="slider"]');
            if (!(seekbar instanceof Element)) {
                throw new Error("Seekbar element not found");
            }
            const rect = seekbar.getBoundingClientRect();
            if (!rect.width || !rect.height) {
                throw new Error("Seekbar has invalid rect");
            }
            // Click just inside the left edge of the seekbar.
            const clientX = rect.left + Math.min(2, Math.max(1, rect.width * 0.01));
            const clientY = rect.top + rect.height / 2;
            dispatchPointerLikeClick(seekbar, clientX, clientY);
            yield sleep(1000);
            const player = getPlayer();
            const video = (_c = safeCall(() => {
                const container = typeof (player === null || player === void 0 ? void 0 : player.getContainer) === "function" ? player.getContainer() : null;
                return container instanceof Element ? container.querySelector("video") : document.querySelector("video");
            }, null)) !== null && _c !== void 0 ? _c : document.querySelector("video");
            // Prefer live-aware APIs first, then fall back.
            if (player && typeof player.timeShift === "function") {
                return yield player.timeShift(0);
            }
            if (player && typeof player.seek === "function") {
                return yield player.seek(0);
            }
            if (video instanceof HTMLVideoElement) {
                video.currentTime = 0;
                return true;
            }
            throw new Error("No supported reset method found");
        });
    }
    function getPlayerMethods(player) {
        if (!player)
            return [];
        const methodNames = new Set();
        let proto = player;
        while (proto && proto !== Object.prototype) {
            for (const name of Object.getOwnPropertyNames(proto)) {
                try {
                    if (typeof player[name] === "function") {
                        methodNames.add(name);
                    }
                }
                catch (e) {
                    // getOwnPropertyNames may throw if player state is invalid
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
        return Array.from(methodNames).sort();
    }
    function getPlayerSignature(player) {
        if (!player)
            return null;
        const container = typeof player.getContainer === "function" ? safeCall(() => player.getContainer(), null) : null;
        const video = container instanceof Element ? container.querySelector("video") : document.querySelector("video");
        return {
            hasPlayer: true,
            containerClassName: container instanceof Element ? container.className || "" : "",
            containerTagName: container instanceof Element ? container.tagName : "",
            videoSrc: video instanceof HTMLVideoElement ? video.currentSrc || video.src || "" : "",
            duration: typeof player.getDuration === "function" ? safeCall(() => player.getDuration()) : undefined,
            playbackType: typeof player.getPlaybackType === "function" ? safeCall(() => player.getPlaybackType()) : undefined,
            manifest: typeof player.getManifest === "function" ? safeCall(() => player.getManifest()) : undefined,
        };
    }
    function getAdState() {
        var _a, _b, _c, _d;
        let player = getPlayer();
        const adLabelExists = !!((_a = document.querySelector(".ad-remaining-time-label")) === null || _a === void 0 ? void 0 : _a.innerHTML);
        if (!player || !(typeof player.getActiveAdBreak === "function")) {
            player = (_d = (_c = (_b = window === null || window === void 0 ? void 0 : window.wpf) === null || _b === void 0 ? void 0 : _b.playerManager) === null || _c === void 0 ? void 0 : _c.instances) === null || _d === void 0 ? void 0 : _d[0];
        }
        if (!player) {
            return {
                isAdActive: false,
                hasActiveAdObject: false,
                hasActiveAdBreak: false,
                adLabelExists,
                isInAdMode: adLabelExists,
            };
        }
        const isAdActive = typeof player.isAdActive === "function" ? !!safeCall(() => player.isAdActive(), false) : false;
        const activeAd = typeof player.getActiveAd === "function" ? safeCall(() => player.getActiveAd(), null) : null;
        const activeAdBreak = typeof player.getActiveAdBreak === "function" ? safeCall(() => player.getActiveAdBreak(), null) : null;
        return {
            isAdActive,
            hasActiveAdObject: !!activeAd,
            hasActiveAdBreak: !!activeAdBreak,
            adLabelExists,
            isInAdMode: isAdActive || !!activeAd || !!activeAdBreak || adLabelExists,
        };
    }
    function serializeValue(value, depth = 0, seen = new WeakSet()) {
        if (value == null)
            return value;
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
            return value;
        }
        if (typeof value === "function") {
            return `[Function ${value.name || "anonymous"}(${value.length})]`;
        }
        if (typeof value !== "object") {
            return String(value);
        }
        if (seen.has(value))
            return "[Circular]";
        if (depth > 3)
            return "[MaxDepth]";
        seen.add(value);
        if (Array.isArray(value)) {
            return value.map((x) => serializeValue(x, depth + 1, seen));
        }
        const out = {};
        for (const key of Reflect.ownKeys(value)) {
            try {
                out[String(key)] = serializeValue(value[key], depth + 1, seen);
            }
            catch (err) {
                out[String(key)] = `[Throws: ${(err === null || err === void 0 ? void 0 : err.message) || String(err)}]`;
            }
        }
        return out;
    }
    function invokePlayerMethod(method, args) {
        return __awaiter(this, void 0, void 0, function* () {
            const player = getPlayer();
            if (!player) {
                throw new Error("window.wpf.playerManager.instances[0] not found");
            }
            const fn = player === null || player === void 0 ? void 0 : player[method];
            if (typeof fn !== "function") {
                throw new Error(`Player method not found: ${method}`);
            }
            return yield fn.apply(player, args);
        });
    }
    function getProperty(property) {
        const player = getPlayer();
        if (!player) {
            throw new Error("window.wpf.playerManager.instances[0] not found");
        }
        return player[property];
    }
    function getPlayerState() {
        const player = getPlayer();
        const adState = getAdState();
        if (!player) {
            return {
                hasPlayer: false,
                methods: [],
                isPlaying: false,
                isPaused: false,
                isStalled: false,
                isLive: false,
                isAdActive: adState.isAdActive,
                currentTime: undefined,
                duration: undefined,
                seekableRange: undefined,
                activeAd: undefined,
                activeAdBreak: undefined,
                playbackType: undefined,
                droppedVideoFrames: undefined,
                totalStalledTime: undefined,
                playerSignature: null,
            };
        }
        const isLive = typeof player.isLive === "function" ? safeCall(() => player.isLive()) : undefined;
        return {
            hasPlayer: true,
            methods: getPlayerMethods(player),
            isPlaying: typeof player.isPlaying === "function" ? safeCall(() => player.isPlaying()) : undefined,
            isPaused: typeof player.isPaused === "function" ? safeCall(() => player.isPaused()) : undefined,
            isStalled: typeof player.isStalled === "function" ? safeCall(() => player.isStalled()) : undefined,
            isLive,
            isAdActive: adState.isInAdMode,
            currentTime: isLive === true
                ? typeof player.getTimeShift === "function"
                    ? safeCall(() => player.getTimeShift())
                    : undefined
                : typeof player.getCurrentTime === "function"
                    ? safeCall(() => player.getCurrentTime())
                    : undefined,
            duration: typeof player.getDuration === "function" ? safeCall(() => player.getDuration()) : undefined,
            seekableRange: typeof player.getSeekableRange === "function" ? safeCall(() => player.getSeekableRange()) : undefined,
            activeAd: typeof player.getActiveAd === "function" ? safeCall(() => player.getActiveAd()) : undefined,
            activeAdBreak: typeof player.getActiveAdBreak === "function" ? safeCall(() => player.getActiveAdBreak()) : undefined,
            playbackType: typeof player.getPlaybackType === "function" ? safeCall(() => player.getPlaybackType()) : undefined,
            droppedVideoFrames: typeof player.getDroppedVideoFrames === "function"
                ? safeCall(() => player.getDroppedVideoFrames())
                : undefined,
            totalStalledTime: typeof player.getTotalStalledTime === "function"
                ? safeCall(() => player.getTotalStalledTime())
                : undefined,
            playerSignature: getPlayerSignature(player),
        };
    }
    window.addEventListener("message", (event) => __awaiter(void 0, void 0, void 0, function* () {
        if (event.source !== window)
            return;
        const data = event.data;
        if (!data || data.type !== REQUEST_TYPE)
            return;
        const { id, command, method, property, args = [] } = data;
        try {
            let result;
            switch (command) {
                case "ping":
                    result = { ok: true, hasPlayer: !!getPlayer() };
                    break;
                case "hasPlayer":
                    result = !!getPlayer();
                    break;
                case "getPlayerState":
                    result = getPlayerState();
                    break;
                case "getPlayerMethods":
                    result = getPlayerMethods(getPlayer());
                    break;
                case "getPlayerSignature":
                    result = getPlayerSignature(getPlayer());
                    break;
                case "getAdState":
                    result = getAdState();
                    break;
                case "call":
                    result = yield invokePlayerMethod(method, args);
                    break;
                case "get": {
                    const player = getPlayer();
                    if (!player) {
                        throw new Error("window.wpf.playerManager.instances[0] not found");
                    }
                    if (!(property in player)) {
                        throw new Error(`Player property not found: ${property}`);
                    }
                    result = getProperty(property);
                    break;
                }
                case "play":
                    result = yield invokePlayerMethod("play", []);
                    break;
                case "pause":
                    result = yield invokePlayerMethod("pause", []);
                    break;
                case "load":
                    result = yield invokePlayerMethod("load", args);
                    break;
                case "clickLiveSeekbarStartThenReset":
                    result = yield clickLiveSeekbarStartThenReset();
                    break;
                default:
                    throw new Error(`Unknown command: ${command}`);
            }
            window.postMessage({
                type: RESPONSE_TYPE,
                id,
                ok: true,
                result: serializeValue(result),
            }, "*");
        }
        catch (error) {
            window.postMessage({
                type: RESPONSE_TYPE,
                id,
                ok: false,
                error: (error === null || error === void 0 ? void 0 : error.message) || String(error),
            }, "*");
        }
    }));
})();


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__[1305].call(__webpack_exports__);
/******/ 	
/******/ })()
;