/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/Teleparty/Enums/InternalStreamingServiceName.ts
var InternalStreamingServiceName;
(function (InternalStreamingServiceName) {
    InternalStreamingServiceName["NETFLIX"] = "netflix";
    InternalStreamingServiceName["HULU"] = "hulu";
    InternalStreamingServiceName["DISNEY_PLUS"] = "disney";
    InternalStreamingServiceName["STAR_PLUS"] = "starplus";
    InternalStreamingServiceName["AMAZON"] = "amazon";
    InternalStreamingServiceName["YOUTUBE"] = "youtube";
    InternalStreamingServiceName["HBO_MAX"] = "hbomax";
    InternalStreamingServiceName["MAX"] = "max";
    InternalStreamingServiceName["FUBO"] = "fubo";
    InternalStreamingServiceName["CRUNCHYROLL"] = "crunchyroll";
    InternalStreamingServiceName["PARAMOUNT"] = "paramount";
    InternalStreamingServiceName["PEACOCK"] = "peacock";
    InternalStreamingServiceName["HOTSTAR"] = "hotstar";
    InternalStreamingServiceName["DISNEY_PLUS_MENA"] = "disneymena";
    InternalStreamingServiceName["APPLE_TV"] = "appletv";
    InternalStreamingServiceName["PLUTO_TV"] = "plutotv";
    InternalStreamingServiceName["FUNIMATION"] = "funimation";
    InternalStreamingServiceName["TUBI_TV"] = "tubitv";
    InternalStreamingServiceName["JIO_CINEMA"] = "jiocinema";
    InternalStreamingServiceName["MUBI"] = "mubi";
    InternalStreamingServiceName["CRAVE"] = "crave";
    InternalStreamingServiceName["STAN"] = "stan";
    InternalStreamingServiceName["SONY_LIV"] = "sonyliv";
    InternalStreamingServiceName["ZEE5"] = "zee5";
    InternalStreamingServiceName["HULU_JP"] = "hulujp";
    InternalStreamingServiceName["UNEXT"] = "unext";
    InternalStreamingServiceName["GLOBOPLAY"] = "globoplay";
    InternalStreamingServiceName["WILLOW"] = "willow";
    InternalStreamingServiceName["FANCODE"] = "fancode";
    InternalStreamingServiceName["CANALPLUS"] = "canalplus";
    InternalStreamingServiceName["SHAHID"] = "shahid";
    InternalStreamingServiceName["RTL"] = "rtl";
    InternalStreamingServiceName["ESPN"] = "espn";
    InternalStreamingServiceName["SLING"] = "sling";
    InternalStreamingServiceName["VIKI"] = "viki";
    InternalStreamingServiceName["SPOTIFY"] = "spotify";
    InternalStreamingServiceName["SHOWTIME"] = "showtime";
    InternalStreamingServiceName["SHUDDER"] = "shudder";
    InternalStreamingServiceName["AMC_PLUS"] = "amcplus";
    InternalStreamingServiceName["VIU"] = "viu";
    InternalStreamingServiceName["VIDIO"] = "vidio";
    InternalStreamingServiceName["FOX_ONE"] = "foxone";
})(InternalStreamingServiceName || (InternalStreamingServiceName = {}));

;// ./src/Teleparty/Constants/env.ts
var _a, _b, _c, _d, _e, _f;
// NOTE: Changing the .env file seems to require re-running build-dev-watch
// if you are using that for development.
const PROD_DEFAULTS = {
    API_URL: "https://api.teleparty.com",
    WEBSOCKETS_URL: "wss://ws.teleparty.com",
    REDIRECT_URL: "https://www.teleparty.com",
    // This is a public key, so it's okay to hardcode it here
    POSTHOG_API_KEY: "phc_8h1T6DYsM416utBY2HpUYkyyBKyVErAyoNpFbtp2D9b",
    POSTHOG_API_HOST: "https://us.i.posthog.com",
    IMAGE_CDN_URL: "https://files.teleparty.com",
};
const API_URL =  true ? PROD_DEFAULTS.API_URL : 0;
const WEBSOCKETS_URL =  true
    ? PROD_DEFAULTS.WEBSOCKETS_URL
    : 0;
const REDIRECT_URL =  true
    ? PROD_DEFAULTS.REDIRECT_URL
    : 0;
