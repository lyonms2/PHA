"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { inicializarBatalhaD20, processarTurnoD20, calcularHP } from "@/lib/combat/d20CombatSystem";
import { calcularRecompensasTreino } from "@/lib/arena/recompensasCalc";
import { calcularRecompensasPvP } from "@/lib/pvp/rankingSystem";
import { BattleSyncManager, enviarAcaoPvP, buscarEstadoSala, marcarComoPronto, notificarDesconexao } from "@/lib/pvp/battleSync";

// Components
import BattleArena from "./components/BattleArena";
import BattleActions from "./components/BattleActions";
import BattleResult from "./components/BattleResult";
import BattleLog from "./components/BattleLog";

// CSS personalizado para animacoes
const styles = `
  @keyframes bounce-up {
    0% {
      transform: translateY(0) translateX(-50%);
      opacity: 1;
    }
    50% {
      transform: translateY(-40px) translateX(-50%);
      opacity: 1;
    }
    100% {
      transform: translateY(-80px) translateX(-50%);
      opacity: 0;
    }
  }

  .animate-bounce-up {
    animation: bounce-up 1.5s ease-out forwards;
  }
`;

function BatalhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modoPvP = searchParams.get('modo') === 'pvp';

  const [estado, setEstado] = useState(null);
  const [log, setLog] = useState([]);
  const [turnoIA, setTurnoIA] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [processando, setProcessando] = useState(false);

  // Sistema de Timer
  const [tempoRestante, setTempoRestante] = useState(30);
  const [timerAtivo, setTimerAtivo] = useState(false);

  // Animacoes visuais
  const [animacaoDano, setAnimacaoDano] = useState(null);
  const [animacaoAcao, setAnimacaoAcao] = useState(null);

  // Dados PvP
  const [dadosPvP, setDadosPvP] = useState(null);

  // Estados PvP Ao Vivo
  const [pvpAoVivo, setPvpAoVivo] = useState(false);
  const [matchId, setMatchId] = useState(null);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [syncManager, setSyncManager] = useState(null);
  const [aguardandoOponente, setAguardandoOponente] = useState(false);
  const [oponenteDesconectou, setOponenteDesconectou] = useState(false);
  const [salaAtiva, setSalaAtiva] = useState(false); // Sala está ativa (ambos prontos)
  const [jogadorPronto, setJogadorPronto] = useState(false); // Jogador clicou em Pronto

  // Ref para controle de registro de batalha (anti-abandono)
  const batalhaRegistradaRef = useRef(false);
  // Ref para evitar múltiplas detecções de W.O.
  const woDetectadoRef = useRef(false);
  // Ref para evitar mensagem repetida de "Ambos prontos"
  const salaAtivadaRef = useRef(false);
  // Refs para valores usados em callbacks (evitar closure bugs)
  const isYourTurnRef = useRef(false);
  const salaAtivaRef = useRef(false);

  useEffect(() => {
    let batalhaJSON;

    if (modoPvP) {
      batalhaJSON = sessionStorage.getItem('batalha_pvp_dados');
      if (batalhaJSON) {
        const dados = JSON.parse(batalhaJSON);
        setDadosPvP(dados);

        const isPvpRealTime = dados.pvpAoVivo === true;
        setPvpAoVivo(isPvpRealTime);
        setMatchId(dados.matchId);

        // Se for PvP ao vivo e não tiver dados do oponente, aguardar inicialização
        if (isPvpRealTime && !dados.avatarOponente) {
          adicionarLog('⚔️ CONECTANDO À SALA PvP...');
          adicionarLog(`Preparando batalha...`);
          inicializarPvPAoVivo(dados);
          return;
        }

        // Criar avatar oponente padrão se não existir (fallback)
        const avatarOponente = dados.avatarOponente || {
          id: 'oponente_pvp',
          nome: dados.nomeOponente || 'Oponente',
          nivel: dados.avatarJogador.nivel || 1,
          elemento: 'Neutro',
          forca: dados.avatarJogador.forca || 10,
          agilidade: dados.avatarJogador.agilidade || 10,
          resistencia: dados.avatarJogador.resistencia || 10,
          foco: dados.avatarJogador.foco || 10,
          habilidades: []
        };

        const batalha = inicializarBatalhaD20(
          {
            ...dados.avatarJogador,
            habilidades: Array.isArray(dados.avatarJogador.habilidades) ? dados.avatarJogador.habilidades : [],
          },
          {
            ...avatarOponente,
            nome: dados.nomeOponente || avatarOponente.nome,
            habilidades: Array.isArray(avatarOponente.habilidades) ? avatarOponente.habilidades : [],
          },
          'normal'
        );

        setEstado(batalha);

        adicionarLog('⚔️ BATALHA PvP INICIADA!');
        adicionarLog(`Voce: ${batalha.jogador.nome} (${batalha.jogador.elemento})`);
        adicionarLog(`VS`);
        adicionarLog(`${dados.nomeOponente || 'Oponente'}: ${batalha.inimigo.nome} (${batalha.inimigo.elemento})`);
        if (dados.tierJogador) {
          adicionarLog(`Tier: ${dados.tierJogador.nome} ${dados.tierJogador.icone}`);
        }
        adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (isPvpRealTime && dados.matchId) {
          inicializarPvPAoVivo(dados);
        }
      }
    } else {
      batalhaJSON = localStorage.getItem('batalha_atual');
      if (batalhaJSON) {
        const batalha = JSON.parse(batalhaJSON);
        setEstado(batalha);

        adicionarLog('🎮 Batalha iniciada!');
        adicionarLog(`Voce: ${batalha.jogador.nome} (${batalha.jogador.elemento})`);
        adicionarLog(`VS`);
        adicionarLog(`Oponente: ${batalha.inimigo.nome} (${batalha.inimigo.elemento})`);
        adicionarLog(`Dificuldade: ${batalha.dificuldade.toUpperCase()}`);
        adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }

      setTimerAtivo(true);
      setTempoRestante(30);
    };

    setTimerAtivo(true);
    setTempoRestante(30);
  }, [router, modoPvP]);

  // Timer para turnos
  useEffect(() => {
    if (!timerAtivo || turnoIA || processando || resultado) {
      return;
    }

    const interval = setInterval(() => {
      // Em PvP ao vivo, só rodar timer se sala estiver ativa e for seu turno
      // Usar refs para evitar closure bugs
      if (pvpAoVivo && (!salaAtivaRef.current || !isYourTurnRef.current)) {
        return;
      }

      setTempoRestante((prev) => {
        if (prev <= 1) {
          adicionarLog('⏱️ Tempo esgotado! Defendendo automaticamente...');
          executarAcao('defender');
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerAtivo, turnoIA, processando, resultado, pvpAoVivo]);

  // Cleanup PvP ao sair
  useEffect(() => {
    return () => {
      if (syncManager) {
        syncManager.cleanup();
      }

      if (pvpAoVivo && matchId && !resultado) {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          notificarDesconexao(matchId, userData.id);
        }
      }
    };
  }, [syncManager, pvpAoVivo, matchId, resultado]);

  // Sistema Anti-Abandono: Registrar batalha ativa
  useEffect(() => {
    if (!estado) return;

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.id) return;

    // Registrar batalha como ativa (apenas uma vez)
    const registrarBatalha = async () => {
      if (batalhaRegistradaRef.current) return;
      batalhaRegistradaRef.current = true;

      try {
        await fetch('/api/batalha/ativa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.id,
            avatarId: estado.jogador?.id,
            acao: 'iniciar',
            tipo: modoPvP ? 'pvp' : 'treino',
            dados: {
              dificuldade: estado.dificuldade,
              estadoBatalha: estado
            },
            penalidade: {
              hp_perdido: modoPvP ? 30 : 15,
              exaustao: modoPvP ? 15 : 8,
              derrota: true
            }
          })
        });
      } catch (error) {
        console.error('Erro ao registrar batalha:', error);
      }
    };

    registrarBatalha();

    // Aviso antes de sair
    const handleBeforeUnload = (e) => {
      if (!resultado) {
        e.preventDefault();
        e.returnValue = 'Você está em uma batalha! Sair agora contará como derrota e aplicará penalidades.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [estado, modoPvP, resultado]);

  const adicionarLog = (mensagem) => {
    setLog(prev => [...prev, { texto: mensagem, timestamp: Date.now() }]);
  };

  // === FUNCOES PvP AO VIVO ===
  const inicializarPvPAoVivo = async (dados) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) return;

      const roomState = await buscarEstadoSala(dados.matchId, userData.id);

      if (!roomState.success) {
        console.error('Erro ao buscar sala:', roomState);
        return;
      }

      setPlayerNumber(roomState.playerNumber);
      setIsYourTurn(roomState.isYourTurn);
      setMatchId(dados.matchId);

      adicionarLog(`✅ Conectado a sala de batalha!`);
      adicionarLog(`🎮 Voce e o Player ${roomState.playerNumber}`);
      adicionarLog(`👆 Clique em PRONTO quando estiver preparado!`);

      const sync = new BattleSyncManager(
        dados.matchId,
        userData.id,
        handleRoomStateUpdate,
        handleOpponentAction
      );

      sync.startPolling(2000);
      setSyncManager(sync);

    } catch (error) {
      console.error('Erro ao inicializar PvP ao vivo:', error);
      adicionarLog('❌ Erro ao conectar a sala. Retornando ao lobby...');
      setTimeout(() => router.push('/arena/pvp'), 3000);
    }
  };

  // Função para marcar jogador como pronto
  const clicarPronto = async () => {
    if (jogadorPronto || !matchId) return;

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) return;

      await marcarComoPronto(matchId, userData.id);
      setJogadorPronto(true);
      adicionarLog(`✅ Voce está pronto!`);
      adicionarLog(`⏳ Aguardando oponente...`);
    } catch (error) {
      console.error('Erro ao marcar como pronto:', error);
      adicionarLog('❌ Erro ao confirmar. Tente novamente.');
    }
  };

  // Função para se render (PvP)
  const seRender = async () => {
    if (!estado || resultado) return;

    adicionarLog('🏳️ Voce se rendeu!');
    adicionarLog('☠️ DERROTA por rendição!');

    // Notificar servidor sobre rendição
    if (pvpAoVivo && matchId) {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        await enviarAcaoPvP(matchId, userData.id, {
          tipo: 'render',
          dano: 0,
          cura: 0,
          hp_jogador_atual: 0,
          hp_inimigo_atual: estado.inimigo.hp_atual,
          resultado: 'derrota'
        });
      } catch (error) {
        console.error('Erro ao notificar rendição:', error);
      }
    }

    // Finalizar como derrota
    finalizarBatalha(estado, 'inimigo');
  };

  const handleRoomStateUpdate = (roomState) => {
    // Verificar se ambos estão prontos e sala ficou ativa (usar ref para evitar repetição)
    if (roomState.room.status === 'active' && !salaAtivadaRef.current) {
      salaAtivadaRef.current = true;
      salaAtivaRef.current = true;
      setSalaAtiva(true);
      adicionarLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      adicionarLog(`🎮 BATALHA INICIADA!`);
      adicionarLog(`Primeiro turno: Player ${roomState.room.current_player}`);
      adicionarLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }

    const opponent = roomState.playerNumber === 1 ? roomState.player2 : roomState.player1;

    // Só verificar desconexão se a sala estiver ativa (ambos marcaram como pronto)
    // Evitar W.O. falso durante a fase de preparação
    if (roomState.room.status === 'active' && opponent.connected === false && !woDetectadoRef.current) {
      woDetectadoRef.current = true;
      setOponenteDesconectou(true);
      const nomeOponente = opponent.nome || 'Oponente';
      adicionarLog(`🚪 ${nomeOponente} desconectou!`);
      adicionarLog(`🏆 Voce venceu por W.O.!`);

      // Parar polling
      if (syncManager) {
        syncManager.stopPolling();
      }

      setTimeout(() => {
        if (estado) {
          finalizarBatalha(estado, 'jogador');
        }
      }, 2000);
      return;
    }

    // Atualizar estado e refs
    setIsYourTurn(roomState.isYourTurn);
    isYourTurnRef.current = roomState.isYourTurn;
    setAguardandoOponente(!roomState.isYourTurn && roomState.room.status === 'active');
  };

  const handleOpponentAction = (actionData) => {
    const action = actionData.action;

    adicionarLog(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    adicionarLog(`🔴 Oponente usou ${action.tipo}!`);

    if (action.dano > 0) {
      adicionarLog(`💥 Voce recebeu ${action.dano} de dano`);

      setAnimacaoDano({
        tipo: 'jogador',
        valor: action.dano,
        critico: action.critico || false
      });
      setTimeout(() => setAnimacaoDano(null), 1500);
    }

    if (action.cura > 0) {
      adicionarLog(`💚 Oponente se curou em ${action.cura} HP`);
    }

    setEstado(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        jogador: {
          ...prev.jogador,
          hp_atual: action.hp_inimigo_atual
        },
        inimigo: {
          ...prev.inimigo,
          hp_atual: action.hp_jogador_atual
        }
      };
    });

    setIsYourTurn(true);
    isYourTurnRef.current = true;
    setAguardandoOponente(false);
    setTempoRestante(30); // Resetar timer para seu turno

    if (action.resultado === 'vitoria') {
      adicionarLog(`☠️ Voce foi derrotado!`);
      setTimeout(() => {
        if (estado) {
          finalizarBatalha(estado, 'inimigo');
        }
      }, 1000);
    }
  };

  const executarAcao = async (tipo) => {
    if (!estado) return;

    if (pvpAoVivo) {
      // Verificar se sala está ativa (ambos prontos)
      if (!salaAtiva) {
        adicionarLog('⏳ Aguardando oponente entrar na sala...');
        return;
      }
      if (!isYourTurn) {
        adicionarLog('⚠️ Aguarde seu turno!');
        return;
      }
      if (aguardandoOponente) {
        adicionarLog('⏳ Aguardando oponente...');
        return;
      }
    } else {
      if (turnoIA || processando) return;
    }

    setProcessando(true);
    setTempoRestante(30);

    setAnimacaoAcao({ tipo, alvo: tipo === 'defender' || tipo === 'esquivar' ? 'jogador' : 'inimigo' });
    setTimeout(() => setAnimacaoAcao(null), 800);

    try {
      const resultado = processarTurnoD20(estado, tipo);

      resultado.logs.forEach(logMsg => {
        adicionarLog(logMsg);
      });

      if (resultado.ataqueJogador && resultado.ataqueJogador.acertou && resultado.ataqueJogador.danoFinal > 0) {
        setAnimacaoDano({
          tipo: 'inimigo',
          valor: resultado.ataqueJogador.danoFinal,
          critico: resultado.ataqueJogador.critico || false
        });
        setTimeout(() => setAnimacaoDano(null), 1500);
      }

      // === MODO PVP AO VIVO ===
      if (pvpAoVivo && matchId) {
        const userData = JSON.parse(localStorage.getItem('user'));

        await enviarAcaoPvP(matchId, userData.id, {
          tipo,
          dano: resultado.ataqueJogador?.danoFinal || 0,
          cura: 0,
          critico: resultado.ataqueJogador?.critico || false,
          energiaGasta: 0,
          hp_jogador_atual: resultado.novoEstado.jogador.hp_atual,
          hp_inimigo_atual: resultado.novoEstado.inimigo.hp_atual,
          resultado: resultado.fimBatalha ? (resultado.vencedor === 'jogador' ? 'vitoria' : 'derrota') : null
        });

        setEstado(resultado.novoEstado);
        setIsYourTurn(false);
        isYourTurnRef.current = false;
        setAguardandoOponente(true);
        adicionarLog('⏳ Aguardando ação do oponente...');

        if (resultado.fimBatalha) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          finalizarBatalha(resultado.novoEstado, resultado.vencedor);
        }

        setProcessando(false);
        return;
      }

      // === MODO TREINO (IA LOCAL) ===
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (resultado.ataqueInimigo && resultado.ataqueInimigo.acertou && resultado.ataqueInimigo.danoFinal > 0) {
        setTurnoIA(true);
        setAnimacaoDano({
          tipo: 'jogador',
          valor: resultado.ataqueInimigo.danoFinal,
          critico: resultado.ataqueInimigo.critico || false
        });
        setTimeout(() => setAnimacaoDano(null), 1500);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setTurnoIA(false);
      }

      if (resultado.fimBatalha) {
        finalizarBatalha(resultado.novoEstado, resultado.vencedor);
        setProcessando(false);
        return;
      }

      setEstado(resultado.novoEstado);

      // Salvar estado atualizado no banco (anti-abandono)
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.id && resultado.novoEstado.jogador?.id) {
        fetch('/api/batalha/ativa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.id,
            avatarId: resultado.novoEstado.jogador.id,
            acao: 'atualizar',
            dados: {
              estadoBatalha: resultado.novoEstado
            }
          })
        }).catch(err => console.error('Erro ao atualizar estado batalha:', err));
      }

    } catch (error) {
      console.error('Erro ao executar acao:', error);
      adicionarLog('❌ Erro ao processar acao!');
    } finally {
      setProcessando(false);
    }
  };

  const finalizarBatalha = (estadoFinal, vencedor) => {
    setTurnoIA(false);

    // Finalizar registro de batalha ativa (não aplicar penalidade)
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.id) {
      fetch('/api/batalha/ativa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id,
          acao: 'finalizar'
        })
      }).catch(err => console.error('Erro ao finalizar batalha:', err));
    }

    adicionarLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (vencedor === 'jogador') {
      adicionarLog('🎉 VITORIA!');
    } else if (vencedor === 'inimigo') {
      adicionarLog('☠️ DERROTA!');
    } else {
      adicionarLog('⚖️ EMPATE!');
    }

    let recompensas;

    if (modoPvP && dadosPvP) {
      const venceu = vencedor === 'jogador';
      recompensas = calcularRecompensasPvP(
        venceu,
        dadosPvP.famaJogador,
        dadosPvP.famaOponente,
        dadosPvP.tierJogador,
        dadosPvP.streakJogador || 0,
        estadoFinal.rodada
      );

      if (venceu) {
        adicionarLog(`🏆 +${recompensas.fama} Fama!`);
      } else {
        adicionarLog(`📉 ${recompensas.fama} Fama`);
      }

      if (recompensas.mensagens && recompensas.mensagens.length > 0) {
        recompensas.mensagens.forEach(msg => adicionarLog(msg));
      }
    } else {
      recompensas = calcularRecompensasTreino(estadoFinal, vencedor);
    }

    setResultado({
      vencedor,
      recompensas,
      estado: estadoFinal,
      pvp: modoPvP
    });
  };

  const voltarAoLobby = async () => {
    const userData = JSON.parse(localStorage.getItem('user'));

    if (resultado) {
      try {
        if (modoPvP) {
          const venceuBatalha = resultado.vencedor === 'jogador';
          const jogador1Id = userData.id;
          const jogador2Id = 'oponente_simulado';

          const rankingKey = `pvp_ranking_${userData.id}`;
          const rankingData = JSON.parse(localStorage.getItem(rankingKey) || '{"fama": 1000, "vitorias": 0, "derrotas": 0, "streak": 0}');
          const famaAntes = rankingData.fama || 1000;

          try {
            const responseBatalha = await fetch('/api/pvp/batalha', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jogador1Id,
                jogador2Id,
                vencedorId: venceuBatalha ? jogador1Id : jogador2Id,
                jogador1FamaAntes: famaAntes,
                jogador2FamaAntes: dadosPvP.famaOponente || 1000,
                jogador1FamaGanho: resultado.recompensas.fama,
                jogador2FamaGanho: venceuBatalha ? -resultado.recompensas.fama : Math.abs(resultado.recompensas.fama),
                duracaoRodadas: resultado.estado.rodada,
                jogador1Recompensas: {
                  xp: resultado.recompensas.xp,
                  moedas: resultado.recompensas.moedas,
                  fragmentos: resultado.recompensas.fragmentos || 0,
                  vinculo: resultado.recompensas.vinculo || 0,
                  exaustao: resultado.recompensas.exaustao
                },
                jogador2Recompensas: {},
                salvarLog: true
              })
            });

            if (responseBatalha.ok) {
              const dataBatalha = await responseBatalha.json();
              if (dataBatalha.success && dataBatalha.jogador1) {
                localStorage.setItem(rankingKey, JSON.stringify(dataBatalha.jogador1));
              }
            } else {
              console.warn('Erro ao salvar resultado no banco, salvando localmente');
              const novaFama = Math.max(0, famaAntes + resultado.recompensas.fama);
              rankingData.fama = novaFama;
              rankingData.vitorias = venceuBatalha ? (rankingData.vitorias || 0) + 1 : rankingData.vitorias;
              rankingData.derrotas = !venceuBatalha ? (rankingData.derrotas || 0) + 1 : rankingData.derrotas;
              rankingData.streak = venceuBatalha ? (rankingData.streak || 0) + 1 : 0;
              localStorage.setItem(rankingKey, JSON.stringify(rankingData));
            }
          } catch (error) {
            console.error('Erro ao salvar batalha PvP:', error);
            const novaFama = Math.max(0, famaAntes + resultado.recompensas.fama);
            rankingData.fama = novaFama;
            rankingData.vitorias = venceuBatalha ? (rankingData.vitorias || 0) + 1 : rankingData.vitorias;
            rankingData.derrotas = !venceuBatalha ? (rankingData.derrotas || 0) + 1 : rankingData.derrotas;
            rankingData.streak = venceuBatalha ? (rankingData.streak || 0) + 1 : 0;
            localStorage.setItem(rankingKey, JSON.stringify(rankingData));
          }

          await fetch('/api/atualizar-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userData.id,
              moedas: resultado.recompensas.moedas,
              fragmentos: resultado.recompensas.fragmentos || 0
            })
          });

          await fetch('/api/atualizar-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatarId: estado.jogador.id,
              experiencia: resultado.recompensas.xp,
              exaustao: resultado.recompensas.exaustao,
              vinculo: resultado.recompensas.vinculo || 0
            })
          });

          sessionStorage.removeItem('batalha_pvp_dados');
          router.push('/arena/pvp');
        } else {
          await fetch('/api/atualizar-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatarId: estado.jogador.id,
              experiencia: resultado.recompensas.xp,
              exaustao: resultado.recompensas.exaustao,
              vinculo: resultado.recompensas.vinculo || 0
            })
          });

          localStorage.removeItem('batalha_atual');
          router.push('/arena/treinamento');
        }
      } catch (error) {
        console.error('Erro ao aplicar recompensas:', error);
        if (modoPvP) {
          sessionStorage.removeItem('batalha_pvp_dados');
          router.push('/arena/pvp');
        } else {
          localStorage.removeItem('batalha_atual');
          router.push('/arena/treinamento');
        }
      }
    }
  };

  if (!estado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex items-center justify-center">
        <div className="text-red-400 font-mono animate-pulse">Carregando batalha...</div>
      </div>
    );
  }

  const hpJogadorPercent = (estado.jogador.hp_atual / estado.jogador.hp_maximo) * 100;
  const hpInimigoPercent = (estado.inimigo.hp_atual / estado.inimigo.hp_maximo) * 100;
  const energiaJogadorPercent = (estado.jogador.energia_atual / 100) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100">
      <style jsx>{styles}</style>

      {/* Modal de Resultado */}
      <BattleResult resultado={resultado} voltarAoLobby={voltarAoLobby} />

      {/* Interface de Batalha */}
      <div className="container mx-auto px-3 py-2 max-w-7xl">
        {/* Header Compacto */}
        <div className="flex justify-between items-center mb-2 bg-slate-900/50 rounded px-3 py-1.5 border border-slate-700/50">
          <div className="text-xs text-slate-400 font-mono">
            ⏰ R{estado.rodada} | 🎯 {estado.dificuldade}
          </div>
          <div className="text-xs font-bold">
            {pvpAoVivo ? (
              isYourTurn ? (
                <span className="text-green-400 animate-pulse">🟢 SEU TURNO</span>
              ) : (
                <span className="text-orange-400">🟠 Aguardando Oponente...</span>
              )
            ) : (
              turnoIA ? '🤖 Oponente' : '🎮 Seu Turno'
            )}
          </div>

          {/* Timer Compacto Inline */}
          {!turnoIA && !resultado && (
            <div className="flex items-center gap-2">
              <span className={`text-lg ${tempoRestante <= 5 ? 'animate-bounce' : ''}`}>
                {tempoRestante <= 10 ? '⏰' : '⏱️'}
              </span>
              <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-600">
                <div
                  className={`h-2 transition-all duration-1000 ${
                    tempoRestante <= 5 ? 'bg-red-500' :
                    tempoRestante <= 10 ? 'bg-orange-500' :
                    'bg-cyan-500'
                  }`}
                  style={{ width: `${(tempoRestante / 30) * 100}%` }}
                ></div>
              </div>
              <span className={`text-xs font-mono font-bold min-w-[24px] ${
                tempoRestante <= 5 ? 'text-red-400 animate-pulse' :
                tempoRestante <= 10 ? 'text-orange-400' :
                'text-cyan-400'
              }`}>
                {tempoRestante}s
              </span>
            </div>
          )}
        </div>

        {/* Banner de Ultima Acao - Compacto */}
        {log.length > 0 && (() => {
          const ultimaAcao = log[log.length - 1].texto;

          const isVitoria = ultimaAcao.includes('VITORIA') || ultimaAcao.includes('🎉');
          const isDerrota = ultimaAcao.includes('DERROTA') || ultimaAcao.includes('☠️');
          const isDano = ultimaAcao.includes('causou') || ultimaAcao.includes('dano') || ultimaAcao.includes('💥');
          const isCura = ultimaAcao.includes('recuperou') || ultimaAcao.includes('HP') || ultimaAcao.includes('💚');
          const isDefesa = ultimaAcao.includes('defendeu') || ultimaAcao.includes('🛡️');
          const isCritico = ultimaAcao.includes('CRITICO') || ultimaAcao.includes('💀');

          let corBorda = 'border-cyan-500/50';
          let icone = '⚡';

          if (isVitoria) { corBorda = 'border-green-500/50'; icone = '🎉'; }
          else if (isDerrota) { corBorda = 'border-red-500/50'; icone = '☠️'; }
          else if (isCritico) { corBorda = 'border-purple-500/50'; icone = '💀'; }
          else if (isDano) { corBorda = 'border-orange-500/50'; icone = '💥'; }
          else if (isCura) { corBorda = 'border-green-500/50'; icone = '💚'; }
          else if (isDefesa) { corBorda = 'border-blue-500/50'; icone = '🛡️'; }

          return (
            <div className={`mb-2 bg-slate-900/80 rounded px-3 py-2 border ${corBorda} flex items-center gap-2`}>
              <span className="text-sm">{icone}</span>
              <div className="text-xs font-mono text-slate-200 truncate flex-1">
                {ultimaAcao}
              </div>
            </div>
          );
        })()}

        {/* Botão Pronto - PvP Ao Vivo */}
        {pvpAoVivo && !salaAtiva && (
          <div className="mb-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-lg p-4 border border-purple-500/50 text-center">
            {!jogadorPronto ? (
              <>
                <p className="text-slate-300 mb-3">
                  Clique no botão abaixo quando estiver pronto para começar!
                </p>
                <button
                  onClick={clicarPronto}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg text-lg transform hover:scale-105 transition-all animate-pulse"
                >
                  ✅ PRONTO!
                </button>
              </>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin text-2xl">⏳</div>
                <p className="text-yellow-400 font-bold">
                  Aguardando oponente ficar pronto...
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-2">
          {/* Arena de Combate */}
          <BattleArena
            estado={estado}
            animacaoDano={animacaoDano}
            animacaoAcao={animacaoAcao}
            hpJogadorPercent={hpJogadorPercent}
            hpInimigoPercent={hpInimigoPercent}
            energiaJogadorPercent={energiaJogadorPercent}
          />

          {/* Acoes D20 */}
          <BattleActions
            estado={estado}
            turnoIA={turnoIA}
            processando={processando}
            executarAcao={executarAcao}
            pvpAoVivo={pvpAoVivo}
            onSurrender={seRender}
          />
        </div>

        {/* Log de Combate - Embaixo */}
        <BattleLog log={log} />
      </div>
    </div>
  );
}

export default function BatalhaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex items-center justify-center">
        <div className="text-red-400 font-mono animate-pulse">Carregando batalha...</div>
      </div>
    }>
      <BatalhaContent />
    </Suspense>
  );
}
