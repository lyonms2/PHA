/**
 * Layout compacto de batalha - tudo em uma tela sem scroll
 * Grid de 3 colunas: Player | Centro (Log + Ações) | IA
 */

import AvatarDuoDisplay from './AvatarDuoDisplay';
import SynergyDisplay from './SynergyDisplay';
import BattleLog from './BattleLog';
import { getEfeitoEmoji, ehBuff } from '../utils/battleEffects';

export default function CompactBattleLayout({
  // Avatares
  meuAvatar,
  iaAvatar,
  sinergiaPlayer,
  sinergiaIA,

  // Status de batalha
  myHp,
  myHpMax,
  opponentHp,
  opponentHpMax,
  myEnergy,
  opponentEnergy,
  myEffects,
  opponentEffects,

  // Controle
  isYourTurn,
  currentTurn,
  log,

  // Ações
  atacar,
  usarHabilidade,
  abandonar,
  actionInProgress
}) {
  const hpMeuPercent = (myHp / myHpMax) * 100;
  const hpIAPercent = (opponentHp / opponentHpMax) * 100;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-gray-100 p-2">
      {/* Header Compacto */}
      <div className="text-center mb-2">
        <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
          ⚔️ TREINO CONTRA IA
        </h1>
        <p className="text-[10px] text-slate-400">
          {isYourTurn ? '🔥 SEU TURNO!' : '⏳ Turno do Oponente...'}
        </p>
      </div>

      {/* Grid Principal - 3 Colunas */}
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
        {/* COLUNA ESQUERDA - PLAYER */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Avatar Duo */}
          <AvatarDuoDisplay
            principal={meuAvatar}
            suporte={sinergiaPlayer?.avatarSuporte}
            isPlayer={true}
          />

          {/* HP e Energia */}
          <div className="bg-slate-900/95 rounded-lg border border-cyan-500/40 p-2 space-y-1.5">
            {/* HP */}
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-red-400 font-bold">❤️ HP</span>
                <span className="font-mono">{myHp}/{myHpMax}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    hpMeuPercent > 50 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                    hpMeuPercent > 25 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                    'bg-gradient-to-r from-red-600 to-red-400'
                  }`}
                  style={{ width: `${hpMeuPercent}%` }}
                />
              </div>
            </div>

            {/* Energia */}
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-blue-400 font-bold">⚡ Energia</span>
                <span className="font-mono">{myEnergy}/100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                  style={{ width: `${myEnergy}%` }}
                />
              </div>
            </div>
          </div>

          {/* Efeitos */}
          {myEffects.length > 0 && (
            <div className="bg-slate-900/95 rounded-lg border border-cyan-500/40 p-1.5">
              <div className="text-[9px] text-slate-400 mb-1">Efeitos Ativos:</div>
              <div className="flex flex-wrap gap-0.5">
                {myEffects.map((ef, i) => (
                  <span
                    key={i}
                    className={`text-[9px] px-1 py-0.5 rounded ${
                      ehBuff(ef.tipo)
                        ? 'bg-green-900/30 border border-green-600/50'
                        : 'bg-red-900/30 border border-red-600/50'
                    }`}
                    title={ef.tipo}
                  >
                    {getEfeitoEmoji(ef.tipo)}{ef.turnosRestantes}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sinergia Player */}
          {sinergiaPlayer && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <SynergyDisplay sinergia={sinergiaPlayer} />
            </div>
          )}
        </div>

        {/* COLUNA CENTRO - LOG E AÇÕES */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Log de Batalha */}
          <div className="flex-1 min-h-0">
            <BattleLog logs={log} currentTurn={currentTurn} />
          </div>

          {/* Ações */}
          <div className="bg-slate-900/95 rounded-lg border border-purple-500/40 p-2">
            <div className="text-[10px] font-bold text-purple-400 mb-2 text-center">
              AÇÕES
            </div>

            <div className="space-y-1.5">
              {/* Ataque Básico */}
              <button
                onClick={atacar}
                disabled={!isYourTurn || actionInProgress}
                className={`w-full px-2 py-1.5 rounded text-[11px] font-bold ${
                  isYourTurn && !actionInProgress
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                ⚔️ Ataque Básico
              </button>

              {/* Habilidades */}
              {meuAvatar?.habilidades?.slice(0, 3).map((hab, idx) => (
                <button
                  key={idx}
                  onClick={() => usarHabilidade(hab)}
                  disabled={!isYourTurn || actionInProgress || myEnergy < (hab.custo || 20)}
                  className={`w-full px-2 py-1.5 rounded text-[10px] font-bold ${
                    isYourTurn && !actionInProgress && myEnergy >= (hab.custo || 20)
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                  title={hab.descricao}
                >
                  ✨ {hab.nome} ({hab.custo || 20}⚡)
                </button>
              ))}

              {/* Abandonar */}
              <button
                onClick={abandonar}
                disabled={actionInProgress}
                className="w-full px-2 py-1 rounded text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-400"
              >
                🏳️ Abandonar
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA - IA */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Avatar Duo */}
          <AvatarDuoDisplay
            principal={iaAvatar}
            suporte={sinergiaIA?.avatarSuporte}
            isPlayer={false}
          />

          {/* HP e Energia */}
          <div className="bg-slate-900/95 rounded-lg border border-red-500/40 p-2 space-y-1.5">
            {/* HP */}
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-red-400 font-bold">❤️ HP</span>
                <span className="font-mono">{opponentHp}/{opponentHpMax}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    hpIAPercent > 50 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                    hpIAPercent > 25 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                    'bg-gradient-to-r from-red-600 to-red-400'
                  }`}
                  style={{ width: `${hpIAPercent}%` }}
                />
              </div>
            </div>

            {/* Energia */}
            <div>
              <div className="flex justify-between text-[9px] mb-0.5">
                <span className="text-blue-400 font-bold">⚡ Energia</span>
                <span className="font-mono">{opponentEnergy}/100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                  style={{ width: `${opponentEnergy}%` }}
                />
              </div>
            </div>
          </div>

          {/* Efeitos */}
          {opponentEffects.length > 0 && (
            <div className="bg-slate-900/95 rounded-lg border border-red-500/40 p-1.5">
              <div className="text-[9px] text-slate-400 mb-1">Efeitos Ativos:</div>
              <div className="flex flex-wrap gap-0.5">
                {opponentEffects.map((ef, i) => (
                  <span
                    key={i}
                    className={`text-[9px] px-1 py-0.5 rounded ${
                      ehBuff(ef.tipo)
                        ? 'bg-green-900/30 border border-green-600/50'
                        : 'bg-red-900/30 border border-red-600/50'
                    }`}
                    title={ef.tipo}
                  >
                    {getEfeitoEmoji(ef.tipo)}{ef.turnosRestantes}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sinergia IA */}
          {sinergiaIA && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <SynergyDisplay sinergia={sinergiaIA} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
