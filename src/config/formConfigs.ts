export interface FormStepConfig {
  id: number;
  question: string;
  fieldName: string;
  type: 'text' | 'select' | 'radio' | 'date' | 'time' | 'phone' | 'email' | 'textarea';
  options?: string[];
  placeholder?: string;
  validation?: {
    required: boolean;
    minLength?: number;
    pattern?: RegExp;
    errorMessage: string;
  };
}

export interface FormConfig {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  steps: FormStepConfig[];
  scheduling: {
    enabled: boolean;
    availableTimes: string[];
  };
  googleSheet?: {
    spreadsheetId: string;
  };
}

export const formConfigs: Record<string, FormConfig> = {};
