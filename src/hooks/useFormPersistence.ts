import { useState } from 'react';
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
          setSheetRowId(parseInt(match[1]));
        }
      }
      
      console.log('Sheets sync successful:', data);
    } catch (error) {
      console.error('Error syncing with sheets:', error);
    }
  };

  const saveProgress = async (formData: FormData, step: number) => {
    try {
      // Salvar no Supabase
      if (recordId) {
        const { error } = await supabase
          .from('aplicacoes_mentoria')
          .update({
            ...formData,
            dificuldade: formData.dificuldade === 'Outro' 
              ? formData.outraDificuldade 
              : formData.dificuldade,
            ultima_pergunta: step,
          })
          .eq('id', recordId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('aplicacoes_mentoria')
          .insert([{
            ...formData,
            dificuldade: formData.dificuldade === 'Outro' 
              ? formData.outraDificuldade 
              : formData.dificuldade,
            ultima_pergunta: step,
          }])
          .select()
          .single();
        
        if (error) throw error;
        if (data) setRecordId(data.id);
      }

      // Sincronizar com Google Sheets
      await syncWithSheets(formData, step, false);
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  };

  const completeForm = async (formData: FormData) => {
    try {
      // Atualizar status para completo
      if (recordId) {
        const { error: updateError } = await supabase
          .from('aplicacoes_mentoria')
          .update({ 
            status: 'completo',
            ...formData,
            dificuldade: formData.dificuldade === 'Outro' 
              ? formData.outraDificuldade 
              : formData.dificuldade,
          })
          .eq('id', recordId);
        
        if (updateError) throw updateError;
      }

      // Criar agendamento
      const { error: agendamentoError } = await supabase
        .from('agendamentos')
        .insert([{
          data_agendamento: formData.data_agendamento,
          horario_agendamento: formData.horario_agendamento,
          nome_cliente: formData.nome,
          email_cliente: formData.email,
          telefone_cliente: formData.telefone,
        }]);
      
      if (agendamentoError) {
        // Se horário já está ocupado, avisar usuário
        if (agendamentoError.code === '23505') {
          throw new Error('Este horário já foi reservado. Por favor, escolha outro horário.');
        }
        throw agendamentoError;
      }

      // Atualizar Google Sheets com status completo
      await syncWithSheets(formData, 11, true);
    } catch (error) {
      console.error('Error completing form:', error);
      throw error;
    }
  };

  return { saveProgress, completeForm };
};