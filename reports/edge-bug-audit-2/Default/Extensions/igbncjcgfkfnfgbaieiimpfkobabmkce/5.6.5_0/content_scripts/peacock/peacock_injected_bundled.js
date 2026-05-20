/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;
(function () {
    const getReactInternals = (root) => {
        if (root == null) {
            return null;
        }
        var keys = Object.keys(root);
        var key = null;
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].startsWith("__reactFiber$")) {
                key = keys[i];
                break;
            }
        }
        return key ? root[key] : null;
    };
    // New scrubber: [data-testid="scrubber-bar"] with 3 parentElement traversals
    // Props: playerState ("Playing"|"Paused"|"Loading"|"Seeking"),
    //        playbackPosition (seconds), duration (seconds),
    //        seek(timeInSeconds), scrubLimitMax, seekDisabled, pips[]
    const getScrubberApi = () => {
        var _a, _b, _c;
        try {
            const scrubberEl = document.querySelector('[data-testid="scrubber-bar"]');
            if (!scrubberEl)
                return undefined;
            const parent = (_b = (_a = scrubberEl.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.parentElement;
            if (!parent)
                return undefined;
            const fiber = getReactInternals(parent);
            return (_c = fiber === null || fiber === void 0 ? void 0 : fiber.return) === null || _c === void 0 ? void 0 : _c.memoizedProps;
        }
        catch (e) {
            return undefined;
        }
    };
    // this is mainly for live channels (channel section)
    // Live scrubber: [class="playback-scrubber-bar"] — element itself holds the fiber
    // Props: sessionController.currentState ("Playing"|"Paused"|"Loading"|"Seeking"),
    //        elapsedTime (ms), assetLength (ms), seekAndUpdateElapsedTime(ms)
    const getLiveScrubberApi = () => {
        var _a;
        try {
            const scrubberEl = document.querySelector(".playback-scrubber-bar");
            if (!scrubberEl)
                return undefined;
            const fiber = getReactInternals(scrubberEl);
            return (_a = fiber === null || fiber === void 0 ? void 0 : fiber.return) === null || _a === void 0 ? void 0 : _a.memoizedProps;
        }
        catch (e) {
            return undefined;
        }
    };
    // this is mainly for scheduled live events which are mainly sports events
    // Scheduled Live Event sessionController
    // this is used when the live event is scheduled, with the url containing /event/
    const getLiveScheduledEventSessionController = () => {
        var _a, _b, _c, _d;
        try {
            const scrubberEl = document.querySelector("[data-gsp-video-component]");
            if (!scrubberEl)
                return undefined;
            const fiber = getReactInternals(scrubberEl);
            return (_d = (_c = (_b = (_a = fiber === null || fiber === void 0 ? void 0 : fiber.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.state) === null || _c === void 0 ? void 0 : _c.playerController) === null || _d === void 0 ? void 0 : _d.currentSession;
        }
        catch (e) {
            return undefined;
        }
    };
    // Session item
    // this is used to determine if the live event is a scheduled live event/Single Live Event or finished event replay
    // the type gives either "FER" (Finished Event Replay) or "SingleLiveEvent"
    const getSessionItem = () => {
        var _a, _b;
        const scrubberEl = document.querySelector("[data-gsp-video-component]");
        if (!scrubberEl)
            return undefined;
        const fiber = getReactInternals(scrubberEl);
        return (_b = (_a = fiber === null || fiber === void 0 ? void 0 : fiber.return) === null || _a === void 0 ? void 0 : _a.memoizedProps) === null || _b === void 0 ? void 0 : _b.sessionItem;
    };
    const getNextEpisodeApi = () => {
        try {
            return getReactInternals(document.querySelector(".playback-binge__container")).return.memoizedProps;
        }
        catch (e) {
            return undefined;
        }
    };
    let _checkForAds;
    let _isInAd = false;
    // Cache last known scrubber state so we have values during ads (when scrubber is unmounted)
    let _lastKnownState = {
        time: 0,
        duration: 0,
        startOfCredits: 0,
    };
    var seekInteraction = function (e) {
        var _a, _b, _c, _d;
        try {
            if (e.source == window) {
                const messageType = e.data.type;
                const isLive = window.location.pathname.includes("/live/");
                const isEvent = window.location.pathname.includes("/event/");
                if (messageType === "GetState") {
                    const scrubberApi = !isLive && !isEvent ? getScrubberApi() : undefined;
                    const liveScrubberApi = isLive ? getLiveScrubberApi() : undefined;
                    const sleSessionController = isEvent ? getLiveScheduledEventSessionController() : undefined;
                    let isPaused, time, isLoading, isSeeking, isAdPlaying, startOfCredits, duration;
                    if (liveScrubberApi) {
                        // Live scrubber present — live channel playback
                        const sc = liveScrubberApi.sessionController;
                        isPaused = (sc === null || sc === void 0 ? void 0 : sc.currentState) === "Paused";
                        time = liveScrubberApi.elapsedTime; // already ms
                        isLoading = (sc === null || sc === void 0 ? void 0 : sc.currentState) === "Loading";
                        isSeeking = (sc === null || sc === void 0 ? void 0 : sc.currentState) === "Seeking";
                        isAdPlaying = false;
                        duration = liveScrubberApi.assetLength; // already ms
                        startOfCredits = duration; // no credits concept for live
                        // Cache for use during ads when scrubber is unmounted
                        _lastKnownState = { time, duration, startOfCredits };
                    }
                    else if (sleSessionController) {
                        // SLE (Scheduled Live Event) — sessionController held in React state
                        const video = document.querySelector("video");
                        isPaused = sleSessionController.currentState === "Paused";
                        time = ((_a = video === null || video === void 0 ? void 0 : video.currentTime) !== null && _a !== void 0 ? _a : 0) * 1000; // seconds -> ms
                        isLoading = sleSessionController.currentState === "Loading";
                        isSeeking = sleSessionController.currentState === "Seeking";
                        isAdPlaying = false;
                        duration = ((_b = video === null || video === void 0 ? void 0 : video.duration) !== null && _b !== void 0 ? _b : 0) * 1000; // seconds -> ms
                        startOfCredits = duration; // no credits concept for live events
                        // Cache for use during ads when scrubber is unmounted
                        _lastKnownState = { time, duration, startOfCredits };
                    }
                    else if (scrubberApi) {
                        // VOD scrubber present — normal playback (no ad)
                        isPaused = scrubberApi.playerState === "Paused";
                        time = scrubberApi.playbackPosition * 1000; // seconds -> ms
                        isLoading = scrubberApi.playerState === "Loading";
                        isSeeking = scrubberApi.playerState === "Seeking";
                        isAdPlaying = false;
                        duration = scrubberApi.duration * 1000; // seconds -> ms
                        startOfCredits = scrubberApi.scrubLimitMax * 1000; // seconds -> ms (best approx)
                        // Cache for use during ads when scrubber is unmounted
                        _lastKnownState = { time, duration, startOfCredits };
                    }
                    else {
                        // Scrubber is unmounted — ad is likely playing
                        const video = document.querySelector("video");
                        isAdPlaying = video != null && !video.paused;
                        isPaused = false;
                        time = _lastKnownState.time;
                        isLoading = false;
                        isSeeking = false;
                        duration = _lastKnownState.duration;
                        startOfCredits = _lastKnownState.startOfCredits;
                    }
                    if (isAdPlaying && !_isInAd) {
                        console.log("check for ads");
                        _checkForAds = setInterval(() => {
                            seekInteraction({ source: window, data: { type: "GetState" } });
                        }, 1000);
                        _isInAd = true;
                    }
                    else if (!isAdPlaying && _isInAd) {
                        console.log("clear interval");
                        clearInterval(_checkForAds);
                        _isInAd = false;
                    }
                    let evt = new CustomEvent("FromNode", {
                        detail: {
                            type: "UpdateState",
                            isPaused,
                            time,
                            isLoading,
                            isSeeking,
                            isAdPlaying,
                            startOfCredits,
                            duration,
                            updatedAt: Date.now(),
                        },
                    });
                    window.dispatchEvent(evt);
                }
                else if (messageType === "Seek") {
                    const scrubberApi = !isLive && !isEvent ? getScrubberApi() : undefined;
                    const sleSessionController = isEvent ? getLiveScheduledEventSessionController() : undefined;
                    const isScheduledLiveEvent = isEvent && ((_c = getSessionItem()) === null || _c === void 0 ? void 0 : _c.type) !== "FER";
                    console.log("isScheduledLiveEvent", isScheduledLiveEvent, (_d = getSessionItem()) === null || _d === void 0 ? void 0 : _d.type);
                    let isPaused;
                    if (scrubberApi && scrubberApi.seek) {
                        isPaused = scrubberApi.playerState === "Paused";
                        const timeInSeconds = e.data.time / 1000; // ms -> seconds
                        console.log("Seek to", timeInSeconds);
                        scrubberApi.seek(timeInSeconds);
                    }
                    else if (!isScheduledLiveEvent && (sleSessionController === null || sleSessionController === void 0 ? void 0 : sleSessionController.seek)) {
                        isPaused = sleSessionController.currentState === "Paused";
                        const timeInSeconds = e.data.time / 1000; // ms -> seconds
                        console.log("SLE seek to", timeInSeconds);
                        sleSessionController.seek(timeInSeconds);
                    }
                    // live channel seek disabled
                    const evt = new CustomEvent("FromNode", {
                        detail: {
                            type: "Seek",
                            isPaused,
                            updatedAt: Date.now(),
                        },
                    });
                    window.dispatchEvent(evt);
                }
                else if (messageType === "NextEpisode") {
                    const nextEpisodeApi = getNextEpisodeApi();
                    console.log(nextEpisodeApi);
                    const nextEpisodeId = `${nextEpisodeApi.bingePopUpAsset.contentId}/${nextEpisodeApi.bingePopUpAsset.providerVariantId}`;
                    const evt = new CustomEvent("FromNode", {
                        detail: {
                            type: "NextEpisode",
                            nextEpisodeId,
                            updatedAt: Date.now(),
                        },
                    });
                    window.dispatchEvent(evt);
                }
            }
        }
        catch (error) {
            console.error(error);
        }
    };
    if (!window.injectScriptLoaded) {
        window.injectScriptLoaded = true;
        console.log("Loaded TP Peacock Injected");
        window.addEventListener("message", seekInteraction, !1);
    }
})();

/******/ })()
;