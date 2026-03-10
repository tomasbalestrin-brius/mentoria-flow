

## Bloquear horarios de segunda-feira (9:30 - 11:00) em todos os formularios

### Contexto
Todos os 8 formularios com agendamento usam a funcao `filterAvailableTimes` de `src/lib/dateUtils.ts` e renderizam os horarios de forma similar. Os horarios 09:30, 10:00, 10:30 e 11:00 devem aparecer com opacidade baixa e nao podem ser clicados quando a data selecionada for uma segunda-feira.

### Alteracoes

#### 1. `src/lib/dateUtils.ts` - Adicionar funcao auxiliar

Criar e exportar uma nova funcao `isMondayBlockedTime` que verifica se um horario esta bloqueado para segundas-feiras:

```typescript
const MONDAY_BLOCKED_TIMES = ['09:30', '10:00', '10:30', '11:00'];

export const isMondayBlockedTime = (time: string, selectedDate: Date): boolean => {
  return selectedDate.getDay() === 1 && MONDAY_BLOCKED_TIMES.includes(time);
};
```

Essa funcao sera importada em cada formulario para controlar a aparencia e interacao dos horarios.

#### 2. Atualizar os 7 formularios com layout identico

Arquivos afetados:
- `src/pages/Index.tsx`
- `src/pages/FeedCleitonQuerobin.tsx`
- `src/pages/StoriesCleitonQuerobin.tsx`
- `src/pages/YoutubeCleitonQuerobin.tsx`
- `src/pages/StoriesJuliaOttoni.tsx`
- `src/pages/FeedJuliaOttoni.tsx`
- `src/pages/TrafegoPostagens.tsx`

Em cada um, na secao onde os horarios sao renderizados (por volta da linha 704), adicionar:
- Import de `isMondayBlockedTime` de `dateUtils.ts`
- Verificacao `isBlocked` para cada horario
- Se bloqueado: opacidade 30%, cursor nao permitido, sem acao ao clicar
- Se nao bloqueado: comportamento normal (como esta hoje)

Exemplo da mudanca no label de cada horario:

```tsx
{availableTimes.map((time) => {
  const isBlocked = isMondayBlockedTime(time, new Date(formData.data_agendamento + 'T00:00:00'));
  return (
    <label
      key={time}
      className={`flex items-center justify-center p-3 md:p-4 rounded-lg transition font-semibold text-sm md:text-base ${
        isBlocked
          ? 'opacity-30 cursor-not-allowed bg-secondary border border-border text-white'
          : formData.horario_agendamento === time
            ? 'bg-primary text-white border border-primary cursor-pointer'
            : 'bg-secondary border border-border text-white hover:bg-secondary/80 cursor-pointer'
      }`}
      onClick={() => !isBlocked && updateField('horario_agendamento', time)}
    >
      <input
        type="radio"
        name="horario"
        value={time}
        checked={formData.horario_agendamento === time}
        onChange={() => !isBlocked && updateField('horario_agendamento', time)}
        className="sr-only"
        disabled={isBlocked}
      />
      {time}
    </label>
  );
})}
```

#### 3. `src/pages/FormPage.tsx` - Formulario generico

Este formulario usa um layout diferente (Buttons ao inves de labels). A mesma logica sera aplicada, desabilitando o botao e reduzindo a opacidade quando bloqueado.

### Horarios bloqueados nas segundas-feiras

| Horario | Status na segunda |
|---------|-------------------|
| 08:30   | Disponivel |
| 09:00   | Disponivel |
| **09:30** | **Bloqueado** |
| **10:00** | **Bloqueado** |
| **10:30** | **Bloqueado** |
| **11:00** | **Bloqueado** |
| 11:30   | Disponivel |
| 13:30+  | Disponivel |

### Resumo
- 1 funcao auxiliar nova em `dateUtils.ts`
- 8 formularios atualizados com a mesma logica
- Horarios bloqueados aparecem visiveis mas com opacidade baixa e nao clicaveis
- Nenhuma alteracao no banco de dados necessaria
