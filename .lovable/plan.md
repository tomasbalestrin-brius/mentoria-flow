

## Plano: Duplicar formulário /bio como /intensivo

### O que será feito

1. **Criar `src/pages/Intensivo.tsx`** — Cópia exata de `Index.tsx` (formulário bio, 9 perguntas sem agendamento), alterando apenas o `useFormPersistence('intensivo')`.

2. **Registrar rota em `src/App.tsx`** — Adicionar `<Route path="/intensivo" element={<Intensivo />} />`.

3. **Adicionar config em `src/config/formConfigs.ts`** — Nova entrada `'intensivo'` com `spreadsheetId: '1LBhKreB3dIEeavbLINZzLS5GknYndhesKyzwW6Gw76o'`.

4. **Adicionar spreadsheet ID em `src/hooks/useFormPersistence.ts`** — Adicionar `'intensivo': '1LBhKreB3dIEeavbLINZzLS5GknYndhesKyzwW6Gw76o'` no mapa `SPREADSHEET_IDS` e `'intensivo': 9` no mapa `FINAL_STEP_BY_FORM_TYPE`.

### Pré-requisito
A planilha precisa estar compartilhada com `agendamento@numeric-span-476817-b7.iam.gserviceaccount.com` (Editor) para a sincronização funcionar.

