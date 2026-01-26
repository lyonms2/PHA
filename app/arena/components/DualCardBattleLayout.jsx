/**
 * Layout de batalha estilo Wasteland com cards empilhados
 * Avatar principal na frente (Ataque) e suporte atrás (Suporte)
 * Cards podem ser clicados para alternar posição
 */

import { useState, useEffect, useRef } from 'react';
import AvatarSVG from '@/app/components/AvatarSVG';
import BattleEffectWrapper from './BattleEffectWrapper';
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
  onItemUse,
  onSurrender,

  // Habilidades disponíveis
  playerAbilities = [],

  // Inventário de itens (poções)
  playerItems = [],
  playerItemsUsed = 0,

  // Log
  log = [],

  // Nomes
  playerName = 'Você',
  opponentName = 'Oponente',

  // Sinergias
  playerSynergy = null,
  opponentSynergy = null,

  // Efeitos visuais de dano/cura
  myDamageEffect = null,
  opponentDamageEffect = null
}) {
  const [playerCardActive, setPlayerCardActive] = useState('attack'); // 'attack' ou 'support'
  const [opponentCardActive, setOpponentCardActive] = useState('attack');
  const [logExpanded, setLogExpanded] = useState(false); // Para mobile drawer
  const [showItemsModal, setShowItemsModal] = useState(false); // Modal de itens
  const logContainerRef = useRef(null);

  // Debug: Verificar dados recebidos
  useEffect(() => {
    console.log('🔍 DualCardBattleLayout - Dados recebidos:', {
      meuAvatarSuporte: meuAvatarSuporte ? { nome: meuAvatarSuporte.nome, elemento: meuAvatarSuporte.elemento } : null,
      iaAvatarSuporte: iaAvatarSuporte ? { nome: iaAvatarSuporte.nome, elemento: iaAvatarSuporte.elemento } : null,
      playerSynergy: playerSynergy ? {
        nome: playerSynergy.sinergiaAtiva?.nome,
        modificadores: playerSynergy.modificadoresFormatados?.length
      } : null,
      opponentSynergy: opponentSynergy ? {
        nome: opponentSynergy.sinergiaAtiva?.nome,
        modificadores: opponentSynergy.modificadoresFormatados?.length
      } : null,
      playerAbilities: playerAbilities?.length || 0,
      logCount: log.length
    });
  }, [meuAvatarSuporte, iaAvatarSuporte, playerSynergy, opponentSynergy, playerAbilities, log]);

  // Debug: Rastrear mudanças nos efeitos de dano
  useEffect(() => {
    if (myDamageEffect) {
      console.log('🎨 [DualCardBattleLayout] myDamageEffect RECEBIDO:', myDamageEffect);
    }
  }, [myDamageEffect]);

  useEffect(() => {
    if (opponentDamageEffect) {
      console.log('🎨 [DualCardBattleLayout] opponentDamageEffect RECEBIDO:', opponentDamageEffect);
    }
  }, [opponentDamageEffect]);

  // Auto-scroll log para o FINAL (logs mais recentes por último)
  useEffect(() => {
    if (logContainerRef.current) {
      // Usar setTimeout para garantir que o DOM foi atualizado
      setTimeout(() => {
        if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [log]);

  const togglePlayerCard = () => {
    setPlayerCardActive(prev => prev === 'attack' ? 'support' : 'attack');
  };

  const toggleOpponentCard = () => {
    setOpponentCardActive(prev => prev === 'attack' ? 'support' : 'attack');
  };

  const renderAvatarCard = (avatar, type, isActive, hp, hpMax, energy, energyMax, effects, side, synergy, damageEffect) => {
    if (!avatar) return null;

    const isAttack = type === 'attack';
    const cardClasses = `
      absolute w-full transition-all duration-400 ease-in-out rounded-xl cursor-pointer
      ${isAttack ? 'h-[264px]' : isActive ? 'h-[240px]' : 'h-[200px]'}
      ${isActive ? 'z-30 top-0' : 'z-10 opacity-0 pointer-events-none'}
      ${isActive && !isAttack ? 'scale-105 shadow-2xl' : ''}
    `;

    // Cores diferentes para ataque e suporte
    const bgGradient = isAttack
      ? 'from-slate-900 to-slate-800' // Ataque: fundo escuro
      : 'from-amber-900/70 to-yellow-900/60'; // Suporte: fundo amarelado

    const borderColor = isAttack
      ? 'border-rose-500 hover:border-rose-400 shadow-rose-500/30' // Ataque: borda roxo-avermelhado
      : 'border-amber-500 hover:border-amber-400 shadow-amber-500/40'; // Suporte: borda amarela

    return (
      <div className={cardClasses}>
        <div className={`relative h-full bg-gradient-to-br ${bgGradient} border-4 ${borderColor} rounded-xl shadow-2xl overflow-hidden`}>
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
            {/* Avatar SVG - sempre envolto com wrapper para evitar sumir */}
            <div className={`relative ${isActive ? 'scale-100' : 'scale-75'} transition-transform ${!isAttack ? 'mt-0' : 'mt-0'} overflow-visible flex-shrink-0`}>
              {isAttack ? (
                <BattleEffectWrapper effect={damageEffect}>
                  <AvatarSVG avatar={avatar} tamanho={isActive ? 90 : 66} />
                </BattleEffectWrapper>
              ) : (
                <AvatarSVG avatar={avatar} tamanho={70} />
              )}
            </div>

            {/* Info do avatar (só quando ativo) */}
            {isActive && (
              <>
                {/* Nome */}
                <div className="text-[11px] font-bold text-white mt-0.5 text-center truncate max-w-full px-2 flex-shrink-0">
                  {avatar.nome}
                </div>

                {/* Badge de Elemento */}
                <div className="mt-0.5 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getElementoCor(avatar.elemento)}`}>
                    {getElementoEmoji(avatar.elemento)} {avatar.elemento}
                  </span>
                </div>

                {/* Card de ATAQUE: mostrar HP e Energia */}
                {isAttack && (
                  <>
                    {/* HP Bar */}
                    <div className="w-full px-2 mt-0.5 flex-shrink-0">
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
                    <div className="w-full px-2 mt-0.5 flex-shrink-0">
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
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-2 flex-shrink-0 min-h-[16px]">
                        {effects.slice(0, 3).map((effect, i) => {
                          const turnos = effect.turnosRestantes || 0;
                          const turnosDisplay = turnos > 0 ? Math.ceil(turnos / 2) : '';
                          const turnosTooltip = `${Math.ceil(turnos / 2)} ${Math.ceil(turnos / 2) === 1 ? 'turno' : 'turnos'}`;
                          return (
                            <span
                              key={i}
                              className={`text-xs ${ehBuff(effect.tipo) ? 'text-green-400' : 'text-red-400'}`}
                              title={`${effect.tipo} (${turnosTooltip})`}
                            >
                              {getEfeitoEmoji(effect.tipo)}{turnosDisplay}
                            </span>
                          );
                        })}
                        {effects.length > 3 && (
                          <span className="text-[9px] text-purple-400" title={`+${effects.length - 3} efeitos`}>
                            +{effects.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Card de SUPORTE: mostrar detalhes da sinergia */}
                {!isAttack && synergy && synergy.sinergiaAtiva && (
                  <div className="w-full px-2 mt-1 space-y-1.5 overflow-y-auto max-h-[140px] custom-scrollbar">
                    {/* Nome da Sinergia */}
                    <div className="text-[11px] text-amber-300 font-bold text-center uppercase tracking-wide">
                      {synergy.sinergiaAtiva.nome}
                    </div>

                    {/* Descrição */}
                    <div className="text-[9px] text-amber-200/70 text-center italic leading-tight">
                      {synergy.sinergiaAtiva.descricao}
                    </div>

                    {/* Modificadores Ativos */}
                    {synergy.modificadoresFormatados && synergy.modificadoresFormatados.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="text-[8px] text-cyan-400 font-bold uppercase tracking-wider">
                          ⚡ MODIFICADORES:
                        </div>
                        {synergy.modificadoresFormatados.map((mod, i) => {
                          const isPositivo = mod.valor > 0;
                          const cor = isPositivo ? 'text-green-300' : 'text-red-300';
                          const icone = isPositivo ? '✨' : '💢';
                          return (
                            <div key={i} className={`text-[9px] ${cor} leading-tight flex items-center gap-1`}>
                              <span>{icone}</span>
                              <span className="font-bold">{mod.texto}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Multiplicador de Raridade */}
                    {synergy.sinergiaAtiva.multiplicadorRaridade > 1.0 && (
                      <div className="text-[8px] text-yellow-400 text-center font-bold">
                        💎 {synergy.sinergiaAtiva.raridadeSuporte} ×{synergy.sinergiaAtiva.multiplicadorRaridade.toFixed(1)}
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
      <div className="text-center py-2 md:py-4 relative z-10">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">
          ⚔ BATALHA DIMENSIONAL ⚔
        </h1>
        <div className="text-xs text-purple-300 mt-1">TURNO {currentTurn}</div>
      </div>

      {/* Layout responsivo: vertical no mobile, horizontal no desktop */}
      <div className="flex flex-col lg:flex-row gap-2 md:gap-4 px-2 md:px-4 pb-4 lg:pb-2 relative z-10 h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] overflow-hidden">
        {/* Painel Principal - Battlefield + Controles */}
        <div className="flex-1 flex flex-col gap-8 md:gap-4 overflow-y-auto lg:overflow-visible">
          {/* Battlefield */}
          <div className="flex gap-2 md:gap-4 lg:gap-8 justify-center items-center pb-6 md:pb-0">
            {/* Lado do Jogador */}
            <div className="flex flex-col gap-1 md:gap-3 items-center">
              <div className="text-[10px] md:text-xs lg:text-sm uppercase tracking-wider md:tracking-widest font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                [ {playerName} ]
              </div>

              <div
                className="relative w-[150px] h-[240px] md:w-[160px] md:h-[260px] lg:w-[194px] lg:h-[320px] cursor-pointer"
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
                  null,
                  myDamageEffect
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
                  playerSynergy,
                  null
                )}
              </div>
            </div>

            {/* VS Divider */}
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)] animate-pulse">
              VS
            </div>

            {/* Lado do Oponente */}
            <div className="flex flex-col gap-1 md:gap-3 items-center">
              <div className="text-[10px] md:text-xs lg:text-sm uppercase tracking-wider md:tracking-widest font-bold text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                [ {opponentName} ]
              </div>

              <div
                className="relative w-[150px] h-[240px] md:w-[160px] md:h-[260px] lg:w-[194px] lg:h-[320px] cursor-pointer"
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
                  null,
                  opponentDamageEffect
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
                  opponentSynergy,
                  null
                )}
              </div>
            </div>
          </div>

          {/* Painel de Controles */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-slate-700 rounded-xl p-2 md:p-4 shadow-xl backdrop-blur-sm">
            <div className="text-center text-purple-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2 md:mb-3">
              ⚙ Controles de Batalha
            </div>

            {/* Ações básicas */}
            <div className="grid grid-cols-3 gap-2 mb-2 md:mb-3">
              <button
                onClick={onAttack}
                disabled={!isYourTurn || status !== 'active' || myEnergy < 10}
                className="min-h-[40px] md:min-h-[44px] px-2 md:px-3 py-1.5 md:py-2.5 bg-gradient-to-br from-purple-900 to-purple-800 border-2 border-purple-500 rounded-lg font-bold uppercase text-[10px] md:text-xs tracking-wider text-purple-200 hover:from-purple-800 hover:to-purple-700 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
                title={myEnergy < 10 ? 'Energia insuficiente (10 necessária)' : 'Ataque básico'}
              >
                ⚔ Atacar
              </button>
              <button
                onClick={onDefend}
                disabled={!isYourTurn || status !== 'active'}
                className="min-h-[40px] md:min-h-[44px] px-2 md:px-3 py-1.5 md:py-2.5 bg-gradient-to-br from-green-900 to-green-800 border-2 border-green-500 rounded-lg font-bold uppercase text-[10px] md:text-xs tracking-wider text-green-200 hover:from-green-800 hover:to-green-700 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-green-500/50 active:scale-95"
              >
                🛡 Defender
              </button>
              <button
                onClick={() => setShowItemsModal(true)}
                disabled={!isYourTurn || status !== 'active' || !playerItems || playerItems.length === 0 || playerItemsUsed >= 2}
                className="min-h-[40px] md:min-h-[44px] px-2 md:px-3 py-1.5 md:py-2.5 bg-gradient-to-br from-cyan-900 to-cyan-800 border-2 border-cyan-500 rounded-lg font-bold uppercase text-[10px] md:text-xs tracking-wider text-cyan-200 hover:from-cyan-800 hover:to-cyan-700 hover:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-cyan-500/50 active:scale-95"
                title={
                  playerItemsUsed >= 2 ? 'Limite de 2 itens atingido' :
                  !playerItems || playerItems.length === 0 ? 'Sem itens disponíveis' :
                  `Usar poção (${playerItemsUsed}/2)`
                }
              >
                🧪 Itens ({playerItemsUsed}/2)
              </button>
            </div>

            {/* Habilidades */}
            {playerAbilities && playerAbilities.length > 0 && (
              <div className="mb-2 md:mb-3">
                <div className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wider mb-1 md:mb-2">
                  Habilidades Especiais:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {playerAbilities.map((ability, index) => {
                    // SEMPRE usar nome da habilidade como chave (consistente com backend)
                    const abilityKey = ability.nome;
                    const cooldownValue = playerCooldowns[abilityKey] || 0;
                    const isOnCooldown = cooldownValue > 0;
                    const hasEnergy = myEnergy >= ability.custo_energia;
                    const tooltipText = `${ability.nome}\n${ability.descricao || ''}\n⚡ Custo: ${ability.custo_energia} energia\n🔄 Cooldown: ${ability.cooldown || 0} turnos\n${isOnCooldown ? `⏱️ Restam: ${cooldownValue} turno(s)` : '✅ Disponível'}`;

                    return (
                      <button
                        key={abilityKey}
                        onClick={() => {
                          console.log('🎯 Habilidade clicada:', { index, ability: ability.nome, onAbilityUse: !!onAbilityUse });
                          if (onAbilityUse) onAbilityUse(index);
                        }}
                        disabled={!isYourTurn || status !== 'active' || isOnCooldown || !hasEnergy}
                        className="min-h-[40px] md:min-h-[44px] px-2 md:px-3 py-1.5 md:py-2.5 bg-gradient-to-br from-indigo-900 to-indigo-800 border-2 border-indigo-500 rounded-lg font-bold uppercase text-[9px] md:text-[9px] tracking-wide text-indigo-200 hover:from-indigo-800 hover:to-indigo-700 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-indigo-500/50 active:scale-95 relative overflow-hidden"
                        title={tooltipText}
                      >
                        <span className="block truncate">{ability.nome}</span>
                        {isOnCooldown && (
                          <span className="absolute top-0.5 right-0.5 text-[10px] bg-red-500 rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center font-bold shadow-lg z-10 text-[8px] md:text-[10px]">
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
              className="w-full min-h-[40px] md:min-h-[44px] px-2 md:px-4 py-1.5 md:py-2 bg-gradient-to-br from-red-900 to-red-800 border-2 border-red-500 rounded-lg font-bold uppercase text-[10px] md:text-xs tracking-wider text-red-200 hover:from-red-800 hover:to-red-700 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-red-500/50 active:scale-95"
            >
              ⚠ Abandonar Batalha
            </button>
          </div>
        </div>

        {/* Painel de Log - Desktop: Sidebar / Mobile: Drawer fixo no bottom */}
        <div className={`
          lg:w-80 lg:relative lg:flex lg:flex-col
          fixed bottom-0 left-0 right-0 z-50
          lg:block
          bg-gradient-to-br from-slate-900/95 to-slate-800/95 lg:from-slate-900/90 lg:to-slate-800/90
          border-2 border-purple-500
          lg:rounded-xl rounded-t-xl lg:rounded-b-xl
          p-2 md:p-4
          shadow-xl shadow-purple-500/20
          backdrop-blur-sm
          flex flex-col
          transition-all duration-300
          ${logExpanded ? 'h-[60vh]' : 'h-[120px]'}
          lg:h-full lg:max-h-full
        `}>
          <button
            onClick={() => setLogExpanded(!logExpanded)}
            className="lg:hidden flex items-center justify-between text-purple-400 text-xs md:text-sm font-bold uppercase tracking-wider mb-2 pb-2 border-b-2 border-purple-500/50 active:scale-95 transition-transform flex-shrink-0"
          >
            <span>📜 Log de Batalha ({log.length})</span>
            <span className="text-xl">{logExpanded ? '▼' : '▲'}</span>
          </button>

          <div className="hidden lg:block text-center text-purple-400 text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b-2 border-purple-500/50 flex-shrink-0">
            📜 Log de Batalha
          </div>

          <div ref={logContainerRef} className="flex-1 overflow-y-auto pr-2 space-y-1 md:space-y-2 log-scrollbar min-h-0">
            {log.map((entry, index) => (
              <div
                key={index}
                className="bg-black/40 border-l-4 border-purple-500 rounded-r p-1.5 md:p-2.5 text-[10px] md:text-xs leading-relaxed animate-[slideIn_0.3s_ease] hover:bg-black/60 transition-colors"
              >
                <span className="text-slate-200">{entry.texto || entry}</span>
              </div>
            ))}
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

        /* Scrollbar customizado - Card de Suporte (Amber/Gold) */
        :global(.custom-scrollbar::-webkit-scrollbar) {
          width: 6px;
        }

        :global(.custom-scrollbar::-webkit-scrollbar-track) {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }

        :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
          background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
          border-radius: 3px;
          transition: background 0.3s ease;
        }

        :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
          background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%);
        }

        /* Firefox */
        :global(.custom-scrollbar) {
          scrollbar-width: thin;
          scrollbar-color: #f59e0b rgba(0, 0, 0, 0.3);
        }

        /* Scrollbar do Log - Tema Purple/Violet */
        :global(.log-scrollbar::-webkit-scrollbar) {
          width: 8px;
        }

        :global(.log-scrollbar::-webkit-scrollbar-track) {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 4px;
          border: 1px solid rgba(168, 85, 247, 0.2);
        }

        :global(.log-scrollbar::-webkit-scrollbar-thumb) {
          background: linear-gradient(180deg, #a855f7 0%, #7c3aed 50%, #6366f1 100%);
          border-radius: 4px;
          border: 1px solid rgba(168, 85, 247, 0.4);
          transition: all 0.3s ease;
        }

        :global(.log-scrollbar::-webkit-scrollbar-thumb:hover) {
          background: linear-gradient(180deg, #c084fc 0%, #a855f7 50%, #8b5cf6 100%);
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.6);
        }

        /* Firefox */
        :global(.log-scrollbar) {
          scrollbar-width: thin;
          scrollbar-color: #a855f7 rgba(0, 0, 0, 0.4);
        }
      `}</style>

      {/* Modal de Itens */}
      {showItemsModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setShowItemsModal(false)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-lg blur opacity-75"></div>

              <div className="relative bg-slate-950/95 backdrop-blur-xl border border-cyan-900/50 rounded-lg overflow-hidden">
                <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center gap-2">
                  <span className="text-2xl">🧪</span>
                  <span>USAR ITEM</span>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {!playerItems || playerItems.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📦</div>
                      <p className="text-slate-400">Nenhum item disponível</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {playerItems.map((inventoryItem) => {
                        const item = inventoryItem.items;
                        const canUse = item.efeito === 'hp' || item.efeito === 'cura_hp';

                        return (
                          <button
                            key={inventoryItem.id}
                            onClick={() => {
                              if (onItemUse) {
                                onItemUse(inventoryItem);
                                setShowItemsModal(false);
                              }
                            }}
                            disabled={!canUse}
                            className="w-full group/item relative disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className={`absolute -inset-0.5 ${
                              canUse
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                : 'bg-gradient-to-r from-gray-500 to-gray-600'
                            } rounded blur opacity-50 group-hover/item:opacity-75 transition-all`}></div>

                            <div className={`relative bg-slate-950 rounded border-2 ${
                              canUse ? 'border-cyan-500/50' : 'border-gray-500/50'
                            } p-4 transition-all`}>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-3xl">{item.icone}</span>
                                <div className="flex-1 text-left">
                                  <div className={`font-bold ${canUse ? 'text-cyan-400' : 'text-gray-400'}`}>
                                    {item.nome}
                                  </div>
                                  <div className="text-xs text-slate-500">x{inventoryItem.quantidade}</div>
                                </div>
                              </div>
                              <p className="text-sm text-slate-300 mb-2">
                                {item.descricao}
                              </p>
                              <div className="text-xs text-green-400 font-bold">
                                Restaura {item.valor_efeito} HP
                              </div>
                              {!canUse && (
                                <div className="text-xs text-red-400 mt-2">
                                  ⚠️ Apenas poções de HP podem ser usadas em batalha
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => setShowItemsModal(false)}
                    className="w-full mt-4 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors font-bold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
