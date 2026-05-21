(function () {
  "use strict";

  function isRootPage() {
    return !window.location.pathname.replace(/\\/g, "/").includes("/pages/");
  }

  function pagePath(file) {
    return isRootPage() ? "pages/" + file : file;
  }

  var accessibilityObserverStarted = false;
  var PRIVATE_SCREENS = ["prototype-overview", "checkin-states", "empty-states"];

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function ensureMainTarget() {
    var main = document.querySelector("main");
    if (!main) return;
    if (!main.id) main.id = "conteudo";
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
  }

  function ensureSkipLink() {
    if (document.querySelector(".skip-link")) return;
    var link = document.createElement("a");
    link.className = "skip-link";
    link.href = "#conteudo";
    link.textContent = "Pular para conteúdo";
    link.addEventListener("click", function () {
      var main = document.getElementById("conteudo");
      if (main && typeof main.focus === "function") {
        main.focus({ preventScroll: false });
      }
    });
    document.body.insertBefore(link, document.body.firstChild);
  }

  function escapeSelector(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value || "").replace(/["\\]/g, "\\$&");
  }

  function ensureId(node, prefix) {
    if (node.id) return node.id;
    node.id = (prefix || "plenna") + "-" + Math.random().toString(36).slice(2, 9);
    return node.id;
  }

  function readableFieldName(field) {
    var explicit = field.getAttribute("aria-label") || field.getAttribute("placeholder") || field.getAttribute("name") || field.id;
    var names = {
      title: "Título",
      taskTitle: "Título da tarefa",
      noteText: "Texto da nota",
      reminderTitle: "Nome do apoio",
      reminderTime: "Horário",
      reminderWhen: "Horário",
      duration: "Duração",
      query: "Busca",
      search: "Busca",
      reason: "Motivo",
      name: "Nome",
      time: "Horário",
      email: "E-mail"
    };
    if (explicit && names[explicit]) return names[explicit];
    if (!explicit) return field.tagName === "SELECT" ? "Seleção" : "Campo";
    return explicit
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function hasAssociatedLabel(field) {
    if (!field || field.type === "hidden") return true;
    if (field.closest("label")) return true;
    if (field.getAttribute("aria-label") || field.getAttribute("aria-labelledby")) return true;
    if (field.id && document.querySelector('label[for="' + escapeSelector(field.id) + '"]')) return true;
    return false;
  }

  function shouldShowGeneratedLabel(field) {
    if (!field.closest("form")) return false;
    if (field.closest(".search-row, .task-search, .filter-row, .chip-row, .segmented, .task-view-tabs")) return false;
    return !!field.closest(".figma-inline-form, .reminder-create-form, .settings-dialog, .confirm-dialog, .form-card, .card");
  }

  function ensureAccessibleControls(scope) {
    var root = scope || document;
    all("[tabindex]", root).forEach(function (node) {
      var value = Number(node.getAttribute("tabindex"));
      if (value > 0) node.setAttribute("tabindex", "0");
    });

    all("input, select, textarea", root).forEach(function (field, index) {
      if (field.type === "hidden" || field.disabled) return;
      if (hasAssociatedLabel(field)) {
        var wrappedLabel = field.closest("label");
        var labelText = wrappedLabel ? wrappedLabel.textContent.replace(/\s+/g, " ").trim() : "";
        if ((field.type === "radio" || field.type === "checkbox") && labelText) {
          field.setAttribute("aria-label", labelText + (field.checked ? ", selecionado" : ""));
        }
        return;
      }
      var label = readableFieldName(field);
      field.setAttribute("aria-label", label);
      if (!shouldShowGeneratedLabel(field)) return;
      if (field.dataset.generatedLabel === "true") return;
      var span = document.createElement("span");
      span.className = "generated-field-label";
      span.id = "label-" + window.location.pathname.replace(/\W+/g, "-") + "-" + index;
      span.textContent = label;
      field.parentNode.insertBefore(span, field);
      field.dataset.generatedLabel = "true";
      if (!field.id) field.id = "field-" + window.location.pathname.replace(/\W+/g, "-") + "-" + index;
      field.setAttribute("aria-labelledby", span.id);
    });

    all("button, a, [role='button']", root).forEach(function (control) {
      var visibleText = (control.textContent || "").trim();
      if (visibleText || control.getAttribute("aria-label")) return;
      control.setAttribute("aria-label", control.title || control.dataset.label || "Ação");
    });

    all("[role='button']", root).forEach(function (control) {
      if (!control.hasAttribute("tabindex")) control.setAttribute("tabindex", "0");
      if (control.dataset.keyboardReady === "true") return;
      control.dataset.keyboardReady = "true";
      control.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        control.click();
      });
    });
  }

  function ensureStateSemantics(scope) {
    var root = scope || document;
    var currentFile = window.location.pathname.split("/").pop() || "index.html";

    all(".task-view-tabs a, .dashboard-mode-tabs a, .bottom-nav a", root).forEach(function (link) {
      var href = (link.getAttribute("href") || "").split("?")[0].split("#")[0];
      var file = href.split("/").pop();
      var active = link.classList.contains("active") || link.dataset.page === document.body.dataset.page || file === currentFile;
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    all("button.active, .segmented button, .operational-period-tabs button, .task-filter", root).forEach(function (button) {
      if (button.tagName !== "BUTTON") return;
      button.setAttribute("aria-pressed", button.classList.contains("active") ? "true" : "false");
    });

    all("input[type='radio'], input[type='checkbox']", root).forEach(function (input) {
      var label = input.closest("label");
      if (!label) return;
      label.classList.toggle("is-selected", input.checked);
      var text = label.textContent.replace(/\s+/g, " ").trim();
      if (text) input.setAttribute("aria-label", text + (input.checked ? ", selecionado" : ""));
    });

    all(".screen-status", root).forEach(function (status) {
      if (!status.hasAttribute("role")) status.setAttribute("role", status.classList.contains("error") ? "alert" : "status");
      if (!status.hasAttribute("aria-live")) status.setAttribute("aria-live", status.classList.contains("error") ? "assertive" : "polite");
    });

    all(".app-error-banner", root).forEach(function (banner) {
      banner.setAttribute("role", "alert");
      banner.setAttribute("aria-live", "assertive");
    });
  }

  function redirectPrivateScreens() {
    var screen = document.body.dataset.screen || "";
    var params = new URLSearchParams(window.location.search);
    if (PRIVATE_SCREENS.indexOf(screen) === -1 || params.get("debug") === "1") return false;
    window.location.replace(pagePath("more.html"));
    return true;
  }

  function startAccessibilityObserver() {
    if (accessibilityObserverStarted || !window.MutationObserver || !document.body) return;
    accessibilityObserverStarted = true;
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      window.setTimeout(function () {
        scheduled = false;
        ensureMainTarget();
        ensureAccessibleControls(document);
        ensureStateSemantics(document);
        applyUxChecklist(document);
      }, 40);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function pageNextStep(screen, page) {
    var map = {
      tasks: ["Criar tarefa", "task-new.html"],
      "task-new": ["Voltar para tarefas", "tasks.html"],
      "task-edit": ["Voltar para tarefas", "tasks.html"],
      "calendar-week": ["Adicionar tarefa", "task-new.html"],
      "calendar-month": ["Adicionar tarefa", "task-new.html"],
      habits: ["Criar hábito", "habit-new.html"],
      "habit-new": ["Ver hábitos", "habits.html"],
      "habit-edit": ["Ver hábitos", "habits.html"],
      "habit-templates": ["Ver hábitos", "habits.html"],
      focus: ["Iniciar foco", "focus-session.html"],
      "focus-session": ["Voltar ao foco", "focus.html"],
      "focus-break": ["Voltar ao foco", "focus.html"],
      "micro-pauses": ["Voltar ao foco", "focus.html"],
      journal: ["Criar fechamento de hoje", "journal-night.html"],
      "journal-night": ["Voltar ao diário", "journal.html"],
      notes: ["Criar nota", "notes.html"],
      dashboard: ["Fazer check-in", "checkin.html"],
      "dashboard-history": ["Fazer check-in", "checkin.html"],
      "dashboard-operational": ["Criar tarefa", "task-new.html"],
      export: ["Voltar ao resumo", "dashboard.html"],
      settings: ["Ver lembretes", "reminders.html"],
      reminders: ["Criar apoio", "reminders.html"],
      goals: ["Ver progresso", "dashboard.html"],
      planning: ["Reorganizar com calma", "planning-adjust.html"],
      "planning-adjust": ["Voltar ao plano", "planning.html"],
      more: ["Ver configurações", "settings.html"]
    };
    return map[screen] || map[page] || ["Voltar ao início", pagePath("home.html")];
  }

  function hasRealAction(node) {
    return !!node.querySelector("a[href]:not([href='#']), button:not([disabled])");
  }

  function isElementVisible(node) {
    if (!node || node.hidden || node.closest("[hidden], [aria-hidden='true']")) return false;
    var style = window.getComputedStyle ? window.getComputedStyle(node) : null;
    if (style && (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0)) return false;
    var rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function ensureEmptyNextSteps(root) {
    var main = document.querySelector("main");
    if (!main) return;
    var screen = document.body.dataset.screen || "";
    var page = document.body.dataset.page || "";
    all(".empty-state, .proto-empty, .ux-empty, .reminder-empty-state, .operational-empty-state", root || main).forEach(function (empty) {
      empty.classList.add("ux-empty-polished");
      if (empty.dataset.nextStepChecked === "true" || hasRealAction(empty)) return;
      var next = pageNextStep(screen, page);
      var action = document.createElement("a");
      action.className = "button primary small ux-empty-action";
      action.href = next[1];
      action.textContent = next[0];
      empty.appendChild(action);
      empty.dataset.nextStepChecked = "true";
    });
  }

  function isChecklistAction(control) {
    if (!control || control.disabled || control.hidden) return false;
    if (!isElementVisible(control)) return false;
    if (control.closest(".bottom-nav, .task-view-tabs, .segmented, .toast, .page-back-link, .chip-row, .status-bar")) return false;
    if (control.closest("[hidden]")) return false;
    var text = (control.textContent || control.getAttribute("aria-label") || "").trim();
    return !!text;
  }

  function actionText(control) {
    return (control.getAttribute("aria-label") || control.textContent || "").replace(/\s+/g, " ").trim();
  }

  function primaryActionScore(control) {
    var text = actionText(control);
    if (!text) return -1;
    if (/criar|adicionar|nova|novo|come[cç]ar|continuar|salvar|iniciar|fazer|organizar|exportar/i.test(text)) return 30;
    if (/aceitar|ajustar|usar|rotina|check-in|lembrete|micro pausa|ver meu dia|ver painel|ver hist[oó]rico|ver configura[cç][oõ]es/i.test(text)) return 20;
    if (/editar|abrir|ver/i.test(text)) return 10;
    return -1;
  }

  function inferPrimaryAction(root) {
    var main = document.querySelector("main");
    if (!main) return null;
    var screen = document.body.dataset.screen || "";
    var preferredSelector = {
      dashboard: ".dashboard-mode-tabs a[href*='dashboard-operational'], .dashboard-mode-tabs a",
      "dashboard-history": ".dashboard-mode-tabs a[href*='dashboard-operational'], .dashboard-mode-tabs a",
      reminders: ".reminder-create-shell > summary, .figma-reminder-form button[type='submit'], .reminder-create-form button[type='submit'], [data-open-reminder-form], .reminder-action-row a[href*='reminders']"
    }[screen];
    if (preferredSelector) {
      var preferred = all(preferredSelector, main).filter(isChecklistAction);
      if (preferred.length) return preferred[0];
    }
    var candidates = all("a[href], button, summary, [role='button']", root || main).filter(function (action) {
      if (!isChecklistAction(action)) return false;
      if (action.matches(".danger, .button.danger, [data-clear-local], [data-remove-reminder], [data-delete-task], [data-delete-habit]")) return false;
      return primaryActionScore(action) >= 0;
    }).sort(function (a, b) {
      return primaryActionScore(b) - primaryActionScore(a);
    });
    return candidates[0] || null;
  }

  function normalizePrimaryActions(root) {
    var main = document.querySelector("main");
    if (!main) return;
    var primaryActions = all(".button.primary, button.primary, a.button.primary, [data-primary-action]", root || main).filter(isChecklistAction);
    if (!primaryActions.length) {
      var inferred = inferPrimaryAction(root || main);
      if (inferred) {
        inferred.setAttribute("data-primary-action", "true");
        primaryActions = [inferred];
      }
    }
    var first = null;
    primaryActions.forEach(function (action) {
      action.classList.remove("ux-main-action", "ux-secondary-primary");
      if (!first) {
        first = action;
        action.classList.add("ux-main-action");
        action.setAttribute("data-main-action", "true");
      } else if (!action.matches(".danger, .button.danger, [data-keep-primary]")) {
        action.classList.add("ux-secondary-primary");
        action.removeAttribute("data-main-action");
      }
    });
  }

  function softenLongCopy(root) {
    all("main .card p, main .proto-empty p, main .empty-state p, main .figma-card p, main .context-help, main .micro-auto-card p, main .reminder-card-copy p", root || document).forEach(function (node) {
      var text = (node.textContent || "").trim();
      if (text.length < 118 || node.dataset.allowLongCopy === "true") return;
      node.classList.add("ux-short-copy");
      if (!node.title) node.title = text;
    });
  }

  function applyUxChecklist(scope) {
    var main = document.querySelector("main");
    if (!main) return;
    main.classList.add("ux-checklist");
    ensureEmptyNextSteps(scope || main);
    normalizePrimaryActions(scope || main);
    softenLongCopy(scope || main);
    ensureStateSemantics(scope || main);
  }

  function init() {
    if (redirectPrivateScreens()) return;
    ensureMainTarget();
    ensureSkipLink();
    renderNav();

    if (window.PlennaUtils) {
      window.PlennaUtils.updateStatusTime();
    }

    var page = document.body.dataset.page;
    if (page && window.PlennaUtils) {
      window.PlennaUtils.setActiveNav(page);
    }
    if (window.PlennaUtils.prepareRequiredFields) {
      window.setTimeout(function () {
        window.PlennaUtils.prepareRequiredFields(document);
      }, 0);
      document.addEventListener("invalid", function (event) {
        var form = event.target && event.target.form;
        event.preventDefault();
        if (!form || form.dataset.validationShown === "true") return;
        form.dataset.validationShown = "true";
        window.PlennaUtils.validateRequiredForm(form, { message: "Preencha os campos obrigatórios antes de salvar." });
        window.setTimeout(function () {
          delete form.dataset.validationShown;
        }, 0);
      }, true);
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

    window.setTimeout(ensureBackLink, 0);
    window.setTimeout(function () {
      ensureAccessibleControls(document);
      applyUxChecklist(document);
      startAccessibilityObserver();
    }, 0);
  }

  function ensureBackLink() {
    if (isRootPage() || document.querySelector(".page-back-link")) return;
    var screen = document.body.dataset.screen || "";
    if (["home", "tasks", "habits", "focus", "more"].indexOf(screen) >= 0) return;
    var main = document.querySelector("main");
    var shell = document.querySelector(".app-shell");
    if (!main || !shell) return;
    var link = document.createElement("a");
    link.className = "page-back-link";
    link.textContent = "Voltar";
    link.href = backHref(screen, document.body.dataset.page || "");
    main.insertBefore(link, main.firstChild);
  }

  function backHref(screen, page) {
    var map = {
      "task-new": "tasks.html",
      "task-edit": "tasks.html",
      "task-form": "tasks.html",
      "habit-new": "habits.html",
      "habit-edit": "habits.html",
      "habit-templates": "habits.html",
      "focus-session": "focus.html",
      "focus-break": "focus.html",
      "micro-pauses": "focus.html",
      "checkin": "home.html",
      "checkin-success": "home.html",
      "planning": "home.html",
      "planning-adjust": "planning.html",
      "journal-night": "journal.html",
      "notes": "more.html",
      "export-success": "export.html",
      "export-ready": "export.html"
    };
    if (map[screen]) return map[screen];
    if (page === "tasks") return "tasks.html";
    if (page === "habits") return "habits.html";
    if (page === "focus") return "focus.html";
    if (page === "more") return "more.html";
    return "home.html";
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
