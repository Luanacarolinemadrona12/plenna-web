(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var Data = window.PlennaData;
  var currentStep = 1;
  var totalSteps = 4;
  var editingTodayCheckin = null;

  var moodLabel = {
    sensivel: "Muito sensível",
    ruim: "Cansada",
    neutro: "Neutro",
    bom: "Bem",
    otimo: "Ótima"
  };
  var moodEmoji = {
    sensivel: "😢",
    ruim: "😐",
    neutro: "😶",
    bom: "🙂",
    otimo: "😁"
  };

  function choiceInput(type, name, option, checked) {
    var emoji = name === "humor" ? '<b class="choice-emoji mood-dot ' + Utils.escapeHtml(option.value) + '" aria-hidden="true">' + Utils.escapeHtml(moodEmoji[option.value] || "") + "</b>" : "";
    var label = name === "humor" ? moodLabel[option.value] || option.label : option.label;
    var hint = name === "humor" || name === "necessidade" ? "" : option.hint || "";
    return [
      "<label>",
      '<input class="sr-only" type="' + type + '" name="' + name + '" value="' + Utils.escapeHtml(option.value) + '"' + (checked ? " checked" : "") + (type === "radio" ? " required" : "") + ">",
      '<span class="choice-card">' + emoji + '<strong>' + Utils.escapeHtml(label) + "</strong>" + (hint ? '<span>' + Utils.escapeHtml(hint) + "</span>" : "") + "</span>",
      "</label>"
    ].join("");
  }

  function factorInput(label) {
    var id = "fator-" + label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
    var checked = label === "Trabalho" || label === "Exercício";
    return [
      "<label>",
      '<input class="sr-only" type="checkbox" name="fatores" id="' + id + '" value="' + Utils.escapeHtml(label) + '"' + (checked ? " checked" : "") + ">",
      '<span class="choice-card"><strong>' + Utils.escapeHtml(label) + "</strong></span>",
      "</label>"
    ].join("");
  }

  function renderOptions() {
    var moodOrder = ["sensivel", "ruim", "neutro", "bom", "otimo"];
    var moodOptions = moodOrder.map(function (value) {
      return Data.humores.find(function (item) { return item.value === value; });
    }).filter(Boolean);

    Utils.qs("#humorChoices").innerHTML = moodOptions.map(function (item) {
      return choiceInput("radio", "humor", item, false);
    }).join("");

    Utils.qs("#factorChoices").innerHTML = Data.fatores.map(factorInput).join("");

    Utils.qs("#needChoices").innerHTML = Data.necessidades.map(function (item) {
      return choiceInput("radio", "necessidade", item, false);
    }).join("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    updateEnergy();
    if (!validateStep(1) || !validateStep(totalSteps)) return;
    var formData = new FormData(event.currentTarget);
    var checkin = {
      id: editingTodayCheckin ? editingTodayCheckin.id : Utils.uid("checkin"),
      data: new Date().toISOString(),
      humor: formData.get("humor"),
      energia: formData.get("energia"),
      energiaValor: Number(Utils.qs("#energyRange").value),
      fatores: formData.getAll("fatores"),
      necessidade: formData.get("necessidade")
    };

    if (editingTodayCheckin) Storage.replace(Storage.KEYS.checkins, checkin);
    else Storage.add(Storage.KEYS.checkins, checkin);
    Utils.notify(editingTodayCheckin ? "Check-in atualizado. Vamos adaptar seu dia com mais cuidado." : "Check-in salvo. Vamos adaptar seu dia com mais cuidado.", { kind: "success" });
    window.setTimeout(function () {
      window.location.href = "checkin-success.html";
    }, 350);
  }

  async function skipCheckin() {
    var confirmed = await Utils.confirmAction({
      title: "Pular check-in por hoje?",
      body: "Tudo bem pular agora. A Home e o Foco seguem disponíveis, só ficam menos adaptados ao seu momento.",
      cancelLabel: "Voltar",
      confirmLabel: "Pular por hoje",
      danger: false
    });
    if (!confirmed) return;
    Storage.write("checkinSkippedAt", new Date().toISOString());
    Utils.notify("Check-in pulado por hoje.", { kind: "warning" });
    window.setTimeout(function () {
      window.location.href = "home.html";
    }, 280);
  }

  function stepLabel(step) {
    if (step === 1) return "1 de 4 · como você chega";
    if (step === 2) return "2 de 4 · energia";
    if (step === 3) return "3 de 4 · contexto";
    return "4 de 4 · apoio";
  }

  function updateProgress(step) {
    step = step || currentStep;
    Utils.setText("#checkinProgressText", stepLabel(step));
    Utils.qsa(".ux-stepper span").forEach(function (node, index) {
      node.classList.toggle("active", index < step);
    });
  }

  function setStep(step) {
    currentStep = Math.max(1, Math.min(totalSteps, step));
    var ready = requiredChoicesReady();
    Utils.qsa("[data-checkin-step]").forEach(function (section) {
      var sectionStep = Number(section.dataset.checkinStep);
      section.hidden = sectionStep !== currentStep;
      section.classList.toggle("is-active", sectionStep === currentStep);
      section.classList.toggle("is-complete", sectionStep < currentStep);
      if (sectionStep === currentStep) section.setAttribute("aria-current", "step");
      else section.removeAttribute("aria-current");
    });
    Utils.qs("#checkinBack").hidden = currentStep === 1;
    Utils.qs("#checkinNext").hidden = currentStep === totalSteps;
    Utils.qs("#checkinSubmit").hidden = currentStep !== totalSteps;
    Utils.qs("#checkinSubmit").disabled = !ready;
    var summary = Utils.qs("#checkinSummary");
    if (summary) summary.hidden = currentStep !== totalSteps;
    updateProgress(currentStep);
    updateGentleFeedback();
    updateCheckinSummary();
  }

  function validateStep(step) {
    if (step === 1 && !Utils.qs("input[name='humor']:checked")) {
      Utils.showError("Escolha como você chega agora para continuar.");
      return false;
    }
    if (step === 4 && !Utils.qs("input[name='necessidade']:checked")) {
      Utils.showError("Escolha um apoio para salvar o check-in.");
      return false;
    }
    return true;
  }

  function requiredChoicesReady() {
    return Boolean(Utils.qs("input[name='humor']:checked") && Utils.qs("input[name='necessidade']:checked"));
  }

  function syncStepFromSelection(event) {
    updateCheckinSummary();
    var target = event.target;
    if (!target) {
      setStep(currentStep);
      return;
    }
    if (target.id === "energyRange") {
      if (currentStep < 2) setStep(2);
      else setStep(currentStep);
      return;
    }
    if (!target.name) {
      setStep(currentStep);
      return;
    }
    if (target.name === "necessidade") {
      setStep(totalSteps);
      return;
    }
    if (target.name === "fatores" && currentStep < 3) {
      setStep(3);
      return;
    }
    if ((target.name === "humor" || target.id === "energyRange") && currentStep < 2) {
      setStep(2);
      return;
    }
    setStep(currentStep);
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    setStep(currentStep + 1);
  }

  function previousStep() {
    setStep(currentStep - 1);
  }

  function updateEnergy() {
    var value = Number(Utils.qs("#energyRange").value);
    var energia = value <= 4 ? "baixa" : value <= 7 ? "media" : "alta";
    var percent = ((value - 1) / 9) * 100;
    Utils.qs("#energyRange").style.setProperty("--energy-fill", percent + "%");
    Utils.qs("#energyValue").value = energia;
    Utils.setText("#energyLabel", value + " / 10 · energia " + (value <= 4 ? "baixa" : value <= 7 ? "média" : "alta"));
    updateCheckinSummary();
  }

  function ensureCheckinSummary() {
    var form = Utils.qs("#checkinForm");
    if (!form || Utils.qs("#checkinSummary")) return;
    var actions = Utils.qs(".checkin-actions", form);
    var html = [
      '<section class="card recognition-card checkin-summary-card" id="checkinSummary" aria-live="polite" hidden>',
      '<span class="recognition-label">Resumo antes de salvar</span>',
      '<div class="recognition-grid">',
      '<span><small>Como você chega</small><strong id="checkinSummaryMood">Bem</strong></span>',
      '<span><small>Energia</small><strong id="checkinSummaryEnergy">7/10</strong></span>',
      '<span><small>Apoio de hoje</small><strong id="checkinSummaryNeed">Organização</strong></span>',
      "</div>",
      '<p>A Home, o Foco e o Planejamento usam isso para aliviar o próximo passo.</p>',
      "</section>"
    ].join("");
    if (actions) actions.insertAdjacentHTML("beforebegin", html);
  }

  function ensureStepFeedback() {
    var actions = Utils.qs(".checkin-actions");
    if (!actions || Utils.qs("#checkinGentleFeedback")) return;
    actions.insertAdjacentHTML("beforebegin", '<p class="checkin-gentle-feedback" id="checkinGentleFeedback" aria-live="polite">Vamos uma pergunta por vez.</p>');
  }

  function updateGentleFeedback() {
    var node = Utils.qs("#checkinGentleFeedback");
    if (!node) return;
    var messages = {
      1: "Vamos uma pergunta por vez.",
      2: "Entendi. Agora vamos olhar para a sua energia.",
      3: "Tudo bem ir no seu ritmo. Marque só o que fez diferença.",
      4: "Último passo: escolha o apoio que mais combina com hoje."
    };
    node.textContent = messages[currentStep] || "Vamos adaptar seu dia com calma.";
  }

  function selectedChoiceText(input) {
    if (!input) return "";
    var card = input.closest("label").querySelector(".choice-card strong");
    return card ? card.textContent.trim() : input.value;
  }

  function updateCheckinSummary() {
    if (!Utils.qs("#checkinSummary")) return;
    var mood = Utils.qs("input[name='humor']:checked");
    var energy = Number(Utils.qs("#energyRange").value || 7);
    var need = Utils.qs("input[name='necessidade']:checked");
    Utils.setText("#checkinSummaryMood", mood ? moodLabel[mood.value] || mood.value : "Escolha como você chega");
    Utils.setText("#checkinSummaryEnergy", energy + "/10");
    Utils.setText("#checkinSummaryNeed", need ? selectedChoiceText(need) : "Escolha um apoio");
  }

  function todayCheckin() {
    var today = Utils.todayISO();
    return Storage.all(Storage.KEYS.checkins).find(function (item) {
      return String(item.data || "").slice(0, 10) === today;
    }) || null;
  }

  function restoreTodayCheckin() {
    editingTodayCheckin = todayCheckin();
    if (!editingTodayCheckin) return;
    if (editingTodayCheckin.humor && Utils.qs("input[name='humor'][value='" + editingTodayCheckin.humor + "']")) {
      Utils.qs("input[name='humor'][value='" + editingTodayCheckin.humor + "']").checked = true;
    }
    Utils.qs("#energyRange").value = editingTodayCheckin.energiaValor || 7;
    Utils.qs("#energyValue").value = editingTodayCheckin.energia || "media";
    Utils.qsa("input[name='fatores']").forEach(function (input) {
      input.checked = (editingTodayCheckin.fatores || []).indexOf(input.value) >= 0;
    });
    if (editingTodayCheckin.necessidade && Utils.qs("input[name='necessidade'][value='" + editingTodayCheckin.necessidade + "']")) {
      Utils.qs("input[name='necessidade'][value='" + editingTodayCheckin.necessidade + "']").checked = true;
    }
    Utils.setText("#checkinSubmit", "Salvar check-in");
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderOptions();
    ensureCheckinSummary();
    ensureStepFeedback();
    restoreTodayCheckin();
    updateEnergy();
    Utils.qs("#energyRange").addEventListener("input", function (event) {
      updateEnergy();
      syncStepFromSelection(event);
    });
    Utils.qs("#checkinForm").addEventListener("change", syncStepFromSelection);
    Utils.qs("#checkinForm").addEventListener("submit", handleSubmit);
    Utils.qs("#checkinNext").addEventListener("click", nextStep);
    Utils.qs("#checkinBack").addEventListener("click", previousStep);
    Utils.qs("#skipCheckin").addEventListener("click", skipCheckin);
    setStep(1);
  });
})();
