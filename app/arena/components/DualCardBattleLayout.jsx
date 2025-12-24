/**
 * Layout de batalha estilo Wasteland com cards empilhados
 * Avatar principal na frente (Ataque) e suporte atrás (Suporte)
 * Cards podem ser clicados para alternar posição
 */

import { useState, useEffect, useRef } from 'react';
import AvatarSVG from '@/app/components/AvatarSVG';
import { getElementoEmoji, getElementoCor, getEfeitoEmoji, ehBuff } from '@/lib/arena/battleEffects';
import { calcularPoderTotal } from '@/lib/gameLogic';

export default function DualCardBattleLayout({
  // Avatares
  meuAvatar,
  meuAvatarSuporte,
  iaAvatar,
  iaAvatarSuporte,

  // Estados de batalha
  myHp,
  myHpMax,
  myEnergy,
  myEnergyMax,
  opponentHp,
  opponentHpMax,
  opponentEnergy,
  opponentEnergyMax,

  // Efeitos
  myEffects = [],
  opponentEffects = [],

  // Cooldowns
  playerCooldowns = {},
  iaCooldowns = {},

  // Estado do jogo
  isYourTurn,
  status,
  currentTurn = 1,

  // Ações
  onAttack,
  onDefend,
  onAbilityUse,
  onSurrender,

  // Habilidades disponíveis
  playerAbilities = [],

  // Log
  log = [],

  // Nomes
  playerName = 'Você',
  opponentName = 'Oponente',

  // Sinergias
  playerSynergy = null,
  opponentSynergy = null
}) {
  const [playerCardActive, setPlayerCardActive] = useState('attack'); // 'attack' ou 'support'
  const [opponentCardActive, setOpponentCardActive] = useState('attack');
  const logEndRef = useRef(null);

  // Auto-scroll log
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [log]);

  const togglePlayerCard = () => {
    setPlayerCardActive(prev => prev === 'attack' ? 'support' : 'attack');
  };

  const toggleOpponentCard = () => {
    setOpponentCardActive(prev => prev === 'attack' ? 'support' : 'attack');
  };

  const renderAvatarCard = (avatar, type, isActive, hp, hpMax, energy, energyMax, effects, side, synergy) => {
    if (!avatar) return null;

    const isAttack = type === 'attack';
    const cardClasses = `
      absolute w-full transition-all duration-400 ease-in-out rounded-xl overflow-hidden cursor-pointer
      ${isAttack ? 'h-[264px]' : 'h-[240px]'}
      ${isActive ? 'z-20 top-0' : isAttack ? 'z-10 top-0 opacity-80' : 'z-10 top-[80px] opacity-90'}
      ${!isActive && !isAttack ? 'hover:opacity-100' : ''}
      ${isActive && !isAttack ? 'scale-105 shadow-2xl' : ''}
    `;

    // Cores diferentes para ataque e suporte
    const bgGradient = isAttack
      ? 'from-slate-900 to-slate-800' // Ataque: fundo escuro
      : 'from-amber-900/70 to-yellow-900/60'; // Suporte: fundo amarelado

    const borderColor = isAttack
      ? 'border-rose-600/80 hover:border-rose-500' // Ataque: borda roxo-avermelhado
      : 'border-amber-500/80 hover:border-amber-400'; // Suporte: borda amarela

    return (
      <div className={cardClasses}>
        <div className={`relative h-full bg-gradient-to-br ${bgGradient} border-3 ${borderColor} rounded-xl shadow-xl`}>
          {/* Textura de fundo */}
          <div className={`absolute inset-0 opacity-5 ${isAttack ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(124,58,237,0.1)_10px,rgba(124,58,237,0.1)_20px)]' : 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(251,191,36,0.1)_10px,rgba(251,191,36,0.1)_20px)]'}`} />

          {/* Label do card */}
          <div className="absolute top-2 left-2 right-2 text-center z-10">
            <span className={`text-[10px] uppercase tracking-widest font-bold ${isAttack ? 'text-rose-400' : 'text-amber-400'}`}>
              {isAttack ? '⚔ ATAQUE' : '✚ SUPORTE'}
            </span>
          </div>

          {/* Conteúdo do avatar */}
          <div className="relative h-full flex flex-col items-center p-2 pt-6">
            {/* Avatar SVG - ajustado para não sobrepor o label */}
            <div className={`${isActive ? 'scale-100' : 'scale-75'} transition-transform ${!isAttack ? 'mt-1' : 'mt-2'}`}>
              <AvatarSVG avatar={avatar} tamanho={isAttack ? (isActive ? 110 : 66) : 55} />
            </div>

            {/* Info do avatar (só quando ativo) */}
            {isActive && (
              <>
                {/* Nome */}
                <div className="text-xs font-bold text-white mt-1 text-center truncate max-w-full px-2">
                  {avatar.nome}
                </div>

                {/* Card de ATAQUE: mostrar HP e Energia */}
                {isAttack && (
                  <>
                    {/* HP Bar */}
                    <div className="w-full px-2 mt-1">
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                        <span>HP</span>
                        <span>{hp}/{hpMax}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-300"
                          style={{ width: `${Math.max(0, (hp / hpMax) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Energy Bar */}
                    <div className="w-full px-2 mt-1">
                      <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                        <span>ENERGIA</span>
                        <span>{energy}/{energyMax}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-300"
                          style={{ width: `${Math.max(0, (energy / energyMax) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Efeitos ativos */}
                    {effects.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-2">
                        {effects.slice(0, 4).map((effect, i) => (
                          <span
                            key={i}
                            className={`text-[10px] ${ehBuff(effect.tipo) ? 'text-green-400' : 'text-red-400'}`}
                            title={effect.tipo}
                          >
                            {getEfeitoEmoji(effect.tipo)}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Card de SUPORTE: mostrar detalhes da sinergia */}
                {!isAttack && synergy && (
                  <div className="w-full px-2 mt-1 space-y-1.5 overflow-y-auto max-h-[140px]">
                    {/* Nome da Sinergia */}
                    <div className="text-[11px] text-amber-300 font-bold text-center uppercase tracking-wide">
                      {synergy.nome}
                    </div>

                    {/* Descrição */}
                    <div className="text-[9px] text-amber-200/70 text-center italic leading-tight">
                      {synergy.descricao}
                    </div>

                    {/* Vantagens - USA ARRAY DIRETO! */}
                    {synergy.vantagens && synergy.vantagens.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="text-[8px] text-green-400 font-bold uppercase tracking-wider">
                          ✅ VANTAGENS:
                        </div>
                        {synergy.vantagens.map((v, i) => (
                          <div key={i} className="text-[9px] text-green-300 leading-tight">
                            ✨ {v.texto}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Desvantagens - USA ARRAY DIRETO! */}
                    {synergy.desvantagens && synergy.desvantagens.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="text-[8px] text-red-400 font-bold uppercase tracking-wider">
                          ⚠️ DESVANTAGENS:
                        </div>
                        {synergy.desvantagens.map((d, i) => (
                          <div key={i} className="text-[9px] text-red-300 leading-tight">
                            💢 {d.texto}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Brilho hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white overflow-hidden">
      {/* Efeito de textura de fundo */}
      <div className="fixed inset-0 opacity-[0.02] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_2px,rgba(0,0,0,0.3)_4px)] pointer-events-none animate-pulse" />

      {/* Título */}
      <div className="text-center py-4 relative z-10">
        <h1 className="text-3xl font-bold uppercase tracking-[0.3em] text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
          ⚔ BATALHA DIMENSIONAL ⚔
        </h1>
        <div className="text-xs text-purple-300 mt-1">TURNO {currentTurn}</div>
      </div>

      <div className="flex gap-4 px-4 pb-4 relative z-10 max-h-[calc(100vh-100px)]">
        {/* Painel Esquerdo - Battlefield + Controles */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Battlefield */}
          <div className="flex gap-8 justify-center items-center">
            {/* Lado do Jogador */}
            <div className="flex flex-col gap-3 items-center">
              <div className="text-sm uppercase tracking-widest font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                [ {playerName} ]
              </div>

              <div
                className="relative w-[194px] h-[320px] cursor-pointer"
                onClick={togglePlayerCard}
              >
                {/* Card de Ataque */}
                {meuAvatar && renderAvatarCard(
                  meuAvatar,
                  'attack',
                  playerCardActive === 'attack',
                  myHp,
                  myHpMax,
                  myEnergy,
                  myEnergyMax,
                  myEffects,
                  'player',
                  null
                )}

                {/* Card de Suporte */}
                {meuAvatarSuporte && renderAvatarCard(
                  meuAvatarSuporte,
                  'support',
                  playerCardActive === 'support',
                  myHp,
                  myHpMax,
                  myEnergy,
                  myEnergyMax,
                  myEffects,
                  'player',
                  playerSynergy
                )}
              </div>
            </div>

            {/* VS Divider */}
            <div className="text-4xl font-bold text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-pulse">
              VS
            </div>

            {/* Lado do Oponente */}
            <div className="flex flex-col gap-3 items-center">
              <div className="text-sm uppercase tracking-widest font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                [ {opponentName} ]
              </div>

              <div
                className="relative w-[194px] h-[320px] cursor-pointer"
                onClick={toggleOpponentCard}
              >
                {/* Card de Ataque */}
                {iaAvatar && renderAvatarCard(
                  iaAvatar,
                  'attack',
                  opponentCardActive === 'attack',
                  opponentHp,
                  opponentHpMax,
                  opponentEnergy,
                  opponentEnergyMax,
                  opponentEffects,
                  'opponent',
                  null
                )}

                {/* Card de Suporte */}
                {iaAvatarSuporte && renderAvatarCard(
                  iaAvatarSuporte,
                  'support',
                  opponentCardActive === 'support',
                  opponentHp,
                  opponentHpMax,
                  opponentEnergy,
                  opponentEnergyMax,
                  opponentEffects,
                  'opponent',
                  opponentSynergy
                )}
              </div>
            </div>
          </div>

          {/* Painel de Controles */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-slate-700 rounded-xl p-4 shadow-xl backdrop-blur-sm">
            <div className="text-center text-purple-400 text-sm font-bold uppercase tracking-wider mb-3">
              ⚙ Controles de Batalha
            </div>

            {/* Ações básicas */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={onAttack}
                disabled={!isYourTurn || status !== 'active'}
                className="px-4 py-2.5 bg-gradient-to-br from-purple-900 to-purple-800 border-2 border-purple-500 rounded-lg font-bold uppercase text-xs tracking-wider text-purple-200 hover:from-purple-800 hover:to-purple-700 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-purple-500/50 hover:-translate-y-0.5"
              >
                ⚔ Atacar
              </button>
              <button
                onClick={onDefend}
                disabled={!isYourTurn || status !== 'active'}
                className="px-4 py-2.5 bg-gradient-to-br from-green-900 to-green-800 border-2 border-green-500 rounded-lg font-bold uppercase text-xs tracking-wider text-green-200 hover:from-green-800 hover:to-green-700 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-green-500/50 hover:-translate-y-0.5"
              >
                🛡 Defender
              </button>
            </div>

            {/* Habilidades */}
            {playerAbilities && playerAbilities.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                  Habilidades Especiais:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {playerAbilities.map((ability, index) => {
                    // Usar nome como ID se id não existir
                    const abilityKey = ability.id || ability.nome || index;
                    const cooldownValue = playerCooldowns[abilityKey] || playerCooldowns[index] || 0;
                    const isOnCooldown = cooldownValue > 0;
                    const hasEnergy = myEnergy >= ability.custo_energia;
                    const tooltipText = `${ability.nome}\n${ability.descricao || ''}\n⚡ Custo: ${ability.custo_energia} energia\n🔄 Cooldown: ${ability.cooldown || 0} turnos`;

                    return (
                      <button
                        key={abilityKey}
                        onClick={() => onAbilityUse && onAbilityUse(index)}
                        disabled={!isYourTurn || status !== 'active' || isOnCooldown || !hasEnergy}
                        className="px-3 py-2.5 bg-gradient-to-br from-indigo-900 to-indigo-800 border-2 border-indigo-500 rounded-lg font-bold uppercase text-[9px] tracking-wide text-indigo-200 hover:from-indigo-800 hover:to-indigo-700 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-indigo-500/50 relative overflow-hidden"
                        title={tooltipText}
                      >
                        <span className="block truncate">{ability.nome}</span>
                        {isOnCooldown && (
                          <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg z-10">
                            🔒{cooldownValue}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Abandonar */}
            <button
              onClick={onSurrender}
              disabled={status !== 'active'}
              className="w-full px-4 py-2 bg-gradient-to-br from-red-900 to-red-800 border-2 border-red-500 rounded-lg font-bold uppercase text-xs tracking-wider text-red-200 hover:from-red-800 hover:to-red-700 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-red-500/50"
            >
              ⚠ Abandonar Batalha
            </button>
          </div>
        </div>

        {/* Painel de Log */}
        <div className="w-80 bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-slate-700 rounded-xl p-4 shadow-xl backdrop-blur-sm flex flex-col max-h-[calc(100vh-120px)]">
          <div className="text-center text-purple-400 text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-slate-700">
            📜 Log de Batalha
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2">
            {log.map((entry, index) => (
              <div
                key={index}
                className="bg-black/40 border-l-3 border-purple-500 rounded p-2 text-xs leading-relaxed animate-[slideIn_0.3s_ease]"
              >
                <span className="text-slate-300">{entry.texto || entry}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
