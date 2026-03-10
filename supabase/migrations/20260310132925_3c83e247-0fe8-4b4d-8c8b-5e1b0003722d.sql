ALTER TABLE public.aplicacoes_mentoria
  ADD COLUMN IF NOT EXISTS meta_carreira text,
  ADD COLUMN IF NOT EXISTS dificuldades_objetivo text,
  ADD COLUMN IF NOT EXISTS por_que_escolhida text;