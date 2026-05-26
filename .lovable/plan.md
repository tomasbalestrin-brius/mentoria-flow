# Duplicar formulário raiz → /bio-ig-kennedy

Criar uma nova instância do formulário da rota `/` (Index.tsx) na rota `/bio-ig-kennedy`, com nome de mentor **Kennedy Rodrigues** e conectada à planilha `1XEe0dvumIW_3-Uw74qn8piIUD6mVZBFQ2W_03_MmWNY`, já aplicando todas as correções dos últimos bugs.

## O que será feito

1. **Nova página `src/pages/BioIgKennedy.tsx`**
   - Cópia 1:1 de `Index.tsx` (mesmas 9 perguntas + página de agradecimento)
   - Usa `useFormPersistence('bio-ig-kennedy')` para isolar dados e localStorage
   - `<FormHeader mentorName="Kennedy Rodrigues" />`
   - CTA da thank-you page → `https://betheleducacao.com.br/`

2. **Rota em `src/App.tsx`**
   - Adicionar `<Route path="/bio-ig-kennedy" element={<BioIgKennedy />} />` antes do catch-all

3. **Configuração em `src/config/formConfigs.ts`**
   - Nova entrada `'bio-ig-kennedy'` com `spreadsheetId: '1XEe0dvumIW_3-Uw74qn8piIUD6mVZBFQ2W_03_MmWNY'`

4. **Hook `src/hooks/useFormPersistence.ts`**
   - Adicionar `'bio-ig-kennedy'` em `SPREADSHEET_IDS`
   - Adicionar `'bio-ig-kennedy': 10` em `FINAL_STEP_BY_FORM_TYPE` (mesmo fluxo da rota raiz, que finaliza no step 10)

5. **Lista admin `src/pages/FormList.tsx`**
   - Adicionar o novo formulário com link e ID da planilha

## Correções já aplicadas que serão respeitadas

- **Cada lead = 1 linha só** (não múltiplas linhas por etapa): o hook já garante via `recordId` + `sheetRowId` isolados por `formType` no localStorage
- **Append ancorado na coluna A** (sem desorganizar): edge function `sheets-sync` já usa `A:A:append` corrigido
- **Segundas-feiras 09:30–11:00 bloqueadas** no agendamento (regra global já aplicada)
- **Sem link do Google Meet** no evento do Calendar (já corrigido)
- **LocalStorage isolado** por `formType` para não misturar com outros formulários

## Teste pós-deploy

Após implementar, vou:
1. Compartilhar a planilha com a service account (se ainda não estiver)
2. Disparar um lead de teste via edge function `sheets-sync` direto na planilha nova para confirmar que a linha aparece corretamente na aba `Base`, todas as 17 colunas alinhadas
3. Confirmar o resultado pra você

## Observação importante

A planilha `1XEe0dvumIW...` precisa estar **compartilhada com a service account** (o e-mail `client_email` do `GOOGLE_SERVICE_ACCOUNT_KEY`) com permissão de **Editor**, senão o sync falha com erro de permissão. Se o teste falhar, vou avisar exatamente qual e-mail compartilhar.
