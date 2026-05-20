/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/Teleparty/Enums/PlaybackState.ts
var PlaybackState;
(function (PlaybackState) {
    PlaybackState["LOADING"] = "loading";
    PlaybackState["PLAYING"] = "playing";
    PlaybackState["IDLE"] = "idle";
    PlaybackState["AD_PLAYING"] = "ad_playing";
    PlaybackState["PAUSED"] = "paused";
    PlaybackState["NOT_READY"] = "not_ready";
})(PlaybackState || (PlaybackState = {}));

;// ./src/Teleparty/ContentScripts/Crunchyroll/crunchyroll_injected.js

const NEW_UI_BOTTOM_CONTROLS = '[data-testid="bottom-controls-autohide"]';
const NEW_UI_CURRENT_MEDIA_INFO = ".erc-current-media-info";
const isNewCrunchyrollUi = () => !!document.querySelector(NEW_UI_BOTTOM_CONTROLS);
/** Vilos iframe bridge, or in-page player (no `iframe.video-player`). */
const shouldRunCrunchyrollInjected = () => window !== top || isNewCrunchyrollUi();
if (!shouldRunCrunchyrollInjected()) {
    // Content script only injects when the new UI control mount exists; iframe player always `window !== top`.
}
else {
    console.log("Crunchyroll injected");
    // Playback Control Variables
    let buttonViewTimeout;
    let CRUNCHYROLL_CONTROLS_TIMEOUT = 1500;
    const getDomNodeReactFiberKey = (el) => {
        if (!el)
            return null;
        const keys = Object.keys(el);
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].startsWith("__reactFiber$")) {
                return keys[i];
            }
        }
        return null;
    };
    const parseNewUiEpisodeNumber = (mediaTitle) => {
        if (!mediaTitle || typeof mediaTitle !== "string") {
            return 0;
        }
        const m = mediaTitle.match(/^E(\d+)\s*-/i);
        return m ? parseInt(m[1], 10) : 0;
    };
    const getNewUiVideoInformationFromCurrentMedia = (duration) => {
        var _a, _b;
        const mediaEl = document.querySelector(NEW_UI_CURRENT_MEDIA_INFO);
        const fiberKey = getDomNodeReactFiberKey(mediaEl);
        if (!mediaEl || !fiberKey || !mediaEl[fiberKey]) {
            return null;
        }
        const p = (_a = mediaEl[fiberKey].return) === null || _a === void 0 ? void 0 : _a.memoizedProps;
        if (!p || p.id == null) {
            return null;
        }
        return {
            episodeNumber: parseNewUiEpisodeNumber(p.mediaTitle),
            videoTitle: (_b = p.mediaTitle) !== null && _b !== void 0 ? _b : "",
            videoType: "",
            videoId: String(p.id),
            seriesId: p.parentId != null ? String(p.parentId) : "",
            duration: duration !== null && duration !== void 0 ? duration : 0,
        };
    };
    const getNewUiSeekTo = () => {
        var _a, _b, _c, _d, _e;
        const el = document.querySelector(NEW_UI_BOTTOM_CONTROLS);
        const key = getDomNodeReactFiberKey(el);
        if (!key || !(el === null || el === void 0 ? void 0 : el[key])) {
            return null;
        }
        const seekTo = (_e = (_d = (_c = (_b = (_a = el[key].child) === null || _a === void 0 ? void 0 : _a.child) === null || _b === void 0 ? void 0 : _b.child) === null || _c === void 0 ? void 0 : _c.child) === null || _d === void 0 ? void 0 : _d.memoizedProps) === null || _e === void 0 ? void 0 : _e.seekTo;
        return typeof seekTo === "function" ? seekTo : null;
    };
    const settingsObserver = new MutationObserver((mutationRecords) => {
        for (const mutation of mutationRecords) {
            if (mutation.type === "childList") {
                const settingsMenu = document.getElementById("velocity-settings-menu");
                const pageControlVisible = !!document.querySelector("[data-testid=vilos-play_pause_button]");
                const middleContainer = document.querySelector("[data-testid=middleBarContainer]");
                if (middleContainer) {
                    middleContainer.style.display = "none";
                }
                if (settingsMenu) {
                    settingsMenu.style.zIndex = "9999";
                }
                if (pageControlVisible) {
                    if (buttonViewTimeout) {
                        clearTimeout(buttonViewTimeout);
                    }
                    _relayMessage({ type: "alterPageControls", menuVisible: true });
                }
                else {
                    if (buttonViewTimeout) {
                        clearTimeout(buttonViewTimeout);
                    }
                    buttonViewTimeout = setTimeout(() => {
                        _relayMessage({ type: "alterPageControls", menuVisible: false });
                    }, CRUNCHYROLL_CONTROLS_TIMEOUT);
                }
            }
        }
    });
    const getPlayerVideoElement = () => {
        var _a;
        if (isNewCrunchyrollUi()) {
            const withSrc = document.querySelector("video[src]");
            if (withSrc) {
                return withSrc;
            }
            return document.querySelector("video");
        }
        return (_a = document.querySelector("#player0")) !== null && _a !== void 0 ? _a : document.querySelector("video");
    };
    if (!window.crunchyrollInjectedMessageListenerBound) {
        window.crunchyrollInjectedMessageListenerBound = true;
        window.addEventListener("message", function (evt) {
            var _a, _b, _c, _d;
            var eventExists = evt.data.infoSending;
            if (eventExists) {
                var type = eventExists.type;
            }
            else {
                return;
            }
            if (type === "getVideoData") {
                const videoInfo = getCurrentVideoInformation();
                if (videoInfo) {
                    const newEvent = { type: "VideoData", videoData: videoInfo };
                    _relayMessage(newEvent);
                }
            }
            else if (type === "playVideo") {
                if (document.querySelector('[data-test-state="stopped"]')) {
                    document.querySelector('[data-test-state="stopped"]').click();
                }
                else {
                    (_a = getPlayerVideoElement()) === null || _a === void 0 ? void 0 : _a.play();
                }
            }
            else if (type === "pauseVideo") {
                (_b = getPlayerVideoElement()) === null || _b === void 0 ? void 0 : _b.pause();
            }
            else if (type === "updateState") {
                const playerVideo = getPlayerVideoElement();
                const playerstate = {
                    time: ((_c = playerVideo === null || playerVideo === void 0 ? void 0 : playerVideo.currentTime) !== null && _c !== void 0 ? _c : 0) * 1000,
                    playbackState: _getPlaybackState(),
                };
                const newEvent = { type: "updatedState", playerState: playerstate };
                _relayMessage(newEvent);
            }
            else if (type === "seekTo") {
                const timeMs = evt.data.infoSending.eventData.time;
                if (isNewCrunchyrollUi()) {
                    const seekTo = getNewUiSeekTo();
                    seekTo === null || seekTo === void 0 ? void 0 : seekTo(timeMs / 1000);
                }
                else {
                    const props = getProp();
                    (_d = props === null || props === void 0 ? void 0 : props.playerActions) === null || _d === void 0 ? void 0 : _d.requestSeekToContentTime(timeMs / 1000);
                }
            }
            else if (type === "jumpToNext") {
                jumpToNext();
            }
            else if (type === "moveControls") {
                hideControls();
            }
            else if (type === "unmoveControls") {
                unhideControls();
            }
            else if (type === "continueParty") {
                if (document.querySelector('[data-test-state="stopped"]')) {
                    document.querySelector('[data-test-state="stopped"]').click();
                }
            }
        });
    }
    const hideControls = () => {
        const controlsContainer = document.getElementById("velocity-controls-package");
        if (controlsContainer) {
            controlsContainer.style.transform = "translateY(50px)";
        }
    };
    const unhideControls = () => {
        const controlsContainer = document.getElementById("velocity-controls-package");
        if (controlsContainer) {
            controlsContainer.style.transform = "";
        }
    };
    var _checkAdStart = function () {
        const currentlyInAd = !!document.querySelector('[data-testid="vilos-ad_label"]') || getInAd();
        if (!currentlyInAd) {
            _relayMessage({ type: "onAdEnd" });
        }
        else {
            _relayMessage({ type: "onAdStart" });
        }
    };
    var _onFullScreen = function () {
        _relayMessage({ type: "onFullscreen" });
    };
    var _onClick = function () {
        _relayMessage({ type: "onUserInteraction" });
    };
    var _onPress = function (event) {
        _relayMessage({ type: "onUserInteraction" });
        if (event.key == "Escape") {
            _relayMessage({ type: "exitFullscreen" });
        }
    };
    var _relayMessage = function (messageObj) {
        top.postMessage(messageObj, "*");
    };
    /** New UI: sync party state when the user scrubs, changes speed/volume, or buffers — same bridge as play/pause (`onUserInteraction`). */
    const NEW_UI_VIDEO_ACTION_DEBOUNCE_MS = 150;
    let _newUiVideoActionDebounceTimer = null;
    const _relayNewUiUserPlaybackAction = function () {
        if (!isNewCrunchyrollUi()) {
            return;
        }
        _relayMessage({ type: "onUserInteraction" });
    };
    const _relayNewUiUserPlaybackActionDebounced = function () {
        if (!isNewCrunchyrollUi()) {
            return;
        }
        if (_newUiVideoActionDebounceTimer) {
            clearTimeout(_newUiVideoActionDebounceTimer);
        }
        _newUiVideoActionDebounceTimer = setTimeout(function () {
            _newUiVideoActionDebounceTimer = null;
            _relayMessage({ type: "onUserInteraction" });
        }, NEW_UI_VIDEO_ACTION_DEBOUNCE_MS);
    };
    const attachNewUiVideoPlaybackListeners = function (video) {
        if (!video || !isNewCrunchyrollUi()) {
            return;
        }
        video.addEventListener("seeking", _relayNewUiUserPlaybackActionDebounced);
        video.addEventListener("seeked", _relayNewUiUserPlaybackAction);
        video.addEventListener("ratechange", _relayNewUiUserPlaybackAction);
        video.addEventListener("volumechange", _relayNewUiUserPlaybackAction);
        video.addEventListener("ended", _relayNewUiUserPlaybackAction);
        video.addEventListener("waiting", _relayNewUiUserPlaybackActionDebounced);
        video.addEventListener("playing", _relayNewUiUserPlaybackAction);
    };
    var _getPlaybackState = function () {
        const video = getPlayerVideoElement();
        if (video == undefined) {
            return PlaybackState.NOT_READY;
        }
        else if (video.readyState < 4) {
            return PlaybackState.LOADING;
        }
        else if (video.paused) {
            return PlaybackState.PAUSED;
        }
        else {
            return PlaybackState.PLAYING;
        }
    };
    const startListening = () => {
        if (!window.crunchyrollInjectedIsListening) {
            setInterval(() => {
                _checkAdStart();
            }, 2000);
            const video = getPlayerVideoElement();
            const velocityPlayerPackage = document.getElementById("velocity-player-package");
            const velocityControlsPackage = document.getElementById("velocity-controls-package");
            if (velocityPlayerPackage) {
                velocityPlayerPackage.style.position = "fixed";
            }
            if (velocityControlsPackage) {
                velocityControlsPackage.style.position = "fixed";
            }
            let targetSettings = document.getElementById("velocity-controls-package");
            if (targetSettings) {
                settingsObserver.observe(targetSettings, { attributes: true, childList: true, subtree: true });
            }
            if (video) {
                video.addEventListener("loadstart", () => {
                    _relayMessage({ type: "videoLoadStart" });
                });
                video.addEventListener("play", () => {
                    _relayMessage({ type: "onUserInteraction" });
                });
                video.addEventListener("pause", () => {
                    _relayMessage({ type: "onUserInteraction" });
                });
                attachNewUiVideoPlaybackListeners(video);
            }
            window.addEventListener("mouseup", (e) => {
                _onClick(e);
            });
            window.addEventListener("keyup", (e) => {
                _onPress(e);
            });
            document.addEventListener("fullscreenchange", () => {
                _onFullScreen();
            });
            const vilosRoot = document.querySelector("#vilosRoot");
            if (vilosRoot) {
                vilosRoot.webkitRequestFullscreen = function () {
                    _relayMessage({ type: "onFullscreen" });
                };
                vilosRoot.msRequestFullscreen = function () {
                    _relayMessage({ type: "onFullscreen" });
                };
                vilosRoot.requestFullscreen = function () {
                    _relayMessage({ type: "onFullscreen" });
                };
            }
            window.videoIdScriptLoaded = true;
        }
        window.crunchyrollInjectedIsListening = true;
    };
    var getInAd = function () {
        var _a, _b, _c;
        try {
            const elementRoot = getPlayerVideoElement();
            if (elementRoot == null) {
                return null;
            }
            const keys = Object.keys(elementRoot);
            let key = null;
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].startsWith("__reactInternal")) {
                    key = keys[i];
                    break;
                }
            }
            const isInAd = (_c = (_b = (_a = elementRoot[key].return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.props) === null || _c === void 0 ? void 0 : _c.isInAdBreak;
            return isInAd;
        }
        catch (err) {
            return undefined;
        }
    };
    var getProp = function () {
        const elementRoot = getPlayerVideoElement();
        if (elementRoot == null) {
            return null;
        }
        const keys = Object.keys(elementRoot);
        let key = null;
        for (let i = 0; i < keys.length; i++) {
            if (keys[i].startsWith("__reactInternal")) {
                key = keys[i];
                break;
            }
        }
        return elementRoot[key].return.stateNode.props;
    };
    var jumpToNext = function () {
        const props = getProp();
        props.playerActions.ended();
    };
    var getCurrentVideoInformation = function () {
        var _a, _b, _c;
        try {
            const elementRoot = getPlayerVideoElement();
            if (elementRoot == null) {
                return null;
            }
            if (isNewCrunchyrollUi()) {
                const duration = (_a = elementRoot.duration) !== null && _a !== void 0 ? _a : 0;
                const fromCurrentMedia = getNewUiVideoInformationFromCurrentMedia(duration);
                if (fromCurrentMedia) {
                    return fromCurrentMedia;
                }
                return {
                    episodeNumber: 0,
                    videoTitle: "",
                    videoType: "",
                    videoId: "",
                    seriesId: "",
                    duration,
                };
            }
            const keys = Object.keys(elementRoot);
            let key = null;
            for (let i = 0; i < keys.length; i++) {
                if (keys[i].startsWith("__reactInternal")) {
                    key = keys[i];
                    break;
                }
            }
            const section_path = elementRoot[key].return.stateNode.props.configuration.metadata;
            if (key == null || typeof elementRoot[key] === "undefined" || typeof section_path === "undefined") {
                return null;
            }
            var VideoInformationObject = {
                episodeNumber: section_path.sequenceNumber,
                videoTitle: section_path.title,
                videoType: section_path.type,
                videoId: section_path.id,
                seriesId: section_path.seriesId,
                duration: (_c = (_b = getPlayerVideoElement()) === null || _b === void 0 ? void 0 : _b.duration) !== null && _c !== void 0 ? _c : 0,
            };
            return VideoInformationObject;
        }
        catch (err) {
            return undefined;
        }
    };
    const waitForVideoAndStartListening = () => {
        var _a;
        if (window.crunchyrollInjectedIsListening) {
            return;
        }
        const maxWaitForVideoMs = 60000;
        let intervalId = null;
        let timeoutId = null;
        let observer = null;
        const cleanup = () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            if (observer) {
                observer.disconnect();
                observer = null;
            }
        };
        const tryStartListening = () => {
            const video = getPlayerVideoElement();
            if (!video) {
                return false;
            }
            startListening();
            cleanup();
            return true;
        };
        if (tryStartListening()) {
            return;
        }
        intervalId = setInterval(() => {
            if (tryStartListening()) {
                cleanup();
            }
        }, 250);
        observer = new MutationObserver(() => {
            if (tryStartListening()) {
                cleanup();
            }
        });
        const observerTarget = (_a = document.documentElement) !== null && _a !== void 0 ? _a : document.body;
        if (observerTarget) {
            observer.observe(observerTarget, { childList: true, subtree: true });
        }
        // Avoid unbounded polling/observing in frames where player video never mounts.
        timeoutId = setTimeout(() => {
            cleanup();
        }, maxWaitForVideoMs);
    };
    waitForVideoAndStartListening();
}

/******/ })()
;