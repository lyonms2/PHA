/**
 * Componente compacto para mostrar Avatar Principal + Avatar Suporte lado a lado
 */

import AvatarSVG from "@/app/components/AvatarSVG";
import { getElementoEmoji, getElementoCor } from '../utils';

// Mapa de ícones e cores por tipo de efeito
const EFEITO_INFO = {
  // Buffs
  bencao: { icone: '✨', cor: 'text-yellow-400', nome: 'Benção', tipo: 'buff' },
  defesa_aumentada: { icone: '🛡️', cor: 'text-blue-400', nome: 'Defesa+', tipo: 'buff' },
  defesa_aumentada_instantanea: { icone: '🛡️🔥', cor: 'text-blue-400', nome: 'Defesa++', tipo: 'buff' },
  velocidade_aumentada: { icone: '⚡', cor: 'text-green-400', nome: 'Velocidade+', tipo: 'buff' },
  evasao_aumentada: { icone: '💨', cor: 'text-cyan-400', nome: 'Evasão+', tipo: 'buff' },
  transcendencia: { icone: '✨🌟', cor: 'text-purple-400', nome: 'Transcendência', tipo: 'buff' },
  regeneracao: { icone: '💚', cor: 'text-green-400', nome: 'Regeneração', tipo: 'buff' },
  sobrecarga: { icone: '⚡🔴', cor: 'text-orange-400', nome: 'Sobrecarga', tipo: 'buff' },

  // Debuffs
  queimadura: { icone: '🔥', cor: 'text-red-400', nome: 'Queimadura', tipo: 'debuff' },
  queimadura_intensa: { icone: '🔥🔥', cor: 'text-red-500', nome: 'Queimadura Intensa', tipo: 'debuff' },
  paralisia: { icone: '⚡', cor: 'text-yellow-400', nome: 'Paralisia', tipo: 'debuff' },
  paralisia_intensa: { icone: '⚡⚡', cor: 'text-yellow-500', nome: 'Paralisia Intensa', tipo: 'debuff' },
  atordoado: { icone: '💫', cor: 'text-purple-400', nome: 'Atordoado', tipo: 'debuff' },
  congelado: { icone: '❄️', cor: 'text-cyan-400', nome: 'Congelado', tipo: 'debuff' },
  enfraquecido: { icone: '⬇️', cor: 'text-gray-400', nome: 'Enfraquecido', tipo: 'debuff' },
  lentidao: { icone: '🐌', cor: 'text-gray-400', nome: 'Lentidão', tipo: 'debuff' },
  maldito: { icone: '💀', cor: 'text-purple-500', nome: 'Maldito', tipo: 'debuff' },
};

function getEfeitoInfo(efeito) {
  return EFEITO_INFO[efeito.tipo] || {
    icone: '❓',
    cor: 'text-gray-400',
    nome: efeito.tipo,
    tipo: 'unknown'
  };
}

