"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from "@/app/components/AvatarSVG";
import { calcularPoderTotal } from "@/lib/gameLogic";
import { HABILIDADES_POR_ELEMENTO } from "@/app/avatares/sistemas/abilitiesSystem";

/**
 * Atualiza os valores de balanceamento de uma habilidade
 */
function atualizarBalanceamentoHabilidade(habilidadeAvatar, elemento) {
  if (!habilidadeAvatar || !elemento) return habilidadeAvatar;

  const habilidadesSistema = HABILIDADES_POR_ELEMENTO[elemento];
  if (!habilidadesSistema) return habilidadeAvatar;

  const habilidadeSistema = Object.values(habilidadesSistema).find(
    h => h.nome === habilidadeAvatar.nome
  );

  if (!habilidadeSistema) return habilidadeAvatar;

  return {
    ...habilidadeAvatar,
    custo_energia: habilidadeSistema.custo_energia,
    chance_efeito: habilidadeSistema.chance_efeito,
    duracao_efeito: habilidadeSistema.duracao_efeito,
    dano_base: habilidadeSistema.dano_base,
    multiplicador_stat: habilidadeSistema.multiplicador_stat,
    cooldown: habilidadeSistema.cooldown
  };
}

function getElementoEmoji(elemento) {
  const emojis = {
    'Fogo': '🔥',
    'Água': '💧',
    'Terra': '🌍',
    'Vento': '💨',
    'Eletricidade': '⚡',
    'Luz': '✨',
    'Sombra': '🌑'
  };
  return emojis[elemento] || '⚪';
}

