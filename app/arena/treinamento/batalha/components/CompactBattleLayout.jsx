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
  defender,
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
      <div className="flex-1 grid grid-cols-[1fr_1.2fr_1fr] gap-2 min-h-0">
        {/* COLUNA ESQUERDA - PLAYER */}
        <div className="flex flex-col gap-1.5 min-h-0">
          {/* Avatar Duo com HP e Energia integrados */}
          <AvatarDuoDisplay
            principal={meuAvatar}
            suporte={sinergiaPlayer?.avatarSuporte}
            isPlayer={true}
            hp={myHp}
            hpMax={myHpMax}
            energy={myEnergy}
          />

          {/* Efeitos Ativos */}
          {myEffects.length > 0 && (
            <div className="bg-slate-900/95 rounded-lg border border-cyan-500/40 p-2">
              <div className="text-[10px] font-bold text-cyan-400 mb-1.5 text-center">
                ⚡ EFEITOS ATIVOS
              </div>
              <div className="space-y-1">
                {myEffects.map((ef, i) => (
                  <div
                    key={i}
                    className={`text-[9px] px-2 py-1 rounded flex items-center justify-between ${
                      ehBuff(ef.tipo)
                        ? 'bg-green-900/40 border border-green-500/50 text-green-200'
                        : 'bg-red-900/40 border border-red-500/50 text-red-200'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-sm">{getEfeitoEmoji(ef.tipo)}</span>
                      <span className="font-semibold capitalize">{ef.tipo.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="bg-slate-900/50 px-1.5 py-0.5 rounded font-bold">
                      {ef.turnosRestantes} ⏱️
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sinergia Player - Detalhada */}
          {sinergiaPlayer && (
            <div className="bg-slate-900/95 rounded-lg border border-purple-500/40 p-2 overflow-y-auto">
              <div className="text-xs font-bold text-purple-300 mb-1 text-center">
                ✨ {sinergiaPlayer.nome}
              </div>
              <div className="text-[10px] text-slate-400 text-center mb-2">
                {meuAvatar.elemento} × {sinergiaPlayer.avatarSuporte?.elemento}
              </div>

              {/* Vantagens e Desvantagens */}
              <div className="space-y-1">
                {/* Vantagens */}
                {sinergiaPlayer.vantagens && sinergiaPlayer.vantagens.length > 0 && sinergiaPlayer.vantagens.map((vantagem, idx) => (
                  <div key={`vantagem-${idx}`} className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-300 border border-green-600/30">
                    ✅ {vantagem.texto}
                  </div>
                ))}

                {/* Desvantagens */}
                {sinergiaPlayer.desvantagens && sinergiaPlayer.desvantagens.length > 0 && sinergiaPlayer.desvantagens.map((desvantagem, idx) => (
                  <div key={`desvantagem-${idx}`} className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 border border-red-600/30">
                    ⚠️ {desvantagem.texto}
                  </div>
                ))}

                {/* Sem desvantagens (sinergia perfeita) */}
                {(!sinergiaPlayer.desvantagens || sinergiaPlayer.desvantagens.length === 0) && (
                  <div className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-600/30 text-center">
                    ⭐ Sinergia Perfeita
                  </div>
                )}
              </div>

              <div className="text-[9px] text-slate-500 mt-2 italic text-center">
                {sinergiaPlayer.descricao}
              </div>
            </div>
          )}
        </div>

        {/* COLUNA CENTRO - LOG E AÇÕES */}
        <div className="flex flex-col gap-1.5 min-h-0">
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
              {/* Ataque e Defender */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={atacar}
                  disabled={!isYourTurn || actionInProgress}
                  className={`px-2 py-1.5 rounded text-[10px] font-bold ${
                    isYourTurn && !actionInProgress
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <div>⚔️ Ataque</div>
                  <div className="text-[8px] opacity-75">-10⚡</div>
                </button>

                <button
                  onClick={defender}
                  disabled={!isYourTurn || actionInProgress}
                  className={`px-2 py-1.5 rounded text-[10px] font-bold ${
                    isYourTurn && !actionInProgress
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <div>🛡️ Defender</div>
                  <div className="text-[8px] opacity-75">+20⚡|-50%</div>
                </button>
              </div>

              {/* Habilidades */}
              {meuAvatar?.habilidades?.slice(0, 3).map((hab, idx) => (
                <button
                  key={idx}
                  onClick={() => usarHabilidade(idx)}
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
        <div className="flex flex-col gap-1.5 min-h-0">
          {/* Avatar Duo com HP e Energia integrados */}
          <AvatarDuoDisplay
            principal={iaAvatar}
            suporte={sinergiaIA?.avatarSuporte}
            isPlayer={false}
            hp={opponentHp}
            hpMax={opponentHpMax}
            energy={opponentEnergy}
          />

          {/* Efeitos Ativos */}
          {opponentEffects.length > 0 && (
            <div className="bg-slate-900/95 rounded-lg border border-red-500/40 p-2">
              <div className="text-[10px] font-bold text-red-400 mb-1.5 text-center">
                ⚡ EFEITOS ATIVOS
              </div>
              <div className="space-y-1">
                {opponentEffects.map((ef, i) => (
                  <div
                    key={i}
                    className={`text-[9px] px-2 py-1 rounded flex items-center justify-between ${
                      ehBuff(ef.tipo)
                        ? 'bg-green-900/40 border border-green-500/50 text-green-200'
                        : 'bg-red-900/40 border border-red-500/50 text-red-200'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-sm">{getEfeitoEmoji(ef.tipo)}</span>
                      <span className="font-semibold capitalize">{ef.tipo.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="bg-slate-900/50 px-1.5 py-0.5 rounded font-bold">
                      {ef.turnosRestantes} ⏱️
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sinergia IA - Detalhada */}
          {sinergiaIA && (
            <div className="bg-slate-900/95 rounded-lg border border-purple-500/40 p-2 overflow-y-auto">
              <div className="text-xs font-bold text-purple-300 mb-1 text-center">
                ✨ {sinergiaIA.nome}
              </div>
              <div className="text-[10px] text-slate-400 text-center mb-2">
                {iaAvatar.elemento} × {sinergiaIA.avatarSuporte?.elemento}
              </div>

              {/* Vantagens e Desvantagens */}
              <div className="space-y-1">
                {/* Vantagens */}
                {sinergiaIA.vantagens && sinergiaIA.vantagens.length > 0 && sinergiaIA.vantagens.map((vantagem, idx) => (
                  <div key={`vantagem-${idx}`} className="text-[9px] px-1.5 py-0.5 rounded bg-green-900/30 text-green-300 border border-green-600/30">
                    ✅ {vantagem.texto}
                  </div>
                ))}

                {/* Desvantagens */}
                {sinergiaIA.desvantagens && sinergiaIA.desvantagens.length > 0 && sinergiaIA.desvantagens.map((desvantagem, idx) => (
                  <div key={`desvantagem-${idx}`} className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 border border-red-600/30">
                    ⚠️ {desvantagem.texto}
                  </div>
                ))}

                {/* Sem desvantagens (sinergia perfeita) */}
                {(!sinergiaIA.desvantagens || sinergiaIA.desvantagens.length === 0) && (
                  <div className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-600/30 text-center">
                    ⭐ Sinergia Perfeita
                  </div>
                )}
              </div>

              <div className="text-[9px] text-slate-500 mt-2 italic text-center">
                {sinergiaIA.descricao}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
