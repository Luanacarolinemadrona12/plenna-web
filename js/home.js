(function () {
  "use strict";

  var Utils = window.PlennaUtils;
  var Mood = window.PlennaMood;

  function setStateClass(page, data) {
    page.classList.remove("state-high", "state-neutral", "state-low", "state-protect");
    page.classList.add(data.className);
    page.dataset.moodState = data.stateKey;
    document.body.dataset.moodState = data.stateKey;
  }

  function renderHeader(data, checkin) {
    var settings = window.PlennaStorage.read(window.PlennaStorage.KEYS.settings, { nome: "Luana" });
    var firstName = String(settings.nome || "Luana").trim().split(/\s+/)[0] || "Luana";
    Utils.setText("#homeGreeting", "Olá, " + firstName);
    Utils.setText("#homeDate", data.date);
    Utils.qs("#checkinChips").innerHTML = [
      '<span class="chip solid">' + Utils.escapeHtml(data.moodChip) + "</span>",
      '<span class="chip">' + Utils.escapeHtml(data.energyChip) + "</span>"
    ].join("");
  }

  function renderRecommendation(data) {
    Utils.qs("#recommendationCard").innerHTML = [
      '<span class="eyebrow">' + Utils.escapeHtml(data.actionTag) + "</span>",
      "<h2>" + Utils.escapeHtml(data.actionTitle) + "</h2>",
      '<div class="row">',
      '<a class="button primary" href="' + Utils.escapeHtml(data.primaryHref) + '">' + Utils.escapeHtml(data.primaryLabel) + "</a>",
      '<a class="button secondary" href="' + Utils.escapeHtml(data.secondaryHref) + '">' + Utils.escapeHtml(data.secondaryLabel) + "</a>",
      "</div>"
    ].join("");
  }

  function renderPriorities(data) {
    Utils.qs("#priorityList").innerHTML = data.priorities.map(function (item, index) {
      return [
        '<article class="priority-row home-priority-row">',
        '<span class="home-check-dot" aria-hidden="true"></span>',
        '<p><strong>' + (index + 1) + ".</strong> " + Utils.escapeHtml(item[0]) + "</p>",
        '<a class="chip home-priority-chip" href="tasks.html">' + Utils.escapeHtml(item[1]) + "</a>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderAppointment(data) {
    Utils.qs("#appointmentCard").innerHTML = [
      "<h2>Próximo compromisso</h2>",
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
    return [
      '<div class="home-metric-card ' + Utils.escapeHtml(kind) + '">',
      '<span class="metric-dot" aria-hidden="true"></span>',
      "<div>",
      "<b>" + Utils.escapeHtml(label) + "</b>",
      "<strong>" + Utils.escapeHtml(value) + "</strong>",
      "</div>",
      "</div>"
    ].join("");
  }

  function renderExtras(data) {
    var shortcuts = Utils.qs("#homeShortcuts");
    var note = Utils.qs("#homeFinalNote");
    if (shortcuts) shortcuts.hidden = false;
    if (!note) return;
    if (data.banner) {
      note.hidden = false;
      note.textContent = data.banner;
    } else {
      note.hidden = true;
      note.textContent = "";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var checkin = Utils.activeCheckin();
    var data = Mood.home(checkin);
    setStateClass(Utils.qs("#homePage"), data);
    renderHeader(data, checkin);
    renderRecommendation(data);
    renderPriorities(data);
    renderAppointment(data);
    renderMessage(data);
    renderMetrics(data);
    renderExtras(data);
  });
})();
