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

// Configuração do formulário de Biologia (atual)
export const bioFormConfig: FormConfig = {
  id: 'bio',
  title: 'Mentoria Biologia',
  description: 'Aplicação para Mentoria de Biologia com Cleiton Querobin',
  videoUrl: 'https://www.youtube.com/embed/7tpz1cFcYQI',
  steps: [
    {
      id: 1,
      question: 'Qual é o seu nome completo?',
      fieldName: 'nome',
      type: 'text',
      placeholder: 'Digite seu nome completo',
      validation: {
        required: true,
        minLength: 3,
        errorMessage: 'Por favor, digite seu nome completo'
      }
    },
    {
      id: 2,
      question: 'Qual é o seu WhatsApp?',
      fieldName: 'telefone',
      type: 'phone',
      placeholder: '(00) 00000-0000',
      validation: {
        required: true,
        errorMessage: 'Por favor, digite um número válido'
      }
    },
    {
      id: 3,
      question: 'Qual é o seu e-mail?',
      fieldName: 'email',
      type: 'email',
      placeholder: 'seu@email.com',
      validation: {
        required: true,
        errorMessage: 'Por favor, digite um e-mail válido'
      }
    },
    {
      id: 4,
      question: 'Qual é o seu Instagram?',
      fieldName: 'instagram',
      type: 'text',
      placeholder: '@seu_instagram',
      validation: {
        required: true,
        errorMessage: 'Por favor, digite seu Instagram'
      }
    },
    {
      id: 5,
      question: 'Qual é o seu nicho?',
      fieldName: 'nicho',
      type: 'text',
      placeholder: 'Ex: Professor de Biologia, Estudante de Medicina...',
      validation: {
        required: true,
        errorMessage: 'Por favor, digite seu nicho'
      }
    },
    {
      id: 6,
      question: 'Qual é o seu cargo atual?',
      fieldName: 'cargo',
      type: 'text',
      placeholder: 'Ex: Professor, Estudante, Profissional...',
      validation: {
        required: true,
        errorMessage: 'Por favor, digite seu cargo'
      }
    },
    {
      id: 7,
      question: 'Atualmente, quanto você fatura por mês com suas aulas?',
      fieldName: 'faturamento',
      type: 'select',
      options: [
        'R$ 0 - R$ 3.000',
        'R$ 3.000 - R$ 10.000',
        'R$ 10.000 - R$ 30.000',
        'Acima de R$ 30.000'
      ],
      validation: {
        required: true,
        errorMessage: 'Por favor, selecione uma opção'
      }
    },
    {
      id: 8,
      question: 'Qual é a sua maior dificuldade hoje?',
      fieldName: 'dificuldade',
      type: 'radio',
      options: [
        'Captar mais alunos',
        'Gerar mais renda com suas aulas',
        'Escalar suas aulas (mais alunos sem perder qualidade)',
        'Outro'
      ],
      validation: {
        required: true,
        errorMessage: 'Por favor, selecione uma opção'
      }
    },
    {
      id: 9,
      question: 'Se sua resposta foi "Outro", por favor descreva:',
      fieldName: 'outraDificuldade',
      type: 'textarea',
      placeholder: 'Descreva sua maior dificuldade...',
      validation: {
        required: false,
        errorMessage: ''
      }
    },
    {
      id: 10,
      question: 'Quanto você estaria disposto a investir mensalmente em uma mentoria que te ajudasse a alcançar seus objetivos?',
      fieldName: 'investimento',
      type: 'select',
      options: [
        'R$ 100 - R$ 300',
        'R$ 300 - R$ 600',
        'R$ 600 - R$ 1.000',
        'Acima de R$ 1.000'
      ],
      validation: {
        required: true,
        errorMessage: 'Por favor, selecione uma opção'
      }
    },
    {
      id: 11,
      question: 'Escolha a melhor data para nossa conversa:',
      fieldName: 'data_agendamento',
      type: 'date',
      validation: {
        required: true,
        errorMessage: 'Por favor, selecione uma data'
      }
    },
    {
      id: 12,
      question: 'Escolha o melhor horário:',
      fieldName: 'horario_agendamento',
      type: 'time',
      validation: {
        required: true,
        errorMessage: 'Por favor, selecione um horário'
      }
    }
  ],
  scheduling: {
    enabled: true,
    availableTimes: [
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
      '20:00', '20:30', '21:00'
    ]
  },
  googleSheet: {
    spreadsheetId: '1RsPpGt3BDOVBGii5FzJly8pufnathWXwhBKBh-4gYy8'
  }
};

// Exemplo de formulário de Matemática (pode ser expandido depois)
export const matematicaFormConfig: FormConfig = {
  id: 'matematica',
  title: 'Mentoria Matemática',
  description: 'Aplicação para Mentoria de Matemática',
  steps: [
    {
      id: 1,
      question: 'Qual é o seu nome completo?',
      fieldName: 'nome',
      type: 'text',
      validation: {
        required: true,
        minLength: 3,
        errorMessage: 'Por favor, digite seu nome completo'
      }
    },
    {
      id: 2,
      question: 'Qual é o seu e-mail?',
      fieldName: 'email',
      type: 'email',
      validation: {
        required: true,
        errorMessage: 'Por favor, digite um e-mail válido'
      }
    }
  ],
  scheduling: {
    enabled: false,
    availableTimes: []
  }
};

// Registro de todos os formulários disponíveis
export const formConfigs: Record<string, FormConfig> = {
  bio: bioFormConfig,
  matematica: matematicaFormConfig,
};
