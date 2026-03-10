

## Remover agendamento do formulário da rota `/` e atualizar página de obrigado

### Resumo
Remover as etapas 10 (seleção de data) e 11 (seleção de horário) do formulário principal. A página de obrigado (que passará de step 12 para step 10) terá o box de data/hora substituído pelo texto: "Se você for selecionado nossa equipe irá entrar em contato com você no seu WhatsApp".

### Alterações em `src/pages/Index.tsx`

**1. Remover código desnecessário:**
- Remover states: `availableDates`, `availableTimes`, `datesWithTimes`
- Remover imports: `getNextWorkingDays`, `formatDateForDisplay`, `formatDateForDB`, `AVAILABLE_TIMES`, `filterAvailableTimes`, `isMondayBlockedTime`
- Remover `useEffect` de fetch de datas (linhas 40-98)
- Remover `useEffect` de fetch de horários por data (linhas 100-105)
- Remover `useEffect` de polling de horários (linhas 107-118)
- Remover função `fetchAvailableTimes` (linhas 170-215)

**2. Ajustar validação (`validateStep`):**
- Remover cases 10 e 11 (validação de data e horário)

**3. Ajustar `handleNext`:**
- Mudar limite de `step < 11` para `step < 9` — após step 9 (investimento), submeter
- O botão no step 9 passa a ser "Finalizar" ao invés de "Continuar"

**4. Ajustar `handleSubmit`:**
- Mudar para `setStep(10)` (página de obrigado)
- Remover lógica de voltar para step 11 em caso de conflito de horário

**5. Remover renderização dos steps 10 e 11** (seleção de data e horário)

**6. Reescrever página de obrigado (agora step 10):**
- Remover box com data/horário e texto "informações adicionadas à agenda"
- Substituir por texto: "Se você for selecionado nossa equipe irá entrar em contato com você no seu WhatsApp"
- Manter: saudação "Obrigado!", vídeo Smartplayer, botão CTA

**7. Ajustar rodapé:**
- `step < 12` → `step < 10`
- Botão no step 9: texto "Finalizar" (ou "Finalizando...")

### Resultado
- Formulário: 9 perguntas (nome → investimento) + página de obrigado
- Sem agendamento de call
- Página de obrigado com mensagem sobre contato via WhatsApp

