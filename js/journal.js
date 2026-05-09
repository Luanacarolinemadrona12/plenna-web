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
      '<input id="entrySearch" type="search" placeholder="energia, trabalho, #cliente">',
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
      Utils.qs("#entryList").innerHTML = [
        '<div class="empty-state proto-empty">',
        "<h3>" + (query ? "Busca sem resultados" : "Sem diário") + "</h3>",
        "<p>" + (query ? "Tente outra tag ou limpe a busca para ver todos os registros." : "Registre um fechamento rápido em menos de 2 minutos.") + "</p>",
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
        '<div class="journal-actions"><button type="button" data-entry-action="insight" data-entry-id="' + Utils.escapeHtml(entry.id) + '">Gerar insight</button><button type="button" data-entry-action="task" data-entry-id="' + Utils.escapeHtml(entry.id) + '">Criar tarefa</button><button type="button" data-entry-action="habit" data-entry-id="' + Utils.escapeHtml(entry.id) + '">Criar hábito</button><button type="button" data-entry-action="learning" data-entry-id="' + Utils.escapeHtml(entry.id) + '">Salvar aprendizado</button></div>',
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
      button.classList.toggle("active", button.dataset.entryType === type);
    });
  }

  function createTask(entry) {
    Storage.add(Storage.KEYS.tasks, {
      id: Utils.uid("task"),
      titulo: entry.titulo,
      descricao: entry.conteudo,
      prioridade: "media",
      esforco: "baixo",
      tempoEstimado: "25 min",
      impactoEmocional: "neutro",
      prazo: "",
      categoria: "Diário",
      concluida: false,
      recorrencia: "Sem recorrência",
      lembrete: "Sem lembrete",
      tags: entry.tags || [],
      subtarefas: [],
      criadoEm: new Date().toISOString(),
      ordem: Storage.all(Storage.KEYS.tasks).length
    });
    Utils.notify("Tarefa criada. Ela entrou na sua lista.", { kind: "success" });
  }

  function createHabit(entry) {
    Storage.add(Storage.KEYS.habits, {
      id: Utils.uid("habit"),
      nome: entry.titulo || "Hábito conectado",
      categoria: "Mente",
      frequencia: "Diário",
      metaMinima: "2 min",
      registrosPorData: {},
      criadoEm: new Date().toISOString()
    });
    Utils.notify("Hábito criado. Ele aparece em Hoje.", { kind: "success" });
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureSearch();
    renderEntries();
    Utils.qsa("[data-entry-type]").forEach(function (button) {
      button.addEventListener("click", function () { setType(button.dataset.entryType); });
    });
    var form = Utils.qs("#entryForm");
    restoreDraft(form);
    form.addEventListener("input", function () { saveDraft(form); });
    form.addEventListener("change", function () { saveDraft(form); });
    form.addEventListener("submit", createEntry);
    Utils.qs("#entryList").addEventListener("click", function (event) {
      var button = event.target.closest("[data-entry-action]");
      if (!button) return;
      var entry = Storage.find(Storage.KEYS.entries, button.dataset.entryId);
      if (!entry) return;
      if (button.dataset.entryAction === "task") createTask(entry);
      if (button.dataset.entryAction === "habit") createHabit(entry);
      if (button.dataset.entryAction === "learning") {
        Storage.update(Storage.KEYS.entries, entry.id, { aprendizado: true });
        Utils.notify("Aprendizado salvo para amanhã.", { kind: "success" });
      }
      if (button.dataset.entryAction === "insight") {
        Storage.update(Storage.KEYS.entries, entry.id, { insight: "Cuide da carga antes de aumentar foco." });
        Utils.notify("Insight gerado. Cuide da carga antes de aumentar foco.", { kind: "success" });
      }
    });
  });
})();
