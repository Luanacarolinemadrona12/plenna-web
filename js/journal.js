(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var query = "";

  function ensureSearch() {
    var wrap = Utils.qs(".journal-list-wrap");
    if (!wrap || Utils.qs("#entrySearch")) return;
    wrap.insertAdjacentHTML("afterbegin", [
      '<label class="field journal-search">',
      "<span>Buscar por texto ou tag</span>",
      '<input id="entrySearch" type="search" placeholder="energia, trabalho, #cliente" aria-label="Buscar registros do diário">',
      "</label>"
    ].join(""));
    Utils.qs("#entrySearch").addEventListener("input", function (event) {
      query = event.target.value.trim().toLowerCase();
      renderEntries();
    });
  }

  function filteredEntries(entries) {
    if (!query) return entries;
    return entries.filter(function (entry) {
      return [entry.titulo, entry.conteudo, (entry.tags || []).join(" ")].join(" ").toLowerCase().includes(query);
    });
  }

  function renderEntries() {
    var entries = Storage.all(Storage.KEYS.entries);
    var visible = filteredEntries(entries);
    Utils.setText("#entryCount", visible.length + (visible.length === 1 ? " item" : " itens"));
    if (!visible.length) {
      var emptyTitle = query ? "Nenhum registro encontrado com esse termo." : "Seu diário ainda está vazio";
      var emptyCopy = query ? "Limpe a busca para voltar aos registros ou tente uma tag diferente." : "Registre um fechamento rápido para transformar o que aconteceu hoje em clareza para amanhã.";
      Utils.qs("#entryList").innerHTML = [
        '<div class="empty-state proto-empty">',
        "<h3>" + Utils.escapeHtml(emptyTitle) + "</h3>",
        "<p>" + Utils.escapeHtml(emptyCopy) + "</p>",
        query ? '<button class="button small secondary" type="button" data-entry-clear-search>Limpar busca</button>' : '<a class="button small secondary" href="journal-night.html">Criar fechamento de hoje</a>',
        "</div>"
      ].join("");
      return;
    }
    Utils.qs("#entryList").innerHTML = visible.map(function (entry) {
      var date = new Date(entry.data);
      var dateLabel = Number.isNaN(date.getTime()) ? "Hoje" : date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
      var Icons = window.PlennaIcons;
      var entryIcon = Icons ? Icons.svg(entry.tipo === "diario" ? "heart" : "note", "journal-title-icon") : "";
      return [
        '<article class="journal-entry">',
        "<strong>" + Utils.escapeHtml(dateLabel) + "</strong>",
        "<h3>" + entryIcon + Utils.escapeHtml(entry.titulo) + "</h3>",
        "<p>" + Utils.escapeHtml(entry.conteudo) + "</p>",
        entry.tags && entry.tags.length ? '<div class="meta">' + entry.tags.map(function (tag) { return "<span>" + Utils.escapeHtml(tag) + "</span>"; }).join("") + "</div>" : "",
        '<div class="journal-actions"><button type="button" data-entry-action="insight" data-entry-id="' + Utils.escapeHtml(entry.id) + '">Gerar insight</button><button type="button" data-entry-action="task" data-entry-id="' + Utils.escapeHtml(entry.id) + '">Virar tarefa</button><button type="button" data-entry-action="habit" data-entry-id="' + Utils.escapeHtml(entry.id) + '">Virar hábito</button><button type="button" data-entry-action="learning" data-entry-id="' + Utils.escapeHtml(entry.id) + '">Adicionar aprendizado</button></div>',
        "</article>"
      ].join("");
    }).join("");
  }

  function saveDraft(form) {
    var data = new FormData(form);
    Storage.write("journalDraft", {
      tipo: data.get("tipo"),
      titulo: data.get("titulo"),
      conteudo: data.get("conteudo"),
      tags: data.get("tags"),
      atualizadoEm: new Date().toISOString()
    });
  }

  function restoreDraft(form) {
    var draft = Storage.read("journalDraft", null);
    if (!draft) return;
    if (form.elements.titulo && draft.titulo) form.elements.titulo.value = draft.titulo;
    if (form.elements.conteudo && draft.conteudo) form.elements.conteudo.value = draft.conteudo;
    if (form.elements.tags && draft.tags) form.elements.tags.value = draft.tags;
    if (draft.tipo) setType(draft.tipo);
  }

  function createEntry(event) {
    event.preventDefault();
    if (!Utils.validateRequiredForm(event.currentTarget, { message: "Preencha título e conteúdo para salvar o registro." })) return;
    var formData = new FormData(event.currentTarget);
    var tags = String(formData.get("tags") || "").split(",").map(function (tag) { return tag.trim(); }).filter(Boolean);
    Storage.add(Storage.KEYS.entries, {
      id: Utils.uid("entry"),
      tipo: formData.get("tipo"),
      titulo: String(formData.get("titulo") || "").trim(),
      conteudo: String(formData.get("conteudo") || "").trim(),
      data: new Date().toISOString(),
      tags: tags
    });
    Storage.write("journalDraft", null);
    event.currentTarget.reset();
    Utils.qs("#entryType").value = "diario";
    setType("diario");
    renderEntries();
    Utils.notify("Registro salvo. Diário atualizado.", { kind: "success" });
  }

  function setType(type) {
    Utils.qs("#entryType").value = type;
    Utils.qsa("[data-entry-type]").forEach(function (button) {
      var active = button.dataset.entryType === type;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    Utils.showScreenStatus(type === "nota" ? "Tipo de registro: nota rápida." : "Tipo de registro: diário.", { kind: "success" });
  }

  function analyzeEntry(entry) {
    var text = [entry.titulo, entry.conteudo, (entry.tags || []).join(" ")].join(" ").toLowerCase();
    var result = {
      taskTitle: entry.titulo || "Próximo passo do diário",
      category: "Diário",
      priority: "media",
      effort: "baixo",
      time: "15 min",
      habitName: entry.titulo || "Hábito conectado",
      habitGoal: "2 min",
      insight: "Transforme esse registro em um próximo passo pequeno e possível."
    };
    if (text.includes("agua") || text.includes("água") || text.includes("hidrat")) {
      result.taskTitle = "Beber água no próximo bloco";
      result.category = "Saúde";
      result.priority = "baixa";
      result.time = "2 min";
      result.habitName = "Hidratação";
      result.habitGoal = "1 copo";
      result.insight = "Seu corpo pediu hidratação; deixe água visível antes do próximo foco.";
    } else if (text.includes("reuni") || text.includes("cliente")) {
      result.taskTitle = "Revisar próximos passos da reunião";
      result.category = "Trabalho";
      result.effort = "medio";
      result.time = "25 min";
      result.habitName = "Pausa depois de reunião";
      result.habitGoal = "3 min";
      result.insight = "Reuniões longas drenam energia; proteja uma pausa curta depois delas.";
    } else if (text.includes("sono") || text.includes("cansa") || text.includes("dormi")) {
      result.taskTitle = "Preparar rotina de sono leve";
      result.category = "Bem-estar";
      result.priority = "baixa";
      result.time = "10 min";
      result.habitName = "Desligar telas";
      result.habitGoal = "10 min";
      result.insight = "A energia parece ligada ao descanso; reduza estímulos antes de dormir.";
    } else if (text.includes("ansiedade") || text.includes("ansioso") || text.includes("pressão") || text.includes("pressao")) {
      result.taskTitle = "Fazer pausa de respiração";
      result.category = "Bem-estar";
      result.time = "3 min";
      result.habitName = "Respiração consciente";
      result.insight = "Quando a pressão aparece, uma pausa curta antes de decidir ajuda a reduzir atrito.";
    } else if (text.includes("apresent") || text.includes("relat") || text.includes("contrato")) {
      result.category = "Trabalho";
      result.priority = "alta";
      result.effort = "medio";
      result.time = "25 min";
      result.habitName = "Revisão curta";
      result.habitGoal = "10 min";
      result.insight = "Há uma entrega clara aqui; reserve um bloco curto e evite carregar tudo de uma vez.";
    }
    return result;
  }

  function createTask(entry) {
    var analysis = analyzeEntry(entry);
    Storage.add(Storage.KEYS.tasks, {
      id: Utils.uid("task"),
      titulo: analysis.taskTitle,
      descricao: entry.conteudo,
      prioridade: analysis.priority,
      esforco: analysis.effort,
      tempoEstimado: analysis.time,
      impactoEmocional: "neutro",
      prazo: "",
      categoria: analysis.category,
      concluida: false,
      recorrencia: "Sem recorrência",
      lembrete: "Sem lembrete",
      tags: entry.tags || [],
      subtarefas: [],
      criadoEm: new Date().toISOString(),
      ordem: Storage.all(Storage.KEYS.tasks).length
    });
    Utils.notify("Nota transformada em tarefa.", { kind: "success" });
  }

  function createHabit(entry) {
    var analysis = analyzeEntry(entry);
    Storage.add(Storage.KEYS.habits, {
      id: Utils.uid("habit"),
      nome: analysis.habitName || "Hábito conectado",
      categoria: analysis.category === "Saúde" ? "Corpo" : "Mente",
      frequencia: "Diário",
      metaMinima: analysis.habitGoal,
      registrosPorData: {},
      criadoEm: new Date().toISOString()
    });
    Utils.notify("Nota transformada em hábito.", { kind: "success" });
  }

  function markEntryResult(button, message) {
    var card = button && button.closest(".journal-entry");
    if (!card) return;
    card.classList.add("just-updated");
    var old = Utils.qs(".inline-status", card);
    if (old) old.remove();
    card.insertAdjacentHTML("beforeend", '<span class="inline-status">' + Utils.escapeHtml(message) + "</span>");
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureSearch();
    renderEntries();
    var returnMessage = Storage.read("journalReturnMessage", null);
    if (Utils.getQueryParam("status") === "night-saved") {
      Utils.notify("Fechamento salvo. Diário atualizado.", { kind: "success" });
      Storage.write("journalReturnMessage", null);
    } else if (returnMessage && returnMessage.message) {
      Utils.notify(returnMessage.message, { kind: returnMessage.kind || "success" });
      Storage.write("journalReturnMessage", null);
    }
    Utils.qsa("[data-entry-type]").forEach(function (button) {
      button.addEventListener("click", function () { setType(button.dataset.entryType); });
    });
    var form = Utils.qs("#entryForm");
    restoreDraft(form);
    form.addEventListener("input", function () { saveDraft(form); });
    form.addEventListener("change", function () { saveDraft(form); });
    form.addEventListener("submit", createEntry);
    Utils.qsa("[data-close-details]").forEach(function (button) {
      button.addEventListener("click", function () {
        Storage.write("journalDraft", null);
        var details = button.closest("details");
        if (details) details.open = false;
        Utils.notify("Rascunho descartado. Nada foi salvo.", { kind: "warning" });
      });
    });
    Utils.qs("#entryList").addEventListener("click", function (event) {
      var clearSearch = event.target.closest("[data-entry-clear-search]");
      if (clearSearch) {
        query = "";
        var search = Utils.qs("#entrySearch");
        if (search) search.value = "";
        renderEntries();
        Utils.notify("Busca limpa. Seus registros voltaram a aparecer.", { kind: "success" });
        return;
      }
      var button = event.target.closest("[data-entry-action]");
      if (!button) return;
      var entry = Storage.find(Storage.KEYS.entries, button.dataset.entryId);
      if (!entry) return;
      if (button.dataset.entryAction === "task") {
        createTask(entry);
        markEntryResult(button, "Nota transformada em tarefa.");
      }
      if (button.dataset.entryAction === "habit") {
        createHabit(entry);
        markEntryResult(button, "Nota transformada em hábito.");
      }
      if (button.dataset.entryAction === "learning") {
        Storage.update(Storage.KEYS.entries, entry.id, { aprendizado: true });
        Utils.notify("Aprendizado salvo para amanhã.", { kind: "success" });
      }
      if (button.dataset.entryAction === "insight") {
        var analysis = analyzeEntry(entry);
        Storage.update(Storage.KEYS.entries, entry.id, { insight: analysis.insight });
        markEntryResult(button, analysis.insight);
        Utils.notify("Insight gerado: " + analysis.insight, { kind: "success" });
      }
    });
  });
})();
