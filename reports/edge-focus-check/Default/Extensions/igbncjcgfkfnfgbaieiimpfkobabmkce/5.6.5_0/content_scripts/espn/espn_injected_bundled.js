/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

var _relayMessage = function (messageObj) {
    console.log("Sent: " + messageObj);
    top.postMessage(messageObj, "*");
};
var jumpToNext = function () {
    console.log("Implement next episode");
};
var getPlayer = function () {
    return document.querySelector("video");
};
var _onClick = function () {
    // Ignore generic clicks for playback sync to avoid noisy duplicate broadcasts.
};
var _onPress = function (event) {
    if (event.key == "Escape") {
        _relayMessage({ type: "exitFullscreen" });
    }
};
if (window == top && !window.topScriptLoaded) {
    window.topScriptLoaded = true;
    console.log("TOP SCRIPT LOADED");
    window.addEventListener("message", function (evt) {
        var eventExists = evt.data.infoSending;
        if (eventExists) {
            var type = eventExists.type;
            if (type === "startListeningVideo") {
                console.log("Start listening received");
                let fullscreenDomTarget = "#vjs_video_3";
                document.querySelector(fullscreenDomTarget).webkitRequestFullscreen = function () {
                    _relayMessage({ type: "onFullscreen" });
                };
                document.querySelector(fullscreenDomTarget).msRequestFullscreen = function () {
                    _relayMessage({ type: "onFullscreen" });
                };
                document.querySelector(fullscreenDomTarget).requestFullscreen = function () {
                    _relayMessage({ type: "onFullscreen" });
                };
            }
        }
    });
}
if (window != top && !window.videoIdScriptLoaded && window.location.href.includes("plus.espn.")) {
    console.log("INJECTING SCRIPT", window.location.href);
    window.videoIdScriptLoaded = true;
    let buttonViewTimeout;
    const CONTROLS_TIMEOUT = 1500;
    const settingsObserver = new MutationObserver((mutationRecords) => {
        for (const mutation of mutationRecords) {
            if (mutation.type === "childList") {
                const pageControlVisible = !!document.querySelector(".progress-bar-container");
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
                    }, CONTROLS_TIMEOUT);
                }
            }
        }
    });
    const videoObserver = new MutationObserver((mutationRecords) => {
        for (const mutation of mutationRecords) {
            if (mutation.type === "childList") {
                console.log("Video has changed sources");
            }
        }
    });
    let isVideoListening = false;
    let attachedVideo = null;
    const onVideoLoadStart = () => {
        _relayMessage({ type: "videoLoadStart" });
    };
    const onWindowMouseUp = (e) => {
        _onClick(e);
    };
    const onWindowKeyUp = (e) => {
        _onPress(e);
    };
    const attachVideoListeners = (video) => {
        if (!video || attachedVideo === video) {
            return;
        }
        if (attachedVideo) {
            detachVideoListeners(attachedVideo);
        }
        video.addEventListener("loadstart", onVideoLoadStart);
        attachedVideo = video;
    };
    const detachVideoListeners = (video) => {
        if (!video) {
            return;
        }
        video.removeEventListener("loadstart", onVideoLoadStart);
        if (attachedVideo === video) {
            attachedVideo = null;
        }
    };
    const startVideoListening = () => {
        if (isVideoListening) {
            const currentVideo = getPlayer();
            if (currentVideo && currentVideo !== attachedVideo) {
                attachVideoListeners(currentVideo);
            }
            return;
        }
        const video = getPlayer();
        if (video) {
            attachVideoListeners(video);
        }
        window.addEventListener("mouseup", onWindowMouseUp);
        window.addEventListener("keyup", onWindowKeyUp);
        isVideoListening = true;
    };
    const stopVideoListening = () => {
        if (!isVideoListening) {
            return;
        }
        settingsObserver.disconnect();
        videoObserver.disconnect();
        if (attachedVideo) {
            detachVideoListeners(attachedVideo);
        }
        window.removeEventListener("mouseup", onWindowMouseUp);
        window.removeEventListener("keyup", onWindowKeyUp);
        if (buttonViewTimeout) {
            clearTimeout(buttonViewTimeout);
        }
        isVideoListening = false;
    };
    window.addEventListener("message", function (evt) {
        var eventExists = evt.data.infoSending;
        if (eventExists) {
            var type = eventExists.type;
            if (type === "seekTo") {
                getPlayer().currentTime = evt.data.infoSending.eventData.time / 1000;
            }
            if (type === "jumpToNext") {
                jumpToNext();
            }
            if (type === "startListeningVideo") {
                let fullscreenDomTarget = ".btm-media-player";
                startVideoListening();
                let targetSettings = document.querySelector(".btm-media-overlays-container");
                const fullscreenTarget = document.querySelector(fullscreenDomTarget);
                if (fullscreenTarget) {
                    fullscreenTarget.webkitRequestFullscreen = function () {
                        _relayMessage({ type: "onFullscreen" });
                    };
                    fullscreenTarget.msRequestFullscreen = function () {
                        _relayMessage({ type: "onFullscreen" });
                    };
                    fullscreenTarget.requestFullscreen = function () {
                        _relayMessage({ type: "onFullscreen" });
                    };
                }
                if (targetSettings) {
                    settingsObserver.disconnect();
                    settingsObserver.observe(targetSettings, { attributes: true, childList: true, subtree: true });
                }
            }
            if (type === "stopListeningVideo") {
                console.log("Stop listening received");
                stopVideoListening();
            }
        }
    });
}
;
(function () {
    if (window.tpEspnMediaBridgeLoaded) {
        return;
    }
    window.tpEspnMediaBridgeLoaded = true;
    const getMediaPlayer = () => {
        const host = document.querySelector("disney-web-player");
        return host ? host.mediaPlayer : undefined;
    };
    const getStatePayload = () => {
        var _a, _b;
        const mediaPlayer = getMediaPlayer();
        const info = (_a = mediaPlayer === null || mediaPlayer === void 0 ? void 0 : mediaPlayer.timeline) === null || _a === void 0 ? void 0 : _a.info;
        const status = mediaPlayer === null || mediaPlayer === void 0 ? void 0 : mediaPlayer.playbackStatus;
        const playhead = info === null || info === void 0 ? void 0 : info.playheadPositionMs;
        if (typeof playhead !== "number" || !isFinite(playhead)) {
            return {
                ok: false,
                error: "mediaPlayer.timeline.info.playheadPositionMs unavailable",
            };
        }
        return {
            ok: true,
            state: {
                playheadPositionMs: Math.floor(playhead),
                seekableDurationMs: typeof (info === null || info === void 0 ? void 0 : info.seekableDurationMs) === "number" ? Math.floor(info.seekableDurationMs) : null,
                programDurationMs: typeof (info === null || info === void 0 ? void 0 : info.programDurationMs) === "number" ? Math.floor(info.programDurationMs) : null,
                seekableStartMs: typeof (info === null || info === void 0 ? void 0 : info.seekableStartMs) === "number" ? Math.floor(info.seekableStartMs) : null,
                seekableEndMs: typeof (info === null || info === void 0 ? void 0 : info.seekableEndMs) === "number" ? Math.floor(info.seekableEndMs) : null,
                currentState: (_b = status === null || status === void 0 ? void 0 : status.currentState) !== null && _b !== void 0 ? _b : null,
                notready: !!(status === null || status === void 0 ? void 0 : status.notready),
            },
        };
    };
    const onMessage = (event) => {
        if (event.source !== window || !event.data || typeof event.data.type !== "string") {
            return;
        }
        if (event.data.type === "TP_ESPN_GET_MEDIA_PLAYER_STATE") {
            const payload = getStatePayload();
            window.postMessage(Object.assign({ type: "TP_ESPN_MEDIA_PLAYER_STATE", requestId: event.data.requestId }, payload), "*");
            return;
        }
        if (event.data.type === "TP_ESPN_SEEK_MEDIA_PLAYER") {
            const mediaPlayer = getMediaPlayer();
            const timeMs = event.data.timeMs;
            if (!mediaPlayer || typeof mediaPlayer.seek !== "function" || typeof timeMs !== "number" || !isFinite(timeMs)) {
                window.postMessage({
                    type: "TP_ESPN_SEEK_MEDIA_PLAYER_RESULT",
                    requestId: event.data.requestId,
                    ok: false,
                    error: "mediaPlayer.seek unavailable",
                }, "*");
                return;
            }
            try {
                mediaPlayer.seek(timeMs);
                window.postMessage({
                    type: "TP_ESPN_SEEK_MEDIA_PLAYER_RESULT",
                    requestId: event.data.requestId,
                    ok: true,
                }, "*");
            }
            catch (error) {
                window.postMessage({
                    type: "TP_ESPN_SEEK_MEDIA_PLAYER_RESULT",
                    requestId: event.data.requestId,
                    ok: false,
                    error: String(error),
                }, "*");
            }
        }
    };
    window.addEventListener("message", onMessage, false);
})();

/******/ })()
;