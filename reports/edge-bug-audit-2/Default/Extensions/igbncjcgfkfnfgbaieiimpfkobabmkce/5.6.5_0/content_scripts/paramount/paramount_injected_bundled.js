/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

const getVideoElement = () => {
    const parentEl = document.querySelector("[data-role=videoContainer]");
    if (parentEl) {
        return parentEl.querySelector("video");
    }
    return null;
};
// Show a backdrop overlay over the video container prompting the user to click.
// The real user click gives us a trusted gesture so video.play() actually works.
const showPlayOverlay = (videoEle) => {
    // Don't duplicate
    if (document.getElementById("tp-play-overlay"))
        return;
    const container = videoEle.closest("[data-role=videoContainer]") || videoEle.parentElement;
    if (!container)
        return;
    const overlay = document.createElement("div");
    overlay.id = "tp-play-overlay";
    Object.assign(overlay.style, {
        position: "absolute",
        inset: "0",
        zIndex: "2147483647",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        cursor: "pointer",
        backdropFilter: "blur(2px)",
    });
    const prompt = document.createElement("div");
    Object.assign(prompt.style, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        userSelect: "none",
    });
    // Play icon (SVG circle with triangle)
    const icon = document.createElement("div");
    icon.innerHTML = `<svg width="72" height="72" viewBox="0 0 72 72" fill="none">
        <circle cx="36" cy="36" r="35" stroke="white" stroke-width="2" fill="rgba(255,255,255,0.1)"/>
        <polygon points="28,20 56,36 28,52" fill="white"/>
    </svg>`;
    const label = document.createElement("div");
    Object.assign(label.style, {
        color: "#ffffff",
        fontSize: "16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontWeight: "500",
        letterSpacing: "0.3px",
    });
    label.textContent = "Click to continue watching";
    prompt.appendChild(icon);
    prompt.appendChild(label);
    overlay.appendChild(prompt);
    // Make sure the container is positioned so our absolute overlay sits on top.
    const containerPos = window.getComputedStyle(container).position;
    if (containerPos === "static" || containerPos === "") {
        container.style.position = "relative";
    }
    overlay.addEventListener("click", () => {
        // This handler runs with a real (isTrusted) user gesture.
        overlay.remove();
        // Click the site's play button if it's in "Play" state.
        const playButton = document.querySelector(".btn-play-pause");
        if (playButton && playButton.getAttribute("aria-label") === "Play") {
            playButton.click();
        }
        // Directly play – we have a trusted gesture so this will be allowed unmuted.
        videoEle.play().catch(() => {
            // Ignore errors from play() as it might be blocked by browser policy
        });
    });
    container.appendChild(overlay);
};
// Remove the overlay if it exists (e.g. video started playing on its own).
const removePlayOverlay = () => {
    const overlay = document.getElementById("tp-play-overlay");
    if (overlay)
        overlay.remove();
};
// Poll: if video isn't playing after joining party, show the overlay.
const handleJoinPartyInterval = () => {
    console.log("handleJoinPartyInterval called");
    const interval = setInterval(() => {
        const videoEle = getVideoElement();
        if (!videoEle || !document.querySelector("#chat-wrapper")) {
            return;
        }
        // Video is already playing – no overlay needed.
        if (videoEle.paused === false) {
            removePlayOverlay();
            clearInterval(interval);
            return;
        }
        const loadingAnimation = document.querySelector(".smart-tag-loading-animation");
        if (!loadingAnimation) {
            return;
        }
        // Video exists, chat wrapper is there, loading animation is visible, but video is paused → show overlay.
        showPlayOverlay(videoEle);
        clearInterval(interval);
    }, 500);
};
handleJoinPartyInterval();

/******/ })()
;