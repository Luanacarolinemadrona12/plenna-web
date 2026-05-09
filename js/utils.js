(function () {
  "use strict";

  function uid(prefix) {
    return (prefix || "id") + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDaysISO(days) {
    var date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function formatDate(value) {
    if (!value) return "Sem prazo";
    var date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00") : new Date(value);
    if (Number.isNaN(date.getTime())) date = new Date(value + "T12:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  function formatDateTime(value) {
    if (!value) return "";
    return new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function greeting() {
    var hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }

  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function demoCheckin() {
    var demo = getQueryParam("demo");
    if (!demo) return null;
    var map = {
      alta: { humor: "bom", energia: "alta", energiaValor: 8, fatores: ["Trabalho"], necessidade: "focar" },
      media: { humor: "neutro", energia: "media", energiaValor: 5, fatores: ["Trabalho", "Sono"], necessidade: "organizar" },
      baixa: { humor: "ruim", energia: "baixa", energiaValor: 3, fatores: ["Sono"], necessidade: "descansar" },
      protetivo: { humor: "sensivel", energia: "baixa", energiaValor: 2, fatores: ["Sono", "Trabalho"], necessidade: "cuidar", protetivo: true }
    };
    if (!map[demo]) return null;
    return Object.assign({ id: "demo-" + demo, data: new Date().toISOString(), demo: true }, map[demo]);
  }

  function activeCheckin() {
    return demoCheckin() || window.PlennaStorage.latest(window.PlennaStorage.KEYS.checkins);
  }

  function setText(selector, value, scope) {
    var node = qs(selector, scope);
    if (node) node.textContent = value;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toast(message, options) {
    options = options || {};
    var existing = qs(".toast");
    if (existing) existing.remove();
    var node = document.createElement("div");
    node.className = "toast" + (options.kind ? " " + options.kind : "");
    node.setAttribute("role", options.kind === "error" ? "alert" : "status");
    node.setAttribute("aria-live", options.kind === "error" ? "assertive" : "polite");
    var text = document.createElement("span");
    text.textContent = message;
    node.appendChild(text);
    if (options.actionLabel && typeof options.onAction === "function") {
      var action = document.createElement("button");
      action.type = "button";
      action.textContent = options.actionLabel;
      action.addEventListener("click", function () {
        options.onAction();
        node.remove();
      });
      node.appendChild(action);
    }
    document.body.appendChild(node);
    setTimeout(function () {
      if (node.parentNode) node.remove();
    }, options.duration || 2600);
  }

  function showScreenStatus(message, options) {
    options = options || {};
    var main = qs("main.page") || qs("main") || document.body;
    var existing = qs(".screen-status", main);
    if (existing) existing.remove();
    var node = document.createElement("div");
    node.className = "screen-status" + (options.kind ? " " + options.kind : "");
    node.setAttribute("role", options.kind === "error" ? "alert" : "status");
    node.setAttribute("aria-live", options.kind === "error" ? "assertive" : "polite");
    node.innerHTML = '<span aria-hidden="true"></span><strong>' + escapeHtml(message) + "</strong>";
    var header = qs("header", main);
    if (header && header.parentNode === main && header.nextSibling) {
      main.insertBefore(node, header.nextSibling);
    } else if (header && header.parentNode === main) {
      main.appendChild(node);
    } else {
      main.insertBefore(node, main.firstChild);
    }
    return node;
  }

  function notify(message, options) {
    options = options || {};
    toast(message, options);
    showScreenStatus(message, options);
  }

  function showLoading(message) {
    hideLoading();
    var node = document.createElement("div");
    node.className = "app-loading-overlay";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    node.innerHTML = '<div class="app-loading-card"><span aria-hidden="true"></span><strong>' + escapeHtml(message || "Carregando") + "</strong></div>";
    document.body.appendChild(node);
    return node;
  }

  function hideLoading() {
    var node = qs(".app-loading-overlay");
    if (node) node.remove();
  }

  function showError(message, options) {
    options = options || {};
    var text = message || "Algo deu errado. Tente novamente.";
    toast(text, { kind: "error", duration: options.duration || 4200, actionLabel: options.actionLabel, onAction: options.onAction });
    var existing = qs(".app-error-banner");
    if (existing) existing.remove();
    if (options.inline === false) return;
    var banner = document.createElement("div");
    banner.className = "app-error-banner";
    banner.setAttribute("role", "alert");
    banner.innerHTML = '<strong>Não foi possível concluir</strong><p>' + escapeHtml(text) + "</p>";
    var main = qs("main.page") || document.body;
    main.insertBefore(banner, main.firstChild);
    window.setTimeout(function () {
      if (banner.parentNode) banner.remove();
    }, options.duration || 4200);
  }

  function withLoading(message, worker) {
    showLoading(message);
    return Promise.resolve()
      .then(worker)
      .catch(function (error) {
        showError(error && error.message ? error.message : "Algo deu errado. Tente novamente.");
        throw error;
      })
      .finally(hideLoading);
  }

  function emptyState(title, body, actionLabel, href) {
    return [
      '<div class="empty-state proto-empty ux-empty">',
      "<h3>" + escapeHtml(title) + "</h3>",
      "<p>" + escapeHtml(body) + "</p>",
      actionLabel ? '<a class="button small primary" href="' + escapeHtml(href || "#") + '">' + escapeHtml(actionLabel) + "</a>" : "",
      "</div>"
    ].join("");
  }

  function priorityRank(priority) {
    var rank = { alta: 0, media: 1, baixa: 2 };
    return Object.prototype.hasOwnProperty.call(rank, priority) ? rank[priority] : 3;
  }

  function effortRank(effort) {
    var rank = { baixo: 0, medio: 1, alto: 2 };
    return Object.prototype.hasOwnProperty.call(rank, effort) ? rank[effort] : 1;
  }

  function sortTasks(tasks) {
    return tasks.slice().sort(function (a, b) {
      var orderA = Number.isFinite(a.ordem) ? a.ordem : 999;
      var orderB = Number.isFinite(b.ordem) ? b.ordem : 999;
      if (orderA !== orderB) return orderA - orderB;
      if (priorityRank(a.prioridade) !== priorityRank(b.prioridade)) return priorityRank(a.prioridade) - priorityRank(b.prioridade);
      if ((a.prazo || "") !== (b.prazo || "")) return String(a.prazo || "9999").localeCompare(String(b.prazo || "9999"));
      return new Date(a.criadoEm || 0) - new Date(b.criadoEm || 0);
    });
  }

  function getOpenTasks() {
    return sortTasks(window.PlennaStorage.all(window.PlennaStorage.KEYS.tasks).filter(function (task) {
      return !task.concluida;
    }));
  }

  function generateRecommendation(checkin) {
    if (!checkin) {
      return {
        title: "Comece com um check-in rápido",
        body: "O Plenna usa seu humor e energia para sugerir um ritmo mais realista para o dia.",
        tag: "Sem check-in"
      };
    }

    if (checkin.protetivo || hasLowMoodStreak()) {
      return {
        title: "Ative um plano protetivo hoje",
        body: "Reduza carga, proteja uma pausa e registre o diário antes de tarefas exigentes.",
        tag: "Plano protetivo"
      };
    }

    if (checkin.energia === "baixa" && (checkin.humor === "ruim" || checkin.humor === "sensivel")) {
      return {
        title: "Reduza a carga e proteja pausas",
        body: "Escolha uma prioridade pequena, adie o que puder e deixe espaço para recuperação.",
        tag: "Dia de cuidado"
      };
    }

    if (checkin.energia === "alta" && (checkin.humor === "bom" || checkin.humor === "otimo")) {
      return {
        title: "Use o pico para uma tarefa importante",
        body: "Reserve um bloco de foco para algo de alto impacto e deixe tarefas leves para depois.",
        tag: "Bom momento"
      };
    }

    return {
      title: "Organize três prioridades possíveis",
      body: "Mantenha a lista curta: uma tarefa importante, uma tarefa leve e uma pausa visível.",
      tag: "Ritmo estável"
    };
  }

  function suggestFocusTask(tasks, checkin) {
    var open = sortTasks(tasks || getOpenTasks()).filter(function (task) {
      return !task.concluida;
    });
    if (!open.length) return null;
    if (hasLowMoodStreak() || (checkin && checkin.energia === "baixa")) {
      return open.find(function (task) { return task.esforco === "baixo"; }) || open[0];
    }
    return open.find(function (task) { return task.prioridade === "alta"; }) || open[0];
  }

  function hasLowMoodStreak() {
    var demo = demoCheckin();
    if (demo && demo.protetivo) return true;
    if (!window.PlennaStorage) return false;
    var items = window.PlennaStorage.all(window.PlennaStorage.KEYS.checkins).slice().sort(function (a, b) {
      return new Date(b.data || 0) - new Date(a.data || 0);
    }).slice(0, 3);
    return items.length >= 3 && items.every(function (item) {
      return item.humor === "ruim" || item.humor === "sensivel";
    });
  }

  function setActiveNav(page) {
    qsa(".bottom-nav a").forEach(function (link) {
      if (link.dataset.page === page) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function updateStatusTime() {
    setText("[data-status-time]", "9:41");
  }

  window.PlennaUtils = {
    uid: uid,
    todayISO: todayISO,
    addDaysISO: addDaysISO,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    greeting: greeting,
    qs: qs,
    qsa: qsa,
    getQueryParam: getQueryParam,
    demoCheckin: demoCheckin,
    activeCheckin: activeCheckin,
    setText: setText,
    escapeHtml: escapeHtml,
    toast: toast,
    showScreenStatus: showScreenStatus,
    notify: notify,
    showLoading: showLoading,
    hideLoading: hideLoading,
    showError: showError,
    withLoading: withLoading,
    emptyState: emptyState,
    priorityRank: priorityRank,
    effortRank: effortRank,
    sortTasks: sortTasks,
    getOpenTasks: getOpenTasks,
    generateRecommendation: generateRecommendation,
    suggestFocusTask: suggestFocusTask,
    hasLowMoodStreak: hasLowMoodStreak,
    setActiveNav: setActiveNav,
    updateStatusTime: updateStatusTime
  };
})();
