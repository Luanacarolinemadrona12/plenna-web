(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var lastPlanningTaskId = null;
  var lastPlanningMessage = "";

  function getTasks() {
    return Storage.all(Storage.KEYS.tasks);
  }

  function saveTasks(tasks) {
    Storage.setAll(Storage.KEYS.tasks, tasks);
  }

  function snapshotPlanning(tasks) {
    Storage.write("planningLastSnapshot", {
      tasks: tasks.map(function (task) {
        return {
          id: task.id,
          ordem: task.ordem,
          prioridade: task.prioridade,
          prazo: task.prazo,
          adiada: task.adiada,
          planejada: task.planejada
        };
      }),
      atualizadoEm: new Date().toISOString()
    });
  }

  function normalizeOrder() {
    var tasks = getTasks();
    var changed = false;
    var open = Utils.sortTasks(tasks.filter(function (task) { return !task.concluida; }));
    open.forEach(function (task, index) {
      if (task.ordem !== index) {
        task.ordem = index;
        changed = true;
      }
    });
    if (changed) saveTasks(tasks);
  }

  function renderPlanning() {
    normalizeOrder();
    var checkin = Utils.activeCheckin();
    var recommendation = Utils.generateRecommendation(checkin);
    var tasks = Utils.sortTasks(getTasks().filter(function (task) { return !task.concluida; }));

    var title = "Hoje vamos manter o dia possível.";
    var summary = "3 prioridades, pausa protegida às 15h e uma tarefa pesada adiada.";
    if (!checkin || checkin.energia === "baixa" || recommendation.tag === "Plano protetivo" || recommendation.tag === "Dia de cuidado") {
      title = "Hoje vamos manter o dia possível.";
      summary = "3 prioridades, pausa protegida às 15h e uma tarefa pesada adiada.";
    }
    Utils.setText("#planningRecommendation", title);
    Utils.setText("#planningSummary", summary);

    if (!tasks.length) {
      Utils.qs("#planningList").innerHTML = [
        '<div class="empty-state proto-empty">',
        "<h3>Semana sem planejamento</h3>",
        "<p>Defina prioridades, distribua carga e proteja pausas antes de começar.</p>",
        '<a class="button small primary" href="task-new.html">Criar tarefa</a>',
        "</div>"
      ].join("");
      return;
    }

    var demoOnly = tasks.every(function (task) {
      return String(task.id || "").indexOf("demo-") === 0;
    });
    if (demoOnly) {
      var demoBlocks = [
        ["09:00", "Foco leve · Apresentação Q2", "Boa para agora: prioridade alta com esforço médio.", "Sugerido"],
        ["11:00", "Responder mensagens importantes", "Tarefa curta para limpar pendências sem gastar muita energia.", "Leve"],
        ["14:00", "Reunião com cliente ABC", "Compromisso fixo da agenda. Evitar tarefa pesada logo depois.", "Agenda"]
      ];
      Utils.qs("#planningList").innerHTML = demoBlocks.map(function (item, index) {
        return [
          '<article class="planning-block' + (tasks[index] && String(tasks[index].id) === String(lastPlanningTaskId) ? " just-updated" : "") + '" data-task-id="' + Utils.escapeHtml(tasks[index] ? tasks[index].id : "") + '">',
          '<div class="item-top">',
          '<span class="planning-hour">' + item[0] + "</span>",
          "<div>",
          '<div class="task-title">' + Utils.escapeHtml(item[1]) + "</div>",
          '<small>' + Utils.escapeHtml(item[2]) + "</small>",
          "</div>",
          '<span class="chip">' + item[3] + "</span>",
          "</div>",
          tasks[index] && String(tasks[index].id) === String(lastPlanningTaskId) && lastPlanningMessage ? '<span class="inline-status">' + Utils.escapeHtml(lastPlanningMessage) + "</span>" : "",
          '<div class="planning-actions compact"><button class="button secondary" type="button" data-action="up">Subir</button><button class="button secondary" type="button" data-action="down">Descer</button><button class="button secondary" type="button" data-action="postpone">Adiar</button></div>',
          "</article>"
        ].join("");
      }).join("") + [
        '<section class="card planning-quick-controls">',
        "<h3>Ajustes de energia</h3>",
        '<div class="grid-2">',
        '<button class="button secondary" type="button" data-action="reduce-load">Reduzir carga</button>',
        '<button class="button secondary" type="button" data-action="protect-break">Proteger pausa</button>',
        "</div>",
        '<a class="button primary full" href="planning-adjust.html">Ajustar planejamento</a>',
        "</section>"
      ].join("");
      return;
    }

    Utils.qs("#planningList").innerHTML = tasks.map(function (task, index) {
      var hour = index === 0 ? "09:00" : index === 1 ? "11:00" : index === 2 ? "14:00" : "Amanhã";
      var badge = index === 0 ? "sugerido" : task.esforco === "baixo" ? "leve" : index === 2 ? "agenda" : "lista";
      return [
        '<article class="planning-block' + (String(task.id) === String(lastPlanningTaskId) ? " just-updated" : "") + '" data-task-id="' + Utils.escapeHtml(task.id) + '">',
        '<div class="item-top">',
        '<span class="planning-hour">' + hour + "</span>",
        "<div>",
        '<div class="task-title">' + Utils.escapeHtml(task.titulo) + "</div>",
        '<small>' + Utils.escapeHtml(task.esforco === "baixo" ? "Tarefa curta para limpar pendências." : "Boa para agora: prioridade e contexto alinhados.") + "</small>",
        "</div>",
        '<span class="chip">' + badge + "</span>",
        "</div>",
        String(task.id) === String(lastPlanningTaskId) && lastPlanningMessage ? '<span class="inline-status">' + Utils.escapeHtml(lastPlanningMessage) + "</span>" : "",
        '<div class="planning-actions compact"><button class="button secondary" type="button" data-action="up">Subir</button><button class="button secondary" type="button" data-action="down">Descer</button><button class="button secondary" type="button" data-action="postpone">Adiar</button></div>',
        "</article>"
      ].join("");
    }).join("") + [
      '<section class="card planning-quick-controls">',
      "<h3>Ajustes de energia</h3>",
      '<div class="grid-2">',
      '<button class="button secondary" type="button" data-action="reduce-load">Reduzir carga</button>',
      '<button class="button secondary" type="button" data-action="protect-break">Proteger pausa</button>',
      "</div>",
      '<a class="button primary full" href="planning-adjust.html">Ajustar planejamento</a>',
      "</section>"
    ].join("");
  }

  function moveTask(taskId, direction) {
    var tasks = getTasks();
    var open = Utils.sortTasks(tasks.filter(function (task) { return !task.concluida; }));
    var index = open.findIndex(function (task) { return String(task.id) === String(taskId); });
    var nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= open.length) return;
    var currentOrder = open[index].ordem;
    open[index].ordem = open[nextIndex].ordem;
    open[nextIndex].ordem = currentOrder;
    saveTasks(tasks);
  }

  function prioritize(taskId) {
    var tasks = getTasks();
    var open = Utils.sortTasks(tasks.filter(function (task) { return !task.concluida; }));
    var target = open.find(function (task) { return String(task.id) === String(taskId); });
    if (!target) return;
    open = open.filter(function (task) { return String(task.id) !== String(taskId); });
    open.unshift(target);
    open.forEach(function (task, index) {
      task.ordem = index;
      if (String(task.id) === String(taskId)) task.prioridade = "alta";
    });
    saveTasks(tasks);
  }

  function postpone(taskId) {
    Storage.update(Storage.KEYS.tasks, taskId, { prazo: Utils.addDaysISO(1), adiada: true });
  }

  function acceptPlan() {
    var tasks = getTasks();
    snapshotPlanning(tasks);
    var open = Utils.sortTasks(tasks.filter(function (task) { return !task.concluida; }));
    open.forEach(function (task, index) {
      task.ordem = index;
      task.planejada = index < 3;
      if (index > 2 && !task.adiada) {
        task.adiada = true;
        task.prazo = task.prazo || Utils.addDaysISO(1);
      }
    });
    Storage.write("planningAcceptedAt", new Date().toISOString());
    Storage.write("planningAdjustments", { aceita: true, cargaReduzida: false, pausaProtegida: true, atualizadoEm: new Date().toISOString() });
    saveTasks(tasks);
    Utils.notify("Planejamento salvo. Seu dia foi atualizado.", {
      kind: "success",
      actionLabel: "Desfazer",
      onAction: undoPlan
    });
  }

  function undoPlan() {
    var snapshot = Storage.read("planningLastSnapshot", null);
    if (!snapshot || !snapshot.tasks) return;
    var tasks = getTasks();
    snapshot.tasks.forEach(function (item) {
      var task = tasks.find(function (current) { return String(current.id) === String(item.id); });
      if (task) {
        task.ordem = item.ordem;
        task.prioridade = item.prioridade;
        task.prazo = item.prazo;
        task.adiada = item.adiada;
        task.planejada = item.planejada;
      }
    });
    saveTasks(tasks);
    Storage.write("planningAdjustments", { aceita: false, cargaReduzida: false, pausaProtegida: false, atualizadoEm: new Date().toISOString() });
    Utils.notify("Planejamento desfeito.", { kind: "warning" });
    renderPlanning();
  }

  function handleAction(event) {
    var button = event.target.closest("[data-action]");
    if (!button) return;
    var action = button.dataset.action;
    var taskNode = event.target.closest("[data-task-id]");
    var taskId = taskNode ? taskNode.dataset.taskId : null;
    if (action === "accept-plan") acceptPlan();
    if (action === "up" && taskId) {
      moveTask(taskId, -1);
      lastPlanningTaskId = taskId;
      lastPlanningMessage = "Ordem atualizada";
      Utils.notify("Ordem atualizada para hoje.", { kind: "success" });
    }
    if (action === "down" && taskId) {
      moveTask(taskId, 1);
      lastPlanningTaskId = taskId;
      lastPlanningMessage = "Ordem atualizada";
      Utils.notify("Ordem atualizada para hoje.", { kind: "success" });
    }
    if (action === "postpone" && taskId) {
      postpone(taskId);
      lastPlanningTaskId = taskId;
      lastPlanningMessage = "Adiada para amanhã";
      Utils.notify("Tarefa adiada para amanhã.", { kind: "warning", actionLabel: "Desfazer", onAction: undoPlan });
    }
    if (action === "prioritize" && taskId) {
      prioritize(taskId);
      lastPlanningTaskId = taskId;
      lastPlanningMessage = "Priorizada agora";
      Utils.notify("Prioridade movida para o primeiro bloco.", { kind: "success" });
    }
    if (action === "reduce-load") Storage.write("planningAdjustments", { aceita: false, cargaReduzida: true, pausaProtegida: true, motivo: "Energia baixa detectada no check-in", atualizadoEm: new Date().toISOString() });
    if (action === "protect-break") Storage.write("planningAdjustments", { aceita: false, cargaReduzida: false, pausaProtegida: true, motivo: "Pausa protegida para evitar queda de energia", atualizadoEm: new Date().toISOString() });
    if (action === "reduce-load") Utils.notify("Carga reduzida. Tarefa pesada movida.", { kind: "success", actionLabel: "Desfazer", onAction: undoPlan });
    if (action === "protect-break") Utils.notify("Pausa protegida no plano de hoje.", { kind: "success" });
    renderPlanning();
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderPlanning();
    var page = Utils.qs(".planning-page") || document;
    page.addEventListener("click", handleAction);
  });
})();
