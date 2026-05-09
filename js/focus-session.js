(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var timerId = null;
  var elapsed = 0;
  var draft = null;
  var totalSeconds = 25 * 60;

  function render() {
    var remaining = Math.max(totalSeconds - elapsed, 0);
    var minutes = Math.floor(remaining / 60);
    var seconds = remaining % 60;
    Utils.setText("#sessionTimer", String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0"));
    if (remaining <= 0) finish(true);
  }

  function setStatus(message, state) {
    Utils.setText("#sessionStatus", message);
    var root = Utils.qs(".focus-timer-cluster");
    if (root) root.dataset.focusState = state || "";
  }

  function currentTask() {
    return draft && draft.taskId ? Storage.find(Storage.KEYS.tasks, draft.taskId) : null;
  }

  function start() {
    if (timerId) return;
    timerId = window.setInterval(function () {
      elapsed += 1;
      render();
    }, 1000);
    Utils.qs("#sessionStart").hidden = true;
    Utils.qs("#sessionPause").hidden = false;
    setStatus("Foco em andamento", "running");
    Utils.notify("Foco em andamento.", { kind: "success" });
  }

  function pause() {
    if (!timerId) return;
    window.clearInterval(timerId);
    timerId = null;
    Utils.qs("#sessionStart").hidden = false;
    Utils.qs("#sessionPause").hidden = true;
    setStatus("Pausado", "paused");
    Utils.notify("Sessão pausada.", { kind: "warning" });
  }

  function finish(completed) {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    Storage.add(Storage.KEYS.focusSessions, {
      id: Utils.uid("focus"),
      taskId: draft.taskId || null,
      duracao: elapsed || totalSeconds,
      duracaoMinutos: Math.max(1, Math.round((elapsed || totalSeconds) / 60)),
      concluida: Boolean(completed),
      data: new Date().toISOString(),
      tipo: draft.tipo || "Foco"
    });
    setStatus(completed ? "Sessão concluída" : "Sessão encerrada", completed ? "done" : "skipped");
    Utils.notify(completed ? "Sessão de foco salva no Dashboard." : "Sessão encerrada e salva.", { kind: completed ? "success" : "warning" });
    window.setTimeout(function () { window.location.href = "focus-break.html"; }, 450);
  }

  function taskOptions() {
    return Storage.all(Storage.KEYS.tasks).filter(function (task) {
      return !task.concluida;
    });
  }

  function updateTaskCopy() {
    var task = currentTask();
    Utils.setText("#sessionTaskTitle", task ? task.titulo : "Foco sem tarefa associada");
    Utils.setText("#sessionTaskMeta", task ? [
      task.prioridade || "prioridade média",
      task.esforco || "esforço médio",
      task.tempoEstimado || draft.minutos + " min"
    ].join(" · ") : "Sessão livre · " + draft.minutos + " min");
  }

  function renderTaskSwitcher() {
    var card = Utils.qs(".focus-task-card");
    if (!card || Utils.qs("#sessionTaskSelect")) return;
    var tasks = taskOptions();
    if (!tasks.length) return;
    card.insertAdjacentHTML("beforeend", [
      '<label class="field session-task-switcher">',
      "<span>Trocar tarefa sem sair da sessão</span>",
      '<select id="sessionTaskSelect">',
      '<option value="">Sessão livre</option>',
      tasks.map(function (task) {
        return '<option value="' + Utils.escapeHtml(task.id) + '">' + Utils.escapeHtml(task.titulo) + "</option>";
      }).join(""),
      "</select>",
      "</label>"
    ].join(""));
    Utils.qs("#sessionTaskSelect").value = draft.taskId || "";
    Utils.qs("#sessionTaskSelect").addEventListener("change", function (event) {
      draft.taskId = event.currentTarget.value || null;
      Storage.write("focusDraft", draft);
      updateTaskCopy();
      Utils.notify("Tarefa de foco atualizada.", { kind: "success" });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    draft = Storage.read("focusDraft", null) || {
      taskId: null,
      minutos: Number(Utils.getQueryParam("min") || 25),
      tipo: "Foco leve",
      iniciadoEm: new Date().toISOString()
    };
    totalSeconds = Math.max(1, Number(draft.minutos) || 25) * 60;
    Utils.setText("#sessionMode", draft.tipo || "Foco leve");
    setStatus("Preparando foco", "ready");
    updateTaskCopy();
    renderTaskSwitcher();
    render();
    Utils.qs("#sessionStart").addEventListener("click", start);
    Utils.qs("#sessionPause").addEventListener("click", pause);
    Utils.qs("#sessionFinish").addEventListener("click", function () { finish(true); });
    Utils.qs("#sessionSkip").addEventListener("click", function () { finish(false); });
  });
})();
