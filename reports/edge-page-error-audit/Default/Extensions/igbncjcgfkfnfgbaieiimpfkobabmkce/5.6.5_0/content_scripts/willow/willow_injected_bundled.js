/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

if (!window.anchorNavListenerLoaded) {
    window.anchorNavListenerLoaded = true;
    document.addEventListener("click", function (event) {
        const anchor = event.target.closest("a");
        if (!anchor || !anchor.href)
            return;
        let url;
        try {
            url = new URL(anchor.href);
        }
        catch (_a) {
            return;
        }
        if (url.hostname.includes(".willow.tv")) {
            window.postMessage({ type: "FROM_PAGE", text: "anchor navigation", href: anchor.href }, "*");
        }
    }, true);
}

/******/ })()
;