const PROD_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDvZJAoFJkT2lBrhloA0e9XwKmLgELTAeQ",
    authDomain: "teleparty-mobile.firebaseapp.com",
    projectId: "teleparty-mobile",
    storageBucket: "teleparty-mobile.appspot.com",
    messagingSenderId: "961974665980",
    appId: "1:961974665980:web:fe4179db8591331aeb8d79",
    measurementId: "G-PC36DK40FL",
};
const DEV_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDmxz7HsfNuhW52Mti-Q9lAGHJYOzEijb8",
    authDomain: "teleparty-auth---test.firebaseapp.com",
    projectId: "teleparty-auth---test",
    storageBucket: "teleparty-auth---test.appspot.com",
    messagingSenderId: "391169153212",
    appId: "1:391169153212:web:0eae4ff68890df614b18b9",
    measurementId: "G-MFZH5P1Z4E",
};
const FIREBASE_CONFIG =  true ? PROD_FIREBASE_CONFIG : 0;
// PostHog Configuration
const POSTHOG_API_KEY =  true
    ? PROD_DEFAULTS.POSTHOG_API_KEY
    : 0;
const POSTHOG_API_HOST =  true
    ? PROD_DEFAULTS.POSTHOG_API_HOST
    : 0;
const IGNORE_UNDER_MAINTENANCE =  true ? false : 0;
const IMAGE_CDN_URL =  true
    ? PROD_DEFAULTS.IMAGE_CDN_URL
    : 0;
const BACKEND_SELECTOR_AWS_CDN = "MISSING_ENV_VAR".BACKEND_SELECTOR_AWS_CDN || "https://d1491j4uhxdasz.cloudfront.net";

;// ./src/Teleparty/Managers/Announcements.ts
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};


const ANNOUNCEMENTS_CACHE_KEY = "announcements_cache_v1";
const CACHE_TTL_MS = 10 * 60 * 1000;
function announcementApplicable(announcement, serviceName) {
    return (announcement &&
        typeof announcement.deviceTypes === "object" &&
        announcement.deviceTypes.includes("edge".toUpperCase()) &&
        (announcement.service === "all" || announcement.service === serviceName || !serviceName) &&
        compareExtensionVersion(announcement.extensionVersionIntroduced) >= 0 &&
        (announcement.extensionVersionResolved === "unresolved" ||
            compareExtensionVersion(announcement.extensionVersionResolved) <= 0) &&
        (announcement.expirationDate === -1 || Date.now() / 1000 < announcement.expirationDate));
}
const getCache = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { [ANNOUNCEMENTS_CACHE_KEY]: cache } = (yield chrome.storage.local.get(ANNOUNCEMENTS_CACHE_KEY));
        if (!((_a = cache === null || cache === void 0 ? void 0 : cache.announcements) === null || _a === void 0 ? void 0 : _a.length))
            return null;
        if (Date.now() - cache.fetchedAtMs > CACHE_TTL_MS)
            return null;
        return cache.announcements;
    }
    catch (_b) {
        return null;
    }
});
const setCache = (announcements) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = { announcements, fetchedAtMs: Date.now() };
        yield chrome.storage.local.set({ [ANNOUNCEMENTS_CACHE_KEY]: payload });
    }
    catch (_c) {
        // ignore cache write failures
    }
});
function fetchAnnouncements() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const cached = yield getCache();
        if (cached)
            return cached;
        const resp = yield fetch(`${API_URL}/announcements`);
        const data = yield resp.json();
        const announcements = (_a = data["announcements"]) !== null && _a !== void 0 ? _a : [];
        void setCache(announcements);
        return announcements;
    });
}

;// ./src/Teleparty/BrowseScripts/NativePartyHandler.ts
var NativePartyHandler_awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

