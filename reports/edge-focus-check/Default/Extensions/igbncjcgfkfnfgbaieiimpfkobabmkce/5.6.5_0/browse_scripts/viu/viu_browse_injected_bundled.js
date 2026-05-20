/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

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

;// ./src/Teleparty/Constants/Services/Viu.ts
const VIDEO_ELEMENT_SELECTOR = "video#bitmovinplayer-video-null";
const AD_CLASS_NAME = 'video[title="Advertisement"]';
const TITLE_ELEMENT_SELECTOR = "#series_title";
const TITLE_ELEMENT_SELECTOR_LIVE_TV = ".bmpui-label-metadata-viu-title.bmpui-label-metadata-viu-title";
const UI_CONTAINER = ".bmpui-ui-uicontainer";
const QUERY_PARAMS_ORIGIN_EPISODE_CODE_TAG = "originEpisodeCode";
const VIDEO_TYPES = Object.freeze({
    VIDEO: "vod",
    LIVE: "live",
});
const VIU_CONSTANTS = Object.freeze({
    VIDEO_ELEMENT_SELECTOR,
    AD_CLASS_NAME,
    TITLE_ELEMENT_SELECTOR,
    TITLE_ELEMENT_SELECTOR_LIVE_TV,
    UI_CONTAINER,
    VIDEO_TYPES,
    QUERY_PARAMS_ORIGIN_EPISODE_CODE_TAG,
});
/* harmony default export */ const Viu = (VIU_CONSTANTS);

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

;// ./src/Teleparty/BrowseScripts/Viu/viu_browse_injected.js



const handleOriginShowCode = () => {
    document.addEventListener("click", () => {
        setTimeout(() => {
            var _a, _b, _c;
            const url = new URL(window.location.href);
            if (url.pathname.includes(Viu.VIDEO_TYPES.LIVE) ||
                url.pathname.includes(Viu.VIDEO_TYPES.VIDEO)) {
                const params = url.searchParams;
                const episodeCode = params.get(Viu.QUERY_PARAMS_ORIGIN_EPISODE_CODE_TAG) || ((_a = url.pathname.split("/")) === null || _a === void 0 ? void 0 : _a[5]);
                const languageAnchor = (_c = (_b = document.querySelector('[data-testid="LanguageIcon"]')) === null || _b === void 0 ? void 0 : _b.parentElement) === null || _c === void 0 ? void 0 : _c.parentElement;
                const hrefAttribute = languageAnchor === null || languageAnchor === void 0 ? void 0 : languageAnchor.getAttribute("href");
                if (languageAnchor && !(hrefAttribute === null || hrefAttribute === void 0 ? void 0 : hrefAttribute.includes(episodeCode))) {
                    languageAnchor.setAttribute("href", `${hrefAttribute}?${Viu.QUERY_PARAMS_ORIGIN_EPISODE_CODE_TAG}=${episodeCode}`);
                }
                if (params.has(Viu.QUERY_PARAMS_ORIGIN_EPISODE_CODE_TAG))
                    return;
                params.append(Viu.QUERY_PARAMS_ORIGIN_EPISODE_CODE_TAG, episodeCode);
                window.history.replaceState(null, "", url.toString());
            }
        }, 5000);
    });
};
function addNativePartyButton() {
    if (document.getElementById("native-party-button") != null) {
        return undefined;
    }
    const showBannerList = document.querySelectorAll("a.banner-item");
    if (showBannerList.length === 0) {
        return undefined;
    }
    let nativeButtons = [];
    showBannerList.forEach((showBanner) => {
        var _a;
        const parentDiv = showBanner.parentElement;
        const buttonsContainer = document.createElement("div");
        buttonsContainer.setAttribute("class", "teleparty-buttons-container");
        buttonsContainer.setAttribute("style", "position: absolute; left: 50px; bottom: 5px; display: flex; gap: 10px; z-index: 100;");
        const showBannerHref = showBanner.getAttribute("href");
        const showBannerWithOrginEpisodeCodeTag = `${showBannerHref}?${Viu.QUERY_PARAMS_ORIGIN_EPISODE_CODE_TAG}=${(_a = showBannerHref.split("/")) === null || _a === void 0 ? void 0 : _a[5]}`;
        const nativePartyWrapper = document.createElement("a");
        const watchNowWrapper = document.createElement("a");
        const nativePartyButton = document.createElement("button");
        const watchNowButton = document.createElement("button");
        // Set up native party button and its wrapper
        nativePartyWrapper.setAttribute("href", showBannerWithOrginEpisodeCodeTag);
        nativePartyWrapper.setAttribute("style", "text-decoration: none;");
        nativePartyButton.setAttribute("style", "background: linear-gradient(273.58deg, #9E55A0 0%, #EF3E3A 100%); border-color: #e50914; color: #fff; border-radius: 8px 0px; cursor: pointer; padding: 7px;");
        nativePartyButton.setAttribute("id", "native-party-button");
        nativePartyButton.innerHTML = "<span>Start a Teleparty</span>";
        nativePartyWrapper.appendChild(nativePartyButton);
        // Set up watch now button and its wrapper
        watchNowWrapper.setAttribute("href", showBannerWithOrginEpisodeCodeTag);
        watchNowWrapper.setAttribute("style", "text-decoration: none;");
        watchNowButton.setAttribute("style", "background: #FFBF00; border-color: #e50914; color: #fff; border-radius: 8px 0px; cursor: pointer; padding: 7px;");
        watchNowButton.setAttribute("id", "tp-watch-now-button");
        watchNowButton.innerHTML = "<span>Watch Now</span>";
        watchNowWrapper.appendChild(watchNowButton);
        showBanner.setAttribute("style", "cursor: default;");
        showBanner.onclick = (e) => e.preventDefault();
        buttonsContainer.appendChild(nativePartyWrapper);
        buttonsContainer.appendChild(watchNowWrapper);
        parentDiv.insertBefore(buttonsContainer, showBanner.nextSibling);
        nativeButtons.push({ button: nativePartyButton, play: (e) => watchNowWrapper.click() });
    });
    return nativeButtons;
}
addNativePartyHandler(addNativePartyButton, InternalStreamingServiceName.VIU);
handleOriginShowCode();

/******/ })()
;