export default function AvatarDuoDisplay({ principal, suporte, isPlayer = true, hp, hpMax, energy, energyMax = 100, effects = [] }) {
  const borderColor = isPlayer ? 'border-cyan-500/40' : 'border-red-500/40';
  const bgColor = isPlayer
    ? 'from-cyan-900/50 to-blue-900/50'
    : 'from-red-900/50 to-orange-900/50';
  const textColor = isPlayer ? 'text-cyan-400' : 'text-red-400';

  // Calcular porcentagens se HP for fornecido
  const hpPercent = (hp !== undefined && hpMax) ? (hp / hpMax) * 100 : 0;
  const energyPercent = (energy !== undefined && energyMax) ? (energy / energyMax) * 100 : 0;

  // Filtrar e agrupar efeitos
  const validEffects = effects.filter(ef => ef && ef.tipo); // Filtrar apenas efeitos válidos
  const buffs = validEffects.filter(ef => {
    const info = getEfeitoInfo(ef);
    return info.tipo === 'buff';
  });
  const debuffs = validEffects.filter(ef => {
    const info = getEfeitoInfo(ef);
    return info.tipo === 'debuff';
  });

  return (
    <div className={`bg-slate-900/95 rounded-lg border ${borderColor} overflow-hidden`}>
      {/* Header com nome */}
      <div className={`bg-gradient-to-r ${bgColor} px-2 py-1 border-b ${borderColor}`}>
        <div className={`font-bold ${textColor} text-sm truncate`}>{principal.nome}</div>
      </div>

      {/* Container dos Avatares */}
      <div className={`p-3 flex gap-3 items-center justify-center ${isPlayer ? 'flex-row-reverse' : ''}`}>
        {/* Avatar Principal */}
        <div className="flex-shrink-0">
          <AvatarSVG avatar={principal} tamanho={180} />
          <div className="text-center mt-1">
            <span className="text-xs bg-purple-600/50 px-2 py-1 rounded font-bold text-white">
              PRINCIPAL
            </span>
          </div>
        </div>

        {/* Seta */}
        {suporte && <div className="text-slate-500 text-2xl font-bold">+</div>}

        {/* Avatar Suporte */}
        {suporte && (
          <div className="flex-shrink-0">
            <AvatarSVG avatar={suporte} tamanho={120} />
            <div className="text-center mt-1">
              <span className="text-xs bg-slate-600/50 px-2 py-1 rounded font-bold text-slate-300">
                SUPORTE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Stats - Abaixo das imagens */}
      <div className="px-3 pb-2">
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Nv</span>
            <span className="text-white font-bold">{principal.nivel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Elemento</span>
            <span className={getElementoCor(principal.elemento)}>
              {getElementoEmoji(principal.elemento)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">💪</span>
            <span className="text-orange-400">{principal.forca}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">💨</span>
            <span className="text-green-400">{principal.agilidade}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">🛡️</span>
            <span className="text-blue-400">{principal.resistencia}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">🎯</span>
            <span className="text-purple-400">{principal.foco}</span>
          </div>
        </div>
      </div>

      {/* HP e Energia - Abaixo das imagens */}
      {hp !== undefined && hpMax !== undefined && energy !== undefined && (
        <div className="px-3 pb-3 space-y-1.5">
          {/* HP */}
          <div>
            <div className="flex justify-between text-[9px] mb-0.5">
              <span className="text-red-400 font-bold">❤️ HP</span>
              <span className="font-mono">{hp}/{hpMax}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  hpPercent > 50 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                  hpPercent > 25 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                  'bg-gradient-to-r from-red-600 to-red-400'
                }`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          {/* Energia */}
          <div>
            <div className="flex justify-between text-[9px] mb-0.5">
              <span className="text-blue-400 font-bold">⚡ Energia</span>
              <span className="font-mono">{energy}/{energyMax}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                style={{ width: `${energyPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Efeitos Ativos */}
      {validEffects.length > 0 && (
        <div className="px-3 pb-3 border-t border-slate-700/50 pt-2">
          <div className="text-[9px] text-slate-400 mb-1.5">Status:</div>
          <div className="flex flex-wrap gap-1">
            {/* Buffs */}
            {buffs.map((efeito, idx) => {
              const info = getEfeitoInfo(efeito);
              const turnos = efeito.turnosRestantes || efeito.duracao || 0;
              const turnosDisplay = turnos > 1 ? turnos : '';
              const turnosTooltip = turnos > 1 ? `${turnos} turnos` : 'último turno';
              return (
                <div
                  key={`buff-${idx}`}
                  className="relative group"
                  title={`${info.nome} (${turnosTooltip})`}
                >
                  <div className="flex items-center gap-0.5 bg-green-900/30 border border-green-500/30 rounded px-1.5 py-0.5">
                    <span className={`text-xs ${info.cor}`}>{info.icone}</span>
                    <span className="text-[9px] text-green-300 font-mono">
                      {turnosDisplay}
                    </span>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-50">
                    <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-green-500/50">
                      {info.nome}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Debuffs */}
            {debuffs.map((efeito, idx) => {
              const info = getEfeitoInfo(efeito);
              const turnos = efeito.turnosRestantes || efeito.duracao || 0;
              const turnosDisplay = turnos > 1 ? turnos : '';
              const turnosTooltip = turnos > 1 ? `${turnos} turnos` : 'último turno';
              return (
                <div
                  key={`debuff-${idx}`}
                  className="relative group"
                  title={`${info.nome} (${turnosTooltip})`}
                >
                  <div className="flex items-center gap-0.5 bg-red-900/30 border border-red-500/30 rounded px-1.5 py-0.5">
                    <span className={`text-xs ${info.cor}`}>{info.icone}</span>
                    <span className="text-[9px] text-red-300 font-mono">
                      {turnosDisplay}
                    </span>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-50">
                    <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-red-500/50">
                      {info.nome}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