function getTelepartyConfig() {
    try {
        const stored = sessionStorage.getItem("telepartyPremiumConfig");
        if (stored) {
            const config = JSON.parse(stored);
            return config;
        }
    }
    catch (e) {
        // console.error("Error parsing sessionStorage config:", e)
    }
    return null;
}
function addNativePartyHandler(tryAddButton, service) {
    return NativePartyHandler_awaiter(this, void 0, void 0, function* () {
        let unavailable = [];
        try {
            const announcements = yield fetchAnnouncements();
            unavailable = announcements
                .filter((a) => a.enforcement === "DISABLE_SERVICE")
                .map((a) => a.service)
                .filter(Boolean);
        }
        catch (e) {
            console.error(e);
        }
        // Immediately bail out if this service is under maintenance
        if (unavailable.includes(service)) {
            console.log(`Service under maintenance: ${service}`);
            return;
        }
        setInterval(() => {
            try {
                const buttons = tryAddButton();
                if (buttons) {
                    for (const button of buttons) {
                        const existingHandler = button.button._telepartyHandler;
                        if (existingHandler) {
                            button.button.removeEventListener("click", existingHandler);
                        }
                        const clickHandler = (e) => {
                            console.log("Native party button clicked");
                            const config = getTelepartyConfig();
                            if ((config === null || config === void 0 ? void 0 : config.serviceIsPremium) && !(config === null || config === void 0 ? void 0 : config.userHasPremium)) {
                                console.log("Redirecting non-premium user on premium service to premium page");
                                window.open("https://teleparty.com/premium?ref=start-" + config.serviceName, "_blank");
                                return;
                            }
                            localStorage.setItem("nativeParty", JSON.stringify({
                                shouldStart: true,
                                expiry: Date.now() + 1000 * 60 * 2,
                                randomId: Math.random().toString(),
                            }));
                            button.play(e);
                        };
                        button.button._telepartyHandler = clickHandler;
                        button.button.addEventListener("click", clickHandler);
                    }
                }
            }
            catch (error) {
                // console.error("Error in addNativePartyHandler:", error)
            }
        }, 500);
    });
}

;// ./src/Teleparty/BrowseScripts/Hulu/hulu_browse_injected.js


function addNativePartyButton() {
    var _a;
    const results = [];
    if (document.getElementById("native-party-button") == null) {
        // handle play button in show page
        const playButton = document.querySelector('a[data-testid="watchaction-btn"]');
        if (playButton != null) {
            const parentDiv = document.querySelector('div[data-testid="watch-action"]').parentElement;
            const nativePartyButton = document.createElement("button");
            nativePartyButton.setAttribute("style", "background: linear-gradient(273.58deg, #9E55A0 0%, #EF3E3A 100%); color: #fff; border-style: none; border-radius: 0.375rem; padding: 1.25rem; margin-right: 2rem");
            nativePartyButton.setAttribute("id", "native-party-button");
            const watchMovieText = document.querySelector('div[data-testid="watch-action-text"]');
            const nativePartyButtonText = document.createElement("span");
            nativePartyButtonText.innerText = "Start a Teleparty";
            nativePartyButtonText.setAttribute("style", ((_a = watchMovieText === null || watchMovieText === void 0 ? void 0 : watchMovieText.getAttribute("style")) !== null && _a !== void 0 ? _a : "") +
                "text-align: center; margin-left: 0px; cursor: pointer; white-space: nowrap;");
            if (watchMovieText === null || watchMovieText === void 0 ? void 0 : watchMovieText.getAttribute("class")) {
                nativePartyButtonText.setAttribute("class", watchMovieText.getAttribute("class"));
            }
            parentDiv.insertBefore(nativePartyButton, document.querySelector('div[data-testid="watch-action"]').nextSibling);
            nativePartyButton.appendChild(nativePartyButtonText);
            results.push({ button: nativePartyButton, play: (e) => playButton.click() });
        }
    }
    if (document.getElementById("native-party-button-homepage") == null) {
        // handle homepage buttons
        const highEmphasisTileContents = document.querySelectorAll('[data-testid="high-emphasis-tile-content"]');
        highEmphasisTileContents.forEach((content) => {
            const btn = content.querySelector('[data-testid="playback-action"]');
            if (btn.parentElement && !btn.parentElement.querySelector("#native-party-button")) {
                const nativePartyButton = document.createElement("button");
                if (btn.className) {
                    nativePartyButton.className = btn.className;
                }
                nativePartyButton.setAttribute("style", "background: linear-gradient(273.58deg, #9E55A0 0%, #EF3E3A 100%); color: #fff; border: none;");
                nativePartyButton.setAttribute("id", "native-party-button-homepage");
                const nativePartyButtonText = document.createElement("span");
                nativePartyButtonText.innerText = "Start a Teleparty";
                nativePartyButtonText.setAttribute("style", "text-align: center; margin-left: 0px; cursor: pointer; white-space: nowrap;");
                nativePartyButton.appendChild(nativePartyButtonText);
                btn.parentElement.insertBefore(nativePartyButton, btn.nextSibling);
                results.push({ button: nativePartyButton, play: (e) => btn.click() });
            }
        });
    }
    return results.length > 0 ? results : undefined;
}
addNativePartyHandler(addNativePartyButton, InternalStreamingServiceName.HULU);

/******/ })()
;