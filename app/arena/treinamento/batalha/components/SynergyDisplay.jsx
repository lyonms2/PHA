/**
 * Componente para exibir sinergia ativa durante batalha
 * Mostra avatar suporte e modificadores aplicados
 */

import { getElementoEmoji, getElementoCor } from '../utils/battleEffects';

export default function SynergyDisplay({ sinergia }) {
  if (!sinergia) return null;

  const { nome, elementos, modificadores, avatarSuporte, isSpecial } = sinergia;

  // Contar bônus e penalidades
  const modificadoresChaves = Object.keys(modificadores || {});
  const totalModificadores = modificadoresChaves.length;

  // Separar em bônus e penalidades baseado no nome da chave
  const bonus = modificadoresChaves.filter(k =>
    !k.includes('penalidade') &&
    !k.includes('bloqueada') &&
    !k.includes('revelado') &&
    !k.includes('perda')
  );

  const penalidades = modificadoresChaves.filter(k =>
    k.includes('penalidade') ||
    k.includes('bloqueada') ||
    k.includes('revelado') ||
    k.includes('perda')
  );

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

      {/* Modificadores Resumo */}
      <div className="flex gap-2 text-[9px]">
        {bonus.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-green-400">↑</span>
            <span className="text-slate-400">{bonus.length} bônus</span>
          </div>
        )}
        {penalidades.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-red-400">↓</span>
            <span className="text-slate-400">{penalidades.length} penalidades</span>
          </div>
        )}
      </div>

      {/* Modificadores Detalhados (Colapsável) */}
      {totalModificadores > 0 && (
        <details className="mt-2 text-[9px]">
          <summary className="cursor-pointer text-cyan-400 hover:text-cyan-300 select-none">
            Ver modificadores ({totalModificadores})
          </summary>
          <div className="mt-1.5 space-y-1 bg-slate-950/50 rounded p-1.5">
            {/* Bônus */}
            {bonus.length > 0 && (
              <div>
                <div className="text-green-400 font-bold mb-0.5">BÔNUS:</div>
                {bonus.map(key => (
                  <div key={key} className="text-slate-400 pl-2">
                    • {formatarModificador(key, modificadores[key])}
                  </div>
                ))}
              </div>
            )}

            {/* Penalidades */}
            {penalidades.length > 0 && (
              <div className="mt-1">
                <div className="text-red-400 font-bold mb-0.5">PENALIDADES:</div>
                {penalidades.map(key => (
                  <div key={key} className="text-slate-400 pl-2">
                    • {formatarModificador(key, modificadores[key])}
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * Formata um modificador para exibição
 */
function formatarModificador(chave, valor) {
  // Formatar nomes de chaves para legibilidade
  const nomeFormatado = chave
    .replace(/_/g, ' ')
    .replace(/bonus/i, '')
    .replace(/penalidade/i, '')
    .trim();

  // Formatar valor
  let valorFormatado = valor;
  if (typeof valor === 'boolean') {
    valorFormatado = valor ? 'Sim' : 'Não';
  } else if (typeof valor === 'number') {
    if (Math.abs(valor) < 1) {
      valorFormatado = `${valor > 0 ? '+' : ''}${Math.floor(valor * 100)}%`;
    } else {
      valorFormatado = `${valor > 0 ? '+' : ''}${valor}`;
    }
  } else if (typeof valor === 'string') {
    valorFormatado = valor;
  } else if (typeof valor === 'object' && valor !== null) {
    valorFormatado = JSON.stringify(valor);
  }

  return `${nomeFormatado}: ${valorFormatado}`;
}
