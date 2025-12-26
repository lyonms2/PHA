"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameNav from '../components/GameNav';
import { getTituloColor, TITULOS_DISPONIVEIS, getRaridadeColor } from './utils';

export default function TitulosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [titulos, setTitulos] = useState([]);
  const [tituloAtivo, setTituloAtivo] = useState(null);
  const [ativando, setAtivando] = useState(false);
  const [tabAtiva, setTabAtiva] = useState('meus'); // 'meus' ou 'galeria'

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarTitulos(parsedUser.id);
  }, [router]);

  const carregarTitulos = async (userId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pvp/titulos?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setTitulos(data.titulos);
        setTituloAtivo(data.tituloAtivo);
      } else {
        console.error("Erro ao carregar títulos:", data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar títulos:", error);
    } finally {
      setLoading(false);
    }
  };

  const ativarTitulo = async (tituloId) => {
    if (!user || ativando) return;

    setAtivando(true);

    try {
      const response = await fetch("/api/pvp/titulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          tituloId: tituloId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Recarregar títulos
        await carregarTitulos(user.id);
      } else {
        alert("Erro ao ativar título: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao ativar título:", error);
      alert("Erro ao ativar título");
    } finally {
      setAtivando(false);
    }
  };

  const desativarTitulos = async () => {
    if (!user || ativando) return;

    setAtivando(true);

    try {
      const response = await fetch("/api/pvp/titulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          tituloId: null // null = desativar todos
        })
      });

      const data = await response.json();

      if (response.ok) {
        await carregarTitulos(user.id);
      } else {
        alert("Erro ao desativar títulos: " + data.error);
      }
    } catch (error) {
      console.error("Erro ao desativar títulos:", error);
      alert("Erro ao desativar títulos");
    } finally {
      setAtivando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🏆</div>
          <div className="text-white text-xl">Carregando títulos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-6">
      <GameNav
        backTo="/arena/pvp"
        backLabel="ARENA PVP"
        title="TÍTULOS"
        subtitle="Conquiste e exiba seus títulos de prestígio"
      />

      <div className="max-w-6xl mx-auto mt-6">

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-lg">
          <button
            onClick={() => setTabAtiva('meus')}
            className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all ${
              tabAtiva === 'meus'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>🏆</span>
              <span>Meus Títulos</span>
              {titulos.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {titulos.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setTabAtiva('galeria')}
            className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all ${
              tabAtiva === 'galeria'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>📚</span>
              <span>Galeria de Títulos</span>
            </div>
          </button>
        </div>

        {/* Conteúdo - Meus Títulos */}
        {tabAtiva === 'meus' && (
          <>
            {/* Título Ativo */}
            {tituloAtivo && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Título Equipado</h2>
                <div className={`bg-gradient-to-r ${getTituloColor(tituloAtivo)} rounded-lg p-6 shadow-xl border-2 border-white`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{tituloAtivo.titulo_icone}</div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-1">
                          {tituloAtivo.titulo_nome}
                        </h3>
                        <p className="text-white/80">
                          {tituloAtivo.temporada?.nome} - #{tituloAtivo.posicao_conquistada}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={desativarTitulos}
                      disabled={ativando}
                      className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                    >
                      Desequipar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Títulos */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-4">
                Títulos Conquistados ({titulos.length})
              </h2>
            </div>

            {titulos.length === 0 ? (
              <div className="bg-slate-800/50 rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">🎖️</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Nenhum título conquistado ainda
                </h2>
                <p className="text-slate-400 mb-4">
                  Termine uma temporada no Top 100 para ganhar seu primeiro título!
                </p>
                <button
                  onClick={() => setTabAtiva('galeria')}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition-colors"
                >
                  Ver Todos os Títulos Disponíveis
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {titulos.map((titulo) => (
                  <div
                    key={titulo.id}
                    className={`rounded-lg p-6 shadow-xl border-2 transition-all ${
                      titulo.ativo
                        ? 'border-white scale-105'
                        : 'border-slate-700 hover:border-purple-500'
                    } bg-gradient-to-r ${getTituloColor(titulo)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-4xl">{titulo.titulo_icone}</div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-1">
                            {titulo.titulo_nome}
                          </h3>
                          <p className="text-white/80 mb-2">
                            {titulo.temporada?.nome}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <span>Posição: #{titulo.posicao_conquistada}</span>
                            <span>•</span>
                            <span>
                              {new Date(titulo.data_conquista).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!titulo.ativo && (
                        <button
                          onClick={() => ativarTitulo(titulo.id)}
                          disabled={ativando}
                          className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                          Equipar
                        </button>
                      )}

                      {titulo.ativo && (
                        <div className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold">
                          ✓ Equipado
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Conteúdo - Galeria de Títulos (Pública) */}
        {tabAtiva === 'galeria' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Galeria de Títulos
              </h2>
              <p className="text-slate-400">
                Todos os títulos disponíveis no jogo e como conquistá-los
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {TITULOS_DISPONIVEIS.map((titulo) => {
                const conquistado = titulos.some(t =>
                  t.titulo_nome.includes(titulo.nome.split(' ')[0]) ||
                  (titulo.id === 'top10' && t.titulo_nome.includes('Top 10')) ||
                  (titulo.id === 'top50' && t.titulo_nome.includes('Top 50')) ||
                  (titulo.id === 'top100' && t.titulo_nome.includes('Top 100'))
                );

                return (
                  <div
                    key={titulo.id}
                    className={`rounded-lg p-6 shadow-xl border-2 bg-gradient-to-r ${getTituloColor(titulo)} ${
                      conquistado
                        ? 'border-green-500'
                        : 'border-slate-700 opacity-90'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`text-5xl ${conquistado ? '' : 'grayscale opacity-50'}`}>
                        {titulo.icone}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold text-white">
                            {titulo.nome}
                          </h3>
                          {conquistado && (
                            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                              ✓ Conquistado
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-300 text-sm">Raridade:</span>
                            <span className={`font-bold ${getRaridadeColor(titulo.raridade)}`}>
                              {titulo.raridade}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-300 text-sm">Requisito:</span>
                            <span className="font-bold text-yellow-400">
                              {titulo.requisito}
                            </span>
                          </div>

                          <p className="text-white/80 text-sm mt-3">
                            {titulo.descricao}
                          </p>

                          <div className="flex items-center gap-1 mt-3">
                            <span className="text-slate-400 text-xs">Prestígio:</span>
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < titulo.prestigio ? 'text-yellow-400' : 'text-slate-600'}>
                                ⭐
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info sobre Temporadas */}
            <div className="mt-8 bg-purple-900/20 border border-purple-500 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="text-2xl">💡</div>
                <div className="flex-1">
                  <h3 className="font-bold text-purple-300 mb-1">Como funcionam os títulos?</h3>
                  <p className="text-purple-200 text-sm mb-3">
                    Os títulos são conquistados automaticamente ao final de cada temporada de PvP (30 dias).
                    Sua posição no ranking determina qual título você receberá.
                  </p>
                  <ul className="space-y-1 text-sm text-purple-200">
                    <li>• Você pode equipar apenas 1 título por vez</li>
                    <li>• Títulos ficam salvos para sempre no seu perfil</li>
                    <li>• Você pode ganhar o mesmo título em temporadas diferentes</li>
                    <li>• Quanto mais raro o título, maior o prestígio!</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
