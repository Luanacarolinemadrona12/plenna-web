/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

if (!window.videoIdScriptLoaded) {
    console.log("Browse script loaded");
    window.videoIdScriptLoaded = true;
    window.addEventListener("AmazonVideoMessage", function (evt) {
        var _a;
        var type = evt.detail.type;
        if (type === "getVideoId") {
            const videoId = findTitle();
            if (videoId) {
                const newEvent = new CustomEvent("FromNode", {
                    detail: { type: "VideoId", videoId: videoId, updatedAt: new Date().getTime() },
                });
                window.dispatchEvent(newEvent);
            }
        }
        else if (type === "getVideoLookupData") {
            const el = findElementWithTitleContext();
            const key = Object.keys(el).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
            const titleContext = el[key].return.stateNode.context.title.titleInfo;
            const title = (_a = titleContext.seriesTitle) !== null && _a !== void 0 ? _a : titleContext.title;
            const type = titleContext.episodeNumber ? "TV" : "MOVIE";
            const newEvent = new CustomEvent("FromNode", {
                detail: {
                    type: "GetLookupData",
                    data: { title, type },
                },
            });
            window.dispatchEvent(newEvent);
        }
        else if (type === "seekToPosition") {
            const requestedMs = Number(evt.detail.positionMs);
            const ok = seekToPositionMs(requestedMs);
            const newEvent = new CustomEvent("FromNode", {
                detail: {
                    type: "SeekToPositionResult",
                    ok,
                    positionMs: Number.isFinite(requestedMs) ? requestedMs : null,
                    updatedAt: Date.now(),
                },
            });
            window.dispatchEvent(newEvent);
        }
        else if (type === "handlePlayPause") {
            const fn = getPlayPauseFunction({
                preventDefault: () => {
                    // amazon's old UI requires a preventDefault and a stopPropagation on the "event"
                    // so we pass empty arrows here
                },
                stopPropagation: () => {
                    //nothing
                },
            });
            if (fn) {
                fn();
            }
            else {
                const vid = getVideoElement();
                evt.detail.direction === "play" ? vid.play() : vid.pause();
            }
        }
    });
    var findTitle = function () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5;
        try {
            const elementRoots = document.querySelectorAll(".atvwebplayersdk-title-text");
            let elementRoot = null;
            let elementRootFallback = null;
            for (var i = 0; i < elementRoots.length; i++) {
                if (elementRoots[i].innerText) {
                    elementRoot = elementRoots[i];
                }
                else if (elementRoots[i].clientHeight > 0) {
                    elementRootFallback = elementRoots[i];
                }
            }
            if (elementRoot == null) {
                elementRoot = elementRootFallback || elementRoots[0];
            }
            if (elementRoot) {
                const keys = Object.keys(elementRoot);
                let key = null;
                for (let i = 0; i < keys.length; i++) {
                    if (keys[i].startsWith("__reactInternalInstance")) {
                        key = keys[i];
                        break;
                    }
                }
                const titlePath = ((_g = (_f = (_e = (_d = (_c = (_b = (_a = elementRoot[key]) === null || _a === void 0 ? void 0 : _a.return) === null || _b === void 0 ? void 0 : _b.return) === null || _c === void 0 ? void 0 : _c.stateNode) === null || _d === void 0 ? void 0 : _d.context) === null || _e === void 0 ? void 0 : _e.stores) === null || _f === void 0 ? void 0 : _f.pin) === null || _g === void 0 ? void 0 : _g.currentTitleId) ||
                    ((_q = (_p = (_o = (_m = (_l = (_k = (_j = (_h = elementRoot[key]) === null || _h === void 0 ? void 0 : _h.return) === null || _j === void 0 ? void 0 : _j.return) === null || _k === void 0 ? void 0 : _k.stateNode) === null || _l === void 0 ? void 0 : _l.context) === null || _m === void 0 ? void 0 : _m.stores) === null || _o === void 0 ? void 0 : _o.pin) === null || _p === void 0 ? void 0 : _p.clickstreamReporter) === null || _q === void 0 ? void 0 : _q.asin);
                if (titlePath) {
                    return titlePath;
                }
            }
            var titleId = null;
            var el = document.querySelector(".dv-player-fullscreen");
            if (el === null || el === void 0 ? void 0 : el._reactRootContainer) {
                titleId =
                    el._reactRootContainer._internalRoot.current.child.stateNode.props.context.config.webPlayer
                        .currentTitleId;
                if (titleId)
                    return titleId;
            }
            el = document.querySelector(".draper-player-container");
            if (el === null || el === void 0 ? void 0 : el._reactRootContainer) {
                titleId =
                    el._reactRootContainer._internalRoot.current.child.stateNode.props.context.config.webPlayer
                        .currentTitleId;
                if (titleId)
                    return titleId;
            }
            const match = [...document.querySelectorAll("*")].find((el) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                const key = Object.keys(el).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
                if (!key)
                    return false;
                const node = el[key];
                return (!!((_d = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.context) === null || _c === void 0 ? void 0 : _c.webPlayer) === null || _d === void 0 ? void 0 : _d.currentTitleId) ||
                    !!((_j = (_h = (_g = (_f = (_e = node === null || node === void 0 ? void 0 : node.return) === null || _e === void 0 ? void 0 : _e.stateNode) === null || _f === void 0 ? void 0 : _f.context) === null || _g === void 0 ? void 0 : _g.title) === null || _h === void 0 ? void 0 : _h.titleInfo) === null || _j === void 0 ? void 0 : _j.titleId) ||
                    !!((_o = (_m = (_l = (_k = node === null || node === void 0 ? void 0 : node.return) === null || _k === void 0 ? void 0 : _k.stateNode) === null || _l === void 0 ? void 0 : _l.context) === null || _m === void 0 ? void 0 : _m.clickstreamService) === null || _o === void 0 ? void 0 : _o.titleId));
            });
            console.log("AVIDEOPLAYER GOT MATCH", match);
            if (match) {
                const key = Object.keys(match).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
                const node = match[key];
                const fallbackTitleId = (_1 = (_v = (_u = (_t = (_s = (_r = node === null || node === void 0 ? void 0 : node.return) === null || _r === void 0 ? void 0 : _r.stateNode) === null || _s === void 0 ? void 0 : _s.context) === null || _t === void 0 ? void 0 : _t.webPlayer) === null || _u === void 0 ? void 0 : _u.currentTitleId) !== null && _v !== void 0 ? _v : (_0 = (_z = (_y = (_x = (_w = node === null || node === void 0 ? void 0 : node.return) === null || _w === void 0 ? void 0 : _w.stateNode) === null || _x === void 0 ? void 0 : _x.context) === null || _y === void 0 ? void 0 : _y.title) === null || _z === void 0 ? void 0 : _z.titleInfo) === null || _0 === void 0 ? void 0 : _0.titleId) !== null && _1 !== void 0 ? _1 : (_5 = (_4 = (_3 = (_2 = node === null || node === void 0 ? void 0 : node.return) === null || _2 === void 0 ? void 0 : _2.stateNode) === null || _3 === void 0 ? void 0 : _3.context) === null || _4 === void 0 ? void 0 : _4.clickstreamService) === null || _5 === void 0 ? void 0 : _5.titleId;
                if (fallbackTitleId) {
                    console.log("GOT FALLBACK TITLE ID", fallbackTitleId);
                    return fallbackTitleId;
                }
            }
            return null;
        }
        catch (err) {
            console.error("FIND TITLE ERROR", err);
            return undefined;
        }
    };
}
const getReactInternalNode = (el) => {
    if (!el)
        return null;
    const key = Object.keys(el).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
    return key ? el[key] : null;
};
const findElementWithSeekContext = () => {
    return [...document.querySelectorAll("*")].find((el) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const key = Object.keys(el).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
        if (!key)
            return false;
        const node = el[key];
        return (!!((_e = (_d = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.props) === null || _c === void 0 ? void 0 : _c.context) === null || _d === void 0 ? void 0 : _d.seekBar) === null || _e === void 0 ? void 0 : _e.seekToPosition) ||
            !!((_j = (_h = (_g = (_f = node === null || node === void 0 ? void 0 : node.return) === null || _f === void 0 ? void 0 : _f.stateNode) === null || _g === void 0 ? void 0 : _g.context) === null || _h === void 0 ? void 0 : _h.seekBar) === null || _j === void 0 ? void 0 : _j.seekToPosition));
    });
};
const getPlayPauseFunction = () => {
    var _a, _b, _c, _d, _e;
    let fallbackNode = null;
    for (const el of document.querySelectorAll("*")) {
        const key = Object.keys(el).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
        if (!key)
            continue;
        const node = el[key];
        const stateNode = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode;
        if (!stateNode)
            continue;
        const playPauseFn = typeof stateNode.handlePlayPause === "function"
            ? stateNode.handlePlayPause
            : typeof stateNode.onPlayPauseInteraction === "function"
                ? stateNode.onPlayPauseInteraction
                : null;
        if (!playPauseFn)
            continue;
        const positionMs = (_e = (_d = (_c = (_b = stateNode === null || stateNode === void 0 ? void 0 : stateNode.context) === null || _b === void 0 ? void 0 : _b.seekBar) === null || _c === void 0 ? void 0 : _c.seekBar) === null || _d === void 0 ? void 0 : _d.positionMs) !== null && _e !== void 0 ? _e : 0;
        // Prefer the first one with a non-zero seekbar position
        if (positionMs !== 0) {
            return playPauseFn;
        }
        // Otherwise keep the first valid fallback
        if (!fallbackNode) {
            fallbackNode = stateNode;
        }
    }
    if (!fallbackNode)
        return undefined;
    return typeof fallbackNode.handlePlayPause === "function"
        ? fallbackNode.handlePlayPause
        : fallbackNode.onPlayPauseInteraction;
};
const findElementWithTitleContext = () => {
    return [...document.querySelectorAll("*")].find((el) => {
        var _a, _b, _c, _d;
        const key = Object.keys(el).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
        if (!key)
            return false;
        const node = el[key];
        return !!((_d = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.context) === null || _c === void 0 ? void 0 : _c.title) === null || _d === void 0 ? void 0 : _d.titleInfo);
    });
};
const findReleaseDate = () => {
    return [...document.querySelectorAll("*")].find((el) => {
        var _a, _b, _c, _d;
        const key = Object.keys(el).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
        if (!key)
            return false;
        const node = el[key];
        return !!((_d = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.context) === null || _c === void 0 ? void 0 : _c.title) === null || _d === void 0 ? void 0 : _d.titleInfo);
    });
};
const getSeekBarContext = () => {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const match = findElementWithSeekContext();
        if (!match)
            return null;
        const key = Object.keys(match).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
        if (!key)
            return null;
        const node = match[key];
        return ((_d = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.props) === null || _c === void 0 ? void 0 : _c.context) === null || _d === void 0 ? void 0 : _d.seekBar) || ((_g = (_f = (_e = node === null || node === void 0 ? void 0 : node.return) === null || _e === void 0 ? void 0 : _e.stateNode) === null || _f === void 0 ? void 0 : _f.context) === null || _g === void 0 ? void 0 : _g.seekBar) || null;
    }
    catch (err) {
        console.error("getSeekBarContext error", err);
        return null;
    }
};
const getVideoElement = () => {
    const videos = Array.from(document.querySelectorAll("video"));
    if (videos.length === 0) {
        return null;
    }
    // Prefer videos that have started loading
    const candidates = videos.filter((v) => v.readyState > 0);
    if (candidates.length > 0) {
        // Pick the most "ready" one
        return candidates.reduce((best, current) => (current.readyState > best.readyState ? current : best));
    }
    // Fallback: just return the first video
    return videos[0];
};
const seekToPositionMs = (positionMs) => {
    try {
        const ms = Number(positionMs);
        if (!Number.isFinite(ms) || ms < 0) {
            console.warn("seekToPositionMs invalid positionMs", positionMs);
            return false;
        }
        const seekBar = getSeekBarContext();
        if (!seekBar || typeof seekBar.seekToPosition !== "function") {
            console.warn("seekToPositionMs could not find seekBar.seekToPosition");
            return false;
        }
        seekBar.seekToPosition(ms);
        return true;
    }
    catch (err) {
        console.error("seekToPositionMs error", err);
        return false;
    }
};
const findElementWithTimelineContext = (root = document) => {
    var _a, _b, _c;
    const allEls = root.querySelectorAll("*");
    let firstTimelineEl = null;
    for (const el of allEls) {
        const node = getReactInternalNode(el);
        const timeline = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.context) === null || _c === void 0 ? void 0 : _c.timeline;
        const timelineInfo = timeline === null || timeline === void 0 ? void 0 : timeline.timelineInfo;
        if (!timelineInfo)
            continue;
        if (!firstTimelineEl) {
            firstTimelineEl = el;
        }
        if (timelineInfo.positionMs != null && timelineInfo.positionMs !== 0) {
            return el;
        }
    }
    return firstTimelineEl;
};
const findElementWithSeekbarPositionContext = () => {
    var _a, _b, _c, _d;
    let fallback = null;
    for (const el of document.querySelectorAll("*")) {
        const key = Object.keys(el).find((k) => k.startsWith("__reactInternalInstance") || k.startsWith("__reactFiber"));
        if (!key)
            continue;
        const node = el[key];
        const seekBar = (_d = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.context) === null || _c === void 0 ? void 0 : _c.seekBar) === null || _d === void 0 ? void 0 : _d.seekBar;
        if (!seekBar)
            continue;
        // Prefer first non-zero immediately
        if (seekBar.positionMs && seekBar.positionMs !== 0) {
            return el;
        }
        // Save first valid zero as fallback
        if (!fallback) {
            fallback = el;
        }
    }
    return fallback;
};
const findElementWithAdContext = (root = document) => {
    var _a, _b, _c;
    const allEls = root.querySelectorAll("*");
    for (const el of allEls) {
        const node = getReactInternalNode(el);
        const adPlayback = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.context) === null || _c === void 0 ? void 0 : _c.adPlayback;
        if (adPlayback) {
            return el;
        }
    }
    return null;
};
const getPropsAlt2 = () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    try {
        const timelineEl = findElementWithTimelineContext();
        const sbPosEl = findElementWithSeekbarPositionContext();
        const node = getReactInternalNode(timelineEl);
        const timelineInfo = (_d = (_c = (_b = (_a = node === null || node === void 0 ? void 0 : node.return) === null || _a === void 0 ? void 0 : _a.stateNode) === null || _b === void 0 ? void 0 : _b.context) === null || _c === void 0 ? void 0 : _c.timeline) === null || _d === void 0 ? void 0 : _d.timelineInfo;
        const seekbarPosition = (_e = getReactInternalNode(sbPosEl)) === null || _e === void 0 ? void 0 : _e.return.stateNode.context.seekBar.seekBar.positionMs;
        const adEl = findElementWithAdContext();
        const adInfo = getReactInternalNode(adEl).return.stateNode.context.adPlayback.currentAdInfo;
        const duration = ((_f = timelineInfo === null || timelineInfo === void 0 ? void 0 : timelineInfo.lastPlayablePositionMs) !== null && _f !== void 0 ? _f : 0) +
            Math.max(0, (seekbarPosition !== null && seekbarPosition !== void 0 ? seekbarPosition : 0) - ((_g = timelineInfo === null || timelineInfo === void 0 ? void 0 : timelineInfo.positionMs) !== null && _g !== void 0 ? _g : 0));
        return {
            positionMs: (_h = seekbarPosition !== null && seekbarPosition !== void 0 ? seekbarPosition : timelineInfo === null || timelineInfo === void 0 ? void 0 : timelineInfo.positionMs) !== null && _h !== void 0 ? _h : null,
            lastPlayablePositionMs: duration,
            state: (_p = (_o = (_m = (_l = (_k = (_j = node === null || node === void 0 ? void 0 : node.return) === null || _j === void 0 ? void 0 : _j.stateNode) === null || _k === void 0 ? void 0 : _k.context) === null || _l === void 0 ? void 0 : _l.uiStatus) === null || _m === void 0 ? void 0 : _m.uiStatus) === null || _o === void 0 ? void 0 : _o.state) !== null && _p !== void 0 ? _p : null,
            currentAdInfo: adInfo,
            _timelineEl: timelineEl,
        };
    }
    catch (err) {
        console.error("getPropsAlt2 error", err);
        return null;
    }
};
const getProps = () => {
    const parentEls = document.querySelectorAll(".webPlayerSDKContainer");
    let el = null;
    [...parentEls].forEach((parentEl) => {
        var _a;
        if ((_a = parentEl.querySelector("video")) === null || _a === void 0 ? void 0 : _a.src) {
            el = parentEl;
        }
    });
    return getReactInternalNode(el.querySelector(".atvwebplayersdk-bottompanel-container")).return.memoizedState;
};
const getPropsAlt = () => {
    var _a, _b, _c, _d, _e;
    try {
        const parentEls = document.querySelectorAll(".webPlayerSDKContainer");
        let el = null;
        [...parentEls].forEach((parentEl) => {
            var _a;
            if ((_a = parentEl.querySelector("video")) === null || _a === void 0 ? void 0 : _a.src) {
                el = parentEl;
            }
        });
        if (!el) {
            el = document;
        }
        let rootAdProps = (_a = el.querySelector(".webPlayerUIContainer")) === null || _a === void 0 ? void 0 : _a._reactRootContainer._internalRoot.current.memoizedState.element.props.context.adPlayback;
        let rootTimelineProps = (_b = el.querySelector(".webPlayerUIContainer")) === null || _b === void 0 ? void 0 : _b._reactRootContainer._internalRoot.current.child.stateNode.props.context.seekBar.seekBar;
        let rootPlayProps = (_c = el.querySelector(".webPlayerUIContainer")) === null || _c === void 0 ? void 0 : _c._reactRootContainer._internalRoot.current.child.memoizedState;
        if (!el.querySelector(".webPlayerUIContainer")) {
            const altEl = document.querySelector(".dv-player-fullscreen");
            if (altEl) {
                rootAdProps =
                    altEl === null || altEl === void 0 ? void 0 : altEl._reactRootContainer._internalRoot.current.memoizedState.element.props.context.adPlayback;
                rootTimelineProps =
                    altEl === null || altEl === void 0 ? void 0 : altEl._reactRootContainer._internalRoot.current.child.stateNode.props.context.seekBar.seekBar;
                rootPlayProps = altEl === null || altEl === void 0 ? void 0 : altEl._reactRootContainer._internalRoot.current.child.memoizedState;
            }
        }
        let rootMainProps = null;
        try {
            rootMainProps = (_d = getReactInternalNode(el.querySelector(".atvwebplayersdk-player-container"))) === null || _d === void 0 ? void 0 : _d.child.child.child.child.sibling.child.return.sibling.sibling.sibling.memoizedState;
        }
        catch (_f) {
            rootMainProps = (_e = getReactInternalNode(el.querySelector(".atvwebplayersdk-player-container"))) === null || _e === void 0 ? void 0 : _e.child.child.child.child.sibling.sibling.sibling.memoizedState;
        }
        let playbackProps = Object.assign(Object.assign({}, rootMainProps), { currentAdInfo: (rootAdProps === null || rootAdProps === void 0 ? void 0 : rootAdProps.currentAdInfo) || null });
        if (!(playbackProps === null || playbackProps === void 0 ? void 0 : playbackProps.lastPlayablePositionMs) && (rootTimelineProps === null || rootTimelineProps === void 0 ? void 0 : rootTimelineProps.lastPlayablePositionMs)) {
            playbackProps.lastPlayablePositionMs = rootTimelineProps.lastPlayablePositionMs;
            playbackProps.positionMs = rootTimelineProps.positionMs;
        }
        if (rootPlayProps === null || rootPlayProps === void 0 ? void 0 : rootPlayProps.playbackState) {
            if ((playbackProps === null || playbackProps === void 0 ? void 0 : playbackProps.state) === undefined) {
                playbackProps.state = rootPlayProps.playbackState;
            }
        }
        return playbackProps;
    }
    catch (err) {
        return null;
    }
};
function updateState(event) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (event.source == window && event.data.type === "UpdateState") {
        const props = getPropsAlt();
        const altProps = getPropsAlt2();
        const mergedProps = Object.assign(Object.assign(Object.assign({}, props), (altProps !== null && altProps !== void 0 ? altProps : {})), { positionMs: (_b = (_a = altProps === null || altProps === void 0 ? void 0 : altProps.positionMs) !== null && _a !== void 0 ? _a : props === null || props === void 0 ? void 0 : props.positionMs) !== null && _b !== void 0 ? _b : null, lastPlayablePositionMs: (_d = (_c = altProps === null || altProps === void 0 ? void 0 : altProps.lastPlayablePositionMs) !== null && _c !== void 0 ? _c : props === null || props === void 0 ? void 0 : props.lastPlayablePositionMs) !== null && _d !== void 0 ? _d : null, state: (_f = (_e = altProps === null || altProps === void 0 ? void 0 : altProps.state) !== null && _e !== void 0 ? _e : props === null || props === void 0 ? void 0 : props.state) !== null && _f !== void 0 ? _f : null, currentAdInfo: (_h = (_g = altProps.currentAdInfo) !== null && _g !== void 0 ? _g : props === null || props === void 0 ? void 0 : props.currentAdInfo) !== null && _h !== void 0 ? _h : null });
        if (mergedProps) {
            const evt = new CustomEvent("FromNode", {
                detail: {
                    type: "UpdateState",
                    duration: mergedProps.lastPlayablePositionMs,
                    currentTime: mergedProps.positionMs,
                    state: mergedProps.state === "Playing" ? "playing" : "paused",
                    adPlaying: mergedProps.currentAdInfo !== null,
                    updatedAt: Date.now(),
                },
            });
            window.dispatchEvent(evt);
        }
    }
    else if (event.source == window && event.data.type === "SeekToPosition") {
        const requestedMs = Number(event.data.positionMs);
        const ok = seekToPositionMs(requestedMs);
        const evt = new CustomEvent("FromNode", {
            detail: {
                type: "SeekToPositionResult",
                ok,
                positionMs: Number.isFinite(requestedMs) ? requestedMs : null,
                updatedAt: Date.now(),
            },
        });
        window.dispatchEvent(evt);
    }
}
window.addEventListener("message", updateState, false);

/******/ })()
;