import { useState, useEffect, useRef } from 'react';
import { FormHeader } from '@/components/FormHeader';
import { useFormPersistence, FormData } from '@/hooks/useFormPersistence';
import { supabase } from '@/integrations/supabase/client';
import { 
  getNextWorkingDays, 
  formatDateForDisplay, 
  formatDateForDB,
  AVAILABLE_TIMES,
  filterAvailableTimes 
} from '@/lib/dateUtils';
import { toast } from 'sonner';

const StoriesCleitonQuerobin = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    telefone: '',
    email: '',
    instagram: '',
    nicho: '',
    cargo: '',
    faturamento: '',
    dificuldade: '',
    outraDificuldade: '',
    investimento: '',
    data_agendamento: '',
    horario_agendamento: '',
  });
  const [error, setError] = useState('');
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datesWithTimes, setDatesWithTimes] = useState<Map<string, string[]>>(new Map());
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const { saveProgress, completeForm, isSaving } = useFormPersistence('stories-cleiton-querobin');

  useEffect(() => {
    // Gerar apenas hoje e amanhã e filtrar apenas os que têm horários
    const fetchDatesWithAvailability = async () => {
      const dates = getNextWorkingDays(2);
      const datesMap = new Map<string, string[]>();
      const validDates: Date[] = [];
      
      for (const date of dates) {
        const dateStr = formatDateForDB(date);
        try {
          // PRIORIDADE 1: Buscar do Supabase (fonte confiável)
          let bookedTimes: string[] = [];
          const { data: supabaseData, error: supabaseError } = await supabase
            .from('agendamentos')
            .select('horario_agendamento')
            .eq('data_agendamento', dateStr);
          
          if (supabaseError) {
            console.error('Supabase error, trying Google Sheets:', supabaseError);
            // Fallback para Google Sheets apenas se Supabase falhar
            try {
              const { data: sheetData } = await supabase.functions.invoke('get-booked-times', {
                body: {
                  date: dateStr,
                  spreadsheetId: '1D8iSRnlwUJAITQfd8zQ8-nKqLtXXNoOGGTCQetjlQF8'
                }
              });
              bookedTimes = sheetData?.bookedTimes || [];
            } catch {
              bookedTimes = [];
            }
          } else {
            // Normalizar formato HH:MM:SS para HH:MM removendo os segundos
            bookedTimes = supabaseData?.map(a => {
              const time = a.horario_agendamento || '';
              return time.substring(0, 5); // Remove segundos se existirem
            }).filter(Boolean) || [];
          }
          
          console.log(`Raw booked times from Supabase:`, supabaseData?.map(a => a.horario_agendamento));
          console.log(`Normalized booked times for ${dateStr}:`, bookedTimes);
          const filtered = filterAvailableTimes(AVAILABLE_TIMES, bookedTimes, date);
          
          // Apenas adicionar datas que tenham horários disponíveis
          if (filtered.length > 0) {
            datesMap.set(dateStr, filtered);
            validDates.push(date);
          }
        } catch (error) {
          console.error('Error checking availability for date:', dateStr, error);
        }
      }
      
      setDatesWithTimes(datesMap);
      setAvailableDates(validDates);
    };
    
    fetchDatesWithAvailability();
  }, []);

  useEffect(() => {
    // Buscar horários disponíveis quando uma data for selecionada
    if (formData.data_agendamento) {
      fetchAvailableTimes(formData.data_agendamento);
    }
  }, [formData.data_agendamento]);

  // Polling para atualizar horários disponíveis em tempo real
  useEffect(() => {
    // Apenas atualizar quando estiver nas etapas de seleção de data/horário
    if ((step === 10 || step === 11) && formData.data_agendamento) {
      const intervalId = setInterval(() => {
        console.log('Refreshing available times...');
        fetchAvailableTimes(formData.data_agendamento);
      }, 30000); // Atualizar a cada 30 segundos

      return () => clearInterval(intervalId);
    }
  }, [step, formData.data_agendamento]);

  // Auto-save com debounce - salvar automaticamente após 3 segundos de inatividade
  useEffect(() => {
    // Não fazer auto-save durante submissão
    if (isSubmitting) return;
    
    // Só fazer auto-save se houver algum dado preenchido
    const hasData = formData.nome || formData.telefone || formData.email;
    if (!hasData) return;

    const timeoutId = setTimeout(() => {
      saveProgress(formData, step).catch(error => {
        console.error('Auto-save failed:', error);
      });
    }, 3000); // 3 segundos de debounce

    return () => clearTimeout(timeoutId);
  }, [formData, step, isSubmitting]);

  // Captura ao sair da página - salvar antes de fechar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasData = formData.nome || formData.telefone || formData.email;
      if (hasData && !isSubmitting) {
        // Tentar salvar de forma síncrona usando sendBeacon se possível
        saveProgress(formData, step).catch(error => {
          console.error('Save on exit failed:', error);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, step, isSubmitting]);

  // Carregar script do Smartplayer quando chegar na página de agradecimento
  useEffect(() => {
    if (step === 12 && videoContainerRef.current) {
      // Verificar se o script já foi carregado
      const existingScript = document.getElementById('smartplayer-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'smartplayer-script';
        script.src = 'https://scripts.converteai.net/60c57e38-903d-4b8c-afdb-955793042b17/players/692066657cc713fc76f626ec/v4/player.js';
        script.async = true;
        document.head.appendChild(script);
        console.log('Smartplayer script loaded');
      }
    }
  }, [step]);

  const fetchAvailableTimes = async (date: string) => {
    try {
      console.log('Fetching available times for:', date);
      
      // PRIORIDADE 1: Buscar do Supabase (fonte confiável)
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('agendamentos')
        .select('horario_agendamento')
        .eq('data_agendamento', date);
      
      let bookedTimes: string[] = [];
      
      if (supabaseError) {
        console.error('Supabase error, trying Google Sheets:', supabaseError);
        // Fallback para Google Sheets apenas se Supabase falhar
        try {
          const { data: sheetData } = await supabase.functions.invoke('get-booked-times', {
            body: {
              date,
              spreadsheetId: '1D8iSRnlwUJAITQfd8zQ8-nKqLtXXNoOGGTCQetjlQF8'
            }
          });
          bookedTimes = sheetData?.bookedTimes || [];
        } catch (sheetError) {
          console.error('Google Sheets also failed:', sheetError);
          bookedTimes = [];
        }
      } else {
        // Normalizar formato HH:MM:SS para HH:MM removendo os segundos
        bookedTimes = supabaseData.map(a => {
          const time = a.horario_agendamento || '';
          return time.substring(0, 5); // Remove segundos se existirem
        }).filter(Boolean);
      }
      
      console.log('Raw booked times from database:', supabaseData?.map(a => a.horario_agendamento));
      console.log('Normalized booked times:', bookedTimes);
      const selectedDate = new Date(date + 'T00:00:00');
      const filtered = filterAvailableTimes(AVAILABLE_TIMES, bookedTimes, selectedDate);
      console.log('Available times after filtering:', filtered);
      setAvailableTimes(filtered);
    } catch (error) {
      console.error('Error fetching available times:', error);
      setAvailableTimes(AVAILABLE_TIMES);
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const validateStep = (): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        if (!formData.nome.trim() || formData.nome.trim().length < 3) {
          setError('Por favor, digite seu nome completo (mínimo 3 caracteres)');
          return false;
        }
        break;
      case 2:
        const phoneDigits = formData.telefone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
          setError('Por favor, digite um telefone válido com DDD');
          return false;
        }
        break;
      case 3:
        if (!validateEmail(formData.email)) {
          setError('Por favor, digite um e-mail válido');
          return false;
        }
        break;
      case 4:
        if (!formData.instagram.trim()) {
          setError('Por favor, digite seu Instagram');
          return false;
        }
        break;
      case 5:
        if (!formData.nicho.trim()) {
          setError('Por favor, digite seu nicho de atuação');
          return false;
        }
        break;
      case 6:
        if (!formData.cargo) {
          setError('Por favor, selecione seu cargo');
          return false;
        }
        break;
      case 7:
        if (!formData.faturamento) {
          setError('Por favor, selecione seu faturamento');
          return false;
        }
        break;
      case 8:
        if (!formData.dificuldade) {
          setError('Por favor, selecione uma opção');
          return false;
        }
        if (formData.dificuldade === 'Outro' && !formData.outraDificuldade?.trim()) {
          setError('Por favor, descreva sua dificuldade');
          return false;
        }
        break;
      case 9:
        if (!formData.investimento) {
          setError('Por favor, selecione uma opção');
          return false;
        }
        break;
      case 10:
        if (!formData.data_agendamento) {
          setError('Por favor, selecione uma data');
          return false;
        }
        break;
      case 11:
        if (!formData.horario_agendamento) {
          setError('Por favor, selecione um horário');
          return false;
        }
        break;
    }
    
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    try {
      // Tentar salvar progresso, mas continuar mesmo se falhar
      await saveProgress(formData, step);
    } catch (error) {
      console.error('Error saving progress:', error);
      // Não bloquear o avanço se o save falhar
    }
    
    // Avançar para próxima pergunta
    if (step < 11) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await completeForm(formData);
      setStep(12); // Página de agradecimento
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error completing form:', error);
      if (error.message.includes('horário já')) {
        // Atualizar lista de horários e mostrar erro claro
        await fetchAvailableTimes(formData.data_agendamento);
        setError('Este horário foi agendado enquanto você preenchia o formulário. Por favor, escolha outro horário.');
        setStep(11); // Voltar para seleção de horário
        toast.error('Horário indisponível. Por favor, escolha outro horário.');
      } else {
        setError('Erro ao finalizar aplicação. Tente novamente.');
        toast.error('Erro ao finalizar aplicação. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const renderStep = () => {
    // Pergunta 1 - Nome
    if (step === 1) {
      return (
        <div className="space-y-6">
          <p className="text-sm md:text-lg text-muted-foreground">
            Gostaríamos de saber um pouco mais sobre você para indicar o programa que melhor se encaixa ao seu perfil.
          </p>
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-4">Qual é o seu nome completo?</h2>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => updateField('nome', e.target.value)}
              placeholder="Digite seu nome completo"
              className="w-full px-4 py-3 md:py-4 text-base md:text-lg rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-form-input-bg border border-form-input-border text-white placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>
      );
    }

    // Pergunta 2 - Telefone
    if (step === 2) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-2">Qual é o seu telefone?</h2>
            <p className="text-sm md:text-lg text-gray-300 mb-4">Inclua o DDD</p>
            <div className="flex gap-2">
              <div className="flex items-center px-3 md:px-4 py-3 md:py-4 text-base md:text-lg rounded-lg bg-form-input-bg border border-form-input-border text-white">
                +55
              </div>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => updateField('telefone', formatPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                className="flex-1 px-3 md:px-4 py-3 md:py-4 text-base md:text-lg rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-form-input-bg border border-form-input-border text-white placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>
        </div>
      );
    }

    // Pergunta 3 - Email
    if (step === 3) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-4">Qual é o seu e-mail?</h2>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 md:py-4 text-base md:text-lg rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-form-input-bg border border-form-input-border text-white placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>
      );
    }

    // Pergunta 4 - Instagram
    if (step === 4) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-4">Qual é o seu Instagram?</h2>
            <div className="flex gap-2">
              <div className="flex items-center px-3 md:px-4 py-3 md:py-4 text-base md:text-lg rounded-lg bg-form-input-bg border border-form-input-border text-white">
                @
              </div>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => updateField('instagram', e.target.value.replace('@', ''))}
                placeholder="seuinstagram"
                className="flex-1 px-3 md:px-4 py-3 md:py-4 text-base md:text-lg rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-form-input-bg border border-form-input-border text-white placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </div>
        </div>
      );
    }

    // Pergunta 5 - Nicho
    if (step === 5) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-4">Qual é o seu nicho de atuação?</h2>
            <input
              type="text"
              value={formData.nicho}
              onChange={(e) => updateField('nicho', e.target.value)}
              placeholder="Ex: Estética, Saúde, Educação..."
              className="w-full px-4 py-3 md:py-4 text-base md:text-lg rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-form-input-bg border border-form-input-border text-white placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>
      );
    }

    // Pergunta 6 - Cargo
    if (step === 6) {
      const cargos = ['Dono', 'Gerente', 'Autônomo', 'Colaborador', 'Vendedor'];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-6">Qual o seu cargo?</h2>
            <div className="space-y-3">
              {cargos.map((cargo) => (
                <button
                  key={cargo}
                  onClick={() => updateField('cargo', cargo)}
                  className={`w-full px-4 md:px-6 py-3 md:py-4 text-base md:text-lg rounded-lg border-2 transition-all ${
                    formData.cargo === cargo
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-form-input-bg border-form-input-border text-white hover:border-primary/50'
                  }`}
                >
                  {cargo}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Pergunta 7 - Faturamento
    if (step === 7) {
      const faturamentos = [
        'Não fatura ainda',
        'Entre R$ 1 a R$ 10 mil',
        'Entre R$ 10 mil e R$ 30 mil',
        'Entre R$ 30 mil e R$ 100 mil',
        'Mais de R$ 100 mil'
      ];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-6">Qual o seu faturamento mensal?</h2>
            <div className="space-y-3">
              {faturamentos.map((faturamento) => (
                <button
                  key={faturamento}
                  onClick={() => updateField('faturamento', faturamento)}
                  className={`w-full px-4 md:px-6 py-3 md:py-4 text-base md:text-lg rounded-lg border-2 transition-all ${
                    formData.faturamento === faturamento
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-form-input-bg border border-form-input-border text-white hover:border-primary/50'
                  }`}
                >
                  {faturamento}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Pergunta 8 - Dificuldade
    if (step === 8) {
      const dificuldades = [
        'Atrair mais clientes',
        'Converter seguidores em clientes',
        'Escalar meu negócio',
        'Organizar minha rotina',
        'Outro'
      ];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-6">Qual é a sua maior dificuldade hoje?</h2>
            <div className="space-y-3">
              {dificuldades.map((dificuldade) => (
                <button
                  key={dificuldade}
                  onClick={() => updateField('dificuldade', dificuldade)}
                  className={`w-full px-4 md:px-6 py-3 md:py-4 text-base md:text-lg rounded-lg border-2 transition-all ${
                    formData.dificuldade === dificuldade
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-form-input-bg border border-form-input-border text-white hover:border-primary/50'
                  }`}
                >
                  {dificuldade}
                </button>
              ))}
            </div>
            {formData.dificuldade === 'Outro' && (
              <div className="mt-4">
                <textarea
                  value={formData.outraDificuldade || ''}
                  onChange={(e) => updateField('outraDificuldade', e.target.value)}
                  placeholder="Descreva sua dificuldade..."
                  className="w-full px-4 py-3 md:py-4 text-base md:text-lg rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-form-input-bg border border-form-input-border text-white placeholder:text-muted-foreground min-h-[100px]"
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Pergunta 9 - Investimento
    if (step === 9) {
      const investimentos = [
        'Sim, estou pronto para investir',
        'Depende do valor',
        'Ainda não posso investir'
      ];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-6">Você está disposto a investir em uma mentoria?</h2>
            <div className="space-y-3">
              {investimentos.map((investimento) => (
                <button
                  key={investimento}
                  onClick={() => updateField('investimento', investimento)}
                  className={`w-full px-4 md:px-6 py-3 md:py-4 text-base md:text-lg rounded-lg border-2 transition-all ${
                    formData.investimento === investimento
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-form-input-bg border border-form-input-border text-white hover:border-primary/50'
                  }`}
                >
                  {investimento}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Pergunta 10 - Data
    if (step === 10) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-6">Escolha a melhor data para sua entrevista:</h2>
            <div className="space-y-3">
              {availableDates.length === 0 ? (
                <p className="text-gray-300 text-center py-4">
                  Nenhuma data disponível no momento. Por favor, tente novamente mais tarde.
                </p>
              ) : (
                availableDates.map((date) => {
                  const dateStr = formatDateForDB(date);
                  return (
                    <button
                      key={dateStr}
                      onClick={() => updateField('data_agendamento', dateStr)}
                      className={`w-full px-4 md:px-6 py-3 md:py-4 text-base md:text-lg rounded-lg border-2 transition-all ${
                        formData.data_agendamento === dateStr
                          ? 'bg-primary/20 border-primary text-white'
                          : 'bg-form-input-bg border border-form-input-border text-white hover:border-primary/50'
                      }`}
                    >
                      {formatDateForDisplay(date)}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      );
    }

    // Pergunta 11 - Horário
    if (step === 11) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-6">Escolha o melhor horário:</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableTimes.length === 0 ? (
                <p className="text-gray-300 text-center py-4 col-span-full">
                  Nenhum horário disponível para esta data.
                </p>
              ) : (
                availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => updateField('horario_agendamento', time)}
                    className={`px-4 md:px-6 py-3 md:py-4 text-base md:text-lg rounded-lg border-2 transition-all ${
                      formData.horario_agendamento === time
                        ? 'bg-primary/20 border-primary text-white'
                        : 'bg-form-input-bg border border-form-input-border text-white hover:border-primary/50'
                    }`}
                  >
                    {time}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      );
    }

    // Página de agradecimento
    if (step === 12) {
      return (
        <div className="space-y-6 text-center max-w-2xl mx-auto">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              🎉 Parabéns, {formData.nome.split(' ')[0]}!
            </h2>
            <p className="text-base md:text-xl text-gray-300">
              Sua entrevista foi agendada com sucesso!
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/10">
            <h3 className="text-lg md:text-2xl font-semibold text-white mb-4">
              📅 Detalhes do seu agendamento:
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Data:</span>
                <span className="text-white font-medium">
                  {formatDateForDisplay(new Date(formData.data_agendamento + 'T00:00:00'))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Horário:</span>
                <span className="text-white font-medium">{formData.horario_agendamento}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm md:text-base text-gray-300">
              📧 Enviamos uma confirmação para <span className="text-white font-medium">{formData.email}</span>
            </p>
            <p className="text-sm md:text-base text-gray-300">
              📱 E também para o WhatsApp <span className="text-white font-medium">{formData.telefone}</span>
            </p>
          </div>

          <div className="pt-6">
            <p className="text-base md:text-lg text-white font-medium mb-4">
              Enquanto isso, assista este vídeo importante:
            </p>
            <div 
              ref={videoContainerRef}
              id="vid_692066657cc713fc76f626ec" 
              className="w-full aspect-video rounded-lg overflow-hidden bg-black/50"
            ></div>
          </div>

          <div className="pt-4">
            <p className="text-xs md:text-sm text-gray-400">
              Fique atento ao seu e-mail e WhatsApp para mais informações sobre a entrevista.
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <FormHeader />
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-2xl border border-white/10">
          {step < 12 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm md:text-base text-gray-400">
                  Pergunta {step} de 11
                </span>
                <span className="text-sm md:text-base text-gray-400">
                  {Math.round((step / 11) * 100)}%
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 11) * 100}%` }}
                />
              </div>
            </div>
          )}

          {renderStep()}

          {error && (
            <div className="mt-4 p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm md:text-base">{error}</p>
            </div>
          )}

          {step < 12 && (
            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="px-6 md:px-8 py-3 md:py-4 text-base md:text-lg rounded-lg border-2 border-white/20 text-white hover:bg-white/5 transition-all"
                  disabled={isSubmitting || isSaving}
                >
                  Voltar
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={isSubmitting || isSaving}
                className="flex-1 px-6 md:px-8 py-3 md:py-4 text-base md:text-lg rounded-lg bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    {isSubmitting ? 'Finalizando...' : 'Salvando...'}
                  </span>
                ) : step === 11 ? (
                  'Finalizar'
                ) : (
                  'Continuar'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoriesCleitonQuerobin;
