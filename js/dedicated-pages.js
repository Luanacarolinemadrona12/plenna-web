(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var Data = window.PlennaData || {};
  var lastReminderId = "";
  var lastSettingKey = "";

  function h(value) {
    return Utils.escapeHtml(value);
  }

  function qs(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function chip(text, extra) {
    return '<span class="chip ' + (extra || "") + '">' + h(text) + "</span>";
  }

  function defaultSettings() {
    return {
      nome: "Luana Caroline",
      focoPadrao: 25,
      pausasInteligentes: true,
      checkinDiario: true,
      modoDificil: true
    };
  }

  function settings() {
    return Storage.read(Storage.KEYS.settings, defaultSettings());
  }

  function settingLabel(key) {
    var labels = {
      pausasInteligentes: "pausas inteligentes",
      checkinDiario: "check-in diário",
      modoDificil: "modo protetivo"
    };
    return labels[key] || "preferência";
  }

  function downloadText(fileName, content) {
    var blob = new Blob([content], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function moduleCount(key) {
    if (key === Storage.KEYS.settings) return Storage.read(Storage.KEYS.settings, null) ? 1 : 0;
    return Storage.all(key).length;
  }

  function readDateValue(item) {
    var value = item.data || item.criadoEm || item.createdAt || item.concluidaEm || item.atualizadoEm || item.prazo || item.updatedAt;
    if (!value) return null;
    var date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00") : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function filterByPeriod(list, period) {
    if (period === "all" || period === "tudo") return list.slice();
    var days = Number(period || 7);
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Math.max(1, days));
    return list.filter(function (item) {
      var date = readDateValue(item);
      return date ? date >= cutoff : true;
    });
  }

  function initSettingsPage() {
    var data = settings();
    var reminders = Storage.all(Storage.KEYS.reminders).filter(function (item) { return item.active !== false; }).length;
    qs("[data-settings-initial]").textContent = (data.nome || "L").charAt(0).toUpperCase();
    qs("[data-settings-name]").textContent = data.nome || "Luana Caroline";
    qsa("[data-focus-default]").forEach(function (node) {
      node.textContent = "foco leve · " + (data.focoPadrao || 25) + " min";
    });
    qsa("[data-reminder-count]").forEach(function (node) {
      node.textContent = reminders + " apoios ativos";
    });
    qsa("[data-setting-key]").forEach(function (node) {
      var key = node.dataset.settingKey;
      node.textContent = data[key] === false ? "pausado" : key === "pausasInteligentes" ? "contextual" : key === "modoDificil" ? "protetivo" : "ativo";
      node.classList.toggle("is-paused", data[key] === false);
      node.classList.toggle("is-active", data[key] !== false);
    });
    qsa("[data-toggle-setting]").forEach(function (button) {
      var key = button.dataset.toggleSetting;
      var active = data[key] !== false;
      button.textContent = "Ajustar";
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", "Ajustar " + settingLabel(key) + ". Estado atual: " + (active ? "ativo" : "pausado"));
      var card = button.closest(".setting-card");
      if (card) card.classList.toggle("just-updated", key === lastSettingKey);
    });
  }

  function renderMore() {
    var data = settings();
    var first = (data.nome || "Luana").split(/\s+/)[0] || "Luana";
    qsa("[data-more-name]").forEach(function (node) { node.textContent = first; });
    qsa("[data-more-initial]").forEach(function (node) { node.textContent = first.charAt(0).toUpperCase(); });
    qsa("[data-count]").forEach(function (node) {
      node.textContent = moduleCount(node.dataset.count);
    });
  }

  function reminderDefaults() {
    return [
      { id: "demo-checkin", title: "Check-in", body: "08:30 em dias úteis. Se passar do horário, o aviso volta mais leve à tarde.", time: "08:30", active: true, label: "Ver meu dia", badge: "ativo hoje" },
      { id: "demo-break", title: "Pausas inteligentes", body: "Depois de foco longo. Se a energia cair, aparece mais cedo.", time: "15:30", active: true, label: "Ver pausas", badge: "mais leve" },
      { id: "demo-habits", title: "Hábitos", body: "Hidratação perto das 15h, com tom leve quando a meta já foi feita.", time: "15:00", active: true, label: "Ver cuidados", badge: "sem cobrança" },
      { id: "demo-silent", title: "Modo silencioso", body: "20:00 às 07:00. Reduz avisos e protege descanso.", time: "20:00", active: true, label: "Ver foco", badge: "silencioso à noite" }
    ];
  }

  function reminderPanelLabel(item) {
    if (item.title === "Pausas inteligentes") return "Ver pausas";
    if (item.title === "Hábitos") return "Ver cuidados";
    if (item.title === "Modo silencioso") return "Ver foco";
    return "Ver meu dia";
  }

  function reminderRoute(item) {
    if (item.title === "Pausas inteligentes") return "micro-pauses.html";
    if (item.title === "Hábitos") return "habits.html";
    if (item.title === "Modo silencioso") return "focus.html";
    return "dashboard.html";
  }

  function renderReminders() {
    var list = Storage.all(Storage.KEYS.reminders);
    var activeCount = list.filter(function (item) { return item.active !== false; }).length;
    qs("[data-reminder-total]").textContent = activeCount + " apoios ativos";
    if (!list.length) {
      qs("#reminderList").innerHTML = [
        '<article class="reminder-empty-state">',
        "<h2>Nenhum apoio criado ainda</h2>",
        "<p>Crie um aviso simples para apoiar sua rotina sem pressão.</p>",
        '<button class="button primary" type="button" data-open-reminder-form>Criar apoio</button>',
        "</article>"
      ].join("");
      return;
    }
    qs("#reminderList").innerHTML = list.slice(0, 4).map(function (item) {
      var statusLabel = item.active === false ? "pausado" : (item.badge || "ativo hoje");
      var toggleLabel = item.active === false ? "Ativar" : "Pausar";
      var routeLabel = reminderPanelLabel(item);
      return [
        '<article class="reminder-card' + (item.id === lastReminderId ? " just-updated" : "") + '" data-reminder-id="' + h(item.id) + '">',
        '<div class="reminder-card-copy">',
        '<h3>' + h(item.title) + "</h3>",
        '<p><strong>' + h(item.time || "09:00") + '</strong> ' + h(item.body) + "</p>",
        "</div>",
        '<button class="chip reminder-state-chip ' + (item.active === false ? "is-paused" : "is-active") + '" type="button" data-toggle-reminder="' + h(item.id) + '">' + h(statusLabel) + "</button>",
        '<div class="reminder-card-actions">',
        '<button type="button" data-edit-reminder="' + h(item.id) + '">Ajustar apoio</button>',
        '<a href="' + h(reminderRoute(item)) + '">' + h(routeLabel) + "</a>",
        '<button class="reminder-danger-link" type="button" data-remove-reminder="' + h(item.id) + '">Remover</button>',
        '<span class="sr-only">' + h(toggleLabel) + " lembrete</span>",
        "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function initDashboardOperational() {
    var period = Storage.read("dashboardOperationalPeriod", "7");
    var tasks = filterByPeriod(Storage.all(Storage.KEYS.tasks), period);
    var focus = filterByPeriod(Storage.all(Storage.KEYS.focusSessions), period);
    var habits = Storage.all(Storage.KEYS.habits);
    var done = tasks.filter(function (task) { return task.concluida; }).length;
    var open = tasks.length - done;
    var delayed = tasks.filter(function (task) { return task.adiada || task.status === "adiada"; }).length;
    var focusMinutes = focus.reduce(function (sum, item) { return sum + Number(item.duracaoMinutos || Math.round((item.duracao || 0) / 60) || 0); }, 0);
    var habitMarks = habits.reduce(function (sum, habit) { return sum + Object.keys(habit.registrosPorData || {}).length; }, 0);
    var highEffort = tasks.filter(function (task) { return String(task.esforco || "").toLowerCase().includes("alto"); }).length;
    var lowEffort = tasks.filter(function (task) { return String(task.esforco || "").toLowerCase().includes("baixo"); }).length;
    var mediumEffort = Math.max(0, tasks.length - highEffort - done);
    var rate = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    var focusHours = Math.floor(focusMinutes / 60) + "h" + String(focusMinutes % 60).padStart(2, "0");
    var values = {
      open: open,
      done: done,
      rate: rate + "%",
      weekly: tasks.length,
      focusProject: focusHours,
      focus: focusMinutes + "m",
      habits: habitMarks,
      high: highEffort,
      medium: mediumEffort,
      delayed: delayed,
      highLabel: highEffort + " tarefas",
      mediumLabel: mediumEffort + " tarefas",
      lowLabel: lowEffort + " tarefas",
      delayedLabel: delayed + " tarefas"
    };
    var demoOnly = tasks.length && tasks.every(function (task) {
      return String(task.id || "").indexOf("demo-") === 0;
    });
    var demoReadingText = null;
    var demoActionText = null;
    var hasRoutineData = tasks.length || focusMinutes || habitMarks;
    document.body.classList.toggle("routine-empty", !hasRoutineData);
    if (demoOnly) {
      values.done = 24;
      values.rate = "82%";
      values.delayed = 6;
      values.weekly = 31;
      values.focusProject = "4h20";
      values.habits = Math.max(values.habits, 12);
      values.high = 8;
      values.highLabel = "8 tarefas";
      values.mediumLabel = "13 tarefas";
      values.lowLabel = "10 tarefas";
      values.delayedLabel = "6 tarefas";
      demoReadingText = "Sua carga está mais alta no meio da semana. Proteja uma pausa antes do próximo foco.";
      demoActionText = "Revise a semana e mova uma tarefa pesada para proteger sua energia.";
    }
    Object.keys(values).forEach(function (key) {
      qsa("[data-operational='" + key + "']").forEach(function (node) { node.textContent = values[key]; });
    });
    qsa("[data-operational-period]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.operationalPeriod === period);
    });
    qsa("[data-operational-label='done']").forEach(function (node) {
      node.textContent = period === "1" ? "hoje" : period === "30" ? "no mês" : "na semana";
    });
    qsa("[data-operational-label='period']").forEach(function (node) {
      node.textContent = period === "1" ? "itens de hoje" : period === "30" ? "itens do mês" : "itens planejados";
    });
    var emptyState = qs("[data-operational-empty]");
    if (emptyState) emptyState.hidden = Boolean(hasRoutineData);
    qsa("[data-load-kind]").forEach(function (bar) {
      var value = Number(values[bar.dataset.loadKind] || 0);
      bar.style.width = Math.min(92, 16 + value * 18) + "%";
    });
    qsa("[data-operational-reading]").forEach(function (node) {
      node.textContent = demoReadingText || (delayed || highEffort ? "Sua carga está mais alta no meio da semana. Proteja uma pausa antes do próximo foco." : "Sua rotina está leve neste período. Mantenha uma pausa curta entre os blocos de foco.");
    });
    qsa("[data-operational-action]").forEach(function (node) {
      node.textContent = demoActionText || (delayed || highEffort ? "Revise a semana e mova uma tarefa pesada para proteger sua energia." : "Mantenha o plano atual e reserve uma pausa depois do maior bloco de foco.");
    });
  }

  function initPlanningAdjust() {
    var adjustment = Storage.read("planningAdjustments", {});
    var summary = qs("[data-adjust-summary]");
    if (summary) {
      summary.textContent = adjustment.cargaReduzida ? "Foco 10h + tarefa pesada amanhã" : adjustment.horarioTrocado ? "Foco 10h + rotina leve antes" : "Foco 10h + pausa protegida";
    }
    qsa("[data-adjust-kind]").forEach(function (button) {
      var key = button.dataset.adjustKind;
      button.classList.toggle("active", Boolean(adjustment[key + "Ativo"] || adjustment[key]));
    });
  }

  function planningCopy(kind, block) {
    var title = block === "contrato" ? "contrato" : block === "foco" ? "foco" : block === "pausa" ? "pausa" : block === "leve" ? "tarefa leve" : block === "reuniao" ? "reunião" : "rotina";
    if (kind === "horario") return {
      badge: "movido",
      summary: "Foco 10h + rotina leve antes",
      detail: "O foco sai do começo do dia e entra em um horário mais confortável.",
      reason: "O bloco de " + title + " foi movido para reduzir atrito com a energia registrada.",
      conflict: "Conflito resolvido: tarefa de foco estava perto demais da rotina inicial."
    };
    if (kind === "carga") return {
      badge: block === "contrato" ? "adiado" : "reduzido",
      summary: "Carga reduzida + tarefa pesada amanhã",
      detail: "A tarefa pesada sai de hoje e o plano fica mais realista.",
      reason: "O bloco de " + title + " foi redistribuído porque exigia esforço alto no mesmo dia.",
      conflict: "Conflito resolvido: esforço alto concentrado antes e depois de compromisso fixo."
    };
    if (kind === "pausa") return {
      badge: "travado",
      summary: "Pausa 15h30 protegida",
      detail: "A pausa vira compromisso para recuperar energia antes do próximo bloco.",
      reason: "A pausa virou compromisso porque o check-in pede recuperação antes do último bloco.",
      conflict: "Conflito resolvido: tarde sem respiro entre reunião e pendências."
    };
    return {
      badge: "leve",
      summary: "Tarefa leve primeiro",
      detail: "O dia começa por uma ação pequena antes de voltar para blocos maiores.",
      reason: "O bloco de " + title + " entra primeiro para preservar ritmo sem aumentar carga.",
      conflict: "Conflito resolvido: o plano começa por uma ação possível antes de tarefas maiores."
    };
  }

  initPlanningAdjust = function () {
    var adjustment = Storage.read("planningAdjustments", {});
    var blocks = adjustment.blocks || {};
    var activeBlocks = Object.keys(blocks);
    var last = activeBlocks.length ? blocks[activeBlocks[activeBlocks.length - 1]] : null;
    var summary = qs("[data-adjust-summary]");
    var detail = qs("[data-adjust-detail]");
    var afterCard = qs("[data-adjust-after-card]");
    var saveSummary = qs("[data-save-summary]");
    var reason = qs("[data-adjust-reason]");
    var conflict = qs("[data-conflict-copy]");
    var conflictPanel = qs("[data-conflict-panel]");
    if (conflictPanel) conflictPanel.hidden = false;
    if (summary) {
      summary.textContent = adjustment.summary || (last && last.summary) || (adjustment.cargaReduzida ? "Foco 10h + tarefa pesada amanhã" : adjustment.horarioTrocado ? "Foco 10h + rotina leve antes" : "Foco 10h + pausa protegida");
    }
    if (detail) {
      detail.textContent = adjustment.detail || (last && last.detail) || "Pausa protegida e tarefa pesada fora do pico.";
    }
    if (afterCard) {
      afterCard.classList.toggle("is-updated", Boolean(last || adjustment.summary || adjustment.cargaReduzida || adjustment.horarioTrocado || adjustment.pausaProtegida || adjustment.prioridadeProtegida));
    }
    if (saveSummary) saveSummary.textContent = (summary && summary.textContent ? summary.textContent + "." : "Plano ajustado.");
    if (reason) reason.textContent = adjustment.motivo || (last && last.reason) || "Energia média-baixa detectada. O plano redistribui a tarefa mais pesada e protege recuperação depois da reunião.";
    if (conflict) conflict.textContent = adjustment.conflito || (last && last.conflict) || "Conflito previsto: foco pesado às 09h + reunião fixa às 14h reduz margem de recuperação.";
    qsa("[data-adjust-kind]").forEach(function (button) {
      var key = button.dataset.adjustKind;
      var block = button.dataset.adjustBlock;
      var blockActive = block && blocks[block] && blocks[block].kind === key;
      button.classList.toggle("active", Boolean(blockActive || adjustment[key + "Ativo"] || adjustment[key]));
      button.setAttribute("aria-pressed", String(Boolean(blockActive || adjustment[key + "Ativo"] || adjustment[key])));
    });
    qsa("[data-block-id]").forEach(function (item) {
      var state = blocks[item.dataset.blockId];
      item.classList.toggle("active", Boolean(state));
      var action = qs(".adjust-block-action", item);
      if (action && state) action.textContent = state.badge;
    });
  };

  function initExport() {
    var mount = qs("#exportModules");
    if (!mount || mount.classList.contains("visually-hidden")) return;
    var modules = [
      [Storage.KEYS.checkins, "Check-ins", "Humor, energia e fatores"],
      [Storage.KEYS.tasks, "Tarefas", "Prioridades, prazos e subtarefas"],
      [Storage.KEYS.habits, "Hábitos", "Sugestões e dias marcados"],
      [Storage.KEYS.focusSessions, "Foco", "Sessões e duração"],
      [Storage.KEYS.entries, "Diário e notas", "Entradas conectadas"]
    ];
    mount.innerHTML = modules.map(function (item) {
      return '<label class="figma-check-line dedicated-check-line"><span><strong>' + h(item[1]) + '</strong><small>' + h(item[2]) + ' · ' + moduleCount(item[0]) + ' itens</small></span><input type="checkbox" data-export-module="' + h(item[0]) + '" checked></label>';
    }).join("");
  }

  function updateExportPreview() {
    var period = Storage.read("exportPeriod", "7");
    var format = Storage.read("exportFormat", "resumo");
    var selected = qsa("[data-export-module]:checked").map(function (input) { return input.dataset.exportModule; });
    var total = selected.reduce(function (sum, key) { return sum + filterByPeriod(Storage.all(key), period).length; }, 0);
    var preview = qs("[data-dedicated-export-preview]");
    var periodLabel = period === "all" ? "Tudo" : period === "30" ? "Mês" : period === "1" ? "Hoje" : "Semana";
    if (preview) preview.textContent = "Formato: " + (format === "planilha" ? "Planilha" : format === "backup" ? "Arquivo de backup" : "Resumo visual") + "\nPeríodo: " + periodLabel + "\nInclui: " + selected.length + " áreas\nInformações encontradas: " + total;
    var copy = qs("[data-export-preview-copy]");
    var exportBlockedMessage = !selected.length ? "Escolha ao menos uma área para continuar." : "Ainda não há registros suficientes para exportar.";
    window.setTimeout(function () {
      if (copy) copy.textContent = total && selected.length ? total + " informações entram no relatório selecionado." : exportBlockedMessage;
      var button = qs("[data-dedicated-export]");
      if (button) {
        button.disabled = !selected.length || !total;
        button.title = button.disabled ? exportBlockedMessage : "";
      }
    }, 0);
  }

  initExport = function () {
    var mount = qs("#exportModules");
    if (!mount) return;
    var period = Storage.read("exportPeriod", "7");
    var modules = [
      [Storage.KEYS.checkins, "Check-ins", "Humor, energia e fatores"],
      [Storage.KEYS.tasks, "Tarefas", "Prioridades, prazos e subtarefas"],
      [Storage.KEYS.habits, "Hábitos", "Sugestões e dias marcados"],
      [Storage.KEYS.focusSessions, "Foco", "Sessões e duração"],
      [Storage.KEYS.entries, "Diário e notas", "Entradas conectadas"]
    ];
    mount.innerHTML = modules.map(function (item) {
      return '<label class="figma-check-line dedicated-check-line"><span><strong>' + h(item[1]) + '</strong><small>' + h(item[2]) + ' · ' + filterByPeriod(Storage.all(item[0]), period).length + ' itens no período</small></span><input type="checkbox" data-export-module="' + h(item[0]) + '" checked></label>';
    }).join("");
    qsa("[data-export-period]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.exportPeriod === period);
    });
    var format = Storage.read("exportFormat", "resumo");
    qsa("[data-export-format]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.exportFormat === format);
    });
    updateExportPreview();
  };

  function selectAllExportModules() {
    qsa("[data-export-module]").forEach(function (input) {
      input.checked = true;
    });
    updateExportPreview();
  }

  function initHabitEdit() {
    var id = Utils.getQueryParam("id");
    var habit = id ? Storage.find(Storage.KEYS.habits, id) : null;
    var form = qs("#dedicatedHabitForm");
    var categories = Data.categoriasHabito || ["Corpo", "Mente", "Trabalho"];
    var frequencies = Data.frequencias || ["Diário", "Semanal", "Flexível"];
    var categorySelect = qs("#habitCategory");
    var frequencySelect = qs("#habitFrequency");
    if (categorySelect) categorySelect.innerHTML = categories.map(function (item) { return "<option>" + h(item) + "</option>"; }).join("");
    if (frequencySelect) frequencySelect.innerHTML = frequencies.map(function (item) { return "<option>" + h(item) + "</option>"; }).join("");
    if (!form) return;
    if (!habit) {
      ensureHabitEditRecognition(form, habit);
      updateHabitEditRecognition(form);
      form.addEventListener("input", function () { updateHabitEditRecognition(form); });
      form.addEventListener("change", function () { updateHabitEditRecognition(form); });
      return;
    }
    form.dataset.habitId = habit.id;
    if (form.elements.nome) form.elements.nome.value = habit.nome || form.elements.nome.value || "";
    if (form.elements.categoria) form.elements.categoria.value = habit.categoria || form.elements.categoria.value || categories[0];
    if (form.elements.frequencia) form.elements.frequencia.value = habit.frequencia || form.elements.frequencia.value || frequencies[0];
    if (form.elements.metaMinima) form.elements.metaMinima.value = habit.metaMinima || form.elements.metaMinima.value || "";
    ensureHabitEditRecognition(form, habit);
    updateHabitEditRecognition(form);
    form.addEventListener("input", function () { updateHabitEditRecognition(form); });
    form.addEventListener("change", function () { updateHabitEditRecognition(form); });
    if (qs("[data-habit-title]")) qs("[data-habit-title]").textContent = habit.nome || "Hábito flexível";
  }

  function habitField(form, name, fallback) {
    return String(form.elements[name] ? form.elements[name].value : fallback || "").trim() || fallback || "";
  }

  function ensureHabitEditRecognition(form, habit) {
    var header = qs(".proto-topbar") || qs(".page-header");
    if (header && !qs("#habitEditContext")) {
      header.insertAdjacentHTML("afterend", [
        '<section class="card recognition-card habit-recognition-card" id="habitEditContext">',
        '<span class="recognition-label">Editando</span>',
        '<h2 id="habitEditContextTitle">Editando: ' + h(habit ? habit.nome || "Respiracao" : habitField(form, "nome", "Leitura")) + '</h2>',
        '<p id="habitEditContextMeta">Confira meta, frequencia e impacto antes de salvar.</p>',
        "</section>"
      ].join(""));
    }
    if (!qs("#habitSaveSummary")) {
      var actions = qs(".habit-edit-actions", form) || form.lastElementChild;
      var html = [
        '<section class="card recognition-card save-summary-card" id="habitSaveSummary" aria-live="polite">',
        '<span class="recognition-label">Resumo antes de salvar</span>',
        '<div class="recognition-grid">',
        '<span><small>Hábito</small><strong id="habitSummaryName">Leitura</strong></span>',
        '<span><small>Meta mínima</small><strong id="habitSummaryGoal">10 min</strong></span>',
        '<span><small>Frequência</small><strong id="habitSummaryFrequency">Diário</strong></span>',
        '<span><small>Contexto</small><strong id="habitSummaryCategory">Mente</strong></span>',
        "</div>",
        "</section>"
      ].join("");
      if (actions && actions.parentNode) actions.insertAdjacentHTML("beforebegin", html);
      else form.insertAdjacentHTML("beforeend", html);
    }
  }

  function updateHabitEditRecognition(form) {
    var name = habitField(form, "nome", "Hábito flexível");
    var goal = habitField(form, "metaMinima", "Meta mínima flexível");
    var frequency = habitField(form, "frequencia", "Diário");
    var category = habitField(form, "categoria", "Mente");
    Utils.setText("#habitEditContextTitle", "Editando: " + name);
    Utils.setText("#habitEditContextMeta", goal + " · " + frequency + " · " + category);
    Utils.setText("[data-habit-title]", name);
    Utils.setText("[data-habit-meta]", "mínimo " + goal + " · " + frequency);
    Utils.setText("[data-habit-impact]", "Impacto no bem-estar: " + habitImpactText(category));
    Utils.setText("#habitSummaryName", name);
    Utils.setText("#habitSummaryGoal", goal);
    Utils.setText("#habitSummaryFrequency", frequency);
    Utils.setText("#habitSummaryCategory", category);
  }

  function habitImpactText(category) {
    var key = String(category || "").toLowerCase();
    if (key.includes("corpo") || key.includes("sa")) return "cuidar do corpo com uma meta possível";
    if (key.includes("trabalho")) return "reduzir atrito antes das tarefas importantes";
    if (key.includes("casa")) return "deixar o ambiente mais leve sem cobrança";
    return "desacelerar e manter constância com gentileza";
  }

  function markQuickResult(trigger, message) {
    var card = trigger && trigger.closest(".note-card, .journal-entry, .figma-note-card, .figma-line");
    if (!card) return;
    card.classList.add("just-updated");
    var old = qs(".inline-status", card);
    if (old) old.remove();
    card.insertAdjacentHTML("beforeend", '<span class="inline-status">' + h(message) + "</span>");
  }

  function bindSharedActions() {
    document.addEventListener("click", async function (event) {
      var toastButton = event.target.closest("[data-toast]");
      if (toastButton) {
        Utils.notify(toastButton.dataset.toast, { kind: "success" });
      }

      var editSettings = event.target.closest("[data-edit-settings]");
      if (editSettings) {
        var current = settings();
        var profileValues = await Utils.editDialog({
          title: "Ajustar perfil",
          body: "Esse nome aparece nas telas de rotina e nos lembretes salvos neste aparelho.",
          fields: [
            { name: "nome", label: "Nome", value: current.nome || "Luana Caroline", required: true }
          ],
          confirmLabel: "Salvar"
        });
        if (!profileValues) return;
        Storage.write(Storage.KEYS.settings, Object.assign({}, current, { nome: profileValues.nome || current.nome || "Luana Caroline" }));
        Utils.notify("Perfil atualizado. O nome aparece nas telas principais.", { kind: "success" });
        initSettingsPage();
        renderMore();
      }

      var editFocus = event.target.closest("[data-edit-focus-default]");
      if (editFocus) {
        var focusSettings = settings();
        var focusValues = await Utils.editDialog({
          title: "Ajustar foco preferido",
          body: "Escolha uma duração confortável para começar rápido sem configurar tudo de novo.",
          fields: [
            { name: "focoPadrao", label: "Duração em minutos", type: "number", min: 5, max: 120, value: focusSettings.focoPadrao || 25, required: true, help: "Use entre 5 e 120 minutos." }
          ],
          confirmLabel: "Salvar"
        });
        if (!focusValues) return;
        var nextFocus = Number(focusValues.focoPadrao || focusSettings.focoPadrao || 25);
        Storage.write(Storage.KEYS.settings, Object.assign({}, focusSettings, { focoPadrao: Math.max(5, Math.min(120, nextFocus)) }));
        Utils.notify("Foco preferido atualizado.", { kind: "success" });
        initSettingsPage();
      }

      var toggleSetting = event.target.closest("[data-toggle-setting]");
      if (toggleSetting) {
        var data = settings();
        var key = toggleSetting.dataset.toggleSetting;
        data[key] = !data[key];
        lastSettingKey = key;
        Storage.write(Storage.KEYS.settings, data);
        Utils.notify(data[key] === false ? "Ajuste pausado. O cartão foi atualizado." : "Ajuste ativado. O cartão foi atualizado.", { kind: data[key] === false ? "warning" : "success" });
        initSettingsPage();
      }

      var clearLocal = event.target.closest("[data-clear-local]");
      if (clearLocal) {
        var clearConfirmed = await Utils.confirmAction({
          title: "Apagar dados deste aparelho?",
          body: "Isso apaga check-ins, tarefas, hábitos, diário e sessões salvas neste navegador.",
          cancelLabel: "Manter dados",
          confirmLabel: "Apagar dados",
          danger: true
        });
        if (!clearConfirmed) return;
        Storage.clearAppData();
        Utils.notify("Informações deste aparelho limpas.", { kind: "warning" });
        window.location.href = "../index.html";
      }

      var quickReminder = event.target.closest("[data-quick-reminder]");
      if (quickReminder) {
        var parts = quickReminder.dataset.quickReminder.split("|");
        var quickReminderItem = { id: Utils.uid("reminder"), title: parts[0], body: parts[1], time: parts[2], active: true, createdAt: new Date().toISOString() };
        Storage.add(Storage.KEYS.reminders, quickReminderItem);
        lastReminderId = quickReminderItem.id;
        Utils.notify("Apoio salvo na sua rotina.", { kind: "success" });
        renderReminders();
      }

      var openReminderForm = event.target.closest("[data-open-reminder-form]");
      if (openReminderForm) {
        var reminderShell = qs("[data-reminder-create-shell]");
        if (reminderShell) {
          reminderShell.open = true;
          var reminderTitle = qs('input[name="title"]', reminderShell);
          if (reminderTitle) reminderTitle.focus();
        }
      }

      var editReminder = event.target.closest("[data-edit-reminder]");
      if (editReminder) {
        var reminder = Storage.find(Storage.KEYS.reminders, editReminder.dataset.editReminder);
        if (!reminder) return;
        var reminderValues = await Utils.editDialog({
          title: "Ajustar apoio",
          body: "Esse apoio fica salvo neste aparelho e pode ser pausado quando quiser.",
          fields: [
            { name: "title", label: "Nome do apoio", value: reminder.title || "", required: true },
            { name: "body", label: "Mensagem", value: reminder.body || "", required: true },
            { name: "time", label: "Horário", type: "time", value: reminder.time || "09:00" }
          ],
          confirmLabel: "Salvar"
        });
        if (!reminderValues) return;
        Storage.update(Storage.KEYS.reminders, reminder.id, { title: reminderValues.title, body: reminderValues.body, time: reminderValues.time || reminder.time || "09:00" });
        lastReminderId = reminder.id;
        Utils.notify("Lembrete ajustado.", { kind: "success" });
        renderReminders();
      }

      var toggleReminder = event.target.closest("[data-toggle-reminder]");
      if (toggleReminder) {
        var item = Storage.find(Storage.KEYS.reminders, toggleReminder.dataset.toggleReminder);
        if (item) Storage.update(Storage.KEYS.reminders, item.id, { active: item.active === false });
        if (item) lastReminderId = item.id;
        if (item) Utils.notify(item.active === false ? "Apoio ativado." : "Apoio pausado.", { kind: item.active === false ? "success" : "warning" });
        renderReminders();
      }

      var operationalPeriod = event.target.closest("[data-operational-period]");
      if (operationalPeriod) {
        Storage.write("dashboardOperationalPeriod", operationalPeriod.dataset.operationalPeriod);
        initDashboardOperational();
        Utils.notify("Período da rotina atualizado.", { kind: "success" });
      }

      var adjust = event.target.closest("[data-adjust-kind]");
      if (adjust) {
        var currentAdjust = Storage.read("planningAdjustments", {});
        var kind = adjust.dataset.adjustKind;
        var block = adjust.dataset.adjustBlock || "global";
        var copy = planningCopy(kind, block);
        var blocks = Object.assign({}, currentAdjust.blocks || {});
        blocks[block] = Object.assign({ kind: kind, block: block, updatedAt: new Date().toISOString() }, copy);
        currentAdjust[kind] = true;
        currentAdjust.blocks = blocks;
        currentAdjust.summary = copy.summary;
        currentAdjust.detail = copy.detail;
        currentAdjust.motivo = copy.reason;
        currentAdjust.conflito = copy.conflict;
        currentAdjust.pausaProtegida = kind === "pausa" || currentAdjust.pausaProtegida;
        currentAdjust.cargaReduzida = kind === "carga" || currentAdjust.cargaReduzida;
        currentAdjust.horarioTrocado = kind === "horario" || currentAdjust.horarioTrocado;
        currentAdjust.prioridadeProtegida = kind === "prioridade" || currentAdjust.prioridadeProtegida;
        currentAdjust.atualizadoEm = new Date().toISOString();
        Storage.write("planningAdjustments", currentAdjust);
        Utils.notify("Resumo do depois atualizado.", { kind: "success" });
        initPlanningAdjust();
      }

      var resetAdjust = event.target.closest("[data-reset-adjust]");
      if (resetAdjust) {
        Storage.write("planningAdjustments", {});
        Utils.notify("Ajustes desfeitos. O plano voltou ao estado inicial.", { kind: "warning" });
        initPlanningAdjust();
      }

      var saveAdjust = event.target.closest("[data-save-adjust]");
      if (saveAdjust) {
        var confirmSave = await Utils.confirmAction({
          title: "Salvar planejamento?",
          body: "O plano de hoje será atualizado neste aparelho. Você ainda pode revisar os ajustes antes de confirmar.",
          cancelLabel: "Revisar",
          confirmLabel: "Salvar planejamento"
        });
        if (!confirmSave) return;
        var saved = Storage.read("planningAdjustments", {});
        Storage.write("planningAdjustments", Object.assign({}, saved, { salvo: true, atualizadoEm: new Date().toISOString() }));
        Storage.write("planningReturnMessage", { message: "Planejamento salvo. Seu dia foi atualizado.", kind: "success", at: new Date().toISOString() });
        Utils.notify("Planejamento salvo. Seu dia foi atualizado.", { kind: "success" });
        window.setTimeout(function () { window.location.href = "planning.html?status=planning-saved"; }, 900);
      }

      var exportButton = event.target.closest("[data-dedicated-export]");
      if (exportButton) {
        var selected = qsa("[data-export-module]:checked").map(function (input) { return input.dataset.exportModule; });
        if (!selected.length) {
          Utils.showError("Escolha ao menos uma área para continuar com o relatório.", {
            title: "Falta escolher o conteúdo",
            actionLabel: "Marcar áreas",
            onAction: selectAllExportModules
          });
          return;
        }
        var payload = {};
        selected.forEach(function (key) { payload[key] = Storage.all(key); });
        var hasData = selected.some(function (key) { return Storage.all(key).length; });
        if (!hasData) {
          Utils.showError("Ainda não há registros suficientes para exportar. Use check-in, tarefas, foco ou diário antes de gerar o relatório.", {
            title: "Relatório indisponível",
            actionLabel: "Voltar ao Dashboard",
            actionHref: "dashboard.html"
          });
          return;
        }
        var content = JSON.stringify({ geradoEm: new Date().toISOString(), inclui: selected, dados: payload }, null, 2);
        var fileName = "plenna-relatorio-" + Utils.todayISO() + ".json";
        downloadText(fileName, content);
        Storage.add(Storage.KEYS.exports, { id: Utils.uid("export"), data: new Date().toISOString(), tipo: "relatório do Plenna", nomeArquivo: fileName, conteudo: content });
        Utils.notify("Relatório exportado com sucesso.", { kind: "success" });
        window.setTimeout(function () { window.location.href = "export-success.html"; }, 300);
      }

      var staticNoteTask = event.target.closest("[data-static-note-task]");
      if (staticNoteTask) {
        Storage.add(Storage.KEYS.tasks, {
          id: Utils.uid("task"),
          titulo: staticNoteTask.dataset.staticNoteTask || "Nota conectada",
          descricao: staticNoteTask.dataset.staticNoteBody || "Criada a partir de uma nota.",
          prioridade: "media",
          esforco: "baixo",
          tempoEstimado: "25 min",
          impactoEmocional: "leve",
          prazo: "",
          categoria: "Notas",
          concluida: false,
          recorrencia: "Sem recorrência",
          lembrete: "Sem lembrete",
          subtarefas: [],
          criadoEm: new Date().toISOString(),
          ordem: Storage.all(Storage.KEYS.tasks).length
        });
        markQuickResult(staticNoteTask, "Nota transformada em tarefa.");
        Utils.notify("Nota transformada em tarefa.", { kind: "success" });
      }

      var staticNoteHabit = event.target.closest("[data-static-note-habit]");
      if (staticNoteHabit) {
        Storage.add(Storage.KEYS.habits, {
          id: Utils.uid("habit"),
          nome: staticNoteHabit.dataset.staticNoteHabit || "Hidratação 15h",
          categoria: "Corpo",
          frequencia: "Diário",
          metaMinima: "1 copo",
          registrosPorData: {},
          criadoEm: new Date().toISOString()
        });
        markQuickResult(staticNoteHabit, "Nota transformada em hábito.");
        Utils.notify("Nota transformada em hábito.", { kind: "success" });
      }

      var staticNoteProject = event.target.closest("[data-static-note-project]");
      if (staticNoteProject) {
        Storage.add(Storage.KEYS.entries, {
          id: Utils.uid("entry"),
          tipo: "nota",
          titulo: staticNoteProject.dataset.staticNoteProject || "Nota de projeto",
          conteudo: "Nota anexada ao projeto para virar próximo passo quando fizer sentido.",
          data: new Date().toISOString(),
          tags: ["projeto", "nota conectada"]
        });
        markQuickResult(staticNoteProject, "Nota movida para projeto.");
        Utils.notify("Nota movida para projeto.", { kind: "success" });
      }

      var deleteHabit = event.target.closest("[data-dedicated-delete-habit]");
      if (deleteHabit) {
        var deleteHabitConfirmed = await Utils.confirmAction({
          title: "Excluir hábito?",
          body: "Essa ação remove o hábito da sua rotina, mas não apaga suas outras informações.",
          cancelLabel: "Cancelar",
          confirmLabel: "Excluir",
          danger: true
        });
        if (!deleteHabitConfirmed) return;
        var form = qs("#dedicatedHabitForm");
        var habitId = form && form.dataset.habitId;
        if (!habitId && form && form.elements.nome) {
          var currentName = String(form.elements.nome.value || "").trim().toLowerCase();
          var foundHabit = Storage.all(Storage.KEYS.habits).find(function (item) {
            return String(item.nome || "").trim().toLowerCase() === currentName;
          });
          if (foundHabit) habitId = foundHabit.id;
        }
        if (!habitId) {
          Utils.notify("Nenhum hábito salvo foi encontrado para excluir.", { kind: "warning" });
          return;
        }
        Storage.remove(Storage.KEYS.habits, habitId);
        Utils.notify("Hábito excluído.", { kind: "warning" });
        window.setTimeout(function () { window.location.href = "habits.html"; }, 300);
      }

      var removeReminder = event.target.closest("[data-remove-reminder]");
      if (removeReminder) {
        var removeReminderConfirmed = await Utils.confirmAction({
          title: "Remover lembrete?",
          body: "Esse apoio deixa de aparecer, mas você pode criar outro quando quiser.",
          cancelLabel: "Cancelar",
          confirmLabel: "Remover",
          danger: true
        });
        if (!removeReminderConfirmed) return;
        Storage.remove(Storage.KEYS.reminders, removeReminder.dataset.removeReminder);
        Utils.notify("Apoio removido.", { kind: "warning" });
        renderReminders();
      }
    });

    document.addEventListener("submit", function (event) {
      var reminderForm = event.target.closest("[data-dedicated-reminder-form]");
      if (reminderForm) {
        event.preventDefault();
        if (!Utils.validateRequiredForm(reminderForm, { message: "Preencha título e mensagem para salvar o lembrete." })) return;
        var data = new FormData(reminderForm);
        var createdReminder = { id: Utils.uid("reminder"), title: data.get("title"), body: data.get("body"), time: data.get("time"), active: data.get("active") !== "false", createdAt: new Date().toISOString() };
        Storage.add(Storage.KEYS.reminders, createdReminder);
        lastReminderId = createdReminder.id;
        reminderForm.reset();
        var createShell = reminderForm.closest("[data-reminder-create-shell]");
        if (createShell) createShell.open = false;
        Utils.notify("Apoio salvo na sua rotina.", { kind: "success" });
        renderReminders();
      }

      var nightForm = event.target.closest("[data-night-form]");
      if (nightForm) {
        event.preventDefault();
        if (!Utils.validateRequiredForm(nightForm, { message: "Preencha os campos obrigatórios antes de salvar o fechamento." })) return;
        var night = new FormData(nightForm);
        var title = String(night.get("tituloEdit") || night.get("titulo") || "Fechamento do dia").trim();
        var newRitual = night.has("pesouEdit") || night.has("ajudouEdit") || night.has("lembrarEdit");
        var parts = [
          newRitual ? "" : String(night.get("resumoEdit") || "").trim(),
          newRitual ? "O que pesou: " + String(night.get("pesouEdit") || "").trim() : "Vitória: " + String(night.get("vitoriaEdit") || "").trim(),
          newRitual ? "O que ajudou: " + String(night.get("ajudouEdit") || "").trim() : "O que me drenou: " + String(night.get("drenouEdit") || "").trim(),
          newRitual ? "Lembrar amanhã: " + String(night.get("lembrarEdit") || "").trim() : "Aprendizado: " + String(night.get("aprendizadoEdit") || "").trim(),
          newRitual ? "" : "Plano: " + String(night.get("planoEdit") || "").trim()
        ].filter(function (part) {
          return !/:\s*$/.test(part) && part.trim();
        });
        Storage.add(Storage.KEYS.entries, {
          id: Utils.uid("entry"),
          tipo: "diario",
          titulo: title,
          conteudo: parts.join(" "),
          data: new Date().toISOString(),
          tags: String(night.get("tags") || "").split(",").map(function (tag) { return tag.trim(); }).filter(Boolean)
        });
        Storage.write("journalReturnMessage", { message: "Fechamento salvo. Diário atualizado.", kind: "success", at: new Date().toISOString() });
        Utils.notify("Fechamento salvo. Diário atualizado.", { kind: "success" });
        window.setTimeout(function () { window.location.href = "journal.html?status=night-saved"; }, 300);
      }

      var localNoteForm = event.target.closest('[data-local-form="note"]');
      if (localNoteForm) {
        event.preventDefault();
        if (!Utils.validateRequiredForm(localNoteForm, { message: "Preencha título e conteúdo para salvar a nota." })) return;
        var note = new FormData(localNoteForm);
        Storage.add(Storage.KEYS.entries, {
          id: Utils.uid("entry"),
          tipo: "nota",
          titulo: note.get("titulo"),
          conteudo: note.get("conteudo"),
          data: new Date().toISOString(),
          tags: []
        });
        localNoteForm.reset();
        Utils.notify("Nota salva. Caixa de notas atualizada.", { kind: "success" });
      }

      var habitForm = event.target.closest("#dedicatedHabitForm");
      if (habitForm) {
        event.preventDefault();
        if (!Utils.validateRequiredForm(habitForm, { message: "Dê um nome para salvar o hábito." })) return;
        var habitData = new FormData(habitForm);
        var old = habitForm.dataset.habitId ? Storage.find(Storage.KEYS.habits, habitForm.dataset.habitId) : null;
        Storage.replace(Storage.KEYS.habits, {
          id: habitForm.dataset.habitId || Utils.uid("habit"),
          nome: habitData.get("nome"),
          categoria: habitData.get("categoria"),
          frequencia: habitData.get("frequencia"),
          metaMinima: habitData.get("metaMinima"),
          registrosPorData: old ? old.registrosPorData || {} : {},
          criadoEm: old ? old.criadoEm : new Date().toISOString()
        });
        Utils.notify(old ? "Hábito atualizado. Rotina sincronizada." : "Hábito criado. Ele aparece em Hoje.", { kind: "success" });
        window.setTimeout(function () { window.location.href = "habits.html"; }, 300);
      }
    });
  }

  function bindExportActions() {
    document.addEventListener("click", function (event) {
      if (document.body.dataset.screen !== "export") return;
      var formatButton = event.target.closest("[data-export-format]");
      if (formatButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Storage.write("exportFormat", formatButton.dataset.exportFormat);
        initExport();
        Utils.notify("Formato do relatório selecionado.", { kind: "success" });
        return;
      }
      var periodButton = event.target.closest("[data-export-period]");
      if (periodButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Storage.write("exportPeriod", periodButton.dataset.exportPeriod);
        initExport();
        Utils.notify("Período do relatório atualizado.", { kind: "success" });
        return;
      }
      var exportButton = event.target.closest("[data-dedicated-export]");
      if (!exportButton) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var period = Storage.read("exportPeriod", "7");
      var format = Storage.read("exportFormat", "resumo");
      var selected = qsa("[data-export-module]:checked").map(function (input) { return input.dataset.exportModule; });
      if (!selected.length) {
        Utils.showError("Escolha ao menos uma área para continuar com o relatório.", {
          title: "Falta escolher o conteúdo",
          actionLabel: "Marcar áreas",
          onAction: selectAllExportModules
        });
        return;
      }
      var payload = {};
      selected.forEach(function (key) { payload[key] = filterByPeriod(Storage.all(key), period); });
      var hasData = selected.some(function (key) { return payload[key].length; });
      if (!hasData) {
        Utils.showError("Ainda não há registros suficientes para exportar. Use check-in, tarefas, foco ou diário antes de gerar o relatório.", {
          title: "Relatório indisponível",
          actionLabel: "Voltar ao Dashboard",
          actionHref: "dashboard.html"
        });
        return;
      }
      var content = JSON.stringify({ geradoEm: new Date().toISOString(), formato: format, periodo: period, inclui: selected, dados: payload }, null, 2);
      var fileName = "plenna-relatorio-" + Utils.todayISO() + ".json";
      downloadText(fileName, content);
      Storage.add(Storage.KEYS.exports, { id: Utils.uid("export"), data: new Date().toISOString(), tipo: "relatório do Plenna", nomeArquivo: fileName, conteudo: content });
      Utils.notify("Relatório exportado com sucesso.", { kind: "success" });
      window.setTimeout(function () { window.location.href = "export-success.html"; }, 300);
    }, true);

    document.addEventListener("change", function (event) {
      if (document.body.dataset.screen !== "export" || !event.target.matches("[data-export-module]")) return;
      updateExportPreview();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var screen = document.body.dataset.screen;
    bindExportActions();
    bindSharedActions();
    if (screen === "settings") initSettingsPage();
    if (screen === "more") renderMore();
    if (screen === "reminders") renderReminders();
    if (screen === "dashboard-operational") initDashboardOperational();
    if (screen === "planning-adjust") initPlanningAdjust();
    if (screen === "export") initExport();
    if (screen === "habit-edit") initHabitEdit();
  });
})();
