import { format, addDays, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const getNextWorkingDays = (count: number): Date[] => {
  const workingDays: Date[] = [];
  let currentDate = new Date();
  
  while (workingDays.length < count) {
    currentDate = addDays(currentDate, 1);
    if (!isWeekend(currentDate)) {
      workingDays.push(new Date(currentDate));
    }
  }
  
  return workingDays;
};

export const formatDateForDisplay = (date: Date): string => {
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
};

export const formatDateForDB = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const AVAILABLE_TIMES = [
  '08:45', '09:45', '10:45', '11:45', 
  '13:45', '14:45', '15:45', '16:45', '17:45'
];

export const filterAvailableTimes = (
  times: string[], 
  bookedTimes: string[], 
  selectedDate: Date
): string[] => {
  const now = new Date();
  const isToday = formatDateForDB(selectedDate) === formatDateForDB(now);
  
  return times.filter(time => {
    // Remove horários já agendados
    if (bookedTimes.includes(time)) return false;
    
    // Se for hoje, remove horários que já passaram
    if (isToday) {
      const [hours, minutes] = time.split(':').map(Number);
      const timeDate = new Date();
      timeDate.setHours(hours, minutes, 0, 0);
      if (timeDate <= now) return false;
    }
    
    return true;
  });
};