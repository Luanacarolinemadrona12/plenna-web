(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var Data = window.PlennaData || {};

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
    qs("[data-focus-default]").textContent = "foco leve · " + (data.focoPadrao || 25) + " min";
    qs("[data-reminder-count]").textContent = reminders + " lembretes ativos";
    qsa("[data-setting-key]").forEach(function (node) {
      var key = node.dataset.settingKey;
      node.textContent = data[key] === false ? "pausado" : key === "pausasInteligentes" ? "contextual" : key === "modoDificil" ? "protetivo" : "ativo";
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
      { id: "demo-checkin", title: "Check-in", body: "08:30 em dias úteis. Se você atrasar o check-in, o app reduz a cobrança e volta a sugerir à tarde.", time: "08:30", active: true, label: "Ver painel", badge: "ativo hoje" },
      { id: "demo-break", title: "Pausas inteligentes", body: "Depois de 50 min de foco. Em energia baixa, a pausa entra antes e com micro pausa sugerida.", time: "15:30", active: true, label: "Ver micro pausas", badge: "baseado no contexto" },
      { id: "demo-habits", title: "Hábitos", body: "Hidratação avisa perto das 15h. Quando você cumpre a meta mínima, o lembrete fica mais leve.", time: "15:00", active: true, label: "Ver histórico", badge: "flexível" },
      { id: "demo-silent", title: "Modo silencioso", body: "20:00 às 07:00. Em dia difícil, reduz lembretes não urgentes e prioriza acolhimento.", time: "20:00", active: true, label: "Ver foco", badge: "ativo" }
    ];
  }

  function reminderPanelLabel(item) {
    if (item.title === "Pausas inteligentes") return "Ver micro pausas";
    if (item.title === "Hábitos") return "Ver histórico";
    if (item.title === "Modo silencioso") return "Ver foco";
    return "Ver painel";
  }

  function reminderRoute(item) {
    if (item.title === "Pausas inteligentes") return "micro-pauses.html";
    if (item.title === "Hábitos") return "habits.html";
    if (item.title === "Modo silencioso") return "focus.html";
    return "dashboard.html";
  }

  function renderReminders() {
    var list = Storage.all(Storage.KEYS.reminders);
    var renderList = list.length ? list.slice(0, 4) : reminderDefaults();
    var activeCount = renderList.filter(function (item) { return item.active !== false; }).length;
    qs("[data-reminder-total]").textContent = activeCount + " lembretes ativos";
    qs("#reminderList").innerHTML = renderList.map(function (item) {
      var saved = list.some(function (savedItem) { return savedItem.id === item.id; });
      var badge = item.active === false ? "pausado" : item.badge || (item.title === "Pausas inteligentes" ? "baseado no contexto" : item.title === "Hábitos" ? "flexível" : "ativo hoje");
      var quick = h([item.title, item.body, item.time].join("|"));
      var secondAction = reminderPanelLabel(item);
      return [
        '<article class="reminder-card">',
        '<div class="reminder-card-copy">',
        '<h3>' + h(item.title) + "</h3>",
        '<p>' + h(item.body) + "</p>",
        "</div>",
        saved ? '<button class="chip reminder-toggle-chip" type="button" data-toggle-reminder="' + h(item.id) + '">' + h(badge) + "</button>" : '<span class="chip">' + h(badge) + "</span>",
        '<div class="reminder-card-actions">',
        saved ? '<button type="button" data-edit-reminder="' + h(item.id) + '">Editar</button>' : '<button type="button" data-quick-reminder="' + quick + '">Editar</button>',
        saved ? '<a href="' + h(reminderRoute(item)) + '">' + h(secondAction) + "</a>" : '<button type="button" data-quick-reminder="' + quick + '">' + h(secondAction) + "</button>",
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
    var demoProjectText = null;
    if (demoOnly) {
      values.done = 24;
      values.rate = "82%";
      values.delayed = 6;
      values.weekly = 31;
      values.focusProject = "4h20";
      values.high = 8;
      values.highLabel = "8 tarefas";
      values.mediumLabel = "13 tarefas";
      values.lowLabel = "10 tarefas";
      values.delayedLabel = "6 tarefas";
      demoProjectText = {
        faculdade: "9 tarefas · 2h10 foco",
        trabalho: "7 tarefas · 1h40 foco",
        pessoal: "5 tarefas · 0h30 foco"
      };
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
    var projectCounts = { faculdade: 0, trabalho: 0, pessoal: 0 };
    tasks.forEach(function (task) {
      var key = String(task.categoria || task.projeto || "pessoal").toLowerCase();
      if (key.includes("faculdade") || key.includes("estudo")) projectCounts.faculdade += 1;
      else if (key.includes("trabalho")) projectCounts.trabalho += 1;
      else projectCounts.pessoal += 1;
    });
    qsa("[data-project='faculdade']").forEach(function (node) { node.textContent = demoProjectText ? demoProjectText.faculdade : projectCounts.faculdade + " tarefas · " + focusHours + " foco"; });
    qsa("[data-project='trabalho']").forEach(function (node) { node.textContent = demoProjectText ? demoProjectText.trabalho : projectCounts.trabalho + " tarefas · " + Math.max(0, Math.floor(focusMinutes / 3 / 60)) + "h" + String(Math.floor(focusMinutes / 3) % 60).padStart(2, "0") + " foco"; });
    qsa("[data-project='pessoal']").forEach(function (node) { node.textContent = demoProjectText ? demoProjectText.pessoal : projectCounts.pessoal + " tarefas · 0h30 foco"; });
    qsa("[data-load-kind]").forEach(function (bar) {
      var value = Number(values[bar.dataset.loadKind] || 0);
      bar.style.width = Math.min(92, 16 + value * 18) + "%";
    });
    qsa("[data-operational-reading]").forEach(function (node) {
      node.textContent = delayed ? "Atrasos concentrados no período. Redistribua tarefas pesadas e proteja um bloco de recuperação." : "Carga estável no período. Mantenha foco em uma prioridade alta e use pausas curtas.";
    });
    qsa("[data-operational-action]").forEach(function (node) {
      node.textContent = delayed ? "Mover uma tarefa pesada, abrir o calendário semanal e redistribuir o dia com maior carga." : "Manter a agenda atual e reservar uma pausa depois do maior bloco de foco.";
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
    var title = block === "contrato" ? "contrato" : block === "foco" ? "foco" : block === "pausa" ? "pausa" : block === "reuniao" ? "reunião" : "rotina";
    if (kind === "horario") return {
      badge: "movido",
      summary: "Foco movido para 10h",
      reason: "O bloco de " + title + " foi movido para reduzir atrito com a energia registrada.",
      conflict: "Conflito resolvido: tarefa de foco estava perto demais da rotina inicial."
    };
    if (kind === "carga") return {
      badge: block === "contrato" ? "adiado" : "reduzido",
      summary: "Carga reduzida + tarefa pesada amanhã",
      reason: "O bloco de " + title + " foi redistribuído porque exigia esforço alto no mesmo dia.",
      conflict: "Conflito resolvido: esforço alto concentrado antes e depois de compromisso fixo."
    };
    if (kind === "pausa") return {
      badge: "travado",
      summary: "Pausa 15h30 protegida",
      reason: "A pausa virou compromisso porque o check-in pede recuperação antes do último bloco.",
      conflict: "Conflito resolvido: tarde sem respiro entre reunião e pendências."
    };
    return {
      badge: "fixo",
      summary: "Essencial protegido",
      reason: "O bloco de " + title + " ficou fixo para preservar compromisso ou prioridade real.",
      conflict: "Conflito resolvido: o plano agora diferencia compromisso fixo de tarefa ajustável."
    };
  }

  initPlanningAdjust = function () {
    var adjustment = Storage.read("planningAdjustments", {});
    var blocks = adjustment.blocks || {};
    var activeBlocks = Object.keys(blocks);
    var last = activeBlocks.length ? blocks[activeBlocks[activeBlocks.length - 1]] : null;
    var summary = qs("[data-adjust-summary]");
    var reason = qs("[data-adjust-reason]");
    var conflict = qs("[data-conflict-copy]");
    var conflictPanel = qs("[data-conflict-panel]");
    if (conflictPanel) conflictPanel.hidden = !last;
    if (summary) {
      summary.textContent = adjustment.summary || (last && last.summary) || (adjustment.cargaReduzida ? "Foco 10h + tarefa pesada amanhã" : adjustment.horarioTrocado ? "Foco 10h + rotina leve antes" : "Foco 10h + pausa protegida");
    }
    if (reason) reason.textContent = adjustment.motivo || (last && last.reason) || "Energia média-baixa detectada. O plano redistribui a tarefa mais pesada e protege recuperação depois da reunião.";
    if (conflict) conflict.textContent = adjustment.conflito || (last && last.conflict) || "Conflito previsto: foco pesado às 09h + reunião fixa às 14h reduz margem de recuperação.";
    qsa("[data-adjust-kind]").forEach(function (button) {
      var key = button.dataset.adjustKind;
      var block = button.dataset.adjustBlock;
      var blockActive = block && blocks[block] && blocks[block].kind === key;
      button.classList.toggle("active", Boolean(blockActive || adjustment[key + "Ativo"] || adjustment[key]));
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
      [Storage.KEYS.habits, "Hábitos", "Templates e registros por dia"],
      [Storage.KEYS.focusSessions, "Foco", "Sessões e duração"],
      [Storage.KEYS.entries, "Diário e notas", "Entradas conectadas"]
    ];
    mount.innerHTML = modules.map(function (item) {
      return '<label class="figma-check-line dedicated-check-line"><span><strong>' + h(item[1]) + '</strong><small>' + h(item[2]) + ' · ' + moduleCount(item[0]) + ' registros</small></span><input type="checkbox" data-export-module="' + h(item[0]) + '" checked></label>';
    }).join("");
  }

  function updateExportPreview() {
    var period = Storage.read("exportPeriod", "7");
    var selected = qsa("[data-export-module]:checked").map(function (input) { return input.dataset.exportModule; });
    var total = selected.reduce(function (sum, key) { return sum + filterByPeriod(Storage.all(key), period).length; }, 0);
    var preview = qs("[data-dedicated-export-preview]");
    if (preview) preview.textContent = JSON.stringify({ periodo: period, modulos: selected.length, registros: total }, null, 2);
    var copy = qs("[data-export-preview-copy]");
    if (copy) copy.textContent = total ? total + " registros entram no relatório selecionado." : "Exportação sem dados para o período escolhido.";
  }

  initExport = function () {
    var mount = qs("#exportModules");
    if (!mount) return;
    var period = Storage.read("exportPeriod", "7");
    var modules = [
      [Storage.KEYS.checkins, "Check-ins", "Humor, energia e fatores"],
      [Storage.KEYS.tasks, "Tarefas", "Prioridades, prazos e subtarefas"],
      [Storage.KEYS.habits, "Hábitos", "Templates e registros por dia"],
      [Storage.KEYS.focusSessions, "Foco", "Sessões e duração"],
      [Storage.KEYS.entries, "Diário e notas", "Entradas conectadas"]
    ];
    mount.innerHTML = modules.map(function (item) {
      return '<label class="figma-check-line dedicated-check-line"><span><strong>' + h(item[1]) + '</strong><small>' + h(item[2]) + ' · ' + filterByPeriod(Storage.all(item[0]), period).length + ' registros no período</small></span><input type="checkbox" data-export-module="' + h(item[0]) + '" checked></label>';
    }).join("");
    qsa("[data-export-period]").forEach(function (button) {
      button.classList.toggle("active", button.dataset.exportPeriod === period);
    });
    updateExportPreview();
  };

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
    if (!habit || !form) return;
    form.dataset.habitId = habit.id;
    if (form.elements.nome) form.elements.nome.value = habit.nome || form.elements.nome.value || "";
    if (form.elements.categoria) form.elements.categoria.value = habit.categoria || form.elements.categoria.value || categories[0];
    if (form.elements.frequencia) form.elements.frequencia.value = habit.frequencia || form.elements.frequencia.value || frequencies[0];
    if (form.elements.metaMinima) form.elements.metaMinima.value = habit.metaMinima || form.elements.metaMinima.value || "";
    if (qs("[data-habit-title]")) qs("[data-habit-title]").textContent = habit.nome || "Hábito flexível";
  }

  function bindSharedActions() {
    document.addEventListener("click", function (event) {
      var toastButton = event.target.closest("[data-toast]");
      if (toastButton) {
        Utils.notify(toastButton.dataset.toast, { kind: "success" });
      }

      var editSettings = event.target.closest("[data-edit-settings]");
      if (editSettings) {
        var current = settings();
        var nextName = window.prompt("Nome", current.nome || "Luana Caroline") || current.nome || "Luana Caroline";
        Storage.write(Storage.KEYS.settings, Object.assign({}, current, { nome: nextName }));
        Utils.notify("Configuração alterada.", { kind: "success" });
        initSettingsPage();
        renderMore();
      }

      var editFocus = event.target.closest("[data-edit-focus-default]");
      if (editFocus) {
        var focusSettings = settings();
        var nextFocus = Number(window.prompt("Duração padrão do foco", focusSettings.focoPadrao || 25) || focusSettings.focoPadrao || 25);
        Storage.write(Storage.KEYS.settings, Object.assign({}, focusSettings, { focoPadrao: Math.max(5, Math.min(120, nextFocus)) }));
        Utils.notify("Configuração alterada. Foco padrão atualizado.", { kind: "success" });
        initSettingsPage();
      }

      var toggleSetting = event.target.closest("[data-toggle-setting]");
      if (toggleSetting) {
        var data = settings();
        var key = toggleSetting.dataset.toggleSetting;
        data[key] = !data[key];
        Storage.write(Storage.KEYS.settings, data);
        Utils.notify("Configuração alterada.", { kind: "success" });
        initSettingsPage();
      }

      var clearLocal = event.target.closest("[data-clear-local]");
      if (clearLocal && window.confirm("Apagar dados locais deste navegador?")) {
        Storage.clearAppData();
        Utils.notify("Dados locais limpos.", { kind: "warning" });
        window.location.href = "../index.html";
      }

      var quickReminder = event.target.closest("[data-quick-reminder]");
      if (quickReminder) {
        var parts = quickReminder.dataset.quickReminder.split("|");
        Storage.add(Storage.KEYS.reminders, { id: Utils.uid("reminder"), title: parts[0], body: parts[1], time: parts[2], active: true, createdAt: new Date().toISOString() });
        Utils.notify("Lembrete criado.", { kind: "success" });
        renderReminders();
      }

      var editReminder = event.target.closest("[data-edit-reminder]");
      if (editReminder) {
        var reminder = Storage.find(Storage.KEYS.reminders, editReminder.dataset.editReminder);
        if (!reminder) return;
        var title = window.prompt("Título do lembrete", reminder.title) || reminder.title;
        var body = window.prompt("Mensagem", reminder.body) || reminder.body;
        Storage.update(Storage.KEYS.reminders, reminder.id, { title: title, body: body });
        Utils.notify("Lembrete editado.", { kind: "success" });
        renderReminders();
      }

      var toggleReminder = event.target.closest("[data-toggle-reminder]");
      if (toggleReminder) {
        var item = Storage.find(Storage.KEYS.reminders, toggleReminder.dataset.toggleReminder);
        if (item) Storage.update(Storage.KEYS.reminders, item.id, { active: item.active === false });
        if (item) Utils.notify(item.active === false ? "Lembrete ativado." : "Lembrete pausado.", { kind: item.active === false ? "success" : "warning" });
        renderReminders();
      }

      var operationalPeriod = event.target.closest("[data-operational-period]");
      if (operationalPeriod) {
        Storage.write("dashboardOperationalPeriod", operationalPeriod.dataset.operationalPeriod);
        initDashboardOperational();
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
        currentAdjust.motivo = copy.reason;
        currentAdjust.conflito = copy.conflict;
        currentAdjust.pausaProtegida = kind === "pausa" || currentAdjust.pausaProtegida;
        currentAdjust.cargaReduzida = kind === "carga" || currentAdjust.cargaReduzida;
        currentAdjust.horarioTrocado = kind === "horario" || currentAdjust.horarioTrocado;
        currentAdjust.prioridadeProtegida = kind === "prioridade" || currentAdjust.prioridadeProtegida;
        currentAdjust.atualizadoEm = new Date().toISOString();
        Storage.write("planningAdjustments", currentAdjust);
        Utils.notify("Bloco ajustado: " + copy.badge + ".", { kind: "success" });
        initPlanningAdjust();
      }

      var saveAdjust = event.target.closest("[data-save-adjust]");
      if (saveAdjust) {
        var saved = Storage.read("planningAdjustments", {});
        Storage.write("planningAdjustments", Object.assign({}, saved, { salvo: true, atualizadoEm: new Date().toISOString() }));
        Utils.notify("Planejamento salvo. Seu dia foi atualizado.", { kind: "success" });
        window.setTimeout(function () { window.location.href = "planning.html"; }, 350);
      }

      var exportButton = event.target.closest("[data-dedicated-export]");
      if (exportButton) {
        var selected = qsa("[data-export-module]:checked").map(function (input) { return input.dataset.exportModule; });
        if (!selected.length) {
          Utils.notify("Selecione ao menos um módulo para exportar.", { kind: "warning" });
          return;
        }
        var payload = {};
        selected.forEach(function (key) { payload[key] = Storage.all(key); });
        var hasData = selected.some(function (key) { return Storage.all(key).length; });
        if (!hasData) {
          Utils.notify("Exportação sem dados para os módulos selecionados.", { kind: "warning" });
          return;
        }
        var content = JSON.stringify({ geradoEm: new Date().toISOString(), modulos: selected, dados: payload }, null, 2);
        var fileName = "plenna-relatorio-" + Utils.todayISO() + ".json";
        downloadText(fileName, content);
        Storage.add(Storage.KEYS.exports, { id: Utils.uid("export"), data: new Date().toISOString(), tipo: "relatório local", nomeArquivo: fileName, conteudo: content });
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
        Utils.notify("Nota virou tarefa. Ela entrou na sua lista.", { kind: "success" });
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
        Utils.notify("Nota virou hábito. Ele aparece em Hoje.", { kind: "success" });
      }

      var deleteHabit = event.target.closest("[data-dedicated-delete-habit]");
      if (deleteHabit && window.confirm("Excluir este hábito?")) {
        var form = qs("#dedicatedHabitForm");
        if (form && form.dataset.habitId) Storage.remove(Storage.KEYS.habits, form.dataset.habitId);
        Utils.notify("Hábito excluído.", { kind: "warning" });
        window.setTimeout(function () { window.location.href = "habits.html"; }, 300);
      }
    });

    document.addEventListener("submit", function (event) {
      var reminderForm = event.target.closest("[data-dedicated-reminder-form]");
      if (reminderForm) {
        event.preventDefault();
        var data = new FormData(reminderForm);
        Storage.add(Storage.KEYS.reminders, { id: Utils.uid("reminder"), title: data.get("title"), body: data.get("body"), time: data.get("time"), active: data.get("active") !== "false", createdAt: new Date().toISOString() });
        reminderForm.reset();
        Utils.notify("Lembrete criado.", { kind: "success" });
        renderReminders();
      }

      var nightForm = event.target.closest("[data-night-form]");
      if (nightForm) {
        event.preventDefault();
        var night = new FormData(nightForm);
        Storage.add(Storage.KEYS.entries, {
          id: Utils.uid("entry"),
          tipo: "diario",
          titulo: night.get("titulo") || "Fechamento do dia",
          conteudo: night.get("conteudo") || "",
          data: new Date().toISOString(),
          tags: String(night.get("tags") || "").split(",").map(function (tag) { return tag.trim(); }).filter(Boolean)
        });
        Utils.notify("Fechamento salvo. Diário atualizado.", { kind: "success" });
        window.setTimeout(function () { window.location.href = "journal.html"; }, 300);
      }

      var localNoteForm = event.target.closest('[data-local-form="note"]');
      if (localNoteForm) {
        event.preventDefault();
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
      var periodButton = event.target.closest("[data-export-period]");
      if (periodButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        Storage.write("exportPeriod", periodButton.dataset.exportPeriod);
        initExport();
        return;
      }
      var exportButton = event.target.closest("[data-dedicated-export]");
      if (!exportButton) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var period = Storage.read("exportPeriod", "7");
      var selected = qsa("[data-export-module]:checked").map(function (input) { return input.dataset.exportModule; });
      if (!selected.length) {
        Utils.showError("Selecione ao menos um módulo para exportar.");
        return;
      }
      var payload = {};
      selected.forEach(function (key) { payload[key] = filterByPeriod(Storage.all(key), period); });
      var hasData = selected.some(function (key) { return payload[key].length; });
      if (!hasData) {
        Utils.showError("Exportação sem dados para o período selecionado.");
        return;
      }
      var content = JSON.stringify({ geradoEm: new Date().toISOString(), periodo: period, modulos: selected, dados: payload }, null, 2);
      var fileName = "plenna-relatorio-" + Utils.todayISO() + ".json";
      downloadText(fileName, content);
      Storage.add(Storage.KEYS.exports, { id: Utils.uid("export"), data: new Date().toISOString(), tipo: "relatório local", nomeArquivo: fileName, conteudo: content });
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
