/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

window.seekScriptLoaded = true;
window.injectScriptLoaded = true;
const vidioInteraction = function (event) {
    if (event.source !== window) {
        console.log("vidioInteraction: event.source !== window");
        return;
    }
    const event_type = event.data.type;
    if (!event_type) {
        return;
    }
    console.log("vidioInteraction: event_type[${event_type}]");
    switch (event_type) {
        case "VIDIO_NAVIGATE": {
            const url = event.data.url;
            try {
                if (window.next && window.next.router && window.next.router.push) {
                    window.next.router.push(url);
                }
                else {
                    window.location.href = url;
                }
            }
            catch (error) {
                console.log("vidioInteraction: Navigation error: ${error?.message}");
            }
            break;
        }
        case "teardown": {
            window.removeEventListener("message", vidioInteraction, false);
            window.seekScriptLoaded = false;
            window.injectScriptLoaded = false;
            break;
        }
    }
};
window.addEventListener("message", vidioInteraction, false);
console.log("VIDIO INJECTED SCRIPT");
try {
    window.postMessage({ type: "VIDIO_INJECTED_READY" }, "*");
}
catch (e) { /* no op */ }

/******/ })()
;