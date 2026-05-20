/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 1385
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
const originalFetch = window.fetch;
function createAdBreakLocationsContainerIfNeeded() {
    if (!document.getElementById("tp-ad-break-locations-container")) {
        const adLocContainer = document.createElement("div");
        adLocContainer.id = "tp-ad-break-locations-container";
        document.body.appendChild(adLocContainer);
    }
}
function getAdBreaksAsJson() {
    const adLocContainer = document.getElementById("tp-ad-break-locations-container");
    const adBreakLocations = adLocContainer.getAttribute("data-ad-break-locations");
    return JSON.parse(adBreakLocations);
}
window.fetch = function (input, init) {
    return __awaiter(this, arguments, void 0, function* () {
        const response = yield originalFetch.apply(this, arguments);
        try {
            const data = yield response.clone().json(); // Clone the response to avoid consuming it
            const adBreakLocations = data === null || data === void 0 ? void 0 : data.adBreaks;
            if (adBreakLocations) {
                createAdBreakLocationsContainerIfNeeded();
                const adLocContainer = document.getElementById("tp-ad-break-locations-container");
                adLocContainer.setAttribute("data-ad-break-locations", JSON.stringify(adBreakLocations));
                window.postMessage({ type: "adBreakLocations", adBreakLocations }, "*");
            }
        }
        catch (e) {
            // Do nothing
        }
        return response;
    });
};
function ensurePlayerStateContainer() {
    let el = document.getElementById("tp-player-state");
    if (!el) {
        el = document.createElement("div");
        el.id = "tp-player-state";
        el.style.display = "none";
        document.body.appendChild(el);
    }
    return el;
}
function updatePlayerState() {
    const video = document.querySelector("video");
    const player = video && video.player;
    if (!player)
        return;
    const el = ensurePlayerStateContainer();
    if (typeof player.streamTime === "number") {
        el.setAttribute("data-stream-time", String(player.streamTime));
    }
    if (typeof player.contentTime === "number") {
        el.setAttribute("data-content-time", String(player.contentTime));
    }
    el.setAttribute("data-is-ad", String(!!player.isAd));
    if (typeof player.getAdBreakTimes === "function") {
        try {
            const adBreaks = player.getAdBreakTimes();
            if (adBreaks) {
                el.setAttribute("data-ad-breaks", JSON.stringify(adBreaks));
            }
        }
        catch (e) {
            // getAdBreakTimes may throw if player state is invalid
        }
    }
    const seekTo = el.getAttribute("data-seek-to");
    if (seekTo) {
        el.removeAttribute("data-seek-to");
        const seekSeconds = parseFloat(seekTo);
        if (Number.isFinite(seekSeconds) && typeof player.seek === "function") {
            player.seek(seekSeconds);
        }
    }
}
setInterval(updatePlayerState, 200);


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__[1385].call(__webpack_exports__);
/******/ 	
/******/ })()
;