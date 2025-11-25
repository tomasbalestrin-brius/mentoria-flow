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

export const formConfigs: Record<string, FormConfig> = {
  'bio': {
    id: 'bio',
    title: 'Formulário Bio',
    description: 'Aplicação para Mentoria',
    steps: [],
    scheduling: {
      enabled: true,
      availableTimes: []
    },
    googleSheet: {
      spreadsheetId: '1RsPpGt3BDOVBGii5FzJly8pufnathWXwhBKBh-4gYy8'
    }
  },
  'feed-cleiton-querobin': {
    id: 'feed-cleiton-querobin',
    title: 'Feed Cleiton Querobin',
    description: 'Aplicação para Mentoria - Feed',
    steps: [],
    scheduling: {
      enabled: true,
      availableTimes: []
    },
    googleSheet: {
      spreadsheetId: '1i32baM2j8C8V4_zhc4zh0tI0hc5y9istEUGa6UsBdR0'
    }
  },
  'stories-cleiton-querobin': {
    id: 'stories-cleiton-querobin',
    title: 'Stories Cleiton Querobin',
    description: 'Aplicação para Mentoria - Stories',
    steps: [],
    scheduling: {
      enabled: true,
      availableTimes: []
    },
    googleSheet: {
      spreadsheetId: '1D8iSRnlwUJAITQfd8zQ8-nKqLtXXNoOGGTCQetjlQF8'
    }
  }
};
