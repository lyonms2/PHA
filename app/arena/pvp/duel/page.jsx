"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AvatarSVG from "../../../components/AvatarSVG";
import { calcularPoderTotal } from "@/lib/gameLogic";

function DuelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get('room');
  const minPower = parseInt(searchParams.get('minPower') || '0');
  const maxPower = parseInt(searchParams.get('maxPower') || '999');

  const [visitorId, setVisitorId] = useState(null);
  const [meuNome, setMeuNome] = useState('');
  const [meuAvatar, setMeuAvatar] = useState(null);
  const [roomId, setRoomId] = useState(roomIdParam);
  const [players, setPlayers] = useState([]);
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [challenging, setChallenging] = useState(false);
  const [room, setRoom] = useState(null);
  const [role, setRole] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [myHp, setMyHp] = useState(100);
  const [myHpMax, setMyHpMax] = useState(100);
  const [myExaustao, setMyExaustao] = useState(0);
  const [opponentHp, setOpponentHp] = useState(100);
  const [opponentHpMax, setOpponentHpMax] = useState(100);
  const [opponentExaustao, setOpponentExaustao] = useState(0);
  const [myEnergy, setMyEnergy] = useState(100);
  const [opponentEnergy, setOpponentEnergy] = useState(100);
  const [opponentNome, setOpponentNome] = useState('');
  const [opponentAvatar, setOpponentAvatar] = useState(null);
  const [myEffects, setMyEffects] = useState([]);
  const [opponentEffects, setOpponentEffects] = useState([]);
  const [log, setLog] = useState([]);
  const [inLobby, setInLobby] = useState(false);

  // Estados para efeitos visuais
  const [myDamageEffect, setMyDamageEffect] = useState(null);
  const [opponentDamageEffect, setOpponentDamageEffect] = useState(null);

  const pollingRef = useRef(null);
  const lastTurnRef = useRef(null);
  const effectsProcessedRef = useRef(false);

  // Carregar usuário e avatar
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    setVisitorId(parsed.visitorId || parsed.id);
    setMeuNome(parsed.nome_operacao || parsed.nome || 'Jogador');

    // Carregar avatar ativo
    carregarAvatar(parsed.id);
  }, [router]);

  const carregarAvatar = async (userId) => {
    try {
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();
      if (response.ok) {
        const ativo = data.avatares.find(av => av.ativo && av.vivo);
        setMeuAvatar(ativo || null);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar:", error);
    }
  };

  // Polling do lobby
  useEffect(() => {
    if (!visitorId || roomId) return;

    const pollLobby = async () => {
      try {
        const res = await fetch(`/api/pvp/lobby?visitorId=${visitorId}&minPower=${minPower}&maxPower=${maxPower}`);
        const data = await res.json();

        if (data.success) {
          // Verificar se seu desafio foi aceito
          if (data.acceptedRoom) {
            setRoomId(data.acceptedRoom);
            setInLobby(false);
            addLog('⚔️ Desafio aceito! Entrando na batalha...');
            return;
          }

          // Filtrar para não mostrar a si mesmo
          setPlayers(data.players.filter(p => p.visitorId !== visitorId));

          // Verificar desafio pendente
          if (data.pendingChallenge) {
            setPendingChallenge(data.pendingChallenge);
          } else {
            setPendingChallenge(null);
          }
        }
      } catch (err) {
        console.error('Erro no polling lobby:', err);
      }
    };

    if (inLobby) {
      pollLobby();
      pollingRef.current = setInterval(pollLobby, 1500);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [visitorId, inLobby, roomId, minPower, maxPower]);

  // Polling da batalha
  useEffect(() => {
    if (!roomId || !visitorId) return;

    const pollBattle = async () => {
      try {
        const res = await fetch(`/api/pvp/room/state?roomId=${roomId}&visitorId=${visitorId}`);
        const data = await res.json();

        if (data.success) {
          setRoom(data.room);
          setRole(data.role);
          setIsYourTurn(data.isYourTurn);
          setMyHp(data.myHp);
          setMyHpMax(data.myHpMax || 100);
          setMyExaustao(data.myExaustao || 0);
          setOpponentHp(data.opponentHp);
          setOpponentHpMax(data.opponentHpMax || 100);
          setOpponentExaustao(data.opponentExaustao || 0);
          setMyEnergy(data.myEnergy || 10);
          setOpponentEnergy(data.opponentEnergy || 10);
          setOpponentNome(data.opponentNome || 'Oponente');
          setOpponentAvatar(data.opponentAvatar || null);
          setMyEffects(data.myEffects || []);
          setOpponentEffects(data.opponentEffects || []);

          // Detectar mudança de turno
          if (lastTurnRef.current && lastTurnRef.current !== data.room.currentTurn) {
            if (data.isYourTurn) {
              // Processar efeitos no início do meu turno
              effectsProcessedRef.current = false;
              processarEfeitos();
              addLog('🟢 SEU TURNO!');
            }
          }
          lastTurnRef.current = data.room.currentTurn;

          // Verificar fim
          if (data.room.status === 'finished') {
            if (data.room.winner === data.role) {
              addLog('🏆 VOCÊ VENCEU!');
            } else {
              addLog('☠️ VOCÊ PERDEU!');
            }
            clearInterval(pollingRef.current);
          }
        }
      } catch (err) {
        console.error('Erro no polling:', err);
      }
    };

    pollBattle();
    pollingRef.current = setInterval(pollBattle, 1000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [roomId, visitorId]);

  // Cleanup ao sair
  useEffect(() => {
    return () => {
      if (visitorId && inLobby) {
        fetch('/api/pvp/lobby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId, action: 'leave' })
        }).catch(() => {});
      }
    };
  }, [visitorId, inLobby]);

  const addLog = (msg) => {
    setLog(prev => [msg, ...prev]);
  };

  // Entrar no lobby
  const entrarLobby = async () => {
    if (!visitorId || !meuAvatar) return;

    // Verificar se poder está na faixa
    const poder = calcularPoderTotal(meuAvatar);
    if (poder < minPower || poder > maxPower) {
      addLog(`❌ Seu avatar (Poder ${poder}) não pode entrar nesta sala (${minPower}-${maxPower})`);
      return;
    }

    try {
      const res = await fetch('/api/pvp/lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          action: 'enter',
          minPower,
          maxPower,
          avatar: meuAvatar
        })
      });
      const data = await res.json();

      if (data.success) {
        setInLobby(true);
      }
    } catch (err) {
      console.error('Erro ao entrar no lobby:', err);
    }
  };

  // Sair do lobby
  const sairLobby = async () => {
    try {
      await fetch('/api/pvp/lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, action: 'leave' })
      });
      setInLobby(false);
      router.push('/arena/pvp');
    } catch (err) {
      console.error('Erro ao sair do lobby:', err);
    }
  };

  // Desafiar jogador
  const desafiar = async (targetId) => {
    if (!visitorId || challenging) return;

    setChallenging(true);
    try {
      const res = await fetch('/api/pvp/lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, action: 'challenge', targetId })
      });
      const data = await res.json();

      if (data.success) {
        addLog('⚔️ Desafio enviado! Aguardando resposta...');
      }
    } catch (err) {
      console.error('Erro ao desafiar:', err);
    } finally {
      setChallenging(false);
    }
  };

  // Aceitar desafio
  const aceitarDesafio = async () => {
    if (!visitorId || !pendingChallenge) return;

    try {
      const res = await fetch('/api/pvp/lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, action: 'accept' })
      });
      const data = await res.json();

      if (data.success && data.roomId) {
        setRoomId(data.roomId);
        setInLobby(false);
        addLog('⚔️ Desafio aceito! Batalha iniciada!');
      }
    } catch (err) {
      console.error('Erro ao aceitar desafio:', err);
    }
  };

  // Recusar desafio
  const recusarDesafio = async () => {
    if (!visitorId) return;

    try {
      await fetch('/api/pvp/lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, action: 'reject' })
      });
      setPendingChallenge(null);
    } catch (err) {
      console.error('Erro ao recusar desafio:', err);
    }
  };

  // Mostrar efeito visual de dano/cura
  const showDamageEffect = (target, value, type = 'damage') => {
    const effect = { value, type };
    if (target === 'me') {
      setMyDamageEffect(effect);
      setTimeout(() => setMyDamageEffect(null), 1500);
    } else {
      setOpponentDamageEffect(effect);
      setTimeout(() => setOpponentDamageEffect(null), 1500);
    }
  };

  // Atacar
  const atacar = async () => {
    if (!roomId || !visitorId || !isYourTurn) return;

    // Verificar energia
    if (myEnergy < 10) {
      addLog('❌ Energia insuficiente! (10 necessária)');
      return;
    }

    try {
      const res = await fetch('/api/pvp/room/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, visitorId, action: 'attack' })
      });
      const data = await res.json();

      if (data.success) {
        const d = data.detalhes;

        // Verificar se errou (esquiva)
        if (data.errou) {
          if (data.invisivel) {
            addLog(`👻 ERROU! Oponente está INVISÍVEL!`);
            showDamageEffect('opponent', '', 'dodge');
          } else if (data.esquivou) {
            addLog(`💨 ERROU! O oponente esquivou com maestria!`);
            showDamageEffect('opponent', '', 'dodge');
          } else {
            addLog(`💨 ERROU! O oponente esquivou!`);
            showDamageEffect('opponent', '', 'miss');
          }
          if (d && d.chanceAcerto) {
            addLog(`📊 Chance: ${d.chanceAcerto}% | AGI: ${d.agilidade} vs ${d.agilidadeOponente} | Rolou: ${d.rolouAcerto}`);
          } else if (d && d.mensagem) {
            addLog(`📊 ${d.mensagem}`);
          }
          addLog(`⚡ Energia: -10 → ${data.newEnergy}`);
          setMyEnergy(data.newEnergy);
          return;
        }

        // Log principal
        let emoji = '⚔️';
        let tipo = 'ATAQUE';
        if (data.critico) { emoji = '💥'; tipo = 'CRÍTICO'; }
        if (data.bloqueado) { emoji = '🛡️'; tipo = 'BLOQUEADO'; }

        addLog(`${emoji} ${tipo}! Dano Final: ${data.dano}`);

        // Detalhes do cálculo
        if (d) {
          let calc = `📊 Base: ${d.danoBase} (5+${d.forca}×0.5+${d.random})`;
          calc += ` | -${d.reducaoDefesa} RES`;

          if (d.penalidadeExaustao) {
            calc += ` | 😰 ${d.penalidadeExaustao}`;
          }
          if (d.bonusVinculo) {
            calc += ` | 💕 ${d.bonusVinculo}`;
          }
          if (d.elementalMult !== 1.0) {
            const elemEmoji = d.elementalMult > 1 ? '🔥' : '💨';
            calc += ` | ${elemEmoji} ×${d.elementalMult}`;
          }
          if (data.critico) {
            calc += ` | 💥 ×2`;
          }
          if (data.bloqueado) {
            calc += ` | 🛡️ ×0.5`;
          }

          addLog(calc);
        }

        // Mensagem elemental
        if (data.elemental === 'vantagem') {
          addLog('🔥 Super efetivo!');
        } else if (data.elemental === 'desvantagem') {
          addLog('💨 Pouco efetivo...');
        }

        // Mensagem de contra-ataque
        if (data.contraAtaque) {
          addLog('🔥🛡️ CONTRA-ATAQUE! Você foi queimado!');
        }

        addLog(`⚡ Energia: -10 → ${data.newEnergy}`);

        // Efeito visual de dano no oponente
        showDamageEffect('opponent', data.dano, data.critico ? 'critical' : 'damage');

        // Efeito visual de contra-ataque em mim
        if (data.contraAtaque) {
          setTimeout(() => showDamageEffect('me', '🔥', 'burn'), 500);
        }

        setOpponentHp(data.newOpponentHp);
        setMyEnergy(data.newEnergy);

        // Não adicionar log de vitória aqui - o polling vai detectar
      } else {
        addLog(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error('Erro ao atacar:', err);
      addLog('❌ Erro ao atacar');
    }
  };

  // Defender
  const defender = async () => {
    if (!roomId || !visitorId || !isYourTurn) return;

    try {
      const res = await fetch('/api/pvp/room/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, visitorId, action: 'defend' })
      });
      const data = await res.json();

      if (data.success) {
        addLog(`🛡️ Você defendeu! +${data.energyGained} ⚡`);
        setMyEnergy(data.newEnergy);
      } else {
        addLog(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error('Erro ao defender:', err);
      addLog('❌ Erro ao defender');
    }
  };

  // Processar efeitos no início do turno
  const processarEfeitos = async () => {
    if (!roomId || !visitorId || effectsProcessedRef.current) return;

    // IMPORTANTE: Não verificar myEffects aqui - o backend vai verificar
    // porque o estado local pode estar desatualizado (race condition)
    effectsProcessedRef.current = true;

    try {
      const res = await fetch('/api/pvp/room/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, visitorId, action: 'process_effects' })
      });
      const data = await res.json();

      if (data.success) {
        // Mostrar logs dos efeitos
        if (data.logsEfeitos && data.logsEfeitos.length > 0) {
          for (const log of data.logsEfeitos) {
            addLog(log);
          }
        }

        setMyHp(data.newHp);
        setMyEffects(data.efeitosRestantes || []);

        if (data.finished) {
          addLog('☠️ Você morreu por efeitos!');
        }
      }
    } catch (err) {
      console.error('Erro ao processar efeitos:', err);
    }
  };

  // Usar habilidade
  const usarHabilidade = async (index) => {
    if (!roomId || !visitorId || !isYourTurn) return;

    const hab = meuAvatar?.habilidades?.[index];
    if (!hab) return;

    const custoEnergia = hab.custo_energia || 20;
    if (myEnergy < custoEnergia) {
      addLog(`❌ Energia insuficiente! (${custoEnergia} necessária)`);
      return;
    }

    try {
      const res = await fetch('/api/pvp/room/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          visitorId,
          action: 'ability',
          abilityIndex: index
        })
      });
      const data = await res.json();

      if (data.success) {
        // Verificar se errou
        if (data.errou) {
          if (data.invisivel) {
            addLog(`👻 ${hab.nome} ERROU! Oponente está INVISÍVEL!`);
            showDamageEffect('opponent', '', 'dodge');
          } else if (data.esquivou) {
            addLog(`💨 ${hab.nome} ERROU! O oponente esquivou com maestria!`);
            showDamageEffect('opponent', '', 'dodge');
          } else {
            addLog(`💨 ${hab.nome} ERROU! O oponente esquivou!`);
            showDamageEffect('opponent', '', 'miss');
          }
          if (data.detalhes) {
            const d = data.detalhes;
            if (d.chanceAcerto) {
              addLog(`📊 Chance: ${d.chanceAcerto}% (Base: ${d.chanceAcertoBase}% - ${d.reducaoEvasao}% AGI) | Rolou: ${d.rolouAcerto}`);
            } else if (d.mensagem) {
              addLog(`📊 ${d.mensagem}`);
            }
          }
          addLog(`⚡ Energia: -${custoEnergia} → ${data.newEnergy}`);
          setMyEnergy(data.newEnergy);
          return;
        }

        // Log principal da habilidade
        let emoji = '✨';
        let tipo = hab.nome.toUpperCase();
        if (data.critico) { emoji = '💥'; tipo = `${hab.nome.toUpperCase()} CRÍTICO`; }
        if (data.bloqueado) { emoji = '🛡️'; tipo = `${hab.nome.toUpperCase()} BLOQUEADO`; }

        let msg = `${emoji} ${tipo}!`;

        if (data.dano > 0) {
          msg += ` Dano: ${data.dano}`;
        }

        if (data.cura > 0) {
          msg += ` ❤️ Curou: ${data.cura}`;
        }

        addLog(msg);

        // Detalhes do cálculo
        if (data.detalhes && data.dano > 0) {
          const d = data.detalhes;
          let calc = `📊 ${d.stat.toUpperCase()}: ${d.statValue} | Base: ${d.danoBase}`;

          if (d.reducaoResistencia) {
            calc += ` | -${d.reducaoResistencia} RES`;
          }
          if (d.penalidadeExaustao) {
            calc += ` | 😰 ${d.penalidadeExaustao}`;
          }
          if (d.bonusVinculo) {
            calc += ` | 💕 ${d.bonusVinculo}`;
          }
          if (d.elementalMult !== 1.0) {
            const elemEmoji = d.elementalMult > 1 ? '🔥' : '💨';
            calc += ` | ${elemEmoji} ×${d.elementalMult}`;
          }
          if (data.critico) {
            calc += ` | 💥 ×2`;
          }
          if (data.bloqueado) {
            calc += ` | 🛡️ ×0.5`;
          }

          addLog(calc);
        }

        // Mensagem elemental
        if (data.elemental === 'vantagem') {
          addLog('🔥 Super efetivo!');
        } else if (data.elemental === 'desvantagem') {
          addLog('💨 Pouco efetivo...');
        }

        // Mensagem de contra-ataque
        if (data.contraAtaque) {
          addLog('🔥🛡️ CONTRA-ATAQUE! Você foi queimado!');
        }

        // Efeitos aplicados
        if (data.efeito) {
          addLog(`✨ ${data.efeito}`);
        }

        // Mostrar efeitos aplicados
        if (data.efeitosAplicados && data.efeitosAplicados.length > 0) {
          // Verificar se são buffs (aplicados em si mesmo) ou debuffs (no oponente)
          const buffsPositivos = ['defesa_aumentada', 'velocidade', 'regeneração', 'regeneracao', 'escudo', 'foco_aumentado', 'forca_aumentada', 'sobrecarga', 'benção', 'bencao', 'queimadura_contra_ataque', 'evasao_aumentada', 'velocidade_aumentada', 'invisivel'];
          const primeiroEfeito = data.efeitosAplicados[0].replace(/[^\w]/g, '').toLowerCase();
          const ehBuff = buffsPositivos.some(buff => primeiroEfeito.includes(buff.replace(/[^\w]/g, '').toLowerCase()));

          if (ehBuff) {
            addLog(`💚 Aplicado em você: ${data.efeitosAplicados.join(', ')}`);
            // Efeito visual de buff aplicado
            showDamageEffect('me', hab.nome, 'buff');
          } else {
            addLog(`🎯 Aplicado no oponente: ${data.efeitosAplicados.join(', ')}`);
          }
        }

        addLog(`⚡ Energia: -${custoEnergia} → ${data.newEnergy}`);

        // Efeitos visuais de dano/cura
        if (data.dano > 0) {
          // Verificar se é múltiplos golpes
          const numGolpes = hab.num_golpes || 1;
          if (numGolpes > 1) {
            showDamageEffect('opponent', `${data.dano} ×${numGolpes}`, 'multihit');
          } else {
            showDamageEffect('opponent', data.dano, data.critico ? 'critical' : 'damage');
          }
        }
        if (data.cura > 0) {
          showDamageEffect('me', data.cura, 'heal');
        }

        // Efeito visual de contra-ataque
        if (data.contraAtaque) {
          setTimeout(() => showDamageEffect('me', '🔥', 'burn'), 500);
        }

        if (data.newOpponentHp !== undefined) {
          setOpponentHp(data.newOpponentHp);
        }
        if (data.newMyHp !== undefined) {
          setMyHp(data.newMyHp);
        }
        setMyEnergy(data.newEnergy);

        // Não adicionar log de vitória aqui - o polling vai detectar
      } else {
        addLog(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error('Erro ao usar habilidade:', err);
      addLog('❌ Erro ao usar habilidade');
    }
  };

  // Nome da sala baseado no poder
  const getNomeSala = () => {
    if (maxPower <= 39) return '🌱 Sala Iniciante';
    if (maxPower <= 60) return '⚡ Sala Intermediário';
    if (maxPower <= 90) return '🔥 Sala Avançado';
    return '👑 Sala Elite';
  };

  // Emoji do elemento
  const getElementoEmoji = (elemento) => {
    const emojis = {
      'Fogo': '🔥',
      'Água': '💧',
      'Terra': '🪨',
      'Vento': '🌪️',
      'Eletricidade': '⚡',
      'Luz': '✨',
      'Sombra': '🌑'
    };
    return emojis[elemento] || '⚪';
  };

  // Emoji do efeito
  const getEfeitoEmoji = (tipo) => {
    const emojis = {
      'queimadura': '🔥', 'queimadura_intensa': '🔥🔥', 'veneno': '💀', 'sangramento': '🩸',
      'eletrocutado': '⚡', 'afogamento': '💧', 'erosão': '🌪️',
      'defesa_aumentada': '🛡️', 'velocidade': '💨', 'foco_aumentado': '🎯',
      'forca_aumentada': '💪', 'regeneração': '✨', 'escudo': '🛡️',
      'lentidão': '🐌', 'fraqueza': '⬇️', 'confusão': '🌀',
      'medo': '😱', 'cegueira': '🌑', 'silêncio': '🔇',
      'congelado': '❄️', 'atordoado': '💫', 'paralisado': '⚡⚡',
      'imobilizado': '🔒', 'sono': '😴',
      'fantasma': '👻', 'drenar': '🗡️', 'maldição': '💀'
    };
    return emojis[tipo] || '✨';
  };

  // Tela inicial - entrar no lobby
  if (!inLobby && !roomId) {
    const poder = meuAvatar ? calcularPoderTotal(meuAvatar) : 0;
    const hpMax = meuAvatar ? (meuAvatar.resistencia * 10) + (meuAvatar.nivel * 5) : 100;
    const hpAtual = meuAvatar?.hp_atual ?? hpMax;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.push('/arena/pvp')}
            className="text-cyan-400 hover:text-cyan-300 mb-4 text-sm"
          >
            ← Voltar às Salas
          </button>

          {/* Header da Sala */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">
              {getNomeSala()}
            </h1>
            <p className="text-slate-400 text-sm">Poder: {minPower} - {maxPower}</p>
          </div>

          {/* Card do Avatar Completo */}
          {meuAvatar && (
            <div className="relative mb-4">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 via-blue-500/30 to-purple-500/30 rounded-xl blur"></div>
              <div className="relative bg-slate-900/95 rounded-xl border border-cyan-500/50 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-3 py-2 border-b border-cyan-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Seu Combatente</div>
                      <div className="font-bold text-cyan-400">{meuAvatar.nome}</div>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      meuAvatar.raridade === 'Lendário' || meuAvatar.raridade === 'Mítico' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                      meuAvatar.raridade === 'Épico' ? 'bg-purple-600' :
                      meuAvatar.raridade === 'Raro' ? 'bg-blue-600' :
                      meuAvatar.raridade === 'Incomum' ? 'bg-green-600' :
                      'bg-slate-600'
                    }`}>
                      {meuAvatar.raridade}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">🎯 {meuNome || 'Caçador Misterioso'}</div>
                </div>

                {/* Avatar e Stats lado a lado */}
                <div className="p-3 flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <AvatarSVG avatar={meuAvatar} tamanho={100} />
                  </div>

                  {/* Stats */}
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
                      <span className="text-cyan-400 font-bold">{poder}</span>
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
                      <span className="font-mono">{hpAtual}/{hpMax}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          (hpAtual / hpMax) > 0.5 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                          (hpAtual / hpMax) > 0.25 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                          'bg-gradient-to-r from-red-600 to-red-400'
                        }`}
                        style={{ width: `${(hpAtual / hpMax) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Exaustão */}
                  {(meuAvatar.exaustao || 0) > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-orange-400 font-bold">😰 Exaustão</span>
                        <span className="font-mono">{meuAvatar.exaustao}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                          style={{ width: `${meuAvatar.exaustao}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Vínculo */}
                  {(meuAvatar.vinculo || 0) > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-pink-400 font-bold">💕 Vínculo</span>
                        <span className="font-mono">{meuAvatar.vinculo}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                          style={{ width: `${meuAvatar.vinculo}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Habilidades */}
                {meuAvatar.habilidades && meuAvatar.habilidades.length > 0 && (
                  <div className="px-3 pb-3 border-t border-slate-800 pt-2">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">✨ Habilidades ({meuAvatar.habilidades.length})</div>
                    <div className="flex flex-wrap gap-1">
                      {meuAvatar.habilidades.slice(0, 5).map((hab, i) => (
                        <span key={i} className="text-[9px] bg-purple-900/50 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                          {hab.nome}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aviso de compatibilidade */}
          {meuAvatar && (poder < minPower || poder > maxPower) && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-4 text-center">
              <div className="text-red-400 font-bold text-sm">⚠️ Avatar Incompatível</div>
              <div className="text-xs text-red-300">
                Poder {poder} fora da faixa {minPower}-{maxPower}
              </div>
            </div>
          )}

          {/* Botão Entrar */}
          <button
            onClick={entrarLobby}
            disabled={!meuAvatar || poder < minPower || poder > maxPower}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
              meuAvatar && poder >= minPower && poder <= maxPower
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 hover:scale-[1.02] active:scale-95'
                : 'bg-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            🎮 ENTRAR NO LOBBY
          </button>

          {/* Info */}
          <div className="mt-3 text-center text-[10px] text-slate-500">
            Encontre oponentes e desafie para batalha
          </div>

          {log.length > 0 && (
            <div className="mt-3 bg-slate-900/50 rounded-lg p-2 border border-slate-700 max-h-24 overflow-y-auto">
              {log.map((msg, i) => (
                <div key={i} className="text-[10px] text-slate-300 py-0.5">{msg}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela do lobby
  if (inLobby && !roomId) {
    const poder = meuAvatar ? calcularPoderTotal(meuAvatar) : 0;
    const hpMax = meuAvatar ? (meuAvatar.resistencia * 10) + (meuAvatar.nivel * 5) : 100;
    const hpAtual = meuAvatar?.hp_atual ?? hpMax;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <div>
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">
                {getNomeSala()}
              </h1>
              <p className="text-[10px] text-slate-400">Poder: {minPower} - {maxPower}</p>
            </div>
            <button
              onClick={sairLobby}
              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 border border-red-500/50 rounded hover:bg-red-500/20 transition-all"
            >
              ✕ Sair
            </button>
          </div>

          {/* Seu Avatar Compacto */}
          {meuAvatar && (
            <div className="relative mb-3">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg blur"></div>
              <div className="relative bg-slate-900/95 rounded-lg border border-cyan-500/40 p-2">
                <div className="flex items-center gap-2">
                  <AvatarSVG avatar={meuAvatar} tamanho={60} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-cyan-400 text-sm truncate">{meuAvatar.nome}</span>
                      <span className="text-[9px] bg-cyan-900/50 text-cyan-300 px-1 rounded">Nv.{meuAvatar.nivel}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">🎯 {meuNome || 'Caçador Misterioso'}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      <span>{getElementoEmoji(meuAvatar.elemento)} {meuAvatar.elemento}</span>
                      <span className="text-yellow-400">⚔️ {poder}</span>
                    </div>
                    {/* Stats inline */}
                    <div className="flex items-center gap-1.5 mt-1 text-[9px]">
                      <span className="text-orange-400">💪{meuAvatar.forca}</span>
                      <span className="text-green-400">💨{meuAvatar.agilidade}</span>
                      <span className="text-blue-400">🛡️{meuAvatar.resistencia}</span>
                      <span className="text-purple-400">🎯{meuAvatar.foco}</span>
                    </div>
                  </div>
                  {/* HP mini bar */}
                  <div className="w-16 text-right">
                    <div className="text-[9px] text-red-400 font-bold">❤️ {hpAtual}/{hpMax}</div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-0.5 overflow-hidden">
                      <div
                        className={`h-full ${
                          (hpAtual / hpMax) > 0.5 ? 'bg-green-500' :
                          (hpAtual / hpMax) > 0.25 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(hpAtual / hpMax) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desafio recebido */}
          {pendingChallenge && (
            <div className="relative mb-3">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 rounded-lg blur animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <p className="text-yellow-400 font-bold text-sm">Desafio Recebido!</p>
                    <p className="text-[10px] text-yellow-300">{pendingChallenge.challenger_nome || 'Alguém'} quer batalhar</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={aceitarDesafio}
                    className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 rounded font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
                  >
                    ✅ Aceitar
                  </button>
                  <button
                    onClick={recusarDesafio}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 rounded font-bold text-sm transition-all hover:scale-[1.02] active:scale-95"
                  >
                    ❌ Recusar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de jogadores */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur"></div>
            <div className="relative bg-slate-900/95 border border-purple-500/40 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-3 py-2 border-b border-purple-500/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-purple-300">
                    👥 Jogadores Online
                  </h2>
                  <span className="text-[10px] bg-purple-800/50 text-purple-200 px-1.5 py-0.5 rounded">
                    {players.length}
                  </span>
                </div>
              </div>

              <div className="p-2 max-h-[280px] overflow-y-auto">
                {players.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <div className="text-3xl mb-2">👀</div>
                    <p className="text-sm">Nenhum jogador no lobby</p>
                    <p className="text-[10px] mt-1">Aguardando oponentes...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {players.map((player) => {
                      const playerPoder = player.poder || (player.avatar ? calcularPoderTotal(player.avatar) : 0);
                      return (
                        <div
                          key={player.id}
                          className="relative"
                        >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg blur opacity-0 hover:opacity-100 transition-opacity"></div>
                          <div className="relative bg-slate-800/80 rounded-lg p-2 border border-slate-700 hover:border-red-500/50 transition-colors">
                            <div className="flex items-center gap-2">
                              {player.avatar && (
                                <AvatarSVG avatar={player.avatar} tamanho={55} />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-red-400 text-sm truncate">{player.avatar?.nome || 'Avatar'}</span>
                                  {player.avatar?.nivel && (
                                    <span className="text-[9px] bg-red-900/50 text-red-300 px-1 rounded">Nv.{player.avatar.nivel}</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  🎯 {player.nome || 'Caçador Misterioso'}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[10px]">
                                  {player.avatar?.elemento && (
                                    <span>{getElementoEmoji(player.avatar.elemento)} {player.avatar.elemento}</span>
                                  )}
                                  <span className="text-yellow-400 font-bold">⚔️ {playerPoder}</span>
                                </div>
                                {/* Stats do oponente */}
                                {player.avatar && (
                                  <div className="flex items-center gap-1.5 mt-1 text-[9px]">
                                    <span className="text-orange-400">💪{player.avatar.forca}</span>
                                    <span className="text-green-400">💨{player.avatar.agilidade}</span>
                                    <span className="text-blue-400">🛡️{player.avatar.resistencia}</span>
                                    <span className="text-purple-400">🎯{player.avatar.foco}</span>
                                  </div>
                                )}
                                {player.status === 'challenging' && (
                                  <span className="text-[9px] text-orange-400 animate-pulse">
                                    ⏳ Desafiando...
                                  </span>
                                )}
                              </div>
                              {player.status === 'waiting' && (
                                <button
                                  onClick={() => desafiar(player.visitorId)}
                                  disabled={challenging}
                                  className="px-2 py-1.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded text-[10px] font-bold disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                                >
                                  ⚔️ Desafiar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div className="mt-3 bg-slate-900/50 rounded-lg p-2 border border-slate-700 max-h-24 overflow-y-auto">
              {log.map((msg, i) => (
                <div key={i} className="text-[10px] text-slate-300 py-0.5">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela de batalha
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-3">
      <div className="max-w-xl mx-auto">

        {/* Header com título */}
        <div className="text-center mb-3">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400">
            ⚔️ BATALHA PVP
          </h1>
        </div>

        {/* Indicador de Turno */}
        <div className={`text-center py-1.5 px-3 rounded-lg mb-3 font-bold text-sm ${
          room?.status === 'finished'
            ? 'bg-gradient-to-r from-purple-900/80 to-pink-900/80 border border-purple-500'
            : isYourTurn
              ? 'bg-gradient-to-r from-green-900/80 to-emerald-900/80 border border-green-500 animate-pulse'
              : 'bg-gradient-to-r from-orange-900/80 to-red-900/80 border border-orange-500'
        }`}>
          {room?.status === 'finished'
            ? (room.winner === role ? '🏆 VITÓRIA!' : '☠️ DERROTA!')
            : isYourTurn
              ? '🟢 SEU TURNO - ESCOLHA SUA AÇÃO!'
              : '🟠 AGUARDANDO OPONENTE...'}
        </div>

        {/* Arena - Cards dos Avatares */}
        <div className="flex items-center gap-3 mb-3">

          {/* Seu Avatar */}
          <div className="relative flex-1">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-xl blur"></div>
            <div className="relative bg-slate-900/95 rounded-xl border-2 border-blue-500 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 px-2 py-1.5 border-b border-blue-500/50">
                <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">VOCÊ</div>
                <div className="font-bold text-white text-sm truncate">{meuAvatar?.nome || 'Avatar'}</div>
                <div className="text-[10px] text-slate-400 truncate">🎯 {meuNome || 'Caçador Misterioso'}</div>
              </div>

              {/* Avatar */}
              <div className="p-3 flex justify-center bg-gradient-to-b from-blue-950/30 to-transparent relative">
                {meuAvatar && <AvatarSVG avatar={meuAvatar} tamanho={90} />}

                {/* Efeito Visual de Dano/Cura/Buffs */}
                {myDamageEffect && (
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 ${
                    myDamageEffect.type === 'heal' ? 'animate-bounce' :
                    myDamageEffect.type === 'buff' ? 'animate-pulse' :
                    myDamageEffect.type === 'multihit' ? 'animate-ping' :
                    myDamageEffect.type === 'dodge' || myDamageEffect.type === 'miss' ? 'animate-bounce' :
                    'animate-pulse'
                  }`}>
                    <div className={`font-black drop-shadow-2xl ${
                      myDamageEffect.type === 'critical' ? 'text-red-500 text-5xl scale-150 animate-ping' :
                      myDamageEffect.type === 'heal' ? 'text-green-400 text-4xl' :
                      myDamageEffect.type === 'burn' ? 'text-orange-500 text-5xl' :
                      myDamageEffect.type === 'buff' ? 'text-cyan-400 text-3xl' :
                      myDamageEffect.type === 'multihit' ? 'text-yellow-400 text-5xl' :
                      myDamageEffect.type === 'dodge' ? 'text-purple-400 text-4xl' :
                      myDamageEffect.type === 'miss' ? 'text-gray-400 text-3xl' :
                      'text-red-400 text-4xl'
                    }`}>
                      {myDamageEffect.type === 'heal' ? `+${myDamageEffect.value} ❤️` :
                       myDamageEffect.type === 'burn' ? myDamageEffect.value :
                       myDamageEffect.type === 'buff' ? `${myDamageEffect.value} ✨` :
                       myDamageEffect.type === 'multihit' ? `${myDamageEffect.value}` :
                       myDamageEffect.type === 'dodge' ? 'DODGE! 💨' :
                       myDamageEffect.type === 'miss' ? 'MISS!' :
                       `-${myDamageEffect.value}`}
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="px-2 pb-2 space-y-1.5">
                {/* Elemento e Exaustão */}
                <div className="flex items-center justify-between text-[10px]">
                  <span>{getElementoEmoji(meuAvatar?.elemento)} {meuAvatar?.elemento}</span>
                  {myExaustao > 0 && <span className="text-orange-400">😰 {myExaustao}%</span>}
                </div>

                {/* HP Bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-red-400 font-bold">❤️ HP</span>
                    <span className="font-mono">{myHp}/{myHpMax}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (myHp / myHpMax) > 0.5 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                        (myHp / myHpMax) > 0.25 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                        'bg-gradient-to-r from-red-600 to-red-400'
                      }`}
                      style={{ width: `${(myHp / myHpMax) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Energia Bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-yellow-400 font-bold">⚡ Energia</span>
                    <span className="font-mono">{myEnergy}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 bg-gradient-to-r from-yellow-500 to-amber-400"
                      style={{ width: `${(myEnergy / 100) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Efeitos */}
                {myEffects.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 pt-1 border-t border-slate-700">
                    {myEffects.map((ef, i) => (
                      <span key={i} className="text-[10px] bg-slate-800/80 px-1 py-0.5 rounded border border-slate-600" title={`${ef.tipo} (${ef.turnosRestantes})`}>
                        {getEfeitoEmoji(ef.tipo)}{ef.turnosRestantes}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VS Compacto */}
          <div className="relative flex-shrink-0 z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-red-600/50 rounded-full blur-lg animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-full w-14 h-14 flex items-center justify-center border-2 border-pink-500 shadow-xl">
              <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-400 to-red-400 animate-pulse">
                VS
              </div>
            </div>
          </div>

          {/* Avatar do Oponente */}
          <div className="relative flex-1">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-xl blur"></div>
            <div className="relative bg-slate-900/95 rounded-xl border-2 border-red-500 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-900/50 to-orange-900/50 px-2 py-1.5 border-b border-red-500/50">
                <div className="text-[10px] text-red-300 font-bold uppercase tracking-wider">OPONENTE</div>
                <div className="font-bold text-white text-sm truncate">{opponentAvatar?.nome || 'Avatar'}</div>
                <div className="text-[10px] text-slate-400 truncate">🎯 {opponentNome || 'Caçador Misterioso'}</div>
              </div>

              {/* Avatar */}
              <div className="p-3 flex justify-center bg-gradient-to-b from-red-950/30 to-transparent relative">
                {opponentAvatar && <AvatarSVG avatar={opponentAvatar} tamanho={90} />}

                {/* Efeito Visual de Dano/Cura/Buffs */}
                {opponentDamageEffect && (
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-20 ${
                    opponentDamageEffect.type === 'heal' ? 'animate-bounce' :
                    opponentDamageEffect.type === 'buff' ? 'animate-pulse' :
                    opponentDamageEffect.type === 'multihit' ? 'animate-ping' :
                    opponentDamageEffect.type === 'dodge' || opponentDamageEffect.type === 'miss' ? 'animate-bounce' :
                    'animate-pulse'
                  }`}>
                    <div className={`font-black drop-shadow-2xl ${
                      opponentDamageEffect.type === 'critical' ? 'text-red-500 text-5xl scale-150 animate-ping' :
                      opponentDamageEffect.type === 'heal' ? 'text-green-400 text-4xl' :
                      opponentDamageEffect.type === 'burn' ? 'text-orange-500 text-5xl' :
                      opponentDamageEffect.type === 'buff' ? 'text-cyan-400 text-3xl' :
                      opponentDamageEffect.type === 'multihit' ? 'text-yellow-400 text-5xl' :
                      opponentDamageEffect.type === 'dodge' ? 'text-purple-400 text-4xl' :
                      opponentDamageEffect.type === 'miss' ? 'text-gray-400 text-3xl' :
                      'text-red-400 text-4xl'
                    }`}>
                      {opponentDamageEffect.type === 'heal' ? `+${opponentDamageEffect.value} ❤️` :
                       opponentDamageEffect.type === 'burn' ? opponentDamageEffect.value :
                       opponentDamageEffect.type === 'buff' ? `${opponentDamageEffect.value} ✨` :
                       opponentDamageEffect.type === 'multihit' ? `${opponentDamageEffect.value}` :
                       opponentDamageEffect.type === 'dodge' ? 'DODGE! 💨' :
                       opponentDamageEffect.type === 'miss' ? 'MISS!' :
                       `-${opponentDamageEffect.value}`}
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="px-2 pb-2 space-y-1.5">
                {/* Elemento e Exaustão */}
                <div className="flex items-center justify-between text-[10px]">
                  <span>{getElementoEmoji(opponentAvatar?.elemento)} {opponentAvatar?.elemento}</span>
                  {opponentExaustao > 0 && <span className="text-orange-400">😰 {opponentExaustao}%</span>}
                </div>

                {/* HP Bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-red-400 font-bold">❤️ HP</span>
                    <span className="font-mono">{opponentHp}/{opponentHpMax}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        (opponentHp / opponentHpMax) > 0.5 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                        (opponentHp / opponentHpMax) > 0.25 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                        'bg-gradient-to-r from-red-600 to-red-400'
                      }`}
                      style={{ width: `${(opponentHp / opponentHpMax) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Energia Bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-0.5">
                    <span className="text-yellow-400 font-bold">⚡ Energia</span>
                    <span className="font-mono">{opponentEnergy}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 bg-gradient-to-r from-yellow-500 to-amber-400"
                      style={{ width: `${(opponentEnergy / 100) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Efeitos */}
                {opponentEffects.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 pt-1 border-t border-slate-700">
                    {opponentEffects.map((ef, i) => (
                      <span key={i} className="text-[10px] bg-slate-800/80 px-1 py-0.5 rounded border border-slate-600" title={`${ef.tipo} (${ef.turnosRestantes})`}>
                        {getEfeitoEmoji(ef.tipo)}{ef.turnosRestantes}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Painel de Ações */}
        {room?.status === 'active' && (
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur"></div>
            <div className="relative bg-slate-900/95 rounded-xl border border-purple-500/50 p-3">
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-2 text-center">
                ⚔️ AÇÕES DE COMBATE
              </div>

              {/* Ataque e Defesa */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={atacar}
                  disabled={!isYourTurn || myEnergy < 10}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    isYourTurn && myEnergy >= 10
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 hover:scale-[1.02] active:scale-95'
                      : 'bg-slate-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className="text-sm">⚔️ Atacar</div>
                  <div className="text-[10px] opacity-75">-10 ⚡</div>
                </button>
                <button
                  onClick={defender}
                  disabled={!isYourTurn}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    isYourTurn
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
                    {meuAvatar.habilidades.slice(0, 5).map((hab, index) => (
                      <button
                        key={index}
                        onClick={() => usarHabilidade(index)}
                        disabled={!isYourTurn || myEnergy < (hab.custo_energia || 20)}
                        className={`py-1.5 px-2 rounded text-left transition-all ${
                          isYourTurn && myEnergy >= (hab.custo_energia || 20)
                            ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500 hover:to-pink-500 hover:scale-[1.02] active:scale-95 border border-purple-400/30'
                            : 'bg-slate-700/50 cursor-not-allowed opacity-40 border border-slate-600/30'
                        }`}
                      >
                        <div className="truncate text-[10px] font-bold">{hab.nome}</div>
                        <div className="text-[9px] opacity-75">-{hab.custo_energia || 20} ⚡</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Botão Voltar após fim */}
        {room?.status === 'finished' && (
          <button
            onClick={() => router.push('/arena/pvp')}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-bold mt-3"
          >
            🏠 Voltar ao Lobby
          </button>
        )}

        {/* Log de Batalha */}
        <div className="mt-3 bg-slate-950/80 rounded-xl border border-slate-700 overflow-hidden">
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

export default function DuelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando...</div>
      </div>
    }>
      <DuelContent />
    </Suspense>
  );
}
