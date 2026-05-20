/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

const originalXhrSend = XMLHttpRequest.prototype.send;
// Inject an empty element into the page to store the last canonicalId and featureReferenceId
const emptyElement = document.createElement("div");
emptyElement.id = "teleparty-appletv-id-container";
document.body.appendChild(emptyElement);
function extractVideoId() {
    if (!window.MusicKit) {
        return;
    }
    try {
        const playables = window.MusicKit.getInstance().playbackControllers.serial.services.mediaItemPlayback._currentPlayer
            ._nowPlayingItem.playables[0];
        const newCanonicalId = playables.canonicalId;
        const newFeatureReferenceId = playables.contentId;
        if (newCanonicalId && newFeatureReferenceId) {
            const currentCanonicalId = emptyElement.getAttribute("data-canonical-id");
            const currentFeatureReferenceId = emptyElement.getAttribute("data-feature-reference-id");
            // Only update and post a message if the IDs have changed
            if (newCanonicalId !== currentCanonicalId || newFeatureReferenceId !== currentFeatureReferenceId) {
                emptyElement.setAttribute("data-canonical-id", newCanonicalId);
                emptyElement.setAttribute("data-feature-reference-id", newFeatureReferenceId);
                window.postMessage({
                    type: "idDetected",
                    canonicalId: newCanonicalId,
                    featureReferenceId: newFeatureReferenceId,
                }, "*");
            }
        }
    }
    catch (error) {
        // do nothing
    }
}
function extractSkipMap() {
    var _a, _b, _c;
    try {
        if (!window.MusicKit) {
            return;
        }
        const skipMap = (_c = (_b = (_a = window.MusicKit.getInstance()) === null || _a === void 0 ? void 0 : _a._playbackController) === null || _b === void 0 ? void 0 : _b._skipIntro) === null || _c === void 0 ? void 0 : _c.skipMap;
        if (!skipMap)
            return;
        // Extract only values from the map
        const skipMapArray = Array.from(skipMap.values());
        let skipDataElement = document.getElementById("skip-map-data");
        if (!skipDataElement) {
            skipDataElement = document.createElement("div");
            skipDataElement.id = "skip-map-data";
            skipDataElement.style.display = "none";
            document.body.appendChild(skipDataElement);
        }
        // Store as JSON string
        skipDataElement.setAttribute("data-skip-map", JSON.stringify(skipMapArray));
    }
    catch (error) {
        console.error("Failed to extract skipMap:", error);
    }
}
// Run extractSkipMap every 10 seconds
setInterval(extractSkipMap, 10000);
// Schedule the extractVideoId function to run every 100ms
setInterval(extractVideoId, 100);
// a lot of times on joining party the video doesn't play properly, this helps with that
const handleJoinPartyInterval = () => {
    const interval = setInterval(() => {
        const videoEle = document.querySelector("video");
        if (videoEle && videoEle.src != null && document.querySelector("#chat-wrapper")) {
            const playButton = document.querySelector(".playback-play__play");
            if (playButton && playButton.getAttribute("tabIndex") === "-1") {
                setTimeout(() => {
                    document.querySelector("video").currentTime += 0.01;
                    document.querySelector("video").play();
                }, 5000);
                clearInterval(interval);
            }
        }
    }, 500);
};
handleJoinPartyInterval();

/******/ })()
;