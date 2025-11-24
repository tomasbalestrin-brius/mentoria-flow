import { formConfigs } from '@/config/formConfigs';

export default function FormList() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            📋 Formulários Cadastrados
          </h1>
          <p className="text-gray-400">Painel Administrativo</p>
        </div>

        {/* Tabela */}
        <div className="bg-white/10 backdrop-blur rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/20">
              <tr>
                <th className="text-left p-4 text-white font-semibold">URL</th>
                <th className="text-left p-4 text-white font-semibold">PLANILHA</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(formConfigs).map((config) => (
                <tr key={config.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-gray-200 font-mono">
                    /{config.id}
                  </td>
                  <td className="p-4 text-gray-300 font-mono text-sm">
                    {config.googleSheet?.spreadsheetId || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
