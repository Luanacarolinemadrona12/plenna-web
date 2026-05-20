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
    var _relayMessage = function (messageObj) {
        //console.log("Sent: " + messageObj)
        top.postMessage(messageObj, "*");
    };
    const getContentId = () => {
        const videoCore = document.querySelector("[data-testid='videoCore']");
        if (!videoCore) {
            return null;
        }
        const internals = getReactInternals(videoCore);
        if (!internals) {
            return null;
        }
        let current = internals;
        while (current) {
            if (current.memoizedProps && current.memoizedProps.contentId) {
                return current.memoizedProps.contentId;
            }
            current = current.return;
        }
        return null;
    };
    const getCurrentVideoInformation = () => {
        try {
            const contentId = getContentId();
            if (!contentId) {
                return null;
            }
            return {
                videoId: contentId,
            };
        }
        catch (e) {
            console.error("Error getting video information", e);
            return null;
        }
    };
    if (!window.injectScriptLoaded) {
        window.injectScriptLoaded = true;
        window.addEventListener("message", function (evt) {
            var eventExists = evt.data.infoSending;
            if (eventExists) {
                var type = eventExists.type;
                if (type === "getVideoData") {
                    const videoInfo = getCurrentVideoInformation();
                    if (videoInfo) {
                        const newEvent = { type: "VideoData", videoData: videoInfo };
                        _relayMessage(newEvent);
                    }
                }
            }
        });
        console.log("Loaded TP Canal+ Injected");
    }
})();

/******/ })()
;