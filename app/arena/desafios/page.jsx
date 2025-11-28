"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  calcularPoderTotal,
  calcularHPMaximoCompleto,
} from "@/lib/gameLogic";
import AvatarSVG from "../../components/AvatarSVG";

export default function DesafiosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarAtivo, setAvatarAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalAlerta, setModalAlerta] = useState(null);
  const [iniciandoBatalha, setIniciandoBatalha] = useState(false);
  const [desafiosConcluidos, setDesafiosConcluidos] = useState({});

  // Definição dos bosses por categoria
  const bosses = {
    titasElementais: [
      {
        id: 'ifrit_titan',
        nome: 'Ifrit, Titã das Chamas',
        elemento: 'Fogo',
        emoji: '🔥',
        descricao: 'Senhor absoluto das chamas eternas',
        nivel: 10,
        dificuldade: 'boss',
        nivelMinimo: 5,
        poderMinimo: 40,
        recompensas: {
          xp: 500,
          vinculo: 20,
          titulo: 'Domador de Chamas',
          fragmentos: 3
        },
        mecanicas: ['rage_50', 'escudo_fogo', 'invocar_adds'],
        historia: 'Nascido do coração de um vulcão primordial, Ifrit comanda legiões de elementais de fogo.',
        cor: 'from-red-600 to-orange-600',
        corBorda: 'border-red-500',
        corBg: 'bg-red-900/20'
      },
      {
        id: 'leviathan_titan',
        nome: 'Leviatã, Senhor dos Mares',
        elemento: 'Água',
        emoji: '🌊',
        descricao: 'Guardião das profundezas abissais',
        nivel: 10,
        dificuldade: 'boss',
        nivelMinimo: 5,
        poderMinimo: 40,
        recompensas: {
          xp: 500,
          vinculo: 20,
          titulo: 'Senhor das Marés',
          fragmentos: 3
        },
        mecanicas: ['tsunami', 'pressao_abissal', 'regeneracao_aquatica'],
        historia: 'Das profundezas mais escuras surge Leviatã, cujo rugido pode criar tsunamis devastadores.',
        cor: 'from-blue-600 to-cyan-600',
        corBorda: 'border-blue-500',
        corBg: 'bg-blue-900/20'
      },
      {
        id: 'titan_terra',
        nome: 'Golias, Colosso de Pedra',
        elemento: 'Terra',
        emoji: '🗿',
        descricao: 'Guardião ancestral das montanhas',
        nivel: 10,
        dificuldade: 'boss',
        nivelMinimo: 5,
        poderMinimo: 40,
        recompensas: {
          xp: 500,
          vinculo: 20,
          titulo: 'Quebra-Montanhas',
          fragmentos: 3
        },
        mecanicas: ['armadura_rochosa', 'terremoto', 'fortificacao'],
        historia: 'Esculpido pelas forças primordiais da terra, Golias é indestrutível como a própria rocha.',
        cor: 'from-amber-700 to-yellow-700',
        corBorda: 'border-amber-600',
        corBg: 'bg-amber-900/20'
      },
      {
        id: 'garuda_titan',
        nome: 'Garuda, Rainha dos Ventos',
        elemento: 'Vento',
        emoji: '🌪️',
        descricao: 'Soberana dos céus tempestuosos',
        nivel: 10,
        dificuldade: 'boss',
        nivelMinimo: 5,
        poderMinimo: 40,
        recompensas: {
          xp: 500,
          vinculo: 20,
          titulo: 'Cavaleiro dos Ventos',
          fragmentos: 3
        },
        mecanicas: ['tornado', 'velocidade_extrema', 'evasao_total'],
        historia: 'Garuda cavalga os ventos mais selvagens, suas asas podem criar furacões devastadores.',
        cor: 'from-cyan-500 to-teal-500',
        corBorda: 'border-cyan-400',
        corBg: 'bg-cyan-900/20'
      },
      {
        id: 'raijin_titan',
        nome: 'Raijin, Deus do Trovão',
        elemento: 'Eletricidade',
        emoji: '⚡',
        descricao: 'Portador da fúria elétrica celestial',
        nivel: 10,
        dificuldade: 'boss',
        nivelMinimo: 5,
        poderMinimo: 40,
        recompensas: {
          xp: 500,
          vinculo: 20,
          titulo: 'Portador do Raio',
          fragmentos: 3
        },
        mecanicas: ['tempestade_eletrica', 'paralisia_massiva', 'sobrecarga'],
        historia: 'Raijin empunha o poder dos céus, cada movimento seu cria relâmpagos devastadores.',
        cor: 'from-yellow-500 to-orange-500',
        corBorda: 'border-yellow-400',
        corBg: 'bg-yellow-900/20'
      },
      {
        id: 'umbra_titan',
        nome: 'Umbra, Devorador de Luz',
        elemento: 'Sombra',
        emoji: '🌑',
        descricao: 'Entidade das trevas primordiais',
        nivel: 12,
        dificuldade: 'boss',
        nivelMinimo: 8,
        poderMinimo: 60,
        recompensas: {
          xp: 700,
          vinculo: 25,
          titulo: 'Mestre das Sombras',
          fragmentos: 4
        },
        mecanicas: ['absorver_luz', 'terror_primordial', 'duplicacao_sombria'],
        historia: 'Umbra existe além da compreensão mortal, uma entidade que devora a própria luz.',
        cor: 'from-purple-700 to-indigo-900',
        corBorda: 'border-purple-600',
        corBg: 'bg-purple-900/20'
      },
      {
        id: 'aurora_titan',
        nome: 'Aurora, Imperatriz da Luz',
        elemento: 'Luz',
        emoji: '✨',
        descricao: 'Guardiã do brilho eterno',
        nivel: 12,
        dificuldade: 'boss',
        nivelMinimo: 8,
        poderMinimo: 60,
        recompensas: {
          xp: 700,
          vinculo: 25,
          titulo: 'Portador da Aurora',
          fragmentos: 4
        },
        mecanicas: ['explosao_solar', 'purificacao', 'barreira_divina'],
        historia: 'Aurora brilha com a intensidade de mil sóis, sua luz pode curar ou destruir.',
        cor: 'from-yellow-300 to-pink-300',
        corBorda: 'border-yellow-300',
        corBg: 'bg-yellow-900/20'
      }
    ],
    lendasAntigas: [
      {
        id: 'fenrir_legend',
        nome: 'Fenrir, o Devorador de Mundos',
        elemento: 'Sombra',
        emoji: '🐺',
        descricao: 'Lobo primordial destinado a destruir a realidade',
        nivel: 15,
        dificuldade: 'lendario',
        nivelMinimo: 10,
        poderMinimo: 80,
        recompensas: {
          xp: 1000,
          vinculo: 30,
          titulo: 'Caçador de Lendas',
          fragmentos: 5
        },
        mecanicas: ['mordida_fatal', 'uivo_primordial', 'frenesi_berserker', 'rage_total'],
        historia: 'Acorrentado pelos deuses antigos, Fenrir aguarda o dia em que devorará o próprio cosmos.',
        cor: 'from-slate-800 to-purple-900',
        corBorda: 'border-purple-700',
        corBg: 'bg-slate-900/30'
      },
      {
        id: 'phoenix_legend',
        nome: 'Fênix Imortal',
        elemento: 'Fogo',
        emoji: '🔥🦅',
        descricao: 'Ave eterna que renasce das próprias cinzas',
        nivel: 15,
        dificuldade: 'lendario',
        nivelMinimo: 10,
        poderMinimo: 80,
        recompensas: {
          xp: 1000,
          vinculo: 30,
          titulo: 'Alma Imortal',
          fragmentos: 5
        },
        mecanicas: ['renascimento', 'chamas_eternas', 'explosao_final', 'fase_duas'],
        historia: 'A Fênix nunca morre verdadeiramente. Destrua-a e ela renascerá mais forte das cinzas.',
        cor: 'from-orange-600 via-red-600 to-yellow-600',
        corBorda: 'border-orange-500',
        corBg: 'bg-orange-900/30'
      }
    ],
    guardioesProibidos: [
      {
        id: 'void_keeper',
        nome: 'Guardião do Vazio',
        elemento: 'Sombra',
        emoji: '👁️',
        descricao: 'Sentinela do além-mundo',
        nivel: 20,
        dificuldade: 'proibido',
        nivelMinimo: 15,
        poderMinimo: 100,
        recompensas: {
          xp: 2000,
          vinculo: 50,
          titulo: 'Desafiador do Impossível',
          fragmentos: 10
        },
        mecanicas: ['distorcao_realidade', 'tentaculos_void', 'loucura', 'imortalidade_temporaria'],
        historia: 'Não deveria existir. Não pode ser compreendido. Apenas destruído... talvez.',
        cor: 'from-black via-purple-950 to-black',
        corBorda: 'border-purple-500',
        corBg: 'bg-black/50'
      }
    ]
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatarAtivo(parsedUser.id);
    carregarDesafiosConcluidos(parsedUser.id);
  }, [router]);

  const carregarAvatarAtivo = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/meus-avatares?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        const ativo = data.avatares.find(av => av.ativo && av.vivo);
        setAvatarAtivo(ativo || null);
      }
    } catch (error) {
      console.error("Erro ao carregar avatar ativo:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarDesafiosConcluidos = async (userId) => {
    try {
      const response = await fetch(`/api/arena/desafios/status?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setDesafiosConcluidos(data.desafios || {});
      }
    } catch (error) {
      console.error("Erro ao carregar desafios:", error);
    }
  };

  const podeDesafiar = (boss) => {
    if (!avatarAtivo) return false;

    // Verificar nível mínimo
    if (avatarAtivo.nivel < boss.nivelMinimo) return false;

    // Verificar poder mínimo
    const poder = calcularPoderTotal(avatarAtivo);
    if (poder < boss.poderMinimo) return false;

    // Verificar cooldown
    const desafio = desafiosConcluidos[boss.id];
    if (desafio && desafio.proximaTentativa) {
      const agora = new Date();
      const proxima = new Date(desafio.proximaTentativa);
      if (agora < proxima) return false;
    }

    return true;
  };

  const getTempoRestante = (bossId) => {
    const desafio = desafiosConcluidos[bossId];
    if (!desafio || !desafio.proximaTentativa) return null;

    const agora = new Date();
    const proxima = new Date(desafio.proximaTentativa);

    if (agora >= proxima) return null;

    const diff = proxima - agora;
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) return `${dias}d ${horas}h`;
    return `${horas}h`;
  };

  const iniciarDesafio = async (boss) => {
    if (!avatarAtivo) {
      setModalAlerta({
        titulo: '⚠️ Sem Avatar Ativo',
        mensagem: 'Você precisa ter um avatar ativo para enfrentar desafios!'
      });
      return;
    }

    if (!avatarAtivo.vivo) {
      setModalAlerta({
        titulo: '💀 Avatar Morto',
        mensagem: 'Seu avatar está morto! Visite o Necromante.'
      });
      return;
    }

    if (avatarAtivo.nivel < boss.nivelMinimo) {
      setModalAlerta({
        titulo: '⛔ Nível Insuficiente',
        mensagem: `Você precisa estar no nível ${boss.nivelMinimo} ou superior!`
      });
      return;
    }

    const poder = calcularPoderTotal(avatarAtivo);
    if (poder < boss.poderMinimo) {
      setModalAlerta({
        titulo: '⛔ Poder Insuficiente',
        mensagem: `Você precisa ter no mínimo ${boss.poderMinimo} de poder!\nSeu poder atual: ${poder}`
      });
      return;
    }

    const tempoRestante = getTempoRestante(boss.id);
    if (tempoRestante) {
      setModalAlerta({
        titulo: '⏰ Desafio em Cooldown',
        mensagem: `Você já enfrentou este boss recentemente.\nPróxima tentativa em: ${tempoRestante}`
      });
      return;
    }

    setIniciandoBatalha(true);

    try {
      const response = await fetch('/api/arena/desafios/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatarAtivo.id,
          bossId: boss.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao iniciar desafio');
      }

      const data = await response.json();

      // Preparar dados da batalha
      const dadosPartida = {
        tipo: 'desafio-boss',
        pvpAoVivo: false,
        avatarJogador: {
          ...avatarAtivo,
          habilidades: avatarAtivo.habilidades || []
        },
        avatarOponente: data.boss,
        nomeBoss: boss.nome,
        bossData: boss,
        morteReal: true // Desafios são perigosos!
      };

      sessionStorage.setItem('batalha_desafio_dados', JSON.stringify(dadosPartida));

      // Redirecionar para batalha
      setTimeout(() => {
        router.push('/arena/batalha?modo=desafio-boss');
      }, 500);

    } catch (error) {
      console.error('Erro ao iniciar desafio:', error);
      setModalAlerta({
        titulo: '❌ Erro',
        mensagem: error.message || 'Erro ao iniciar desafio. Tente novamente.'
      });
    } finally {
      setIniciandoBatalha(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse text-xl">
          Carregando Desafios Épicos...
        </div>
      </div>
    );
  }

  const poderTotal = avatarAtivo ? calcularPoderTotal(avatarAtivo) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/arena')}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 mb-4"
          >
            ← Voltar para Arena
          </button>

          <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-2">
            ⚔️ DESAFIOS ÉPICOS
          </h1>
          <p className="text-gray-400 text-lg">
            Enfrente bosses lendários e prove seu valor - Recompensas épicas aguardam os corajosos!
          </p>
        </div>

        {!avatarAtivo ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-950/90 border border-purple-900/50 rounded-xl p-12 text-center">
              <div className="text-8xl mb-6">⚔️</div>
              <h2 className="text-3xl font-bold text-purple-400 mb-4">
                Nenhum Avatar Ativo
              </h2>
              <p className="text-slate-300 mb-8 text-lg">
                Você precisa ter um avatar ativo para enfrentar os desafios!
              </p>
              <button
                onClick={() => router.push("/avatares")}
                className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 rounded font-bold"
              >
                Ir para Avatares
              </button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Coluna Esquerda - Avatar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {/* Avatar Card */}
                <div className="relative mb-6">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-xl blur"></div>
                  <div className="relative bg-slate-900/95 rounded-xl border-2 border-purple-500 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 px-3 py-2 border-b border-purple-500/50">
                      <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Seu Campeão</div>
                      <div className="font-bold text-white text-base">{avatarAtivo.nome}</div>
                    </div>

                    <div className="p-3 flex justify-center bg-gradient-to-b from-purple-950/30 to-transparent">
                      <AvatarSVG avatar={avatarAtivo} tamanho={120} />
                    </div>

                    <div className="px-3 pb-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-cyan-400">Nv.{avatarAtivo.nivel}</span>
                        <span className="text-purple-400">{avatarAtivo.elemento}</span>
                      </div>

                      {/* HP */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-red-400 font-bold">❤️ HP</span>
                          <span className="font-mono">{calcularHPMaximoCompleto(avatarAtivo)}</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5">
                          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 w-full" />
                        </div>
                      </div>

                      {/* Exaustão */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span className="text-orange-400 font-bold">😰 Exaustão</span>
                          <span className="font-mono">{avatarAtivo.exaustao || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2.5">
                          <div
                            className={`h-full transition-all ${
                              (avatarAtivo.exaustao || 0) < 40 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                              (avatarAtivo.exaustao || 0) < 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                              'bg-gradient-to-r from-red-600 to-red-400'
                            }`}
                            style={{ width: `${avatarAtivo.exaustao || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Poder */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                        <span className="text-cyan-400 font-bold text-sm">⚔️ Poder</span>
                        <span className="font-mono text-lg text-cyan-300 font-bold">{poderTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-slate-900/50 border border-purple-700 rounded-lg p-4">
                  <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                    <span className="text-xl">ℹ️</span>
                    <span>Sobre Desafios</span>
                  </h3>
                  <ul className="text-gray-400 text-xs space-y-2">
                    <li>• Bosses com mecânicas únicas</li>
                    <li>• 1 tentativa por semana</li>
                    <li>• Morte permanente em batalha</li>
                    <li>• Recompensas épicas</li>
                    <li>• Títulos exclusivos</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Desafios */}
            <div className="lg:col-span-3 space-y-8">
              {/* Titãs Elementais */}
              <div>
                <h2 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                  <span className="text-3xl">🔱</span> TITÃS ELEMENTAIS
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {bosses.titasElementais.map(boss => {
                    const disponivel = podeDesafiar(boss);
                    const tempoRestante = getTempoRestante(boss.id);
                    const nivelBaixo = avatarAtivo.nivel < boss.nivelMinimo;
                    const poderBaixo = poderTotal < boss.poderMinimo;

                    return (
                      <div
                        key={boss.id}
                        className={`relative group ${
                          disponivel ? 'cursor-pointer' : 'opacity-60'
                        }`}
                      >
                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${boss.cor} rounded-xl blur opacity-30 group-hover:opacity-50 transition`}></div>
                        <div className={`relative bg-slate-900/95 rounded-xl border-2 ${boss.corBorda} p-4 ${boss.corBg}`}>
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="text-3xl mb-1">{boss.emoji}</div>
                              <h3 className="font-bold text-white text-lg leading-tight">{boss.nome}</h3>
                              <p className="text-sm text-slate-400">{boss.descricao}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">Nv.{boss.nivel}</div>
                              <div className="text-xs text-purple-400">{boss.dificuldade}</div>
                            </div>
                          </div>

                          {/* Requisitos */}
                          <div className="mb-3 text-xs space-y-1">
                            <div className={`flex items-center gap-2 ${nivelBaixo ? 'text-red-400' : 'text-green-400'}`}>
                              <span>{nivelBaixo ? '❌' : '✅'}</span>
                              <span>Nível {boss.nivelMinimo}+</span>
                            </div>
                            <div className={`flex items-center gap-2 ${poderBaixo ? 'text-red-400' : 'text-green-400'}`}>
                              <span>{poderBaixo ? '❌' : '✅'}</span>
                              <span>Poder {boss.poderMinimo}+</span>
                            </div>
                          </div>

                          {/* Recompensas */}
                          <div className="mb-3 p-2 bg-slate-950/50 rounded">
                            <div className="text-[10px] text-yellow-400 font-bold mb-1">🎁 RECOMPENSAS</div>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              <div className="text-blue-400">+{boss.recompensas.xp} XP</div>
                              <div className="text-pink-400">+{boss.recompensas.vinculo} Vínculo</div>
                              <div className="text-purple-400">{boss.recompensas.fragmentos} Fragmentos</div>
                              <div className="text-yellow-400">Título</div>
                            </div>
                          </div>

                          {/* Status/Botão */}
                          {tempoRestante ? (
                            <div className="text-center py-2 bg-slate-800 rounded text-sm text-orange-400">
                              ⏰ Cooldown: {tempoRestante}
                            </div>
                          ) : disponivel ? (
                            <button
                              onClick={() => iniciarDesafio(boss)}
                              disabled={iniciandoBatalha}
                              className={`w-full py-2 bg-gradient-to-r ${boss.cor} hover:opacity-80 rounded font-bold text-sm`}
                            >
                              {iniciandoBatalha ? '⏳ Iniciando...' : '⚔️ DESAFIAR'}
                            </button>
                          ) : (
                            <div className="text-center py-2 bg-slate-800 rounded text-sm text-red-400">
                              ⛔ Requisitos não atendidos
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lendas Antigas */}
              <div>
                <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
                  <span className="text-3xl">📜</span> LENDAS ANTIGAS
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {bosses.lendasAntigas.map(boss => {
                    const disponivel = podeDesafiar(boss);
                    const tempoRestante = getTempoRestante(boss.id);
                    const nivelBaixo = avatarAtivo.nivel < boss.nivelMinimo;
                    const poderBaixo = poderTotal < boss.poderMinimo;

                    return (
                      <div
                        key={boss.id}
                        className={`relative group ${disponivel ? 'cursor-pointer' : 'opacity-60'}`}
                      >
                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${boss.cor} rounded-xl blur opacity-40 group-hover:opacity-60 transition`}></div>
                        <div className={`relative bg-slate-900/95 rounded-xl border-2 ${boss.corBorda} p-4 ${boss.corBg}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="text-4xl mb-1">{boss.emoji}</div>
                              <h3 className="font-bold text-white text-lg leading-tight">{boss.nome}</h3>
                              <p className="text-sm text-slate-400">{boss.descricao}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">Nv.{boss.nivel}</div>
                              <div className="text-xs text-orange-400 font-bold">{boss.dificuldade.toUpperCase()}</div>
                            </div>
                          </div>

                          <div className="mb-3 text-xs space-y-1">
                            <div className={`flex items-center gap-2 ${nivelBaixo ? 'text-red-400' : 'text-green-400'}`}>
                              <span>{nivelBaixo ? '❌' : '✅'}</span>
                              <span>Nível {boss.nivelMinimo}+</span>
                            </div>
                            <div className={`flex items-center gap-2 ${poderBaixo ? 'text-red-400' : 'text-green-400'}`}>
                              <span>{poderBaixo ? '❌' : '✅'}</span>
                              <span>Poder {boss.poderMinimo}+</span>
                            </div>
                          </div>

                          <div className="mb-3 p-2 bg-slate-950/50 rounded">
                            <div className="text-[10px] text-yellow-400 font-bold mb-1">🎁 RECOMPENSAS LENDÁRIAS</div>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              <div className="text-blue-400">+{boss.recompensas.xp} XP</div>
                              <div className="text-pink-400">+{boss.recompensas.vinculo} Vínculo</div>
                              <div className="text-purple-400">{boss.recompensas.fragmentos} Fragmentos</div>
                              <div className="text-yellow-400">Título Lendário</div>
                            </div>
                          </div>

                          {tempoRestante ? (
                            <div className="text-center py-2 bg-slate-800 rounded text-sm text-orange-400">
                              ⏰ Cooldown: {tempoRestante}
                            </div>
                          ) : disponivel ? (
                            <button
                              onClick={() => iniciarDesafio(boss)}
                              disabled={iniciandoBatalha}
                              className={`w-full py-2 bg-gradient-to-r ${boss.cor} hover:opacity-80 rounded font-bold text-sm`}
                            >
                              {iniciandoBatalha ? '⏳ Iniciando...' : '⚔️ DESAFIAR LENDA'}
                            </button>
                          ) : (
                            <div className="text-center py-2 bg-slate-800 rounded text-sm text-red-400">
                              ⛔ Requisitos não atendidos
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guardiões Proibidos */}
              <div>
                <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                  <span className="text-3xl">☠️</span> GUARDIÕES PROIBIDOS
                </h2>
                <div className="grid md:grid-cols-1 gap-4">
                  {bosses.guardioesProibidos.map(boss => {
                    const disponivel = podeDesafiar(boss);
                    const tempoRestante = getTempoRestante(boss.id);
                    const nivelBaixo = avatarAtivo.nivel < boss.nivelMinimo;
                    const poderBaixo = poderTotal < boss.poderMinimo;

                    return (
                      <div
                        key={boss.id}
                        className={`relative group ${disponivel ? 'cursor-pointer' : 'opacity-60'}`}
                      >
                        <div className={`absolute -inset-1 bg-gradient-to-r ${boss.cor} rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition animate-pulse`}></div>
                        <div className={`relative bg-slate-950/95 rounded-xl border-4 ${boss.corBorda} p-6 ${boss.corBg}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="text-6xl mb-2">{boss.emoji}</div>
                              <h3 className="font-bold text-white text-2xl leading-tight">{boss.nome}</h3>
                              <p className="text-base text-red-400 font-bold">{boss.descricao}</p>
                              <p className="text-sm text-slate-500 italic mt-2">{boss.historia}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-400">Nv.{boss.nivel}</div>
                              <div className="text-sm text-red-500 font-black">{boss.dificuldade.toUpperCase()}</div>
                            </div>
                          </div>

                          <div className="mb-4 text-sm space-y-2">
                            <div className={`flex items-center gap-2 ${nivelBaixo ? 'text-red-400' : 'text-green-400'}`}>
                              <span>{nivelBaixo ? '❌' : '✅'}</span>
                              <span>Nível {boss.nivelMinimo}+ REQUERIDO</span>
                            </div>
                            <div className={`flex items-center gap-2 ${poderBaixo ? 'text-red-400' : 'text-green-400'}`}>
                              <span>{poderBaixo ? '❌' : '✅'}</span>
                              <span>Poder {boss.poderMinimo}+ REQUERIDO</span>
                            </div>
                          </div>

                          <div className="mb-4 p-3 bg-gradient-to-r from-purple-950/50 to-red-950/50 rounded border border-purple-500/30">
                            <div className="text-xs text-yellow-400 font-bold mb-2">💎 RECOMPENSAS PROIBIDAS</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-blue-400 font-bold">+{boss.recompensas.xp} XP</div>
                              <div className="text-pink-400 font-bold">+{boss.recompensas.vinculo} Vínculo</div>
                              <div className="text-purple-400 font-bold">{boss.recompensas.fragmentos} Fragmentos Místicos</div>
                              <div className="text-yellow-400 font-bold">Título Impossível</div>
                            </div>
                          </div>

                          {tempoRestante ? (
                            <div className="text-center py-3 bg-slate-800 rounded text-base text-orange-400 font-bold">
                              ⏰ Cooldown: {tempoRestante}
                            </div>
                          ) : disponivel ? (
                            <button
                              onClick={() => iniciarDesafio(boss)}
                              disabled={iniciandoBatalha}
                              className={`w-full py-4 bg-gradient-to-r ${boss.cor} hover:opacity-80 rounded font-black text-lg animate-pulse`}
                            >
                              {iniciandoBatalha ? '⏳ PREPARANDO...' : '☠️ DESAFIAR O IMPOSSÍVEL'}
                            </button>
                          ) : (
                            <div className="text-center py-3 bg-slate-800 rounded text-base text-red-400 font-bold">
                              ⛔ VOCÊ NÃO ESTÁ PRONTO
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Alerta */}
      {modalAlerta && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-purple-500 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-purple-400 mb-3">{modalAlerta.titulo}</h3>
            <p className="text-gray-300 mb-6 whitespace-pre-line">{modalAlerta.mensagem}</p>
            <button
              onClick={() => setModalAlerta(null)}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
