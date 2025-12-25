"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  calcularPoderTotal,
  calcularHPMaximoCompleto
} from "@/lib/gameLogic";
import AvatarSVG from "../../components/AvatarSVG";
import { previewSinergia } from "@/lib/combat/synergyApplicator";

export default function PvPPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalAlerta, setModalAlerta] = useState(null);

  // Estados para Sistema de Sinergias
  const [todosAvatares, setTodosAvatares] = useState([]);
  const [avatarSuporte, setAvatarSuporte] = useState(null);
  const [sinergiaPreview, setSinergiaPreview] = useState(null);

  // Estados de ranking
  const [rankingData, setRankingData] = useState(null);
  const [temporadaAtual, setTemporadaAtual] = useState(null);

  // Estados de matchmaking
  const [buscandoPartida, setBuscandoPartida] = useState(false);
  const [tempoEspera, setTempoEspera] = useState(0);
  const [partidaEncontrada, setPartidaEncontrada] = useState(null);
  const intervalRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatarAtivo(parsedUser.id);
    carregarRanking(parsedUser.id);
    carregarTemporada();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [router]);

  // Preview de Sinergia em tempo real
  useEffect(() => {
    if (avatarAtivo && avatarSuporte) {
      const preview = previewSinergia(avatarAtivo.elemento, avatarSuporte.elemento, avatarAtivo.raridade);
      setSinergiaPreview(preview);
    } else {
      setSinergiaPreview(null);
    }
  }, [avatarAtivo, avatarSuporte]);

  const carregarAvatarAtivo = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        const ativo = data.avatares.find(av => av.ativo && av.vivo);
        setAvatarAtivo(ativo || null);
        // Armazenar todos os avatares para seleção de suporte
        setTodosAvatares(data.avatares.filter(av => av.vivo) || []);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar ativo:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarRanking = async (userId) => {
    try {
      const response = await fetch(`/api/pvp/ranking?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRankingData(data);
      }
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    }
  };

  const carregarTemporada = async () => {
    try {
      const response = await fetch('/api/pvp/temporada');
      if (response.ok) {
        const data = await response.json();
        setTemporadaAtual(data.temporada);
      }
    } catch (error) {
      console.error("Erro ao carregar temporada:", error);
    }
  };

  const iniciarMatchmaking = async () => {
    if (!avatarAtivo) return;

    if (!avatarAtivo.vivo) {
      setModalAlerta({
        titulo: '💀 Avatar Morto',
        mensagem: 'Seu avatar está morto! Visite o Necromante para ressuscitá-lo.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 99) {
      setModalAlerta({
        titulo: '💀 Avatar em Colapso',
        mensagem: 'Seu avatar está completamente exausto e não pode lutar! Deixe-o descansar.'
      });
      return;
    }

    if (avatarAtivo.exaustao >= 60) {
      setModalAlerta({
        titulo: '😰 Avatar Muito Exausto',
        mensagem: 'Seu avatar está muito exausto! Deixe-o descansar antes de batalhar.'
      });
      return;
    }

    setBuscandoPartida(true);
    setTempoEspera(0);

    intervalRef.current = setInterval(() => {
      setTempoEspera(prev => prev + 1);
    }, 1000);

    try {
      const poderTotal = calcularPoderTotal(avatarAtivo);

      const response = await fetch('/api/pvp/queue/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatarAtivo.id,
          nivel: avatarAtivo.nivel || 1,
          poderTotal,
          fama: rankingData?.fama || 0
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao entrar na fila');
      }

      const data = await response.json();

      if (data.matched && data.matchId) {
        clearInterval(intervalRef.current);

        const oponenteNome = data.opponent?.nome || 'Oponente';
        setPartidaEncontrada({
          matchId: data.matchId,
          oponente: { nome: oponenteNome }
        });

        const dadosPartida = {
          tipo: 'pvp',
          pvpAoVivo: true,
          matchId: data.matchId,
          avatarJogador: {
            ...avatarAtivo,
            habilidades: avatarAtivo.habilidades || []
          },
          avatarOponente: data.opponent?.avatar || null,
          nomeOponente: oponenteNome,
          morteReal: true
        };

        sessionStorage.setItem('batalha_pvp_dados', JSON.stringify(dadosPartida));

        setTimeout(() => {
          router.push('/arena/batalha?modo=pvp');
        }, 3000);
        return;
      }

      pollingRef.current = setInterval(async () => {
        try {
          const checkResponse = await fetch(`/api/pvp/queue/check?userId=${user.id}`);
          const checkData = await checkResponse.json();

          if (checkData.matched && checkData.matchId) {
            clearInterval(intervalRef.current);
            clearInterval(pollingRef.current);

            const oponenteNome = checkData.opponent?.nome || 'Oponente encontrado';
            setPartidaEncontrada({
              matchId: checkData.matchId,
              oponente: { nome: oponenteNome }
            });

            const dadosPartida = {
              tipo: 'pvp',
              pvpAoVivo: true,
              matchId: checkData.matchId,
              avatarJogador: {
                ...avatarAtivo,
                habilidades: avatarAtivo.habilidades || []
              },
              avatarOponente: checkData.opponent?.avatar || null,
              nomeOponente: oponenteNome,
              morteReal: true
            };

            sessionStorage.setItem('batalha_pvp_dados', JSON.stringify(dadosPartida));

            setTimeout(() => {
              router.push('/arena/batalha?modo=pvp');
            }, 3000);
          }
        } catch (error) {
          console.error('Erro ao verificar match:', error);
        }
      }, 2000);

    } catch (error) {
      console.error('Erro no matchmaking:', error);
      cancelarMatchmaking();
      setModalAlerta({
        titulo: '❌ Erro',
        mensagem: 'Erro ao buscar partida. Tente novamente.'
      });
    }
  };

  const cancelarMatchmaking = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (pollingRef.current) clearInterval(pollingRef.current);

    setBuscandoPartida(false);
    setTempoEspera(0);

    try {
      await fetch('/api/pvp/queue/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
    } catch (error) {
      console.error('Erro ao sair da fila:', error);
    }
  };

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getTierInfo = (fama) => {
    if (fama >= 5000) return { nome: 'Lendário', cor: 'text-red-400', icone: '👑', bg: 'from-red-900/30' };
    if (fama >= 4000) return { nome: 'Diamante', cor: 'text-cyan-300', icone: '💎', bg: 'from-cyan-900/30' };
    if (fama >= 3000) return { nome: 'Platina', cor: 'text-purple-300', icone: '🔮', bg: 'from-purple-900/30' };
    if (fama >= 2000) return { nome: 'Ouro', cor: 'text-yellow-400', icone: '🥇', bg: 'from-yellow-900/30' };
    if (fama >= 1000) return { nome: 'Prata', cor: 'text-gray-300', icone: '🥈', bg: 'from-gray-700/30' };
    return { nome: 'Bronze', cor: 'text-orange-400', icone: '🥉', bg: 'from-orange-900/30' };
  };

  const getElementoColor = (elemento) => {
    const cores = {
      'Fogo': 'text-red-400',
      'Água': 'text-blue-400',
      'Terra': 'text-amber-600',
      'Vento': 'text-cyan-300',
      'Luz': 'text-yellow-300',
      'Sombra': 'text-purple-400',
      'Eletricidade': 'text-yellow-400'
    };
    return cores[elemento] || 'text-gray-400';
  };

  const getRaridadeColor = (raridade) => {
    const cores = {
      'Comum': 'text-gray-400',
      'Incomum': 'text-green-400',
      'Raro': 'text-blue-400',
      'Épico': 'text-purple-400',
      'Lendário': 'text-orange-400',
      'Mítico': 'text-red-400'
    };
    return cores[raridade] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse text-xl">
          Carregando Arena PvP...
        </div>
      </div>
    );
  }

  if (!avatarAtivo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push('/arena')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mb-4"
            >
              ← Voltar para Arena
            </button>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-2">
              ⚔️ ARENA PVP
            </h1>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-950/90 border border-red-900/50 rounded-xl p-12 text-center">
              <div className="text-8xl mb-6">⚔️</div>
              <h2 className="text-3xl font-bold text-red-400 mb-4">
                Nenhum Avatar Ativo
              </h2>
              <p className="text-slate-300 mb-8 text-lg">
                Você precisa ter um avatar ativo para entrar na Arena PvP!
              </p>
              <button
                onClick={() => router.push("/avatares")}
                className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded font-bold"
              >
                Ir para Avatares
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const poderTotal = calcularPoderTotal(avatarAtivo);
  const tierInfo = getTierInfo(rankingData?.fama || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <button
              onClick={() => router.push('/arena')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              ← Voltar para Arena
            </button>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => router.push('/arena/pvp/leaderboard')}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                🏆 Ranking
              </button>
              <button
                onClick={() => router.push('/historico-pvp')}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                📜 Histórico
              </button>
              <button
                onClick={() => router.push('/recompensas')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                🎁 Recompensas
              </button>
              <button
                onClick={() => router.push('/titulos')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
              >
                🏅 Títulos
              </button>
            </div>
          </div>

          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-2">
            ⚔️ ARENA PVP
          </h1>
          <p className="text-gray-400 text-lg">
            Batalhe contra outros caçadores em tempo real
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Coluna Esquerda - Avatar e Salas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seu Avatar Resumido */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-xl blur"></div>
              <div className="relative bg-slate-900/95 rounded-xl border-2 border-purple-500 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 px-3 py-2 border-b border-purple-500/50 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">SEU AVATAR</div>
                    <div className="font-bold text-white text-base truncate">{avatarAtivo.nome}</div>
                    <div className="text-[10px] text-slate-400 truncate">🎯 {user?.nome_operacao || 'Caçador'}</div>
                  </div>
                  <button
                    onClick={() => router.push('/avatares')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    Trocar
                  </button>
                </div>

                {/* Avatar */}
                <div className="p-3 flex justify-center bg-gradient-to-b from-purple-950/30 to-transparent">
                  <AvatarSVG avatar={avatarAtivo} tamanho={100} />
                </div>

                {/* Info */}
                <div className="px-3 pb-3 space-y-2">
                  {/* Elemento e Nível */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={getElementoColor(avatarAtivo.elemento)}>
                      {avatarAtivo.elemento === 'Fogo' && '🔥'}
                      {avatarAtivo.elemento === 'Água' && '💧'}
                      {avatarAtivo.elemento === 'Terra' && '🪨'}
                      {avatarAtivo.elemento === 'Vento' && '💨'}
                      {avatarAtivo.elemento === 'Eletricidade' && '⚡'}
                      {avatarAtivo.elemento === 'Luz' && '✨'}
                      {avatarAtivo.elemento === 'Sombra' && '🌑'}
                      {' '}{avatarAtivo.elemento}
                    </span>
                    <span className="text-cyan-400">Nv.{avatarAtivo.nivel}</span>
                  </div>

                  {/* HP Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-red-400 font-bold">❤️ HP</span>
                      <span className="font-mono">{calcularHPMaximoCompleto(avatarAtivo)}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 w-full" />
                    </div>
                  </div>

                  {/* Exaustão Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-orange-400 font-bold">😰 Exaustão</span>
                      <span className="font-mono">{avatarAtivo.exaustao || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          (avatarAtivo.exaustao || 0) < 40 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                          (avatarAtivo.exaustao || 0) < 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                          'bg-gradient-to-r from-red-600 to-red-400'
                        }`}
                        style={{ width: `${avatarAtivo.exaustao || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Poder Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <span className="text-cyan-400 font-bold text-sm">⚔️ Poder Total</span>
                    <span className="font-mono text-lg text-cyan-300 font-bold">{poderTotal}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seleção de Avatar Suporte (OBRIGATÓRIO) */}
            <div className="bg-slate-900 border-2 border-purple-500 rounded-lg p-6">
              <h2 className="text-xl font-bold text-purple-400 mb-2 text-center">
                ✨ AVATAR SUPORTE
              </h2>
              <p className="text-red-400 text-center mb-1 text-sm font-bold">
                ⚠️ OBRIGATÓRIO PARA ENTRAR EM QUALQUER SALA
              </p>
              <p className="text-slate-400 text-center mb-4 text-xs">
                Escolha um avatar suporte para criar sinergias em batalha
              </p>

              <div className="space-y-3">
                {avatarSuporte ? (
                  <div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-purple-500/30 mb-3">
                      <div className="flex items-center gap-3">
                        <AvatarSVG avatar={avatarSuporte} tamanho={80} />
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-white mb-1">{avatarSuporte.nome}</h4>
                          <div className="text-xs text-slate-400 mb-2">
                            {avatarSuporte.elemento} • Nv.{avatarSuporte.nivel}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px]">
                            <div className="bg-slate-900/50 rounded px-1.5 py-0.5">
                              <div className="text-slate-500">FOR</div>
                              <div className="font-bold text-red-400">{avatarSuporte.forca}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded px-1.5 py-0.5">
                              <div className="text-slate-500">AGI</div>
                              <div className="font-bold text-green-400">{avatarSuporte.agilidade}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded px-1.5 py-0.5">
                              <div className="text-slate-500">RES</div>
                              <div className="font-bold text-blue-400">{avatarSuporte.resistencia}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded px-1.5 py-0.5">
                              <div className="text-slate-500">FOC</div>
                              <div className="font-bold text-purple-400">{avatarSuporte.foco}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setAvatarSuporte(null)}
                      className="w-full px-3 py-1.5 bg-red-900/30 hover:bg-red-800/40 border border-red-500/30 text-red-400 font-semibold rounded text-xs transition-all"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 p-4 bg-purple-950/20 rounded-lg border border-purple-900/30 text-center">
                      <div className="text-3xl mb-1">⚔️</div>
                      <div className="text-[10px] text-purple-400">Selecione um avatar suporte</div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                      {todosAvatares
                        .filter(av => av.id !== avatarAtivo?.id)
                        .map((avatar) => (
                          <button
                            key={avatar.id}
                            onClick={() => setAvatarSuporte(avatar)}
                            className="p-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-purple-500/50 rounded transition-all flex flex-col items-center"
                          >
                            <AvatarSVG avatar={avatar} tamanho={50} />
                            <div className="text-[10px] font-bold text-white mt-1 truncate w-full text-center">{avatar.nome}</div>
                            <div className="text-[9px] text-slate-400">Nv.{avatar.nivel}</div>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Preview de Sinergia */}
                {sinergiaPreview && avatarSuporte && (
                  <div className={`border rounded-lg p-3 ${
                    sinergiaPreview.isSpecial
                      ? 'border-yellow-500 bg-yellow-900/20'
                      : 'border-purple-500/50 bg-purple-900/20'
                  }`}>
                    <div className="text-center mb-2">
                      <div className="text-sm font-bold text-purple-300">
                        {sinergiaPreview.isSpecial && '⭐ '}
                        {sinergiaPreview.nome}
                        {sinergiaPreview.isSpecial && ' ⭐'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {avatarAtivo?.elemento} × {avatarSuporte?.elemento}
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      {/* Vantagens */}
                      {sinergiaPreview.vantagens && sinergiaPreview.vantagens.length > 0 && (
                        <div className="bg-green-900/30 border border-green-600/50 rounded p-2">
                          <div className="font-bold text-green-400 mb-1">✅ Vantagens:</div>
                          {sinergiaPreview.vantagens.map((vantagem, i) => (
                            <div key={i} className="text-green-300">• {vantagem.texto}</div>
                          ))}
                        </div>
                      )}

                      {/* Desvantagens */}
                      {sinergiaPreview.desvantagens && sinergiaPreview.desvantagens.length > 0 ? (
                        <div className="bg-red-900/30 border border-red-600/50 rounded p-2">
                          <div className="font-bold text-red-400 mb-1">⚠️ Desvantagens:</div>
                          {sinergiaPreview.desvantagens.map((desvantagem, i) => (
                            <div key={i} className="text-red-300">• {desvantagem.texto}</div>
                          ))}
                        </div>
                      ) : sinergiaPreview.vantagens && sinergiaPreview.vantagens.length > 0 && (
                        <div className="bg-purple-900/30 border border-purple-600/50 rounded p-2 text-center">
                          <div className="font-bold text-purple-300">⭐ Sinergia Perfeita</div>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 mt-2 italic text-center">
                      {sinergiaPreview.descricao}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Salas por Poder */}
            <div className="bg-slate-900 border border-orange-500 rounded-lg p-6">
              <h2 className="text-xl font-bold text-orange-400 mb-4 text-center">
                🏟️ SALAS POR PODER
              </h2>
              <p className="text-slate-400 text-center mb-6 text-sm">
                Entre em uma sala compatível com o poder do seu avatar
              </p>

              <div className="space-y-4">
                {/* Sala Iniciante */}
                <div className={`bg-slate-800 rounded-lg p-4 border-2 transition-all ${
                  poderTotal >= 0 && poderTotal <= 39
                    ? 'border-green-500 shadow-lg shadow-green-500/20'
                    : 'border-slate-700 opacity-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-green-400 text-lg">🌱 Iniciante</h3>
                      <p className="text-sm text-slate-400">Poder: 0 - 39</p>
                    </div>
                    <button
                      onClick={() => {
                        if (!avatarSuporte) {
                          setModalAlerta({
                            titulo: '⚠️ Avatar Suporte Obrigatório',
                            mensagem: 'Você precisa selecionar um avatar suporte para entrar na Arena PvP!'
                          });
                          return;
                        }
                        router.push(`/arena/pvp/duel?minPower=0&maxPower=39&suporteId=${avatarSuporte.id}`);
                      }}
                      disabled={poderTotal < 0 || poderTotal > 39}
                      className={`px-6 py-2 rounded-lg font-bold ${
                        poderTotal >= 0 && poderTotal <= 39
                          ? 'bg-green-600 hover:bg-green-500 text-white'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Entrar
                    </button>
                  </div>
                </div>

                {/* Sala Intermediário */}
                <div className={`bg-slate-800 rounded-lg p-4 border-2 transition-all ${
                  poderTotal >= 40 && poderTotal <= 60
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-slate-700 opacity-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-blue-400 text-lg">⚡ Intermediário</h3>
                      <p className="text-sm text-slate-400">Poder: 40 - 60</p>
                    </div>
                    <button
                      onClick={() => {
                        if (!avatarSuporte) {
                          setModalAlerta({
                            titulo: '⚠️ Avatar Suporte Obrigatório',
                            mensagem: 'Você precisa selecionar um avatar suporte para entrar na Arena PvP!'
                          });
                          return;
                        }
                        router.push(`/arena/pvp/duel?minPower=40&maxPower=60&suporteId=${avatarSuporte.id}`);
                      }}
                      disabled={poderTotal < 40 || poderTotal > 60}
                      className={`px-6 py-2 rounded-lg font-bold ${
                        poderTotal >= 40 && poderTotal <= 60
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Entrar
                    </button>
                  </div>
                </div>

                {/* Sala Avançado */}
                <div className={`bg-slate-800 rounded-lg p-4 border-2 transition-all ${
                  poderTotal >= 61 && poderTotal <= 90
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'border-slate-700 opacity-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-purple-400 text-lg">🔥 Avançado</h3>
                      <p className="text-sm text-slate-400">Poder: 61 - 90</p>
                    </div>
                    <button
                      onClick={() => {
                        if (!avatarSuporte) {
                          setModalAlerta({
                            titulo: '⚠️ Avatar Suporte Obrigatório',
                            mensagem: 'Você precisa selecionar um avatar suporte para entrar na Arena PvP!'
                          });
                          return;
                        }
                        router.push(`/arena/pvp/duel?minPower=61&maxPower=90&suporteId=${avatarSuporte.id}`);
                      }}
                      disabled={poderTotal < 61 || poderTotal > 90}
                      className={`px-6 py-2 rounded-lg font-bold ${
                        poderTotal >= 61 && poderTotal <= 90
                          ? 'bg-purple-600 hover:bg-purple-500 text-white'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Entrar
                    </button>
                  </div>
                </div>

                {/* Sala Elite (poder alto) */}
                <div className={`bg-slate-800 rounded-lg p-4 border-2 transition-all ${
                  poderTotal > 90
                    ? 'border-red-500 shadow-lg shadow-red-500/20'
                    : 'border-slate-700 opacity-50'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-red-400 text-lg">👑 Elite</h3>
                      <p className="text-sm text-slate-400">Poder: 91+</p>
                    </div>
                    <button
                      onClick={() => {
                        if (!avatarSuporte) {
                          setModalAlerta({
                            titulo: '⚠️ Avatar Suporte Obrigatório',
                            mensagem: 'Você precisa selecionar um avatar suporte para entrar na Arena PvP!'
                          });
                          return;
                        }
                        router.push(`/arena/pvp/duel?minPower=91&maxPower=999&suporteId=${avatarSuporte.id}`);
                      }}
                      disabled={poderTotal <= 90}
                      className={`px-6 py-2 rounded-lg font-bold ${
                        poderTotal > 90
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              </div>

              {avatarAtivo.exaustao >= 99 && (
                <p className="text-red-600 text-sm mt-4 text-center font-bold">
                  💀 Avatar em colapso - NÃO PODE LUTAR!
                </p>
              )}
              {avatarAtivo.exaustao >= 60 && avatarAtivo.exaustao < 99 && (
                <p className="text-red-400 text-sm mt-4 text-center">
                  ⚠️ Avatar muito exausto para batalhar
                </p>
              )}
            </div>
          </div>

          {/* Coluna Direita - Ranking e Info */}
          <div className="space-y-6">
            {/* Seu Ranking */}
            <div className={`bg-gradient-to-br ${tierInfo.bg} to-slate-900 border border-slate-700 rounded-lg p-6`}>
              <h3 className="text-lg font-bold text-white mb-4">Seu Ranking</h3>

              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{tierInfo.icone}</div>
                <div className={`text-2xl font-bold ${tierInfo.cor}`}>{tierInfo.nome}</div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Fama</span>
                  <span className="text-yellow-400 font-bold">{rankingData?.fama || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vitórias</span>
                  <span className="text-green-400 font-bold">{rankingData?.vitorias || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Derrotas</span>
                  <span className="text-red-400 font-bold">{rankingData?.derrotas || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sequência</span>
                  <span className="text-orange-400 font-bold">{rankingData?.streak || 0} 🔥</span>
                </div>
              </div>
            </div>

            {/* Temporada */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-purple-400 mb-4">📅 Temporada Atual</h3>

              {temporadaAtual ? (
                <div className="space-y-2 text-sm">
                  <div className="text-white font-bold">{temporadaAtual.nome || `Temporada ${temporadaAtual.numero}`}</div>
                  <div className="text-gray-400">
                    Termina em: {temporadaAtual.dias_restantes || 30} dias
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Carregando...</div>
              )}
            </div>

            {/* Info sobre Temporadas */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Sobre as Temporadas</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• As temporadas duram 30 dias</li>
                <li>• Ao final, os rankings são resetados e as recompensas distribuídas</li>
                <li>• Títulos conquistados são permanentes</li>
                <li>• A fama determina sua posição no ranking</li>
              </ul>
            </div>

            {/* Como funciona */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Sistema de Combate</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• Pareamento por poder similar (±30%)</li>
                <li>• Batalhas em tempo real</li>
                <li>• Sistema 1d20 + Foco para acertos</li>
                <li>• Vantagens elementais aplicadas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Alerta */}
      {modalAlerta && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-3">{modalAlerta.titulo}</h3>
            <p className="text-gray-300 mb-6">{modalAlerta.mensagem}</p>
            <button
              onClick={() => setModalAlerta(null)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }
      `}</style>
    </div>
  );
}
