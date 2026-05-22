(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var Data = window.PlennaData || {};
  var lastHabitId = null;
  var lastHabitMessage = "";

  function fillSelect(selector, values) {
    var select = Utils.qs(selector);
    if (!select) return;
    select.innerHTML = (values || []).map(function (value) {
      return '<option value="' + Utils.escapeHtml(value) + '">' + Utils.escapeHtml(value) + "</option>";
    }).join("");
  }

  function renderHabits() {
    var habits = Storage.all(Storage.KEYS.habits);
    var today = Utils.todayISO();
    var doneCount = habits.filter(function (habit) {
      return habit.registrosPorData && habit.registrosPorData[today];
    }).length;

    Utils.setText("#habitTodayTitle", new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }));
    Utils.setText("#habitProgressText", doneCount + " de " + habits.length + " concluídos");
    Utils.qs("#habitProgressFill").style.width = habits.length ? Math.round((doneCount / habits.length) * 100) + "%" : "0%";

    if (!habits.length) {
      Utils.qs("#habitList").innerHTML = [
        '<div class="empty-state proto-empty">',
        "<h3>Sua rotina de hábitos ainda está vazia</h3>",
        "<p>Use um modelo simples para começar com uma meta pequena e fácil de cumprir hoje.</p>",
        '<a class="button small primary" href="habit-templates.html">Escolher modelo</a>',
        "</div>"
      ].join("");
      return;
    }

    var done = habits.filter(function (habit) {
      return habit.registrosPorData && habit.registrosPorData[today];
    });
    var overdue = habits.filter(function (habit) {
      return isOverdue(habit, today);
    });
    var pending = habits.filter(function (habit) {
      return !(habit.registrosPorData && habit.registrosPorData[today]) && !isOverdue(habit, today);
    });

    Utils.qs("#habitList").innerHTML = [
      section("Hoje", "Meta mínima primeiro", pending, today),
      section("Atrasados", "Retome sem perder o contexto", overdue, today, "overdue"),
      section("Concluídos", "Sequência protegida", done, today),
      suggested()
    ].join("");
  }

  function isOverdue(habit, today) {
    if (habit.registrosPorData && habit.registrosPorData[today]) return false;
    if (habit.atrasado || habit.status === "atrasado") return true;
    var records = Object.keys(habit.registrosPorData || {}).sort();
    if (!records.length) return false;
    var yesterday = Utils.addDaysISO(-1);
    return !habit.registrosPorData[yesterday] || records[records.length - 1] < yesterday;
  }

  function section(title, subtitle, habits, today, state) {
    if (!habits.length) return "";
    return [
      '<section class="habit-section ' + (state === "overdue" ? "habit-section-overdue" : "") + '">',
      '<div class="row between task-section-heading"><strong>' + Utils.escapeHtml(title) + '</strong><small>' + Utils.escapeHtml(subtitle) + "</small></div>",
      habits.map(function (habit, index) { return habitCard(habit, index, today, state); }).join(""),
      "</section>"
    ].join("");
  }

  function suggested() {
    return [
      '<section class="habit-section suggested-habits">',
      '<div class="row between task-section-heading"><strong>Sugeridos</strong><small>Autocuidado leve</small></div>',
      '<div class="chip-row">',
      '<a class="chip" href="habit-templates.html?template=agua">hidratação</a>',
      '<a class="chip" href="habit-templates.html?template=pausa">pausa sem tela</a>',
      '<a class="chip" href="habit-templates.html?template=diario">diário rápido</a>',
      "</div>",
      "</section>"
    ].join("");
  }

  function habitCard(habit, index, today, state) {
    var done = habit.registrosPorData && habit.registrosPorData[today];
    var color = ["#35c98d", "#15a6f4", "#e5ad4d", "#35c98d", "#9b7bea"][index % 5];
    var Icons = window.PlennaIcons;
    var checkIcon = Icons ? Icons.svg("check", "check-mark") : "";
    var habitIcon = habit.emoji || emojiForHabit(habit);
    var streak = Object.keys(habit.registrosPorData || {}).length;
    return [
      '<article class="habit-item ' + (state === "overdue" ? "overdue" : "") + (done ? " done" : "") + (String(habit.id) === String(lastHabitId) ? " just-updated" : "") + '" data-habit-id="' + Utils.escapeHtml(habit.id) + '" style="--habit-color:' + color + '">',
      '<div class="item-top">',
      '<button class="habit-icon habit-emoji-button" type="button" data-action="icon" aria-label="Alterar emoji do hábito"><span aria-hidden="true">' + Utils.escapeHtml(habitIcon) + "</span></button>",
      "<div>",
      '<div class="task-title">' + Utils.escapeHtml(habit.nome) + "</div>",
      '<small>' + Utils.escapeHtml(habit.metaMinima || "Meta mínima") + " · " + Utils.escapeHtml(habit.frequencia || "Diário") + "</small>",
      "<p>Impacto no bem-estar: " + Utils.escapeHtml(impactForHabit(habit)) + "</p>",
      "</div>",
      '<button class="habit-day' + (done ? " done" : "") + '" type="button" data-action="toggle" aria-label="' + Utils.escapeHtml(done ? "Desmarcar " + habit.nome : "Marcar " + habit.nome + " como concluído") + '">' + (done ? checkIcon : "") + "</button>",
      "</div>",
      String(habit.id) === String(lastHabitId) && lastHabitMessage ? '<span class="inline-status">' + Utils.escapeHtml(lastHabitMessage) + "</span>" : "",
      '<div class="habit-meta-line"><span>sequência ' + streak + ' dias</span><span>' + (done ? "feito hoje" : state === "overdue" ? "retomar hoje" : "pode mover para 09h") + '</span><a href="habit-edit.html?id=' + Utils.escapeHtml(habit.id) + '">Editar</a></div>',
      "</article>"
    ].join("");
  }

  function iconForHabit(habit) {
    var text = (habit.nome + " " + habit.categoria).toLowerCase();
    if (text.includes("água") || text.includes("hidr")) return "water";
    if (text.includes("medita") || text.includes("mente") || text.includes("respira")) return "breath";
    if (text.includes("leitura") || text.includes("livro")) return "book";
    if (text.includes("diário") || text.includes("escre")) return "note";
    return "nav-habits";
  }

  function emojiForHabit(habit) {
    var text = (habit.nome + " " + habit.categoria).toLowerCase();
    if (text.includes("água") || text.includes("hidr")) return "💧";
    if (text.includes("medita") || text.includes("mente") || text.includes("respira")) return "🌿";
    if (text.includes("leitura") || text.includes("livro")) return "📘";
    if (text.includes("diário") || text.includes("escre")) return "✍️";
    if (text.includes("along") || text.includes("exerc")) return "☀️";
    return "♡";
  }

  function nextEmoji(current) {
    var options = ["♡", "💧", "🌿", "📘", "✍️", "☀️", "🧘"];
    var index = options.indexOf(current);
    return options[(index + 1) % options.length];
  }

  function impactForHabit(habit) {
    var text = (habit.nome + " " + habit.categoria).toLowerCase();
    if (text.includes("água") || text.includes("hidr")) return "proteger energia da tarde";
    if (text.includes("medita") || text.includes("mente")) return "acalmar antes do trabalho";
    if (text.includes("diário") || text.includes("escre")) return "organizar emoções do dia";
    return "sustentar constância com leveza";
  }

  function createHabit(event) {
    event.preventDefault();
    if (!Utils.validateRequiredForm(event.currentTarget, { message: "Dê um nome para salvar o hábito." })) return;
    var formData = new FormData(event.currentTarget);
    var habit = {
      id: Utils.uid("habit"),
      nome: String(formData.get("nome") || "").trim(),
      categoria: formData.get("categoria"),
      frequencia: formData.get("frequencia"),
      metaMinima: String(formData.get("metaMinima") || "").trim(),
      emoji: "♡",
      registrosPorData: {},
      criadoEm: new Date().toISOString()
    };
    Storage.add(Storage.KEYS.habits, habit);
    event.currentTarget.reset();
    lastHabitId = habit.id;
    lastHabitMessage = "Criado agora";
    renderHabits();
    Utils.notify("Hábito criado. Ele aparece em Hoje.", { kind: "success" });
  }

  function toggleHabit(event) {
    var iconButton = event.target.closest("[data-action='icon']");
    if (iconButton) {
      var iconItem = event.target.closest("[data-habit-id]");
      var iconHabit = Storage.find(Storage.KEYS.habits, iconItem.dataset.habitId);
      if (!iconHabit) return;
      var emoji = nextEmoji(iconHabit.emoji || emojiForHabit(iconHabit));
      Storage.update(Storage.KEYS.habits, iconHabit.id, { emoji: emoji });
      lastHabitId = iconHabit.id;
      lastHabitMessage = "Emoji atualizado";
      renderHabits();
      Utils.notify("Emoji do hábito atualizado.", { kind: "success" });
      return;
    }
    var button = event.target.closest("[data-action='toggle']");
    if (!button) return;
    var item = event.target.closest("[data-habit-id]");
    var habit = Storage.find(Storage.KEYS.habits, item.dataset.habitId);
    if (!habit) return;
    var registros = Object.assign({}, habit.registrosPorData || {});
    var today = Utils.todayISO();
    var previous = Boolean(registros[today]);
    registros[today] = !registros[today];
    if (!registros[today]) delete registros[today];
    Storage.update(Storage.KEYS.habits, habit.id, { registrosPorData: registros, atrasado: false, status: "" });
    lastHabitId = habit.id;
    lastHabitMessage = previous ? "Reaberto agora" : "Marcado hoje";
    renderHabits();
    Utils.notify(previous ? "Hábito reaberto." : "Hábito marcado. Sequência atualizada.", {
      kind: previous ? "warning" : "success",
      actionLabel: "Desfazer",
      onAction: function () {
        var undo = Object.assign({}, registros);
        if (previous) undo[today] = true;
        else delete undo[today];
        Storage.update(Storage.KEYS.habits, habit.id, { registrosPorData: undo });
        lastHabitId = habit.id;
        lastHabitMessage = "Ação desfeita";
        renderHabits();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    fillSelect("#habitCategorySelect", Data.categoriasHabito);
    fillSelect("#habitFrequencySelect", Data.frequencias);
    renderHabits();
    var form = Utils.qs("#habitForm");
    if (form) form.addEventListener("submit", createHabit);
    Utils.qsa("[data-close-details]").forEach(function (button) {
      button.addEventListener("click", function () {
        var details = button.closest("details");
        if (details) details.open = false;
        Utils.notify("Criação cancelada. Nada foi salvo.", { kind: "warning" });
      });
    });
    var list = Utils.qs("#habitList");
    if (list) list.addEventListener("click", toggleHabit);
  });
})();
