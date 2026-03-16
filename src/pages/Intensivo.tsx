import { useState, useEffect, useRef } from 'react';
import { FormHeader } from '@/components/FormHeader';
import { useFormPersistence, FormData } from '@/hooks/useFormPersistence';
import { toast } from 'sonner';

const Intensivo = () => {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  
  const { saveProgress, completeForm, isSaving } = useFormPersistence('intensivo');

  // Auto-save com debounce
  useEffect(() => {
    if (isSubmitting) return;
    const hasData = formData.nome || formData.telefone || formData.email;
    if (!hasData) return;

    const timeoutId = setTimeout(() => {
      saveProgress(formData, step).catch(error => {
        console.error('Auto-save failed:', error);
      });
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [formData, step, isSubmitting]);

  // Captura ao sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      const hasData = formData.nome || formData.telefone || formData.email;
      if (hasData && !isSubmitting) {
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
    if (step === 10 && videoContainerRef.current) {
      const existingScript = document.getElementById('smartplayer-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'smartplayer-script';
        script.src = 'https://scripts.converteai.net/60c57e38-903d-4b8c-afdb-955793042b17/players/692066657cc713fc76f626ec/v4/player.js';
        script.async = true;
        document.head.appendChild(script);
      }
    }
  }, [step]);

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
    }
    
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    
    try {
      await saveProgress(formData, step);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
    
    if (step < 9) {
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
      setStep(10);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error('Error completing form:', error);
      setError('Erro ao finalizar aplicação. Tente novamente.');
      toast.error('Erro ao finalizar aplicação. Tente novamente.');
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

    if (step === 6) {
      const cargos = ['Dono', 'Gerente', 'Autônomo', 'Colaborador', 'Vendedor'];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-6">Qual é o seu cargo na empresa?</h2>
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
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-6">Qual é o seu faturamento mensal?</h2>
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

    if (step === 8) {
      const dificuldades = [
        'Não consigo atrair leads qualificados de forma consistente.',
        'Tenho dificuldade em converter os leads que chegam em vendas.',
        'Estou preso demais na operação e não consigo focar no crescimento.',
        'Meu negócio até cresce, mas sem estrutura, equipe ou processos sólidos.',
        'Não tenho clareza dos números e isso trava minhas decisões.',
        'Meu negócio cresce, mas quero multiplicar com mais método e previsibilidade.',
        'Outro'
      ];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-6">Qual é a sua principal dificuldade hoje?</h2>
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

    if (step === 9) {
      const investimentos = [
        'Quero avaliar opções de parcelamento',
        'Ainda não estou decidido, quero mais Informações',
        'Pagamento à vista'
      ];
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-[16px] md:text-2xl font-semibold md:font-bold text-white mb-2">O investimento para participar dos nossos programas é de R$ 9.997,00 à R$ 100.000,00</h2>
            <p className="text-[13px] md:text-lg text-gray-300 mb-6">Gostaria de seguir com o processo seletivo?</p>
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

    // Página de Agradecimento
    if (step === 10) {
      const firstName = formData.nome.split(' ')[0];
      
      return (
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <div className="flex gap-3 md:gap-4 items-start">
            <div className="w-1 h-12 md:h-16 bg-primary rounded-full flex-shrink-0" />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">Obrigado!</h1>
              <p className="text-base md:text-lg text-gray-300">
                Sua aplicação foi enviada com sucesso.
              </p>
            </div>
          </div>

          <div className="bg-secondary/50 border border-border rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-white font-semibold text-sm md:text-base">
                Se você for selecionado nossa equipe irá entrar em contato com você no seu WhatsApp
              </p>
            </div>
          </div>

          <div 
            ref={videoContainerRef}
            className="bg-secondary/30 border border-border rounded-lg overflow-hidden p-2"
            dangerouslySetInnerHTML={{
              __html: '<vturb-smartplayer id="vid-692066657cc713fc76f626ec" style="display: block; margin: 0 auto; width: 100%;"></vturb-smartplayer>'
            }}
          />

          <div className="text-center pt-2 md:pt-4">
            <a
              href="https://betheleducacao.com.br/"
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
      
      <div className="w-full flex items-center justify-center px-5 md:px-4 pb-12 min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-[90%] md:max-w-xl">
          <div>
            {renderStep()}
          </div>
          
          {error && (
            <div className="mt-6 p-3 bg-destructive/20 border border-destructive rounded-lg">
              <p className="text-destructive text-sm text-center">{error}</p>
            </div>
          )}
          
          {step < 10 && (
            <div className="flex justify-between items-center mt-8">
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground transition text-sm md:text-base"
                >
                  Voltar
                </button>
              ) : (
                <div />
              )}
              
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-5 md:px-8 py-[15px] md:py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {step === 9 ? (isSubmitting ? 'Finalizando...' : 'Finalizar') : 'Continuar'}
              </button>
            </div>
          )}
          
          {isSaving && step < 10 && (
            <div className="mt-4 text-center">
              <p className="text-xs md:text-sm text-muted-foreground">
                Salvando automaticamente...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Intensivo;
