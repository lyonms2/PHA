"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  calcularPoderTotal,
  calcularHPMaximoCompleto,
  aplicarPenalidadesExaustao,
  getNivelExaustao
} from "@/lib/gameLogic";
import { previewSinergia } from "@/lib/combat/synergyApplicator";
import AvatarSVG from "../../components/AvatarSVG";

export default function TreinamentoAIPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [avatarSuporte, setAvatarSuporte] = useState(null);
  const [todosAvatares, setTodosAvatares] = useState([]);
  const [sinergiaPreview, setSinergiaPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalAlerta, setModalAlerta] = useState(null);
  const [iniciandoBatalha, setIniciandoBatalha] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatarAtivo(parsedUser.id);
  }, [router]);

  const carregarAvatarAtivo = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        const ativo = data.avatares.find(av => av.ativo && av.vivo);
        setAvatarAtivo(ativo || null);

        // Armazenar todos avatares vivos (exceto o ativo) para seleção de suporte
        const avataresSuporte = data.avatares.filter(av =>
          av.vivo && av.id !== ativo?.id && (av.exaustao || 0) < 100
        );
        setTodosAvatares(avataresSuporte);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar ativo:", error);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar preview de sinergia quando avatar suporte mudar
  useEffect(() => {
    if (avatarSuporte) {
      const preview = previewSinergia(avatarSuporte.elemento, avatarSuporte.raridade);
      setSinergiaPreview(preview);
    } else {
      setSinergiaPreview(null);
    }
  }, [avatarSuporte]);

  const iniciarTreinoIA = async (minPower, maxPower, dificuldade) => {
    if (!avatarAtivo) {
      setModalAlerta({
        titulo: '⚠️ Sem Avatar Ativo',
        mensagem: 'Você precisa ter um avatar ativo para treinar!'
      });
      return;
    }

    if (!avatarSuporte) {
      setModalAlerta({
        titulo: '⚠️ Avatar Suporte Obrigatório',
        mensagem: 'Você precisa selecionar um avatar suporte para criar uma sinergia!'
      });
      return;
    }

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

    if (avatarAtivo.exaustao >= 80) {
      setModalAlerta({
        titulo: '⚠️ Avatar Muito Exausto',
        mensagem: 'Seu avatar está com exaustão crítica! As penalidades serão severas!'
      });
    }

    setIniciandoBatalha(true);

    try {
      const poderTotal = calcularPoderTotal(avatarAtivo);
      const statsComPenalidades = aplicarPenalidadesExaustao({
        forca: avatarAtivo.forca,
        agilidade: avatarAtivo.agilidade,
        resistencia: avatarAtivo.resistencia,
        foco: avatarAtivo.foco
      }, avatarAtivo.exaustao || 0);

      const response = await fetch('/api/arena/treino-ia/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatarAtivo.id,
          suporteId: avatarSuporte?.id || null, // Avatar suporte (opcional)
          minPower,
          maxPower,
          dificuldade
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar treino');
      }

      const data = await response.json();

      // Preparar dados da batalha
      const dadosPartida = {
        playerAvatar: {
          ...avatarAtivo,
          ...statsComPenalidades,
          habilidades: avatarAtivo.habilidades || []
        },
        oponente: data.oponente,
        personalidadeIA: data.personalidadeIA,
        dificuldade: data.dificuldade,
        sinergia: data.sinergia || null, // Sinergia do jogador
        sinergiaIA: data.sinergiaIA || null // Sinergia da IA
      };

      sessionStorage.setItem('treino_ia_dados', JSON.stringify(dadosPartida));

      // Redirecionar para batalha
      setTimeout(() => {
        router.push('/arena/treinamento/batalha');
      }, 500);

    } catch (error) {
      console.error('Erro ao iniciar treino:', error);
      setModalAlerta({
        titulo: '❌ Erro',
        mensagem: 'Erro ao iniciar treino. Tente novamente.'
      });
    } finally {
      setIniciandoBatalha(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse text-xl">
          Carregando Arena de Treino...
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

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-2">
              🤖 TREINO COM IA
            </h1>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-950/90 border border-purple-900/50 rounded-xl p-12 text-center">
              <div className="text-8xl mb-6">🤖</div>
              <h2 className="text-3xl font-bold text-purple-400 mb-4">
                Nenhum Avatar Ativo
              </h2>
              <p className="text-slate-300 mb-8 text-lg">
                Você precisa ter um avatar ativo para treinar com IA!
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 p-6">
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
          </div>

          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 mb-2">
            🤖 TREINO COM IA
          </h1>
          <p className="text-gray-400 text-lg">
            Treine contra oponentes controlados por IA inteligente - sem risco de morte real!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Coluna Esquerda - Avatar e Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Seu Avatar Resumido */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-xl blur"></div>
              <div className="relative bg-slate-900/95 rounded-xl border-2 border-purple-500 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 px-3 py-2 border-b border-purple-500/50 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">SEU AVATAR</div>
                    <div className="font-bold text-white text-base truncate">{avatarAtivo.nome}</div>
                    <div className="text-[10px] text-slate-400 truncate">🎯 {user?.nome_operacao || 'Caçador Misterioso'}</div>
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

            {/* Seleção de Avatar Suporte */}
            <div className="bg-slate-900/50 border border-cyan-700 rounded-lg p-4">
              <h3 className="text-sm font-bold text-cyan-400 mb-3">✨ Avatar Suporte <span className="text-red-400">(Obrigatório)</span></h3>

              {todosAvatares.length === 0 ? (
                <div className="text-center py-2">
                  <p className="text-red-500 text-xs font-bold mb-1">⚠️ Sem avatares disponíveis</p>
                  <p className="text-slate-500 text-[10px]">Você precisa de pelo menos 2 avatares vivos para treinar</p>
                </div>
              ) : avatarSuporte ? (
                <div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-cyan-500/30 mb-3">
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
                  <div className="mb-3 p-4 bg-cyan-950/20 rounded-lg border border-cyan-900/30 text-center">
                    <div className="text-3xl mb-1">✨</div>
                    <div className="text-[10px] text-cyan-400">Selecione um avatar suporte</div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                    {todosAvatares.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setAvatarSuporte(avatar)}
                        className="p-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-cyan-500/50 rounded transition-all flex flex-col items-center"
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
              {sinergiaPreview && (
                <div className="mt-3 bg-gradient-to-br from-purple-950/50 to-cyan-950/50 border border-cyan-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-cyan-400">
                      ✨ SINERGIAS DO SUPORTE
                    </span>
                    {sinergiaPreview.multiplicador > 1.0 && (
                      <span className="text-[9px] bg-yellow-600/30 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/50 font-bold">
                        {sinergiaPreview.raridadeSuporte} ×{sinergiaPreview.multiplicador.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-purple-400 font-bold mb-1">
                    Tipo: {sinergiaPreview.tipoSuporte}
                  </div>

                  <p className="text-[10px] text-slate-300 mb-3 leading-relaxed italic">
                    {sinergiaPreview.descricaoGeral}
                  </p>

                  {/* Matchups Possíveis */}
                  <div className="text-[9px] text-cyan-400 font-bold mb-1.5">⚡ CONTRA INIMIGOS:</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {sinergiaPreview.matchups.map((matchup, idx) => {
                      const modEntries = Object.entries(matchup.modificadores);
                      const temModificadores = modEntries.length > 0;

                      return (
                        <div key={idx} className={`${matchup.tipo === 'default' ? 'bg-slate-900/50 border-slate-600/30' : 'bg-cyan-900/20 border-cyan-600/30'} border rounded px-2 py-1.5`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-bold text-white">VS {matchup.elemento}</span>
                            <span className="text-[9px] text-cyan-400">{matchup.nome}</span>
                          </div>
                          {temModificadores && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {modEntries.map(([tipo, valor], midx) => {
                                const percentual = Math.floor(valor * 100);
                                const sinal = percentual > 0 ? '+' : '';
                                const cor = percentual > 0 ? 'text-green-400 bg-green-900/30' : 'text-red-400 bg-red-900/30';
                                const nomes = {
                                  dano_habilidades: 'Dano Hab',
                                  resistencia: 'Resistência',
                                  evasao: 'Evasão',
                                  critico: 'Crítico'
                                };
                                return (
                                  <span key={midx} className={`text-[9px] ${cor} px-1.5 py-0.5 rounded`}>
                                    {sinal}{percentual}% {nomes[tipo] || tipo}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Info sobre Treino IA */}
            <div className="bg-slate-900/50 border border-purple-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-purple-400 mb-3">🤖 Sobre o Treino IA</h3>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>• IA com personalidades únicas</li>
                <li>• Oponentes gerados com poder similar</li>
                <li>• Sem risco de morte permanente</li>
                <li>• Ganhe XP e fortaleça vínculo</li>
                <li>• Dificuldade adaptativa por sala</li>
                <li className="text-cyan-400 font-bold">• ✨ Sistema de sinergias obrigatório!</li>
                <li className="text-slate-500 text-xs pl-4">Você e a IA terão avatares suporte</li>
              </ul>
            </div>
          </div>

          {/* Coluna Direita - Salas por Poder */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-purple-500 rounded-lg p-6">
              <h2 className="text-xl font-bold text-purple-400 mb-4 text-center">
                🏟️ ESCOLHA A DIFICULDADE
              </h2>
              <p className="text-slate-400 text-center mb-6 text-sm">
                O oponente IA será gerado com base no poder do seu avatar
              </p>

              <div className="space-y-4">
                {/* Botão Fácil */}
                <button
                  onClick={() => iniciarTreinoIA(0, 999, 'facil')}
                  disabled={iniciandoBatalha}
                  className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white rounded-lg p-6 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-green-500 shadow-lg shadow-green-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-2xl font-bold mb-1">🌱 FÁCIL</h3>
                      <p className="text-sm text-green-100">IA com 70% dos seus stats</p>
                      <p className="text-xs text-green-200 mt-1">Ótimo para praticar e aprender</p>
                    </div>
                    <div className="text-5xl opacity-50">🎯</div>
                  </div>
                </button>

                {/* Botão Normal */}
                <button
                  onClick={() => iniciarTreinoIA(0, 999, 'normal')}
                  disabled={iniciandoBatalha}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white rounded-lg p-6 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-yellow-400 shadow-lg shadow-yellow-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-2xl font-bold mb-1">⚡ NORMAL</h3>
                      <p className="text-sm text-yellow-100">IA com 100% dos seus stats</p>
                      <p className="text-xs text-yellow-200 mt-1">Desafio equilibrado e competitivo</p>
                    </div>
                    <div className="text-5xl opacity-50">⚔️</div>
                  </div>
                </button>

                {/* Botão Difícil */}
                <button
                  onClick={() => iniciarTreinoIA(0, 999, 'dificil')}
                  disabled={iniciandoBatalha}
                  className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-lg p-6 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border-2 border-red-500 shadow-lg shadow-red-500/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <h3 className="text-2xl font-bold mb-1">🔥 DIFÍCIL</h3>
                      <p className="text-sm text-red-100">IA com 130% dos seus stats</p>
                      <p className="text-xs text-red-200 mt-1">Teste seus limites ao máximo</p>
                    </div>
                    <div className="text-5xl opacity-50">💀</div>
                  </div>
                </button>
              </div>

              {avatarAtivo.exaustao >= 99 && (
                <div className="mt-6 bg-red-900/30 border border-red-500 rounded-lg p-4 text-center">
                  <p className="text-red-400 font-bold">
                    💀 Avatar em colapso - NÃO PODE TREINAR!
                  </p>
                  <p className="text-red-300 text-sm mt-1">
                    Seu avatar precisa descansar antes de treinar
                  </p>
                </div>
              )}
              {avatarAtivo.exaustao >= 80 && avatarAtivo.exaustao < 99 && (
                <div className="mt-6 bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 text-center">
                  <p className="text-yellow-400 font-bold">
                    ⚠️ Avatar com exaustão crítica!
                  </p>
                  <p className="text-yellow-300 text-sm mt-1">
                    Penalidades severas serão aplicadas em combate
                  </p>
                </div>
              )}

              {iniciandoBatalha && (
                <div className="mt-6 bg-cyan-900/30 border border-cyan-500 rounded-lg p-4 text-center">
                  <p className="text-cyan-400 font-bold animate-pulse">
                    ⏳ Gerando oponente IA...
                  </p>
                  <p className="text-cyan-300 text-sm mt-1">
                    Preparando batalha de treino
                  </p>
                </div>
              )}
            </div>

            {/* Info sobre Sistema de Treino */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-cyan-400 mb-3">💡 Como Funciona</h3>
              <div className="space-y-3 text-sm text-gray-300">
                <p>
                  • O oponente IA é gerado <span className="text-cyan-400 font-bold">dinamicamente</span> baseado no poder do seu avatar
                </p>
                <p>
                  • Escolha a dificuldade para ajustar o <span className="text-purple-400 font-bold">multiplicador de stats</span> do oponente
                </p>
                <p>
                  • Sinergias entre avatares são <span className="text-yellow-400 font-bold">aplicadas automaticamente</span>
                </p>
                <p>
                  • Exaustão afeta seu desempenho - descanse entre batalhas!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Alerta */}
      {modalAlerta && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-purple-400 mb-3">{modalAlerta.titulo}</h3>
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
          background: rgba(6, 182, 212, 0.5);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  );
}
