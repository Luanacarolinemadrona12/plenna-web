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
    Utils.qs("#pauseFocus").innerHTML = window.PlennaIcons.svg("reset", "control-icon");
    Utils.qs("#startFocus").innerHTML = window.PlennaIcons.svg("play", "control-icon");
    Utils.qs("#finishFocus").innerHTML = window.PlennaIcons.svg("skip", "control-icon");
  }

  function syncDuration() {
    var minutes = Math.max(1, Number(Utils.qs("#durationInput").value) || focusData.minutes);
    targetSeconds = minutes * 60;
    renderTimer();
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
    suggestedTask = Utils.suggestFocusTask(tasks, Storage.latest(Storage.KEYS.checkins));

    if (!tasks.length) {
      select.innerHTML = '<option value="">Nenhuma tarefa aberta</option>';
      select.disabled = true;
      Utils.qs("#useSuggestedTask").disabled = true;
      return;
    }

    select.disabled = false;
    select.innerHTML = tasks.map(function (task) {
      return '<option value="' + Utils.escapeHtml(task.id) + '">' + Utils.escapeHtml(task.titulo) + "</option>";
    }).join("");
    if (suggestedTask) select.value = suggestedTask.id;
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
    Utils.qs("#durationInput").value = focusData.minutes;
    syncDuration();
  }

  function start() {
    var minutes = Math.max(1, Number(Utils.qs("#durationInput").value) || focusData.minutes);
    var select = Utils.qs("#focusTaskSelect");
    var taskId = select.disabled ? null : select.value || null;
    Storage.write("focusDraft", {
      id: Utils.uid("draft"),
      taskId: taskId,
      minutos: minutes,
      tipo: focusData.timerLabel,
      iniciadoEm: new Date().toISOString()
    });
    window.location.href = "focus-session.html";
  }

  function bindEvents() {
    Utils.qs("#durationInput").addEventListener("input", syncDuration);
    Utils.qs("#startFocus").addEventListener("click", start);
    Utils.qs("#useSuggestedTask").addEventListener("click", function () {
      if (suggestedTask) Utils.qs("#focusTaskSelect").value = suggestedTask.id;
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
