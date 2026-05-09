(function () {
  "use strict";

  var PREFIX = "plenna:";
  var KEYS = {
    checkins: "checkins",
    tasks: "tasks",
    focusSessions: "focusSessions",
    habits: "habits",
    entries: "entries",
    settings: "settings",
    reminders: "reminders",
    exports: "exports"
  };
  var DEMO_STATE_KEY = "demoSeedState";
  var DEMO_VERSION = "2026-04-29-v2";

  function fullKey(key) {
    return PREFIX + key;
  }

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(fullKey(key));
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn("Falha ao ler localStorage", key, error);
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(fullKey(key), JSON.stringify(value));
    return value;
  }

  function all(key) {
    return read(key, []);
  }

  function setAll(key, items) {
    return write(key, items);
  }

  function add(key, item) {
    var items = all(key);
    items.unshift(item);
    setAll(key, items);
    return item;
  }

  function update(key, id, patch) {
    var updatedItem = null;
    var items = all(key).map(function (item) {
      if (String(item.id) !== String(id)) return item;
      updatedItem = Object.assign({}, item, patch);
      return updatedItem;
    });
    setAll(key, items);
    return updatedItem;
  }

  function replace(key, nextItem) {
    var found = false;
    var items = all(key).map(function (item) {
      if (String(item.id) !== String(nextItem.id)) return item;
      found = true;
      return nextItem;
    });
    if (!found) items.unshift(nextItem);
    setAll(key, items);
    return nextItem;
  }

  function find(key, id) {
    return all(key).find(function (item) {
      return String(item.id) === String(id);
    });
  }

  function latest(key) {
    var items = all(key).slice();
    items.sort(function (a, b) {
      return new Date(b.data || b.criadoEm || b.createdAt || 0) - new Date(a.data || a.criadoEm || a.createdAt || 0);
    });
    return items[0] || null;
  }

  function remove(key, id) {
    var items = all(key).filter(function (item) {
      return String(item.id) !== String(id);
    });
    setAll(key, items);
  }

  function dateOnly(offset) {
    var date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  }

  function dateTime(offset, hour, minute) {
    var date = new Date();
    date.setHours(hour, minute || 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date.toISOString();
  }

  function hasExistingActivity() {
    return [
      KEYS.checkins,
      KEYS.tasks,
      KEYS.focusSessions,
      KEYS.habits,
      KEYS.entries,
      KEYS.reminders,
      KEYS.exports
    ].some(function (key) {
      var value = read(key, []);
      return Array.isArray(value) && value.length > 0;
    });
  }

  function buildDemoData() {
    var today = dateOnly(0);
    var tomorrow = dateOnly(1);
    var nextWeek = dateOnly(5);
    var yesterday = dateOnly(-1);
    var twoDaysAgo = dateOnly(-2);
    var threeDaysAgo = dateOnly(-3);

    var tasks = [
      {
        id: "demo-task-q2",
        titulo: "Preparar apresentação Q2",
        descricao: "Consolidar resultados, riscos e próximos passos em uma narrativa clara para a reunião.",
        prioridade: "alta",
        esforco: "medio",
        tempoEstimado: "45 min",
        figmaDue: "hoje 14h",
        figmaBadge: "Recomendada",
        impactoEmocional: "positivo",
        prazo: today,
        categoria: "Trabalho",
        projeto: "Resultados Q2",
        concluida: false,
        recorrencia: "Sem recorrência",
        lembrete: "1 hora antes",
        subtarefas: ["Revisar métricas", "Montar slides finais", "Separar próximos passos"],
        criadoEm: dateTime(-2, 9, 20),
        ordem: 0
      },
      {
        id: "demo-task-contract",
        titulo: "Revisar contrato cliente X",
        descricao: "Checar cláusulas de prazo, escopo e reajuste antes de enviar comentários.",
        prioridade: "alta",
        esforco: "alto",
        tempoEstimado: "60 min",
        figmaDue: "amanhã",
        figmaBadge: "Pesada hoje",
        impactoEmocional: "pesado",
        prazo: tomorrow,
        categoria: "Cliente",
        projeto: "Conta X",
        concluida: false,
        recorrencia: "Sem recorrência",
        lembrete: "No prazo",
        subtarefas: ["Ler cláusulas críticas", "Marcar dúvidas", "Enviar revisão"],
        adiada: true,
        criadoEm: dateTime(-1, 15, 10),
        ordem: 1
      },
      {
        id: "demo-task-inbox",
        titulo: "Limpar inbox",
        descricao: "Responder apenas mensagens rápidas e transformar pendências maiores em tarefas.",
        prioridade: "baixa",
        esforco: "baixo",
        tempoEstimado: "10 min",
        figmaDue: "sem prazo",
        figmaBadge: "Boa agora",
        impactoEmocional: "leve",
        prazo: "",
        categoria: "Admin",
        projeto: "Rotina",
        concluida: false,
        recorrencia: "Dias úteis",
        lembrete: "10 min antes",
        subtarefas: [],
        criadoEm: dateTime(0, 8, 40),
        ordem: 2
      },
      {
        id: "demo-task-followup",
        titulo: "Enviar follow-up da reunião ABC",
        descricao: "Mandar resumo com decisões, responsáveis e data do próximo alinhamento.",
        prioridade: "media",
        esforco: "baixo",
        tempoEstimado: "20 min",
        impactoEmocional: "neutro",
        prazo: today,
        categoria: "Cliente",
        projeto: "ABC",
        concluida: false,
        recorrencia: "Sem recorrência",
        lembrete: "No prazo",
        subtarefas: ["Listar decisões", "Conferir responsáveis"],
        criadoEm: dateTime(0, 10, 15),
        ordem: 3
      },
      {
        id: "demo-task-notes",
        titulo: "Organizar notas da semana",
        descricao: "Separar ideias que viram tarefa, hábito ou aprendizado.",
        prioridade: "baixa",
        esforco: "baixo",
        tempoEstimado: "25 min",
        impactoEmocional: "positivo",
        prazo: nextWeek,
        categoria: "Planejamento",
        projeto: "Sistema pessoal",
        concluida: false,
        recorrencia: "Sem recorrência",
        lembrete: "Sem lembrete",
        subtarefas: ["Agrupar notas", "Criar ações"],
        criadoEm: dateTime(-3, 17, 5),
        ordem: 4
      },
      {
        id: "demo-task-complete",
        titulo: "Pagar assinatura do software",
        descricao: "Registro concluído para popular histórico e dashboard.",
        prioridade: "baixa",
        esforco: "baixo",
        tempoEstimado: "10 min",
        impactoEmocional: "leve",
        prazo: yesterday,
        categoria: "Financeiro",
        projeto: "Casa",
        concluida: true,
        concluidaEm: dateTime(-1, 16, 45),
        recorrencia: "Mensal",
        lembrete: "1 dia antes",
        subtarefas: ["Conferir cobrança"],
        criadoEm: dateTime(-4, 11, 30),
        ordem: 5
      }
    ];

    [
      {
        id: "demo-home-report",
        titulo: "Revisar relatório mensal",
        descricao: "Conferir indicadores e fechar observações principais.",
        prioridade: "alta",
        esforco: "medio",
        tempoEstimado: "30 min",
        impactoEmocional: "neutro",
        prazo: today,
        categoria: "Trabalho",
        projeto: "Rotina mensal",
        concluida: false,
        recorrencia: "Mensal",
        lembrete: "No prazo",
        subtarefas: ["Conferir números", "Anotar próximos passos"],
        criadoEm: dateTime(-1, 9, 0),
        ordem: 6,
        homePriority: true,
        homePriorityOrder: 0
      },
      {
        id: "demo-home-cardio",
        titulo: "Treino cardio e alongamento",
        descricao: "Movimento leve para sustentar energia.",
        prioridade: "media",
        esforco: "baixo",
        tempoEstimado: "35 min",
        impactoEmocional: "positivo",
        prazo: today,
        categoria: "Saúde",
        projeto: "Autocuidado",
        concluida: false,
        recorrencia: "Semanal",
        lembrete: "1 hora antes",
        subtarefas: [],
        criadoEm: dateTime(-1, 10, 0),
        ordem: 7,
        homePriority: true,
        homePriorityOrder: 1
      },
      {
        id: "demo-home-dentist",
        titulo: "Ligar para a dentista",
        descricao: "Confirmar horário e reagendar se necessário.",
        prioridade: "baixa",
        esforco: "baixo",
        tempoEstimado: "10 min",
        impactoEmocional: "leve",
        prazo: "",
        categoria: "Pessoal",
        projeto: "Saúde",
        concluida: false,
        recorrencia: "Sem recorrência",
        lembrete: "Sem lembrete",
        subtarefas: [],
        criadoEm: dateTime(-1, 11, 0),
        ordem: 8,
        homePriority: true,
        homePriorityOrder: 2
      }
    ].forEach(function (task) {
      tasks.push(task);
    });

    for (var inboxIndex = 1; inboxIndex <= 6; inboxIndex += 1) {
      tasks.push({
        id: "demo-inbox-" + inboxIndex,
        titulo: "Captura rápida " + inboxIndex,
        descricao: "Item de caixa de entrada para classificar depois.",
        prioridade: inboxIndex % 2 ? "media" : "baixa",
        esforco: "baixo",
        tempoEstimado: "10 min",
        impactoEmocional: "neutro",
        prazo: "",
        categoria: inboxIndex % 2 ? "Admin" : "Pessoal",
        projeto: "Caixa de entrada",
        concluida: false,
        recorrencia: "Sem recorrência",
        lembrete: "Sem lembrete",
        subtarefas: [],
        criadoEm: dateTime(-2, 8 + inboxIndex, 0),
        ordem: 20 + inboxIndex
      });
    }

    for (var todayIndex = 1; todayIndex <= 2; todayIndex += 1) {
      tasks.push({
        id: "demo-today-" + todayIndex,
        titulo: todayIndex === 1 ? "Separar pauta da reunião" : "Responder pendências curtas",
        descricao: "Tarefa demo para manter a contagem do protótipo.",
        prioridade: "media",
        esforco: "baixo",
        tempoEstimado: todayIndex === 1 ? "20 min" : "15 min",
        impactoEmocional: "leve",
        prazo: today,
        categoria: "Trabalho",
        projeto: "Rotina",
        concluida: false,
        recorrencia: "Sem recorrência",
        lembrete: "No prazo",
        subtarefas: [],
        criadoEm: dateTime(-1, 12 + todayIndex, 10),
        ordem: 30 + todayIndex
      });
    }

    for (var upcomingIndex = 1; upcomingIndex <= 12; upcomingIndex += 1) {
      tasks.push({
        id: "demo-upcoming-" + upcomingIndex,
        titulo: "Próxima ação planejada " + upcomingIndex,
        descricao: "Tarefa futura usada para preencher a agenda e o contador do frame.",
        prioridade: upcomingIndex % 3 === 0 ? "alta" : "media",
        esforco: upcomingIndex % 4 === 0 ? "alto" : "medio",
        tempoEstimado: upcomingIndex % 2 ? "25 min" : "40 min",
        impactoEmocional: "neutro",
        prazo: dateOnly(1 + upcomingIndex),
        categoria: upcomingIndex % 2 ? "Trabalho" : "Pessoal",
        projeto: "Semana",
        concluida: false,
        recorrencia: "Sem recorrência",
        lembrete: upcomingIndex % 2 ? "Sem lembrete" : "1 dia antes",
        subtarefas: [],
        criadoEm: dateTime(-3, 9, upcomingIndex),
        ordem: 40 + upcomingIndex
      });
    }

    for (var doneIndex = 1; doneIndex <= 21; doneIndex += 1) {
      tasks.push({
        id: "demo-done-" + doneIndex,
        titulo: "Tarefa concluída " + doneIndex,
        descricao: "Histórico demo para dashboard e aba de concluídas.",
        prioridade: "baixa",
        esforco: "baixo",
        tempoEstimado: "10 min",
        impactoEmocional: "leve",
        prazo: dateOnly(-doneIndex),
        categoria: doneIndex % 2 ? "Admin" : "Pessoal",
        projeto: "Histórico",
        concluida: true,
        concluidaEm: dateTime(-doneIndex, 16, 0),
        recorrencia: "Sem recorrência",
        lembrete: "Sem lembrete",
        subtarefas: [],
        criadoEm: dateTime(-doneIndex - 1, 10, 0),
        ordem: 80 + doneIndex
      });
    }

    var habits = [
      {
        id: "demo-habit-water",
        nome: "Hidratação",
        categoria: "Corpo",
        frequencia: "Diário",
        metaMinima: "4 copos",
        registrosPorData: demoHabitDays([today, yesterday, twoDaysAgo, threeDaysAgo]),
        criadoEm: dateTime(-8, 8, 0)
      },
      {
        id: "demo-habit-breath",
        nome: "Respiração 2 min",
        categoria: "Mente",
        frequencia: "Dias úteis",
        metaMinima: "2 min",
        registrosPorData: demoHabitDays([today, yesterday, threeDaysAgo]),
        criadoEm: dateTime(-7, 9, 15)
      },
      {
        id: "demo-habit-walk",
        nome: "Caminhada leve",
        categoria: "Corpo",
        frequencia: "Flexível",
        metaMinima: "10 min",
        registrosPorData: demoHabitDays([yesterday, twoDaysAgo]),
        criadoEm: dateTime(-6, 18, 20)
      },
      {
        id: "demo-habit-night",
        nome: "Fechamento noturno",
        categoria: "Mente",
        frequencia: "Diário",
        metaMinima: "3 linhas",
        registrosPorData: demoHabitDays([today, yesterday, twoDaysAgo, threeDaysAgo]),
        criadoEm: dateTime(-5, 21, 0)
      }
    ];

    var checkins = [
      {
        id: "demo-checkin-today",
        data: dateTime(0, 8, 20),
        humor: "bom",
        energia: "media",
        energiaValor: 7,
        fatores: ["Trabalho", "Exercício"],
        necessidade: "organizar",
        nota: "Energia boa para organizar prioridades com calma."
      },
      {
        id: "demo-checkin-yesterday",
        data: dateTime(-1, 8, 35),
        humor: "neutro",
        energia: "media",
        energiaValor: 5,
        fatores: ["Sono", "Trabalho"],
        necessidade: "organizar",
        nota: "Dia de organizar sem exagerar na carga."
      },
      {
        id: "demo-checkin-two-days",
        data: dateTime(-2, 9, 10),
        humor: "ruim",
        energia: "baixa",
        energiaValor: 3,
        fatores: ["Sono", "Clima"],
        necessidade: "descansar",
        nota: "Baixa energia, melhor proteger pausas."
      },
      {
        id: "demo-checkin-three-days",
        data: dateTime(-3, 8, 55),
        humor: "bom",
        energia: "media",
        energiaValor: 6,
        fatores: ["Social", "Alimentação"],
        necessidade: "leveza",
        nota: "Ritmo estável e tarefas leves ajudaram."
      }
    ];

    for (var checkinIndex = 4; checkinIndex <= 11; checkinIndex += 1) {
      checkins.push({
        id: "demo-checkin-" + checkinIndex,
        data: dateTime(-checkinIndex, 8, 20 + checkinIndex),
        humor: checkinIndex % 4 === 0 ? "bom" : checkinIndex % 4 === 1 ? "neutro" : checkinIndex % 4 === 2 ? "otimo" : "bom",
        energia: checkinIndex % 3 === 0 ? "alta" : "media",
        energiaValor: checkinIndex % 3 === 0 ? 8 : 6,
        fatores: checkinIndex % 2 ? ["Trabalho"] : ["Sono", "Exercício"],
        necessidade: checkinIndex % 2 ? "organizar" : "focar",
        nota: "Registro demo para sequência emocional."
      });
    }

    var entries = [
      {
        id: "demo-entry-today",
        tipo: "diario",
        titulo: "Fechamento de energia",
        conteudo: "Hoje funcionou melhor quando comecei pela apresentação e deixei mensagens rápidas para depois.",
        data: dateTime(0, 20, 40),
        tags: ["energia", "foco", "trabalho"]
      },
      {
        id: "demo-note-meetings",
        tipo: "nota",
        titulo: "Ideia para reduzir reuniões longas",
        conteudo: "Criar pauta curta com decisão esperada antes de cada conversa com cliente.",
        data: dateTime(0, 11, 45),
        tags: ["nota", "cliente"]
      },
      {
        id: "demo-entry-yesterday",
        tipo: "diario",
        titulo: "Pausa ajudou no fim da tarde",
        conteudo: "A pausa sem tela antes do contrato reduziu a sensação de urgência.",
        data: dateTime(-1, 21, 10),
        tags: ["pausa", "cuidado"]
      }
    ];

    var focusSessions = [
      {
        id: "demo-focus-q2",
        taskId: "demo-task-q2",
        duracao: 2700,
        duracaoMinutos: 45,
        concluida: true,
        data: dateTime(0, 9, 55),
        tipo: "Foco profundo"
      },
      {
        id: "demo-focus-inbox",
        taskId: "demo-task-inbox",
        duracao: 900,
        duracaoMinutos: 15,
        concluida: true,
        data: dateTime(-2, 13, 20),
        tipo: "Foco leve"
      },
      {
        id: "demo-focus-yesterday",
        taskId: "demo-task-contract",
        duracao: 1500,
        duracaoMinutos: 25,
        concluida: true,
        data: dateTime(-1, 10, 30),
        tipo: "Foco leve"
      }
    ];

    var reminders = [
      {
        id: "demo-reminder-checkin",
        title: "Check-in",
        body: "08:30 em dias úteis. Se você atrasar o check-in, o app reduz a cobrança e volta a sugerir à tarde.",
        time: "08:30",
        active: true,
        createdAt: dateTime(-6, 8, 30)
      },
      {
        id: "demo-reminder-break",
        title: "Pausas inteligentes",
        body: "Depois de 50 min de foco. Em energia baixa, a pausa entra antes e com micro pausa sugerida.",
        time: "15:30",
        active: true,
        createdAt: dateTime(-5, 15, 30)
      },
      {
        id: "demo-reminder-habit",
        title: "Hábitos",
        body: "Hidratação avisa perto das 15h. Quando você cumpre a meta mínima, o lembrete fica mais leve.",
        time: "15:00",
        active: true,
        createdAt: dateTime(-4, 11, 0)
      },
      {
        id: "demo-reminder-silent",
        title: "Modo silencioso",
        body: "20:00 às 07:00. Em dia difícil, reduz lembretes não urgentes e prioriza acolhimento.",
        time: "20:00",
        active: true,
        createdAt: dateTime(-3, 20, 0)
      }
    ];

    var settings = {
      nome: "Luana Caroline",
      focoPadrao: 25,
      pausasInteligentes: true,
      checkinDiario: true,
      tema: "claro",
      demoInicial: true
    };

    var exportContent = JSON.stringify({
      geradoEm: dateTime(0, 18, 0),
      modulos: ["checkins", "tasks", "habits", "focusSessions", "entries"],
      dados: {
        checkins: checkins,
        tasks: tasks,
        habits: habits,
        focusSessions: focusSessions,
        entries: entries
      }
    }, null, 2);

    return {
      tasks: tasks,
      habits: habits,
      checkins: checkins,
      entries: entries,
      focusSessions: focusSessions,
      reminders: reminders,
      settings: settings,
      exports: [
        {
          id: "demo-export-ready",
          data: dateTime(0, 18, 0),
          tipo: "relatório local",
          nomeArquivo: "plenna-relatorio-demo-" + today + ".json",
          conteudo: exportContent
        }
      ],
      focusDraft: {
        id: "demo-focus-draft",
        taskId: "demo-task-q2",
        minutos: 45,
        tipo: "Foco profundo",
        iniciadoEm: dateTime(0, 9, 0)
      },
      planningAdjustments: {
        cargaReduzida: false,
        pausaProtegida: true,
        atualizadoEm: dateTime(0, 8, 45)
      }
    };
  }

  function demoHabitDays(days) {
    return days.reduce(function (acc, day) {
      acc[day] = true;
      return acc;
    }, {});
  }

  function seedDemoData(options) {
    var force = options && options.force;
    var seedState = read(DEMO_STATE_KEY, null);
    if (!force) {
      if (seedState === "cleared") return false;
      if (hasExistingActivity()) return false;
      if (seedState === DEMO_VERSION) return false;
    }

    var demo = buildDemoData();
    setAll(KEYS.tasks, demo.tasks);
    setAll(KEYS.habits, demo.habits);
    setAll(KEYS.checkins, demo.checkins);
    setAll(KEYS.entries, demo.entries);
    setAll(KEYS.focusSessions, demo.focusSessions);
    setAll(KEYS.reminders, demo.reminders);
    setAll(KEYS.exports, demo.exports);
    write(KEYS.settings, demo.settings);
    write("focusDraft", demo.focusDraft);
    write("planningAdjustments", demo.planningAdjustments);
    write(DEMO_STATE_KEY, DEMO_VERSION);
    return true;
  }

  function clearAppData(options) {
    Object.keys(KEYS).forEach(function (key) {
      localStorage.removeItem(fullKey(KEYS[key]));
    });
    ["focusDraft", "planningAdjustments", "selectedCalendarDay"].forEach(function (key) {
      localStorage.removeItem(fullKey(key));
    });
    if (options && options.allowAutoSeed) localStorage.removeItem(fullKey(DEMO_STATE_KEY));
    else write(DEMO_STATE_KEY, "cleared");
  }

  function seedFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var seed = params.get("seed");
    if (seed === "demo" || seed === "reset-demo") seedDemoData({ force: true });
  }

  window.PlennaStorage = {
    KEYS: KEYS,
    read: read,
    write: write,
    all: all,
    setAll: setAll,
    add: add,
    update: update,
    replace: replace,
    find: find,
    latest: latest,
    remove: remove,
    seedDemoData: seedDemoData,
    clearAppData: clearAppData
  };

  seedFromQuery();
  seedDemoData();
})();
