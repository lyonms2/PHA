"use client";

/**
 * PÁGINA DE BATALHA UNIFICADA (Refatorada)
 *
 * Migração: D20 System → PVP System (biblioteca compartilhada)
 *
 * Modos suportados:
 * - Treino IA: usa /api/arena/treino-ia/batalha
 * - Desafio Boss: usa /api/arena/desafios/batalha
 * - PVP: redireciona para /arena/pvp/duel (recomendado)
 */

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { calcularHPMaximoCompleto } from "@/lib/combat/statsCalculator";

// Components
import BattleArena from "./components/BattleArena";
import BattleActions from "./components/BattleActions";
import BattleResult from "./components/BattleResult";
import BattleLog from "./components/BattleLog";

function BatalhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modo = searchParams.get('modo');
  const modoPvP = modo === 'pvp';
  const modoTreinoIA = modo === 'treino-ia';
  const modoDesafioBoss = modo === 'desafio-boss';

  const [battleId, setBattleId] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [log, setLog] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [isYourTurn, setIsYourTurn] = useState(true);

  // Polling para atualizar estado
  const pollingRef = useRef(null);

  // ===== INICIALIZAÇÃO =====
  useEffect(() => {
    if (modoPvP) {
      // PVP: Redirecionar para o duelo (usa PVP System nativo)
      const batalhaJSON = sessionStorage.getItem('batalha_pvp_dados');
      if (batalhaJSON) {
        const dados = JSON.parse(batalhaJSON);

        // Construir query params para o duelo
        const minPower = Math.floor(dados.avatarJogador.poder * 0.8);
        const maxPower = Math.floor(dados.avatarJogador.poder * 1.2);

        adicionarLog('🔄 Redirecionando para sistema PVP...');
        setTimeout(() => {
          router.push(`/arena/pvp/duel?minPower=${minPower}&maxPower=${maxPower}`);
        }, 1000);
      }
      return;
    }

    if (modoTreinoIA) {
      inicializarTreinoIA();
    } else if (modoDesafioBoss) {
      inicializarDesafioBoss();
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [modo, router]);

  // ===== INICIALIZAR TREINO IA =====
  const inicializarTreinoIA = async () => {
    const batalhaJSON = sessionStorage.getItem('batalha_treino_dados');
    if (!batalhaJSON) {
      adicionarLog('❌ Dados de treino não encontrados');
      setTimeout(() => router.push('/arena/treinamento'), 2000);
      return;
    }

    const dados = JSON.parse(batalhaJSON);

    try {
      adicionarLog('🤖 Iniciando treino contra IA...');

      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init',
          playerAvatar: dados.avatarJogador,
          iaAvatar: dados.avatarOponente,
          personalidadeIA: dados.personalidadeIA,
          dificuldade: dados.dificuldade || 'normal'
        })
      });

      const data = await response.json();

      if (data.success) {
        setBattleId(data.battleId);
        adicionarLog('✅ Batalha iniciada!');
        adicionarLog(`Você: ${dados.avatarJogador.nome} (${dados.avatarJogador.elemento})`);
        adicionarLog(`VS IA: ${dados.nomeOponente} (${dados.avatarOponente.elemento})`);
        adicionarLog(`Dificuldade: ${(dados.dificuldade || 'normal').toUpperCase()}`);
        adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        adicionarLog('💡 Batalha de treino - Sem risco de morte!');
        adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Buscar estado inicial
        await atualizarEstadoBatalha(data.battleId);

        // Iniciar polling
        pollingRef.current = setInterval(() => {
          atualizarEstadoBatalha(data.battleId);
        }, 2000);
      } else {
        adicionarLog(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao iniciar treino IA:', error);
      adicionarLog('❌ Erro ao iniciar batalha');
    }
  };

  // ===== INICIALIZAR DESAFIO BOSS =====
  const inicializarDesafioBoss = async () => {
    const batalhaJSON = sessionStorage.getItem('batalha_desafio_dados');
    if (!batalhaJSON) {
      adicionarLog('❌ Dados de desafio não encontrados');
      setTimeout(() => router.push('/arena/desafios'), 2000);
      return;
    }

    const dados = JSON.parse(batalhaJSON);

    try {
      adicionarLog('👑 Iniciando desafio contra boss...');

      const response = await fetch('/api/arena/desafios/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init',
          playerAvatar: dados.avatarJogador,
          bossAvatar: dados.avatarOponente,
          bossData: dados.bossData
        })
      });

      const data = await response.json();

      if (data.success) {
        setBattleId(data.battleId);
        adicionarLog('✅ Desafio iniciado!');
        adicionarLog(`Você: ${dados.avatarJogador.nome} (${dados.avatarJogador.elemento})`);
        adicionarLog(`VS BOSS: ${dados.nomeOponente || dados.avatarOponente.nome}`);
        if (dados.bossData?.descricao) {
          adicionarLog(`📜 ${dados.bossData.descricao}`);
        }
        adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        adicionarLog('⚠️ CUIDADO: Bosses são muito fortes!');
        adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Buscar estado inicial
        await atualizarEstadoBatalha(data.battleId);

        // Iniciar polling
        pollingRef.current = setInterval(() => {
          atualizarEstadoBatalha(data.battleId);
        }, 2000);
      } else {
        adicionarLog(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao iniciar desafio:', error);
      adicionarLog('❌ Erro ao iniciar desafio');
    }
  };

  // ===== ATUALIZAR ESTADO DA BATALHA =====
  const atualizarEstadoBatalha = async (bId) => {
    if (!bId) return;

    try {
      const endpoint = modoTreinoIA
        ? `/api/arena/treino-ia/batalha?battleId=${bId}`
        : `/api/arena/desafios/batalha?battleId=${bId}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setBattleState(data.battle);
        setIsYourTurn(data.isYourTurn);

        // Processar novos logs
        if (data.battle.battleLog) {
          const currentLogIds = log.map(l => l.id);
          const newLogs = data.battle.battleLog.filter(l => !currentLogIds.includes(l.id));
          newLogs.forEach(l => {
            adicionarLog(formatarLog(l));
          });
        }

        // Verificar fim de batalha
        if (data.battle.status === 'finished') {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          finalizarBatalha(data.battle.winner);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar estado:', error);
    }
  };

  // ===== FORMATAR LOG =====
  const formatarLog = (logEntry) => {
    const { acao, jogador, alvo, dano, cura, critico, errou, habilidade } = logEntry;

    if (acao === 'attack') {
      if (errou) return `💨 ${jogador} ERROU!`;
      let msg = critico ? `💥 ${jogador} → ${alvo}: CRÍTICO! ` : `⚔️ ${jogador} → ${alvo}: `;
      msg += `${dano} de dano`;
      return msg;
    }

    if (acao === 'ability') {
      if (errou) return `💨 ${jogador} usou ${habilidade} mas ERROU!`;
      let msg = `✨ ${jogador} usou ${habilidade}!`;
      if (dano > 0) msg += ` ${dano} de dano`;
      if (cura > 0) msg += ` ❤️ ${cura} de cura`;
      return msg;
    }

    if (acao === 'defend') {
      return `🛡️ ${jogador} defendeu!`;
    }

    return JSON.stringify(logEntry);
  };

  // ===== EXECUTAR AÇÃO =====
  const executarAcao = async (acao, abilityIndex = null) => {
    if (!battleId || !isYourTurn || processando) return;

    setProcessando(true);

    try {
      const endpoint = modoTreinoIA
        ? '/api/arena/treino-ia/batalha'
        : '/api/arena/desafios/batalha';

      const body = {
        battleId,
        action: acao,
        abilityIndex
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar estado imediatamente
        await atualizarEstadoBatalha(battleId);

        if (data.finished) {
          finalizarBatalha(data.winner);
        }
      } else {
        adicionarLog(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      adicionarLog('❌ Erro ao executar ação');
    } finally {
      setProcessando(false);
    }
  };

  // ===== FINALIZAR BATALHA =====
  const finalizarBatalha = (vencedor) => {
    const vitoria = vencedor === 'player';

    setResultado({
      vitoria,
      vencedor: vitoria ? battleState?.playerNome : (battleState?.iaNoome || battleState?.bossNome),
      perdedor: vitoria ? (battleState?.iaNoome || battleState?.bossNome) : battleState?.playerNome,
    });

    adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    adicionarLog(vitoria ? '🏆 VITÓRIA!' : '💀 DERROTA!');
    adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // ===== ADICIONAR LOG =====
  const adicionarLog = (msg) => {
    setLog(prev => [{
      id: Date.now() + Math.random(),
      mensagem: msg,
      timestamp: new Date().toISOString()
    }, ...prev].slice(0, 50));
  };

  // ===== CONVERTER ESTADO PARA FORMATO DOS COMPONENTES =====
  const estado = battleState ? {
    jogador: {
      nome: battleState.playerNome,
      hp_atual: battleState.playerHp,
      hp_maximo: battleState.playerHpMax,
      energia: battleState.playerEnergy,
      elemento: battleState.playerAvatar?.elemento,
      efeitos: battleState.playerEffects || []
    },
    inimigo: {
      nome: battleState.iaNoome || battleState.bossNome,
      hp_atual: battleState.iaHp || battleState.bossHp,
      hp_maximo: battleState.iaHpMax || battleState.bossHpMax,
      energia: battleState.iaEnergy || battleState.bossEnergy,
      elemento: battleState.iaAvatar?.elemento || battleState.bossAvatar?.elemento,
      efeitos: battleState.iaEffects || battleState.bossEffects || []
    },
    turno: battleState.currentTurn,
    status: battleState.status
  } : null;

  // ===== RENDER =====
  if (modoPvP) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/90 border-2 border-purple-500 rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">🔄 Redirecionando...</h2>
          <p className="text-slate-300">Carregando sistema PVP...</p>
          <div className="mt-4">
            <BattleLog logs={log} />
          </div>
        </div>
      </div>
    );
  }

  if (resultado) {
    return <BattleResult resultado={resultado} />;
  }

  if (!estado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">
          Carregando batalha...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Arena de Batalha */}
        <BattleArena
          estado={estado}
          animacaoDano={null}
          animacaoAcao={null}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Ações */}
          <div className="lg:col-span-2">
            <BattleActions
              estado={estado}
              executarAcao={executarAcao}
              processando={processando}
              isYourTurn={isYourTurn}
            />
          </div>

          {/* Log */}
          <div className="lg:col-span-1">
            <BattleLog logs={log} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BatalhaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>}>
      <BatalhaContent />
    </Suspense>
  );
}
