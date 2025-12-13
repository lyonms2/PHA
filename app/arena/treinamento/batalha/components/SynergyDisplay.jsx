/**
 * Componente para exibir sinergia ativa durante batalha
 * Mostra avatar suporte e modificadores aplicados
 */

import { getElementoEmoji, getElementoCor } from '../utils/battleEffects';

export default function SynergyDisplay({ sinergia }) {
  if (!sinergia) return null;

  const { nome, elementos, vantagens = [], desvantagens = [], avatarSuporte, isSpecial } = sinergia;

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-cyan-950/40 border border-cyan-500/30 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-cyan-400">✨ SINERGIA ATIVA</span>
          {isSpecial && (
            <span className="text-[9px] bg-yellow-600/30 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/50 font-bold animate-pulse">
              ESPECIAL
            </span>
          )}
        </div>
      </div>

      {/* Nome da Sinergia */}
      <div className={`text-xs font-black mb-2 ${isSpecial ? 'text-yellow-400' : 'text-cyan-300'}`}>
        {nome}
      </div>

      {/* Combinação de Elementos */}
      <div className="flex items-center gap-1.5 mb-2 text-[10px]">
        <span className={`${getElementoCor(elementos.principal)} font-bold`}>
          {getElementoEmoji(elementos.principal)} {elementos.principal}
        </span>
        <span className="text-slate-500">+</span>
        <span className={`${getElementoCor(elementos.suporte)} font-bold`}>
          {getElementoEmoji(elementos.suporte)} {elementos.suporte}
        </span>
      </div>

      {/* Avatar Suporte */}
      {avatarSuporte && (
        <div className="bg-slate-900/50 rounded px-2 py-1 mb-2">
          <div className="text-[9px] text-slate-400 mb-0.5">Avatar Suporte:</div>
          <div className="text-[10px] text-slate-300 font-bold">
            {avatarSuporte.nome} {getElementoEmoji(avatarSuporte.elemento)} Nv.{avatarSuporte.nivel}
          </div>
        </div>
      )}

      {/* Vantagens e Desvantagens */}
      <div className="space-y-1.5">
        {/* Vantagens */}
        {vantagens.length > 0 && (
          <div>
            <div className="text-[9px] text-green-400 font-bold mb-1">✅ VANTAGENS:</div>
            {vantagens.map((vantagem, idx) => (
              <div key={idx} className="text-[10px] bg-green-900/30 text-green-300 border border-green-600/30 rounded px-2 py-1">
                ✨ {vantagem.texto}
              </div>
            ))}
          </div>
        )}

        {/* Desvantagens */}
        {desvantagens.length > 0 ? (
          <div>
            <div className="text-[9px] text-red-400 font-bold mb-1">⚠️ DESVANTAGENS:</div>
            {desvantagens.map((desvantagem, idx) => (
              <div key={idx} className="text-[10px] bg-red-900/30 text-red-300 border border-red-600/30 rounded px-2 py-1">
                💢 {desvantagem.texto}
              </div>
            ))}
          </div>
        ) : vantagens.length > 0 && (
          <div className="text-[10px] bg-purple-900/30 text-purple-300 border border-purple-600/30 rounded px-2 py-1 text-center">
            ⭐ Sinergia Perfeita - Sem Desvantagens!
          </div>
        )}
      </div>
    </div>
  );
}
