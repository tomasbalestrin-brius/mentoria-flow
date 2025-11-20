import { format, addDays, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const getNextWorkingDays = (count: number): Date[] => {
  const workingDays: Date[] = [];
  let currentDate = new Date();
  
  // Adicionar hoje se for dia útil
  if (!isWeekend(currentDate)) {
    workingDays.push(new Date(currentDate));
  }
  
  // Adicionar próximos dias úteis
  while (workingDays.length < count) {
    currentDate = addDays(currentDate, 1);
    if (!isWeekend(currentDate)) {
      workingDays.push(new Date(currentDate));
    }
  }
  
  return workingDays;
};

export const formatDateForDisplay = (date: Date): string => {
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  const dayName = format(date, "EEEE", { locale: ptBR });
  const formattedDate = format(date, "d 'de' MMMM", { locale: ptBR });
  
  // Check if it's today
  if (formatDateForDB(date) === formatDateForDB(today)) {
    return `${dayName}, ${formattedDate} (hoje)`;
  }
  
  // Check if it's tomorrow
  if (formatDateForDB(date) === formatDateForDB(tomorrow)) {
    return `${dayName}, ${formattedDate} (amanhã)`;
  }
  
  return `${dayName}, ${formattedDate}`;
};

export const formatDateForDB = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const AVAILABLE_TIMES = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
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