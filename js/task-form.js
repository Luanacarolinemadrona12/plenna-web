(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var Data = window.PlennaData;
  var editingTask = null;

  function fillSelect(selector, options) {
    var select = Utils.qs(selector);
    if (!select) return;
    select.innerHTML = options.map(function (item) {
      return '<option value="' + item.value + '">' + Utils.escapeHtml(item.label) + "</option>";
    }).join("");
  }

  function normalizeChoice(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function selectedTags(formData) {
    return formData.getAll("tags").map(function (item) {
      return String(item || "").trim();
    }).filter(Boolean);
  }

  function setFormValue(form, key, value) {
    var field = form.elements[key];
    if (!field) return;
    if (typeof field.length === "number" && !field.tagName) {
      Array.prototype.forEach.call(field, function (input) {
        if (input.type === "checkbox") {
          input.checked = Array.isArray(value) ? value.indexOf(input.value) >= 0 : Boolean(value);
        }
      });
      if (field[0] && field[0].type === "radio") field.value = value || "";
      return;
    }
    field.value = Array.isArray(value) ? value.join("\n") : value || "";
  }

  function fillForm(task) {
    var form = Utils.qs("#taskForm");
    Object.keys(task).forEach(function (key) {
      setFormValue(form, key, task[key]);
    });
    Utils.setText("#formTitle", document.body.dataset.screen === "task-edit" ? "Editar tarefa" : "Nova tarefa");
    renderPreview();
  }

  function fillExample() {
    var form = Utils.qs("#taskForm");
    if (!form || form.dataset.skipExample === "true") return;
    fillForm({
      titulo: "Preparar apresentação Q2",
      descricao: "Revisar narrativa, métricas e próximos passos.",
      prioridade: "alta",
      esforco: "medio",
      tempoEstimado: "--:--",
      impactoEmocional: "motivadora",
      prazo: "Hoje · 16:00",
      categoria: "Cliente ABC",
      projeto: "Trabalho",
      recorrencia: "mensal",
      lembrete: "30 min antes",
      tags: ["#cliente", "#apresentação"],
      subtarefas: ["Adicionar roteiro", "Adicionar imagens", "Adicionar revisão final"]
    });
  }

  function applyTemplate() {
    var template = Utils.getQueryParam("template");
    if (!template) return;
    var map = {
      agua: { titulo: "Beber água", categoria: "Saúde", esforco: "baixo", tempoEstimado: "2 min", impactoEmocional: "leve" },
      sono: { titulo: "Preparar rotina de sono", categoria: "Saúde", esforco: "baixo", tempoEstimado: "10 min", impactoEmocional: "positivo" },
      diario: { titulo: "Escrever diário rápido", categoria: "Bem-estar", esforco: "baixo", tempoEstimado: "5 min", impactoEmocional: "positivo" },
      pausa: { titulo: "Pausa sem tela", categoria: "Bem-estar", esforco: "baixo", tempoEstimado: "3 min", impactoEmocional: "leve" }
    };
    var data = map[template];
    if (data) {
      fillForm(Object.assign({
        prioridade: "baixa",
        recorrencia: "Sem recorrência",
        lembrete: "Sem lembrete",
        tags: ["#autocuidado"]
      }, data));
    }
  }

  function ensurePreview() {
    var form = Utils.qs("#taskForm");
    if (!form || Utils.qs("#taskPreviewCard")) return;
    var target = Utils.qs(".figma-task-meta-card") || Utils.qs(".figma-subtasks-card");
    var html = [
      '<section class="card ux-preview-card" id="taskPreviewCard" aria-live="polite">',
      '<span class="ux-preview-label">Preview do card</span>',
      '<h3 class="ux-preview-title" id="taskPreviewTitle">Nova tarefa</h3>',
      '<div class="ux-preview-meta" id="taskPreviewMeta"></div>',
      '<p class="helper" id="taskPreviewDescription"></p>',
      "</section>"
    ].join("");
    if (target) target.insertAdjacentHTML("afterend", html);
  }

  function renderPreview() {
    var form = Utils.qs("#taskForm");
    if (!form || !Utils.qs("#taskPreviewCard")) return;
    var formData = new FormData(form);
    var title = String(formData.get("titulo") || "").trim() || "Nova tarefa";
    var description = String(formData.get("descricao") || "").trim() || "Sem descrição";
    var prioridade = normalizeChoice(formData.get("prioridade") || "media") || "media";
    var esforco = normalizeChoice(formData.get("esforco") || "medio") || "medio";
    var tempo = String(formData.get("tempoEstimado") || "sem tempo").trim() || "sem tempo";
    var prazo = String(formData.get("prazo") || "sem prazo").trim() || "sem prazo";
    var tags = selectedTags(formData);
    Utils.setText("#taskPreviewTitle", title);
    Utils.setText("#taskPreviewDescription", description);
    Utils.qs("#taskPreviewMeta").innerHTML = [
      "<span>" + Utils.escapeHtml(prioridade) + "</span>",
      "<span>" + Utils.escapeHtml(esforco) + "</span>",
      "<span>" + Utils.escapeHtml(tempo) + "</span>",
      "<span>" + Utils.escapeHtml(prazo) + "</span>"
    ].concat(tags.map(function (tag) {
      return "<span>" + Utils.escapeHtml(tag) + "</span>";
    })).join("");
  }

  function saveTask(event) {
    event.preventDefault();
    var formData = new FormData(event.currentTarget);
    var tasks = Storage.all(Storage.KEYS.tasks);
    var base = editingTask || {
      id: Utils.uid("task"),
      concluida: false,
      criadoEm: new Date().toISOString(),
      ordem: tasks.length
    };
    var nextTask = Object.assign({}, base, {
      titulo: String(formData.get("titulo") || "").trim(),
      descricao: String(formData.get("descricao") || "").trim(),
      prioridade: normalizeChoice(formData.get("prioridade")) || "media",
      esforco: normalizeChoice(formData.get("esforco")) || "medio",
      tempoEstimado: String(formData.get("tempoEstimado") || "").trim(),
      impactoEmocional: normalizeChoice(formData.get("impactoEmocional")) || "leve",
      prazo: String(formData.get("prazo") || "").trim(),
      categoria: String(formData.get("categoria") || "").trim(),
      projeto: String(formData.get("projeto") || "").trim(),
      recorrencia: formData.get("recorrencia") || "Sem recorrência",
      lembrete: formData.get("lembrete") || "Sem lembrete",
      tags: selectedTags(formData),
      subtarefas: String(formData.get("subtarefas") || "").split("\n").map(function (item) {
        return item.trim();
      }).filter(Boolean)
    });

    Storage.replace(Storage.KEYS.tasks, nextTask);
    Utils.notify(editingTask ? "Tarefa atualizada. Lista sincronizada." : "Tarefa criada. Ela entrou na sua lista.", { kind: "success" });
    window.setTimeout(function () {
      window.location.href = "tasks.html";
    }, 300);
  }

  function duplicateTask() {
    if (!editingTask) return;
    var tasks = Storage.all(Storage.KEYS.tasks);
    var copy = Object.assign({}, editingTask, {
      id: Utils.uid("task"),
      titulo: editingTask.titulo + " (cópia)",
      concluida: false,
      criadoEm: new Date().toISOString(),
      ordem: tasks.length
    });
    Storage.replace(Storage.KEYS.tasks, copy);
    Utils.notify("Tarefa duplicada. Cópia criada na lista.", {
      kind: "success",
      actionLabel: "Abrir",
      onAction: function () {
        window.location.href = "task-edit.html?id=" + encodeURIComponent(copy.id);
      }
    });
  }

  function completeTask() {
    if (!editingTask) return;
    Storage.update(Storage.KEYS.tasks, editingTask.id, {
      concluida: !editingTask.concluida,
      concluidaEm: editingTask.concluida ? null : new Date().toISOString()
    });
    Utils.notify(editingTask.concluida ? "Tarefa reaberta." : "Tarefa concluída. Lista atualizada.", { kind: "success" });
    window.setTimeout(function () { window.location.href = "tasks.html"; }, 250);
  }

  function ensureEditActions() {
    if (!editingTask) return;
    var submit = Utils.qs(".figma-task-submit-card");
    if (!submit || Utils.qs("#duplicateTask")) return;
    submit.insertAdjacentHTML("afterbegin", [
      '<button class="button secondary full" type="button" id="completeTask">' + (editingTask.concluida ? "Reabrir tarefa" : "Concluir tarefa") + "</button>",
      '<button class="button secondary full" type="button" id="duplicateTask">Duplicar tarefa</button>'
    ].join(""));
    Utils.qs("#completeTask").addEventListener("click", completeTask);
    Utils.qs("#duplicateTask").addEventListener("click", duplicateTask);
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillSelect("#prioritySelect", Data.prioridades);
    fillSelect("#effortSelect", Data.esforcos);
    fillSelect("#impactSelect", Data.impactos);
    fillSelect("#recurrenceSelect", Data.recorrencias.map(function (label) { return { value: label, label: label }; }));
    fillSelect("#reminderSelect", Data.lembretes.map(function (label) { return { value: label, label: label }; }));

    ensurePreview();

    var id = Utils.getQueryParam("id");
    if (id) {
      editingTask = Storage.find(Storage.KEYS.tasks, id);
      if (editingTask) fillForm(editingTask);
    } else {
      applyTemplate();
      if (!Utils.getQueryParam("template")) fillExample();
    }

    ensureEditActions();
    renderPreview();
    Utils.qs("#taskForm").addEventListener("input", renderPreview);
    Utils.qs("#taskForm").addEventListener("change", renderPreview);
    Utils.qs("#taskForm").addEventListener("submit", saveTask);

    var deleteButton = Utils.qs("#deleteTask");
    if (deleteButton) {
      deleteButton.hidden = !editingTask && document.body.dataset.screen !== "task-edit";
      deleteButton.addEventListener("click", function () {
        if (!editingTask) {
          Utils.notify("Abra uma tarefa da lista para excluir.", { kind: "warning" });
          return;
        }
        if (!window.confirm("Excluir esta tarefa?")) return;
        Storage.remove(Storage.KEYS.tasks, editingTask.id);
        Utils.notify("Tarefa excluída. Lista atualizada.", { kind: "warning" });
        window.setTimeout(function () { window.location.href = "tasks.html"; }, 250);
      });
    }
  });
})();
