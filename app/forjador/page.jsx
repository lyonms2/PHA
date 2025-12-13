"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';
import GameNav from '../components/GameNav';
import HunterRankBadge from '../components/HunterRankBadge';
import {
  verificarEvolucaoPossivel,
  calcularChanceSucesso,
  EVOLUCAO_CONFIG,
  MULTIPLICADORES_STATS
} from '../avatares/sistemas/evolutionSystem';
import { getHunterRank } from '@/lib/hunter/hunterRankSystem';

export default function ForjadorPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [avatares, setAvatares] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados da evolução
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);
  const [evoluindo, setEvoluindo] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [modalResultado, setModalResultado] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarDados(parsedUser.id);
  }, [router]);

  const carregarDados = async (userId) => {
    setLoading(true);
    try {
      // Carregar stats
      const statsRes = await fetch(`/api/inicializar-jogador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Carregar avatares
      const avataresRes = await fetch(`/api/meus-avatares?userId=${userId}`);
      const avataresData = await avataresRes.json();
      if (avataresRes.ok) {
        // Filtrar apenas avatares vivos e não-lendários
        const avataresEvoluiveis = (avataresData.avatares || [])
          .filter(av => av.vivo && av.raridade !== 'Lendário');
        setAvatares(avataresEvoluiveis);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const obterInfoEvolucao = (avatar) => {
    if (!avatar) return null;
    const verificacao = verificarEvolucaoPossivel(avatar);
    if (!verificacao.podeEvoluir) return { ...verificacao, podeEvoluir: false };

    const hunterRank = stats ? getHunterRank(stats.hunterRankXp || 0) : { nome: 'F', nivel: 0 };
    const chanceSucesso = calcularChanceSucesso(verificacao.tipoEvolucao, hunterRank);

    return {
      ...verificacao,
      chanceSucesso,
      hunterRank
    };
  };

  const realizarEvolucao = async () => {
    if (!avatarSelecionado || evoluindo) return;

    setEvoluindo(true);
    setMensagem(null);

    try {
      const response = await fetch('/api/evoluir-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatarSelecionado.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMensagem({ tipo: 'erro', texto: data.error });
        setEvoluindo(false);
        return;
      }

      // Mostrar resultado
      setResultado(data);
      setModalConfirmacao(false);
      setModalResultado(true);

      // Atualizar dados após sucesso/falha
      await carregarDados(user.id);
      setAvatarSelecionado(null);

    } catch (error) {
      console.error('Erro ao evoluir avatar:', error);
      setMensagem({ tipo: 'erro', texto: 'Erro ao conectar com servidor' });
    } finally {
      setEvoluindo(false);
    }
  };

  const info = avatarSelecionado ? obterInfoEvolucao(avatarSelecionado) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <GameNav user={user} stats={stats} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-white text-xl">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <GameNav user={user} stats={stats} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header do Forjador */}
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 mb-8 border border-purple-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">🔮</div>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                Forjador de Almas
              </h1>
              <p className="text-purple-200 mt-1">
                Evolua seus avatares para raridades superiores
              </p>
            </div>
          </div>

          {/* Descrição do NPC */}
          <div className="bg-black/30 rounded-lg p-4 text-sm text-purple-100">
            <p className="mb-2">
              <span className="font-semibold text-purple-300">Mestre Kaelor</span>, o Forjador de Almas,
              é um antigo artífice que domina a arte de transformar a essência dos avatares.
            </p>
            <p>
              Ele pode evoluir seus avatares de <span className="text-gray-300">Comum</span> para{" "}
              <span className="text-blue-300">Raro</span>, ou de{" "}
              <span className="text-blue-300">Raro</span> para{" "}
              <span className="text-yellow-300">Lendário</span>.
            </p>
          </div>

          {/* Tabela de custos */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="font-semibold text-purple-300 mb-2">Comum → Raro</h3>
              <div className="text-sm space-y-1 text-purple-100">
                <div>💰 Custo: {EVOLUCAO_CONFIG['Comum→Raro'].custoMoedas.toLocaleString()} moedas</div>
                <div>💎 Custo: {EVOLUCAO_CONFIG['Comum→Raro'].custoFragmentos} fragmentos</div>
                <div>📊 Chance base: {EVOLUCAO_CONFIG['Comum→Raro'].chanceBase}%</div>
                <div>⭐ Nível mínimo: {EVOLUCAO_CONFIG['Comum→Raro'].nivelMinimo}</div>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-300 mb-2">Raro → Lendário</h3>
              <div className="text-sm space-y-1 text-purple-100">
                <div>💰 Custo: {EVOLUCAO_CONFIG['Raro→Lendário'].custoMoedas.toLocaleString()} moedas</div>
                <div>💎 Custo: {EVOLUCAO_CONFIG['Raro→Lendário'].custoFragmentos} fragmentos</div>
                <div>📊 Chance base: {EVOLUCAO_CONFIG['Raro→Lendário'].chanceBase}%</div>
                <div>⭐ Nível mínimo: {EVOLUCAO_CONFIG['Raro→Lendário'].nivelMinimo}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recursos do jogador */}
        {stats && (
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 flex gap-6 items-center border border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-xs text-slate-400">Moedas</div>
                <div className="text-xl font-bold text-yellow-400">
                  {(stats.moedas || 0).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💎</span>
              <div>
                <div className="text-xs text-slate-400">Fragmentos</div>
                <div className="text-xl font-bold text-cyan-400">
                  {(stats.fragmentos || 0).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HunterRankBadge stats={stats} />
            </div>
          </div>
        )}

        {/* Mensagem de feedback */}
        {mensagem && (
          <div className={`p-4 rounded-lg mb-6 ${
            mensagem.tipo === 'erro' ? 'bg-red-900/50 text-red-200 border border-red-500/50' :
            'bg-green-900/50 text-green-200 border border-green-500/50'
          }`}>
            {mensagem.texto}
          </div>
        )}

        {/* Grid de avatares */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">
            Selecione um Avatar para Evoluir
          </h2>

          {avatares.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-6xl mb-4">🔮</div>
              <p>Você não possui avatares que possam evoluir</p>
              <p className="text-sm mt-2">Avatares Lendários já estão no nível máximo</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {avatares.map((avatar) => {
                const info = obterInfoEvolucao(avatar);
                const selecionado = avatarSelecionado?.id === avatar.id;

                return (
                  <div
                    key={avatar.id}
                    onClick={() => setAvatarSelecionado(avatar)}
                    className={`
                      cursor-pointer rounded-xl p-4 transition-all transform hover:scale-105
                      ${selecionado
                        ? 'bg-purple-600/30 border-2 border-purple-400 shadow-lg shadow-purple-500/50'
                        : 'bg-slate-700/50 border border-slate-600 hover:border-purple-500/50'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center">
                      <AvatarSVG avatar={avatar} tamanho={80} />
                      <div className="mt-2 text-center w-full">
                        <div className="font-semibold text-white truncate">
                          {avatar.nome}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Nível {avatar.nivel} • {avatar.elemento}
                        </div>
                        <div className={`text-xs font-semibold mt-1 ${
                          avatar.raridade === 'Comum' ? 'text-gray-300' :
                          avatar.raridade === 'Raro' ? 'text-blue-300' :
                          'text-yellow-300'
                        }`}>
                          {avatar.raridade}
                        </div>
                        {info && !info.podeEvoluir && (
                          <div className="text-xs text-red-400 mt-1">
                            {info.motivo}
                          </div>
                        )}
                        {info && info.podeEvoluir && (
                          <div className="text-xs text-green-400 mt-1">
                            → {info.proximaRaridade}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel de evolução */}
        {avatarSelecionado && info && (
          <div className="mt-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold text-purple-200 mb-4">
              Detalhes da Evolução
            </h2>

            {!info.podeEvoluir ? (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-200">
                ❌ {info.motivo}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Preview da evolução */}
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-center">
                      <AvatarSVG avatar={avatarSelecionado} tamanho={64} />
                      <div className={`text-sm font-semibold mt-2 ${
                        avatarSelecionado.raridade === 'Comum' ? 'text-gray-300' : 'text-blue-300'
                      }`}>
                        {avatarSelecionado.raridade}
                      </div>
                    </div>
                    <div className="text-4xl text-purple-400">→</div>
                    <div className="text-center">
                      <AvatarSVG avatar={{...avatarSelecionado, raridade: info.proximaRaridade}} tamanho={64} />
                      <div className={`text-sm font-semibold mt-2 ${
                        info.proximaRaridade === 'Raro' ? 'text-blue-300' : 'text-yellow-300'
                      }`}>
                        {info.proximaRaridade}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-300 mb-2">💰 Custo</h3>
                    <div className="text-sm space-y-1 text-purple-100">
                      <div>Moedas: {info.config.custoMoedas.toLocaleString()}</div>
                      <div>Fragmentos: {info.config.custoFragmentos}</div>
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-300 mb-2">📊 Chance de Sucesso</h3>
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round(info.chanceSucesso)}%
                    </div>
                    {info.hunterRank.nivel > 0 && (
                      <div className="text-xs text-purple-300 mt-1">
                        (Inclui bônus de Hunter Rank {info.hunterRank.nome})
                      </div>
                    )}
                  </div>
                </div>

                {/* Ganhos de stats */}
                <div className="bg-black/30 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-300 mb-2">✨ Benefícios</h3>
                  <div className="text-sm text-purple-100">
                    <div>
                      {MULTIPLICADORES_STATS[info.tipoEvolucao].descricao}
                    </div>
                    <div className="mt-2 text-yellow-300">
                      HP restaurado ao máximo ao evoluir!
                    </div>
                  </div>
                </div>

                {/* Aviso de risco */}
                <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">⚠️</span>
                    <div className="text-sm text-orange-200">
                      <div className="font-semibold mb-1">Atenção:</div>
                      <p>
                        Se a evolução falhar, você perderá os recursos gastos mas o avatar permanecerá inalterado.
                        A chance de sucesso é de {Math.round(info.chanceSucesso)}%.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botão de evolução */}
                <button
                  onClick={() => setModalConfirmacao(true)}
                  disabled={evoluindo || !stats || stats.moedas < info.config.custoMoedas || stats.fragmentos < info.config.custoFragmentos}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50"
                >
                  {evoluindo ? '🔮 Evoluindo...' : '🔮 Evoluir Avatar'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {modalConfirmacao && info && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 border-purple-500">
            <h3 className="text-xl font-bold text-white mb-4">
              Confirmar Evolução
            </h3>
            <div className="space-y-3 text-sm text-slate-200 mb-6">
              <p>
                Você está prestes a tentar evoluir <span className="font-semibold text-purple-300">{avatarSelecionado.nome}</span> de{" "}
                <span className={avatarSelecionado.raridade === 'Comum' ? 'text-gray-300' : 'text-blue-300'}>
                  {avatarSelecionado.raridade}
                </span> para{" "}
                <span className={info.proximaRaridade === 'Raro' ? 'text-blue-300' : 'text-yellow-300'}>
                  {info.proximaRaridade}
                </span>.
              </p>
              <p className="text-yellow-300">
                Custo: {info.config.custoMoedas.toLocaleString()} moedas + {info.config.custoFragmentos} fragmentos
              </p>
              <p className="text-green-300">
                Chance de sucesso: {Math.round(info.chanceSucesso)}%
              </p>
              <p className="text-orange-300">
                Se falhar, você perderá os recursos mas o avatar permanecerá inalterado.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModalConfirmacao(false)}
                className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={realizarEvolucao}
                disabled={evoluindo}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {evoluindo ? 'Evoluindo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultado */}
      {modalResultado && resultado && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className={`bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 ${
            resultado.sucesso ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">
                {resultado.sucesso ? '🎉' : '😢'}
              </div>
              <h3 className={`text-2xl font-bold ${
                resultado.sucesso ? 'text-green-400' : 'text-red-400'
              }`}>
                {resultado.sucesso ? 'Sucesso!' : 'Falhou!'}
              </h3>
            </div>

            <div className="space-y-3 text-sm text-slate-200 mb-6">
              <p className="text-center">
                {resultado.mensagem}
              </p>

              {resultado.sucesso && resultado.avatar && (
                <div className="bg-black/30 rounded-lg p-4 space-y-2">
                  <div className="text-center mb-3">
                    <div className={`text-lg font-semibold ${
                      resultado.avatar.raridadeNova === 'Raro' ? 'text-blue-300' : 'text-yellow-300'
                    }`}>
                      {resultado.avatar.raridadeNova}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">⚔️ Força:</span>{" "}
                      <span className="text-red-400 font-semibold">{resultado.avatar.statsNovos.forca}</span>
                      <span className="text-green-400 text-xs ml-1">
                        (+{resultado.avatar.statsNovos.forca - resultado.avatar.statsAntigos.forca})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">⚡ Agilidade:</span>{" "}
                      <span className="text-yellow-400 font-semibold">{resultado.avatar.statsNovos.agilidade}</span>
                      <span className="text-green-400 text-xs ml-1">
                        (+{resultado.avatar.statsNovos.agilidade - resultado.avatar.statsAntigos.agilidade})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">🛡️ Resistência:</span>{" "}
                      <span className="text-blue-400 font-semibold">{resultado.avatar.statsNovos.resistencia}</span>
                      <span className="text-green-400 text-xs ml-1">
                        (+{resultado.avatar.statsNovos.resistencia - resultado.avatar.statsAntigos.resistencia})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">🎯 Foco:</span>{" "}
                      <span className="text-purple-400 font-semibold">{resultado.avatar.statsNovos.foco}</span>
                      <span className="text-green-400 text-xs ml-1">
                        (+{resultado.avatar.statsNovos.foco - resultado.avatar.statsAntigos.foco})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Recursos gastos:</div>
                <div className="text-yellow-400">
                  💰 {resultado.recursosGastos.moedas.toLocaleString()} moedas
                </div>
                <div className="text-cyan-400">
                  💎 {resultado.recursosGastos.fragmentos} fragmentos
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setModalResultado(false);
                setResultado(null);
              }}
              className={`w-full py-3 ${
                resultado.sucesso
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                  : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
              } text-white font-semibold rounded-lg transition`}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
