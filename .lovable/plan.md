

## Remover página de boas-vindas do /conteudos-julia

### O que muda
Remover o Step 0 (página de boas-vindas com título "Mentoria de Posicionamento Julia Ottoni") e fazer o formulário começar direto na pergunta do nome.

### Alterações em `src/pages/ConteudosJulia.tsx`
1. **Estado inicial**: `step` começa em `1` em vez de `0`
2. **Remover bloco do step 0** (linhas 215-236): Deletar todo o `if (step === 0)` que renderiza a página de boas-vindas
3. **Remover case 0 do validateStep** (linhas 81-82)
4. **Ajustar handleBack**: Manter `step > 1` (já está correto)
5. **Progress bar e botão Voltar**: Garantir que apareçam desde o step 1 (já devem funcionar sem mudanças)

Nenhuma renumeração necessária — os steps 1-13 permanecem iguais, apenas o step 0 é removido.

