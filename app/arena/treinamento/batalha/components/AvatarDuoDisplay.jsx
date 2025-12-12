/**
 * Componente compacto para mostrar Avatar Principal + Avatar Suporte lado a lado
 */

import AvatarSVG from "@/app/components/AvatarSVG";
import { getElementoEmoji, getElementoCor } from '../utils/battleEffects';

export default function AvatarDuoDisplay({ principal, suporte, isPlayer = true, hp, hpMax, energy }) {
  const borderColor = isPlayer ? 'border-cyan-500/40' : 'border-red-500/40';
  const bgColor = isPlayer
    ? 'from-cyan-900/50 to-blue-900/50'
    : 'from-red-900/50 to-orange-900/50';
  const textColor = isPlayer ? 'text-cyan-400' : 'text-red-400';

  // Calcular porcentagens se HP for fornecido
  const hpPercent = (hp !== undefined && hpMax) ? (hp / hpMax) * 100 : 0;

  return (
    <div className={`bg-slate-900/95 rounded-lg border ${borderColor} overflow-hidden`}>
      {/* Header com nome */}
      <div className={`bg-gradient-to-r ${bgColor} px-2 py-1 border-b ${borderColor}`}>
        <div className={`font-bold ${textColor} text-sm truncate`}>{principal.nome}</div>
      </div>

      {/* Container dos Avatares */}
      <div className="p-3 flex gap-3 items-center justify-center">
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
              <span className="font-mono">{energy}/100</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                style={{ width: `${energy}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
