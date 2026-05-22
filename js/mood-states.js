(function () {
  "use strict";

  var Utils = window.PlennaUtils;

  function energyScore(checkin) {
    var score = Number(checkin && checkin.energiaValor);
    if (score >= 1 && score <= 10) return Math.round(score);
    if (checkin && checkin.energia === "alta") return 8;
    if (checkin && checkin.energia === "baixa") return 3;
    return 6;
  }

  function energyLevel(checkin) {
    var score = energyScore(checkin);
    if (score <= 4) return "baixa";
    if (score >= 8) return "alta";
    return "media";
  }

  function isLowMood(checkin) {
    return checkin && (checkin.humor === "ruim" || checkin.humor === "sensivel");
  }

  function moodChip(checkin, fallback) {
    if (!checkin) return fallback || "Humor não informado";
    var map = {
      sensivel: "Muito sensível",
      ruim: "Cansada",
      neutro: "Neutra",
      bom: "Bem",
      otimo: "Ótima"
    };
    return map[checkin.humor] || fallback || "Humor registrado";
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function stripEnergyPrefix(value) {
    return String(value || "").replace(/^Energia\s+\d+\/10\s*(?:·|-)\s*/i, "");
  }

  function stateKey(checkin) {
    if (!checkin) return "neutral";
    if (checkin.protetivo || Utils.hasLowMoodStreak()) return "protect";
    var level = energyLevel(checkin);
    if (level === "baixa") return "low";
    if (level === "alta" && !isLowMood(checkin)) return "high";
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
        careTitle: "Você já começou bem",
        careLead: "Aproveite o ritmo sem esquecer a pausa.",
        careCopy: "Use esse fôlego para uma prioridade importante e preserve um respiro depois.",
        date: "Terça-feira, 15 de abril",
        moodChip: "😄 Animada",
        energyChip: "Energia 9/10",
        actionTag: "Próximo passo",
        actionTitle: "Escolha uma prioridade importante e proteja uma pausa depois.",
        actionCopy: "Depois, deixe uma pausa curta protegida.",
        badge: "sugerido automaticamente",
        primaryLabel: "Começar foco",
        primaryHref: "focus.html?demo=alta",
        secondaryLabel: "Ver minha rotina",
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
          ["habits", "Cuidados", "5/6"],
          ["focus", "Foco cuidado", "90 min"],
          ["streak", "Constância", "13 dias"]
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
          ["Foco curto", "25 min", 25],
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
        careTitle: "Vamos cuidar do essencial",
        careLead: "Seu dia pode seguir com calma.",
        careCopy: "Escolha uma prioridade, uma pausa e um fechamento simples para hoje.",
        date: "Terça-feira, 15 de abril",
        moodChip: "🙂 Bem-disposta (o)",
        energyChip: "Energia 7/10",
        actionTag: "Próximo passo leve",
        actionTitle: "Organize 3 prioridades e respire no meio.",
        actionCopy: "O essencial já basta para manter clareza hoje.",
        badge: "baseado no check-in",
        primaryLabel: "Ajustar meu dia",
        primaryHref: "planning.html?demo=media",
        secondaryLabel: "Começar foco leve",
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
          ["focus", "Foco cuidado", "45 min"],
          ["streak", "Constância", "12 dias"],
          ["habits", "Cuidados", "3/4"]
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
        careTitle: "Hoje pede leveza",
        careLead: "Diminua a carga antes de começar.",
        careCopy: "O Plenna pode proteger pausas e deixar só o essencial visível.",
        date: "Terça-feira, 15 de abril",
        moodChip: "😕 Cansada",
        energyChip: "Energia 3/10",
        actionTag: "Cuidar da energia",
        actionTitle: "Faça o mínimo importante e guarde energia.",
        actionCopy: "Você pode adiar o que pesa e voltar no seu ritmo.",
        badge: "proteção de energia",
        primaryLabel: "Aliviar meu dia",
        primaryHref: "planning-adjust.html?demo=baixa",
        secondaryLabel: "Pausa sugerida",
        secondaryHref: "micro-pauses.html?quick=breath",
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
          ["habits", "Cuidados", "2/6"],
          ["focus", "Foco cuidado", "15 min"],
          ["streak", "Constância", "12 dias"]
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
        careTitle: "Vamos com muito cuidado",
        careLead: "O plano de hoje pode ser menor.",
        careCopy: "Pausa, diário breve e uma tarefa mínima já contam como cuidado.",
        date: "Terça-feira, 15 de abril",
        moodChip: "😢 Baixo há 3 dias",
        energyChip: "Energia 4/10",
        actionTag: "Sem pressa",
        actionTitle: "Reduza pressão e escolha um começo possível.",
        actionCopy: "O foco pode ficar para depois da pausa.",
        badge: "ajustado por você",
        primaryLabel: "Ajustar com calma",
        primaryHref: "planning-adjust.html?demo=protetivo",
        secondaryLabel: "Pausa guiada",
        secondaryHref: "micro-pauses.html?quick=breath",
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
          ["habits", "Cuidados", "1/6"],
          ["focus", "Foco cuidado", "0 min"],
          ["streak", "Constância", "3 dias"]
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
    var result = Object.assign({ stateKey: data.key, className: data.className }, clone(data.focus), {
      ringSrc: assetPath(data.focus.ring)
    });
    if (!checkin) return result;

    var score = energyScore(checkin);
    var level = energyLevel(checkin);
    var contextWithoutEnergy = stripEnergyPrefix(result.contextLine);
    var secondaryChips = result.topChips ? result.topChips.slice(1) : contextWithoutEnergy.split("·").slice(0, 2).map(function (item) {
      return item.trim();
    }).filter(Boolean);
    result.contextLine = "Energia " + score + "/10 - " + contextWithoutEnergy;
    result.topChips = ["energia " + score + "/10"].concat(secondaryChips);
    if (level === "baixa" && result.stateKey !== "protect") {
      result.title = "Foco: energia baixa";
      result.subtitle = "Comece curto, com menos pressão e uma pausa visível.";
      result.minutes = Math.min(result.minutes || 15, 15);
      result.timerLabel = "Começo leve";
      result.finalTitle = "Sessão curta - 15 min";
      result.finalBody = "Sua energia está em " + score + "/10. Hoje o plano favorece tarefas leves, pausa protegida e menos carga.";
      result.finalBadge = "energia baixa";
    } else if (level === "alta") {
      result.minutes = Math.max(result.minutes || 45, 45);
      result.timerLabel = "Foco profundo";
      result.finalBody = "Sua energia está em " + score + "/10. Reserve o melhor bloco para uma tarefa importante e mantenha pausa curta depois.";
      result.finalBadge = "energia alta";
    } else if (level === "media") {
      result.minutes = 25;
      result.timerLabel = "Foco leve";
      result.finalBody = "Sua energia está em " + score + "/10. Uma sessão leve com objetivo claro tende a funcionar melhor agora.";
      result.finalBadge = "energia média";
    }
    return result;
  }

  function home(checkin) {
    var data = state(checkin);
    var result = Object.assign({ stateKey: data.key, className: data.className }, clone(data.home));
    if (!checkin) return result;

    var score = energyScore(checkin);
    var level = energyLevel(checkin);
    result.energyChip = "Energia " + score + "/10";
    result.moodChip = moodChip(checkin, result.moodChip);
    if (level === "baixa" && result.stateKey !== "protect") {
      result.title = isLowMood(checkin) ? "Humor baixo + energia baixa" : "Energia baixa";
      result.careTitle = isLowMood(checkin) ? "Hoje pede cuidado" : "Hoje pede leveza";
      result.careLead = "Diminua a carga antes de começar.";
      result.careCopy = "Sua energia está em " + score + "/10. Vamos deixar o dia mais leve e proteger pausas.";
      result.actionTag = "Cuidar da energia";
      result.actionTitle = "Faça o essencial e guarde energia.";
      result.actionCopy = "Adie o que pesa e escolha um começo possível.";
      result.message.body = "Energia baixa: prefira tarefas leves, adie o que puder e deixe recuperação no plano.";
    } else if (level === "alta") {
      result.title = "Energia alta";
      result.careTitle = "Você já começou bem";
      result.careLead = "Aproveite o ritmo sem esquecer a pausa.";
      result.careCopy = "Sua energia está em " + score + "/10. Use esse fôlego com intenção e preserve um respiro depois.";
      result.actionTag = "Próximo passo";
      result.actionTitle = "Escolha uma prioridade importante e proteja uma pausa depois.";
      result.actionCopy = "Depois, deixe uma pausa curta protegida.";
      result.message.body = "Energia alta: use um bloco de foco para o que mais importa e mantenha uma pausa curta.";
    } else if (level === "media") {
      result.title = "Energia média";
      result.careTitle = "Vamos cuidar do essencial";
      result.careLead = "Seu dia pode seguir com calma.";
      result.careCopy = "Sua energia está em " + score + "/10. Escolha uma prioridade, uma pausa e um fechamento simples.";
      result.actionTag = "Próximo passo leve";
      result.actionTitle = "Organize 3 prioridades e respire no meio.";
      result.actionCopy = "O essencial já basta para manter clareza hoje.";
      result.message.body = "Energia média: combine uma tarefa importante, uma leve e uma pausa visível.";
    }
    return result;
  }

  window.PlennaMood = {
    energyScore: energyScore,
    energyLevel: energyLevel,
    stateKey: stateKey,
    state: state,
    home: home,
    focus: focus
  };
})();
