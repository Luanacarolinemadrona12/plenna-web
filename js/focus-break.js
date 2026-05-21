(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var remaining = 120;
  var durationSeconds = 120;
  var timer = null;
  var selectedName = "Pausa sugerida";
  var completed = false;

  function format(seconds) {
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  }

  function timerNode() {
    return Utils.qs("#breakTimer");
  }

  function breakPanel() {
    return Utils.qs("[data-break-panel]");
  }

  function completePanel() {
    return Utils.qs("[data-break-complete]");
  }

  function setBreakStatus(message, state) {
    var status = Utils.qs("#breakStatus");
    var anchor = timerNode();
    if (!status && anchor && anchor.parentNode) {
      status = document.createElement("strong");
      status.id = "breakStatus";
      status.className = "break-status";
      anchor.parentNode.insertBefore(status, anchor);
    }
    if (!status) return;
    status.textContent = message;
    status.className = "break-status" + (state ? " " + state : "");
  }

  function render() {
    var node = timerNode();
    if (node) node.textContent = format(remaining);
  }

  function primaryButton() {
    return Utils.qs("#breakStart");
  }

  function setPrimaryState(state) {
    var button = primaryButton();
    if (!button) return;
    if (state === "running") {
      button.textContent = "Concluir pausa";
      button.disabled = false;
      return;
    }
    if (state === "done") {
      button.textContent = "Pausa registrada";
      button.disabled = true;
      return;
    }
    button.textContent = "Iniciar com calma";
    button.disabled = false;
  }

  function setDuration(seconds, name) {
    remaining = Math.max(30, Number(seconds) || 120);
    durationSeconds = remaining;
    selectedName = name || selectedName;
    var node = timerNode();
    if (node) node.dataset.breakDuration = String(remaining);
    render();
  }

  function revealPanel() {
    var panel = breakPanel();
    if (panel) panel.hidden = false;
    document.body.classList.add("pause-selected");
  }

  function resetChoice() {
    if (timer) window.clearInterval(timer);
    timer = null;
    completed = false;
    document.body.classList.remove("pause-selected", "pause-running", "pause-complete");
    var panel = breakPanel();
    if (panel) panel.hidden = true;
    var donePanel = completePanel();
    if (donePanel) donePanel.hidden = true;
    setPrimaryState("");
    setBreakStatus("Escolha uma pausa para começar", "");
  }

  function updateSelectedCopy(name) {
    Utils.setText("[data-break-title]", name || "Pausa escolhida");
    Utils.setText("[data-break-copy]", "Respire por alguns minutos antes de voltar. Você não precisa acelerar agora.");
  }

  function selectPause(button, options) {
    options = options || {};
    if (timer) window.clearInterval(timer);
    timer = null;
    completed = false;
    document.body.classList.remove("pause-running", "pause-complete");
    var donePanel = completePanel();
    if (donePanel) donePanel.hidden = true;
    setDuration(button.dataset.duration, button.dataset.microPause);
    updateSelectedCopy(button.dataset.microPause);
    revealPanel();
    setBreakStatus(selectedName + " preparada", "");
    setPrimaryState("");
    Utils.qsa("[data-micro-pause]").forEach(function (item) {
      item.closest(".micro-card").classList.toggle("active", item === button);
    });
    if (options.autoStart) start();
    else Utils.notify(selectedName + " pronta para você.", { kind: "success" });
  }

  function start() {
    if (completed) return;
    revealPanel();
    if (timer) {
      done(false);
      return;
    }
    document.body.classList.add("pause-running");
    document.body.classList.remove("pause-complete");
    var panel = completePanel();
    if (panel) panel.hidden = true;
    setBreakStatus("Pausa em andamento", "running");
    setPrimaryState("running");
    Utils.notify(selectedName + " iniciada. Volte no seu ritmo.", { kind: "success" });
    timer = window.setInterval(function () {
      remaining -= 1;
      render();
      if (remaining <= 0) done(false);
    }, 1000);
  }

  function done(redirect) {
    if (completed) return;
    completed = true;
    if (timer) window.clearInterval(timer);
    timer = null;
    document.body.classList.remove("pause-running");
    document.body.classList.add("pause-complete");
    setBreakStatus("Pausa registrada", "done");
    setPrimaryState("done");
    var panel = completePanel();
    if (panel) panel.hidden = false;
    var elapsedSeconds = Math.max(1, durationSeconds - remaining);
    var node = timerNode();
    if (node) {
      node.textContent = format(elapsedSeconds);
      node.setAttribute("aria-label", "Pausa registrada: " + format(elapsedSeconds));
    }
    Storage.add(Storage.KEYS.focusSessions, {
      id: Utils.uid("pause"),
      tipo: selectedName,
      duracaoMinutos: Math.max(1, Math.round(elapsedSeconds / 60)),
      pausa: true,
      concluida: true,
      data: new Date().toISOString()
    });
    Storage.write("microPauseDraft", null);
    Utils.notify("Pausa registrada. Volte no seu ritmo.", { kind: "success" });
    if (redirect === true) {
      window.setTimeout(function () { window.location.href = "focus.html"; }, 350);
    }
  }

  function adaptToCheckin() {
    var checkin = Utils.activeCheckin ? Utils.activeCheckin() : null;
    var isLowEnergy = checkin && (checkin.energia === "baixa" || Number(checkin.energiaValor || 0) <= 4);
    var note = Utils.qs("[data-low-energy-note]");
    if (note) note.hidden = false;
    if (!isLowEnergy) return;
    var breath = Utils.qs('[data-micro-pause="Respiração"]');
    if (breath) breath.dataset.duration = "120";
    Utils.setText('[data-duration-label="breath"]', "2 min");
    Utils.setText('[data-benefit-label="breath"]', "Pausa curta e protetiva para energia baixa.");
    Utils.setText("[data-recommended-chip]", "mais leve para hoje");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var node = timerNode();
    setDuration(node ? node.dataset.breakDuration : 120, selectedName);
    adaptToCheckin();
    var pauseDraft = Storage.read("microPauseDraft", null);
    if (pauseDraft) {
      setDuration(Number(pauseDraft.minutos || 3) * 60, pauseDraft.tipo || "Respiração");
      selectedName = pauseDraft.tipo || selectedName;
      revealPanel();
      updateSelectedCopy(selectedName);
      setBreakStatus(selectedName + " preparada", "");
    } else {
      setBreakStatus("Escolha uma pausa para começar", "");
    }
    setPrimaryState("");
    var startButton = Utils.qs("#breakStart");
    var doneButton = Utils.qs("#breakDone");
    var chooseAnother = Utils.qs("#breakChooseAnother");
    if (startButton) startButton.addEventListener("click", start);
    if (doneButton) doneButton.addEventListener("click", function () { done(false); });
    if (chooseAnother) chooseAnother.addEventListener("click", resetChoice);
    Utils.qsa("[data-micro-pause]").forEach(function (button) {
      button.addEventListener("click", function () {
        selectPause(button, { autoStart: false });
        var panel = breakPanel();
        if (panel && typeof panel.scrollIntoView === "function") {
          panel.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      });
    });
    if (Utils.getQueryParam("quick") === "breath") {
      var breathButton = Utils.qs('[data-micro-pause="Respiração"]');
      if (breathButton) selectPause(breathButton, { autoStart: false });
    }
  });
})();
