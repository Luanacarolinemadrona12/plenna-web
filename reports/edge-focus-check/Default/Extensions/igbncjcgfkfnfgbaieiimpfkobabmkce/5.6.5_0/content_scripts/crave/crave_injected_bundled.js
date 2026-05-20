/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

window.seekScriptLoaded = true;
window.offset = 0;
// keep track of episode id: info that we can use to reconstruct the full slug
let episodesMap = {};
// something of the form https://playback.rte-api.bellmedia.ca/contents/<episodeId>
// this lets us know which episode was switched to/started playing
const CONTENTS_RE = /^https:\/\/playback\.rte-api\.bellmedia\.ca\/contents\/([^/?#]+)(?:[?#]|$)/i;
// network request that allows us to construct episode slugs
const EPISODES_RE = /^https:\/\/playback\.rte-api\.bellmedia\.ca\/seasons\/([^/]+)\/episodes(?:[/?#]|$)/i;
// network request that fetches which episode is up next
// should be of the form /contents/<id>/up-next-content
const UP_NEXT_RE = /^https:\/\/playback\.rte-api\.bellmedia\.ca\/contents\/([^/?#]+)\/up-next-content(?:[?#]|$)/i;
function constructSlugFromEpMap(episodeId) {
    // e.g. "https://www.crave.ca/en/play/the-office-movers/familia-s1e1-2988134"
    const currentUrl = window.location.href;
    // extract the base path e.g. "play/the-office-movers"
    // note that we don't extract the en or fr since crave will add that automatically based on settings
    const match = currentUrl.match(/https?:\/\/[^/]+\/[^/]+\/(.*?)(?:\/[^/]*)?$/i);
    if (!match) {
        return null;
    }
    const base = match[1];
    const ep = episodesMap[episodeId];
    if (!ep) {
        return null;
    }
    // slugify episode name. e.g. "Not In Front Of The Client" -> "not-in-front-of-the-client"
    // punctuation is stripped, e.g. "Pop-Up" -> "popup"
    // this seems to be how crave works
    const slugName = ep.contentName
        .toLowerCase()
        .replace(/-/g, "") // remove dashes
        .replace(/[^a-z0-9\s]/g, "") // strip other punctuation
        .trim()
        .replace(/\s+/g, "-");
    // final e.g. https://www.crave.ca/en/play/the-office-movers/not-in-front-of-the-client-2988135
    return `${base}/${slugName}-${ep.contentId}`;
}
function handleJson(url, data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!data)
        return;
    if (CONTENTS_RE.test(url)) {
        const id = (_b = (_a = data === null || data === void 0 ? void 0 : data.contentId) !== null && _a !== void 0 ? _a : data === null || data === void 0 ? void 0 : data.id) !== null && _b !== void 0 ? _b : (_c = data === null || data === void 0 ? void 0 : data.media) === null || _c === void 0 ? void 0 : _c.id;
        const slug = constructSlugFromEpMap(id);
        console.log("got new contents", slug, id, episodesMap);
        if (slug) {
            console.log("POSTING SLUG MESSAGE");
            window.postMessage({
                type: "newEpisodeDetected",
                slug,
            }, "*");
        }
    }
    if (EPISODES_RE.test(url) && Array.isArray(data)) {
        data.forEach((ep) => {
            episodesMap[ep.contentId] = {
                contentId: ep.contentId,
                contentType: ep.contentType,
                episodeNumber: ep.episodeNumber,
                locked: ep.locked,
                contentName: ep.contentName,
            };
        });
    }
    if (UP_NEXT_RE.test(url) && data && typeof data === "object") {
        const epId = (_e = (_d = data.contentId) !== null && _d !== void 0 ? _d : data.id) !== null && _e !== void 0 ? _e : (_f = data.media) === null || _f === void 0 ? void 0 : _f.id;
        if (epId) {
            episodesMap[epId] = {
                contentId: epId,
                contentType: data.contentType,
                episodeNumber: data.episodeNumber,
                locked: data.locked,
                contentName: (_h = (_g = data.name) !== null && _g !== void 0 ? _g : data.contentName) !== null && _h !== void 0 ? _h : (_j = data.media) === null || _j === void 0 ? void 0 : _j.mediaName,
            };
            console.debug("[episodesMap] up-next-content merged:", episodesMap[epId]);
        }
    }
}
function readXhrBody(xhr) {
    const rt = xhr.responseType || "";
    if (rt === "" || rt === "text") {
        return Promise.resolve(xhr.responseText);
    }
    if (rt === "json") {
        return Promise.resolve(JSON.stringify(xhr.response));
    }
    if (rt === "arraybuffer") {
        try {
            const dec = new TextDecoder("utf-8");
            return Promise.resolve(dec.decode(new Uint8Array(xhr.response)));
        }
        catch (_a) {
            return Promise.resolve(null);
        }
    }
    if (rt === "blob" && xhr.response && typeof xhr.response.text === "function") {
        return xhr.response.text(); // returns a Promise<string>
    }
    return Promise.resolve(null);
}
function patchXHR() {
    const OriginalXHR = window.XMLHttpRequest;
    if (!OriginalXHR || OriginalXHR.__patched__) {
        return;
    }
    function XHR() {
        const xhr = new OriginalXHR();
        let url = "";
        const open = xhr.open;
        xhr.open = function (method, u) {
            url = u;
            return open.apply(xhr, arguments);
        };
        xhr.addEventListener("readystatechange", () => {
            if (xhr.readyState !== 4)
                return;
            const type = xhr.getResponseHeader("content-type") || "";
            if ((CONTENTS_RE.test(url) || EPISODES_RE.test(url) || UP_NEXT_RE.test(url)) && type.includes("json")) {
                readXhrBody(xhr).then((text) => {
                    if (!text) {
                        return;
                    }
                    try {
                        handleJson(url, JSON.parse(text));
                    }
                    catch (e) {
                        // try handling parsed json
                        if (xhr.responseType === "json" && xhr.response != null) {
                            try {
                                handleJson(url, xhr.response);
                            }
                            catch (_a) {
                                // give up
                            }
                        }
                        else {
                            // give up
                        }
                    }
                });
            }
        });
        return xhr;
    }
    XHR.prototype = OriginalXHR.prototype;
    window.XMLHttpRequest = XHR;
    window.XMLHttpRequest.__patched__ = true;
}
patchXHR();

/******/ })()
;