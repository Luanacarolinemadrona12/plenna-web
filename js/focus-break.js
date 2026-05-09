(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var remaining = 120;
  var timer = null;
  var selectedName = "Pausa inteligente";

  function format(seconds) {
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  }

  function timerNode() {
    return Utils.qs("#breakTimer");
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

  function setDuration(seconds, name) {
    remaining = Math.max(30, Number(seconds) || 120);
    selectedName = name || selectedName;
    var node = timerNode();
    if (node) node.dataset.breakDuration = String(remaining);
    render();
  }

  function start() {
    if (timer) return;
    document.body.classList.add("pause-running");
    var node = timerNode();
    if (node) node.hidden = false;
    setBreakStatus("Pausa inteligente em andamento", "running");
    Utils.notify(selectedName + " iniciada.", { kind: "success" });
    timer = window.setInterval(function () {
      remaining -= 1;
      render();
      if (remaining <= 0) done(false);
    }, 1000);
  }

  function done(redirect) {
    if (timer) window.clearInterval(timer);
    timer = null;
    document.body.classList.remove("pause-running");
    setBreakStatus("Pausa inteligente concluída", "done");
    Storage.add(Storage.KEYS.focusSessions, {
      id: Utils.uid("pause"),
      tipo: selectedName,
      duracaoMinutos: Math.max(1, Math.round(Number((timerNode() && timerNode().dataset.breakDuration) || 120) / 60)),
      pausa: true,
      concluida: true,
      data: new Date().toISOString()
    });
    Utils.notify("Pausa registrada. Você pode voltar ao foco.", { kind: "success" });
    if (redirect !== false) {
      window.setTimeout(function () { window.location.href = "focus.html"; }, 350);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var node = timerNode();
    setDuration(node ? node.dataset.breakDuration : 120, selectedName);
    setBreakStatus("Pausa inteligente", "");
    var startButton = Utils.qs("#breakStart");
    var doneButton = Utils.qs("#breakDone");
    if (startButton) startButton.addEventListener("click", start);
    if (doneButton) doneButton.addEventListener("click", function () { done(true); });
    Utils.qsa("[data-micro-pause]").forEach(function (button) {
      button.addEventListener("click", function () {
        setDuration(button.dataset.duration, button.dataset.microPause);
        setBreakStatus("Pausa inteligente selecionada", "");
        Utils.notify(button.dataset.microPause + " selecionada.", { kind: "success" });
      });
    });
  });
})();
