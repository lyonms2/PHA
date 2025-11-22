"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function DuelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get('room');

  const [visitorId, setVisitorId] = useState(null);
  const [roomId, setRoomId] = useState(roomIdParam);
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [room, setRoom] = useState(null);
  const [role, setRole] = useState(null);
  const [isYourTurn, setIsYourTurn] = useState(false);
  const [myHp, setMyHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [opponentNome, setOpponentNome] = useState('');
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pollingRef = useRef(null);
  const lastTurnRef = useRef(null);

  // Carregar usuário
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    setVisitorId(parsed.visitorId || parsed.id);
  }, [router]);

  // Polling para estado da sala
  useEffect(() => {
    if (!roomId || !visitorId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/pvp/room/state?roomId=${roomId}&visitorId=${visitorId}`);
        const data = await res.json();

        if (data.success) {
          setRoom(data.room);
          setRole(data.role);
          setIsYourTurn(data.isYourTurn);
          setMyHp(data.myHp);
          setOpponentHp(data.opponentHp);
          setOpponentNome(data.opponentNome || 'Oponente');

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

    poll(); // Primeira chamada
    pollingRef.current = setInterval(poll, 1000); // Poll a cada 1 segundo

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [roomId, visitorId]);

  const addLog = (msg) => {
    setLog(prev => [msg, ...prev]);
  };

  // Criar sala
  const criarSala = async () => {
    if (!visitorId) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/pvp/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: visitorId, visitorId })
      });
      const data = await res.json();

      if (data.success) {
        setRoomId(data.roomId);
        setRoomCode(data.roomCode);
        addLog(`Sala criada! Código: ${data.roomCode}`);
      } else {
        setError(data.error || 'Erro ao criar sala');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  // Entrar na sala
  const entrarSala = async () => {
    if (!visitorId || !inputCode) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/pvp/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId, roomCode: inputCode })
      });
      const data = await res.json();

      if (data.success) {
        setRoomId(data.roomId);
        addLog(`Entrou na sala de ${data.hostNome}!`);
      } else {
        setError(data.error || 'Sala não encontrada');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  // Marcar como pronto
  const marcarPronto = async () => {
    if (!roomId || !visitorId) return;

    try {
      const res = await fetch('/api/pvp/room/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, visitorId, action: 'ready' })
      });
      const data = await res.json();

      if (data.success) {
        addLog('✅ Você está pronto!');
      }
    } catch (err) {
      console.error('Erro ao marcar pronto:', err);
    }
  };

  // Atacar
  const atacar = async () => {
    if (!roomId || !visitorId || !isYourTurn) return;

    try {
      const res = await fetch('/api/pvp/room/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, visitorId, action: 'attack' })
      });
      const data = await res.json();

      if (data.success) {
        addLog(`⚔️ Você atacou! Dano: ${data.dano}`);
        setOpponentHp(data.newOpponentHp);

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

  // Renderizar lobby (sem sala)
  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => router.push('/arena/pvp')}
            className="text-cyan-400 hover:text-cyan-300 mb-6"
          >
            ← Voltar
          </button>

          <h1 className="text-3xl font-bold text-center mb-8">⚔️ DUELO PvP</h1>

          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded p-3 mb-4 text-red-300">
              {error}
            </div>
          )}

          {/* Criar Sala */}
          <div className="bg-slate-900 border border-cyan-500 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">Criar Sala</h2>
            <button
              onClick={criarSala}
              disabled={loading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded font-bold disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'CRIAR SALA'}
            </button>
          </div>

          {/* Entrar em Sala */}
          <div className="bg-slate-900 border border-purple-500 rounded-lg p-6">
            <h2 className="text-xl font-bold text-purple-400 mb-4">Entrar em Sala</h2>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Código da sala"
              className="w-full p-3 bg-slate-800 border border-slate-600 rounded mb-3 text-center text-xl tracking-widest"
              maxLength={6}
            />
            <button
              onClick={entrarSala}
              disabled={loading || inputCode.length < 6}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded font-bold disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'ENTRAR'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar sala de espera
  if (room && room.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-8">⏳ AGUARDANDO</h1>

          <div className="bg-slate-900 border border-yellow-500 rounded-lg p-6 mb-4">
            <p className="text-slate-300 mb-2">Código da Sala:</p>
            <p className="text-4xl font-mono font-bold text-yellow-400 tracking-widest">
              {room.code || roomCode}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Compartilhe este código com seu oponente
            </p>
          </div>

          <div className="animate-pulse text-slate-400">
            Aguardando oponente entrar...
          </div>
        </div>
      </div>
    );
  }

  // Renderizar sala pronta (ambos entraram, aguardando ready)
  if (room && room.status === 'ready') {
    const myReady = role === 'host' ? room.hostReady : room.guestReady;
    const opReady = role === 'host' ? room.guestReady : room.hostReady;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 text-gray-100 p-6">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-3xl font-bold mb-8">⚔️ PREPARAR!</h1>

          <div className="bg-slate-900 border border-green-500 rounded-lg p-6 mb-4">
            <p className="text-xl mb-4">
              VS <span className="text-orange-400 font-bold">{opponentNome}</span>
            </p>

            <div className="flex justify-center gap-8 mb-6">
              <div className={`text-center ${myReady ? 'text-green-400' : 'text-gray-500'}`}>
                <div className="text-2xl">{myReady ? '✅' : '⏳'}</div>
                <div className="text-sm">Você</div>
              </div>
              <div className={`text-center ${opReady ? 'text-green-400' : 'text-gray-500'}`}>
                <div className="text-2xl">{opReady ? '✅' : '⏳'}</div>
                <div className="text-sm">Oponente</div>
              </div>
            </div>

            {!myReady ? (
              <button
                onClick={marcarPronto}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-xl animate-pulse"
              >
                ✅ PRONTO!
              </button>
            ) : (
              <p className="text-yellow-400">Aguardando oponente...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar batalha ativa
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

        {/* Barras de HP */}
        <div className="space-y-4 mb-6">
          {/* Seu HP */}
          <div className="bg-slate-900 rounded-lg p-4 border border-blue-500">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-blue-400">VOCÊ</span>
              <span className="text-white font-mono">{myHp}/100</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden">
              <div
                className="bg-blue-500 h-6 transition-all duration-500"
                style={{ width: `${myHp}%` }}
              />
            </div>
          </div>

          {/* HP do Oponente */}
          <div className="bg-slate-900 rounded-lg p-4 border border-red-500">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-red-400">{opponentNome}</span>
              <span className="text-white font-mono">{opponentHp}/100</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-6 overflow-hidden">
              <div
                className="bg-red-500 h-6 transition-all duration-500"
                style={{ width: `${opponentHp}%` }}
              />
            </div>
          </div>
        </div>

        {/* Botão de Ataque */}
        {room?.status === 'active' && (
          <button
            onClick={atacar}
            disabled={!isYourTurn}
            className={`w-full py-6 rounded-lg font-bold text-2xl transition-all ${
              isYourTurn
                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 transform hover:scale-105'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            ⚔️ ATACAR!
          </button>
        )}

        {/* Botão Voltar (fim da batalha) */}
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
