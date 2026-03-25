

## Ajustes no formulário /bio-julia-ottoni

### Problemas identificados
1. **Pergunta vazia no step 2** — O `renderStep()` tem step 1 (nome) e step 3 (telefone), mas não tem conteúdo para step 2, resultando em página em branco.
2. **Frase introdutória** no step 1 ("Gostaríamos de saber um pouco mais...") — deve ser removida.
3. **Pergunta de investimento** (step 10) — deve ir para o final, após "por que deveria ser escolhida".

### Nova ordem dos steps

| Step | Conteúdo |
|------|----------|
| 0 | Boas-vindas (inalterado) |
| 1 | Nome (sem frase intro) |
| 2 | Telefone |
| 3 | E-mail |
| 4 | Instagram |
| 5 | Nicho |
| 6 | Cargo |
| 7 | Faturamento |
| 8 | Dificuldade |
| 9 | Meta carreira |
| 10 | Dificuldades objetivo |
| 11 | Por que escolhida |
| 12 | Investimento |
| 13 | Agradecimento |

### Alterações em `src/pages/BioJuliaOttoni.tsx`
- Remover frase "Gostaríamos de saber..." do step do nome
- Renumerar todos os steps de 1 a 12 (removendo o gap vazio e movendo investimento para o final)
- Atualizar `validateStep` com a nova numeração
- Atualizar `handleNext` → submissão no step 12, agradecimento = step 13
- Atualizar `handleSubmit` → `setStep(13)`
- Atualizar referência ao smartplayer script → `step === 13`
- Botão "Finalizar" → `step === 12`

### Alterações em `src/hooks/useFormPersistence.ts`
- Atualizar `FINAL_STEP_BY_FORM_TYPE['bio-julia-ottoni']` de 12 para 12 (já está correto, mas validar)

