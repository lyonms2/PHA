/**
 * Componente de log de batalha detalhado e compacto
 * Mostra todos os logs com scroll automático para o mais recente
 */

import { useEffect, useRef } from 'react';

export default function BattleLog({ logs, currentTurn }) {
  const logEndRef = useRef(null);

  // Auto-scroll para o log mais recente
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="bg-slate-900/95 rounded-lg border border-slate-700 p-2 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-700">
        <span className="text-[10px] font-bold text-slate-400">📜 LOG DE BATALHA</span>
        <span className="text-[9px] text-slate-500">Turno {currentTurn || 1} | {logs.length} eventos</span>
      </div>

      {/* Logs - Fixed height com scroll interno */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 pr-1">
        {logs.length === 0 ? (
          <div className="text-[10px] text-slate-500 text-center py-4">
            Aguardando início da batalha...
          </div>
        ) : (
          <>
            {logs.map((msg, idx) => (
              <LogEntry key={idx} message={msg} isLatest={idx === logs.length - 1} />
            ))}
            {/* Elemento invisível para scroll automático */}
            <div ref={logEndRef} />
          </>
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
  } else if (message.includes('📊')) {
    // Linha de cálculos - destaque especial
    bgColor = 'bg-cyan-900/20';
    borderColor = 'border-cyan-700/30';
    textColor = 'text-cyan-200';
  }

  // Quebrar mensagem em linhas para melhor formatação
  const lines = message.split('\n');

  return (
    <div
      className={`${bgColor} ${textColor} border ${borderColor} rounded px-2 py-1.5 text-[10px] leading-relaxed ${
        isLatest ? 'ring-2 ring-purple-500/50' : ''
      }`}
    >
      {lines.map((line, idx) => (
        <div key={idx} className={idx > 0 ? 'mt-0.5' : ''}>
          {line}
        </div>
      ))}
    </div>
  );
}
