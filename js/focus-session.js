(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var timerId = null;
  var elapsed = 0;
  var draft = null;
  var draftRestored = false;
  var totalSeconds = 25 * 60;

  function render() {
    var remaining = Math.max(totalSeconds - elapsed, 0);
    var minutes = Math.floor(remaining / 60);
    var seconds = remaining % 60;
    var label = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    var timer = Utils.qs("#sessionTimer");
    var timerText = Utils.qs("#sessionTimerText");
    if (timerText) Utils.setText("#sessionTimerText", label);
    else Utils.setText("#sessionTimer", label);
    if (timer) {
      timer.dataset.timerText = label;
      timer.setAttribute("aria-label", "Tempo restante: " + label);
    }
    if (remaining <= 0) finish(true);
  }

  function elapsedFromDraft(draft) {
    if (!draft || !draft.iniciadoEm) return 0;
    var started = new Date(draft.iniciadoEm).getTime();
    if (Number.isNaN(started)) return 0;
    return Math.max(0, Math.floor((Date.now() - started) / 1000));
  }

  function setStatus(message, state) {
    Utils.setText("#sessionStatus", message);
    var root = Utils.qs(".focus-timer-cluster");
    if (root) root.dataset.focusState = state || "";
  }

  function currentTask() {
    return draft && draft.taskId ? Storage.find(Storage.KEYS.tasks, draft.taskId) : null;
  }

  function ensureSessionContext() {
    var card = Utils.qs(".focus-task-card");
    if (!card || Utils.qs("#sessionContextSummary")) return;
    card.insertAdjacentHTML("afterbegin", [
      '<section class="recognition-card focus-session-context" id="sessionContextSummary" aria-live="polite">',
      '<span class="recognition-label">Contexto da sessão</span>',
      '<div class="recognition-stack">',
      '<p><small>Tarefa escolhida</small><strong id="sessionContextTask">Foco sem tarefa associada</strong></p>',
      '<p><small>Duração</small><strong id="sessionContextDuration">25 min</strong></p>',
      '<p><small>Tipo</small><strong id="sessionContextType">Foco leve</strong></p>',
      "</div>",
      '<div class="session-switcher-slot" id="sessionSwitcherSlot"></div>',
      "</section>"
    ].join(""));
  }

  function updateSessionContext(task) {
    if (!Utils.qs("#sessionContextSummary")) return;
    Utils.setText("#sessionContextTask", task ? task.titulo : "Foco sem tarefa associada");
    Utils.setText("#sessionContextDuration", (draft.minutos || 25) + " min");
    Utils.setText("#sessionContextType", draft.tipo || "Foco leve");
  }

  function start(options) {
    options = options || {};
    if (timerId) return;
    timerId = window.setInterval(function () {
      elapsed += 1;
      render();
    }, 1000);
    Utils.qs("#sessionStart").hidden = true;
    Utils.qs("#sessionPause").hidden = false;
    setStatus("Foco em andamento", "running");
    if (options.notify !== false) {
      Utils.notify("Foco em andamento.", { kind: "success" });
    }
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
    var recordedSeconds = elapsed || (completed ? totalSeconds : 0);
    Storage.add(Storage.KEYS.focusSessions, {
      id: Utils.uid("focus"),
      taskId: draft.taskId || null,
      duracao: recordedSeconds,
      duracaoMinutos: Math.max(recordedSeconds > 0 ? 1 : 0, Math.round(recordedSeconds / 60)),
      concluida: Boolean(completed),
      data: new Date().toISOString(),
      tipo: draft.tipo || "Foco"
    });
    setStatus(completed ? "Sessão concluída" : "Sessão encerrada", completed ? "done" : "skipped");
    Utils.notify(completed ? "Sessão de foco salva em Seu progresso." : "Sessão encerrada sem culpa. Tempo parcial registrado.", { kind: completed ? "success" : "warning" });
    window.setTimeout(function () { window.location.href = "focus-break.html"; }, 450);
  }

  async function complete() {
    if (elapsed <= 0) {
      Utils.notify("Inicie o timer antes de concluir a sessão.", { kind: "warning" });
      setStatus("Preparando foco", "ready");
      return;
    }
    if (elapsed < totalSeconds) {
      if (timerId) pause();
      var confirmed = await Utils.confirmAction({
        title: "Finalizar agora?",
        body: "A sessão será salva com o tempo já realizado.",
        cancelLabel: "Voltar ao foco",
        confirmLabel: "Finalizar",
        danger: false
      });
      if (!confirmed) {
        setStatus("Pausado", "paused");
        return;
      }
      finish(false);
      return;
    }
    finish(true);
  }

  async function abandon() {
    if (timerId) pause();
    var confirmed = await Utils.confirmAction({
      title: "Encerrar esta sessão?",
      body: "Você pode voltar ao foco ou encerrar sem marcar isso como erro.",
      cancelLabel: "Voltar ao foco",
      confirmLabel: "Encerrar sessão",
      danger: false
    });
    if (!confirmed) {
      setStatus("Pausado", "paused");
      return;
    }
    finish(false);
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
    updateSessionContext(task);
  }

  function renderTaskSwitcher() {
    var card = Utils.qs(".focus-task-card");
    if (!card || Utils.qs("#sessionTaskSelect")) return;
    var tasks = taskOptions();
    if (!tasks.length) return;
    var slot = Utils.qs("#sessionSwitcherSlot") || card;
    slot.insertAdjacentHTML("beforeend", [
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
    var savedDraft = Storage.read("focusDraft", null);
    draftRestored = savedDraft !== null;
    draft = savedDraft || {
      taskId: null,
      minutos: Number(Utils.getQueryParam("min") || 25),
      tipo: "Foco leve",
      iniciadoEm: new Date().toISOString()
    };
    totalSeconds = Math.max(1, Number(draft.minutos) || 25) * 60;
    elapsed = draftRestored ? Math.min(elapsedFromDraft(draft), totalSeconds) : 0;
    Utils.setText("#sessionMode", draft.tipo || "Foco leve");
    if (draftRestored && elapsed > 0 && elapsed < totalSeconds) {
      setStatus("Foco em andamento", "running");
    } else {
      setStatus("Preparando foco", "ready");
    }
    ensureSessionContext();
    updateTaskCopy();
    renderTaskSwitcher();
    render();
    Utils.qs("#sessionStart").addEventListener("click", start);
    Utils.qs("#sessionPause").addEventListener("click", pause);
    Utils.qs("#sessionFinish").addEventListener("click", complete);
    Utils.qs("#sessionSkip").addEventListener("click", abandon);
    if (draftRestored && elapsed > 0 && elapsed < totalSeconds) {
      Utils.qs("#sessionStart").hidden = true;
      Utils.qs("#sessionPause").hidden = false;
      start({ notify: false });
    }
  });
})();
