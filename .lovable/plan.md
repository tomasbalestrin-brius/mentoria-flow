

## Adicionar página de boas-vindas ao formulário /bio-julia-ottoni

### Mudança

Adicionar um step 0 (página de boas-vindas) antes das perguntas atuais em `src/pages/BioJuliaOttoni.tsx`:

1. **Novo step 0** — Exibe título "Mentoria de Posicionamento Julia Ottoni", os 4 parágrafos de descrição, e botão CTA "Começar"
2. **Ajustar numeração** — O estado `step` inicia em `0` em vez de `1`. Todas as referências a steps (validação, navegação, agradecimento) incrementam em +1 (agradecimento passa de 13 para 14)
3. **Sem botão "Voltar"** no step 0, sem progress bar
4. **Layout** — Mesmo estilo visual do formulário, com a barra lateral colorida similar à página de agradecimento

### Arquivos alterados
- `src/pages/BioJuliaOttoni.tsx`

