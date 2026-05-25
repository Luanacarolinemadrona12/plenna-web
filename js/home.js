(function () {
  "use strict";

  var Utils = window.PlennaUtils;
  var Mood = window.PlennaMood;
  var Storage = window.PlennaStorage;

  function setStateClass(page, data) {
    page.classList.remove("state-high", "state-neutral", "state-low", "state-protect");
    page.classList.add(data.className);
    page.dataset.moodState = data.stateKey;
    document.body.dataset.moodState = data.stateKey;
  }

  function renderHeader(data, checkin) {
    var settings = window.PlennaStorage.read(window.PlennaStorage.KEYS.settings, {});
    var firstName = String(settings.nome || "").trim().split(/\s+/)[0] || "";
    var greeting = checkin
      ? (data.careTitle || "Vamos cuidar do essencial")
      : (firstName ? ("Olá, " + firstName) : "Que bom ter você aqui");
    Utils.setText("#homeGreeting", greeting);
    Utils.setText("#homeDate", data.date);
    Utils.qs("#checkinChips").innerHTML = [
      '<span class="chip solid">' + Utils.escapeHtml(data.moodChip) + "</span>",
      '<span class="chip">' + Utils.escapeHtml(data.energyChip) + "</span>",
      '<a class="chip" href="checkin.html">' + (checkin ? "Editar check-in" : "Fazer check-in") + "</a>"
    ].join("");
  }

  function renderCareNote(data, checkin) {
    var note = Utils.qs("#homeCareNote");
    if (!note) return;
    var copy = data.careCopy || (checkin ? "Vamos cuidar do essencial sem apertar o ritmo." : "Um check-in rápido ajuda o Plenna a ajustar seu dia com mais cuidado.");
    note.innerHTML = [
      '<span class="eyebrow">Seu dia</span>',
      '<strong>' + Utils.escapeHtml(data.careLead || "Vamos com calma.") + "</strong>",
      "<p>" + Utils.escapeHtml(copy) + "</p>"
    ].join("");
  }

  function renderRecommendation(data) {
    Utils.qs("#recommendationCard").innerHTML = [
      '<span class="eyebrow">' + Utils.escapeHtml(data.actionTag) + "</span>",
      "<h2>" + Utils.escapeHtml(data.actionTitle) + "</h2>",
      data.actionCopy ? "<p>" + Utils.escapeHtml(data.actionCopy) + "</p>" : "",
      '<div class="row">',
      '<a class="button primary" href="' + Utils.escapeHtml(data.primaryHref || "planning.html") + '">' + Utils.escapeHtml(data.primaryLabel || "Planejar meu dia") + "</a>",
      data.secondaryHref ? '<a class="button secondary" href="' + Utils.escapeHtml(data.secondaryHref) + '">' + Utils.escapeHtml(data.secondaryLabel || "Iniciar foco") + "</a>" : '<button class="button secondary" type="button" data-home-action="start-focus">' + Utils.escapeHtml(data.secondaryLabel || "Iniciar foco") + "</button>",
      "</div>"
    ].join("");
  }

  function taskCategory(task, fallback) {
    return task ? task.categoria || task.projeto || fallback || "Tarefa" : fallback || "Tarefa";
  }

  function priorityItems(data) {
    if (Utils.getQueryParam("demo")) {
      return data.priorities.map(function (item) {
        return { id: "", title: item[0], category: item[1], done: false };
      });
    }
    var openTasks = Utils.sortTasks(Storage.all(Storage.KEYS.tasks).filter(function (task) {
      return !task.concluida;
    }));
    if (openTasks.length) {
      return openTasks.slice(0, 3).map(function (task) {
        return {
          id: task.id,
          title: task.titulo,
          category: taskCategory(task, "Tarefa"),
          done: Boolean(task.concluida)
        };
      });
    }
    return data.priorities.map(function (item) {
      return { id: "", title: item[0], category: item[1], done: false };
    });
  }

  function renderPriorities(data) {
    Utils.qs("#priorityList").innerHTML = priorityItems(data).map(function (item, index) {
      return [
        '<article class="priority-row home-priority-row' + (item.done ? " done" : "") + '" data-home-priority-row' + (item.id ? ' data-task-id="' + Utils.escapeHtml(item.id) + '"' : "") + ">",
        '<button class="home-check-dot" type="button" data-home-complete-task aria-label="Marcar tarefa como feita">' + (item.done ? "✓" : "") + "</button>",
        '<p><strong>' + (index + 1) + ".</strong> " + Utils.escapeHtml(item.title) + "</p>",
        '<a class="chip home-priority-chip" data-cat="' + Utils.escapeHtml((item.category || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-")) + '" href="tasks.html">' + Utils.escapeHtml(item.category) + "</a>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderAppointment(data) {
    Utils.qs("#appointmentCard").innerHTML = [
      "<h2>Um ponto de cuidado</h2>",
      '<div class="appointment-row">',
      '<span class="appointment-time">' + Utils.escapeHtml(data.appointment.time) + "</span>",
      '<span class="appointment-title">' + Utils.escapeHtml(data.appointment.title) + "</span>",
      "<p>" + Utils.escapeHtml(data.appointment.note) + "</p>",
      "</div>"
    ].join("");
  }

  function renderMessage(data) {
    var card = Utils.qs("#homeMessageCard");
    if (!card) return;
    card.hidden = true;
    card.innerHTML = "";
  }

  function renderMetrics(data) {
    Utils.qs("#homeMetrics").innerHTML = data.metrics.map(function (metric) {
      return metricCard(metric[0], metric[1], metric[2]);
    }).join("");
  }

  function metricCard(kind, label, value) {
    var href = kind === "focus" ? "focus.html" : kind === "habits" ? "habits.html" : "dashboard.html";
    return [
      '<a class="home-metric-card ' + Utils.escapeHtml(kind) + '" href="' + href + '">',
      '<span class="metric-dot" aria-hidden="true"></span>',
      "<div>",
      "<b>" + Utils.escapeHtml(label) + "</b>",
      "<strong>" + Utils.escapeHtml(value) + "</strong>",
      "</div>",
      "</a>"
    ].join("");
  }

  function renderExtras(data) {
    var shortcuts = Utils.qs("#homeShortcuts");
    if (shortcuts) {
      shortcuts.hidden = false;
      renderShortcuts(data);
    }
  }

  function focusSuggestion() {
    return Utils.suggestFocusTask(Utils.getOpenTasks(), Utils.activeCheckin());
  }

  function focusMode() {
    var focus = Mood.focus(Utils.activeCheckin());
    return {
      minutes: Number(focus.minutes || 25),
      type: focus.timerLabel || "Foco leve"
    };
  }

  function renderShortcuts(data) {
    var shortcuts = Utils.qs("#homeShortcuts");
    if (!shortcuts) return;
    shortcuts.innerHTML = [
      '<button class="shortcut home-action-shortcut" type="button" data-home-action="breathe">Respirar 3 min</button>',
      '<a class="shortcut home-action-shortcut" href="journal-night.html">Fechar o dia</a>',
      '<a class="shortcut home-action-shortcut always-visible" href="planning.html">Reorganizar com calma</a>'
    ].join("");
  }

  function writeFocusDraft(options) {
    var mode = focusMode();
    var suggested = focusSuggestion();
    Storage.write("focusDraft", {
      id: Utils.uid("draft"),
      taskId: options.taskId || (suggested ? suggested.id : null),
      minutos: options.minutes || mode.minutes,
      tipo: options.type || mode.type,
      iniciadoEm: new Date().toISOString(),
      origem: options.origin || "home"
    });
  }

  function startSuggestedFocus() {
    writeFocusDraft({ origin: "home-suggested" });
    Utils.notify("Foco preparado com a tarefa sugerida.", { kind: "success" });
    window.setTimeout(function () { window.location.href = "focus-session.html"; }, 220);
  }

  function repeatLastFocus() {
    var last = Storage.latest(Storage.KEYS.focusSessions);
    if (!last) {
      Utils.notify("Ainda não há sessão anterior. Preparei o foco sugerido.", { kind: "warning" });
      startSuggestedFocus();
      return;
    }
    writeFocusDraft({
      taskId: last.taskId || null,
      minutes: Number(last.duracaoMinutos || Math.round((last.duracao || 0) / 60) || 25),
      type: last.tipo || "Foco leve",
      origin: "home-repeat"
    });
    Utils.notify("Última sessão de foco preparada.", { kind: "success" });
    window.setTimeout(function () { window.location.href = "focus-session.html"; }, 220);
  }

  function startBreathingPause() {
    Storage.write("microPauseDraft", {
      id: Utils.uid("pause"),
      tipo: "Respiração",
      minutos: 3,
      criadoEm: new Date().toISOString(),
      origem: "home"
    });
    Utils.notify("Pausa de respiração de 3 min preparada.", { kind: "success" });
    window.setTimeout(function () { window.location.href = "micro-pauses.html?quick=breath"; }, 220);
  }

  function bindHomeActions() {
    var page = Utils.qs("#homePage");
    if (!page) return;
    page.addEventListener("click", function (event) {
      var complete = event.target.closest("[data-home-complete-task]");
      if (complete) {
        event.preventDefault();
        var row = complete.closest("[data-task-id]");
        if (!row) {
          Utils.notify("Abra a lista para marcar esta prioridade.", { kind: "warning" });
          return;
        }
        var task = Storage.find(Storage.KEYS.tasks, row.dataset.taskId);
        if (!task) return;
        Storage.update(Storage.KEYS.tasks, task.id, {
          concluida: true,
          concluidaEm: new Date().toISOString()
        });
        row.classList.add("done", "just-updated");
        complete.textContent = "✓";
        Utils.notify("Tarefa concluída. Prioridades atualizadas.", {
          kind: "success",
          actionLabel: "Desfazer",
          onAction: function () {
            Storage.update(Storage.KEYS.tasks, task.id, {
              concluida: false,
              concluidaEm: null
            });
            var data = Mood.home(Utils.activeCheckin());
            renderPriorities(data);
          }
        });
        window.setTimeout(function () {
          renderPriorities(Mood.home(Utils.activeCheckin()));
        }, 350);
        return;
      }
      var action = event.target.closest("[data-home-action]");
      if (!action) return;
      event.preventDefault();
      if (action.dataset.homeAction === "start-focus") startSuggestedFocus();
      if (action.dataset.homeAction === "repeat-focus") repeatLastFocus();
      if (action.dataset.homeAction === "breathe") startBreathingPause();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var checkin = Utils.activeCheckin();
    var data = Mood.home(checkin);
    setStateClass(Utils.qs("#homePage"), data);
    renderHeader(data, checkin);
    renderCareNote(data, checkin);
    renderRecommendation(data);
    renderPriorities(data);
    renderAppointment(data);
    renderMessage(data);
    renderMetrics(data);
    renderExtras(data);
    bindHomeActions();
  });
})();
