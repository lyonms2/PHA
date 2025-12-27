'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameNav from '@/app/components/GameNav';
import { COMMON_ACTIONS } from '@/app/components/GameNav';

export default function HallDaFamaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [hallDaFama, setHallDaFama] = useState([]);
  const [agrupadoPorColecao, setAgrupadoPorColecao] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    buscarHallDaFama(parsedUser.id);
  }, [router]);

  const buscarHallDaFama = async (userId) => {
    try {
      setLoading(true);
      setErro(null);

      const response = await fetch(`/api/hall-da-fama?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erro ao buscar Hall da Fama');

      setHallDaFama(data.hall_da_fama || []);
      setAgrupadoPorColecao(data.agrupado_por_colecao || []);
      setEstatisticas(data.estatisticas || null);
    } catch (error) {
      console.error('Erro ao buscar Hall da Fama:', error);
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCorRaridade = (raridade) => {
    const cores = {
      'Comum': 'text-gray-400',
      'Incomum': 'text-green-400',
      'Raro': 'text-blue-400',
      'Épico': 'text-purple-400',
      'Lendário': 'text-orange-400'
    };
    return cores[raridade] || 'text-gray-400';
  };

  const getBgRaridade = (raridade) => {
    const cores = {
      'Comum': 'from-gray-600 to-gray-700',
      'Incomum': 'from-green-600 to-green-700',
      'Raro': 'from-blue-600 to-blue-700',
      'Épico': 'from-purple-600 to-purple-700',
      'Lendário': 'from-orange-600 to-red-600'
    };
    return cores[raridade] || 'from-gray-600 to-gray-700';
  };

  const getIconeElemento = (elemento) => {
    const icones = {
      'Fogo': '🔥',
      'Água': '💧',
      'Terra': '🪨',
      'Ar': '💨'
    };
    return icones[elemento] || '❓';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando Hall da Fama...</div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Erro: {erro}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <GameNav
        title="🏛️ Hall da Fama"
        actions={[
          COMMON_ACTIONS.avatares,
          { href: "/dashboard", label: "DASHBOARD", icon: "🏠", color: "blue" }
        ]}
      />

      <div className="max-w-7xl mx-auto mt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🏛️ Hall da Fama
          </h1>
          <p className="text-slate-300">
            Avatares dedicados permanentemente através das Coleções Premium
          </p>
        </div>

        {/* Estatísticas */}
        {estatisticas && estatisticas.total_avatares > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Total de Avatares</div>
              <div className="text-3xl font-bold text-yellow-400">
                {estatisticas.total_avatares}
              </div>
            </div>

            {/* Coleções */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Coleções Dedicadas</div>
              <div className="text-3xl font-bold text-purple-400">
                {estatisticas.colecoes_dedicadas}
              </div>
            </div>

            {/* Por Raridade */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
              <div className="text-slate-400 text-sm mb-2">Por Raridade</div>
              <div className="space-y-1">
                {Object.entries(estatisticas.por_raridade).map(([raridade, count]) => (
                  <div key={raridade} className="flex justify-between text-sm">
                    <span className={getCorRaridade(raridade)}>{raridade}</span>
                    <span className="text-slate-300">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lista Vazia */}
        {hallDaFama.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏛️</div>
            <h2 className="text-2xl font-bold text-slate-300 mb-2">
              Hall da Fama vazio
            </h2>
            <p className="text-slate-400 mb-6">
              Complete Coleções Premium para dedicar avatares ao Hall da Fama!
            </p>
            <button
              onClick={() => window.location.href = '/avatares'}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              Ver Coleções
            </button>
          </div>
        )}

        {/* Avatares Agrupados por Coleção */}
        {agrupadoPorColecao.map((grupo) => (
          <div key={grupo.colecao_id} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">
              {grupo.colecao_nome}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {grupo.avatares.map((avatar) => (
                <div
                  key={avatar.id}
                  className={`bg-gradient-to-br ${getBgRaridade(avatar.raridade)} rounded-xl p-4 border-2 border-yellow-500/30 shadow-lg`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{avatar.nome}</h3>
                      <p className={`text-sm ${getCorRaridade(avatar.raridade)}`}>
                        {avatar.raridade}
                      </p>
                    </div>
                    <div className="text-3xl">
                      {getIconeElemento(avatar.elemento)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center">
                      <div className="text-xs text-slate-300">ATK</div>
                      <div className="font-bold">{avatar.ataque || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-300">DEF</div>
                      <div className="font-bold">{avatar.defesa || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-300">VEL</div>
                      <div className="font-bold">{avatar.velocidade || 0}</div>
                    </div>
                  </div>

                  {/* Info de Dedicação */}
                  <div className="text-xs text-slate-300 bg-black/30 rounded p-2">
                    <div className="flex items-center gap-1">
                      <span>🏛️</span>
                      <span>Dedicado em:</span>
                      <span className="text-yellow-400">
                        {new Date(avatar.dedicado_em).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
