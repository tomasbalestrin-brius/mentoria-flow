import { Link } from 'react-router-dom';
import { formConfigs } from '@/config/formConfigs';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calculator, Atom } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  bio: <BookOpen className="w-12 h-12 mb-4 text-blue-500" />,
  matematica: <Calculator className="w-12 h-12 mb-4 text-purple-500" />,
  fisica: <Atom className="w-12 h-12 mb-4 text-green-500" />,
};

export default function FormList() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <img 
            src="/Logo_Bethel_branco.png" 
            alt="Bethel Educação" 
            className="w-48 mx-auto mb-6"
          />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Formulários Bethel Educação
          </h1>
          <p className="text-gray-300 text-lg">
            Escolha o formulário que deseja preencher
          </p>
        </div>

        {/* Grid de Formulários */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(formConfigs).map((config) => (
            <Card 
              key={config.id}
              className="bg-white/95 backdrop-blur hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-200"
            >
              <CardHeader className="text-center">
                <div className="flex justify-center">
                  {iconMap[config.id] || <BookOpen className="w-12 h-12 mb-4 text-gray-500" />}
                </div>
                <CardTitle className="text-2xl mb-2 text-gray-800">
                  {config.title}
                </CardTitle>
                <CardDescription className="text-gray-600 mb-4">
                  {config.description}
                </CardDescription>
                <Link to={`/${config.id}`}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3">
                    Preencher Formulário
                  </Button>
                </Link>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-400">
          <p>© 2024 Bethel Educação. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
