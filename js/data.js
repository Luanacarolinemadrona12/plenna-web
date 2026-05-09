(function () {
  "use strict";

  window.PlennaData = {
    humores: [
      { value: "sensivel", label: "Péssimo", hint: "precisa de acolhimento" },
      { value: "ruim", label: "Ruim", hint: "baixa tolerância" },
      { value: "neutro", label: "Neutro", hint: "regular" },
      { value: "bom", label: "Bem", hint: "estável" },
      { value: "otimo", label: "Ótimo", hint: "leve e confiante" }
    ],
    energias: [
      { value: "baixa", label: "Baixa", hint: "pouca carga" },
      { value: "media", label: "Média", hint: "ritmo possível" },
      { value: "alta", label: "Alta", hint: "bom foco" }
    ],
    fatores: ["Trabalho", "Sono", "Exercício", "Alimentação", "Social", "Clima"],
    necessidades: [
      { value: "focar", label: "Foco", hint: "proteger um bloco" },
      { value: "descansar", label: "Descanso", hint: "recuperar energia" },
      { value: "leveza", label: "Leveza", hint: "reduzir atrito" },
      { value: "motivar", label: "Motivação", hint: "retomar impulso" },
      { value: "organizar", label: "Organização", hint: "clarear prioridades" },
      { value: "cuidar", label: "Cuidado", hint: "autocuidado" }
    ],
    prioridades: [
      { value: "alta", label: "Alta" },
      { value: "media", label: "Média" },
      { value: "baixa", label: "Baixa" }
    ],
    esforcos: [
      { value: "baixo", label: "Baixo" },
      { value: "medio", label: "Médio" },
      { value: "alto", label: "Alto" }
    ],
    impactos: [
      { value: "leve", label: "Leve" },
      { value: "neutro", label: "Neutro" },
      { value: "positivo", label: "Positivo" },
      { value: "pesado", label: "Pesado" }
    ],
    recorrencias: ["Sem recorrência", "Diária", "Semanal", "Mensal", "Dias úteis"],
    lembretes: ["Sem lembrete", "No prazo", "10 min antes", "1 hora antes", "1 dia antes"],
    frequencias: ["Diário", "Dias úteis", "Semanal", "Flexível"],
    categoriasHabito: ["Corpo", "Mente", "Casa", "Trabalho", "Relações"]
  };
})();
