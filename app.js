(function () {
  "use strict";

  function isRootPage() {
    return !window.location.pathname.replace(/\\/g, "/").includes("/pages/");
  }

  function pagePath(file) {
    return isRootPage() ? "pages/" + file : file;
  }

  function init() {
    renderNav();

    if (window.PlennaUtils) {
      window.PlennaUtils.updateStatusTime();
    }

    var page = document.body.dataset.page;
    if (page && window.PlennaUtils) {
      window.PlennaUtils.setActiveNav(page);
    }

    document.querySelectorAll("[data-page-path]").forEach(function (link) {
      link.href = pagePath(link.dataset.pagePath);
    });

    var startLink = document.querySelector("[data-start-link]");
    if (startLink && window.PlennaStorage) {
      var latestCheckin = window.PlennaStorage.latest(window.PlennaStorage.KEYS.checkins);
      startLink.href = pagePath(latestCheckin ? "home.html" : "checkin.html");
      startLink.textContent = latestCheckin ? "Continuar no Plenna" : "Começar";
    }
  }

  function renderNav() {
    var mount = document.querySelector("[data-bottom-nav]");
    if (!mount) return;

    mount.innerHTML = [
      '<nav class="bottom-nav" aria-label="Navegação principal">',
      '<a href="' + pagePath("home.html") + '" data-page="home"><span class="nav-glyph" aria-hidden="true">⌂</span><span>Início</span></a>',
      '<a href="' + pagePath("tasks.html") + '" data-page="tasks"><span class="nav-glyph" aria-hidden="true">✓</span><span>Tarefas</span></a>',
      '<a href="' + pagePath("habits.html") + '" data-page="habits"><span class="nav-glyph" aria-hidden="true">◎</span><span>Hábitos</span></a>',
      '<a href="' + pagePath("focus.html") + '" data-page="focus"><span class="nav-glyph" aria-hidden="true">◷</span><span>Foco</span></a>',
      '<a href="' + pagePath("more.html") + '" data-page="more"><span class="nav-glyph" aria-hidden="true">☰</span><span>Mais</span></a>',
      "</nav>"
    ].join("");
  }

  window.PlennaApp = {
    isRootPage: isRootPage,
    pagePath: pagePath
  };

  document.addEventListener("DOMContentLoaded", init);
})();
