

## Alterações no formulário `/bio-julia-ottoni`

### 1. Atualizar `FormData` em `src/hooks/useFormPersistence.ts`
Adicionar 3 novos campos opcionais à interface:
- `meta_carreira?: string`
- `dificuldades_objetivo?: string`
- `por_que_escolhida?: string`

### 2. Atualizar `src/pages/BioJuliaOttoni.tsx`

**Step 8 - Trocar opções de dificuldade:**
Substituir as 7 opções atuais (com "Outro") por 6 opções uniformes usando o mesmo layout de radio buttons:
- Posicionamento
- Atração de Clientes
- Visibilidade
- Criar Conteúdos
- Planejamento
- Vendas

Remover o campo textarea de "Outro" e a validação associada.

**Adicionar 3 novos steps (10, 11, 12) com campos de texto livre (textarea):**
- Step 10: "O que você deseja alcançar com sua carreira e faturamento nos próximos 12 meses?" → campo `meta_carreira`
- Step 11: "Quais dificuldades está enfrentando para alcançar esse objetivo?" → campo `dificuldades_objetivo`
- Step 12: "Por que você acredita que deveria ser escolhida para uma consultoria individual com o time da Julia Ottoni?" → campo `por_que_escolhida`

**Ajustar fluxo:**
- Total de steps: 12 perguntas + página de obrigado (step 13)
- `handleNext`: submeter após step 12 (`step < 12` → continuar, else → submit)
- `handleSubmit`: `setStep(13)`
- `validateStep`: adicionar cases 10, 11, 12 (campo não vazio)
- Smartplayer `useEffect`: `step === 13`
- Rodapé: `step < 13`, botão "Finalizar" no step 12
- `isSaving`: `step < 13`

### 3. Atualizar `src/hooks/useFormPersistence.ts`
Inicializar os novos campos no `formData` do estado e garantir que sejam enviados na sincronização com a planilha.

