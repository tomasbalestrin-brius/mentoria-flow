import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formConfigs } from '@/config/formConfigs';
import { useFormPersistence, type FormData } from '@/hooks/useFormPersistence';
import { FormHeader } from '@/components/FormHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { formatDateForDB, filterAvailableTimes, isMondayBlockedTime } from '@/lib/dateUtils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface FormPageProps {
  formType: string;
}

export default function FormPage({ formType }: FormPageProps) {
  const config = formConfigs[formType];
  const navigate = useNavigate();
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { saveProgress, completeForm, isSaving } = useFormPersistence(formType);

  // Carregar progresso salvo
  useEffect(() => {
    const savedProgress = localStorage.getItem(`form_progress_${formType}`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setFormData(parsed.data || {});
        setStep(parsed.step || 1);
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      }
    }
  }, [formType]);

  // Carregar horários disponíveis quando uma data é selecionada
  useEffect(() => {
    if (selectedDate && config.scheduling.enabled) {
      loadAvailableTimes(selectedDate);
    }
  }, [selectedDate, formType]);

  const loadAvailableTimes = async (date: Date) => {
    setIsLoadingTimes(true);
    try {
      const dateStr = formatDateForDB(date);
      const { data: supabaseData, error } = await supabase
        .from('agendamentos')
        .select('horario_agendamento')
        .eq('data_agendamento', dateStr)
        .eq('tipo_formulario', formType);

      if (error) throw error;

      const bookedTimes = supabaseData?.map(a => {
        const time = a.horario_agendamento || '';
        return time.substring(0, 5);
      }).filter(Boolean) || [];

      const filtered = filterAvailableTimes(config.scheduling.availableTimes, bookedTimes, date);
      setAvailableTimes(filtered);
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
      toast.error('Erro ao carregar horários disponíveis');
    } finally {
      setIsLoadingTimes(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    const currentStep = config.steps[step - 1];
    
    // Validação
    if (currentStep.validation?.required) {
      const value = formData[currentStep.fieldName as keyof FormData];
      if (!value || value.trim() === '') {
        toast.error(currentStep.validation.errorMessage);
        return;
      }
    }

    // Salvar progresso
    try {
      await saveProgress(formData, step);
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }

    if (step < config.steps.length) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await completeForm(formData);
      toast.success('Formulário enviado com sucesso!');
      localStorage.removeItem(`form_progress_${formType}`);
      
      // Redirecionar para página de sucesso (você pode criar uma depois)
      toast.success('Agendamento confirmado! Entraremos em contato em breve.');
    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error);
      toast.error(error.message || 'Erro ao enviar formulário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Formulário não encontrado</h1>
          <p className="text-gray-400">
            Este formulário não está disponível.
          </p>
        </div>
      </div>
    );
  }

  const currentStep = config.steps[step - 1];
  const progressPercentage = (step / config.steps.length) * 100;

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div className="space-y-4">
            <Label htmlFor={currentStep.fieldName} className="text-white text-lg">
              {currentStep.question}
            </Label>
            <Input
              id={currentStep.fieldName}
              type={currentStep.type}
              value={formData[currentStep.fieldName as keyof FormData] || ''}
              onChange={(e) => handleInputChange(currentStep.fieldName, e.target.value)}
              placeholder={currentStep.placeholder}
              className="text-lg py-6"
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-4">
            <Label htmlFor={currentStep.fieldName} className="text-white text-lg">
              {currentStep.question}
            </Label>
            <Textarea
              id={currentStep.fieldName}
              value={formData[currentStep.fieldName as keyof FormData] || ''}
              onChange={(e) => handleInputChange(currentStep.fieldName, e.target.value)}
              placeholder={currentStep.placeholder}
              className="min-h-32"
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-4">
            <Label className="text-white text-lg">{currentStep.question}</Label>
            <Select
              value={formData[currentStep.fieldName as keyof FormData] || ''}
              onValueChange={(value) => handleInputChange(currentStep.fieldName, value)}
            >
              <SelectTrigger className="text-lg py-6">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {currentStep.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-4">
            <Label className="text-white text-lg">{currentStep.question}</Label>
            <RadioGroup
              value={formData[currentStep.fieldName as keyof FormData] || ''}
              onValueChange={(value) => handleInputChange(currentStep.fieldName, value)}
            >
              {currentStep.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="text-white cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'date':
        return (
          <div className="space-y-4">
            <Label className="text-white text-lg">{currentStep.question}</Label>
            <Card className="bg-white">
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    if (date) {
                      handleInputChange('data_agendamento', formatDateForDB(date));
                    }
                  }}
                  disabled={(date) => date < new Date()}
                  className="rounded-md"
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'time':
        return (
          <div className="space-y-4">
            <Label className="text-white text-lg">{currentStep.question}</Label>
            {isLoadingTimes ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {availableTimes.map((time) => {
                  const isBlocked = selectedDate ? isMondayBlockedTime(time, selectedDate) : false;
                  return (
                    <Button
                      key={time}
                      variant={formData.horario_agendamento === time ? 'default' : 'outline'}
                      onClick={() => !isBlocked && handleInputChange('horario_agendamento', time)}
                      className={`py-6 ${isBlocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                      disabled={isBlocked}
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            )}
            {availableTimes.length === 0 && !isLoadingTimes && (
              <p className="text-center text-gray-400">
                Nenhum horário disponível para esta data
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <FormHeader />
      
      <div className="max-w-4xl mx-auto px-8 pb-16">
        {/* Barra de progresso */}
        <div className="mb-8">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-white text-center mt-2">
            Pergunta {step} de {config.steps.length}
          </p>
        </div>

        {/* Vídeo (apenas no primeiro step) */}
        {step === 1 && config.videoUrl && (
          <div className="mb-8">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={config.videoUrl}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Conteúdo do step */}
        <Card className="bg-gray-800/50 backdrop-blur border-gray-700">
          <CardContent className="p-8">
            {renderStepContent()}

            {/* Botões de navegação */}
            <div className="flex gap-4 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isSaving || isSubmitting}
                >
                  Voltar
                </Button>
              )}
              
              {step < config.steps.length ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Próximo'}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finalizar'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
