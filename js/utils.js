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
    if (Number.isNaN(date.getTime())) return "Sem prazo definido";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  function formatDateTime(value) {
    if (!value) return "";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("pt-BR", {
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
    var text = message || "Não foi possível concluir agora. Tente novamente em instantes.";
    toast(text, { kind: "error", duration: options.duration || 4200, actionLabel: options.actionLabel, onAction: options.onAction });
    var existing = qs(".app-error-banner");
    if (existing) existing.remove();
    if (options.inline === false) return;
    var banner = document.createElement("div");
    banner.className = "app-error-banner";
    banner.setAttribute("role", "alert");
    banner.setAttribute("aria-live", "assertive");
    banner.innerHTML = [
      "<strong>" + escapeHtml(options.title || "Não foi possível concluir") + "</strong>",
      "<p>" + escapeHtml(text) + "</p>",
      options.actionLabel ? '<div class="error-recovery-actions">' + (options.actionHref ? '<a class="button secondary small" href="' + escapeHtml(options.actionHref) + '">' + escapeHtml(options.actionLabel) + "</a>" : '<button class="button secondary small" type="button" data-error-retry>' + escapeHtml(options.actionLabel) + "</button>") + "</div>" : ""
    ].join("");
    if (options.actionLabel && typeof options.onAction === "function") {
      var retry = qs("[data-error-retry]", banner);
      if (retry) retry.addEventListener("click", options.onAction);
    }
    var main = qs("main.page") || document.body;
    main.insertBefore(banner, main.firstChild);
    window.setTimeout(function () {
      if (banner.parentNode) banner.remove();
    }, options.duration || 4200);
  }

  function storageRecoveryMessage() {
    return "Não foi possível salvar no navegador agora. A alteração fica apenas nesta sessão. Tente novamente ou confira se o navegador permite armazenamento local.";
  }

  function showStorageRecovery() {
    showError(storageRecoveryMessage(), {
      title: "Armazenamento local indisponível",
      duration: 7200,
      actionLabel: "Tentar novamente",
      onAction: function () {
        window.location.reload();
      }
    });
  }

  function requiredFieldValue(field, form) {
    if (!field) return true;
    if (field.type === "radio") {
      return Boolean(qs('input[name="' + field.name + '"]:checked', form));
    }
    if (field.type === "checkbox") return field.checked;
    return String(field.value || "").trim().length > 0;
  }

  function fieldContainer(field) {
    return field.closest(".field") || field.closest(".figma-pill-input") || field.closest("label") || field.parentElement || field;
  }

  function prepareRequiredFields(scope) {
    qsa("[required]", scope || document).forEach(function (field) {
      if (field.type === "radio" || field.classList.contains("sr-only")) return;
      var container = fieldContainer(field);
      if (!container || field.dataset.requiredPrepared === "true") return;
      var hint = document.createElement("small");
      hint.className = "field-required-hint";
      hint.id = field.id ? field.id + "-required-hint" : uid("required-hint");
      hint.textContent = "Obrigatório";
      field.insertAdjacentElement("afterend", hint);
      field.dataset.requiredPrepared = "true";
      var describedBy = String(field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
      if (describedBy.indexOf(hint.id) === -1) {
        describedBy.push(hint.id);
        field.setAttribute("aria-describedby", describedBy.join(" "));
      }
      field.addEventListener("input", function () {
        field.removeAttribute("aria-invalid");
        container.classList.remove("field-invalid");
      });
    });
  }

  function validateRequiredForm(form, options) {
    options = options || {};
    prepareRequiredFields(form);
    var invalid = [];
    qsa("[required]", form).forEach(function (field) {
      var valid = requiredFieldValue(field, form);
      var container = fieldContainer(field);
      if (!valid) {
        invalid.push(field);
        field.setAttribute("aria-invalid", "true");
        if (container) container.classList.add("field-invalid");
      } else {
        field.removeAttribute("aria-invalid");
        if (container) container.classList.remove("field-invalid");
      }
    });
    if (!invalid.length) return true;
    var first = invalid[0];
    if (first && typeof first.focus === "function" && first.type !== "radio") first.focus();
    showError(options.message || "Preencha os campos obrigatórios antes de salvar.");
    return false;
  }

  function confirmAction(options) {
    options = options || {};
    return new Promise(function (resolve) {
      var existing = qs(".confirm-overlay");
      if (existing) existing.remove();
      var previousFocus = document.activeElement;

      var overlay = document.createElement("div");
      var titleId = uid("confirm-title");
      var bodyId = uid("confirm-copy");
      overlay.className = "confirm-overlay";
      overlay.setAttribute("role", "presentation");
      overlay.innerHTML = [
        '<section class="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="' + titleId + '" aria-describedby="' + bodyId + '">',
        '<h2 id="' + titleId + '">' + escapeHtml(options.title || "Confirmar ação") + "</h2>",
        '<p id="' + bodyId + '">' + escapeHtml(options.body || "Você pode cancelar e voltar sem alterar nada.") + "</p>",
        '<div class="confirm-actions">',
        '<button class="button secondary" type="button" data-confirm-cancel>' + escapeHtml(options.cancelLabel || "Cancelar") + "</button>",
        '<button class="button ' + (options.danger ? "danger" : "primary") + '" type="button" data-confirm-ok>' + escapeHtml(options.confirmLabel || "Confirmar") + "</button>",
        "</div>",
        "</section>"
      ].join("");

      function close(result) {
        document.removeEventListener("keydown", onKeydown);
        if (overlay.parentNode) overlay.remove();
        if (previousFocus && typeof previousFocus.focus === "function") {
          previousFocus.focus();
        }
        resolve(result);
      }

      function focusableControls() {
        return qsa("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", overlay)
          .filter(function (item) { return !item.disabled && item.offsetParent !== null; });
      }

      function onKeydown(event) {
        if (event.key === "Escape") close(false);
        if (event.key !== "Tab") return;
        var focusables = focusableControls();
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }

      overlay.addEventListener("click", function (event) {
        if (event.target === overlay || event.target.closest("[data-confirm-cancel]")) close(false);
        if (event.target.closest("[data-confirm-ok]")) close(true);
      });
      document.addEventListener("keydown", onKeydown);
      document.body.appendChild(overlay);
      var cancelButton = qs("[data-confirm-cancel]", overlay);
      if (cancelButton) cancelButton.focus();
    });
  }

  function editDialog(options) {
    options = options || {};
    var fields = options.fields || [];
    return new Promise(function (resolve) {
      var existing = qs(".confirm-overlay");
      if (existing) existing.remove();
      var previousFocus = document.activeElement;
      var overlay = document.createElement("div");
      var dialogId = uid("edit-dialog");
      var bodyId = uid("edit-dialog-copy");

      function fieldHtml(field) {
        var id = uid("edit-field");
        var type = field.type || "text";
        var attrs = [
          'id="' + id + '"',
          'name="' + escapeHtml(field.name) + '"',
          'type="' + escapeHtml(type) + '"',
          'value="' + escapeHtml(field.value || "") + '"'
        ];
        if (field.required) attrs.push("required");
        if (field.min !== undefined) attrs.push('min="' + escapeHtml(field.min) + '"');
        if (field.max !== undefined) attrs.push('max="' + escapeHtml(field.max) + '"');
        if (field.step !== undefined) attrs.push('step="' + escapeHtml(field.step) + '"');
        return [
          '<label class="field compact-field">',
          "<span>" + escapeHtml(field.label || field.name) + "</span>",
          "<input " + attrs.join(" ") + ">",
          field.help ? "<small>" + escapeHtml(field.help) + "</small>" : "",
          "</label>"
        ].join("");
      }

      overlay.className = "confirm-overlay";
      overlay.setAttribute("role", "presentation");
      overlay.innerHTML = [
        '<section class="confirm-dialog edit-dialog" role="dialog" aria-modal="true" aria-labelledby="' + dialogId + '"' + (options.body ? ' aria-describedby="' + bodyId + '"' : "") + ">",
        '<h2 id="' + dialogId + '">' + escapeHtml(options.title || "Editar") + "</h2>",
        options.body ? '<p id="' + bodyId + '">' + escapeHtml(options.body) + "</p>" : "",
        '<form class="edit-dialog-form" novalidate>',
        fields.map(fieldHtml).join(""),
        '<div class="confirm-actions">',
        '<button class="button secondary" type="button" data-edit-cancel>' + escapeHtml(options.cancelLabel || "Cancelar") + "</button>",
        '<button class="button primary" type="submit">' + escapeHtml(options.confirmLabel || "Salvar") + "</button>",
        "</div>",
        "</form>",
        "</section>"
      ].join("");

      function close(result) {
        document.removeEventListener("keydown", onKeydown);
        if (overlay.parentNode) overlay.remove();
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
        resolve(result);
      }

      function focusableControls() {
        return qsa("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", overlay)
          .filter(function (item) { return !item.disabled && item.offsetParent !== null; });
      }

      function onKeydown(event) {
        if (event.key === "Escape") close(null);
        if (event.key !== "Tab") return;
        var focusables = focusableControls();
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }

      overlay.addEventListener("click", function (event) {
        if (event.target === overlay || event.target.closest("[data-edit-cancel]")) close(null);
      });
      overlay.addEventListener("submit", function (event) {
        var form = event.target.closest(".edit-dialog-form");
        if (!form) return;
        event.preventDefault();
        if (!validateRequiredForm(form, { message: options.errorMessage || "Preencha os campos obrigatórios antes de salvar." })) return;
        var values = {};
        var data = new FormData(form);
        fields.forEach(function (field) {
          values[field.name] = data.get(field.name);
        });
        close(values);
      });
      document.addEventListener("keydown", onKeydown);
      document.body.appendChild(overlay);
      var firstField = qs("input, select, textarea", overlay) || qs("[data-edit-cancel]", overlay);
      if (firstField) firstField.focus();
    });
  }

  function withLoading(message, worker) {
    showLoading(message);
    return Promise.resolve()
      .then(worker)
      .catch(function (error) {
        showError(error && error.message ? error.message : "Não foi possível concluir agora. Tente novamente em instantes.");
        throw error;
      })
      .finally(hideLoading);
  }

  function emptyState(title, body, actionLabel, href) {
    var actionHref = href && href !== "#" ? href : "";
    return [
      '<div class="empty-state proto-empty ux-empty">',
      "<h3>" + escapeHtml(title) + "</h3>",
      "<p>" + escapeHtml(body) + "</p>",
      actionLabel && actionHref ? '<a class="button small primary" href="' + escapeHtml(actionHref) + '">' + escapeHtml(actionLabel) + "</a>" : "",
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

  function energyScore(checkin) {
    var score = Number(checkin && checkin.energiaValor);
    if (score >= 1 && score <= 10) return Math.round(score);
    if (checkin && checkin.energia === "alta") return 8;
    if (checkin && checkin.energia === "baixa") return 3;
    return 6;
  }

  function energyLevel(checkin) {
    var score = energyScore(checkin);
    if (score <= 4) return "baixa";
    if (score >= 8) return "alta";
    return "media";
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

    var energy = energyLevel(checkin);
    var score = energyScore(checkin);

    if (energy === "baixa") {
      return {
        title: "Reduza a carga e proteja pausas",
        body: "Sua energia está em " + score + "/10. Escolha uma prioridade pequena, adie o que puder e deixe espaço para recuperação.",
        tag: "Energia baixa"
      };
    }

    if (energy === "alta") {
      return {
        title: "Use o pico para uma tarefa importante",
        body: "Sua energia está em " + score + "/10. Reserve um bloco de foco para algo de alto impacto e deixe tarefas leves para depois.",
        tag: "Energia alta"
      };
    }

    return {
      title: "Organize três prioridades possíveis",
      body: "Sua energia está em " + score + "/10. Mantenha a lista curta: uma tarefa importante, uma tarefa leve e uma pausa visível.",
      tag: "Energia média"
    };
  }

  function suggestFocusTask(tasks, checkin) {
    var open = sortTasks(tasks || getOpenTasks()).filter(function (task) {
      return !task.concluida;
    });
    if (!open.length) return null;
    if (hasLowMoodStreak() || (checkin && energyLevel(checkin) === "baixa")) {
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

  var lastStorageRecoveryAt = 0;

  function maybeShowStorageRecovery() {
    if (!window.PlennaStorage || !window.PlennaStorage.storageIssue || !window.PlennaStorage.storageIssue()) return;
    if (Date.now() - lastStorageRecoveryAt < 5000) return;
    lastStorageRecoveryAt = Date.now();
    showStorageRecovery();
  }

  window.addEventListener("plenna:storage-error", maybeShowStorageRecovery);
  document.addEventListener("DOMContentLoaded", maybeShowStorageRecovery);

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
    storageRecoveryMessage: storageRecoveryMessage,
    showStorageRecovery: showStorageRecovery,
    prepareRequiredFields: prepareRequiredFields,
    validateRequiredForm: validateRequiredForm,
    confirmAction: confirmAction,
    editDialog: editDialog,
    withLoading: withLoading,
    emptyState: emptyState,
    priorityRank: priorityRank,
    effortRank: effortRank,
    sortTasks: sortTasks,
    getOpenTasks: getOpenTasks,
    energyScore: energyScore,
    energyLevel: energyLevel,
    generateRecommendation: generateRecommendation,
    suggestFocusTask: suggestFocusTask,
    hasLowMoodStreak: hasLowMoodStreak,
    setActiveNav: setActiveNav,
    updateStatusTime: updateStatusTime
  };
})();
