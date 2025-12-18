"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from "@/app/components/AvatarSVG";
import { calcularPoderTotal } from "@/lib/gameLogic";
import { HABILIDADES_POR_ELEMENTO } from "@/app/avatares/sistemas/abilitiesSystem";
import {
  atualizarBalanceamentoHabilidade,
  getElementoEmoji,
  ehBuff,
  getEfeitoEmoji
} from './utils';
import SynergyDisplay from './components/SynergyDisplay';
import AvatarDuoDisplay from './components/AvatarDuoDisplay';
import BattleLog from './components/BattleLog';
import CompactBattleLayout from './components/CompactBattleLayout';

function BatalhaTreinoIAContent() {
  const router = useRouter();

  const [visitorId, setVisitorId] = useState(null);
  const [meuNome, setMeuNome] = useState('');
  const [battleId, setBattleId] = useState(null);
  const [meuAvatar, setMeuAvatar] = useState(null);
  const [iaAvatar, setIaAvatar] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(0);
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

  // Sistema de recompensas
  const [dificuldade, setDificuldade] = useState('normal');
  const [recompensas, setRecompensas] = useState(null);
  const [mostrarRecompensas, setMostrarRecompensas] = useState(false);
  const [aplicandoRecompensas, setAplicandoRecompensas] = useState(false);
  const recompensasAplicadasRef = useRef(false); // Proteção contra cliques duplicados

  // Sinergias ativas
  const [sinergiaAtiva, setSinergiaAtiva] = useState(null);
  const [sinergiaIA, setSinergiaIA] = useState(null);

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
        setDificuldade(dados.dificuldade || 'normal');

        // Carregar sinergias
        if (dados.sinergia) {
          setSinergiaAtiva(dados.sinergia);
          console.log('✨ Sinergia Player:', dados.sinergia.nome);
        }
        if (dados.sinergiaIA) {
          setSinergiaIA(dados.sinergiaIA);
          console.log('✨ Sinergia IA:', dados.sinergiaIA.nome);
        }

        // Inicializar batalha
        const response = await fetch('/api/arena/treino-ia/batalha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'init',
            playerAvatar: dados.playerAvatar,
            iaAvatar: dados.oponente,
            personalidadeIA: dados.personalidadeIA,
            dificuldade: dados.dificuldade || 'normal',
            sinergia: dados.sinergia || null,
            sinergiaIA: dados.sinergiaIA || null
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

  // Detectar fim de batalha já será tratado nas ações (atacar/habilidade)
  // useEffect removido - recompensas vêm diretamente do backend

  // Detectar abandono (refresh ou saída)
  useEffect(() => {
    const handleBeforeUnload = async (e) => {
      if (status === 'active' && battleId && !recompensas) {
        // Batalha ainda ativa - aplicar penalidades de abandono
        e.preventDefault();

        try {
          // Chamar API de abandono (usando fetch com keepalive)
          navigator.sendBeacon('/api/arena/treino-ia/abandonar', JSON.stringify({
            battleId,
            userId: visitorId,
            avatarId: meuAvatar?.id,
            dificuldade
          }));
        } catch (error) {
          console.error('Erro ao registrar abandono:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status, battleId, recompensas, visitorId, meuAvatar, dificuldade]);

  // Processar fim de batalha e recompensas
  const processarFimDeBatalha = (result) => {
    if (result.finished && result.recompensas) {
      setStatus('finished');
      setWinner(result.winner);

      // Adicionar HP original (para não perder HP no treino)
      const recompensasComHP = {
        ...result.recompensas,
        vitoria: result.winner === 'player',
        hpOriginal: myHpMax // HP volta ao máximo
      };

      setRecompensas(recompensasComHP);
      setMostrarRecompensas(true);

      if (result.winner === 'player') {
        addLog('🎉 VITÓRIA! Você venceu a batalha!');
      } else {
        addLog('☠️ DERROTA! Você foi derrotado...');
      }
    }
  };

  // Aplicar recompensas ao avatar e caçador
  const aplicarRecompensas = async () => {
    // PROTEÇÃO ANTI-DUPLICAÇÃO: verificar ref antes do estado
    if (recompensasAplicadasRef.current) {
      console.warn('⚠️ Tentativa de aplicar recompensas duplicadas bloqueada!');
      return;
    }

    if (!recompensas || !meuAvatar || aplicandoRecompensas) return;

    // BLOQUEAR imediatamente usando ref (mais rápido que setState)
    recompensasAplicadasRef.current = true;
    setAplicandoRecompensas(true);

    try {
      const response = await fetch('/api/meus-avatares/atualizar-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: visitorId,
          avatarId: meuAvatar.id,
          xp: recompensas.xp,
          vinculo: recompensas.vinculo,
          exaustao: recompensas.exaustao,
          hp: recompensas.hpOriginal, // HP volta ao original (é treino)
          xpCacador: recompensas.xpCacador
        })
      });

      if (response.ok) {
        const data = await response.json();

        addLog('✅ Recompensas aplicadas!');

        // Se subiu de nível, mostrar info detalhada
        if (data.levelUp) {
          addLog(`🎉 LEVEL UP! Nível ${data.nivelAnterior} → ${data.novoNivel}`);
          if (data.statsNovos) {
            addLog(`⚔️ Força: ${data.statsNovos.forca} | ⚡ Agi: ${data.statsNovos.agilidade}`);
            addLog(`🛡️ Res: ${data.statsNovos.resistencia} | 🎯 Foco: ${data.statsNovos.foco}`);
          }
          if (data.recompensas) {
            addLog(`💰 Moedas: +${data.recompensas.moedas} | 💎 Fragmentos: +${data.recompensas.fragmentos}`);
          }
        }

        // Limpar sessionStorage
        sessionStorage.removeItem('treino_ia_dados');
        // Voltar para tela de treino após 3s (mais tempo se teve level up)
        setTimeout(() => {
          router.push('/arena/treinamento');
        }, data.levelUp ? 3000 : 2000);
      } else {
        addLog('❌ Erro ao aplicar recompensas');
        // Permitir tentar novamente em caso de erro do servidor
        recompensasAplicadasRef.current = false;
      }
    } catch (error) {
      console.error('Erro ao aplicar recompensas:', error);
      addLog('❌ Erro ao aplicar recompensas');
      // Permitir tentar novamente em caso de erro de rede
      recompensasAplicadasRef.current = false;
    } finally {
      setAplicandoRecompensas(false);
    }
  };

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

        // Processar efeitos quando é meu turno
        if (battle.currentTurn === 'player' && battle.status === 'active') {
          if (myEffects.length > 0) {
            setTimeout(() => processarMeusEfeitos(id || battleId), 500);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  // Processar efeitos do jogador no início do turno
  const processarMeusEfeitos = async (id) => {
    try {
      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId: id || battleId,
          action: 'process_effects',
          target: 'player'
        })
      });

      const result = await response.json();
      if (result.success) {
        // Mostrar logs dos efeitos
        if (result.logsEfeitos && result.logsEfeitos.length > 0) {
          for (const log of result.logsEfeitos) {
            addLog(log);
          }
        }

        setMyHp(result.newHp);
        setMyEffects(result.efeitosRestantes || []);

        if (result.finished) {
          addLog('☠️ Você morreu por efeitos!');
          setStatus('finished');
          setWinner('ia');
        }
      }
    } catch (error) {
      console.error('Erro ao processar efeitos:', error);
    }
  };

  // Processar efeitos da IA no início do turno dela
  const processarEfeitosIA = async (id) => {
    try {
      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId: id || battleId,
          action: 'process_effects',
          target: 'ia'
        })
      });

      const result = await response.json();
      if (result.success) {
        // Mostrar logs dos efeitos
        if (result.logsEfeitos && result.logsEfeitos.length > 0) {
          for (const log of result.logsEfeitos) {
            addLog(log);
          }
        }

        setOpponentHp(result.newHp);
        setOpponentEffects(result.efeitosRestantes || []);

        if (result.finished) {
          addLog(`☠️ ${iaAvatar.nome} morreu por efeitos!`);
          setStatus('finished');
          setWinner('player');
        }
      }
    } catch (error) {
      console.error('Erro ao processar efeitos da IA:', error);
    }
  };

  // Turno da IA
  const executarTurnoIA = async (id) => {
    try {
      // Primeiro processar efeitos da IA se houver
      if (opponentEffects.length > 0) {
        await processarEfeitosIA(id || battleId);
      }

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
        // Adicionar logs explícitos do backend primeiro
        if (result.logsParaJogador && Array.isArray(result.logsParaJogador)) {
          console.log('📜 [LOGS] Adicionando logs da IA:', result.logsParaJogador);
          result.logsParaJogador.forEach(log => addLog(log));
        }

        // Verificar fim de batalha DEPOIS de processar logs
        if (result.finished || (result.iaAction && result.iaAction.finished)) {
          processarFimDeBatalha(result);
          return; // Não processar mais nada se a batalha acabou
        }

        // Efeitos visuais para ações da IA
        if (result.iaAction) {
          const iaAction = result.iaAction;

          // Efeitos visuais
          if (iaAction.action === 'attack' || iaAction.action === 'ability') {
            if (!iaAction.errou && iaAction.dano > 0) {
              if (iaAction.numGolpes && iaAction.numGolpes > 1) {
                mostrarDanoVisual('meu', `${iaAction.dano} ×${iaAction.numGolpes}`, 'multihit');
              } else {
                mostrarDanoVisual('meu', iaAction.dano, iaAction.critico ? 'critical' : 'damage');
              }
            } else if (iaAction.errou) {
              mostrarDanoVisual('meu', '', 'dodge');
            }
          }
        }

        await atualizarEstado(id || battleId);
      }
    } catch (error) {
      console.error('Erro turno IA:', error);
    }
  };

  const addLog = (msg) => {
    setLog(prev => [...prev, msg]); // Mais recente no final (embaixo), mostra todos os logs
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
        // Incrementar turno e mostrar no log
        const novoTurno = currentTurn + 1;
        setCurrentTurn(novoTurno);
        addLog(`🌀 === Turno ${novoTurno} ===`);

        // Log da ação do jogador
        if (result.log && result.log.detalhes) {
          addLog(result.log.detalhes);
        }

        // Mostrar mensagem elemental
        if (result.elemental === 'vantagem') {
          addLog('🔥 Super efetivo!');
        } else if (result.elemental === 'desvantagem') {
          addLog('💨 Pouco efetivo...');
        }

        // Mensagem de contra-ataque
        if (result.contraAtaque) {
          addLog('🔥🛡️ CONTRA-ATAQUE! Você foi queimado!');
        }

        // Logs da IA (processados automaticamente pelo backend)
        if (result.logsParaJogador && Array.isArray(result.logsParaJogador)) {
          console.log('📜 [LOGS ATACAR] Logs da IA:', result.logsParaJogador);
          result.logsParaJogador.forEach(log => addLog(log));
        }

        if (!result.errou) {
          mostrarDanoVisual('oponente', result.dano, result.critico ? 'critical' : 'damage');
        }

        // Verificar fim de batalha
        processarFimDeBatalha(result);

        if (!result.finished) {
          await atualizarEstado();
        }
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
        // Incrementar turno e mostrar no log
        const novoTurno = currentTurn + 1;
        setCurrentTurn(novoTurno);
        addLog(`🌀 === Turno ${novoTurno} ===`);

        // Log da ação do jogador
        if (result.log && result.log.detalhes) {
          addLog(result.log.detalhes);
        }

        // Logs da IA (processados automaticamente pelo backend)
        if (result.logsParaJogador && Array.isArray(result.logsParaJogador)) {
          console.log('📜 [LOGS DEFENDER] Logs da IA:', result.logsParaJogador);
          result.logsParaJogador.forEach(log => addLog(log));
        }

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
        // Incrementar turno e mostrar no log
        const novoTurno = currentTurn + 1;
        setCurrentTurn(novoTurno);
        addLog(`🌀 === Turno ${novoTurno} ===`);

        // Log da ação do jogador
        if (result.log && result.log.detalhes) {
          addLog(result.log.detalhes);
        }

        // Mostrar mensagem elemental
        if (result.elemental === 'vantagem') {
          addLog('🔥 Super efetivo!');
        } else if (result.elemental === 'desvantagem') {
          addLog('💨 Pouco efetivo...');
        }

        // Mostrar efeitos aplicados
        if (result.log && result.log.efeitos && result.log.efeitos.length > 0) {
          const buffsPositivos = ['defesa_aumentada', 'velocidade', 'regeneração', 'regeneracao', 'escudo', 'foco_aumentado', 'forca_aumentada', 'sobrecarga', 'benção', 'bencao', 'queimadura_contra_ataque', 'evasao_aumentada', 'velocidade_aumentada', 'invisivel', 'precisao_aumentada'];
          const primeiroEfeito = result.log.efeitos[0].replace(/[^\w]/g, '').toLowerCase();
          const ehBuff = buffsPositivos.some(buff => primeiroEfeito.includes(buff.replace(/[^\w]/g, '').toLowerCase()));

          if (ehBuff) {
            addLog(`💚 Aplicado em você: ${result.log.efeitos.join(', ')}`);
          } else {
            addLog(`🎯 Aplicado no oponente: ${result.log.efeitos.join(', ')}`);
          }
        }

        // Mensagem de contra-ataque
        if (result.contraAtaque) {
          addLog('🔥🛡️ CONTRA-ATAQUE! Você foi queimado!');
        }

        // Logs da IA (processados automaticamente pelo backend)
        if (result.logsParaJogador && Array.isArray(result.logsParaJogador)) {
          console.log('📜 [LOGS HABILIDADE] Logs da IA:', result.logsParaJogador);
          result.logsParaJogador.forEach(log => addLog(log));
        }

        // Efeitos visuais
        if (!result.errou && result.dano > 0) {
          if (result.numGolpes && result.numGolpes > 1) {
            mostrarDanoVisual('oponente', `${result.dano} ×${result.numGolpes}`, 'multihit');
          } else {
            mostrarDanoVisual('oponente', result.dano, result.critico ? 'critical' : 'damage');
          }
        }

        // Verificar fim de batalha
        processarFimDeBatalha(result);

        if (!result.finished) {
          await atualizarEstado();
        }
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

  // Calcular porcentagens de HP
  const hpMeuPercent = myHpMax > 0 ? Math.max(0, Math.min(100, (myHp / myHpMax) * 100)) : 0;
  const hpIAPercent = opponentHpMax > 0 ? Math.max(0, Math.min(100, (opponentHp / opponentHpMax) * 100)) : 0;

  // Se batalha ativa, usar layout compacto
  if (status === 'active') {
    return (
      <>
        <CompactBattleLayout
          meuAvatar={meuAvatar}
          iaAvatar={iaAvatar}
          sinergiaPlayer={sinergiaAtiva}
          sinergiaIA={sinergiaIA}
          myHp={myHp}
          myHpMax={myHpMax}
          opponentHp={opponentHp}
          opponentHpMax={opponentHpMax}
          myEnergy={myEnergy}
          opponentEnergy={opponentEnergy}
          myEffects={myEffects}
          opponentEffects={opponentEffects}
          isYourTurn={isYourTurn}
          currentTurn={currentTurn}
          log={log}
          atacar={atacar}
          defender={defender}
          usarHabilidade={usarHabilidade}
          abandonar={() => router.push('/arena/treinamento')}
          actionInProgress={actionInProgress}
        />
      </>
    );
  }

  // Se batalha finalizada, mostrar recompensas
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

              {/* Efeitos Ativos - Buffs e Debuffs Separados */}
              {myEffects.length > 0 && (
                <div className="px-3 pb-3 border-t border-slate-800 pt-2">
                  <div className="grid grid-cols-2 gap-1">
                    {/* Buffs (Esquerda) */}
                    <div className="flex flex-wrap gap-0.5">
                      {myEffects.filter(ef => ehBuff(ef.tipo)).map((ef, i) => (
                        <span key={i} className="text-[10px] bg-green-900/30 px-1 py-0.5 rounded border border-green-600/50" title={`${ef.tipo} (${ef.turnosRestantes})`}>
                          {getEfeitoEmoji(ef.tipo)}{ef.turnosRestantes}
                        </span>
                      ))}
                    </div>
                    {/* Debuffs (Direita) */}
                    <div className="flex flex-wrap gap-0.5 justify-end">
                      {myEffects.filter(ef => !ehBuff(ef.tipo)).map((ef, i) => (
                        <span key={i} className="text-[10px] bg-red-900/30 px-1 py-0.5 rounded border border-red-600/50" title={`${ef.tipo} (${ef.turnosRestantes})`}>
                          {getEfeitoEmoji(ef.tipo)}{ef.turnosRestantes}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SINERGIA ATIVA */}
          {sinergiaAtiva && (
            <div className="lg:col-span-2">
              <SynergyDisplay sinergia={sinergiaAtiva} />
            </div>
          )}

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

              {/* Efeitos Ativos - Buffs e Debuffs Separados */}
              {opponentEffects.length > 0 && (
                <div className="px-3 pb-3 border-t border-slate-800 pt-2">
                  <div className="grid grid-cols-2 gap-1">
                    {/* Buffs (Esquerda) */}
                    <div className="flex flex-wrap gap-0.5">
                      {opponentEffects.filter(ef => ehBuff(ef.tipo)).map((ef, i) => (
                        <span key={i} className="text-[10px] bg-green-900/30 px-1 py-0.5 rounded border border-green-600/50" title={`${ef.tipo} (${ef.turnosRestantes})`}>
                          {getEfeitoEmoji(ef.tipo)}{ef.turnosRestantes}
                        </span>
                      ))}
                    </div>
                    {/* Debuffs (Direita) */}
                    <div className="flex flex-wrap gap-0.5 justify-end">
                      {opponentEffects.filter(ef => !ehBuff(ef.tipo)).map((ef, i) => (
                        <span key={i} className="text-[10px] bg-red-900/30 px-1 py-0.5 rounded border border-red-600/50" title={`${ef.tipo} (${ef.turnosRestantes})`}>
                          {getEfeitoEmoji(ef.tipo)}{ef.turnosRestantes}
                        </span>
                      ))}
                    </div>
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
                className={`py-3 rounded-lg font-bold transition-all ${
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
                className={`py-3 rounded-lg font-bold transition-all ${
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
                  {meuAvatar.habilidades.map((habAvatar, index) => {
                    const hab = atualizarBalanceamentoHabilidade(habAvatar, meuAvatar?.elemento);
                    const custoEnergia = hab.custo_energia || 20;
                    return (
                      <button
                        key={index}
                        onClick={() => usarHabilidade(index)}
                        disabled={!isYourTurn || myEnergy < custoEnergia || actionInProgress}
                        className={`py-2.5 px-2 rounded text-left transition-all ${
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

        {/* Modal de Recompensas */}
        {mostrarRecompensas && recompensas && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border-2 border-yellow-500 rounded-xl p-6 max-w-md w-full">
              <div className="text-center mb-4">
                <div className="text-4xl font-black mb-2">
                  {winner === 'player' ? '🎉 VITÓRIA!' : '💀 DERROTA'}
                </div>
                <p className="text-slate-400 text-sm">{recompensas.descricao || 'Batalha finalizada'}</p>
              </div>

              {/* Recompensas */}
              <div className="space-y-3 mb-6">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-purple-400 font-bold mb-3 text-center">📊 Recompensas do Avatar</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400">✨ XP Ganho:</span>
                      <span className="text-white font-bold">+{recompensas.xp || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-pink-400">❤️ Vínculo:</span>
                      <span className={`font-bold ${(recompensas.vinculo || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(recompensas.vinculo || 0) > 0 ? '+' : ''}{recompensas.vinculo || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-orange-400">😰 Exaustão:</span>
                      <span className="text-orange-300 font-bold">+{recompensas.exaustao || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-4">
                  <h3 className="text-cyan-400 font-bold mb-2 text-center">🎯 Recompensas do Caçador</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">✨ XP Ganho:</span>
                    <span className="text-white font-bold">+{recompensas.xpCacador || 0}</span>
                  </div>
                </div>

                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 text-center">
                  <p className="text-green-400 text-sm">
                    ❤️ HP permanece {recompensas.hpOriginal || myHpMax} (É treino, não real!)
                  </p>
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-2">
                <button
                  onClick={aplicarRecompensas}
                  disabled={aplicandoRecompensas}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    aplicandoRecompensas
                      ? 'bg-slate-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 hover:scale-105'
                  }`}
                >
                  {aplicandoRecompensas ? '⏳ Aplicando...' : '✅ Coletar Recompensas'}
                </button>
                <p className="text-xs text-slate-500 text-center">
                  Clique para aplicar as recompensas e voltar ao treino
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Log de Batalha */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700">
            <h3 className="text-sm font-bold text-slate-300">📜 Log de Batalha</h3>
          </div>
          <div className="p-3 max-h-48 md:max-h-64 overflow-y-auto space-y-1">
            {log.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">Aguardando ações...</div>
            ) : (
              log.map((msg, i) => (
                <div key={i} className="text-xs md:text-sm text-slate-200 py-1.5 px-2.5 bg-slate-800/40 rounded border-l-2 border-cyan-500/30">
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
