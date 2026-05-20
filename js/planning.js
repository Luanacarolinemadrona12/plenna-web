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

  function planningBlockActions(taskId) {
    if (!taskId) return "";
    return [
      '<details class="planning-block-menu">',
      "<summary>Ajustar</summary>",
      '<div class="planning-menu-actions">',
      '<button class="button secondary" type="button" data-action="up" aria-label="Subir tarefa no planejamento">Subir</button>',
      '<button class="button secondary" type="button" data-action="down" aria-label="Descer tarefa no planejamento">Descer</button>',
      '<button class="button secondary" type="button" data-action="postpone" aria-label="Adiar tarefa para amanhã">Adiar</button>',
      "</div>",
      "</details>"
    ].join("");
  }

  function planningBlock(item) {
    var taskId = item.taskId || "";
    var updated = taskId && String(taskId) === String(lastPlanningTaskId);
    return [
      '<article class="planning-block' + (item.kind ? " " + Utils.escapeHtml(item.kind) : "") + (updated ? " just-updated" : "") + '"' + (taskId ? ' data-task-id="' + Utils.escapeHtml(taskId) + '"' : "") + ">",
      '<div class="item-top">',
      '<span class="planning-hour">' + Utils.escapeHtml(item.hour) + "</span>",
      "<div>",
      '<div class="task-title">' + Utils.escapeHtml(item.title) + "</div>",
      '<small>' + Utils.escapeHtml(item.copy) + "</small>",
      "</div>",
      '<span class="chip">' + Utils.escapeHtml(item.badge) + "</span>",
      "</div>",
      updated && lastPlanningMessage ? '<span class="inline-status">' + Utils.escapeHtml(lastPlanningMessage) + "</span>" : "",
      planningBlockActions(taskId),
      "</article>"
    ].join("");
  }

  function renderPlanningGroups(blocks) {
    var groups = [
      { key: "Manhã", subtitle: "Comece pelo essencial" },
      { key: "Tarde", subtitle: "Mantenha ritmo sem sobrecarga" },
      { key: "Noite", subtitle: "Fechamento leve" },
      { key: "Pausas protegidas", subtitle: "Respiros para preservar energia" }
    ];
    return groups.map(function (group) {
      var items = blocks.filter(function (item) { return item.period === group.key; });
      if (!items.length) return "";
      return [
        '<section class="planning-period-group">',
        '<div class="planning-period-heading">',
        "<h3>" + group.key + "</h3>",
        "<p>" + group.subtitle + "</p>",
        "</div>",
        items.map(planningBlock).join(""),
        "</section>"
      ].join("");
    }).join("") + renderPlanningSupport();
  }

  function renderPlanningSupport() {
    return [
      '<section class="planning-minimal-support" aria-label="Ajustes rápidos">',
      "<strong>Ajustes rápidos</strong>",
      '<div class="planning-support-actions">',
      '<button class="button secondary small" type="button" data-action="reduce-load">Reduzir carga</button>',
      '<button class="button secondary small" type="button" data-action="protect-break">Proteger pausa</button>',
      '<a class="button secondary small" href="planning-adjust.html">Ajustar blocos</a>',
      "</div>",
      "</section>"
    ].join("");
  }

  function renderPlanning() {
    normalizeOrder();
    var checkin = Utils.activeCheckin();
    var recommendation = Utils.generateRecommendation(checkin);
    var tasks = Utils.sortTasks(getTasks().filter(function (task) { return !task.concluida; }));

    var title = recommendation.title;
    var summary = recommendation.body;
    Utils.setText("#planningRecommendation", title);
    Utils.setText("#planningSummary", summary);
    renderPlanningStatus(checkin, recommendation);
    renderPlanningContext(checkin, recommendation);

    if (!tasks.length) {
      Utils.qs("#planningList").innerHTML = [
        '<div class="empty-state proto-empty">',
        "<h3>Seu planejamento ainda está vazio</h3>",
        "<p>Crie uma tarefa pequena ou faça um check-in para o Plenna sugerir uma ordem possível.</p>",
        '<a class="button small primary" href="task-new.html">Adicionar tarefa</a>',
        "</div>"
      ].join("");
      return;
    }

    var demoOnly = tasks.every(function (task) {
      return String(task.id || "").indexOf("demo-") === 0;
    });
    if (demoOnly) {
      var demoBlocks = [
        { period: "Manhã", hour: "09:00", title: "Foco leve · Apresentação Q2", copy: "Boa para agora: prioridade alta com esforço médio.", badge: "Sugerido", taskId: tasks[0] && tasks[0].id },
        { period: "Manhã", hour: "11:00", title: "Responder mensagens importantes", copy: "Tarefa curta para limpar pendências sem gastar muita energia.", badge: "Leve", taskId: tasks[1] && tasks[1].id },
        { period: "Tarde", hour: "14:00", title: "Reunião com cliente ABC", copy: "Compromisso fixo do dia. Evite tarefa pesada logo depois.", badge: "Fixo", taskId: tasks[2] && tasks[2].id },
        { period: "Pausas protegidas", hour: "15:30", title: "Pausa protegida", copy: "Respiração curta antes do período mais cheio.", badge: "Cuidado", kind: "protected-break" },
        { period: "Noite", hour: "20:30", title: "Fechamento leve", copy: "Diário rápido e revisão sem cobrança.", badge: "Leve", kind: "soft-close" }
      ];
      Utils.qs("#planningList").innerHTML = renderPlanningGroups(demoBlocks);
      return;
    }

    var blocks = tasks.map(function (task, index) {
      var hour = index === 0 ? "09:00" : index === 1 ? "11:00" : index === 2 ? "14:00" : "Amanhã";
      var badge = index === 0 ? "sugerido" : task.esforco === "baixo" ? "leve" : index === 2 ? "fixo" : "lista";
      return {
        period: index < 2 ? "Manhã" : index < 4 ? "Tarde" : "Noite",
        hour: hour,
        title: task.titulo,
        copy: task.esforco === "baixo" ? "Tarefa curta para limpar pendências." : "Boa para agora: prioridade e contexto alinhados.",
        badge: badge,
        taskId: task.id
      };
    });
    blocks.push({ period: "Pausas protegidas", hour: "15:30", title: "Pausa protegida", copy: "Respiração curta antes do período mais cheio.", badge: "Cuidado", kind: "protected-break" });
    Utils.qs("#planningList").innerHTML = renderPlanningGroups(blocks);
  }

  function showReturnMessage() {
    var feedback = Storage.read("planningReturnMessage", null);
    var status = Utils.getQueryParam("status");
    if (status === "planning-saved") {
      Utils.notify("Planejamento salvo. Seu dia foi atualizado.", { kind: "success" });
      Storage.write("planningReturnMessage", null);
      return;
    }
    if (!feedback || !feedback.message) return;
    Storage.write("planningReturnMessage", null);
    Utils.notify(feedback.message, { kind: feedback.kind || "success" });
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
    snapshotPlanning(getTasks());
    Storage.update(Storage.KEYS.tasks, taskId, { prazo: Utils.addDaysISO(1), adiada: true });
  }

  function planningMoodLabel(checkin) {
    var map = { sensivel: "muito sensivel", ruim: "baixo", neutro: "neutro", bom: "bom", otimo: "otimo" };
    return checkin ? map[checkin.humor] || checkin.humor || "nao informado" : "nao informado";
  }

  function planningEnergyLabel(checkin) {
    if (!checkin) return "energia nao informada";
    if (checkin.energiaValor) return "energia " + checkin.energiaValor + "/10";
    return "energia " + (checkin.energia || "nao informada");
  }

  function renderPlanningStatus(checkin, recommendation) {
    var alert = Utils.qs(".planning-alert");
    if (!alert) return;
    var titleNode = Utils.qs("strong", alert);
    var copyNode = Utils.qs("p", alert);
    var metrics = Utils.qsa(".planning-metrics span");
    var level = checkin ? Utils.energyLevel(checkin) : "sem-checkin";
    var score = checkin ? Utils.energyScore(checkin) : null;
    var status = {
      title: "Sem check-in de hoje",
      copy: "Faça um check-in rápido para receber um plano mais ajustado ao seu ritmo.",
      metrics: [["3", "prioridades"], ["15h", "pausa"], ["ajustável", "plano"]]
    };

    if (recommendation && recommendation.tag === "Plano protetivo") {
      status = {
        title: "Plano protetivo · energia " + score + "/10",
        copy: "A sugestão reduz pressão, protege uma pausa e coloca autocuidado antes de tarefas exigentes.",
        metrics: [["1", "essencial"], ["3 min", "pausa"], ["menor", "carga"]]
      };
    } else if (level === "baixa") {
      status = {
        title: "Energia " + score + "/10 · carga reduzida",
        copy: "O plano prioriza tarefas leves, adia o que puder esperar e mantém pausa protegida.",
        metrics: [["1", "essencial"], ["15h", "pausa"], ["-1 pesada", "carga"]]
      };
    } else if (level === "alta") {
      status = {
        title: "Energia " + score + "/10 · bom momento para avançar",
        copy: "O plano reserva o melhor bloco para uma tarefa importante e deixa tarefas leves para depois.",
        metrics: [["1", "foco"], ["45 min", "bloco"], ["alta", "prioridade"]]
      };
    } else if (level === "media") {
      status = {
        title: "Energia " + score + "/10 · ritmo equilibrado",
        copy: "O plano combina três prioridades possíveis com uma pausa visível no meio do dia.",
        metrics: [["3", "prioridades"], ["25 min", "foco"], ["15h", "pausa"]]
      };
    }

    if (titleNode) titleNode.textContent = status.title;
    if (copyNode) copyNode.textContent = status.copy;
    metrics.forEach(function (metric, index) {
      var item = status.metrics[index];
      if (!item) return;
      metric.innerHTML = "<strong>" + Utils.escapeHtml(item[0]) + "</strong>" + Utils.escapeHtml(item[1]);
    });
  }

  function renderPlanningContext(checkin, recommendation) {
    var summary = Utils.qs("#planningSummary");
    if (!summary) return;
    if (!Utils.qs("#planningBasis")) {
      summary.insertAdjacentHTML("afterend", [
        '<div class="planning-context-summary" id="planningBasis" aria-live="polite">',
        '<span class="recognition-label" id="planningBasisLabel">Plano baseado no check-in de hoje</span>',
        '<h2 id="planningBasisTitle">Contexto do plano</h2>',
        '<p id="planningBasisCopy">Veja por que essa ordem foi sugerida antes de concluir.</p>',
        '<div class="chip-row" id="planningBasisChips"></div>',
        "</div>"
      ].join(""));
    }
    var isToday = checkin && String(checkin.data || "").slice(0, 10) === Utils.todayISO();
    Utils.setText("#planningBasisLabel", isToday ? "Plano baseado no check-in de hoje" : "Plano baseado no ultimo check-in");
    Utils.setText("#planningBasisTitle", planningEnergyLabel(checkin) + " · humor " + planningMoodLabel(checkin));
    Utils.setText("#planningBasisCopy", "A ordem prioriza o essencial, protege pausas e mostra o motivo de cada ajuste.");
    Utils.qs("#planningBasisChips").innerHTML = [
      '<span class="chip">' + Utils.escapeHtml(recommendation.tag || "plano sugerido") + "</span>",
      '<span class="chip neutral">' + Utils.escapeHtml(planningEnergyLabel(checkin)) + "</span>",
      '<span class="chip neutral">humor ' + Utils.escapeHtml(planningMoodLabel(checkin)) + "</span>"
    ].join("");
  }

  async function acceptPlan() {
    var confirmed = await Utils.confirmAction({
      title: "Salvar planejamento?",
      body: "A ordem do dia será salva neste aparelho. Você pode desfazer logo depois se não ficar bom.",
      cancelLabel: "Revisar",
      confirmLabel: "Salvar plano"
    });
    if (!confirmed) return;
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

  async function handleAction(event) {
    var button = event.target.closest("[data-action]");
    if (!button) return;
    var action = button.dataset.action;
    var taskNode = event.target.closest("[data-task-id]");
    var taskId = taskNode ? taskNode.dataset.taskId : null;
    if (action === "accept-plan") {
      await acceptPlan();
      return;
    }
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
    if (action === "reduce-load") {
      snapshotPlanning(getTasks());
      Storage.write("planningAdjustments", { aceita: false, cargaReduzida: true, pausaProtegida: true, motivo: "Energia baixa detectada no check-in", atualizadoEm: new Date().toISOString() });
    }
    if (action === "protect-break") {
      snapshotPlanning(getTasks());
      Storage.write("planningAdjustments", { aceita: false, cargaReduzida: false, pausaProtegida: true, motivo: "Pausa protegida para evitar queda de energia", atualizadoEm: new Date().toISOString() });
    }
    if (action === "reduce-load") Utils.notify("Carga reduzida. Tarefa pesada movida.", { kind: "success", actionLabel: "Desfazer", onAction: undoPlan });
    if (action === "protect-break") Utils.notify("Pausa protegida no plano de hoje.", { kind: "success" });
    renderPlanning();
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderPlanning();
    showReturnMessage();
    var page = Utils.qs(".planning-page") || document;
    page.addEventListener("click", handleAction);
  });
})();
