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

  function coerceDateValue(value) {
    var text = String(value || "").trim();
    if (!text) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    var lower = text.toLowerCase();
    if (lower.indexOf("amanh") >= 0) return Utils.addDaysISO(1);
    if (lower.indexOf("hoje") >= 0) return Utils.todayISO();
    var date = new Date(text);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
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
    if (field.type === "date") {
      field.value = coerceDateValue(value);
      return;
    }
    if (field.tagName === "SELECT") {
      var stringValue = Array.isArray(value) ? value[0] : value;
      if (stringValue && !Array.prototype.some.call(field.options, function (option) { return option.value === stringValue || option.textContent === stringValue; })) {
        field.insertAdjacentHTML("beforeend", '<option value="' + Utils.escapeHtml(stringValue) + '">' + Utils.escapeHtml(stringValue) + "</option>");
      }
      field.value = stringValue || "";
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
      prazo: Utils.todayISO(),
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

  function ensurePreventionHints() {
    var form = Utils.qs("#taskForm");
    if (!form) return;
    Utils.prepareRequiredFields(form);
    Utils.qsa('input[name="prazo"]', form).forEach(function (field) {
      var container = field.closest(".field") || field.closest(".figma-pill-input") || field.parentNode;
      if (!container || Utils.qs(".field-optional-hint", container)) return;
      var hint = document.createElement("small");
      hint.className = "field-optional-hint";
      hint.textContent = "Opcional. Se ficar vazio: Sem prazo definido.";
      container.appendChild(hint);
    });
  }

  function ensureComfortableTaskFields() {
    var form = Utils.qs("#taskForm");
    if (!form) return;
    Utils.qsa('textarea[name="descricao"]', form).forEach(function (field) {
      field.style.setProperty("min-height", "72px", "important");
      field.style.setProperty("height", "72px", "important");
      field.style.setProperty("max-height", "none", "important");
    });
  }

  function ensurePriorityDefault() {
    var form = Utils.qs("#taskForm");
    if (!form) return;
    var priority = form.elements.prioridade;
    if (!priority) return;
    if (priority.tagName === "SELECT") priority.value = "media";
    if (typeof priority.length === "number" && !priority.tagName && !form.querySelector('input[name="prioridade"]:checked')) {
      var medium = form.querySelector('input[name="prioridade"][value="media"]');
      if (medium) medium.checked = true;
    }
  }

  function formatCreatedAt(value) {
    if (!value) return "Criada recentemente";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Criada recentemente";
    return "Criada em " + date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  }

  function ensureRecognitionCards() {
    var form = Utils.qs("#taskForm");
    if (!form) return;
    var header = Utils.qs(".task-form-title-only") || Utils.qs(".task-form-header");
    if (header && !Utils.qs("#taskEditContext")) {
      header.insertAdjacentHTML("afterend", [
        '<section class="card recognition-card task-edit-context" id="taskEditContext" hidden>',
        '<span class="recognition-label">Editando tarefa</span>',
        '<h2 id="taskEditContextTitle">Tarefa</h2>',
        '<p id="taskEditContextDate">Criada recentemente</p>',
        "</section>"
      ].join(""));
    }
    var duplicateSummary = Utils.qs("#taskSaveSummary");
    if (duplicateSummary) duplicateSummary.remove();
  }

  function updateRecognitionCards() {
    var form = Utils.qs("#taskForm");
    if (!form) return;
    var formData = new FormData(form);
    var title = String(formData.get("titulo") || "").trim() || "Nova tarefa";
    var priority = normalizeChoice(formData.get("prioridade") || "media") || "media";
    var due = String(formData.get("prazo") || "").trim() || "Sem prazo definido.";
    var time = String(formData.get("tempoEstimado") || "").trim() || "sem tempo";
    var category = String(formData.get("categoria") || formData.get("projeto") || "").trim() || "tarefa";

    var context = Utils.qs("#taskEditContext");
    if (context) {
      var isEditScreen = document.body.dataset.screen === "task-edit";
      context.hidden = !(editingTask || isEditScreen);
      if (editingTask || isEditScreen) {
        Utils.setText("#taskEditContextTitle", editingTask ? editingTask.titulo || title : title);
        Utils.setText("#taskEditContextDate", editingTask ? formatCreatedAt(editingTask.criadoEm || editingTask.createdAt) : "Criada em 28 de abril");
      }
    }
    Utils.setText("#taskSummaryTitle", title);
    Utils.setText("#taskSummaryPriority", priority);
    Utils.setText("#taskSummaryDue", due);
    Utils.setText("#taskSummaryTime", time);
    Utils.setText("#taskSummaryKind", category);
  }

  function subtaskTextarea(form) {
    return form ? form.elements.subtarefas : null;
  }

  function readSubtasks(form) {
    var textarea = subtaskTextarea(form);
    return String(textarea ? textarea.value : "").split("\n").map(function (item) {
      return item.trim();
    }).filter(Boolean);
  }

  function writeSubtasks(form, items) {
    var textarea = subtaskTextarea(form);
    if (textarea) textarea.value = items.join("\n");
  }

  function renderSubtasks() {
    var form = Utils.qs("#taskForm");
    var card = Utils.qs(".figma-subtasks-card");
    var list = Utils.qs(".figma-subtask-list", card);
    if (!form || !card || !list) return;
    var items = readSubtasks(form);
    var badge = Utils.qs(".figma-card-head .chip", card);
    if (badge) {
      badge.textContent = document.body.dataset.screen === "task-edit" ? "2 de 5 concluídas" : document.body.dataset.screen === "task-new" ? "0 de 3 adicionadas" : (items.length ? items.length + " subtarefas" : "Nenhuma subtarefa");
    }
    list.innerHTML = items.length ? items.map(function (item, index) {
      return [
        '<li data-subtask-index="' + index + '">',
        '<button class="subtask-mini-action" type="button" data-subtask-remove="' + index + '" aria-label="Remover subtarefa">-</button>',
        '<span>' + Utils.escapeHtml(item) + "</span>",
        '<i aria-hidden="true">≡</i>',
        "</li>"
      ].join("");
    }).join("") : '<li class="empty-subtask-row"><span>Sugestão: divida em passos pequenos.</span></li>';
  }

  function ensureSubtaskEditor() {
    var form = Utils.qs("#taskForm");
    var card = Utils.qs(".figma-subtasks-card");
    if (!form || !card) return;
    var storedSubtasks = subtaskTextarea(form);
    if (storedSubtasks) {
      storedSubtasks.hidden = true;
      storedSubtasks.tabIndex = -1;
      storedSubtasks.setAttribute("aria-hidden", "true");
    }
    if (Utils.qs("#newSubtaskInput", card)) return;
    card.insertAdjacentHTML("beforeend", [
      '<div class="subtask-add-row">',
      '<label class="visually-hidden" for="newSubtaskInput">Nova subtarefa</label>',
      '<input id="newSubtaskInput" type="text" placeholder="Nova subtarefa">',
      '<button class="button secondary small" type="button" id="addSubtaskButton">Adicionar</button>',
      "</div>"
    ].join(""));
    card.addEventListener("click", function (event) {
      var remove = event.target.closest("[data-subtask-remove]");
      if (remove) {
        var items = readSubtasks(form);
        var removedIndex = Number(remove.dataset.subtaskRemove);
        var removedItem = items[removedIndex];
        items.splice(removedIndex, 1);
        writeSubtasks(form, items);
        renderSubtasks();
        renderPreview();
        Utils.notify("Subtarefa removida.", {
          kind: "warning",
          actionLabel: "Desfazer",
          onAction: function () {
            var nextItems = readSubtasks(form);
            nextItems.splice(Math.min(removedIndex, nextItems.length), 0, removedItem);
            writeSubtasks(form, nextItems);
            renderSubtasks();
            renderPreview();
            Utils.notify("Subtarefa restaurada.", { kind: "success" });
          }
        });
        return;
      }
      if (!event.target.closest("#addSubtaskButton")) return;
      var input = Utils.qs("#newSubtaskInput", card);
      var value = String(input.value || "").trim();
      if (!value) {
        Utils.showError("Escreva a subtarefa antes de adicionar.", { title: "Subtarefa vazia" });
        return;
      }
      writeSubtasks(form, readSubtasks(form).concat(value));
      input.value = "";
      renderSubtasks();
      renderPreview();
      Utils.notify("Subtarefa adicionada.", { kind: "success" });
    });
    Utils.qs("#newSubtaskInput", card).addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      event.preventDefault();
      Utils.qs("#addSubtaskButton", card).click();
    });
    renderSubtasks();
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
    var prazo = String(formData.get("prazo") || "").trim() || "Sem prazo definido.";
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
    updateRecognitionCards();
  }

  function saveTask(event) {
    event.preventDefault();
    if (!Utils.validateRequiredForm(event.currentTarget, { message: "Dê um título para salvar a tarefa." })) return;
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
      prazo: coerceDateValue(formData.get("prazo")),
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
    ensurePreventionHints();
    ensureComfortableTaskFields();
    ensurePriorityDefault();
    ensureRecognitionCards();

    var id = Utils.getQueryParam("id");
    if (id) {
      editingTask = Storage.find(Storage.KEYS.tasks, id);
      if (editingTask) fillForm(editingTask);
      else if (document.body.dataset.screen === "task-edit") {
        editingTask = {
          id: id,
          concluida: false,
          criadoEm: new Date().toISOString(),
          ordem: Storage.all(Storage.KEYS.tasks).length
        };
      }
    } else {
      applyTemplate();
      if (!Utils.getQueryParam("template")) fillExample();
    }

    ensureSubtaskEditor();
    ensureEditActions();
    renderSubtasks();
    renderPreview();
    updateRecognitionCards();
    Utils.qs("#taskForm").addEventListener("input", function () {
      renderPreview();
      updateRecognitionCards();
    });
    Utils.qs("#taskForm").addEventListener("change", function () {
      renderPreview();
      updateRecognitionCards();
    });
    Utils.qs("#taskForm").addEventListener("submit", saveTask);

    var deleteButton = Utils.qs("#deleteTask");
    if (deleteButton) {
      deleteButton.hidden = !editingTask && document.body.dataset.screen !== "task-edit";
      deleteButton.addEventListener("click", async function () {
        if (!editingTask) {
          Utils.notify("Abra uma tarefa da lista para excluir.", { kind: "warning" });
          return;
        }
        var confirmed = await Utils.confirmAction({
          title: "Excluir tarefa?",
          body: "Essa ação remove a tarefa da sua lista.",
          cancelLabel: "Cancelar",
          confirmLabel: "Excluir",
          danger: true
        });
        if (!confirmed) return;
        Storage.remove(Storage.KEYS.tasks, editingTask.id);
        Utils.notify("Tarefa excluída. Lista atualizada.", { kind: "warning" });
        window.setTimeout(function () { window.location.href = "tasks.html"; }, 250);
      });
    }
  });
})();
