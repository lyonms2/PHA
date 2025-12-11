/**
 * Componente compacto para mostrar Avatar Principal + Avatar Suporte lado a lado
 */

import AvatarSVG from "@/app/components/AvatarSVG";
import { getElementoEmoji, getElementoCor } from '../utils/battleEffects';

export default function AvatarDuoDisplay({ principal, suporte, isPlayer = true }) {
  const borderColor = isPlayer ? 'border-cyan-500/40' : 'border-red-500/40';
  const bgColor = isPlayer
    ? 'from-cyan-900/50 to-blue-900/50'
    : 'from-red-900/50 to-orange-900/50';
  const textColor = isPlayer ? 'text-cyan-400' : 'text-red-400';

  return (
    <div className={`bg-slate-900/95 rounded-lg border ${borderColor} overflow-hidden`}>
      {/* Header com nome */}
      <div className={`bg-gradient-to-r ${bgColor} px-2 py-1 border-b ${borderColor}`}>
        <div className={`font-bold ${textColor} text-sm truncate`}>{principal.nome}</div>
      </div>

      {/* Container dos Avatares */}
      <div className="p-3 flex gap-3 items-center">
        {/* Avatar Principal (3x maior) */}
        <div className="flex-shrink-0">
          <AvatarSVG avatar={principal} tamanho={180} />
          <div className="text-center mt-1">
            <span className="text-xs bg-purple-600/50 px-2 py-1 rounded font-bold text-white">
              PRINCIPAL
            </span>
          </div>
        </div>

        {/* Seta */}
        <div className="text-slate-500 text-2xl font-bold">+</div>

        {/* Avatar Suporte (3x maior) */}
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

        {/* Stats Compactos */}
        <div className="flex-1 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Nv</span>
            <span className="text-white font-bold">{principal.nivel}</span>
          </div>
          <div className="flex justify-between">
            <span className={getElementoCor(principal.elemento)}>
              {getElementoEmoji(principal.elemento)}
            </span>
            {suporte && (
              <span className={getElementoCor(suporte.elemento)}>
                {getElementoEmoji(suporte.elemento)}
              </span>
            )}
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
    </div>
  );
}
