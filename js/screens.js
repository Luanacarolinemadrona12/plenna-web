(function () {
  "use strict";

  var Storage = window.PlennaStorage;
  var Utils = window.PlennaUtils;

  function h(text) {
    return Utils.escapeHtml(text);
  }

  function todayLong() {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  function tasks() {
    return Storage.all(Storage.KEYS.tasks);
  }

  function habits() {
    return Storage.all(Storage.KEYS.habits);
  }

  function entries() {
    return Storage.all(Storage.KEYS.entries);
  }

  function chip(text, extra) {
    return '<span class="chip ' + (extra || "") + '">' + h(text) + "</span>";
  }

  function icon(name, extra) {
    return window.PlennaIcons ? window.PlennaIcons.svg(name, extra || "") : "";
  }

  function topbar(title, subtitle) {
    return '<header class="proto-topbar"><h1>' + h(title) + '</h1><p>' + h(subtitle) + "</p></header>";
  }

  function emptyState(title, body, action, href) {
    return [
      '<section class="empty-state proto-empty">',
      "<h3>" + h(title) + "</h3>",
      "<p>" + h(body) + "</p>",
      action ? '<a class="button small primary" href="' + (href || "#") + '">' + h(action) + "</a>" : "",
      "</section>"
    ].join("");
  }

  function metric(value, label, tone) {
    return '<div class="proto-metric ' + (tone || "") + '"><strong>' + h(value) + '</strong><small>' + h(label) + "</small></div>";
  }

  function scheduleBlock(hour, title, detail, badge) {
    return [
      '<article class="planning-block">',
      '<div class="item-top">',
      '<span class="planning-hour">' + h(hour) + "</span>",
      "<div><div class='task-title'>" + h(title) + "</div><small>" + h(detail) + "</small></div>",
      chip(badge || "sugerido"),
      "</div>",
      "</article>"
    ].join("");
  }

  function checkinState() {
    var checkin = Utils.activeCheckin();
    if (checkin && (checkin.protetivo || Utils.hasLowMoodStreak())) {
      return { title: "Humor baixo por vários dias", tag: "Plano protetivo", energy: "Energia oscilando", plan: "Comece por diário, pausa guiada e uma tarefa pequena." };
    }
    if (checkin && (checkin.humor === "ruim" || checkin.humor === "sensivel") && checkin.energia === "baixa") {
      return { title: "Humor ruim + energia baixa", tag: "Reduzir carga", energy: "Energia 3/10", plan: "Faça o essencial e proteja energia." };
    }
    if (checkin && (checkin.humor === "bom" || checkin.humor === "otimo") && checkin.energia === "alta") {
      return { title: "Humor bom + energia alta", tag: "Avançar", energy: "Energia 8/10", plan: "Use o pico de energia para uma entrega importante." };
    }
    return { title: "Humor neutro + energia média", tag: "Organização equilibrada", energy: "Energia 5/10", plan: "Organize três prioridades e mantenha pausas visíveis." };
  }

  function checkinSuccess() {
    var state = checkinState();
    return [
      topbar("Check-in salvo", "Com base em como você está hoje, o Plenna atualizou suas próximas ações."),
      '<section class="success-card">',
      '<span class="success-icon">' + icon("check", "success-icon-svg") + "</span>",
      "<h2>Contexto entendido</h2>",
      "<p>" + h(state.plan) + "</p>",
      '<div class="chip-row">' + chip(state.tag) + chip(state.energy, "neutral") + "</div>",
      '<a class="button primary full" href="home.html">Ver meu dia</a>',
      '<a class="button secondary full" href="planning.html">Organizar meu dia</a>',
      "</section>"
    ].join("");
  }

  function planningAdjust() {
    var adjustment = Storage.read("planningAdjustments", {});
    var title = adjustment.cargaReduzida || adjustment.pausaProtegida ? "Seu dia ficou mais leve e realista." : "Escolha ajustes antes de salvar.";
    var body = adjustment.cargaReduzida ? "A carga foi reduzida, uma tarefa pesada foi adiada e a pausa virou compromisso protegido." : adjustment.pausaProtegida ? "A pausa foi protegida para recuperar energia depois do compromisso." : "Use os controles rápidos para reduzir carga, trocar horário ou proteger uma pausa.";
    return [
      topbar("Ajustar planejamento", "Edite carga, horário e pausas sem perder o contexto do check-in."),
      '<div class="chip-row">' + chip("pausa protegida") + chip("carga reduzida") + "</div>",
      '<section class="planning-main-card">',
      '<span class="eyebrow">AJUSTADO POR VOCÊ</span>',
      "<h2>" + h(title) + "</h2>",
      "<p>" + h(body) + "</p>",
      '<div class="planning-metrics"><span><strong>Antes</strong><small>Foco 09h + tarefa pesada hoje</small></span><span><strong>Depois</strong><small>Foco 10h + pausa protegida</small></span></div>',
      '<div class="row"><button class="button primary" type="button" data-save-adjust>Salvar ajustes</button><a class="button secondary" href="planning.html">Cancelar</a></div>',
      "</section>",
      '<section class="planning-block-card"><h2>Cronograma ajustado</h2><p>Os selos indicam o que foi movido, protegido ou reduzido.</p>',
      scheduleBlock("09:00", "Rotina leve de início", "Responder 2 pendências pequenas antes do foco.", "reduzido"),
      scheduleBlock("10:00", "Foco leve · Apresentação Q2", "Movido para depois da rotina.", "movido"),
      scheduleBlock("14:00", "Reunião com cliente ABC", "Compromisso mantido na agenda.", "fixo"),
      scheduleBlock("15:30", "Pausa protegida", "Pausa travada antes do fim do dia.", "travado"),
      scheduleBlock("Amanhã", "Revisar contrato completo", "Tarefa pesada adiada para evitar sobrecarga.", "adiado"),
      "</section>",
      '<section class="card planning-quick-controls"><h2>Controles do ajuste</h2><div class="grid-2"><button class="button secondary" type="button" data-adjust-kind="horario">Trocar horário</button><button class="button secondary" type="button" data-adjust-kind="carga">Reduzir carga</button><a class="button secondary" href="calendar-week.html">Ver semana</a><a class="button secondary" href="tasks.html">Abrir tarefa</a></div></section>'
    ].join("");
  }

  function calendarWeek() {
    var list = tasks().filter(function (task) { return !task.concluida; });
    var days = ["S", "T", "Q", "Q", "S", "S", "D"];
    return [
      topbar("Agenda", "Semana com tarefas, agenda e carga diária."),
      '<section class="segmented"><button class="active" type="button">Semana</button><a class="button secondary" href="calendar-month.html">Mês</a></section>',
      '<section class="calendar-strip">' + days.map(function (day, index) { return '<span class="' + (index === 2 ? "active" : "") + '"><b>' + day + "</b><small>" + (12 + index) + "</small></span>"; }).join("") + "</section>",
      list.length ? '<section class="planning-block-card"><h2>Blocos da semana</h2>' + list.slice(0, 4).map(function (task, i) {
        return scheduleBlock(i === 0 ? "Seg · 09:00" : i === 1 ? "Ter · 11:00" : i === 2 ? "Qua · 14:00" : "Qui · 16:00", task.titulo, task.categoria || "Tarefa sem categoria", i === 0 ? "hoje" : "agenda");
      }).join("") + "</section>" : emptyState("Calendário sem tarefas", "Planeje sua semana ou distribua tarefas para preencher seus blocos.", "Criar tarefa", "task-new.html")
    ].join("");
  }

  function calendarMonth() {
    var allTasks = tasks();
    var selectedDay = Storage.read("selectedCalendarDay", new Date().getDate());
    var daysWithTasks = allTasks.reduce(function (acc, task) {
      if (task.prazo) acc[new Date(task.prazo + "T12:00:00").getDate()] = true;
      return acc;
    }, {});
    var selectedTasks = allTasks.filter(function (task) {
      return task.prazo && new Date(task.prazo + "T12:00:00").getDate() === Number(selectedDay);
    });
    return [
      topbar("Agenda", "Veja carga, espaços de cuidado e dias mais cheios."),
      '<section class="segmented"><a class="button secondary" href="calendar-week.html">Semana</a><button class="active" type="button">Mês</button></section>',
      '<section class="month-grid">' + Array.from({ length: 30 }, function (_, i) {
        var day = i + 1;
        var cls = daysWithTasks[day] ? "busy" : day === Number(selectedDay) ? "active" : i === 18 || i === 26 ? "soft" : "";
        return '<button type="button" class="' + cls + '" data-select-day="' + day + '">' + day + "</button>";
      }).join("") + "</section>",
      selectedTasks.length ? '<section class="content-list">' + selectedTasks.map(function (task) { return scheduleBlock("Dia " + selectedDay, task.titulo, task.categoria || "Tarefa sem categoria", "agenda"); }).join("") + "</section>" : '<section class="card"><h2>Mês com baixa carga</h2><p>Ótimo espaço para autocuidado e revisão.</p><div class="chip-row">' + chip("Ver agenda") + chip("Planejar pausas") + "</div></section>"
    ].join("");
  }

  function habitForm(mode) {
    var id = Utils.getQueryParam("id");
    var existing = id ? Storage.find(Storage.KEYS.habits, id) : null;
    if (mode === "edit" && !existing) existing = habits()[0] || null;
    var category = existing ? existing.categoria : "Mente";
    var frequency = existing ? existing.frequencia : "Diário";
    var categoryOptions = (window.PlennaData ? window.PlennaData.categoriasHabito : ["Corpo", "Mente"]).map(function (item) {
      return '<option' + (item === category ? " selected" : "") + ">" + h(item) + "</option>";
    }).join("");
    var frequencyOptions = (window.PlennaData ? window.PlennaData.frequencias : ["Diário", "Semanal"]).map(function (item) {
      return '<option' + (item === frequency ? " selected" : "") + ">" + h(item) + "</option>";
    }).join("");
    return [
      topbar(mode === "edit" ? "Editar hábito" : "Novo hábito", "Defina um mínimo possível e flexível."),
      '<form class="card form proto-form" data-local-form="habit" data-habit-id="' + h(existing ? existing.id : "") + '">',
      '<label class="field"><span>Nome</span><input name="nome" required value="' + h(existing ? existing.nome : "") + '" placeholder="Ex.: Meditação"></label>',
      '<div class="grid-2"><label class="field"><span>Categoria</span><select name="categoria">' + categoryOptions + '</select></label><label class="field"><span>Frequência</span><select name="frequencia">' + frequencyOptions + '</select></label></div>',
      '<label class="field"><span>Meta mínima</span><input name="metaMinima" value="' + h(existing ? existing.metaMinima : "5 min") + '"></label>',
      '<button class="button primary full" type="submit">' + (mode === "edit" ? "Salvar hábito" : "Criar hábito") + "</button>",
      mode === "edit" && existing ? '<button class="button secondary full" type="button" data-delete-habit="' + h(existing.id) + '">Excluir hábito</button>' : "",
      "</form>"
    ].join("");
  }

  function habitTemplates() {
    var items = [
      ["Hidratação", "Corpo", "1 copo"],
      ["Sono", "Corpo", "desligar telas"],
      ["Respiração", "Mente", "2 min"],
      ["Leitura", "Mente", "5 páginas"],
      ["Caminhada", "Corpo", "10 min"],
      ["Diário", "Mente", "3 linhas"],
      ["Alongamento", "Corpo", "5 min"],
      ["Pausa sem tela", "Trabalho", "3 min"]
    ];
    return [
      topbar("Templates de autocuidado", "Comece por um hábito pequeno e gentil."),
      '<section class="content-list">' + items.map(function (item) {
        return '<article class="habit-item" style="--habit-color:#35c98d"><div class="item-top"><span class="habit-icon">' + icon("heart", "habit-icon-svg") + '</span><div><div class="task-title">' + h(item[0]) + '</div><small>' + h(item[2]) + ' · ajuste por energia</small><p>Impacto no bem-estar: manter constância com leveza.</p></div><button class="chip" type="button" data-template-habit="' + h(item.join("|")) + '">Usar</button></div></article>';
      }).join("") + "</section>"
    ].join("");
  }

  function microPauses() {
    return [
      topbar("Micro pausas", "Pausas inteligentes para proteger energia."),
      '<section class="focus-task-card card"><h2>Pausa recomendada</h2><h3>Respiração de 2 minutos</h3><p>Indicada antes de tarefas pesadas ou depois de reuniões longas.</p><div class="chip-row">' + chip("ombros") + chip("respiração") + chip("água") + '</div><button class="button primary full" type="button" data-toast="Pausa iniciada">Iniciar pausa</button></section>',
      '<section class="content-list">' + scheduleBlock("2 min", "Respirar 4-4", "Inspire 4, solte 4, repita com calma.", "leve") + scheduleBlock("5 min", "Levantar e alongar", "Tire os olhos da tela e mova o corpo.", "corpo") + "</section>"
    ].join("");
  }

  function focusSession() {
    return [
      topbar("Foco em sessão", "Mantenha uma coisa por vez."),
      '<section class="focus-timer-cluster session-active"><div class="timer" id="sessionTimer">25:00</div><p id="sessionMode">Foco leve</p><strong class="focus-session-status" id="sessionStatus">Preparando foco</strong><div class="focus-controls"><a class="focus-control secondary" href="focus.html">' + icon("reset", "control-icon") + '</a><button class="focus-control primary" id="sessionStart" type="button">' + icon("play", "control-icon") + '</button><button class="focus-control primary" id="sessionPause" type="button" hidden>' + icon("pause", "control-icon") + '</button><button class="focus-control secondary" id="sessionFinish" type="button">' + icon("check", "control-icon") + '</button><button class="focus-control secondary" id="sessionSkip" type="button">' + icon("skip", "control-icon") + '</button></div></section>',
      '<section class="focus-task-card card"><h2>Tarefa em foco</h2><h3 id="sessionTaskTitle">Preparar apresentação Q2</h3><p id="sessionTaskMeta">Alta prioridade · esforço médio · foco protegido</p></section>'
    ].join("");
  }

  function focusBreak() {
    return [
      topbar("Pausa inteligente", "Recupere energia antes do próximo bloco."),
      '<section class="success-card"><span class="success-icon">' + icon("heart", "success-icon-svg") + '</span><h2>Faça uma pausa real</h2><div class="timer break-timer" id="breakTimer">2:00</div><p>Levante, respire, beba água e volte apenas quando seu corpo sinalizar espaço.</p><div class="chip-row">' + chip("2 min respiração") + chip("sem tela") + '</div><button class="button primary full" type="button" id="breakStart">Iniciar pausa</button><button class="button secondary full" type="button" id="breakDone">Concluir pausa</button></section>'
    ].join("");
  }

  function journalNight() {
    return [
      topbar("Fechamento noturno", "Registre três linhas para encerrar o dia."),
      '<form class="card form proto-form" data-local-form="entry"><label class="field"><span>Como foi o dia?</span><input name="titulo" value="Fechamento do dia"></label><label class="field"><span>Conteúdo</span><textarea name="conteudo">Hoje eu percebi o que pesou e o que me ajudou.</textarea></label><label class="field"><span>Tags</span><input name="tags" value="sono, energia, pausa"></label><button class="button primary full" type="submit">Salvar diário</button></form>'
    ].join("");
  }

  function notes() {
    var data = entries().filter(function (entry) { return entry.tipo === "nota"; });
    return [
      topbar("Notas conectadas", "Ideias podem virar tarefa, hábito ou aprendizado."),
      '<form class="card form proto-form" data-local-form="note"><label class="field"><span>Título da nota</span><input name="titulo" required placeholder="Ex.: Ideia rápida"></label><label class="field"><span>Conteúdo</span><textarea name="conteudo" required></textarea></label><button class="button primary full" type="submit">Criar nota</button></form>',
      data.length ? '<section class="content-list">' + data.map(function (entry) { return '<article class="journal-entry" data-entry-id="' + h(entry.id) + '"><strong>Nota</strong><h3>' + icon("note", "journal-title-icon") + h(entry.titulo) + '</h3><p>' + h(entry.conteudo) + '</p><div class="journal-actions"><button type="button" data-note-task="' + h(entry.id) + '">Virar tarefa</button><button type="button" data-note-habit="' + h(entry.id) + '">Virar hábito</button></div></article>'; }).join("") + "</section>" : emptyState("Sem diário", "Crie uma nota rápida para conectar ideias, tarefas e hábitos.", "Criar nota", "#")
    ].join("");
  }

  function labelMood(item) {
    var map = { sensivel: "Péssimo", ruim: "Ruim", neutro: "Neutro", bom: "Bem", otimo: "Ótimo" };
    return map[item.humor] || item.humor || "-";
  }

  function labelEnergy(item) {
    var map = { baixa: "baixa", media: "média", alta: "alta" };
    return item.energiaValor ? item.energiaValor + "/10" : map[item.energia] || "-";
  }

  function figmaShell(title, subtitle, content, extraClass) {
    return '<section class="figma-screen ' + (extraClass || "") + '">' + topbar(title, subtitle) + content + "</section>";
  }

  function figmaCard(title, body, content, extraClass) {
    return [
      '<section class="figma-card ' + (extraClass || "") + '">',
      title ? "<h2>" + h(title) + "</h2>" : "",
      body ? "<p>" + h(body) + "</p>" : "",
      content || "",
      "</section>"
    ].join("");
  }

  function figmaLine(title, body, meta, actionHtml, extraClass) {
    return [
      '<article class="figma-line ' + (extraClass || "") + '">',
      '<div class="figma-line-main">',
      "<h3>" + h(title) + "</h3>",
      body ? "<p>" + h(body) + "</p>" : "",
      meta ? '<div class="chip-row">' + meta + "</div>" : "",
      "</div>",
      actionHtml || "",
      "</article>"
    ].join("");
  }

  function figmaProgress(title, body, value, percent, tone) {
    return figmaCard(title, body, [
      '<div class="figma-progress-head"><strong>' + h(value) + '</strong><span>' + Math.round(percent) + "%</span></div>",
      '<div class="figma-progress ' + (tone || "") + '"><span style="width:' + Math.max(0, Math.min(100, percent)) + '%"></span></div>'
    ].join(""), "figma-progress-card");
  }

  function countHabitMarks(list) {
    return list.reduce(function (sum, habit) {
      return sum + Object.keys(habit.registrosPorData || {}).length;
    }, 0);
  }

  function focusTotalMinutes() {
    return Storage.all(Storage.KEYS.focusSessions).reduce(function (sum, session) {
      return sum + Number(session.duracaoMinutos || Math.round((session.duracao || 0) / 60) || 0);
    }, 0);
  }

  function hasExportableData() {
    return tasks().length || habits().length || entries().length || Storage.all(Storage.KEYS.checkins).length || Storage.all(Storage.KEYS.focusSessions).length;
  }

  function calendarWeekTemplate() {
    var openTasks = tasks().filter(function (task) { return !task.concluida; });
    var days = [
      ["S", "12", "leve"],
      ["T", "13", "foco"],
      ["Q", "14", "active"],
      ["Q", "15", "agenda"],
      ["S", "16", "leve"],
      ["S", "17", ""],
      ["D", "18", ""]
    ];
    var planned = openTasks.length ? [
      ["09:00", openTasks[0] ? openTasks[0].titulo : "Preparar apresentação Q2", "Foco protegido com energia média.", "foco"],
      ["11:00", openTasks[2] ? openTasks[2].titulo : "Limpar inbox", "Bloco curto para pendências leves.", "leve"],
      ["14:00", openTasks[1] ? openTasks[1].titulo : "Reunião com cliente ABC", "Compromisso fixo na agenda.", "agenda"],
      ["15:30", "Pausa protegida", "Micro pausa antes do último bloco.", "cuidado"]
    ] : [];
    return figmaShell("Agenda", "Semana com tarefas, compromissos e carga visível.", [
      '<section class="figma-tabs"><button class="active" type="button">Semana</button><a href="calendar-month.html">Mês</a></section>',
      '<section class="figma-week-strip">' + days.map(function (day) {
        return '<button class="' + h(day[2]) + '" type="button"><span>' + h(day[0]) + '</span><strong>' + h(day[1]) + "</strong></button>";
      }).join("") + "</section>",
      planned.length ? figmaCard("Semana planejada", "Carga distribuída com foco, agenda e pausas visíveis.", planned.map(function (item) {
        return scheduleBlock(item[0], item[1], item[2], item[3]);
      }).join(""), "figma-schedule-card") : emptyState("Semana sem planejamento", "Defina prioridades, distribua carga e proteja pausas antes de começar.", "Planejar dia", "planning.html"),
      figmaCard("Resumo da carga", "O dia mais cheio fica destacado para evitar excesso.", '<div class="figma-load-row"><span>Seg</span><b></b><em>leve</em></div><div class="figma-load-row strong"><span>Qua</span><b></b><em>alta</em></div><div class="figma-load-row"><span>Sex</span><b></b><em>média</em></div>', "figma-load-card")
    ].join(""), "agenda-week-template");
  }

  function calendarMonthTemplate() {
    var allTasks = tasks();
    var selectedDay = Number(Storage.read("selectedCalendarDay", new Date().getDate()));
    var daysWithTasks = allTasks.reduce(function (acc, task) {
      if (task.prazo) acc[new Date(task.prazo + "T12:00:00").getDate()] = true;
      return acc;
    }, {});
    var selectedTasks = allTasks.filter(function (task) {
      return task.prazo && new Date(task.prazo + "T12:00:00").getDate() === selectedDay;
    });
    var grid = Array.from({ length: 30 }, function (_, i) {
      var day = i + 1;
      var cls = day === selectedDay ? "active" : daysWithTasks[day] ? "busy" : i === 18 || i === 26 ? "soft" : "";
      return '<button type="button" class="' + cls + '" data-select-day="' + day + '"><span>' + day + "</span></button>";
    }).join("");
    return figmaShell("Agenda", "Mês com carga, espaços de cuidado e dias mais cheios.", [
      '<section class="figma-tabs"><a href="calendar-week.html">Semana</a><button class="active" type="button">Mês</button></section>',
      '<section class="figma-month-template"><div class="figma-month-head"><strong>Abril</strong><span>Baixa carga geral</span></div><div class="figma-month-grid">' + grid + "</div></section>",
      selectedTasks.length ? figmaCard("Dia " + selectedDay, "Tarefas com data para o dia selecionado.", selectedTasks.map(function (task) {
        return figmaLine(task.titulo, task.categoria || "Tarefa sem categoria", chip(task.prioridade || "normal") + chip(task.tempoEstimado || "sem tempo"), '<a class="figma-mini-action" href="tasks.html">Abrir</a>');
      }).join(""), "figma-day-card") : figmaCard("Mês com baixa carga", "Ótimo espaço para autocuidado, revisão e tarefas sem pressa.", '<div class="chip-row">' + chip("sem excesso") + chip("planejar pausas") + chip("revisar semana") + "</div>", "figma-day-card")
    ].join(""), "agenda-month-template");
  }

  function microPausesTemplate() {
    return figmaShell("Micro pausas", "Pausas inteligentes para proteger energia durante o dia.", [
      figmaCard("Pausa recomendada", "Respiração de 2 minutos antes da próxima tarefa pesada.", '<div class="figma-pause-timer">2:00</div><div class="chip-row">' + chip("respiração") + chip("ombros") + chip("água") + '</div><button class="button primary full" type="button" data-toast="Pausa iniciada">Iniciar pausa</button>', "figma-pause-hero"),
      '<section class="figma-pause-list">' +
        figmaLine("Respirar 4-4", "Inspire em 4, solte em 4 e repita com calma.", chip("2 min") + chip("leve"), '<button class="figma-mini-action" type="button" data-toast="Pausa iniciada">Iniciar</button>') +
        figmaLine("Água e ombros", "Beba água e solte a tensão dos ombros.", chip("3 min") + chip("corpo"), '<button class="figma-mini-action" type="button" data-toast="Lembrete de água ativado">Ativar</button>') +
        figmaLine("Sem tela", "Olhe para longe e volte apenas quando houver espaço.", chip("5 min") + chip("recuperar"), '<button class="figma-mini-action" type="button" data-toast="Pausa sem tela iniciada">Começar</button>') +
      "</section>"
    ].join(""), "micro-pauses-template");
  }

  function notesTemplate() {
    var data = entries().filter(function (entry) { return entry.tipo === "nota"; });
    var firstNote = data[0] || {
      id: "demo-note-meetings",
      titulo: "Ideia para reduzir reuniões longas",
      conteudo: "Criar pauta curta com decisão esperada antes de cada conversa com cliente.",
      tags: ["cliente", "foco"]
    };
    var noteTaskAction = data.length ? 'data-note-task="' + h(firstNote.id) + '"' : 'data-toast="Crie uma nota antes de transformar em tarefa"';
    var noteHabitAction = data.length ? 'data-note-habit="' + h(firstNote.id) + '"' : 'data-toast="Crie uma nota antes de transformar em hábito"';
    return figmaShell("Notas conectadas", "Ideias podem virar tarefa, hábito ou aprendizado.", [
      figmaCard("Ideia rápida", firstNote.conteudo, '<div class="figma-note-actions"><button type="button" ' + noteHabitAction + '>Criar hábito</button><button type="button" ' + noteTaskAction + '>Virar tarefa</button></div>', "figma-note-card quick"),
      figmaCard("Nota longa", "Revisar o padrão de reuniões da semana e transformar decisões repetidas em checklist.", '<div class="figma-note-actions"><button type="button" ' + noteTaskAction + '>Transformar em tarefa</button><button type="button" data-toast="Nota movida para projeto">Mover para projeto</button></div>', "figma-note-card long"),
      figmaCard("Nota conectada", firstNote.titulo, '<p class="figma-note-body">' + h(firstNote.conteudo) + '</p><div class="chip-row">' + (firstNote.tags || ["nota", "cliente"]).map(function (tag) { return chip(tag); }).join("") + '</div><div class="figma-note-actions"><button type="button" ' + noteTaskAction + '>Criar tarefa</button><button type="button" ' + noteHabitAction + '>Criar hábito</button></div>', "figma-note-card connected"),
      figmaCard("Insight", "Notas ficam mais úteis quando recebem um próximo passo claro.", '<form class="figma-inline-form" data-local-form="note"><input name="titulo" required placeholder="Título da nota"><textarea name="conteudo" required placeholder="Escreva uma nota rápida"></textarea><button class="button primary full" type="submit">Criar nota</button></form>', "figma-note-card insight"),
      data.length ? '<section class="figma-note-history">' + data.map(function (entry) {
        return figmaLine(entry.titulo, entry.conteudo, (entry.tags || []).slice(0, 2).map(function (tag) { return chip(tag); }).join(""), '<button class="figma-mini-action" type="button" data-note-task="' + h(entry.id) + '">Virar tarefa</button>');
      }).join("") + "</section>" : emptyState("Sem diário", "Crie uma nota rápida para conectar ideias, tarefas e hábitos.", "Criar nota", "#")
    ].join(""), "notes-template");
  }

  function moreTemplate() {
    return figmaShell("Mais", "Acesse painéis, ajustes e recursos de fechamento.", [
      '<section class="figma-shortcuts more-primary-actions"><a href="dashboard.html">Dashboard</a><a href="settings.html">Configurações</a><a href="reminders.html">Lembretes</a></section>',
      figmaCard("Seu espaço Plenna", "Tudo que não cabe na navegação principal fica aqui, sem esconder funções importantes.", [
        figmaLine("Configurações", "Nome, foco padrão, pausas inteligentes, check-in diário e limpeza de dados.", chip("sistema"), '<a class="figma-mini-action" href="settings.html">Abrir</a>'),
        figmaLine("Lembretes personalizados", "Crie avisos locais para check-in, foco, pausa e hábitos.", chip("rotina"), '<a class="figma-mini-action" href="reminders.html">Abrir</a>'),
        figmaLine("Metas e conquistas", "Acompanhe constância sem transformar cuidado em cobrança.", chip("bem-estar"), '<a class="figma-mini-action" href="goals.html">Ver</a>')
      ].join(""), "more-hub-card"),
      figmaCard("Relatórios e histórico", "Revise dados salvos no navegador e exporte quando precisar.", [
        figmaLine("Histórico emocional", "Check-ins por data, humor e energia.", chip("check-in"), '<a class="figma-mini-action" href="dashboard-history.html">Ver</a>'),
        figmaLine("Operacional", "Tarefas abertas, concluídas, foco total e hábitos.", chip("métricas"), '<a class="figma-mini-action" href="dashboard-operational.html">Ver</a>'),
        figmaLine("Exportar relatórios", "Baixe um JSON local com módulos selecionados.", chip("local"), '<a class="figma-mini-action" href="export.html">Exportar</a>')
      ].join(""), "more-report-card"),
      figmaCard("Registros conectados", "Diário, notas e estados do protótipo continuam acessíveis por aqui.", [
        figmaLine("Diário", "Entradas, fechamento noturno e aprendizados.", chip("reflexão"), '<a class="figma-mini-action" href="journal.html">Abrir</a>'),
        figmaLine("Notas conectadas", "Transforme notas em tarefas ou hábitos.", chip("notas"), '<a class="figma-mini-action" href="notes.html">Abrir</a>'),
        figmaLine("Estados vazios", "Todos os feedbacks quando ainda não há dados.", chip("feedback"), '<a class="figma-mini-action" href="empty-states.html">Ver</a>')
      ].join(""), "more-connected-card")
    ].join(""), "more-template");
  }

  function dashboardTemplate() {
    var checkins = Storage.all(Storage.KEYS.checkins);
    var allTasks = tasks();
    var allHabits = habits();
    var allEntries = entries();
    var focusMinutes = focusTotalMinutes();
    var hasData = checkins.length || allTasks.length || allHabits.length || allEntries.length || focusMinutes;
    var doneTasks = allTasks.filter(function (task) { return task.concluida; }).length;
    var openTasks = allTasks.length - doneTasks;
    var systemLinks = '<section class="figma-shortcuts"><a href="settings.html">Configurações</a><a href="reminders.html">Lembretes</a><a href="goals.html">Metas</a></section>';
    if (!hasData) return figmaShell("Dashboard", "Resumo de energia, foco, hábitos e tarefas.", systemLinks + emptyState("Sem insights", "Insights aparecem após alguns dias de uso consistente.", "Fazer check-in", "checkin.html") + prototypeLinksClean(), "dashboard-template");
    return figmaShell("Dashboard", "Resumo real do seu ritmo no navegador.", [
      '<section class="figma-shortcuts"><a href="dashboard-history.html">Histórico</a><a href="dashboard-operational.html">Operacional</a><a href="export.html">Exportar</a></section>',
      systemLinks,
      '<section class="figma-metric-grid">' + metric(String(openTasks), "tarefas abertas", "primary") + metric(String(doneTasks), "concluídas") + metric(String(focusMinutes) + "m", "foco") + metric(String(countHabitMarks(allHabits)), "hábitos") + "</section>",
      figmaProgress("Padrão da semana", "Mais constância quando o dia começa com check-in e planejamento curto.", "72%", 72, "green"),
      figmaCard("Insights", "", [
        figmaLine("Energia melhor após pausas", "Pausas curtas aparecem antes dos melhores blocos de foco.", chip("bem-estar"), ""),
        figmaLine("Tarefas pesadas rendem mais cedo", "Deixe contrato e apresentação antes das 14h.", chip("foco"), ""),
        figmaLine("Diário ajuda em dias sensíveis", "Registros reduzem retrabalho emocional.", chip("cuidado"), "")
      ].join(""), "figma-insight-card"),
      prototypeLinksClean()
    ].join(""), "dashboard-template");
  }

  function dashboardHistoryTemplate() {
    var checkins = Storage.all(Storage.KEYS.checkins);
    if (!checkins.length) return figmaShell("Histórico emocional", "Humor e energia registrados.", emptyState("Sem histórico emocional", "Faça alguns check-ins para liberar padrões da semana.", "Fazer check-in", "checkin.html"), "dashboard-history-template");
    var latest = checkins[0];
    return figmaShell("Histórico emocional", "Humor, energia e fatores vistos em sequência.", [
      '<section class="figma-tabs"><button class="active" type="button">7 dias</button><button type="button">30 dias</button><button type="button">Tudo</button></section>',
      figmaCard("Último check-in", "Energia " + labelEnergy(latest) + " · " + labelMood(latest), '<div class="figma-history-chart">' + checkins.slice(0, 7).map(function (item) {
        var height = item.energiaValor ? item.energiaValor * 8 : 38;
        return '<span style="height:' + height + 'px"><b></b></span>';
      }).join("") + '</div><div class="chip-row">' + (latest.fatores || []).map(function (factor) { return chip(factor); }).join("") + "</div>", "figma-history-hero"),
      '<section class="figma-metric-grid">' + metric(String(checkins.length), "check-ins") + metric(labelEnergy(latest), "última energia") + "</section>",
      '<section class="figma-history-list">' + checkins.slice(0, 8).map(function (item) {
        return figmaLine(labelMood(item), Utils.formatDateTime(item.data) + " · energia " + labelEnergy(item), (item.fatores || []).slice(0, 2).map(function (factor) { return chip(factor); }).join(""), "");
      }).join("") + "</section>"
    ].join(""), "dashboard-history-template");
  }

  function dashboardOperationalTemplate() {
    var allTasks = tasks();
    var allHabits = habits();
    var focusMinutes = focusTotalMinutes();
    var doneTasks = allTasks.filter(function (task) { return task.concluida; }).length;
    var openTasks = allTasks.length - doneTasks;
    var heavy = allTasks.filter(function (task) { return task.esforco === "alto"; }).length;
    var postponed = allTasks.filter(function (task) { return task.adiada || (task.prazo && task.prazo > Utils.todayISO()); }).length;
    var hasData = allTasks.length || allHabits.length || focusMinutes;
    if (!hasData) return figmaShell("Dashboard operacional", "Carga, foco e tarefas por contexto.", emptyState("Dashboard operacional sem dados", "Faça alguns check-ins para liberar padrões da semana.", "Fazer check-in", "checkin.html"), "dashboard-operational-template");
    return figmaShell("Dashboard operacional", "Carga, foco e tarefas por contexto.", [
      '<section class="figma-metric-grid">' + metric(String(openTasks), "abertas") + metric(String(doneTasks), "concluídas") + metric(String(focusMinutes) + "m", "foco total") + metric(String(countHabitMarks(allHabits)), "hábitos feitos") + "</section>",
      figmaProgress("Carga por esforço", heavy + " tarefas pesadas · " + postponed + " adiadas ou futuras.", heavy + "/" + Math.max(1, allTasks.length), Math.min(90, heavy * 24 + 18), "amber"),
      figmaCard("Fila operacional", "Priorize o que destrava o dia sem ignorar energia.", allTasks.slice(0, 4).map(function (task) {
        return figmaLine(task.titulo, (task.categoria || "Sem categoria") + " · " + (task.tempoEstimado || "sem tempo"), chip(task.prioridade || "normal") + chip(task.esforco || "sem esforço"), '<a class="figma-mini-action" href="tasks.html">Abrir</a>');
      }).join(""), "figma-operational-list")
    ].join(""), "dashboard-operational-template");
  }

  function exportTemplate() {
    if (!hasExportableData()) {
      return figmaShell("Exportar relatórios", "Escolha módulos para gerar um resumo local.", emptyState("Exportação sem dados", "Ainda não há registros suficientes para exportar.", "Fazer check-in", "checkin.html"), "export-template");
    }
    var modules = [
      ["checkins", "Check-ins", "Humor, energia e fatores"],
      ["tasks", "Tarefas", "Prioridades, prazos e subtarefas"],
      ["habits", "Hábitos", "Templates e registros por dia"],
      ["focusSessions", "Foco", "Sessões e duração"],
      ["entries", "Diário e notas", "Entradas conectadas"]
    ];
    return figmaShell("Exportar relatórios", "Escolha módulos e baixe um relatório local.", [
      figmaCard("Módulos", "Dados ficam no navegador e são baixados em JSON.", modules.map(function (item) {
        return '<label class="figma-check-line"><span><strong>' + h(item[1]) + '</strong><small>' + h(item[2]) + '</small></span><input type="checkbox" data-export-module="' + h(item[0]) + '" checked></label>';
      }).join(""), "figma-export-card"),
      figmaCard("Privacidade", "Nada é enviado para servidor. O arquivo é gerado no próprio navegador.", '<button class="button primary full" type="button" data-export>Gerar relatório</button><a class="button secondary full" href="dashboard.html">Voltar</a>', "figma-export-privacy")
    ].join(""), "export-template");
  }

  function exportSuccessTemplate() {
    var exports = Storage.all(Storage.KEYS.exports);
    var latest = exports[0];
    return figmaShell("Exportação pronta", "Seu relatório foi preparado localmente.", [
      '<section class="figma-success-card"><span class="success-icon">' + icon("check", "success-icon-svg") + '</span><h2>' + h(latest ? latest.nomeArquivo : "Relatório gerado") + '</h2><p>' + h(latest ? "Gerado em " + Utils.formatDateTime(latest.data) : "Você pode gerar uma exportação a qualquer momento.") + '</p><button class="button primary full" type="button" data-download-export>Baixar novamente</button><a class="button secondary full" href="dashboard.html">Voltar ao dashboard</a></section>'
    ].join(""), "export-success-template");
  }

  function goalsTemplate() {
    var checkins = Storage.all(Storage.KEYS.checkins);
    var markCount = countHabitMarks(habits());
    return figmaShell("Metas e conquistas", "Celebre constância sem transformar cuidado em pressão.", [
      figmaProgress("Meta 7 dias", "Check-ins suficientes para enxergar o ritmo da semana.", checkins.length + "/7", Math.min(100, checkins.length / 7 * 100), "green"),
      figmaProgress("Meta 30 dias", "Histórico emocional mais confiável com continuidade.", Math.min(checkins.length, 30) + "/30", Math.min(100, checkins.length / 30 * 100), "blue"),
      figmaCard("Badges", "Conquistas leves, ligadas a cuidado e consistência.", '<div class="figma-badges"><span>Semana com pausas</span><span>Foco protegido</span><span>Diário ativo</span><span>' + h(markCount + " hábitos") + "</span></div>", "figma-badges-card"),
      figmaCard("Feedback", "Você protegeu energia em dias cheios. Continue usando metas como sinal, não cobrança.", '<a class="button primary full" href="dashboard.html">Ver dashboard</a>', "figma-feedback-card")
    ].join(""), "goals-template");
  }

  function settingsTemplate() {
    var settingsData = Storage.read(Storage.KEYS.settings, { nome: "Luana", focoPadrao: 25, pausasInteligentes: true, checkinDiario: true });
    var initial = (settingsData.nome || "L").charAt(0).toUpperCase();
    return figmaShell("Configurações", "Ajuste o sistema do Plenna sem perder contexto do seu dia.", [
      '<form class="figma-profile-card" data-local-form="settings"><div class="row"><span class="avatar">' + h(initial) + '</span><div><h2>' + h(settingsData.nome || "Luana Caroline") + '</h2><p>Dados salvos apenas neste navegador.</p></div></div><div class="grid-2"><label class="field"><span>Nome</span><input name="nome" value="' + h(settingsData.nome || "Luana Caroline") + '"></label><label class="field"><span>Foco padrão</span><input name="focoPadrao" type="number" min="5" max="120" value="' + h(settingsData.focoPadrao || 25) + '"></label></div><label class="settings-toggle"><input type="checkbox" name="pausasInteligentes"' + (settingsData.pausasInteligentes ? " checked" : "") + '> Pausas inteligentes</label><label class="settings-toggle"><input type="checkbox" name="checkinDiario"' + (settingsData.checkinDiario ? " checked" : "") + '> Check-in diário</label><button class="button primary full" type="submit">Salvar</button></form>',
      '<section class="figma-settings-list">' +
        figmaLine("Check-in", "Ajusta recomendações pela energia do dia.", chip(settingsData.checkinDiario ? "ativo" : "pausado"), '<a class="figma-mini-action" href="checkin.html">Editar</a>') +
        figmaLine("Pausas inteligentes", "Sugestões antes de tarefas pesadas.", chip(settingsData.pausasInteligentes ? "ativo" : "pausado"), '<a class="figma-mini-action" href="micro-pauses.html">Abrir</a>') +
        figmaLine("Foco", "Duração padrão e modo de sessão.", chip((settingsData.focoPadrao || 25) + " min"), '<a class="figma-mini-action" href="focus.html">Ajustar</a>') +
        figmaLine("Modo dia difícil", "Reduz carga e deixa cuidado mais visível.", chip("protetivo"), '<button class="figma-mini-action" type="button" data-toast="Modo protetivo ativado">Ativar</button>') +
        figmaLine("Acessibilidade", "Texto legível, contraste e navegação simples.", chip("padrão"), '<button class="figma-mini-action" type="button" data-toast="Preferência salva">Salvar</button>') +
        figmaLine("Privacidade", "Limpar todos os dados locais deste navegador.", chip("local"), '<button class="figma-mini-action danger" type="button" data-clear-local>Limpar</button>') +
      "</section>"
    ].join(""), "settings-template");
  }

  function remindersTemplate() {
    var list = Storage.all(Storage.KEYS.reminders);
    var activeCount = list.filter(function (item) { return item.active !== false; }).length;
    return figmaShell("Lembretes personalizados", "Simulação local de avisos e rotinas.", [
      figmaCard("Resumo lembretes", "Organize check-in, pausas, hábitos e modo silencioso.", '<div class="chip-row">' + chip(activeCount + " ativos") + chip("hoje ajustado por energia") + chip("silencioso 20h") + "</div>", "figma-reminder-summary"),
      '<section class="figma-reminder-list">' + (list.length ? list.map(function (item) {
        return figmaLine(item.title, item.body + " · " + (item.time || "09:00"), chip(item.active === false ? "pausado" : "ativo"), '<div class="figma-reminder-actions"><button type="button" data-toggle-reminder="' + h(item.id) + '">' + h(item.active === false ? "Ativar" : "Pausar") + '</button><button type="button" data-edit-reminder="' + h(item.id) + '">Editar</button><button type="button" data-remove-reminder="' + h(item.id) + '">Remover</button></div>');
      }).join("") : emptyState("Sem lembrete", "Você pode ser avisada antes do prazo.", "Criar abaixo", "#")) + "</section>",
      '<form class="figma-inline-form figma-reminder-form" data-local-form="reminder"><h2>Novo lembrete</h2><input name="title" required placeholder="Título"><input name="body" required placeholder="Mensagem"><div class="grid-2"><input name="time" type="time" value="09:00"><select name="active"><option value="true">Ativo</option><option value="false">Pausado</option></select></div><button class="button primary full" type="submit">Criar lembrete</button></form>'
    ].join(""), "reminders-template");
  }

  function emptyStates() {
    var states = [
      ["Sem tarefas", "Quando não houver tarefas, sugerir criar uma prioridade leve."],
      ["Sem hábitos", "Comece por um template simples, como hidratação ou sono."],
      ["Sem histórico emocional", "Faça alguns check-ins para liberar padrões da semana."],
      ["Sem diário", "Registre um fechamento rápido em menos de 2 minutos."],
      ["Sem insights", "Insights aparecem após alguns dias de uso consistente."],
      ["Exportação sem dados", "Ainda não há registros suficientes para gerar relatório."],
      ["Busca sem resultados", "Tente outro termo ou crie um item rápido a partir do que procura."],
      ["Calendário sem tarefas", "Planeje sua semana ou distribua tarefas para preencher seus blocos."],
      ["Tarefa sem subtarefas", "Adicione checklist se a tarefa parecer grande."],
      ["Sem recorrência", "Esta tarefa acontece uma vez."],
      ["Sem lembrete", "Você pode ser avisada antes do prazo."],
      ["Mês com baixa carga", "Ótimo espaço para autocuidado e revisão."],
      ["Caixa de entrada vazia", "Nenhuma captura pendente; seu dia está limpo para priorizar."],
      ["Projeto sem tarefas", "Crie a primeira tarefa quando esse projeto virar ação."],
      ["Dashboard operacional sem dados", "Faça alguns check-ins para liberar padrões da semana."],
      ["Semana sem planejamento", "Defina prioridades, distribua carga e proteja pausas antes de começar."],
      ["Tarefa sem prazo ou data", "Ela ainda não entrou no seu fluxo. Defina quando fazer ou deixe na lista sem data."]
    ];
    return topbar("Estados vazios e feedbacks", "Exemplos prontos para quando ainda não houver dados.") + '<section class="content-list">' + states.map(function (state) { return emptyState(state[0], state[1], "Entendi", "#"); }).join("") + "</section>";
  }

  function onboarding() {
    return '<section class="card hero-card"><div class="cover-title"><span class="leaf-mark"><img class="plenna-leaf" src="' + h(window.PlennaIcons ? window.PlennaIcons.leafImage() : "../assets/images/plenna-leaf.png") + '" alt=""></span><h1>Plenna</h1><p>Seu dia, com intenção e equilíbrio.</p></div><div class="content-list"><article class="list-item icon-list-item">' + icon("check", "inline-list-icon") + 'Gestão de tarefas e hábitos</article><article class="list-item icon-list-item">' + icon("focus", "inline-list-icon") + 'Modo foco com Pomodoro</article><article class="list-item icon-list-item">' + icon("heart", "inline-list-icon") + 'Check-in emocional diário</article></div><a class="button primary full" href="checkin.html">Começar</a><a class="button secondary full" href="home.html">Já tenho conta</a></section>';
  }

  function prototypeLinks() {
    return prototypeLinksClean();
  }

  function prototypeOverview() {
    return prototypeOverviewClean();
  }

  function checkinStatesTemplate() {
    return checkinStatesCleanTemplate();
  }

  function exportReadyTemplate() {
    return exportReadyCleanTemplate();
  }

  function prototypeLinksClean() {
    return '<section class="figma-shortcuts prototype-links"><a href="prototype-overview.html">Entrega final</a><a href="checkin-states.html">Estados check-in</a><a href="export-ready.html">Exportação pronta</a></section>';
  }

  function prototypeOverviewClean() {
    return figmaShell("Plenna", "Protótipo final organizado para apresentar a jornada completa.", [
      '<section class="figma-hero-panel"><span class="leaf-mark"><img class="plenna-leaf" src="' + h(window.PlennaIcons ? window.PlennaIcons.leafImage() : "../assets/images/plenna-leaf.png") + '" alt=""></span><h2>Produtividade com equilíbrio e bem-estar.</h2><p>A experiência mostra como humor e energia ajudam a decidir prioridades, foco, pausas, hábitos e reflexões.</p><div class="chip-row">' + chip("Baseado no check-in") + chip("Simulação local") + "</div></section>",
      figmaCard("Fluxo demo", "Ordem principal do protótipo no web.", [
        figmaLine("1. Onboarding e promessa", "Entrada visual do Plenna com começo do check-in.", chip("início"), '<a class="figma-mini-action" href="../index.html">Abrir</a>'),
        figmaLine("2. Jornada principal", "Check-in, sucesso, Home, planejamento, tarefas e foco.", chip("core"), '<a class="figma-mini-action" href="checkin.html">Começar</a>'),
        figmaLine("3. Bem-estar", "Hábitos, micro pausas, diário e notas conectadas.", chip("cuidado"), '<a class="figma-mini-action" href="habits.html">Ver</a>'),
        figmaLine("4. Fechamento", "Dashboard, histórico, exportação, metas e configurações.", chip("mais"), '<a class="figma-mini-action" href="dashboard.html">Painel</a>')
      ].join(""), "prototype-flow-card"),
      prototypeLinksClean()
    ].join(""), "prototype-overview-template");
  }

  function checkinStatesCleanTemplate() {
    var states = [
      ["Humor bom + energia alta", "Foco profundo, avanço e prioridade importante.", "home.html?demo=alta", "focus.html?demo=alta", "alta"],
      ["Humor neutro + energia média", "Organização equilibrada, três prioridades e foco leve.", "home.html?demo=media", "focus.html?demo=media", "média"],
      ["Humor ruim + energia baixa", "Redução de carga, tarefa leve e autocuidado visível.", "home.html?demo=baixa", "focus.html?demo=baixa", "baixa"],
      ["Humor baixo por vários dias", "Plano protetivo, diário antes do foco e pausa guiada.", "home.html?demo=protetivo", "focus.html?demo=protetivo", "protetivo"]
    ];
    return figmaShell("Estados do check-in", "Variações visuais que mudam Home, Planejamento e Foco.", [
      '<section class="checkin-state-grid">' + states.map(function (state) {
        return '<article class="figma-card checkin-state-card"><span class="eyebrow">' + h(state[4]) + "</span><h2>" + h(state[0]) + "</h2><p>" + h(state[1]) + '</p><div class="row"><a class="button primary" href="' + h(state[2]) + '">Ver Home</a><a class="button secondary" href="' + h(state[3]) + '">Ver Foco</a></div></article>';
      }).join("") + "</section>",
      figmaCard("Como testar", "Cada botão abre a tela com query string demo, sem quebrar o fluxo normal salvo em localStorage.", '<div class="chip-row">' + chip("home.html?demo=alta") + chip("focus.html?demo=protetivo") + "</div>", "state-test-card")
    ].join(""), "checkin-states-template");
  }

  function exportReadyCleanTemplate() {
    var exports = Storage.all(Storage.KEYS.exports);
    var latest = exports[0];
    var fileName = latest ? latest.nomeArquivo : "plenna-relatorio-demo.json";
    var when = latest ? Utils.formatDateTime(latest.data) : "simulação local";
    return figmaShell("Exportação pronta", "Frame 28 do protótipo, separado como tela acessível.", '<section class="figma-success-card export-ready-card"><span class="success-icon">' + icon("check", "success-icon-svg") + '</span><h2>' + h(fileName) + '</h2><p>Relatório preparado em ' + h(when) + '.</p><div class="chip-row">' + chip("check-ins") + chip("tarefas") + chip("foco") + '</div><button class="button primary full" type="button" data-download-export>Baixar novamente</button><a class="button secondary full" href="export.html">Voltar para exportar</a></section>', "export-ready-template");
  }

  function settingToggle(name, label, checked) {
    return '<label class="figma-toggle-line"><span>' + h(label) + '</span><input type="checkbox" name="' + h(name) + '"' + (checked ? " checked" : "") + "></label>";
  }

  function moduleCount(key) {
    if (key === Storage.KEYS.settings) return Storage.read(Storage.KEYS.settings, null) ? 1 : 0;
    return Storage.all(key).length;
  }

  function planningAdjustPolished() {
    var adjustment = Storage.read("planningAdjustments", {});
    var hasAdjust = adjustment.cargaReduzida || adjustment.pausaProtegida || adjustment.horarioTrocado || adjustment.prioridadeProtegida;
    var before = "Foco 09h + tarefa pesada hoje";
    var after = adjustment.cargaReduzida ? "Foco 10h + tarefa pesada amanhã" : adjustment.horarioTrocado ? "Foco 10h + rotina leve antes" : "Foco leve + pausa protegida";
    return figmaShell("Ajustar planejamento", "Edite carga, horário e pausas sem perder o contexto do check-in.", [
      '<section class="figma-adjust-hero"><span class="eyebrow">AJUSTE DO DIA</span><h2>' + h(hasAdjust ? "Seu dia ficou mais realista." : "Escolha como o Plenna deve aliviar seu dia.") + '</h2><p>' + h(hasAdjust ? "As mudanças ficam salvas no navegador e alteram a sugestão do planejamento." : "Use ações pequenas para reduzir carga sem perder o que importa.") + '</p><div class="figma-compare-grid"><span><small>Antes</small><strong>' + h(before) + '</strong></span><span><small>Depois</small><strong>' + h(after) + '</strong></span></div><div class="row"><button class="button primary" type="button" data-save-adjust>Salvar ajustes</button><a class="button secondary" href="planning.html">Cancelar</a></div></section>',
      '<section class="figma-adjust-controls">' +
        '<button type="button" data-adjust-kind="horario"><strong>Trocar horário</strong><span>Move foco para depois da rotina.</span></button>' +
        '<button type="button" data-adjust-kind="carga"><strong>Reduzir carga</strong><span>Adia a tarefa mais pesada.</span></button>' +
        '<button type="button" data-adjust-kind="pausa"><strong>Proteger pausa</strong><span>Reserva recuperação às 15h30.</span></button>' +
        '<button type="button" data-adjust-kind="prioridade"><strong>Priorizar essencial</strong><span>Fica só com três entregas.</span></button>' +
      "</section>",
      figmaCard("Novo cronograma", "Os selos indicam o que foi movido, protegido ou reduzido.", [
        scheduleBlock("09:00", "Rotina leve de início", "Responder 2 pendências pequenas antes do foco.", adjustment.cargaReduzida ? "reduzido" : "leve"),
        scheduleBlock("10:00", "Foco leve · Apresentação Q2", "Movido para depois da rotina.", adjustment.horarioTrocado ? "movido" : "sugerido"),
        scheduleBlock("14:00", "Reunião com cliente ABC", "Compromisso mantido na agenda.", "fixo"),
        scheduleBlock("15:30", "Pausa protegida", "Pausa travada antes do fim do dia.", adjustment.pausaProtegida ? "travado" : "cuidado"),
        scheduleBlock("Amanhã", "Revisar contrato completo", "Tarefa pesada adiada para evitar sobrecarga.", adjustment.cargaReduzida ? "adiado" : "opcional")
      ].join(""), "figma-adjust-schedule")
    ].join(""), "planning-adjust-template polished-template");
  }

  function habitFormPolished(mode) {
    var id = Utils.getQueryParam("id");
    var existing = id ? Storage.find(Storage.KEYS.habits, id) : null;
    if (mode === "edit" && !existing) existing = habits()[0] || null;
    var category = existing ? existing.categoria : "Mente";
    var frequency = existing ? existing.frequencia : "Diário";
    var nameValue = existing ? existing.nome : "";
    var goalValue = existing ? existing.metaMinima : "5 min";
    var categoryOptions = (window.PlennaData ? window.PlennaData.categoriasHabito : ["Corpo", "Mente", "Trabalho"]).map(function (item) {
      return '<option' + (item === category ? " selected" : "") + ">" + h(item) + "</option>";
    }).join("");
    var frequencyOptions = (window.PlennaData ? window.PlennaData.frequencias : ["Diário", "Semanal"]).map(function (item) {
      return '<option' + (item === frequency ? " selected" : "") + ">" + h(item) + "</option>";
    }).join("");
    return figmaShell(mode === "edit" ? "Editar hábito" : "Novo hábito", "Defina um mínimo possível e flexível.", [
      '<form class="figma-profile-card habit-editor-card" data-local-form="habit" data-habit-id="' + h(existing ? existing.id : "") + '">',
      '<div class="row"><span class="habit-editor-icon">' + icon("heart", "habit-icon-svg") + '</span><div><h2>' + h(nameValue || "Hábito flexível") + '</h2><p>Impacto no bem-estar, meta mínima e frequência.</p></div></div>',
      '<label class="field"><span>Nome</span><input name="nome" required value="' + h(nameValue) + '" placeholder="Ex.: Respiração consciente"></label>',
      '<div class="grid-2"><label class="field"><span>Categoria</span><select name="categoria">' + categoryOptions + '</select></label><label class="field"><span>Frequência</span><select name="frequencia">' + frequencyOptions + '</select></label></div>',
      '<label class="field"><span>Meta mínima</span><input name="metaMinima" value="' + h(goalValue) + '" placeholder="Ex.: 2 min"></label>',
      '<section class="figma-mini-panel"><strong>Quando a energia estiver baixa</strong><p>O Plenna mostra a meta mínima e evita cobrança de sequência.</p><div class="chip-row">' + chip("flexível") + chip("sem culpa") + chip("bem-estar") + "</div></section>",
      '<button class="button primary full" type="submit">' + (mode === "edit" ? "Salvar hábito" : "Criar hábito") + "</button>",
      mode === "edit" && existing ? '<button class="button secondary full" type="button" data-delete-habit="' + h(existing.id) + '">Excluir hábito</button>' : '<a class="button secondary full" href="habit-templates.html">Ver templates</a>',
      "</form>"
    ].join(""), "habit-form-template polished-template");
  }

  function focusBreakPolished() {
    return figmaShell("Pausa inteligente", "Recupere energia antes do próximo bloco.", [
      '<section class="figma-break-hero"><span class="success-icon">' + icon("heart", "success-icon-svg") + '</span><h2>Faça uma pausa real</h2><div class="figma-pause-timer break-timer" id="breakTimer">2:00</div><p>Levante, respire, beba água e volte apenas quando seu corpo sinalizar espaço.</p><div class="chip-row">' + chip("respiração") + chip("sem tela") + chip("água") + '</div><div class="row"><button class="button primary" type="button" id="breakStart">Iniciar</button><button class="button secondary" type="button" id="breakDone">Concluir</button></div></section>',
      figmaCard("Checklist da pausa", "Pequenas ações para o corpo sair do modo tarefa.", [
        figmaLine("Soltar ombros", "Relaxe mandíbula e pescoço por alguns segundos.", chip("30s"), ""),
        figmaLine("Respirar 4-4", "Inspire em 4, solte em 4, sem pressa.", chip("1 min"), ""),
        figmaLine("Voltar com uma intenção", "Escolha só o próximo passo.", chip("foco leve"), '<a class="figma-mini-action" href="focus.html">Voltar</a>')
      ].join(""), "figma-break-list")
    ].join(""), "focus-break-template polished-template");
  }

  function journalNightPolished() {
    return figmaShell("Fechamento noturno", "Registre três linhas para encerrar o dia.", [
      '<section class="figma-night-hero"><span class="eyebrow">2 MINUTOS</span><h2>Feche o dia sem carregar tudo para amanhã.</h2><p>O registro vira histórico emocional e pode alimentar tarefas leves.</p><div class="chip-row">' + chip("sono") + chip("energia") + chip("aprendizado") + "</div></section>",
      '<form class="figma-profile-card night-form-card" data-local-form="entry"><label class="field"><span>Título</span><input name="titulo" value="Fechamento do dia"></label><label class="field"><span>O que pesou?</span><textarea name="conteudo">Hoje eu percebi o que pesou e o que me ajudou.</textarea></label><label class="field"><span>Tags</span><input name="tags" value="sono, energia, pausa"></label><button class="button primary full" type="submit">Salvar diário</button><a class="button secondary full" href="journal.html">Ver entradas</a></form>',
      figmaCard("Sugestões para amanhã", "Transforme o fechamento em um plano gentil.", '<div class="chip-row">' + chip("uma prioridade") + chip("pausa antes do foco") + chip("sem excesso") + "</div>", "night-next-card")
    ].join(""), "journal-night-template polished-template");
  }

  function moreTemplatePolished() {
    var settingsData = Storage.read(Storage.KEYS.settings, { nome: "Luana", focoPadrao: 25, pausasInteligentes: true, checkinDiario: true });
    var initials = (settingsData.nome || "Luana").slice(0, 1).toUpperCase();
    return figmaShell("Mais", "Acesse painéis, ajustes e recursos de fechamento.", [
      '<section class="figma-more-profile"><span class="avatar">' + h(initials) + '</span><div><h2>' + h(settingsData.nome || "Luana") + '</h2><p>Configurações, lembretes, metas e relatórios.</p></div><a class="figma-mini-action" href="settings.html">Editar</a></section>',
      '<section class="figma-shortcuts more-primary-actions"><a href="settings.html">Configurações</a><a href="reminders.html">Lembretes</a><a href="dashboard.html">Dashboard</a></section>',
      figmaCard("Sistema", "Ajuste o Plenna ao seu ritmo.", [
        figmaLine("Configurações", "Nome, foco padrão, pausas inteligentes e check-in diário.", chip("sistema"), '<a class="figma-mini-action" href="settings.html">Abrir</a>'),
        figmaLine("Lembretes personalizados", "Avisos locais para check-in, pausa, foco e hábitos.", chip("rotina"), '<a class="figma-mini-action" href="reminders.html">Abrir</a>'),
        figmaLine("Metas e conquistas", "Constância sem transformar cuidado em cobrança.", chip("bem-estar"), '<a class="figma-mini-action" href="goals.html">Ver</a>')
      ].join(""), "more-hub-card"),
      figmaCard("Dados e reflexão", "Histórico, exportação, diário e notas conectadas.", [
        figmaLine("Dashboard operacional", "Carga, tarefas, foco e hábitos.", chip("métricas"), '<a class="figma-mini-action" href="dashboard-operational.html">Ver</a>'),
        figmaLine("Exportar relatórios", "Baixe dados locais em JSON.", chip("local"), '<a class="figma-mini-action" href="export.html">Exportar</a>'),
        figmaLine("Diário e notas", "Registros que viram aprendizado, tarefa ou hábito.", chip("reflexão"), '<a class="figma-mini-action" href="journal.html">Abrir</a>')
      ].join(""), "more-report-card")
    ].join(""), "more-template polished-template");
  }

  function dashboardOperationalPolished() {
    var allTasks = tasks();
    var done = allTasks.filter(function (task) { return task.concluida; }).length;
    var open = allTasks.length - done;
    var delayed = allTasks.filter(function (task) { return task.adiada || task.status === "adiada"; }).length;
    var focusMinutes = focusTotalMinutes();
    var habitMarks = countHabitMarks(habits());
    var highEffort = allTasks.filter(function (task) { return String(task.esforco || "").toLowerCase().includes("alto"); }).length;
    var hasData = allTasks.length || focusMinutes || habitMarks;
    if (!hasData) return figmaShell("Dashboard operacional", "Carga, foco e tarefas por contexto.", emptyState("Dashboard operacional sem dados", "Faça alguns check-ins para liberar padrões da semana.", "Fazer check-in", "checkin.html"), "dashboard-operational-template polished-template");
    return figmaShell("Dashboard operacional", "Carga, foco e tarefas por contexto.", [
      '<section class="figma-metric-grid operational-metrics">' + metric(String(open), "abertas", "primary") + metric(String(done), "concluídas") + metric(String(focusMinutes) + "m", "foco total") + metric(String(habitMarks), "hábitos feitos") + "</section>",
      figmaCard("Carga por esforço", "Use a leitura operacional para reduzir excesso antes que vire urgência.", [
        '<div class="figma-load-row strong"><span>Alto</span><b style="background:linear-gradient(90deg,#bd7b2c ' + Math.min(90, highEffort * 24 + 18) + '%,#e7ecf1 0)"></b><em>' + h(highEffort) + '</em></div>',
        '<div class="figma-load-row"><span>Médio</span><b></b><em>' + h(Math.max(0, allTasks.length - highEffort - done)) + '</em></div>',
        '<div class="figma-load-row"><span>Adiado</span><b style="background:linear-gradient(90deg,#6ba6f0 ' + Math.min(90, delayed * 24 + 12) + '%,#e7ecf1 0)"></b><em>' + h(delayed) + '</em></div>'
      ].join(""), "figma-load-card"),
      figmaCard("Ações recomendadas", "", [
        figmaLine("Reduzir carga", "Adie uma tarefa pesada quando esforço alto passar do limite.", chip("planejamento"), '<a class="figma-mini-action" href="planning-adjust.html">Ajustar</a>'),
        figmaLine("Proteger foco", "Agrupe tarefas abertas em um bloco curto.", chip("foco"), '<a class="figma-mini-action" href="focus.html">Iniciar</a>'),
        figmaLine("Revisar tarefas", "Abra a lista para editar prazos, recorrência e lembretes.", chip("tarefas"), '<a class="figma-mini-action" href="tasks.html">Abrir</a>')
      ].join(""), "figma-operational-list")
    ].join(""), "dashboard-operational-template polished-template");
  }

  function exportTemplatePolished() {
    var modules = [
      [Storage.KEYS.checkins, "Check-ins", "Humor, energia e fatores"],
      [Storage.KEYS.tasks, "Tarefas", "Prioridades, prazos e subtarefas"],
      [Storage.KEYS.habits, "Hábitos", "Templates e registros por dia"],
      [Storage.KEYS.focusSessions, "Foco", "Sessões e duração"],
      [Storage.KEYS.entries, "Diário e notas", "Entradas conectadas"]
    ];
    if (!hasExportableData()) {
      return figmaShell("Exportar relatórios", "Escolha módulos para gerar um resumo local.", [
        emptyState("Exportação sem dados", "Ainda não há registros suficientes para exportar.", "Fazer check-in", "checkin.html"),
        figmaCard("O que entra no relatório", "Check-ins, tarefas, hábitos, foco, diário e notas ficam disponíveis quando houver uso.", '<div class="chip-row">' + chip("JSON local") + chip("sem servidor") + chip("privado") + "</div>", "figma-export-privacy")
      ].join(""), "export-template polished-template");
    }
    return figmaShell("Exportar relatórios", "Escolha módulos e baixe um relatório local.", [
      '<section class="figma-export-summary"><h2>Relatório local</h2><p>Nada é enviado para servidor. O arquivo é gerado no próprio navegador.</p><div class="chip-row">' + chip(Utils.todayISO()) + chip("JSON") + chip("privado") + "</div></section>",
      figmaCard("Módulos", "Selecione o que entra no arquivo.", modules.map(function (item) {
        return '<label class="figma-check-line"><span><strong>' + h(item[1]) + '</strong><small>' + h(item[2]) + ' · ' + moduleCount(item[0]) + ' registros</small></span><input type="checkbox" data-export-module="' + h(item[0]) + '" checked></label>';
      }).join(""), "figma-export-card"),
      figmaCard("Prévia", "O relatório preserva a estrutura dos dados para você abrir ou guardar depois.", '<pre class="export-preview">{ checkins, tarefas, habitos, foco, diario }</pre><button class="button primary full" type="button" data-export>Gerar relatório</button><a class="button secondary full" href="dashboard.html">Voltar</a>', "figma-export-privacy")
    ].join(""), "export-template polished-template");
  }

  function settingsTemplatePolished() {
    var settingsData = Storage.read(Storage.KEYS.settings, { nome: "Luana", focoPadrao: 25, pausasInteligentes: true, checkinDiario: true });
    var initial = (settingsData.nome || "L").charAt(0).toUpperCase();
    return figmaShell("Configurações", "Ajuste o sistema do Plenna sem perder contexto do seu dia.", [
      '<section class="figma-profile-card settings-summary-figma"><h2>Resumo do sistema</h2><div class="row"><span class="avatar">' + h(initial) + '</span><div><h3>' + h(settingsData.nome || "Luana Caroline") + '</h3><p>Modo atual: equilíbrio · foco leve · dia difícil automático</p></div><button class="figma-mini-action" type="button" data-edit-settings>Editar</button></div><div class="chip-row">' + chip(moduleCount(Storage.KEYS.reminders) + " lembretes ativos") + chip("foco leve · " + (settingsData.focoPadrao || 25) + " min") + "</div></section>",
      '<section class="figma-settings-list settings-list-figma">' +
        figmaLine("Check-in e lembretes", "08:30 em dias úteis · muda com contexto do dia", chip(settingsData.checkinDiario ? "ativo" : "pausado"), '<button class="button primary full" type="button" data-toggle-setting="checkinDiario">Editar</button>') +
        figmaLine("Pausas inteligentes", "ativas · entram antes quando a energia cai", chip(settingsData.pausasInteligentes ? "contextual" : "pausado"), '<button class="button primary full" type="button" data-toggle-setting="pausasInteligentes">Editar</button>') +
        figmaLine("Foco preferido", "leve · " + (settingsData.focoPadrao || 25) + " min com pausa guiada", chip("ativo"), '<button class="button primary full" type="button" data-edit-focus-default>Editar</button>') +
        figmaLine("Modo dia difícil", "automático · reduz cobrança e prioriza acolhimento", chip("protetivo"), '<button class="button primary full" type="button" data-toast="Modo protetivo ativado">Editar</button>') +
        figmaLine("Acessibilidade", "contraste, tamanho de texto e áreas de toque mais confortáveis", chip("legível"), '<a class="button primary full" href="reminders.html">Ver lembretes</a>') +
        figmaLine("Privacidade e exportação", "controle de dados, PDF e CSV simulados", chip("dados"), '<a class="button primary full" href="export.html">Exportar</a>') +
        figmaLine("Limpar dados locais", "Apaga apenas o armazenamento deste navegador.", chip("local"), '<button class="button secondary full" type="button" data-clear-local>Limpar</button>') +
      "</section>"
    ].join(""), "settings-template polished-template");
  }

  function remindersTemplatePolished() {
    var list = Storage.all(Storage.KEYS.reminders);
    var activeCount = list.filter(function (item) { return item.active !== false; }).length;
    var defaults = list.length ? list.slice(0, 4) : [
      { id: "demo-checkin", title: "Check-in", body: "08:30 em dias úteis. Se você atrasar o check-in, o app reduz a cobrança e volta a sugerir à tarde.", time: "08:30", active: true },
      { id: "demo-break", title: "Pausas inteligentes", body: "Depois de 50 min de foco. Em energia baixa, a pausa entra antes e com micro pausa sugerida.", time: "15:30", active: true },
      { id: "demo-habits", title: "Hábitos", body: "Hidratação avisa perto das 15h. Quando você cumpre a meta mínima, o lembrete fica mais leve.", time: "15:00", active: true },
      { id: "demo-silent", title: "Modo silencioso", body: "20:00 às 07:00. Em dia difícil, reduz lembretes não urgentes e prioriza acolhimento.", time: "20:00", active: true }
    ];
    return figmaShell("Lembretes personalizados", "Veja o que está ativo hoje e como os lembretes mudam com o contexto do dia.", [
      figmaCard("Resumo de hoje", "Modo atual: equilíbrio. O sistema mantém check-in cedo, pausa após foco e hidratação à tarde com intensidade diferente conforme sua energia.", '<div class="chip-row">' + chip((activeCount || 4) + " lembretes ativos") + chip("ajustado por energia") + chip("modo silencioso 20h") + "</div>", "figma-reminder-summary"),
      '<section class="figma-reminder-list reminders-list-figma">' + defaults.map(function (item) {
        var id = item.id || "";
        var quick = h([item.title, item.body, item.time].join("|"));
        var panelLabel = item.title === "Pausas inteligentes" ? "Ver micro pausas" : item.title === "Hábitos" ? "Ver histórico" : item.title === "Modo silencioso" ? "Ver foco" : "Ver painel";
        var badge = item.active === false ? "pausado" : item.title === "Pausas inteligentes" ? "baseado no contexto" : item.title === "Hábitos" ? "flexível" : item.title === "Modo silencioso" ? "ativo" : "ativo hoje";
        var actions = list.length ? '<div class="figma-reminder-actions"><button type="button" data-edit-reminder="' + h(id) + '">Editar</button><button type="button" data-toggle-reminder="' + h(id) + '">' + h(item.active === false ? "Ativar" : panelLabel) + '</button></div>' : '<div class="figma-reminder-actions"><button type="button" data-quick-reminder="' + quick + '">Editar</button><button type="button" data-quick-reminder="' + quick + '">' + h(panelLabel) + "</button></div>";
        return figmaLine(item.title, item.body, chip(badge), actions);
      }).join("") + "</section>",
      figmaCard("Lembretes conectados ao sistema", "Os lembretes mudam com energia, hábitos pendentes, foco do dia e modo difícil. Eles sugerem, não pressionam.", '<div class="row"><a class="button primary" href="settings.html">Ver configurações</a><a class="button secondary" href="micro-pauses.html">Ver micro pausas</a></div><form class="figma-inline-form figma-reminder-form compact-reminder-form" data-local-form="reminder"><input name="title" required placeholder="Novo lembrete"><input name="body" required placeholder="Mensagem"><div class="grid-2"><input name="time" type="time" value="09:00"><select name="active"><option value="true">Ativo</option><option value="false">Pausado</option></select></div><button class="button primary full" type="submit">Criar lembrete</button></form>', "figma-reminder-connected")
    ].join(""), "reminders-template polished-template");
  }

  function currentPeriod(storageKey, fallback) {
    return Storage.read(storageKey, fallback || "7");
  }

  function readDateValue(item) {
    var value = item.data || item.criadoEm || item.createdAt || item.concluidaEm || item.atualizadoEm || item.prazo || item.updatedAt;
    if (!value) return null;
    var date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00") : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function filterByPeriod(list, period) {
    if (period === "all" || period === "tudo") return list.slice();
    var days = Number(period || 7);
    var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Math.max(1, days));
    return list.filter(function (item) {
      var date = readDateValue(item);
      return date ? date >= cutoff : true;
    });
  }

  function periodTabs(storageKey, selected, attr) {
    return '<section class="figma-tabs period-tabs">' +
      '<button class="' + (selected === "7" ? "active" : "") + '" type="button" ' + attr + '="7">7 dias</button>' +
      '<button class="' + (selected === "30" ? "active" : "") + '" type="button" ' + attr + '="30">30 dias</button>' +
      '<button class="' + (selected === "all" ? "active" : "") + '" type="button" ' + attr + '="all">Tudo</button>' +
      "</section>";
  }

  calendarWeekTemplate = function () {
    var openTasks = tasks().filter(function (task) { return !task.concluida; });
    var selectedDay = Storage.read("selectedWeekDay", "14");
    var days = [
      ["S", "12", "leve"],
      ["T", "13", "foco"],
      ["Q", "14", "foco"],
      ["Q", "15", "agenda"],
      ["S", "16", "leve"],
      ["S", "17", ""],
      ["D", "18", ""]
    ];
    var selectedTasks = openTasks.filter(function (task, index) {
      if (!task.prazo && String(index === 0 ? "14" : index === 1 ? "15" : "16") === String(selectedDay)) return true;
      if (!task.prazo) return false;
      return String(new Date(task.prazo + "T12:00:00").getDate()) === String(selectedDay);
    });
    var planned = openTasks.length ? [
      ["09:00", openTasks[0] ? openTasks[0].titulo : "Preparar apresentação Q2", "Foco protegido com energia média.", "foco"],
      ["11:00", openTasks[2] ? openTasks[2].titulo : "Limpar inbox", "Bloco curto para pendências leves.", "leve"],
      ["14:00", openTasks[1] ? openTasks[1].titulo : "Reunião com cliente ABC", "Compromisso fixo na agenda.", "agenda"],
      ["15:30", "Pausa protegida", "Micro pausa antes do último bloco.", "cuidado"]
    ] : [];
    return figmaShell("Agenda", "Semana com tarefas, compromissos e carga visível.", [
      '<section class="figma-tabs"><button class="active" type="button">Semana</button><a href="calendar-month.html">Mês</a></section>',
      '<section class="figma-week-strip">' + days.map(function (day) {
        var cls = day[2] + (String(day[1]) === String(selectedDay) ? " active" : "");
        return '<button class="' + h(cls) + '" type="button" data-select-week-day="' + h(day[1]) + '"><span>' + h(day[0]) + '</span><strong>' + h(day[1]) + "</strong></button>";
      }).join("") + "</section>",
      planned.length ? figmaCard("Semana planejada", "Carga distribuída com foco, agenda e pausas visíveis.", planned.map(function (item) {
        return scheduleBlock(item[0], item[1], item[2], item[3]);
      }).join(""), "figma-schedule-card") : emptyState("Semana sem planejamento", "Defina prioridades, distribua carga e proteja pausas antes de começar.", "Planejar dia", "planning.html"),
      selectedTasks.length ? figmaCard("Dia " + selectedDay, "Toque em outro dia para ver detalhes e carga.", selectedTasks.map(function (task) {
        return figmaLine(task.titulo, (task.categoria || "Tarefa") + " · " + (task.tempoEstimado || "sem tempo"), chip(task.prioridade || "normal") + chip(task.esforco || "leve"), '<a class="figma-mini-action" href="task-edit.html?id=' + h(task.id) + '">Abrir</a>');
      }).join(""), "figma-day-card") : figmaCard("Calendário sem tarefas", "Este dia fica livre para pausa, revisão ou encaixar uma prioridade leve.", '<div class="chip-row">' + chip("sem excesso") + chip("dia flexível") + chip("cuidado") + "</div>", "figma-day-card"),
      figmaCard("Resumo da carga", "O dia mais cheio fica destacado para evitar excesso.", '<div class="figma-load-row"><span>Seg</span><b></b><em>leve</em></div><div class="figma-load-row strong"><span>Qua</span><b></b><em>alta</em></div><div class="figma-load-row"><span>Sex</span><b></b><em>média</em></div>', "figma-load-card")
    ].join(""), "agenda-week-template");
  };

  dashboardHistoryTemplate = function () {
    var period = currentPeriod("dashboardHistoryPeriod", "7");
    var checkins = filterByPeriod(Storage.all(Storage.KEYS.checkins), period);
    if (!checkins.length) return figmaShell("Histórico emocional", "Humor e energia registrados.", periodTabs("dashboardHistoryPeriod", period, "data-dashboard-period") + emptyState("Sem histórico emocional", "Faça alguns check-ins para liberar padrões da semana.", "Fazer check-in", "checkin.html"), "dashboard-history-template");
    var latest = checkins[0];
    var avgEnergy = Math.round(checkins.reduce(function (sum, item) { return sum + Number(item.energiaValor || 0); }, 0) / Math.max(1, checkins.length));
    var lowDays = checkins.filter(function (item) { return item.energia === "baixa" || item.humor === "ruim" || item.humor === "sensivel"; }).length;
    return figmaShell("Histórico emocional", "Humor, energia e fatores vistos em sequência.", [
      periodTabs("dashboardHistoryPeriod", period, "data-dashboard-period"),
      figmaCard("Último check-in", "Energia " + labelEnergy(latest) + " · " + labelMood(latest), '<div class="figma-history-chart">' + checkins.slice(0, 7).map(function (item) {
        var height = item.energiaValor ? item.energiaValor * 8 : 38;
        return '<span style="height:' + height + 'px"><b></b></span>';
      }).join("") + '</div><div class="chip-row">' + (latest.fatores || []).map(function (factor) { return chip(factor); }).join("") + "</div>", "figma-history-hero"),
      '<section class="figma-metric-grid">' + metric(String(checkins.length), "check-ins") + metric(String(avgEnergy) + "/10", "energia média") + metric(String(lowDays), "dias sensíveis") + "</section>",
      figmaCard("Leitura dos picos e quedas", lowDays ? "Quando energia cai, o app deve reduzir carga e proteger pausas antes de tarefas pesadas." : "Energia estável no período. Use foco longo nas manhãs e mantenha pausas curtas.", '<div class="chip-row">' + chip(lowDays ? "modo cuidado" : "ritmo estável") + chip("período aplicado") + "</div>", "figma-insight-card"),
      '<section class="figma-history-list">' + checkins.slice(0, 8).map(function (item) {
        return figmaLine(labelMood(item), Utils.formatDateTime(item.data) + " · energia " + labelEnergy(item), (item.fatores || []).slice(0, 2).map(function (factor) { return chip(factor); }).join(""), "");
      }).join("") + "</section>"
    ].join(""), "dashboard-history-template");
  };

  dashboardOperationalPolished = function () {
    var period = currentPeriod("dashboardOperationalPeriod", "7");
    var allTasks = filterByPeriod(tasks(), period);
    var allHabits = habits();
    var focusList = filterByPeriod(Storage.all(Storage.KEYS.focusSessions), period);
    var done = allTasks.filter(function (task) { return task.concluida; }).length;
    var open = allTasks.length - done;
    var delayed = allTasks.filter(function (task) { return task.adiada || task.status === "adiada"; }).length;
    var focusMinutes = focusList.reduce(function (sum, session) {
      return sum + Number(session.duracaoMinutos || Math.round((session.duracao || 0) / 60) || 0);
    }, 0);
    var habitMarks = countHabitMarks(allHabits);
    var highEffort = allTasks.filter(function (task) { return String(task.esforco || "").toLowerCase().includes("alto"); }).length;
    var hasData = allTasks.length || focusMinutes || habitMarks;
    if (!hasData) return figmaShell("Dashboard operacional", "Carga, foco e tarefas por contexto.", periodTabs("dashboardOperationalPeriod", period, "data-operational-period") + emptyState("Dashboard operacional sem dados", "Faça alguns check-ins para liberar padrões da semana.", "Fazer check-in", "checkin.html"), "dashboard-operational-template polished-template");
    return figmaShell("Dashboard operacional", "Carga, foco e tarefas por contexto.", [
      periodTabs("dashboardOperationalPeriod", period, "data-operational-period"),
      '<section class="figma-metric-grid operational-metrics">' + metric(String(open), "abertas", "primary") + metric(String(done), "concluídas") + metric(String(focusMinutes) + "m", "foco total") + metric(String(habitMarks), "hábitos feitos") + "</section>",
      figmaCard("Carga por esforço", "Use a leitura operacional para reduzir excesso antes que vire urgência.", [
        '<div class="figma-load-row strong"><span>Alto</span><b style="background:linear-gradient(90deg,#bd7b2c ' + Math.min(90, highEffort * 24 + 18) + '%,#e7ecf1 0)"></b><em>' + h(highEffort) + '</em></div>',
        '<div class="figma-load-row"><span>Médio</span><b></b><em>' + h(Math.max(0, allTasks.length - highEffort - done)) + '</em></div>',
        '<div class="figma-load-row"><span>Adiado</span><b style="background:linear-gradient(90deg,#6ba6f0 ' + Math.min(90, delayed * 24 + 12) + '%,#e7ecf1 0)"></b><em>' + h(delayed) + '</em></div>'
      ].join(""), "figma-load-card"),
      figmaCard("Ações recomendadas", "", [
        figmaLine("Reduzir carga", "Adie uma tarefa pesada quando esforço alto passar do limite.", chip("planejamento"), '<a class="figma-mini-action" href="planning-adjust.html">Ajustar</a>'),
        figmaLine("Proteger foco", "Agrupe tarefas abertas em um bloco curto.", chip("foco"), '<a class="figma-mini-action" href="focus.html">Iniciar</a>'),
        figmaLine("Revisar tarefas", "Abra a lista para editar prazos, recorrência e lembretes.", chip("tarefas"), '<a class="figma-mini-action" href="tasks.html">Abrir</a>')
      ].join(""), "figma-operational-list")
    ].join(""), "dashboard-operational-template polished-template");
  };

  exportTemplatePolished = function () {
    var period = currentPeriod("exportPeriod", "7");
    var modules = [
      [Storage.KEYS.checkins, "Check-ins", "Humor, energia e fatores"],
      [Storage.KEYS.tasks, "Tarefas", "Prioridades, prazos e subtarefas"],
      [Storage.KEYS.habits, "Hábitos", "Templates e registros por dia"],
      [Storage.KEYS.focusSessions, "Foco", "Sessões e duração"],
      [Storage.KEYS.entries, "Diário e notas", "Entradas conectadas"]
    ];
    if (!hasExportableData()) {
      return figmaShell("Exportar relatórios", "Escolha módulos para gerar um resumo local.", [
        periodTabs("exportPeriod", period, "data-export-period"),
        emptyState("Exportação sem dados", "Ainda não há registros suficientes para exportar.", "Fazer check-in", "checkin.html"),
        figmaCard("O que entra no relatório", "Check-ins, tarefas, hábitos, foco, diário e notas ficam disponíveis quando houver uso.", '<div class="chip-row">' + chip("JSON local") + chip("sem servidor") + chip("privado") + "</div>", "figma-export-privacy")
      ].join(""), "export-template polished-template");
    }
    return figmaShell("Exportar relatórios", "Escolha período, módulos e baixe um relatório local.", [
      '<section class="figma-export-summary"><h2>Relatório local</h2><p>Nada é enviado para servidor. O arquivo é gerado no próprio navegador.</p><div class="chip-row">' + chip(Utils.todayISO()) + chip("JSON") + chip("privado") + "</div></section>",
      periodTabs("exportPeriod", period, "data-export-period"),
      figmaCard("Módulos", "Selecione o que entra no arquivo.", modules.map(function (item) {
        return '<label class="figma-check-line"><span><strong>' + h(item[1]) + '</strong><small>' + h(item[2]) + ' · ' + filterByPeriod(Storage.all(item[0]), period).length + ' registros no período</small></span><input type="checkbox" data-export-module="' + h(item[0]) + '" checked></label>';
      }).join(""), "figma-export-card"),
      figmaCard("Prévia", "O relatório preserva a estrutura dos dados para você abrir ou guardar depois.", '<pre class="export-preview">{ periodo: "' + h(period) + '", checkins, tarefas, habitos, foco, diario }</pre><button class="button primary full" type="button" data-export>Gerar relatório</button><a class="button secondary full" href="dashboard.html">Voltar</a>', "figma-export-privacy")
    ].join(""), "export-template polished-template");
  };

  goalsTemplate = function () {
    var state = Storage.read("goalsState", {});
    var checkins = Storage.all(Storage.KEYS.checkins);
    var habitMarks = countHabitMarks(habits());
    var focusMinutes = focusTotalMinutes();
    var entriesCount = entries().length;
    var goals = [
      ["checkin7", "Meta 7 dias", "Check-ins suficientes para enxergar o ritmo da semana.", checkins.length, 7, "green"],
      ["focus120", "Foco protegido", "Sessões somando duas horas sem perder pausas.", focusMinutes, 120, "blue"],
      ["habits10", "Hábitos gentis", "Marcar hábitos sem transformar cuidado em cobrança.", habitMarks, 10, "green"],
      ["journal3", "Diário ativo", "Três registros para reconhecer padrões reais.", entriesCount, 3, "amber"]
    ];
    return figmaShell("Metas e conquistas", "Celebre constância sem transformar cuidado em pressão.", [
      goals.map(function (goal) {
        var done = state[goal[0]] || goal[3] >= goal[4];
        return figmaProgress(goal[1], goal[2], Math.min(goal[3], goal[4]) + "/" + goal[4], Math.min(100, goal[3] / goal[4] * 100), goal[5]) +
          '<button class="button secondary full goal-action" type="button" data-goal-action="' + h(goal[0]) + '">' + h(done ? "Conquista registrada" : "Registrar manualmente") + "</button>";
      }).join(""),
      figmaCard("Badges", "Conquistas leves, ligadas a cuidado e consistência.", '<div class="figma-badges"><span class="' + (state.checkin7 ? "active" : "") + '">Semana com pausas</span><span class="' + (state.focus120 ? "active" : "") + '">Foco protegido</span><span class="' + (state.journal3 ? "active" : "") + '">Diário ativo</span><span>' + h(habitMarks + " hábitos") + "</span></div>", "figma-badges-card"),
      figmaCard("Feedback", "Use metas como sinal de direção. Quando a energia cair, o app recomenda reduzir carga em vez de insistir.", '<div class="row"><a class="button primary" href="dashboard.html">Ver dashboard</a><button class="button secondary" type="button" data-goal-reset>Revisar metas</button></div>', "figma-feedback-card")
    ].join(""), "goals-template");
  };

  var screens = {
    "checkin-success": checkinSuccess,
    "planning-adjust": planningAdjustPolished,
    "calendar-week": calendarWeekTemplate,
    "calendar-month": calendarMonthTemplate,
    "habit-new": function () { return habitFormPolished("new"); },
    "habit-edit": function () { return habitFormPolished("edit"); },
    "habit-templates": habitTemplates,
    "micro-pauses": microPausesTemplate,
    "focus-session": focusSession,
    "focus-break": focusBreakPolished,
    "journal-night": journalNightPolished,
    "notes": notesTemplate,
    "more": moreTemplatePolished,
    "dashboard": dashboardTemplate,
    "dashboard-history": dashboardHistoryTemplate,
    "dashboard-operational": dashboardOperationalPolished,
    "export": exportTemplatePolished,
    "export-success": exportSuccessTemplate,
    "export-ready": exportReadyCleanTemplate,
    "goals": goalsTemplate,
    "settings": settingsTemplatePolished,
    "reminders": remindersTemplatePolished,
    "empty-states": emptyStates,
    "onboarding": onboarding,
    "prototype-overview": prototypeOverviewClean,
    "checkin-states": checkinStatesCleanTemplate
  };

  function bindActions(root) {
    function refreshScreen(message, options) {
      root.innerHTML = screens[document.body.dataset.screen]();
      if (message) Utils.notify(message, options || { kind: "success" });
    }

    root.addEventListener("click", function (event) {
      var toastButton = event.target.closest("[data-toast]");
      if (toastButton) Utils.notify(toastButton.dataset.toast, { kind: "success" });

      var exportButton = event.target.closest("[data-export]");
      if (exportButton) {
        var modules = Array.prototype.slice.call(root.querySelectorAll("[data-export-module]:checked")).map(function (input) { return input.dataset.exportModule; });
        var period = Storage.read("exportPeriod", "7");
        var payload = {};
        modules.forEach(function (key) { payload[key] = filterByPeriod(Storage.all(key), period); });
        var hasData = modules.some(function (key) { return payload[key].length; });
        if (!modules.length || !hasData) {
          Utils.showError(!modules.length ? "Selecione ao menos um módulo para exportar." : "Exportação sem dados no período selecionado.");
          return;
        }
        var content = JSON.stringify({ geradoEm: new Date().toISOString(), periodo: period, modulos: modules, dados: payload }, null, 2);
        var fileName = "plenna-relatorio-" + Utils.todayISO() + ".json";
        downloadText(fileName, content);
        Storage.add(Storage.KEYS.exports, { id: Utils.uid("export"), data: new Date().toISOString(), tipo: "relatório local", nomeArquivo: fileName, conteudo: content });
        Utils.notify("Relatório exportado com sucesso.", { kind: "success" });
        window.setTimeout(function () { window.location.href = "export-success.html"; }, 300);
      }

      var downloadExport = event.target.closest("[data-download-export]");
      if (downloadExport) {
        var latestExport = Storage.all(Storage.KEYS.exports)[0];
        if (latestExport) downloadText(latestExport.nomeArquivo, latestExport.conteudo);
      }

      var editSettings = event.target.closest("[data-edit-settings]");
      if (editSettings) {
        var currentSettings = Storage.read(Storage.KEYS.settings, { nome: "Luana", focoPadrao: 25, pausasInteligentes: true, checkinDiario: true });
        var nextName = window.prompt("Nome", currentSettings.nome || "Luana") || currentSettings.nome || "Luana";
        Storage.write(Storage.KEYS.settings, Object.assign({}, currentSettings, { nome: nextName }));
        refreshScreen("Configuração alterada.", { kind: "success" });
      }

      var toggleSetting = event.target.closest("[data-toggle-setting]");
      if (toggleSetting) {
        var storedSettings = Storage.read(Storage.KEYS.settings, { nome: "Luana", focoPadrao: 25, pausasInteligentes: true, checkinDiario: true });
        var key = toggleSetting.dataset.toggleSetting;
        storedSettings[key] = !storedSettings[key];
        Storage.write(Storage.KEYS.settings, storedSettings);
        refreshScreen("Configuração alterada.", { kind: "success" });
      }

      var editFocusDefault = event.target.closest("[data-edit-focus-default]");
      if (editFocusDefault) {
        var focusSettings = Storage.read(Storage.KEYS.settings, { nome: "Luana", focoPadrao: 25, pausasInteligentes: true, checkinDiario: true });
        var nextFocus = Number(window.prompt("Duração padrão do foco em minutos", focusSettings.focoPadrao || 25) || focusSettings.focoPadrao || 25);
        Storage.write(Storage.KEYS.settings, Object.assign({}, focusSettings, { focoPadrao: Math.max(5, Math.min(120, nextFocus)) }));
        refreshScreen("Configuração alterada. Foco padrão atualizado.", { kind: "success" });
      }

      var adjustKind = event.target.closest("[data-adjust-kind]");
      if (adjustKind) {
        var current = Storage.read("planningAdjustments", {});
        var kind = adjustKind.dataset.adjustKind;
        var block = adjustKind.dataset.adjustBlock || "global";
        var blocks = Object.assign({}, current.blocks || {});
        blocks[block] = { kind: kind, block: block, badge: kind === "carga" ? "reduzido" : kind === "horario" ? "movido" : kind === "pausa" ? "travado" : "fixo", updatedAt: new Date().toISOString() };
        current.blocks = blocks;
        if (kind === "carga") current.cargaReduzida = true;
        if (kind === "horario") current.horarioTrocado = true;
        if (kind === "pausa") current.pausaProtegida = true;
        if (kind === "prioridade") current.prioridadeProtegida = true;
        current.summary = kind === "carga" ? "Carga reduzida + tarefa pesada amanhã" : kind === "horario" ? "Foco movido para 10h" : kind === "pausa" ? "Pausa protegida" : "Essencial protegido";
        current.motivo = "Ajuste bloco-a-bloco aplicado pelo planejamento.";
        current.conflito = "Conflito resolvido com redistribuição de carga, horário ou pausa.";
        current.pausaProtegida = true;
        current.atualizadoEm = new Date().toISOString();
        Storage.write("planningAdjustments", current);
        refreshScreen("Bloco ajustado no planejamento.", { kind: "success" });
      }

      var saveAdjust = event.target.closest("[data-save-adjust]");
      if (saveAdjust) {
        var adjustment = Storage.read("planningAdjustments", {});
        Storage.write("planningAdjustments", Object.assign({}, adjustment, { salvo: true, atualizadoEm: new Date().toISOString() }));
        Utils.notify("Planejamento salvo. Seu dia foi atualizado.", { kind: "success" });
        window.setTimeout(function () { window.location.href = "planning.html"; }, 350);
      }

      var selectDay = event.target.closest("[data-select-day]");
      if (selectDay) {
        Storage.write("selectedCalendarDay", Number(selectDay.dataset.selectDay));
        root.innerHTML = screens[document.body.dataset.screen]();
      }

      var selectWeekDay = event.target.closest("[data-select-week-day]");
      if (selectWeekDay) {
        Storage.write("selectedWeekDay", selectWeekDay.dataset.selectWeekDay);
        root.innerHTML = screens[document.body.dataset.screen]();
      }

      var dashboardPeriod = event.target.closest("[data-dashboard-period]");
      if (dashboardPeriod) {
        Storage.write("dashboardHistoryPeriod", dashboardPeriod.dataset.dashboardPeriod);
        root.innerHTML = screens[document.body.dataset.screen]();
      }

      var operationalPeriod = event.target.closest("[data-operational-period]");
      if (operationalPeriod) {
        Storage.write("dashboardOperationalPeriod", operationalPeriod.dataset.operationalPeriod);
        root.innerHTML = screens[document.body.dataset.screen]();
      }

      var exportPeriod = event.target.closest("[data-export-period]");
      if (exportPeriod) {
        Storage.write("exportPeriod", exportPeriod.dataset.exportPeriod);
        root.innerHTML = screens[document.body.dataset.screen]();
      }

      var goalAction = event.target.closest("[data-goal-action]");
      if (goalAction) {
        var goalsState = Storage.read("goalsState", {});
        goalsState[goalAction.dataset.goalAction] = true;
        goalsState.updatedAt = new Date().toISOString();
        Storage.write("goalsState", goalsState);
        refreshScreen("Conquista registrada. Metas atualizadas.", { kind: "success" });
      }

      var goalReset = event.target.closest("[data-goal-reset]");
      if (goalReset) {
        Storage.write("goalsState", {});
        refreshScreen("Metas revisadas.", { kind: "warning" });
      }
    });

    root.addEventListener("submit", function (event) {
      var form = event.target.closest("[data-local-form]");
      if (!form) return;
      event.preventDefault();
      var data = new FormData(form);
      if (form.dataset.localForm === "habit") {
        var habit = {
          id: form.dataset.habitId || Utils.uid("habit"),
          nome: data.get("nome"),
          categoria: data.get("categoria"),
          frequencia: data.get("frequencia"),
          metaMinima: data.get("metaMinima"),
          registrosPorData: form.dataset.habitId ? (Storage.find(Storage.KEYS.habits, form.dataset.habitId) || {}).registrosPorData || {} : {},
          criadoEm: new Date().toISOString()
        };
        Storage.replace(Storage.KEYS.habits, habit);
        Utils.notify(form.dataset.habitId ? "Hábito atualizado. Rotina sincronizada." : "Hábito criado. Ele aparece em Hoje.", { kind: "success" });
        window.setTimeout(function () { window.location.href = "habits.html"; }, 300);
      }
      if (form.dataset.localForm === "entry" || form.dataset.localForm === "note") {
        Storage.add(Storage.KEYS.entries, {
          id: Utils.uid("entry"),
          tipo: form.dataset.localForm === "note" ? "nota" : "diario",
          titulo: data.get("titulo"),
          conteudo: data.get("conteudo"),
          data: new Date().toISOString(),
          tags: String(data.get("tags") || "").split(",").map(function (tag) { return tag.trim(); }).filter(Boolean)
        });
        Utils.notify(form.dataset.localForm === "note" ? "Nota salva. Caixa de notas atualizada." : "Registro salvo. Diário atualizado.", { kind: "success" });
        window.setTimeout(function () { window.location.href = form.dataset.localForm === "note" ? "notes.html" : "journal.html"; }, 300);
      }
      if (form.dataset.localForm === "settings") {
        Storage.write(Storage.KEYS.settings, {
          nome: data.get("nome") || "Luana",
          focoPadrao: Number(data.get("focoPadrao") || 25),
          pausasInteligentes: Boolean(data.get("pausasInteligentes")),
          checkinDiario: Boolean(data.get("checkinDiario"))
        });
        refreshScreen("Configuração alterada.", { kind: "success" });
      }
      if (form.dataset.localForm === "reminder") {
        Storage.add(Storage.KEYS.reminders, {
          id: Utils.uid("reminder"),
          title: data.get("title"),
          body: data.get("body"),
          time: data.get("time"),
          active: data.get("active") === "true",
          createdAt: new Date().toISOString()
        });
        refreshScreen("Lembrete criado.", { kind: "success" });
      }
    });

    root.addEventListener("click", function (event) {
      var deleteHabit = event.target.closest("[data-delete-habit]");
      if (deleteHabit) {
        if (!window.confirm("Excluir este hábito dos dados locais?")) return;
        Storage.remove(Storage.KEYS.habits, deleteHabit.dataset.deleteHabit);
        Utils.notify("Hábito excluído.", { kind: "warning" });
        window.setTimeout(function () { window.location.href = "habits.html"; }, 300);
      }

      var templateHabit = event.target.closest("[data-template-habit]");
      if (templateHabit) {
        var parts = templateHabit.dataset.templateHabit.split("|");
        Storage.add(Storage.KEYS.habits, { id: Utils.uid("habit"), nome: parts[0], categoria: parts[1], frequencia: "Diário", metaMinima: parts[2], registrosPorData: {}, criadoEm: new Date().toISOString() });
        Utils.notify("Template adicionado aos seus hábitos.", { kind: "success" });
      }

      var quickReminder = event.target.closest("[data-quick-reminder]");
      if (quickReminder) {
        var reminderParts = quickReminder.dataset.quickReminder.split("|");
        Storage.add(Storage.KEYS.reminders, {
          id: Utils.uid("reminder"),
          title: reminderParts[0],
          body: reminderParts[1],
          time: reminderParts[2],
          active: true,
          createdAt: new Date().toISOString()
        });
        refreshScreen("Lembrete criado.", { kind: "success" });
      }

      var noteTask = event.target.closest("[data-note-task]");
      if (noteTask) {
        var entryTask = Storage.find(Storage.KEYS.entries, noteTask.dataset.noteTask);
        if (entryTask) {
          Storage.add(Storage.KEYS.tasks, { id: Utils.uid("task"), titulo: entryTask.titulo, descricao: entryTask.conteudo, prioridade: "media", esforco: "baixo", tempoEstimado: "25 min", impactoEmocional: "neutro", prazo: "", categoria: "Notas", concluida: false, recorrencia: "Sem recorrência", lembrete: "Sem lembrete", subtarefas: [], criadoEm: new Date().toISOString(), ordem: Storage.all(Storage.KEYS.tasks).length });
          Utils.notify("Nota virou tarefa. Ela entrou na sua lista.", { kind: "success" });
        }
      }

      var noteHabit = event.target.closest("[data-note-habit]");
      if (noteHabit) {
        var entryHabit = Storage.find(Storage.KEYS.entries, noteHabit.dataset.noteHabit);
        if (entryHabit) {
          Storage.add(Storage.KEYS.habits, { id: Utils.uid("habit"), nome: entryHabit.titulo, categoria: "Mente", frequencia: "Diário", metaMinima: "2 min", registrosPorData: {}, criadoEm: new Date().toISOString() });
          Utils.notify("Nota virou hábito. Ele aparece em Hoje.", { kind: "success" });
        }
      }

      var clearLocal = event.target.closest("[data-clear-local]");
      if (clearLocal && window.confirm("Isso apaga os dados locais do Plenna neste navegador. Continuar?")) {
        Storage.clearAppData();
        refreshScreen("Dados locais limpos.", { kind: "warning" });
      }

      var toggleReminder = event.target.closest("[data-toggle-reminder]");
      if (toggleReminder) {
        var reminder = Storage.find(Storage.KEYS.reminders, toggleReminder.dataset.toggleReminder);
        if (!reminder) return;
        Storage.update(Storage.KEYS.reminders, reminder.id, { active: reminder.active === false });
        refreshScreen(reminder.active === false ? "Lembrete ativado." : "Lembrete pausado.", { kind: reminder.active === false ? "success" : "warning" });
      }

      var removeReminder = event.target.closest("[data-remove-reminder]");
      if (removeReminder) {
        if (!window.confirm("Remover este lembrete dos dados locais?")) return;
        Storage.remove(Storage.KEYS.reminders, removeReminder.dataset.removeReminder);
        refreshScreen("Lembrete removido.", { kind: "warning" });
      }

      var editReminder = event.target.closest("[data-edit-reminder]");
      if (editReminder) {
        var item = Storage.find(Storage.KEYS.reminders, editReminder.dataset.editReminder);
        if (item) {
          var nextTitle = window.prompt("Título do lembrete", item.title) || item.title;
          var nextBody = window.prompt("Mensagem", item.body) || item.body;
          Storage.update(Storage.KEYS.reminders, item.id, { title: nextTitle, body: nextBody });
          refreshScreen("Lembrete editado.", { kind: "success" });
        }
      }
    });
  }

  function downloadText(fileName, content) {
    var blob = new Blob([content], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.querySelector("[data-screen-root]");
    var key = document.body.dataset.screen;
    if (!root || !key || !screens[key]) return;
    root.innerHTML = screens[key]();
    bindActions(root);
  });
})();
