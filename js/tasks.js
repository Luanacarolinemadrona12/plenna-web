(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var activeFilter = Utils.getQueryParam("filter") || Storage.read("taskFilter", "caixa") || "caixa";
  var userChangedFilter = Boolean(Utils.getQueryParam("filter"));
  var query = "";
  var lastTaskId = null;
  var lastTaskMessage = "";

  function label(value) {
    var text = String(value || "-").replace("media", "média").replace("medio", "médio");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function filterTasks(tasks) {
    var today = Utils.todayISO();
    var list = tasks;
    if (!query && !userChangedFilter && activeFilter === "caixa") {
      list = recommendedTasks(tasks);
    } else {
      if (activeFilter === "caixa") list = tasks.filter(function (task) { return !task.concluida && !task.prazo; });
      if (activeFilter === "hoje") list = tasks.filter(function (task) { return !task.concluida && task.prazo === today; });
      if (activeFilter === "proximas") list = tasks.filter(function (task) { return !task.concluida && task.prazo && task.prazo > today; });
      if (activeFilter === "concluidas") list = tasks.filter(function (task) { return task.concluida; });
      if (activeFilter === "alta") list = tasks.filter(function (task) { return !task.concluida && task.prioridade === "alta"; });
      if (activeFilter === "com-prazo") list = tasks.filter(function (task) { return !task.concluida && task.prazo; });
      if (activeFilter === "projeto") list = tasks.filter(function (task) { return !task.concluida && task.categoria; });
    }
    if (query) {
      list = list.filter(function (task) {
        return [task.titulo, task.descricao, task.categoria, (task.tags || []).join(" "), (task.subtarefas || []).join(" ")].join(" ").toLowerCase().includes(query);
      });
    }
    if (lastTaskId && !list.some(function (task) { return String(task.id) === String(lastTaskId); })) {
      var changed = tasks.find(function (task) { return String(task.id) === String(lastTaskId); });
      if (changed) list = [changed].concat(list);
    }
    return list;
  }

  function recommendedTasks(tasks) {
    var preferred = ["demo-task-q2", "demo-task-contract", "demo-task-inbox"];
    var picked = preferred.map(function (id) {
      return tasks.find(function (task) { return String(task.id) === id && !task.concluida; });
    }).filter(Boolean);
    if (picked.length >= 3) return picked;
    Utils.sortTasks(tasks.filter(function (task) { return !task.concluida; })).forEach(function (task) {
      if (picked.length < 3 && !picked.some(function (item) { return String(item.id) === String(task.id); })) picked.push(task);
    });
    return picked.slice(0, 3);
  }

  function renderTabs(tasks) {
    var today = Utils.todayISO();
    var counts = {
      caixa: tasks.filter(function (task) { return !task.concluida && !task.prazo; }).length,
      hoje: tasks.filter(function (task) { return !task.concluida && task.prazo === today; }).length,
      proximas: tasks.filter(function (task) { return !task.concluida && task.prazo && task.prazo > today; }).length,
      concluidas: tasks.filter(function (task) { return task.concluida; }).length
    };
    var tabs = [
      ["caixa", "Caixa", counts.caixa],
      ["hoje", "Hoje", counts.hoje],
      ["proximas", "Próx.", counts.proximas],
      ["concluidas", "Concl.", counts.concluidas]
    ];
    Utils.qs("#taskTabs").innerHTML = tabs.map(function (tab) {
      return '<button class="task-tab ' + (activeFilter === tab[0] ? "active" : "") + '" type="button" data-filter="' + tab[0] + '">' + tab[1] + ' <strong>' + tab[2] + "</strong></button>";
    }).join("");
  }

  function emptyForFilter() {
    if (query) return ["Busca sem resultados", "Tente outro termo ou crie um item rápido a partir do que procura.", "Criar tarefa"];
    if (activeFilter === "caixa") return ["Caixa de entrada vazia", "Nenhuma captura pendente. Seu dia está limpo para priorizar.", "Criar tarefa"];
    if (activeFilter === "hoje") return ["Sem tarefas", "Quando não houver tarefas, sugerir criar uma prioridade leve.", "Planejar semana"];
    if (activeFilter === "proximas") return ["Tarefa sem prazo ou data", "Ela ainda não entrou no seu fluxo. Defina quando fazer ou deixe na lista sem data.", "Definir data"];
    if (activeFilter === "concluidas") return ["Sem tarefas", "Conclua uma tarefa para acompanhar seu avanço.", "Ver tarefas"];
    if (activeFilter === "alta") return ["Sem tarefas", "Nenhuma prioridade alta agora. Crie uma prioridade leve se precisar.", "Criar tarefa"];
    if (activeFilter === "com-prazo") return ["Tarefa sem prazo ou data", "Ela ainda não entrou no seu fluxo. Defina quando fazer ou deixe na lista sem data.", "Definir data"];
    if (activeFilter === "projeto") return ["Projeto sem tarefas", "Crie a primeira tarefa quando esse projeto virar ação.", "Criar tarefa"];
    return ["Sem tarefas", "Quando não houver tarefas, sugerir criar uma prioridade leve.", "Criar tarefa"];
  }

  function renderTasks() {
    var all = Utils.sortTasks(Storage.all(Storage.KEYS.tasks));
    var visible = filterTasks(all);
      var Icons = window.PlennaIcons;
    renderTabs(all);

    if (!visible.length) {
      var empty = emptyForFilter();
      Utils.qs("#taskList").innerHTML = [
        '<div class="empty-state proto-empty">',
        "<h3>" + empty[0] + "</h3>",
        "<p>" + empty[1] + "</p>",
        '<a class="button small primary" href="' + (activeFilter === "hoje" ? "planning.html" : "task-new.html") + '">' + empty[2] + "</a>",
        "</div>"
      ].join("");
      return;
    }

    Utils.qs("#taskList").innerHTML = visible.map(function (task) {
      var badge = badgeFor(task);
      var badgeClass = badge === "Pesada hoje" ? "warning" : badge === "Boa agora" ? "blue" : "";
      return [
        '<article class="list-item task-card task-row-card' + (task.concluida ? " done" : "") + (String(task.id) === String(lastTaskId) ? " just-updated" : "") + ' ' + badgeClass + '" data-task-id="' + Utils.escapeHtml(task.id) + '">',
        '<div class="item-top">',
        '<button class="check-control" type="button" data-action="toggle" aria-label="Alternar conclusão">' + (task.concluida && Icons ? Icons.svg("check", "check-mark") : "") + "</button>",
        '<a class="task-row-main" href="task-edit.html?id=' + encodeURIComponent(task.id) + '">',
        '<span class="task-title">' + Utils.escapeHtml(task.titulo) + "</span>",
        '<small><span class="' + (task.prioridade === "alta" ? "danger-text" : "success-text") + '">' + Utils.escapeHtml(label(task.prioridade)) + "</span> · " + Utils.escapeHtml(task.tempoEstimado || "sem tempo") + " · " + Utils.escapeHtml(dueLabel(task)) + "</small>",
        "</a>",
        '<a class="chip task-badge ' + badgeClass + '" href="task-edit.html?id=' + encodeURIComponent(task.id) + '">' + badge + "</a>",
        "</div>",
        String(task.id) === String(lastTaskId) && lastTaskMessage ? '<span class="inline-status">' + Utils.escapeHtml(lastTaskMessage) + "</span>" : "",
        '<div class="task-card-actions">',
        '<button type="button" data-action="postpone">Adiar</button>',
        '<button type="button" data-action="redistribute">Redistribuir</button>',
        "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function badgeFor(task) {
    if (task.figmaBadge) return task.figmaBadge;
    if (task.esforco === "alto") return "Pesada hoje";
    if (task.prioridade === "alta") return "Recomendada";
    return "Boa agora";
  }

  function dueLabel(task) {
    if (task.figmaDue) return task.figmaDue;
    if (!task.prazo) return "sem prazo";
    if (task.prazo === Utils.todayISO()) return "hoje";
    if (task.prazo === Utils.addDaysISO(1)) return "amanhã";
    return Utils.formatDate(task.prazo);
  }

  function handleClick(event) {
    var filter = event.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      userChangedFilter = true;
      Storage.write("taskFilter", activeFilter);
      renderTasks();
      return;
    }
    var action = event.target.closest("[data-action]");
    if (!action) return;
    var item = event.target.closest("[data-task-id]");
    var task = Storage.find(Storage.KEYS.tasks, item.dataset.taskId);
    if (!task) return;
    if (action.dataset.action === "postpone") {
      postponeTask(task);
      return;
    }
    if (action.dataset.action === "redistribute") {
      redistributeTask(task);
      return;
    }
    if (action.dataset.action !== "toggle") return;
    var nextValue = !task.concluida;
    Storage.update(Storage.KEYS.tasks, task.id, {
      concluida: nextValue,
      concluidaEm: nextValue ? new Date().toISOString() : null
    });
    lastTaskId = task.id;
    lastTaskMessage = nextValue ? "Concluída agora" : "Reaberta agora";
    renderTasks();
    Utils.notify(nextValue ? "Tarefa concluída. Lista atualizada." : "Tarefa reaberta.", {
      kind: nextValue ? "success" : "warning",
      actionLabel: "Desfazer",
      onAction: function () {
        Storage.update(Storage.KEYS.tasks, task.id, {
          concluida: task.concluida,
          concluidaEm: task.concluidaEm || null
        });
        lastTaskId = task.id;
        lastTaskMessage = "Ação desfeita";
        renderTasks();
      }
    });
  }

  function postponeTask(task) {
    var previous = {
      prazo: task.prazo || "",
      adiada: task.adiada || false,
      figmaDue: task.figmaDue || "",
      atualizadoEm: task.atualizadoEm || null
    };
    Storage.update(Storage.KEYS.tasks, task.id, {
      prazo: Utils.addDaysISO(1),
      adiada: true,
      figmaDue: "amanhã",
      atualizadoEm: new Date().toISOString()
    });
    activeFilter = "proximas";
    Storage.write("taskFilter", activeFilter);
    lastTaskId = task.id;
    lastTaskMessage = "Adiada para amanhã";
    renderTasks();
    Utils.notify("Tarefa adiada para amanhã.", {
      kind: "warning",
      actionLabel: "Desfazer",
      onAction: function () {
        Storage.update(Storage.KEYS.tasks, task.id, previous);
        lastTaskId = task.id;
        lastTaskMessage = "Adiamento desfeito";
        renderTasks();
      }
    });
  }

  function redistributeTask(task) {
    var adjustment = Storage.read("planningAdjustments", {});
    var blocks = Object.assign({}, adjustment.blocks || {});
    blocks[task.id] = {
      kind: "redistribuir",
      title: task.titulo,
      from: task.prazo || "sem data",
      to: Utils.addDaysISO(1)
    };
    Storage.write("planningAdjustments", Object.assign({}, adjustment, {
      cargaReduzida: true,
      prioridadeProtegida: true,
      blocks: blocks,
      motivo: "Redistribuição iniciada pela lista de tarefas para reduzir carga do dia.",
      conflito: "Tarefa pesada concentrada no mesmo dia que foco e reunião.",
      atualizadoEm: new Date().toISOString()
    }));
    Storage.update(Storage.KEYS.tasks, task.id, {
      redistribuir: true,
      adiada: true,
      prazo: Utils.addDaysISO(1),
      figmaDue: "redistribuída",
      atualizadoEm: new Date().toISOString()
    });
    lastTaskId = task.id;
    lastTaskMessage = "Redistribuída no planejamento";
    renderTasks();
    Utils.notify("Tarefa redistribuída no planejamento.", {
      kind: "success",
      actionLabel: "Abrir plano",
      onAction: function () {
        window.location.href = "planning-adjust.html";
      }
    });
  }

  function quickCreateFromSearch(input) {
    var title = input.value.trim();
    if (!title) return;
    var tasks = Storage.all(Storage.KEYS.tasks);
    var task = {
      id: Utils.uid("task"),
      titulo: title,
      descricao: "",
      prioridade: "media",
      esforco: "baixo",
      tempoEstimado: "15 min",
      impactoEmocional: "leve",
      prazo: activeFilter === "hoje" ? Utils.todayISO() : "",
      categoria: "",
      recorrencia: "Sem recorrência",
      lembrete: "Sem lembrete",
      tags: [],
      subtarefas: [],
      concluida: false,
      criadoEm: new Date().toISOString(),
      ordem: tasks.length
    };
    Storage.replace(Storage.KEYS.tasks, task);
    input.value = "";
    query = "";
    activeFilter = task.prazo ? "hoje" : "caixa";
    Storage.write("taskFilter", activeFilter);
    lastTaskId = task.id;
    lastTaskMessage = "Criada agora";
    renderTasks();
    Utils.notify("Tarefa criada. Ela entrou na sua lista.", {
      kind: "success",
      actionLabel: "Editar",
      onAction: function () {
        window.location.href = "task-edit.html?id=" + encodeURIComponent(task.id);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderTasks();
    Utils.qs("#taskTabs").addEventListener("click", handleClick);
    Utils.qs("#savedTaskFilters").addEventListener("click", handleClick);
    Utils.qs("#taskList").addEventListener("click", handleClick);
    Utils.qs("#taskSearch").addEventListener("input", function (event) {
      query = event.target.value.trim().toLowerCase();
      renderTasks();
    });
    Utils.qs("#taskSearch").addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      quickCreateFromSearch(event.currentTarget);
    });
  });
})();
