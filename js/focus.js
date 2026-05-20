(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var Mood = window.PlennaMood;
  var focusData = null;
  var suggestedTask = null;
  var targetSeconds = 25 * 60;

  function openTasks() {
    return Utils.getOpenTasks();
  }

  function formatTimer(seconds) {
    var minutes = Math.floor(seconds / 60);
    var rest = seconds % 60;
    return String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
  }

  function renderTimer() {
    Utils.setText("#timerDisplay", formatTimer(targetSeconds));
  }

  function renderControlIcons() {
    if (!window.PlennaIcons) return;
    Utils.qs("#pauseFocus").innerHTML = window.PlennaIcons.svg("reset", "control-icon") + '<span class="focus-control-label">Voltar</span>';
    Utils.qs("#startFocus").innerHTML = window.PlennaIcons.svg("play", "control-icon") + '<span class="focus-control-label">Iniciar</span>';
    Utils.qs("#finishFocus").innerHTML = window.PlennaIcons.svg("skip", "control-icon") + '<span class="focus-control-label">Depois</span>';
  }

  function syncDuration() {
    var minutes = Math.max(1, Number(Utils.qs("#durationInput").value) || focusData.minutes);
    targetSeconds = minutes * 60;
    renderTimer();
    updateFocusChoiceSummary();
  }

  function ensureFocusChoiceSummary() {
    var card = Utils.qs(".focus-task-card");
    if (!card || Utils.qs("#focusChoiceSummary")) return;
    var switcher = Utils.qs(".focus-task-switcher", card);
    var html = [
      '<section class="recognition-card focus-choice-summary" id="focusChoiceSummary" aria-live="polite">',
      '<span class="recognition-label">Sessao preparada</span>',
      '<div class="recognition-stack">',
      '<p><small>Tarefa escolhida</small><strong id="focusChosenTask">Revisar proposta</strong></p>',
      '<p><small>Duracao</small><strong id="focusChosenDuration">25 min</strong></p>',
      '<p><small>Tipo</small><strong id="focusChosenType">Foco leve</strong></p>',
      "</div>",
      '<button class="button secondary full" type="button" id="repeatLastFocus">Repetir última sessão</button>',
      "</section>"
    ].join("");
    if (switcher) switcher.insertAdjacentHTML("beforebegin", html);
    else card.insertAdjacentHTML("beforeend", html);
  }

  function updateFocusChoiceSummary() {
    if (!Utils.qs("#focusChoiceSummary") || !focusData) return;
    var select = Utils.qs("#focusTaskSelect");
    var tasks = openTasks();
    var selected = select && select.value ? tasks.find(function (task) { return String(task.id) === String(select.value); }) : null;
    var minutes = Math.max(1, Number(Utils.qs("#durationInput") ? Utils.qs("#durationInput").value : focusData.minutes) || focusData.minutes);
    Utils.setText("#focusChosenTask", selected ? selected.titulo : "Sessao livre");
    Utils.setText("#focusChosenDuration", minutes + " min");
    Utils.setText("#focusChosenType", focusData.timerLabel || "Foco leve");
  }

  function renderPresetRow() {
    Utils.qs(".preset-row").innerHTML = focusData.presets.map(function (preset, index) {
      var activeDuration = String(preset[1] || "").replace(/\s*min$/i, "");
      if (index === 0) {
        return [
          '<label class="preset-card active">',
          "<span>" + Utils.escapeHtml(preset[0]) + "</span>",
          "<strong>" + Utils.escapeHtml(activeDuration) + "</strong>",
          '<input class="sr-only" id="durationInput" type="number" min="1" max="120" value="' + Utils.escapeHtml(preset[2]) + '">',
          "</label>"
        ].join("");
      }
      if (String(preset[0] || "").toLowerCase().indexOf("som") >= 0) {
        return [
          '<label class="preset-card focus-sound-preset">',
          '<span>Som ambiente</span>',
          '<select id="focusSoundSelect" aria-label="Selecionar som ambiente">',
          '<option value="chuva">Chuva · café</option>',
          '<option value="silencio">Silêncio</option>',
          '<option value="floresta">Floresta leve</option>',
          '<option value="ondas">Ondas baixas</option>',
          "</select>",
          "</label>"
        ].join("");
      }
      return [
        '<button class="preset-card" type="button" data-focus-duration="' + Utils.escapeHtml(preset[2]) + '">',
        "<span>" + Utils.escapeHtml(preset[0]) + "</span>",
        "<strong>" + Utils.escapeHtml(preset[1]) + "</strong>",
        "</button>"
      ].join("");
    }).join("");
  }

  function renderTaskSelect() {
    var select = Utils.qs("#focusTaskSelect");
    var tasks = openTasks();
    suggestedTask = Utils.suggestFocusTask(tasks, Utils.activeCheckin());

    if (!tasks.length) {
      select.innerHTML = '<option value="">Nenhuma tarefa aberta</option>';
      select.disabled = true;
      Utils.qs("#useSuggestedTask").disabled = true;
      updateFocusChoiceSummary();
      return;
    }

    select.disabled = false;
    select.innerHTML = tasks.map(function (task) {
      return '<option value="' + Utils.escapeHtml(task.id) + '">' + Utils.escapeHtml(task.titulo) + "</option>";
    }).join("");
    if (suggestedTask) select.value = suggestedTask.id;
    updateFocusChoiceSummary();
  }

  function renderFocusState(checkin) {
    focusData = Mood.focus(checkin);
    var finalBadge = focusData.finalBadge === "sugerido automaticamente" ? "sugerido<br>automaticamente" : Utils.escapeHtml(focusData.finalBadge);
    var chips = focusData.topChips || focusData.contextLine.split("·").slice(0, 3).map(function (item) {
      return item.trim();
    });
    var page = Utils.qs("#focusPage");
    page.classList.remove("state-high", "state-neutral", "state-low", "state-protect");
    page.classList.add(focusData.className);
    page.dataset.moodState = focusData.stateKey;

    Utils.setText("#focusTitle", "Modo Foco");
    Utils.setText("#focusSubtitle", "Sugerido pelo check-in e pelo planejamento do dia.");
    Utils.qs("#focusTopChips").innerHTML = chips.map(function (item) {
      return '<span class="chip">' + Utils.escapeHtml(item) + "</span>";
    }).join("");
    Utils.setText("#timerModeLabel", focusData.timerLabel);
    Utils.qs("#timerRing").src = focusData.ringSrc;
    Utils.setText("#focusPresetTitle", "Escolher sessão ideal");
    Utils.setText("#focusTaskSectionTitle", focusData.taskSectionTitle);
    Utils.setText("#focusTaskTitle", focusData.taskTitle);
    Utils.setText("#suggestedTaskText", focusData.taskMeta);
    Utils.setText("#focusContextLine", focusData.contextLine);
    Utils.qs("#focusTaskChips").innerHTML = [
      '<span class="chip">bom momento para avançar</span>',
      '<span class="chip neutral">veio do check-in</span>'
    ].join("");
    Utils.qs("#focusContextCard").innerHTML = [
      '<div class="focus-final-copy">',
      "<h2>" + Utils.escapeHtml(focusData.finalTitle) + "</h2>",
      "<p>" + Utils.escapeHtml(focusData.finalBody) + "</p>",
      "</div>",
      '<span class="state-badge">' + finalBadge + "</span>"
    ].join("");
    Utils.qs("#focusContextCard").hidden = true;

    renderPresetRow();
    ensureFocusChoiceSummary();
    Utils.qs("#durationInput").value = focusData.minutes;
    syncDuration();
  }

  function start() {
    var minutes = Math.max(1, Number(Utils.qs("#durationInput").value) || focusData.minutes);
    var select = Utils.qs("#focusTaskSelect");
    var sound = Utils.qs("#focusSoundSelect");
    var taskId = select.disabled ? null : select.value || null;
    Storage.write("focusDraft", {
      id: Utils.uid("draft"),
      taskId: taskId,
      minutos: minutes,
      tipo: focusData.timerLabel,
      somAmbiente: sound ? sound.value : "chuva",
      iniciadoEm: new Date().toISOString()
    });
    window.location.href = "focus-session.html";
  }

  function repeatLastFocus() {
    var last = Storage.latest(Storage.KEYS.focusSessions);
    if (!last) {
      Utils.notify("Ainda não há sessão anterior. Use a sugestão de agora.", { kind: "warning" });
      return;
    }
    Storage.write("focusDraft", {
      id: Utils.uid("draft"),
      taskId: last.taskId || null,
      minutos: Number(last.duracaoMinutos || Math.round((last.duracao || 0) / 60) || focusData.minutes || 25),
      tipo: last.tipo || focusData.timerLabel || "Foco leve",
      iniciadoEm: new Date().toISOString(),
      origem: "focus-repeat"
    });
    Utils.notify("Última sessão preparada.", { kind: "success" });
    window.setTimeout(function () { window.location.href = "focus-session.html"; }, 220);
  }

  function bindEvents() {
    Utils.qs("#durationInput").addEventListener("input", syncDuration);
    Utils.qs("#focusTaskSelect").addEventListener("change", updateFocusChoiceSummary);
    var sound = Utils.qs("#focusSoundSelect");
    if (sound) {
      sound.value = Storage.read("focusSound", "chuva");
      sound.addEventListener("change", function () {
        Storage.write("focusSound", sound.value);
        Utils.notify("Som ambiente selecionado.", { kind: "success" });
      });
    }
    Utils.qs("#startFocus").addEventListener("click", start);
    var repeatButton = Utils.qs("#repeatLastFocus");
    if (repeatButton) repeatButton.addEventListener("click", repeatLastFocus);
    Utils.qs("#useSuggestedTask").addEventListener("click", function () {
      if (!suggestedTask) {
        Utils.notify("Nenhuma tarefa sugerida disponível agora.", { kind: "warning" });
        return;
      }
      var select = Utils.qs("#focusTaskSelect");
      var alreadySelected = String(select.value) === String(suggestedTask.id);
      select.value = suggestedTask.id;
      updateFocusChoiceSummary();
      Utils.notify(alreadySelected ? "A tarefa sugerida já está selecionada." : "Tarefa sugerida selecionada.", { kind: "success" });
    });
    Utils.qsa("[data-focus-duration]").forEach(function (button) {
      button.addEventListener("click", function () {
        Utils.qs("#durationInput").value = button.dataset.focusDuration;
        syncDuration();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var checkin = Utils.activeCheckin();
    renderControlIcons();
    renderFocusState(checkin);
    renderTaskSelect();
    bindEvents();
  });
})();
