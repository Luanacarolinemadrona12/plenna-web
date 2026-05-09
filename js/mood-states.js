(function () {
  "use strict";

  var Utils = window.PlennaUtils;

  function stateKey(checkin) {
    if (!checkin) return "neutral";
    if (checkin.protetivo || Utils.hasLowMoodStreak()) return "protect";
    if ((checkin.humor === "bom" || checkin.humor === "otimo") && checkin.energia === "alta") return "high";
    if ((checkin.humor === "ruim" || checkin.humor === "sensivel") && checkin.energia === "baixa") return "low";
    return "neutral";
  }

  function assetPath(path) {
    return window.PlennaIcons ? window.PlennaIcons.assetPath(path) : path;
  }

  var STATES = {
    high: {
      key: "high",
      className: "state-high",
      home: {
        title: "Humor bom + energia alta",
        date: "Terça-feira, 15 de abril",
        moodChip: "😄 Animada",
        energyChip: "Energia 9/10",
        actionTag: "Avançar agora",
        actionTitle: "Bom momento para avançar na prioridade mais importante.",
        badge: "sugerido automaticamente",
        primaryLabel: "Começar foco",
        primaryHref: "focus.html?demo=alta",
        secondaryLabel: "Ver plano",
        secondaryHref: "planning.html?demo=alta",
        priorities: [
          ["Finalizar apresentação Q2", "Trabalho"],
          ["Planejar sprint da semana", "Projeto"],
          ["Treino de força", "Saúde"]
        ],
        appointment: {
          time: "11h",
          title: "Bloco livre para foco profundo",
          note: "Use este horário para a entrega de maior impacto."
        },
        message: {
          title: "Mensagem de avanço",
          body: "Humor e energia altos: avance com intenção e mantenha uma pausa curta."
        },
        metrics: [
          ["habits", "Hábitos", "5/6"],
          ["focus", "Foco hoje", "90 min"],
          ["streak", "Sequência", "13 dias"]
        ]
      },
      focus: {
        title: "Foco: energia alta",
        subtitle: "Bom momento para foco profundo na prioridade alta.",
        minutes: 45,
        timerLabel: "Foco profundo",
        ring: "assets/images/focus-ring-high.svg",
        presets: [
          ["Foco profundo", "45 min", 45],
          ["Pomodoro", "25 min", 25],
          ["Sons ambientes", "Chuva · café · lo-fi", 25]
        ],
        taskSectionTitle: "Tarefa recomendada",
        taskTitle: "Finalizar apresentação Q2",
        taskMeta: "Alta prioridade · esforço pesado · 2 sessões",
        contextLine: "Energia 9/10 · alta prioridade · esforço pesado · 2 sessões",
        finalTitle: "Trabalho profundo · 50 min",
        finalBody: "Bom momento para avançar na tarefa mais importante. Autocuidado mantém ritmo, não reduz carga.",
        finalBadge: "sugerido automaticamente"
      }
    },
    neutral: {
      key: "neutral",
      className: "state-neutral",
      home: {
        title: "Humor neutro + energia média",
        date: "Terça-feira, 15 de abril",
        moodChip: "🙂 Bem-disposta",
        energyChip: "Energia 7/10",
        actionTag: "O que fazer agora",
        actionTitle: "Organize 3 prioridades e foque no essencial.",
        badge: "baseado no check-in",
        primaryLabel: "Organizar meu dia",
        primaryHref: "planning.html?demo=media",
        secondaryLabel: "Iniciar foco",
        secondaryHref: "focus.html?demo=media",
        priorities: [
          ["Revisar relatório mensal", "Trabalho"],
          ["Treino cardio e alongamento", "Saúde"],
          ["Ligar para a dentista", "Pessoal"]
        ],
        appointment: {
          time: "14h",
          title: "Reunião com cliente ABC",
          note: "Depois dela, prefira algo leve."
        },
        message: {
          title: "Recomendação equilibrada",
          body: "Energia média: 2 tarefas médias, 1 leve e pausa antes da tarde."
        },
        metrics: [
          ["focus", "Foco hoje", "45 min"],
          ["streak", "Sequência", "12 dias"],
          ["habits", "Hábitos", "3/4"]
        ],
        banner: "Plano atualizado pelo check-in."
      },
      focus: {
        title: "Foco: energia média",
        subtitle: "Tarefa média, boa para uma sessão leve.",
        minutes: 25,
        timerLabel: "Foco leve",
        ring: "assets/images/focus-ring-neutral.svg",
        presets: [
          ["Foco leve", "25 min", 25],
          ["Estudo", "45 min", 45],
          ["Som ambiente", "chuva · café", 25]
        ],
        taskSectionTitle: "Tarefa recomendada",
        taskTitle: "Preparar apresentação Q2",
        taskMeta: "Alta prioridade · esforço médio · 2 sessões estimadas",
        contextLine: "Energia 7/10 · prioridade alta · esforço médio",
        topChips: ["energia 7/10", "prioridade alta", "esforço médio"],
        finalTitle: "Foco leve · 25 min",
        finalBody: "Sua energia 6/10 favorece uma tarefa média com começo claro e pausa planejada.",
        finalBadge: "baseado no check-in"
      }
    },
    low: {
      key: "low",
      className: "state-low",
      home: {
        title: "Humor ruim + energia baixa",
        date: "Terça-feira, 15 de abril",
        moodChip: "😕 Cansada",
        energyChip: "Energia 3/10",
        actionTag: "Reduzir carga",
        actionTitle: "Seu dia parece carregado. Faça o essencial e proteja energia.",
        badge: "proteção de energia",
        primaryLabel: "Reduzir carga",
        primaryHref: "planning-adjust.html?demo=baixa",
        secondaryLabel: "Pausa + foco",
        secondaryHref: "focus.html?demo=baixa",
        priorities: [
          ["Enviar e-mail essencial", "Essenc."],
          ["Alongamento de 5 min", "Cuidado"],
          ["Adiar tarefa pesada", "Adiar"]
        ],
        appointment: {
          time: "14h",
          title: "Reunião longa",
          note: "Depois dela, não agende tarefa pesada."
        },
        message: {
          title: "Alerta de sobrecarga",
          body: "Seu dia parece carregado. Quer reduzir a carga antes de começar?"
        },
        metrics: [
          ["habits", "Hábitos", "2/6"],
          ["focus", "Foco hoje", "15 min"],
          ["streak", "Sequência", "12 dias"]
        ]
      },
      focus: {
        title: "Foco: começo leve",
        subtitle: "Comece por 15 min, sem exigir produtividade máxima.",
        minutes: 15,
        timerLabel: "Começo leve",
        ring: "assets/images/focus-ring-low.svg",
        presets: [
          ["Começo leve", "15 min", 15],
          ["Pausa", "3 min", 3],
          ["Sons ambientes", "Chuva · café · lo-fi", 25]
        ],
        taskSectionTitle: "Tarefa recomendada",
        taskTitle: "Enviar e-mail essencial",
        taskMeta: "Essencial · esforço leve · 1 micro sessão",
        contextLine: "Energia 3/10 · essencial · esforço leve · 15 min",
        finalTitle: "Sessão curta · 15 min",
        finalBody: "Hoje vale reduzir carga e começar por algo leve. Autocuidado entra como parte do plano.",
        finalBadge: "proteção de energia"
      }
    },
    protect: {
      key: "protect",
      className: "state-protect",
      home: {
        title: "Humor baixo por vários dias",
        date: "Terça-feira, 15 de abril",
        moodChip: "😢 Baixo há 3 dias",
        energyChip: "Energia 4/10",
        actionTag: "Plano protetivo",
        actionTitle: "Hoje o foco é reduzir pressão, registrar sinais e cuidar de você.",
        badge: "ajustado por você",
        primaryLabel: "Plano protetivo",
        primaryHref: "planning-adjust.html?demo=protetivo",
        secondaryLabel: "Pausa guiada",
        secondaryHref: "focus.html?demo=protetivo",
        priorities: [
          ["Tarefa mínima essencial", "Mínima"],
          ["Registrar diário breve", "Diário"],
          ["Pausa guiada de 3 min", "Cuidado"]
        ],
        appointment: {
          time: "Hoje",
          title: "Sem novo compromisso pesado",
          note: "Se possível, mantenha só o mínimo viável."
        },
        message: {
          title: "Cuidado primeiro",
          body: "Humor baixo recorrente: diário e pausa aparecem antes do foco."
        },
        metrics: [
          ["habits", "Hábitos", "1/6"],
          ["focus", "Foco hoje", "0 min"],
          ["streak", "Sequência", "3 dias"]
        ]
      },
      focus: {
        title: "Foco: pausa antes",
        subtitle: "Pausa guiada antes de qualquer tarefa.",
        minutes: 3,
        timerLabel: "Pausa Guiada",
        ring: "assets/images/focus-ring-protect.svg",
        presets: [
          ["Pausa guiada", "3 min", 3],
          ["Começo leve", "10 min", 10],
          ["Sons ambientes", "Chuva · café · lo-fi", 25]
        ],
        taskSectionTitle: "Começo recomendado",
        taskTitle: "Pausa guiada antes do foco",
        taskMeta: "Autocuidado · 3 min · sem pressão",
        contextLine: "Energia 4/10 · autocuidado primeiro · foco opcional",
        finalTitle: "Foco opcional · tarefa leve",
        finalBody: "Ativar modo dia difícil e proteger energia primeiro. O foco fica opcional depois da pausa.",
        finalBadge: "ajustado por você"
      }
    }
  };

  function state(checkin) {
    return STATES[stateKey(checkin)] || STATES.neutral;
  }

  function focus(checkin) {
    var data = state(checkin);
    return Object.assign({ stateKey: data.key, className: data.className }, data.focus, {
      ringSrc: assetPath(data.focus.ring)
    });
  }

  function home(checkin) {
    var data = state(checkin);
    return Object.assign({ stateKey: data.key, className: data.className }, data.home);
  }

  window.PlennaMood = {
    stateKey: stateKey,
    state: state,
    home: home,
    focus: focus
  };
})();
