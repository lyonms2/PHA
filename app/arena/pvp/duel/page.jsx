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
  const [log, setLog] = useState([]);
  const [inLobby, setInLobby] = useState(false);

  const pollingRef = useRef(null);
  const lastTurnRef = useRef(null);

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

          // Detectar mudança de turno
          if (lastTurnRef.current && lastTurnRef.current !== data.room.currentTurn) {
            if (data.isYourTurn) {
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

        addLog(`⚡ Energia: -10 → ${data.newEnergy}`);

        setOpponentHp(data.newOpponentHp);
        setMyEnergy(data.newEnergy);

        if (data.finished) {
          addLog('🏆 VOCÊ VENCEU!');
        }
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
        let msg = `✨ ${hab.nome}!`;

        if (data.dano > 0) {
          if (data.critico) {
            msg += ` 💥 CRÍTICO! Dano: ${data.dano}`;
          } else {
            msg += ` Dano: ${data.dano}`;
          }
        }

        if (data.cura > 0) {
          msg += ` ❤️ Curou: ${data.cura}`;
        }

        if (data.elemental === 'vantagem') {
          msg += ' 🔥 Super efetivo!';
        } else if (data.elemental === 'desvantagem') {
          msg += ' 💨 Pouco efetivo...';
        }

        if (data.efeito) {
          msg += ` | ${data.efeito}`;
        }

        msg += ` | -${custoEnergia} ⚡`;
        addLog(msg);

        if (data.newOpponentHp !== undefined) {
          setOpponentHp(data.newOpponentHp);
        }
        if (data.newMyHp !== undefined) {
          setMyHp(data.newMyHp);
        }
        setMyEnergy(data.newEnergy);

        if (data.finished) {
          addLog('🏆 VOCÊ VENCEU!');
        }
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

  // Tela inicial - entrar no lobby
  if (!inLobby && !roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.push('/arena/pvp')}
            className="text-cyan-400 hover:text-cyan-300 mb-6 block"
          >
            ← Voltar
          </button>

          <h1 className="text-3xl font-bold mb-2 text-center">{getNomeSala()}</h1>
          <p className="text-slate-400 mb-6 text-center">Poder: {minPower} - {maxPower}</p>

          {/* Card do Avatar Completo */}
          {meuAvatar && (
            <div className="relative group mb-6">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-xl blur opacity-50"></div>
              <div className="relative bg-slate-950/90 backdrop-blur-xl border border-cyan-900/50 rounded-xl overflow-hidden">
                {/* Header do Card */}
                <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-4 border-b border-cyan-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-400 uppercase font-mono tracking-wider">Seu Combatente</div>
                    <div className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      meuAvatar.raridade === 'Lendário' || meuAvatar.raridade === 'Mítico' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' :
                      meuAvatar.raridade === 'Épico' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' :
                      meuAvatar.raridade === 'Raro' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {meuAvatar.raridade}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-cyan-400">{meuAvatar.nome}</h2>
                  <div className="text-sm text-slate-400 mt-1">
                    🎯 {meuNome || 'Caçador Misterioso'}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm text-slate-300">Nv.{meuAvatar.nivel}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-sm">{getElementoEmoji(meuAvatar.elemento)} {meuAvatar.elemento}</span>
                  </div>
                </div>

                {/* Avatar Image */}
                <div className="p-6 flex justify-center bg-gradient-to-b from-slate-950/30 to-transparent">
                  <AvatarSVG avatar={meuAvatar} tamanho={120} />
                </div>

                {/* Stats */}
                <div className="p-4 border-t border-slate-800">
                  <div className="text-center">
                    <span className="text-cyan-400 font-bold text-lg">⚔️ Poder: {calcularPoderTotal(meuAvatar)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-orange-500 rounded-lg p-8 text-center">
            <p className="text-slate-300 mb-6">
              Entre no lobby para ver outros jogadores e desafiá-los!
            </p>
            <button
              onClick={entrarLobby}
              disabled={!meuAvatar}
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-gray-600 disabled:to-gray-600 rounded-lg font-bold text-xl"
            >
              🎮 ENTRAR NO LOBBY
            </button>
          </div>

          {log.length > 0 && (
            <div className="mt-4 bg-slate-900/50 rounded-lg p-3 border border-slate-700">
              {log.map((msg, i) => (
                <div key={i} className="text-sm text-slate-300 py-1">{msg}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tela do lobby
  if (inLobby && !roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-6">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">{getNomeSala()}</h1>
              <p className="text-xs text-slate-400">Poder: {minPower} - {maxPower}</p>
            </div>
            <button
              onClick={sairLobby}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Sair
            </button>
          </div>

          {/* Desafio recebido */}
          {pendingChallenge && (
            <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500 rounded-lg p-4 mb-4 animate-pulse">
              <p className="text-yellow-400 font-bold mb-3">
                ⚔️ {pendingChallenge.challenger_nome || 'Alguém'} te desafiou!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={aceitarDesafio}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded font-bold"
                >
                  ✅ Aceitar
                </button>
                <button
                  onClick={recusarDesafio}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 rounded font-bold"
                >
                  ❌ Recusar
                </button>
              </div>
            </div>
          )}

          {/* Lista de jogadores */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <h2 className="text-sm font-bold text-slate-400 mb-3">
              Jogadores Online ({players.length})
            </h2>

            {players.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">👀</div>
                <p>Nenhum jogador no lobby</p>
                <p className="text-xs mt-1">Aguardando oponentes...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-slate-800 rounded p-3"
                  >
                    <div className="flex items-center gap-3">
                      {player.avatar && (
                        <AvatarSVG avatar={player.avatar} tamanho={50} />
                      )}
                      <div>
                        <div className="font-bold text-cyan-400">{player.avatar?.nome || 'Avatar'}</div>
                        <div className="text-xs text-slate-400">
                          🎯 {player.nome || 'Caçador Misterioso'}
                        </div>
                        {player.poder && (
                          <div className="text-xs text-yellow-400 mt-1">⚔️ Poder: {player.poder}</div>
                        )}
                        {player.status === 'challenging' && (
                          <span className="text-xs text-orange-400">
                            (desafiando...)
                          </span>
                        )}
                      </div>
                    </div>
                    {player.status === 'waiting' && (
                      <button
                        onClick={() => desafiar(player.visitorId)}
                        disabled={challenging}
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm font-bold disabled:opacity-50"
                      >
                        ⚔️ Desafiar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log */}
          {log.length > 0 && (
            <div className="mt-4 bg-slate-900/50 rounded-lg p-3 border border-slate-700 max-h-32 overflow-y-auto">
              {log.map((msg, i) => (
                <div key={i} className="text-sm text-slate-300 py-1">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-center mb-4">⚔️ BATALHA!</h1>

        {/* Indicador de Turno */}
        <div className={`text-center py-3 rounded-lg mb-4 font-bold text-lg ${
          room?.status === 'finished'
            ? 'bg-purple-900/50 border border-purple-500'
            : isYourTurn
              ? 'bg-green-900/50 border border-green-500 animate-pulse'
              : 'bg-orange-900/50 border border-orange-500'
        }`}>
          {room?.status === 'finished'
            ? (room.winner === role ? '🏆 VITÓRIA!' : '☠️ DERROTA!')
            : isYourTurn
              ? '🟢 SEU TURNO!'
              : '🟠 TURNO DO OPONENTE...'}
        </div>

        {/* Cards dos Jogadores */}
        <div className="space-y-4 mb-6">
          {/* Seu Card */}
          <div className="bg-slate-900 rounded-lg p-4 border border-blue-500">
            <div className="flex items-center gap-4 mb-3">
              {meuAvatar && <AvatarSVG avatar={meuAvatar} tamanho={100} />}
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">VOCÊ</div>
                <div className="font-bold text-blue-400 text-lg">{meuAvatar?.nome || 'Avatar'}</div>
                <div className="text-xs text-slate-400">
                  🎯 {meuNome || 'Caçador Misterioso'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {meuAvatar?.elemento && (
                    <span className="text-sm">{getElementoEmoji(meuAvatar.elemento)} {meuAvatar.elemento}</span>
                  )}
                  {myExaustao > 0 && (
                    <span className="text-xs text-orange-400">😰 {myExaustao}%</span>
                  )}
                </div>
                <div className="flex gap-4 text-sm mt-2">
                  <span className="text-white font-mono">❤️ {myHp}/{myHpMax}</span>
                  <span className="text-yellow-400 font-mono">⚡ {myEnergy}</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 transition-all duration-500 ${
                  (myHp / myHpMax) > 0.5 ? 'bg-blue-500' :
                  (myHp / myHpMax) > 0.25 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${(myHp / myHpMax) * 100}%` }}
              />
            </div>
          </div>

          {/* Card do Oponente */}
          <div className="bg-slate-900 rounded-lg p-4 border border-red-500">
            <div className="flex items-center gap-4 mb-3">
              {opponentAvatar && <AvatarSVG avatar={opponentAvatar} tamanho={100} />}
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">OPONENTE</div>
                <div className="font-bold text-red-400 text-lg">{opponentAvatar?.nome || 'Avatar'}</div>
                <div className="text-xs text-slate-400">
                  🎯 {opponentNome || 'Caçador Misterioso'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {opponentAvatar?.elemento && (
                    <span className="text-sm">{getElementoEmoji(opponentAvatar.elemento)} {opponentAvatar.elemento}</span>
                  )}
                  {opponentExaustao > 0 && (
                    <span className="text-xs text-orange-400">😰 {opponentExaustao}%</span>
                  )}
                </div>
                <div className="flex gap-4 text-sm mt-2">
                  <span className="text-white font-mono">❤️ {opponentHp}/{opponentHpMax}</span>
                  <span className="text-yellow-400 font-mono">⚡ {opponentEnergy}</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 transition-all duration-500 ${
                  (opponentHp / opponentHpMax) > 0.5 ? 'bg-red-500' :
                  (opponentHp / opponentHpMax) > 0.25 ? 'bg-yellow-500' :
                  'bg-orange-600'
                }`}
                style={{ width: `${(opponentHp / opponentHpMax) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        {room?.status === 'active' && (
          <div className="space-y-3">
            {/* Ataque e Defesa */}
            <div className="flex gap-2">
              <button
                onClick={atacar}
                disabled={!isYourTurn || myEnergy < 10}
                className={`flex-1 py-3 rounded-lg font-bold text-base transition-all ${
                  isYourTurn && myEnergy >= 10
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                }`}
              >
                ⚔️ Atacar
                <div className="text-xs opacity-75">-10 ⚡</div>
              </button>
              <button
                onClick={defender}
                disabled={!isYourTurn}
                className={`flex-1 py-3 rounded-lg font-bold text-base transition-all ${
                  isYourTurn
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                    : 'bg-gray-700 cursor-not-allowed opacity-50'
                }`}
              >
                🛡️ Defender
                <div className="text-xs opacity-75">+20 ⚡</div>
              </button>
            </div>

            {/* Habilidades */}
            {meuAvatar?.habilidades && meuAvatar.habilidades.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <div className="text-xs font-bold text-slate-400 mb-2">✨ HABILIDADES</div>
                <div className="grid grid-cols-2 gap-2">
                  {meuAvatar.habilidades.slice(0, 5).map((hab, index) => (
                    <button
                      key={index}
                      onClick={() => usarHabilidade(index)}
                      disabled={!isYourTurn || myEnergy < (hab.custo_energia || 20)}
                      className={`py-2 px-3 rounded text-sm font-bold transition-all text-left ${
                        isYourTurn && myEnergy >= (hab.custo_energia || 20)
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                          : 'bg-gray-700 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="truncate">{hab.nome}</div>
                      <div className="text-xs opacity-75">-{hab.custo_energia || 20} ⚡</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botão Voltar */}
        {room?.status === 'finished' && (
          <button
            onClick={() => router.push('/arena/pvp')}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold mt-4"
          >
            Voltar ao Lobby
          </button>
        )}

        {/* Log */}
        <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-slate-700 max-h-40 overflow-y-auto">
          <h3 className="text-sm font-bold text-slate-400 mb-2">Log:</h3>
          {log.map((msg, i) => (
            <div key={i} className="text-sm text-slate-300 py-1 border-b border-slate-800">
              {msg}
            </div>
          ))}
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