function BatalhaTreinoIAContent() {
  const router = useRouter();

  const [visitorId, setVisitorId] = useState(null);
  const [meuNome, setMeuNome] = useState('');
  const [battleId, setBattleId] = useState(null);
  const [meuAvatar, setMeuAvatar] = useState(null);
  const [iaAvatar, setIaAvatar] = useState(null);
  const [myHp, setMyHp] = useState(100);
  const [myHpMax, setMyHpMax] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [opponentHpMax, setOpponentHpMax] = useState(100);
  const [myEnergy, setMyEnergy] = useState(100);
  const [opponentEnergy, setOpponentEnergy] = useState(100);
  const [myEffects, setMyEffects] = useState([]);
  const [opponentEffects, setOpponentEffects] = useState([]);
  const [isYourTurn, setIsYourTurn] = useState(true);
  const [status, setStatus] = useState('active');
  const [winner, setWinner] = useState(null);
  const [log, setLog] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Efeitos visuais de dano
  const [myDamageEffect, setMyDamageEffect] = useState(null);
  const [opponentDamageEffect, setOpponentDamageEffect] = useState(null);

  // Carregar usuário
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    setVisitorId(parsed.visitorId || parsed.id);
    setMeuNome(parsed.nome_operacao || parsed.nome || 'Jogador');
  }, [router]);

  // Inicializar batalha
  useEffect(() => {
    const iniciar = async () => {
      try {
        const dadosJSON = sessionStorage.getItem('treino_ia_dados');
        if (!dadosJSON) {
          router.push('/arena/treinamento');
          return;
        }

        const dados = JSON.parse(dadosJSON);
        setMeuAvatar(dados.playerAvatar);
        setIaAvatar(dados.oponente);

        // Inicializar batalha
        const response = await fetch('/api/arena/treino-ia/batalha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'init',
            playerAvatar: dados.playerAvatar,
            iaAvatar: dados.oponente,
            personalidadeIA: dados.personalidadeIA
          })
        });

        const result = await response.json();
        if (result.success) {
          setBattleId(result.battleId);
          addLog(`⚔️ Batalha iniciada!`);
          atualizarEstado(result.battleId);
        }
      } catch (error) {
        console.error('Erro ao iniciar:', error);
      }
    };

    iniciar();
  }, [router]);

  // Atualizar estado
  const atualizarEstado = async (id) => {
    try {
      const response = await fetch(`/api/arena/treino-ia/batalha?battleId=${id || battleId}`);
      const result = await response.json();

      if (result.success) {
        const battle = result.battle;
        setMyHp(battle.playerHp);
        setMyHpMax(battle.playerHpMax);
        setOpponentHp(battle.iaHp);
        setOpponentHpMax(battle.iaHpMax);
        setMyEnergy(battle.playerEnergy);
        setOpponentEnergy(battle.iaEnergy);
        setMyEffects(battle.playerEffects || []);
        setOpponentEffects(battle.iaEffects || []);
        setIsYourTurn(battle.currentTurn === 'player');
        setStatus(battle.status);
        setWinner(battle.winner);

        // Turno da IA
        if (battle.currentTurn === 'ia' && battle.status === 'active') {
          setTimeout(() => executarTurnoIA(id || battleId), 1500);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  // Turno da IA
  const executarTurnoIA = async (id) => {
    try {
      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId: id || battleId,
          action: 'ia_turn'
        })
      });

      const result = await response.json();
      if (result.success) {
        if (result.iaAction === 'attack') {
          if (result.errou) {
            addLog(`❌ Oponente atacou mas ERROU!`);
          } else {
            addLog(`⚔️ Oponente atacou! ${result.dano} de dano${result.critico ? ' CRÍTICO' : ''}`);
            mostrarDanoVisual('meu', result.dano);
          }
        } else if (result.iaAction === 'defend') {
          addLog(`🛡️ Oponente defendeu`);
        } else if (result.iaAction === 'ability') {
          addLog(`✨ Oponente usou ${result.nomeHabilidade}!`);
          if (result.dano > 0) {
            mostrarDanoVisual('meu', result.dano);
          }
        }
        await atualizarEstado(id || battleId);
      }
    } catch (error) {
      console.error('Erro turno IA:', error);
    }
  };

  const addLog = (msg) => {
    setLog(prev => [...prev.slice(-15), msg]);
  };

  const mostrarDanoVisual = (alvo, dano) => {
    if (alvo === 'meu') {
      setMyDamageEffect(dano);
      setTimeout(() => setMyDamageEffect(null), 1000);
    } else {
      setOpponentDamageEffect(dano);
      setTimeout(() => setOpponentDamageEffect(null), 1000);
    }
  };

  // Atacar
  const atacar = async () => {
    if (actionInProgress || !isYourTurn || myEnergy < 10) return;
    setActionInProgress(true);

    try {
      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, action: 'attack' })
      });

      const result = await response.json();
      if (result.success) {
        if (result.errou) {
          addLog(`❌ Você atacou mas ERROU!`);
        } else {
          addLog(`⚔️ Você atacou! ${result.dano} de dano${result.critico ? ' CRÍTICO' : ''}`);
          mostrarDanoVisual('oponente', result.dano);
        }
        await atualizarEstado();
      } else {
        addLog(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Defender
  const defender = async () => {
    if (actionInProgress || !isYourTurn) return;
    setActionInProgress(true);

    try {
      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, action: 'defend' })
      });

      const result = await response.json();
      if (result.success) {
        addLog(`🛡️ Você defendeu (+${result.energyGained} energia)`);
        await atualizarEstado();
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  // Usar habilidade
  const usarHabilidade = async (index) => {
    if (actionInProgress || !isYourTurn) return;
    setActionInProgress(true);

    try {
      const habAvatar = meuAvatar.habilidades[index];
      const hab = atualizarBalanceamentoHabilidade(habAvatar, meuAvatar.elemento);

      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battleId, action: 'ability', abilityIndex: index })
      });

      const result = await response.json();
      if (result.success) {
        if (result.errou) {
          addLog(`❌ ${hab.nome} ERROU!`);
        } else {
          addLog(`✨ Você usou ${hab.nome}!`);
          if (result.dano > 0) {
            mostrarDanoVisual('oponente', result.dano);
          }
        }
        await atualizarEstado();
      } else {
        addLog(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  if (!meuAvatar || !iaAvatar || !battleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg">Preparando batalha...</p>
        </div>
      </div>
    );
  }

  const poderMeu = calcularPoderTotal(meuAvatar);
  const poderIA = calcularPoderTotal(iaAvatar);
  const hpMeuPercent = (myHp / myHpMax) * 100;
  const hpIAPercent = (opponentHp / opponentHpMax) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            ⚔️ TREINO CONTRA IA
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isYourTurn ? '🔥 SEU TURNO!' : '⏳ Turno do Oponente...'}
          </p>
        </div>

        {/* Arena - Cards lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* SEU AVATAR */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur"></div>
            <div className="relative bg-slate-900/95 rounded-xl border border-cyan-500/40 overflow-hidden">
              {/* Cabeçalho */}
              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-3 py-2 border-b border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-cyan-400 text-sm truncate">{meuAvatar.nome}</div>
                  <div className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    meuAvatar.raridade === 'Mítico' ? 'bg-yellow-600 text-yellow-100' :
                    meuAvatar.raridade === 'Lendário' ? 'bg-orange-600 text-orange-100' :
                    meuAvatar.raridade === 'Épico' ? 'bg-purple-600 text-purple-100' :
                    meuAvatar.raridade === 'Raro' ? 'bg-blue-600 text-blue-100' :
                    'bg-slate-600 text-slate-100'
                  }`}>
                    {meuAvatar.raridade}
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">🎯 {meuNome}</div>
              </div>

              {/* Avatar e Stats */}
              <div className="p-3 flex gap-3">
                <div className="flex-shrink-0 relative">
                  <AvatarSVG avatar={meuAvatar} tamanho={100} />
                  {myDamageEffect && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-2xl font-bold text-red-500 animate-bounce">
                        -{myDamageEffect}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nível</span>
                    <span className="text-white font-bold">{meuAvatar.nivel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Elemento</span>
                    <span>{getElementoEmoji(meuAvatar.elemento)} {meuAvatar.elemento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">⚔️ Poder</span>
                    <span className="text-cyan-400 font-bold">{poderMeu}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">💪 Força</span>
                    <span className="text-orange-400">{meuAvatar.forca}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">💨 Agilidade</span>
                    <span className="text-green-400">{meuAvatar.agilidade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">🛡️ Resistência</span>
                    <span className="text-blue-400">{meuAvatar.resistencia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">🎯 Foco</span>
                    <span className="text-purple-400">{meuAvatar.foco}</span>
                  </div>
                </div>
              </div>

              {/* Barras de Status */}
              <div className="px-3 pb-3 space-y-2">
                {/* HP */}
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
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
                  <div className="flex justify-between text-[10px] mb-0.5">
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

              {/* Efeitos Ativos */}
              {myEffects.length > 0 && (
                <div className="px-3 pb-3 border-t border-slate-800 pt-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">🔮 Efeitos Ativos</div>
                  <div className="flex flex-wrap gap-1">
                    {myEffects.map((ef, i) => (
                      <span key={i} className="text-[9px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                        {ef.tipo} ({ef.turnosRestantes})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* OPONENTE IA */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl blur"></div>
            <div className="relative bg-slate-900/95 rounded-xl border border-red-500/40 overflow-hidden">
              {/* Cabeçalho */}
              <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 px-3 py-2 border-b border-red-500/30">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-red-400 text-sm truncate">{iaAvatar.nome}</div>
                  <div className="text-[9px] bg-red-600 text-red-100 px-1.5 py-0.5 rounded font-bold">
                    OPONENTE IA
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-1">🤖 Inteligência Artificial</div>
              </div>

              {/* Avatar e Stats */}
              <div className="p-3 flex gap-3">
                <div className="flex-shrink-0 relative">
                  <AvatarSVG avatar={iaAvatar} tamanho={100} />
                  {opponentDamageEffect && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-2xl font-bold text-red-500 animate-bounce">
                        -{opponentDamageEffect}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nível</span>
                    <span className="text-white font-bold">{iaAvatar.nivel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Elemento</span>
                    <span>{getElementoEmoji(iaAvatar.elemento)} {iaAvatar.elemento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">⚔️ Poder</span>
                    <span className="text-red-400 font-bold">{poderIA}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">💪 Força</span>
                    <span className="text-orange-400">{iaAvatar.forca}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">💨 Agilidade</span>
                    <span className="text-green-400">{iaAvatar.agilidade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">🛡️ Resistência</span>
                    <span className="text-blue-400">{iaAvatar.resistencia}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">🎯 Foco</span>
                    <span className="text-purple-400">{iaAvatar.foco}</span>
                  </div>
                </div>
              </div>

              {/* Barras de Status */}
              <div className="px-3 pb-3 space-y-2">
                {/* HP */}
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
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
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-orange-400 font-bold">⚡ Energia</span>
                    <span className="font-mono">{opponentEnergy}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-400 transition-all"
                      style={{ width: `${opponentEnergy}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Efeitos Ativos */}
              {opponentEffects.length > 0 && (
                <div className="px-3 pb-3 border-t border-slate-800 pt-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">🔮 Efeitos Ativos</div>
                  <div className="flex flex-wrap gap-1">
                    {opponentEffects.map((ef, i) => (
                      <span key={i} className="text-[9px] bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30">
                        {ef.tipo} ({ef.turnosRestantes})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Painel de Ações */}
        {status === 'active' && (
          <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-3 mb-3">
            <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-2 text-center">
              ⚔️ AÇÕES DE BATALHA
            </div>

            {/* Botões Atacar e Defender */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={atacar}
                disabled={!isYourTurn || myEnergy < 10 || actionInProgress}
                className={`py-2 rounded-lg font-bold transition-all ${
                  isYourTurn && myEnergy >= 10 && !actionInProgress
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 hover:scale-[1.02] active:scale-95'
                    : 'bg-slate-700 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="text-sm">⚔️ Atacar</div>
                <div className="text-[10px] opacity-75">-10 ⚡</div>
              </button>
              <button
                onClick={defender}
                disabled={!isYourTurn || actionInProgress}
                className={`py-2 rounded-lg font-bold transition-all ${
                  isYourTurn && !actionInProgress
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 hover:scale-[1.02] active:scale-95'
                    : 'bg-slate-700 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="text-sm">🛡️ Defender</div>
                <div className="text-[10px] opacity-75">+20 ⚡ | -50%</div>
              </button>
            </div>

            {/* Habilidades */}
            {meuAvatar?.habilidades && meuAvatar.habilidades.length > 0 && (
              <>
                <div className="text-[10px] font-bold text-pink-300 uppercase tracking-wider mb-1.5 text-center">
                  ✨ HABILIDADES
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {meuAvatar.habilidades.slice(0, 5).map((habAvatar, index) => {
                    const hab = atualizarBalanceamentoHabilidade(habAvatar, meuAvatar?.elemento);
                    const custoEnergia = hab.custo_energia || 20;
                    return (
                      <button
                        key={index}
                        onClick={() => usarHabilidade(index)}
                        disabled={!isYourTurn || myEnergy < custoEnergia || actionInProgress}
                        className={`py-1.5 px-2 rounded text-left transition-all ${
                          isYourTurn && myEnergy >= custoEnergia && !actionInProgress
                            ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 hover:scale-[1.02] active:scale-95 border border-purple-400/30'
                            : 'bg-slate-700/50 cursor-not-allowed opacity-40 border border-slate-600/30'
                        }`}
                      >
                        <div className="truncate text-[10px] font-bold">{hab.nome}</div>
                        <div className="text-[9px] opacity-75">-{custoEnergia} ⚡</div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Resultado Final */}
        {status === 'finished' && (
          <div className="bg-slate-900/90 rounded-xl border-2 border-yellow-500 p-6 mb-3 text-center">
            <div className="text-3xl font-black mb-3">
              {winner === 'player' ? '🎉 VITÓRIA!' : '💀 DERROTA'}
            </div>
            <button
              onClick={() => router.push('/arena/treinamento')}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
            >
              🏠 Voltar ao Treino
            </button>
          </div>
        )}

        {/* Log de Batalha */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-800/50 px-3 py-1.5 border-b border-slate-700">
            <h3 className="text-xs font-bold text-slate-300">📜 Log de Batalha</h3>
          </div>
          <div className="p-2 max-h-28 overflow-y-auto space-y-0.5">
            {log.length === 0 ? (
              <div className="text-[10px] text-slate-500 text-center py-2">Aguardando ações...</div>
            ) : (
              log.map((msg, i) => (
                <div key={i} className="text-[10px] text-slate-300 py-0.5 px-1.5 bg-slate-800/30 rounded">
                  {msg}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BatalhaTreinoIA() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-xl">Carregando batalha...</p>
        </div>
      </div>
    }>
      <BatalhaTreinoIAContent />
    </Suspense>
  );
}
