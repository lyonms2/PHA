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
        if (data.critico) {
          addLog(`💥 CRÍTICO! Dano: ${data.dano} | -10 ⚡`);
        } else {
          addLog(`⚔️ Você atacou! Dano: ${data.dano} | -10 ⚡`);
        }
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

  // Nome da sala baseado no poder
  const getNomeSala = () => {
    if (maxPower <= 39) return '🌱 Sala Iniciante';
    if (maxPower <= 60) return '⚡ Sala Intermediário';
    if (maxPower <= 90) return '🔥 Sala Avançado';
    return '👑 Sala Elite';
  };

  // Tela inicial - entrar no lobby
  if (!inLobby && !roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-6">
        <div className="max-w-md mx-auto text-center">
          <button
            onClick={() => router.push('/arena/pvp')}
            className="text-cyan-400 hover:text-cyan-300 mb-6"
          >
            ← Voltar
          </button>

          <h1 className="text-3xl font-bold mb-2">{getNomeSala()}</h1>
          <p className="text-slate-400 mb-6">Poder: {minPower} - {maxPower}</p>

          {meuAvatar && (
            <div className="bg-slate-900 border border-purple-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <AvatarSVG avatar={meuAvatar} tamanho={60} />
                <div className="text-left">
                  <div className="font-bold text-white">{meuAvatar.nome}</div>
                  <div className="text-sm text-cyan-400">
                    Poder: {calcularPoderTotal(meuAvatar)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-orange-500 rounded-lg p-8">
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
                        <AvatarSVG avatar={player.avatar} tamanho={40} />
                      )}
                      <div>
                        <span className="font-bold text-white">{player.nome}</span>
                        {player.poder && (
                          <div className="text-xs text-cyan-400">Poder: {player.poder}</div>
                        )}
                        {player.status === 'challenging' && (
                          <span className="text-xs text-yellow-400">
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
            <div className="flex items-center gap-3 mb-3">
              {meuAvatar && <AvatarSVG avatar={meuAvatar} tamanho={50} />}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-400">VOCÊ</span>
                  {myExaustao > 0 && (
                    <span className="text-xs text-orange-400">😰 {myExaustao}%</span>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-white font-mono">❤️ {myHp}/{myHpMax}</span>
                  <span className="text-yellow-400 font-mono">⚡ {myEnergy}</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-500 h-4 transition-all duration-500"
                style={{ width: `${(myHp / myHpMax) * 100}%` }}
              />
            </div>
          </div>

          {/* Card do Oponente */}
          <div className="bg-slate-900 rounded-lg p-4 border border-red-500">
            <div className="flex items-center gap-3 mb-3">
              {opponentAvatar && <AvatarSVG avatar={opponentAvatar} tamanho={50} />}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-red-400">{opponentNome}</span>
                  {opponentExaustao > 0 && (
                    <span className="text-xs text-orange-400">😰 {opponentExaustao}%</span>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-white font-mono">❤️ {opponentHp}/{opponentHpMax}</span>
                  <span className="text-yellow-400 font-mono">⚡ {opponentEnergy}</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
              <div
                className="bg-red-500 h-4 transition-all duration-500"
                style={{ width: `${(opponentHp / opponentHpMax) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Botão de Ataque */}
        {room?.status === 'active' && (
          <button
            onClick={atacar}
            disabled={!isYourTurn || myEnergy < 10}
            className={`w-full py-6 rounded-lg font-bold text-2xl transition-all ${
              isYourTurn && myEnergy >= 10
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 transform hover:scale-105'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            ⚔️ ATACAR! (10 ⚡)
          </button>
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
