/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

if (!window.videoIdScriptLoaded) {
    console.log("Browse script loaded");
    window.videoIdScriptLoaded = true;
    window.addEventListener("TubiTvVideoMessage", function (evt) {
        var type = evt.detail.type;
        if (type === "getVideoLookupData") {
            let title;
            const titleEl = document.querySelector(".web-poster__image-element");
            if (titleEl) {
                title = titleEl.getAttribute("alt");
            }
            const nextEl = document.querySelector(".atvwebplayersdk-nexttitle-button");
            const type = nextEl ? "TV" : "MOVIE";
            let releaseYear = undefined;
            const yearEl = document.querySelector(".web-attributes__year-duration");
            if (yearEl) {
                releaseYear = yearEl.textContent.split(" ")[0];
            }
            const newEvent = new CustomEvent("FromNode", {
                detail: {
                    type: "GetLookupData",
                    data: { title, type, releaseYear },
                },
            });
            window.dispatchEvent(newEvent);
        }
    });
}

/******/ })()
;