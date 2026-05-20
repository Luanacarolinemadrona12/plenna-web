/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

window.seekScriptLoaded = true;
var findReactProps = function () {
    const elementRoot = document.querySelector("main#section_index > div");
    if (elementRoot == null) {
        return null;
    }
    const keys = Object.keys(elementRoot);
    let key = null;
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].startsWith("__reactInternalInstance")) {
            key = keys[i];
            break;
        }
    }
    if (key == null) {
        return null;
    }
    if (typeof elementRoot[key] === "undefined" ||
        typeof elementRoot[key].memoizedProps.children._owner === "undefined") {
        return null;
    }
    return elementRoot[key].memoizedProps.children._owner.memoizedProps;
};
var seekInteraction = function (e) {
    var _a, _b, _c, _d, _e, _f;
    if (e.source == window) {
        if (e.data.type && "NEXT_EPISODE" == e.data.type) {
            const reactProps = findReactProps();
            reactProps.navigate({
                name: "video",
                params: {
                    contentId: e.data.videoId,
                    timerAutoAdvanced: !0,
                },
            });
        }
        if (e.data.type && "teardown" == e.data.type) {
            window.removeEventListener("message", seekInteraction, !1);
            window.seekScriptLoaded = false;
        }
        if (e.data.type && "play" == e.data.type) {
            const player = document.querySelector(".btm-media-player") || document.querySelector("disney-web-player");
            if (player) {
                player.click();
            }
            const togglePlayPause = document.querySelector("toggle-play-pause") ||
                document.querySelector(".toggle-play-pause") ||
                ((_b = (_a = document.querySelector("disney-web-player")) === null || _a === void 0 ? void 0 : _a.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector("toggle-play-pause"));
            if (togglePlayPause && togglePlayPause.shadowRoot) {
                const playButton = togglePlayPause.shadowRoot.querySelector(".play-button");
                if (playButton) {
                    playButton.click();
                }
            }
        }
        if (e.data.type && "pause" == e.data.type) {
            const player = document.querySelector(".btm-media-player") || document.querySelector("disney-web-player");
            if (player) {
                player.click();
            }
            const togglePlayPause = document.querySelector("toggle-play-pause") ||
                document.querySelector(".toggle-play-pause") ||
                ((_d = (_c = document.querySelector("disney-web-player")) === null || _c === void 0 ? void 0 : _c.shadowRoot) === null || _d === void 0 ? void 0 : _d.querySelector("toggle-play-pause"));
            if (togglePlayPause && togglePlayPause.shadowRoot) {
                const pauseButton = togglePlayPause.shadowRoot.querySelector(".pause-button");
                if (pauseButton) {
                    pauseButton.click();
                }
            }
        }
        if (e.data.type && "seek" == e.data.type) {
            const player = document.querySelector(".btm-media-player") || document.querySelector("disney-web-player");
            if (player) {
                player.click();
            }
            const progressBar = document.querySelector("progress-bar") ||
                ((_f = (_e = document.querySelector("disney-web-player")) === null || _e === void 0 ? void 0 : _e.shadowRoot) === null || _f === void 0 ? void 0 : _f.querySelector("progress-bar"));
            if (progressBar && progressBar.shadowRoot) {
                const seekbar = progressBar.shadowRoot.querySelector(".progress-bar__seekable-range");
                if (seekbar) {
                    const thumb = progressBar.shadowRoot.querySelector(".progress-bar__thumb");
                    const maxTime = Number(thumb === null || thumb === void 0 ? void 0 : thumb.getAttribute("aria-valuemax")) || 1;
                    const minTime = Number(thumb === null || thumb === void 0 ? void 0 : thumb.getAttribute("aria-valuemin")) || 0;
                    const progress = e.data.time / ((maxTime - minTime) * 1000);
                    const seekBounds = seekbar.getBoundingClientRect();
                    const n = progress * seekbar.offsetWidth;
                    const x = n + seekBounds.left;
                    const y = seekBounds.top + seekBounds.height / 2;
                    const baseOptions = {
                        pointerId: 1,
                        isPrimary: true,
                        bubbles: true,
                        cancelable: true,
                        composed: true,
                        clientX: x,
                        clientY: y,
                        view: window,
                    };
                    seekbar.dispatchEvent(new PointerEvent("pointerdown", baseOptions));
                    seekbar.dispatchEvent(new PointerEvent("pointerup", baseOptions));
                }
            }
        }
    }
};
window.addEventListener("message", seekInteraction, false);

/******/ })()
;