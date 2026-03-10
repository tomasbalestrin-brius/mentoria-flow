

## Correção: Sheets sync com range dinâmico

### Problema
- `formatDataForSheets` envia 17 valores (A-Q)
- `sheets-sync/index.ts` usa range fixo `A:N` (14 colunas)
- Google API rejeita a escrita nas colunas O, P, Q

### Solução
Atualizar `supabase/functions/sheets-sync/index.ts` para aceitar o range dinamicamente ou calcular a última coluna baseado no número de valores recebidos.

**Mudança em `sheets-sync/index.ts` (linhas 77-79):**
- Receber um parâmetro opcional `lastColumn` no body (ou calcular automaticamente a partir de `values.length`)
- Converter o número de colunas para a letra correspondente (ex: 17 → Q)
- Substituir `N` fixo pelo valor calculado nos URLs de PUT e append

Exemplo: se `values` tem 17 itens, o range será `A:Q` em vez de `A:N`.

Nenhuma outra mudança necessária -- o `formatDataForSheets` já envia os dados corretos, e os formulários que enviam 14 colunas continuarão funcionando (range será `A:N` automaticamente).

