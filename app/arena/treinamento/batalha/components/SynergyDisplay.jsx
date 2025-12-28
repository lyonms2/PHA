/**
 * Componente para exibir sinergia ativa durante batalha
 * NOVO SISTEMA: Avatar Suporte (próprio) VS Avatar Principal Inimigo
 * Mostra modificadores: dano_habilidades, resistência, evasão, crítico
 */

import { getElementoEmoji, getElementoCor } from '../utils';

const NOMES_MODIFICADORES = {
  dano_habilidades: 'Dano de Habilidades',
  resistencia: 'Resistência/Defesa',
  evasao: 'Evasão',
  critico: 'Chance Crítico'
};

const RARIDADE_MULT = {
  'Comum': 1.0,
  'Raro': 1.2,
  'Lendário': 1.4
};

export default function SynergyDisplay({ sinergia }) {
  if (!sinergia || !sinergia.sinergiaAtiva) return null;

  const {
    sinergiaAtiva,
    modificadores,
    modificadoresFormatados
  } = sinergia;

  const {
    nome,
    descricao,
    elementoSuporte,
    elementoInimigo,
    tipoSuporte,
    raridadeSuporte,
    multiplicadorRaridade
  } = sinergiaAtiva;

  // Verificar se há modificadores ativos
  const temModificadores = modificadoresFormatados && modificadoresFormatados.length > 0;

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-cyan-950/40 border border-cyan-500/30 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-cyan-400">✨ SINERGIA ATIVA</span>
          {raridadeSuporte && raridadeSuporte !== 'Comum' && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
              raridadeSuporte === 'Lendário'
                ? 'bg-yellow-600/30 text-yellow-400 border-yellow-500/50 animate-pulse'
                : 'bg-purple-600/30 text-purple-400 border-purple-500/50'
            }`}>
              {raridadeSuporte.toUpperCase()}
            </span>
          )}
        </div>
        {multiplicadorRaridade > 1.0 && (
          <span className="text-[9px] text-yellow-400 font-bold">
            ×{multiplicadorRaridade.toFixed(1)}
          </span>
        )}
      </div>

      {/* Nome da Sinergia */}
      <div className="text-xs font-black mb-1 text-cyan-300">
        {nome}
      </div>

      {/* Descrição */}
      <div className="text-[10px] text-slate-400 mb-2 italic">
        {descricao}
      </div>

      {/* Tipo do Suporte */}
      <div className="text-[9px] text-purple-400 font-bold mb-2">
        Tipo: {tipoSuporte}
      </div>

      {/* Combinação: Suporte VS Principal Inimigo */}
      <div className="flex items-center gap-1.5 mb-3 text-[10px] bg-slate-900/50 rounded px-2 py-1.5">
        <span className={`${getElementoCor(elementoSuporte)} font-bold`}>
          {getElementoEmoji(elementoSuporte)} {elementoSuporte}
        </span>
        <span className="text-slate-500 font-bold">VS</span>
        <span className={`${getElementoCor(elementoInimigo)} font-bold`}>
          {getElementoEmoji(elementoInimigo)} {elementoInimigo}
        </span>
      </div>

      {/* Modificadores Ativos */}
      {temModificadores ? (
        <div>
          <div className="text-[9px] text-green-400 font-bold mb-1.5">⚡ MODIFICADORES ATIVOS:</div>
          <div className="space-y-1">
            {modificadoresFormatados.map((mod, idx) => {
              const isPositivo = mod.valor > 0;
              const sinal = isPositivo ? '+' : '';
              const cor = isPositivo ? 'text-green-300 bg-green-900/30 border-green-600/30' : 'text-red-300 bg-red-900/30 border-red-600/30';
              const icone = isPositivo ? '✨' : '💢';

              return (
                <div key={idx} className={`text-[10px] ${cor} border rounded px-2 py-1 flex items-center justify-between`}>
                  <span>{icone} {mod.nome}</span>
                  <span className="font-bold">{sinal}{mod.valorFormatado}</span>
                </div>
              );
            })}
          </div>

          {/* Nota sobre Multiplicador de Raridade */}
          {multiplicadorRaridade > 1.0 && (
            <div className="mt-2 text-[9px] text-yellow-400 bg-yellow-900/20 border border-yellow-600/30 rounded px-2 py-1 text-center">
              💎 Bônus de raridade aplicado: ×{multiplicadorRaridade.toFixed(1)}
            </div>
          )}
        </div>
      ) : (
        <div className="text-[10px] bg-slate-900/30 text-slate-400 border border-slate-600/30 rounded px-2 py-1 text-center italic">
          Nenhum modificador contra este elemento
        </div>
      )}
    </div>
  );
}
