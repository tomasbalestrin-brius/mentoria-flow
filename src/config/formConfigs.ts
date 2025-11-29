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
  },
  'youtube-cleiton-querobin': {
    id: 'youtube-cleiton-querobin',
    title: 'Youtube Cleiton Querobin',
    description: 'Aplicação para Mentoria - Youtube',
    steps: [],
    scheduling: {
      enabled: true,
      availableTimes: []
    },
    googleSheet: {
      spreadsheetId: '1zaF7Ln6dr1S0M21BTCr_RvQJHGmrN7WtM2AJrV-7eho'
    }
  },
  'stories-julia-ottoni': {
    id: 'stories-julia-ottoni',
    title: 'Stories Julia Ottoni',
    description: 'Aplicação para Mentoria - Stories Julia Ottoni',
    steps: [],
    scheduling: {
      enabled: true,
      availableTimes: []
    },
    googleSheet: {
      spreadsheetId: '133gBqiRXlPTG1kDN_Zo0G4RaOFZjn_unuqcApqFakZg'
    }
  },
  'feed-julia-ottoni': {
    id: 'feed-julia-ottoni',
    title: 'Feed Julia Ottoni',
    description: 'Aplicação para Mentoria - Feed Julia Ottoni',
    steps: [],
    scheduling: {
      enabled: true,
      availableTimes: []
    },
    googleSheet: {
      spreadsheetId: '10p8wQKI2gBKK8kwhQ2vqzQ_xIMcFpvOJQmwkUMbkMZw'
    }
  }
};
