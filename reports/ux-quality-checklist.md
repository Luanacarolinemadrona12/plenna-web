# Checklist de qualidade do Plenna

Use esta lista em cada tela antes de considerar a rodada concluida.

## Nielsen

- O status da acao aparece na tela depois de salvar, mover, concluir, exportar ou limpar dados.
- A linguagem e natural para a usuaria final; evitar "operacional", "modulo" e "simulacao".
- Acoes criticas oferecem cancelar, voltar, confirmar ou desfazer quando possivel.
- Cards, botoes, chips, tabs, status bar e bottom nav seguem o mesmo padrao visual.
- Exclusao, limpeza de dados, finalizar foco e pular check-in explicam a consequencia antes da acao.
- A tela mostra o contexto do item em edicao, sem exigir memoria da usuaria.
- Atalhos importantes aparecem perto do fluxo principal, nao apenas no menu inferior.
- A interface evita excesso de blocos, textos longos e acoes competindo entre si.
- Estados vazios explicam o que aconteceu e qual e o proximo passo.
- Telas complexas trazem ajuda contextual curta.

## Acessibilidade

- Todo campo tem label visivel ou `aria-label`.
- O foco visivel aparece em links, botoes, tabs, chips e cards interativos.
- A ordem de tabulacao segue: topo, conteudo, acao principal, acoes secundarias e bottom nav.
- Dialogos usam `role="dialog"`, prendem o foco e fecham com Escape.
- Feedback de sucesso usa `aria-live="polite"` e erro usa `aria-live="assertive"`.
- Alvos de toque tem pelo menos 44px quando interativos.
- Contraste de texto pequeno atende AA, especialmente verdes e cinzas.
- Estado selecionado nunca depende so de cor; precisa ter texto, icone ou label.

## IHC e UX

- O fluxo principal e previsivel e sempre oferece proximo passo.
- A acao primaria de cada tela e clara.
- Acoes destrutivas ficam visualmente separadas.
- O feedback fica visivel no card ou na tela, alem do toast.
- Estados vazios sao acolhedores e acionaveis.
- Formulario denso deve ser dividido em blocos com hierarquia.
- Check-in altera Home, Planejamento e Foco de forma perceptivel.
- Tarefas por lista, semana e mes devem ser faceis de acessar.

## Fluxo manual minimo

1. Onboarding.
2. Check-in.
3. Home alterada pelo check-in.
4. Planejamento e ajuste.
5. Criar, editar, concluir e adiar tarefa.
6. Ver semana e mes.
7. Criar, editar e marcar habito.
8. Criar, pausar, ativar e remover lembrete.
9. Iniciar e finalizar foco.
10. Fazer micro pausa.
11. Salvar diario rapido.
12. Criar nota e transformar em tarefa/habito.
13. Ver dashboard e rotina.
14. Exportar relatorio.
15. Alterar configuracoes.
16. Limpar dados e conferir estados vazios.
