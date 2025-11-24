import { useState, useEffect } from 'react';
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

const SPREADSHEET_ID = '1RsPpGt3BDOVBGii5FzJly8pufnathWXwhBKBh-4gYy8';

export const useFormPersistence = () => {
  const [recordId, setRecordId] = useState<string | null>(null);
  const [sheetRowId, setSheetRowId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Recuperar IDs do localStorage ao inicializar
  useEffect(() => {
    const savedRecordId = localStorage.getItem('formRecordId');
    const savedSheetRowId = localStorage.getItem('formSheetRowId');
    
    if (savedRecordId) setRecordId(savedRecordId);
    if (savedSheetRowId) setSheetRowId(parseInt(savedSheetRowId));
  }, []);

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
      
      const { data, error } = await supabase.functions.invoke('sheets-sync', {
        body: {
          values,
          spreadsheetId: SPREADSHEET_ID,
          rowId: sheetRowId
        }
      });

      if (error) throw error;
      
      // Se foi uma nova inserção, guardar o row ID
      if (!sheetRowId && data?.result?.updates?.updatedRange) {
        const match = data.result.updates.updatedRange.match(/A(\d+)/);
        if (match) {
          const rowId = parseInt(match[1]);
          setSheetRowId(rowId);
          // Salvar no localStorage
          localStorage.setItem('formSheetRowId', rowId.toString());
        }
      }
      
      console.log('Sheets sync successful:', data);
    } catch (error) {
      console.error('Error syncing with sheets:', error);
    }
  };

  const saveProgress = async (formData: FormData, step: number) => {
    setIsSaving(true);
    try {
      // Preparar dados sem outraDificuldade (que não existe como coluna)
      const { outraDificuldade, ...dataToSave } = formData;
      const finalData = {
        ...dataToSave,
        dificuldade: formData.dificuldade === 'Outro' 
          ? formData.outraDificuldade 
          : formData.dificuldade,
        ultima_pergunta: step,
      };

      // Salvar no Supabase
      if (recordId) {
        const { error } = await supabase
          .from('aplicacoes_mentoria')
          .update(finalData)
          .eq('id', recordId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('aplicacoes_mentoria')
          .insert([finalData])
          .select()
          .single();
        
        if (error) throw error;
        if (data) {
          setRecordId(data.id);
          // Salvar no localStorage
          localStorage.setItem('formRecordId', data.id);
        }
      }

      // Sincronizar com Google Sheets
      await syncWithSheets(formData, step, false);
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    } finally {
      setIsSaving(false);
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
        .maybeSingle();

      if (checkError) {
        console.error('Error checking availability:', checkError);
      }

      if (existingBooking) {
        throw new Error('Este horário já está agendado. Por favor, escolha outro horário.');
      }

      // Atualizar status para completo
      if (recordId) {
        const { error } = await supabase
          .from('aplicacoes_mentoria')
          .update({ 
            status: 'Completo',
            data_agendamento: formData.data_agendamento,
            horario_agendamento: formData.horario_agendamento
          })
          .eq('id', recordId);
        
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
          status: 'Completo'
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
      
      // Limpar localStorage após conclusão
      localStorage.removeItem('formRecordId');
      localStorage.removeItem('formSheetRowId');
    } catch (error) {
      console.error('Error completing form:', error);
      throw error;
    }
  };

  return { saveProgress, completeForm, isSaving };
};