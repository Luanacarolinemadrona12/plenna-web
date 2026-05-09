(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;
  var Data = window.PlennaData;
  var currentStep = 1;
  var totalSteps = 3;

  var moodLabel = {
    sensivel: "Péssimo",
    ruim: "Ruim",
    neutro: "Neutro",
    bom: "Bem",
    otimo: "Ótimo"
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
    var hint = name === "necessidade" ? "" : option.hint || "";
    return [
      "<label>",
      '<input class="sr-only" type="' + type + '" name="' + name + '" value="' + Utils.escapeHtml(option.value) + '"' + (checked ? " checked" : "") + (type === "radio" ? " required" : "") + ">",
      '<span class="choice-card">' + emoji + Utils.escapeHtml(label) + (name === "humor" || !hint ? "" : '<span>' + Utils.escapeHtml(hint) + "</span>") + "</span>",
      "</label>"
    ].join("");
  }

  function factorInput(label) {
    var id = "fator-" + label.toLowerCase();
    var checked = label === "Trabalho" || label === "Exercício";
    return [
      "<label>",
      '<input class="sr-only" type="checkbox" name="fatores" id="' + id + '" value="' + Utils.escapeHtml(label) + '"' + (checked ? " checked" : "") + ">",
      '<span class="choice-card">' + Utils.escapeHtml(label) + "</span>",
      "</label>"
    ].join("");
  }

  function renderOptions() {
    var moodOrder = ["sensivel", "ruim", "neutro", "bom", "otimo"];
    var moodOptions = moodOrder.map(function (value) {
      return Data.humores.find(function (item) { return item.value === value; });
    }).filter(Boolean);

    Utils.qs("#humorChoices").innerHTML = moodOptions.map(function (item) {
      return choiceInput("radio", "humor", item, item.value === "bom");
    }).join("");

    Utils.qs("#factorChoices").innerHTML = Data.fatores.map(factorInput).join("");

    Utils.qs("#needChoices").innerHTML = Data.necessidades.map(function (item) {
      return choiceInput("radio", "necessidade", item, item.value === "organizar");
    }).join("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validateStep(3)) return;
    var formData = new FormData(event.currentTarget);
    var checkin = {
      id: Utils.uid("checkin"),
      data: new Date().toISOString(),
      humor: formData.get("humor"),
      energia: formData.get("energia"),
      energiaValor: Number(Utils.qs("#energyRange").value),
      fatores: formData.getAll("fatores"),
      necessidade: formData.get("necessidade")
    };

    Storage.add(Storage.KEYS.checkins, checkin);
    Utils.notify("Check-in salvo. Seu plano foi atualizado.", { kind: "success" });
    window.setTimeout(function () {
      window.location.href = "checkin-success.html";
    }, 350);
  }

  function skipCheckin() {
    Storage.write("checkinSkippedAt", new Date().toISOString());
    Utils.notify("Check-in pulado por hoje.", { kind: "warning" });
    window.setTimeout(function () {
      window.location.href = "home.html";
    }, 280);
  }

  function stepLabel(step) {
    if (step === 1) return "1 de 3 · humor";
    if (step === 2) return "2 de 3 · contexto";
    return "3 de 3 · necessidade";
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
    Utils.qsa("[data-checkin-step]").forEach(function (section) {
      var sectionStep = Number(section.dataset.checkinStep);
      section.hidden = false;
      section.classList.toggle("is-active", sectionStep === currentStep);
      section.classList.toggle("is-complete", sectionStep < currentStep);
    });
    Utils.qs("#checkinBack").hidden = currentStep === 1;
    Utils.qs("#checkinNext").hidden = currentStep === totalSteps;
    Utils.qs("#checkinSubmit").hidden = false;
    updateProgress(currentStep);
  }

  function validateStep(step) {
    if (step === 1 && !Utils.qs("input[name='humor']:checked")) {
      Utils.showError("Escolha como você está se sentindo para continuar.");
      return false;
    }
    if (step === 3 && !Utils.qs("input[name='necessidade']:checked")) {
      Utils.showError("Escolha uma necessidade para salvar o check-in.");
      return false;
    }
    return true;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    setStep(currentStep + 1);
  }

  function previousStep() {
    setStep(currentStep - 1);
  }

  function inferStepFromForm() {
    var need = Utils.qs("input[name='necessidade']:checked");
    var energyChanged = Number(Utils.qs("#energyRange").value) !== 7;
    var hasFactors = Utils.qsa("input[name='fatores']:checked").length > 0;
    if (need) setStep(3);
    else if (energyChanged || hasFactors) setStep(2);
    else setStep(1);
  }

  function updateEnergy() {
    var value = Number(Utils.qs("#energyRange").value);
    var energia = value <= 3 ? "baixa" : value <= 7 ? "media" : "alta";
    var percent = ((value - 1) / 9) * 100;
    Utils.qs("#energyRange").style.setProperty("--energy-fill", percent + "%");
    Utils.qs("#energyValue").value = energia;
    Utils.setText("#energyLabel", "⚡ " + value + " / 10 · energia " + (value <= 3 ? "baixa" : value <= 7 ? "média-alta" : "alta"));
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderOptions();
    updateEnergy();
    Utils.qs("#energyRange").addEventListener("input", updateEnergy);
    Utils.qs("#energyRange").addEventListener("input", inferStepFromForm);
    Utils.qs("#checkinForm").addEventListener("change", inferStepFromForm);
    Utils.qs("#checkinForm").addEventListener("submit", handleSubmit);
    Utils.qs("#checkinNext").addEventListener("click", nextStep);
    Utils.qs("#checkinBack").addEventListener("click", previousStep);
    Utils.qs("#skipCheckin").addEventListener("click", skipCheckin);
    setStep(1);
  });
})();
