import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FormData {
  nome: string;
  telefone: string;
  email: string;
  instagram: string;
  nicho: string;
  cargo: string;
  faturamento: string;
  dificuldade: string;
  outraDificuldade?: string;
  investimento: string;
  data_agendamento: string;
  horario_agendamento: string;
}

const SPREADSHEET_IDS: Record<string, string> = {
  'bio': '1RsPpGt3BDOVBGii5FzJly8pufnathWXwhBKBh-4gYy8',
  'feed-cleiton-querobin': '1i32baM2j8C8V4_zhc4zh0tI0hc5y9istEUGa6UsBdR0',
  'stories-cleiton-querobin': '1D8iSRnlwUJAITQfd8zQ8-nKqLtXXNoOGGTCQetjlQF8'
};

export const useFormPersistence = (formType: string = 'bio') => {
  const [isSaving, setIsSaving] = useState(false);
  
  // Usar useRef para evitar race conditions
  const recordIdRef = useRef<string | null>(null);
  const sheetRowIdRef = useRef<number | null>(null);
  const saveLockRef = useRef<boolean>(false);
  
  const spreadsheetId = SPREADSHEET_IDS[formType] || SPREADSHEET_IDS['bio'];

  // Recuperar IDs do localStorage ao inicializar (isolado por tipo de formulário)
  useEffect(() => {
    const savedRecordId = localStorage.getItem(`formRecordId_${formType}`);
    const savedSheetRowId = localStorage.getItem(`formSheetRowId_${formType}`);
    
    if (savedRecordId) recordIdRef.current = savedRecordId;
    if (savedSheetRowId) sheetRowIdRef.current = parseInt(savedSheetRowId);
  }, [formType]);

  const formatDataForSheets = (formData: FormData, step: number, isComplete: boolean) => {
    return [
      new Date().toISOString(),
      formData.nome || '',
      formData.telefone || '',
      formData.email || '',
      formData.instagram || '',
      formData.nicho || '',
      formData.cargo || '',
      formData.faturamento || '',
      formData.dificuldade === 'Outro' ? formData.outraDificuldade || '' : formData.dificuldade || '',
      formData.investimento || '',
      formData.data_agendamento || '',
      formData.horario_agendamento || '',
      isComplete ? 'Completo' : 'Incompleto',
      step.toString()
    ];
  };

  const syncWithSheets = async (formData: FormData, step: number, isComplete: boolean) => {
    try {
      const values = formatDataForSheets(formData, step, isComplete);
      
      // Verificar localStorage diretamente para valor mais recente do sheetRowId
      const currentSheetRowId = sheetRowIdRef.current || 
        (localStorage.getItem(`formSheetRowId_${formType}`) 
          ? parseInt(localStorage.getItem(`formSheetRowId_${formType}`)!) 
          : null);
      
      // Só usar rowId se também temos recordId (indicando continuação do mesmo formulário)
      const currentRecordId = recordIdRef.current || localStorage.getItem(`formRecordId_${formType}`);
      const rowIdToUse = currentRecordId ? currentSheetRowId : null;
      
      const { data, error } = await supabase.functions.invoke('sheets-sync', {
        body: {
          values,
          spreadsheetId: spreadsheetId,
          rowId: rowIdToUse,
          sheetName: 'Base'
        }
      });

      if (error) throw error;
      
      // Se foi uma nova inserção, guardar o row ID
      if (!sheetRowIdRef.current && data?.result?.updates?.updatedRange) {
        const match = data.result.updates.updatedRange.match(/A(\d+)/);
        if (match) {
          const rowId = parseInt(match[1]);
          sheetRowIdRef.current = rowId;
          // Salvar no localStorage (isolado por tipo)
          localStorage.setItem(`formSheetRowId_${formType}`, rowId.toString());
        }
      }
      
      console.log('Sheets sync successful:', data);
    } catch (error) {
      console.error('Error syncing with sheets:', error);
    }
  };

  const saveProgress = async (formData: FormData, step: number) => {
    // Evitar chamadas paralelas usando lock
    if (saveLockRef.current) {
      console.log('Save already in progress, skipping...');
      return;
    }
    
    saveLockRef.current = true;
    setIsSaving(true);
    
    try {
      // Verificar localStorage diretamente para garantir valor mais recente
      const currentRecordId = recordIdRef.current || localStorage.getItem(`formRecordId_${formType}`);
      
      // Preparar dados sem outraDificuldade (que não existe como coluna)
      const { outraDificuldade, ...dataToSave } = formData;
      const finalData = {
        ...dataToSave,
        dificuldade: formData.dificuldade === 'Outro' 
          ? formData.outraDificuldade 
          : formData.dificuldade,
        ultima_pergunta: step,
        tipo_formulario: formType,
      };

      // Salvar no Supabase
      if (currentRecordId) {
        const { error } = await supabase
          .from('aplicacoes_mentoria')
          .update(finalData)
          .eq('id', currentRecordId);
        
        if (error) throw error;
        recordIdRef.current = currentRecordId;
      } else {
        // Limpar sheetRowId - novo formulário = nova linha na planilha
        sheetRowIdRef.current = null;
        localStorage.removeItem(`formSheetRowId_${formType}`);
        
        const { data, error } = await supabase
          .from('aplicacoes_mentoria')
          .insert([finalData])
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          recordIdRef.current = data.id;
          // Salvar no localStorage (isolado por tipo)
          localStorage.setItem(`formRecordId_${formType}`, data.id);
        }
      }

      // Sincronizar com Google Sheets
      await syncWithSheets(formData, step, false);
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    } finally {
      setIsSaving(false);
      saveLockRef.current = false;
    }
  };

  const completeForm = async (formData: FormData) => {
    try {
      // VALIDAÇÃO: Verificar se o horário ainda está disponível antes de tentar agendar
      console.log('Validating time slot availability...');
      const { data: existingBooking, error: checkError } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('data_agendamento', formData.data_agendamento)
        .eq('horario_agendamento', formData.horario_agendamento)
        .eq('tipo_formulario', formType)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking availability:', checkError);
      }

      if (existingBooking) {
        throw new Error('Este horário já está agendado. Por favor, escolha outro horário.');
      }

      // Atualizar status para completo
      const currentRecordId = recordIdRef.current || localStorage.getItem(`formRecordId_${formType}`);
      if (currentRecordId) {
        const { error } = await supabase
          .from('aplicacoes_mentoria')
          .update({ 
            status: 'Completo',
            data_agendamento: formData.data_agendamento,
            horario_agendamento: formData.horario_agendamento,
            tipo_formulario: formType,
          })
          .eq('id', currentRecordId);
        
        if (error) throw error;
      }

      // Criar agendamento na tabela de agendamentos
      const { error: agendamentoError } = await supabase
        .from('agendamentos')
        .insert({
          nome_cliente: formData.nome,
          email_cliente: formData.email,
          telefone_cliente: formData.telefone,
          data_agendamento: formData.data_agendamento!,
          horario_agendamento: formData.horario_agendamento!,
          status: 'Completo',
          tipo_formulario: formType,
        });

      if (agendamentoError) {
        if (agendamentoError.code === '23505') {
          throw new Error('Este horário já está agendado. Por favor, escolha outro horário.');
        }
        throw agendamentoError;
      }

      // Criar evento no Google Calendar
      try {
        const { error: calendarError } = await supabase.functions.invoke('create-calendar-event', {
          body: {
            clientName: formData.nome,
            clientEmail: formData.email,
            clientPhone: formData.telefone,
            date: formData.data_agendamento,
            time: formData.horario_agendamento,
            formData: {
              nicho: formData.nicho,
              cargo: formData.cargo,
              faturamento: formData.faturamento,
              dificuldade: formData.dificuldade,
              investimento: formData.investimento
            }
          }
        });

        if (calendarError) {
          console.error('Error creating calendar event:', calendarError);
          // Não falhar o fluxo completo se o Calendar falhar
          // O agendamento já foi salvo no Supabase
        }
      } catch (calendarError) {
        console.error('Error calling calendar function:', calendarError);
        // Continuar mesmo se o Calendar falhar
      }

      // Sincronizar com Google Sheets com status completo
      await syncWithSheets(formData, 12, true);
      
      // Limpar localStorage após conclusão (isolado por tipo)
      localStorage.removeItem(`formRecordId_${formType}`);
      localStorage.removeItem(`formSheetRowId_${formType}`);
    } catch (error) {
      console.error('Error completing form:', error);
      throw error;
    }
  };

  return { saveProgress, completeForm, isSaving };
};