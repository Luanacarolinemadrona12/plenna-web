/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/Teleparty/Constants/Services/Fancode.ts
const HIGHLIGHTS = Object.freeze("video-highlights");
const LIVE_MATCH_PAGE_TYPES = Object.freeze([
    "live-match-info",
    "fantasy",
    "commentary",
    "scorecard",
    "squad",
    "key-moments"
]);
const VIDEO_ELEMENT_SELECTOR = "video.vjs-tech";
const VIDEO_ELEMENT_SELECTOR_2 = 'video[class*="StyledVideo"]'; // fancode has 2 types of video no idea why
const TITLE_ELEMENT_SELECTOR = '[class*="VideoPlayerTitleLabel"]';
const AD_CLASS_NAME = 'video[title="Advertisement"]';
const INSTREAM_AD_ID = '[id*="instream-video"]';
const MATCH_INFO_QUERY_PARAM = Object.freeze({
    tag: "type",
    value: "match-info",
});
const FANCODE_CONSTANTS = Object.freeze({
    VIDEO_ELEMENT_SELECTOR,
    VIDEO_ELEMENT_SELECTOR_2,
    TITLE_ELEMENT_SELECTOR,
    MATCH_INFO_QUERY_PARAM,
    AD_CLASS_NAME,
    INSTREAM_AD_ID,
    LIVE_MATCH_PAGE_TYPES,
    HIGHLIGHTS,
});
/* harmony default export */ const Fancode = (FANCODE_CONSTANTS);

;// ./src/Teleparty/BrowseScripts/Fancode/fancode_browse_injected.js

// navigation api is better approach but it is currently not supported in safari. please check later if it or anything similar is added
// if ("navigation" in window) {
//     window.navigation.addEventListener("navigatesuccess", () => {
//         const url = new URL(window.location.href)
//         if (FANCODE_CONSTANTS.LIVE_MATCH_PAGE_TYPES.some((pageType) => url.pathname.includes(pageType))) {
//             const params = url.searchParams
//             if (params.has(FANCODE_CONSTANTS.MATCH_INFO_QUERY_PARAM.tag)) return
//             const videoElements = document.querySelectorAll("video")
//             if (videoElements.length === 0) {
//                 params.append(
//                     FANCODE_CONSTANTS.MATCH_INFO_QUERY_PARAM.tag,
//                     FANCODE_CONSTANTS.MATCH_INFO_QUERY_PARAM.value,
//                 )
//                 window.history.replaceState(null, "", url.toString())
//             }
//         }
//     })
// }
const handleMatchInfoType = () => {
    let prevUrl = "";
    let isLinkSame = false;
    document.addEventListener("click", () => {
        isLinkSame = prevUrl === window.location.href;
        prevUrl = window.location.href;
        if (isLinkSame) {
            const videoElements = document.querySelectorAll("video");
            if ((videoElements === null || videoElements === void 0 ? void 0 : videoElements.length) !== 0)
                return;
        }
        setTimeout(() => {
            const url = new URL(window.location.href);
            if (Fancode.LIVE_MATCH_PAGE_TYPES.some((pageType) => url.pathname.includes(pageType))) {
                const params = url.searchParams;
                if (params.has(Fancode.MATCH_INFO_QUERY_PARAM.tag))
                    return;
                const videoElements = document.querySelectorAll("video");
                if ((videoElements === null || videoElements === void 0 ? void 0 : videoElements.length) !== 0) {
                    // there are video elements then
                    // no query params added then don't do anything
                    if (!params.has(Fancode.MATCH_INFO_QUERY_PARAM.tag))
                        return;
                    params.delete(Fancode.MATCH_INFO_QUERY_PARAM.tag); // remove if there's param
                    window.history.replaceState(null, "", url.toString());
                    return;
                }
                // if no video then add params
                params.append(Fancode.MATCH_INFO_QUERY_PARAM.tag, Fancode.MATCH_INFO_QUERY_PARAM.value);
                window.history.replaceState(null, "", url.toString());
            }
        }, 7000);
    });
};
handleMatchInfoType();

/******/ })()
;