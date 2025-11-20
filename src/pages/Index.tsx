import { useState, useEffect } from 'react';
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

const Index = () => {
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
  
  const { saveProgress, completeForm } = useFormPersistence();

  useEffect(() => {
    // Gerar hoje + próximos 2 dias úteis (total 3 dias)
    const dates = getNextWorkingDays(3);
    setAvailableDates(dates);
  }, []);

  useEffect(() => {
    // Buscar horários disponíveis quando uma data for selecionada
    if (formData.data_agendamento) {
      fetchAvailableTimes(formData.data_agendamento);
    }
  }, [formData.data_agendamento]);

  const fetchAvailableTimes = async (date: string) => {
    try {
      // Buscar horários ocupados da planilha Google Sheets
      const { data: sheetData, error: sheetError } = await supabase.functions.invoke('get-booked-times', {
        body: {
          date,
          spreadsheetId: '1RsPpGt3BDOVBGii5FzJly8pufnathWXwhBKBh-4gYy8'
        }
      });

      if (sheetError) {
        console.error('Error fetching from sheets:', sheetError);
        // Se falhar, tentar do Supabase
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('agendamentos')
          .select('horario_agendamento')
          .eq('data_agendamento', date);
        
        if (supabaseError) throw supabaseError;
        const bookedTimes = supabaseData.map(a => a.horario_agendamento);
        const selectedDate = new Date(date + 'T00:00:00');
        const filtered = filterAvailableTimes(AVAILABLE_TIMES, bookedTimes, selectedDate);
        setAvailableTimes(filtered);
        return;
      }
      
      const bookedTimes = sheetData?.bookedTimes || [];
      const selectedDate = new Date(date + 'T00:00:00');
      const filtered = filterAvailableTimes(AVAILABLE_TIMES, bookedTimes, selectedDate);
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
      if (error.message.includes('horário já foi reservado')) {
        setError(error.message);
        setStep(11); // Voltar para seleção de horário
      } else {
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
          <p className="text-base md:text-lg text-muted-foreground">
            Gostaríamos de saber um pouco mais sobre você para indicar o programa que melhor se encaixa ao seu perfil
          </p>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Qual é o seu nome completo?</h2>
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
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Qual é o seu telefone?</h2>
            <p className="text-base md:text-lg text-gray-300 mb-4">Inclua o DDD</p>
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
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Qual é o seu e-mail?</h2>
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
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Qual é o seu Instagram?</h2>
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
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Qual é o seu nicho de atuação?</h2>
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
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Qual é o seu cargo na empresa?</h2>
            <div className="space-y-3">
              {cargos.map((cargo) => (
                <label
                  key={cargo}
                  className={`flex items-center p-3 md:p-4 rounded-lg cursor-pointer transition ${
                    formData.cargo === cargo
                      ? 'bg-accent border border-accent-foreground'
                      : 'bg-secondary border border-border hover:bg-secondary/80'
                  }`}
                  onClick={() => updateField('cargo', cargo)}
                >
                  <input
                    type="radio"
                    name="cargo"
                    value={cargo}
                    checked={formData.cargo === cargo}
                    onChange={() => updateField('cargo', cargo)}
                    className="mr-3 h-4 w-4"
                  />
                  <span className="text-white text-sm md:text-base">{cargo}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Pergunta 7 - Faturamento
    if (step === 7) {
      const faturamentos = [
        'Ainda não fatura',
        '5-15k',
        '15-50k',
        '50-100k',
        '100-200k',
        '200-500k',
        'Acima de 500k'
      ];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Qual é o seu faturamento mensal?</h2>
            <div className="space-y-3">
              {faturamentos.map((faturamento) => (
                <label
                  key={faturamento}
                  className={`flex items-center p-3 md:p-4 rounded-lg cursor-pointer transition ${
                    formData.faturamento === faturamento
                      ? 'bg-accent border border-accent-foreground'
                      : 'bg-secondary border border-border hover:bg-secondary/80'
                  }`}
                  onClick={() => updateField('faturamento', faturamento)}
                >
                  <input
                    type="radio"
                    name="faturamento"
                    value={faturamento}
                    checked={formData.faturamento === faturamento}
                    onChange={() => updateField('faturamento', faturamento)}
                    className="mr-3 h-4 w-4"
                  />
                  <span className="text-white text-sm md:text-base">{faturamento}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Pergunta 8 - Dificuldade
    if (step === 8) {
      const dificuldades = [
        'Não consigo atrair leads qualificados de forma consistente.',
        'Tenho dificuldade em converter os leads que chegam em vendas.',
        'Estou preso demais na operação e não consigo focar no crescimento.',
        'Meu negócio até cresce, mas sem estrutura, equipe ou processos sólidos.',
        'Não tenho clareza dos números e isso trava minhas decisões.',
        'Outro'
      ];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6">Qual é a sua principal dificuldade hoje?</h2>
            <div className="space-y-3">
              {dificuldades.map((dificuldade) => (
                <label
                  key={dificuldade}
                  className={`flex items-center p-3 md:p-4 rounded-lg cursor-pointer transition ${
                    formData.dificuldade === dificuldade
                      ? 'bg-accent border border-accent-foreground'
                      : 'bg-secondary border border-border hover:bg-secondary/80'
                  }`}
                  onClick={() => updateField('dificuldade', dificuldade)}
                >
                  <input
                    type="radio"
                    name="dificuldade"
                    value={dificuldade}
                    checked={formData.dificuldade === dificuldade}
                    onChange={() => updateField('dificuldade', dificuldade)}
                    className="mr-3 h-4 w-4"
                  />
                  <span className="text-white text-sm md:text-base">{dificuldade}</span>
                </label>
              ))}
            </div>
            {formData.dificuldade === 'Outro' && (
              <textarea
                value={formData.outraDificuldade}
                onChange={(e) => updateField('outraDificuldade', e.target.value)}
                placeholder="Descreva sua principal dificuldade..."
                className="w-full mt-4 px-4 py-3 md:py-4 text-base md:text-lg rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-form-input-bg border border-form-input-border text-white placeholder:text-muted-foreground"
                rows={4}
              />
            )}
          </div>
        </div>
      );
    }

    // Pergunta 9 - Investimento
    if (step === 9) {
      const investimentos = [
        'Quero avaliar opções de parcelamento',
        'Ainda não estou decidido, quero mais Informações',
        'Pagamento à vista'
      ];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">O investimento para participar dos nossos programas é de R$ 9.997 a R$ 100k</h2>
            <p className="text-base md:text-lg text-gray-300 mb-6">Gostaria de seguir com o processo seletivo?</p>
            <div className="space-y-3">
              {investimentos.map((investimento) => (
                <label
                  key={investimento}
                  className={`flex items-center p-3 md:p-4 rounded-lg cursor-pointer transition ${
                    formData.investimento === investimento
                      ? 'bg-accent border border-accent-foreground'
                      : 'bg-secondary border border-border hover:bg-secondary/80'
                  }`}
                  onClick={() => updateField('investimento', investimento)}
                >
                  <input
                    type="radio"
                    name="investimento"
                    value={investimento}
                    checked={formData.investimento === investimento}
                    onChange={() => updateField('investimento', investimento)}
                    className="mr-3 h-4 w-4"
                  />
                  <span className="text-white text-sm md:text-base">{investimento}</span>
                </label>
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
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Escolha a data da sua call</h2>
            <p className="text-base md:text-lg text-gray-300 mb-6">Selecione o melhor dia para conversar com um especialista</p>
            <div className="space-y-3">
              {availableDates.map((date) => {
                const dateStr = formatDateForDB(date);
                const displayStr = formatDateForDisplay(date);
                return (
                  <label
                    key={dateStr}
                    className={`flex items-center p-3 md:p-4 rounded-lg cursor-pointer transition ${
                      formData.data_agendamento === dateStr
                        ? 'bg-accent border border-accent-foreground'
                        : 'bg-secondary border border-border hover:bg-secondary/80'
                    }`}
                    onClick={() => updateField('data_agendamento', dateStr)}
                  >
                    <input
                      type="radio"
                      name="data"
                      value={dateStr}
                      checked={formData.data_agendamento === dateStr}
                      onChange={() => updateField('data_agendamento', dateStr)}
                      className="mr-3 h-4 w-4"
                    />
                    <span className="text-white capitalize text-sm md:text-base">{displayStr}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Pergunta 11 - Horário
    if (step === 11) {
      const selectedDate = availableDates.find(
        d => formatDateForDB(d) === formData.data_agendamento
      );
      const displayDate = selectedDate ? formatDateForDisplay(selectedDate) : '';
      
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Escolha o horário</h2>
            <p className="text-base md:text-lg text-gray-300 mb-6 capitalize">Horários disponíveis para {displayDate}</p>
            {availableTimes.length === 0 ? (
              <div className="p-4 md:p-6 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-destructive text-sm md:text-base">
                  Não há horários disponíveis para esta data. Por favor, volte e escolha outra data.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {availableTimes.map((time) => (
                  <label
                    key={time}
                    className={`flex items-center justify-center p-3 md:p-4 rounded-lg cursor-pointer transition font-semibold text-sm md:text-base ${
                      formData.horario_agendamento === time
                        ? 'bg-primary text-white border border-primary'
                        : 'bg-secondary border border-border text-white hover:bg-secondary/80'
                    }`}
                    onClick={() => updateField('horario_agendamento', time)}
                  >
                    <input
                      type="radio"
                      name="horario"
                      value={time}
                      checked={formData.horario_agendamento === time}
                      onChange={() => updateField('horario_agendamento', time)}
                      className="sr-only"
                    />
                    {time}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Página de Agradecimento
    if (step === 12) {
      const selectedDate = availableDates.find(
        d => formatDateForDB(d) === formData.data_agendamento
      );
      const displayDate = selectedDate ? formatDateForDisplay(selectedDate) : '';
      const firstName = formData.nome.split(' ')[0];
      
      return (
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          {/* Obrigado com barra lateral */}
          <div className="flex gap-3 md:gap-4 items-start">
            <div className="w-1 h-12 md:h-16 bg-primary rounded-full flex-shrink-0" />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">Obrigado!</h1>
              <p className="text-base md:text-lg text-gray-300">
                Sua entrevista foi agendada com sucesso.
              </p>
            </div>
          </div>

          {/* Box de agendamento */}
          <div className="bg-secondary/50 border border-border rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-base md:text-lg capitalize">{displayDate}</p>
                <p className="text-primary font-bold text-xl md:text-2xl">{formData.horario_agendamento}</p>
              </div>
            </div>
          </div>

          {/* Texto informativo */}
          <p className="text-gray-300 text-center text-sm md:text-base">
            As informações sobre a entrevista foram adicionadas à sua agenda.
          </p>
          
          <p className="text-primary font-semibold text-center text-base md:text-lg">
            Entraremos em contato via link do Google Meet.
          </p>

          {/* Vídeo do YouTube - placeholder até receber o link */}
          <div className="aspect-video bg-secondary/30 border border-border rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm md:text-base">Vídeo será adicionado em breve</p>
            </div>
          </div>

          {/* Botão CTA */}
          <div className="text-center pt-2 md:pt-4">
            <a
              href="https://lp.bethelescoladenegocios.com.br/bethel-educacao-pag-ot-v1-h1"
              className="inline-block px-6 md:px-8 py-3 md:py-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition text-base md:text-lg"
            >
              Conheça nossos programas
            </a>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <FormHeader />
      
      <div className="max-w-xl mx-auto px-5 md:px-4 pb-12">
        <div className="min-h-[60vh]">
          {renderStep()}
        </div>
        
        {error && (
          <div className="mt-6 p-3 bg-destructive/20 border border-destructive rounded-lg">
            <p className="text-destructive text-sm text-center">{error}</p>
          </div>
        )}
        
        {step < 12 && (
          <div className="flex justify-between items-center mt-8">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground transition"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}
            
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 11 ? (isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento') : 'Continuar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;