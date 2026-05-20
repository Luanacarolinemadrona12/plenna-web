/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./src/Teleparty/Constants/Services/Shahid.ts
const VIDEO_ELEMENT_SELECTOR = "video#bitmovinplayer-video-player-element";
const LIVE_VIDEO_ELEMENT_SELECTOR = "video#bitmovinplayer-video-bitmovin-element";
const TITLE_ELEMENT_SELECTOR = 'h3[class*="VODTitle_show-title"]';
const AD_CLASS_NAME = 'video[title="Advertisement"]';
const VIDEO_TYPES = Object.freeze({
    SHOW: "player",
    LIVE_TV: "livestream",
});
const SHAHID_CONSTANTS = Object.freeze({
    VIDEO_ELEMENT_SELECTOR,
    LIVE_VIDEO_ELEMENT_SELECTOR,
    TITLE_ELEMENT_SELECTOR,
    VIDEO_TYPES,
    AD_CLASS_NAME,
});
/* harmony default export */ const Shahid = (SHAHID_CONSTANTS);

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

;// ./src/Teleparty/BrowseScripts/Shahid/shahid_browse_injected.js



const handleLiveTvUrl = () => {
    document.addEventListener("click", (event) => {
        var _a;
        const link = (_a = event.target) === null || _a === void 0 ? void 0 : _a.href;
        if (!link)
            return;
        const url = new URL(link);
        if (url.pathname.includes(Shahid.VIDEO_TYPES.LIVE_TV) && url.pathname.split("/").length === 3) {
            const observer = new MutationObserver((mutations, obs) => {
                const metaElement = document.querySelector('meta[property="og:url"]');
                if (metaElement) {
                    const channelUrl = new URL(metaElement.content || "");
                    window.history.replaceState(null, "", channelUrl.toString());
                    obs.disconnect();
                }
            });
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        }
    });
};
function addNativePartyButton() {
    var _a, _b, _c;
    const url = new URL(window.location.href);
    if (document.getElementById("native-party-button") != null || url.pathname.split("/").length > 2) {
        return undefined;
    }
    const playButtonImg = document.querySelector('img[alt="PlayIcon"]');
    if (!playButtonImg) {
        return undefined;
    }
    const playButton = (_a = playButtonImg === null || playButtonImg === void 0 ? void 0 : playButtonImg.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement;
    const parentDiv = playButton.parentElement;
    const nativePartyButton = document.createElement("button");
    nativePartyButton.setAttribute("class", playButton.getAttribute("class"));
    Array.from(playButton === null || playButton === void 0 ? void 0 : playButton.children).forEach((child) => {
        nativePartyButton.appendChild(child.cloneNode(true)); // true = deep clone with sub-children
    });
    nativePartyButton.setAttribute("id", "native-party-button");
    const nativePartyButtonImg = nativePartyButton.querySelector("img");
    nativePartyButtonImg.setAttribute("alt", "PlayIconTeleparty");
    const nativePartyButtonImgParent = nativePartyButtonImg === null || nativePartyButtonImg === void 0 ? void 0 : nativePartyButtonImg.parentElement;
    nativePartyButtonImgParent.setAttribute("style", "background: linear-gradient(273.58deg, #9E55A0 0%, #EF3E3A 100%); border-color: #e50914; color: #fff;");
    const nativePartyButtonImgParentNextSibling = nativePartyButtonImgParent === null || nativePartyButtonImgParent === void 0 ? void 0 : nativePartyButtonImgParent.nextSibling;
    nativePartyButtonImgParentNextSibling.querySelector("span").innerHTML = "<span>Start a Teleparty</span>";
    (_c = (_b = nativePartyButtonImgParentNextSibling === null || nativePartyButtonImgParentNextSibling === void 0 ? void 0 : nativePartyButtonImgParentNextSibling.querySelector("span")) === null || _b === void 0 ? void 0 : _b.nextSibling) === null || _c === void 0 ? void 0 : _c.remove();
    parentDiv.insertBefore(nativePartyButton, playButton.nextSibling);
    return [{ button: nativePartyButton, play: (e) => playButton.click() }];
}
function addNativePartyButtonDetailsPage() {
    var _a, _b, _c;
    const url = new URL(window.location.href);
    if (document.getElementById("native-party-button") != null || url.pathname.split("/").length <= 2) {
        return undefined;
    }
    const playButtonImg = document.querySelector('img[alt="PlayIcon"]');
    if (!playButtonImg) {
        return undefined;
    }
    const playButton = (_a = playButtonImg === null || playButtonImg === void 0 ? void 0 : playButtonImg.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement;
    const parentDiv = playButton.parentElement;
    parentDiv.setAttribute("style", "display: flex; gap: 5px;");
    const nativePartyButton = document.createElement("a");
    nativePartyButton.setAttribute("class", playButton.getAttribute("class"));
    Array.from(playButton === null || playButton === void 0 ? void 0 : playButton.children).forEach((child) => {
        nativePartyButton.appendChild(child.cloneNode(true)); // true = deep clone with sub-children
    });
    nativePartyButton.setAttribute("id", "native-party-button");
    const nativePartyButtonImg = nativePartyButton.querySelector("img");
    nativePartyButtonImg.setAttribute("alt", "PlayIconTeleparty");
    const nativePartyButtonImgParent = nativePartyButtonImg === null || nativePartyButtonImg === void 0 ? void 0 : nativePartyButtonImg.parentElement;
    nativePartyButtonImgParent.setAttribute("style", "background: linear-gradient(273.58deg, #9E55A0 0%, #EF3E3A 100%); border-color: #e50914; color: #fff;");
    nativePartyButton.setAttribute("id", "native-party-button");
    const nativePartyButtonImgParentNextSibling = nativePartyButtonImgParent === null || nativePartyButtonImgParent === void 0 ? void 0 : nativePartyButtonImgParent.nextSibling;
    nativePartyButtonImgParentNextSibling.querySelector("div").innerHTML = "<span>Start a Teleparty</span>";
    (_c = (_b = nativePartyButtonImgParentNextSibling.querySelector("div")) === null || _b === void 0 ? void 0 : _b.querySelector("div")) === null || _c === void 0 ? void 0 : _c.remove();
    parentDiv.insertBefore(nativePartyButton, playButton.nextSibling);
    return [{ button: nativePartyButton, play: (e) => playButton.click() }];
}
addNativePartyHandler(addNativePartyButton, InternalStreamingServiceName.SHAHID);
addNativePartyHandler(addNativePartyButtonDetailsPage, InternalStreamingServiceName.SHAHID);
handleLiveTvUrl();

/******/ })()
;