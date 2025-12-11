/**
 * Componente de log de batalha detalhado e compacto
 * Mostra apenas os últimos 8 eventos para economizar espaço
 */

export default function BattleLog({ logs, currentTurn }) {
  // Mostrar apenas os últimos 8 logs
  const recentLogs = logs.slice(-8);

  return (
    <div className="bg-slate-900/95 rounded-lg border border-slate-700 p-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-700">
        <span className="text-[10px] font-bold text-slate-400">📜 LOG DE BATALHA</span>
        <span className="text-[9px] text-slate-500">Turno {currentTurn || 1}</span>
      </div>

      {/* Logs - Fixed height com scroll interno */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 pr-1">
        {recentLogs.length === 0 ? (
          <div className="text-[10px] text-slate-500 text-center py-4">
            Aguardando início da batalha...
          </div>
        ) : (
          recentLogs.map((msg, idx) => (
            <LogEntry key={idx} message={msg} isLatest={idx === recentLogs.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Componente individual de entrada de log
 */
function LogEntry({ message, isLatest }) {
  // Detectar tipo de mensagem para colorir
  let bgColor = 'bg-slate-800/50';
  let textColor = 'text-slate-300';
  let borderColor = 'border-slate-700';

  if (message.includes('🎯') || message.includes('⚔️')) {
    bgColor = 'bg-orange-900/20';
    borderColor = 'border-orange-700/30';
  } else if (message.includes('❤️') || message.includes('DERROTADO')) {
    bgColor = 'bg-red-900/20';
    borderColor = 'border-red-700/30';
    textColor = 'text-red-300';
  } else if (message.includes('✅') || message.includes('VITÓRIA')) {
    bgColor = 'bg-green-900/20';
    borderColor = 'border-green-700/30';
    textColor = 'text-green-300';
  } else if (message.includes('⚡') || message.includes('🔥') || message.includes('💧')) {
    bgColor = 'bg-blue-900/20';
    borderColor = 'border-blue-700/30';
  } else if (message.includes('🌀') || message.includes('Turno')) {
    bgColor = 'bg-purple-900/20';
    borderColor = 'border-purple-700/30';
    textColor = 'text-purple-300';
  }

  return (
    <div
      className={`${bgColor} ${textColor} border ${borderColor} rounded px-2 py-1 text-[10px] leading-tight ${
        isLatest ? 'animate-pulse' : ''
      }`}
    >
      {message}
    </div>
  );
}
