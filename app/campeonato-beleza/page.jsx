"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameNav from '../components/GameNav';
import AvatarSVG from '../components/AvatarSVG';
import Pagination from '../components/Pagination';

export default function CampeonatoBelezaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos'); // 'todos', 'Comum', 'Raro', 'Lendário'
  const [avataresConcorrentes, setAvataresConcorrentes] = useState([]);
  const [meuVoto, setMeuVoto] = useState(null); // {avatarId, categoria, votadoEm}
  const [ranking, setRanking] = useState({ Comum: [], Raro: [], Lendário: [] });
  const [modalRegras, setModalRegras] = useState(false);
  const [modalPremios, setModalPremios] = useState(false);
  const [campeoes, setCampeoes] = useState([]); // Histórico de campeões
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [paginaAtual, setPaginaAtual] = useState(1);
  const AVATARES_POR_PAGINA = 20;

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem("user");
      if (!userData) {
        router.push("/login");
        return;
      }

      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      try {
        // Carregar avatares concorrentes e votos
        const response = await fetch(`/api/campeonato-beleza?userId=${parsedUser.id}`);
        const data = await response.json();

        if (response.ok) {
          setAvataresConcorrentes(data.avatares || []);
          setMeuVoto(data.meuVoto);
          setRanking(data.ranking || { Comum: [], Raro: [], Lendário: [] });
        }

        // Carregar histórico de campeões
        const campoesResponse = await fetch('/api/campeonato-beleza/campeoes');
        const campoesData = await campoesResponse.json();
        if (campoesResponse.ok) {
          setCampeoes(campoesData.campeoes || []);
        }
      } catch (error) {
        console.error("Erro ao carregar campeonato:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const votar = async (avatarId, categoria) => {
    if (!user || meuVoto) return;

    try {
      const response = await fetch('/api/campeonato-beleza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          avatarId,
          categoria
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMeuVoto(data.voto);
        // Recarregar dados
        const reloadResponse = await fetch(`/api/campeonato-beleza?userId=${user.id}`);
        const reloadData = await reloadResponse.json();
        if (reloadResponse.ok) {
          setAvataresConcorrentes(reloadData.avatares || []);
          setRanking(reloadData.ranking || { Comum: [], Raro: [], Lendário: [] });
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Erro ao votar:", error);
      alert("Erro ao processar voto");
    }
  };

  const avataresFiltrados = categoriaAtiva === 'todos'
    ? avataresConcorrentes
    : avataresConcorrentes.filter(av => av.raridade === categoriaAtiva);

  // Paginação
  const totalPaginas = Math.ceil(avataresFiltrados.length / AVATARES_POR_PAGINA);
  const indiceInicio = (paginaAtual - 1) * AVATARES_POR_PAGINA;
  const indiceFim = indiceInicio + AVATARES_POR_PAGINA;
  const avataresPaginados = avataresFiltrados.slice(indiceInicio, indiceFim);

  // Reset página quando mudar categoria
  const mudarCategoria = (categoria) => {
    setCategoriaAtiva(categoria);
    setPaginaAtual(1);
  };

  const categorias = [
    { id: 'todos', nome: 'Todos', emoji: '🌟', cor: 'cyan' },
    { id: 'Comum', nome: 'Comum', emoji: '⚪', cor: 'gray' },
    { id: 'Raro', nome: 'Raro', emoji: '💜', cor: 'purple' },
    { id: 'Lendário', nome: 'Lendário', emoji: '🟡', cor: 'amber' }
  ];

  const getCategoriaStyle = (catId) => {
    const cat = categorias.find(c => c.id === catId);
    const cores = {
      cyan: 'border-cyan-500 bg-cyan-900/80 text-cyan-300',
      gray: 'border-gray-500 bg-gray-900/80 text-gray-300',
      purple: 'border-purple-500 bg-purple-900/80 text-purple-300',
      amber: 'border-amber-500 bg-amber-900/80 text-amber-300'
    };
    const coresHover = {
      cyan: 'hover:border-cyan-400 hover:bg-cyan-900/60 hover:text-cyan-200',
      gray: 'hover:border-gray-400 hover:bg-gray-900/60 hover:text-gray-200',
      purple: 'hover:border-purple-400 hover:bg-purple-900/60 hover:text-purple-200',
      amber: 'hover:border-amber-400 hover:bg-amber-900/60 hover:text-amber-200'
    };
    const coresInativas = {
      cyan: 'border-slate-700 bg-slate-900/50 text-slate-500',
      gray: 'border-slate-700 bg-slate-900/50 text-slate-500',
      purple: 'border-slate-700 bg-slate-900/50 text-slate-500',
      amber: 'border-slate-700 bg-slate-900/50 text-slate-500'
    };

    return categoriaAtiva === catId
      ? cores[cat.cor]
      : `${coresInativas[cat.cor]} ${coresHover[cat.cor]}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando campeonato...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-pink-500/5 rounded-full blur-[150px] top-0 right-0 animate-pulse"></div>
        <div className="absolute w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] bottom-0 left-0 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <GameNav
        backTo="/dashboard"
        backLabel="DASHBOARD"
        title="🏆 CAMPEONATO DE BELEZA"
        subtitle="Vote no avatar mais belo de cada categoria"
      />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-pink-950/50 border border-pink-500/30 rounded-full">
            <span className="text-3xl">👑</span>
            <div className="text-left">
              <div className="text-sm font-bold text-pink-300">Campeonato Mensal</div>
              <div className="text-xs text-slate-400 font-mono">Premiação em Fragmentos</div>
            </div>
          </div>

          <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
            Vote no avatar mais bonito de cada categoria. Um voto por mês, escolha com sabedoria!
          </p>

          {/* Botões de Info */}
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setModalRegras(true)}
              className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-xs font-mono text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
            >
              📜 Regras
            </button>
            <button
              onClick={() => setModalPremios(true)}
              className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-xs font-mono text-slate-400 hover:text-amber-400 hover:border-amber-500/50 transition-all"
            >
              🏆 Prêmios
            </button>
          </div>
        </div>

        {/* Status do Voto */}
        {meuVoto && (
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="bg-green-950/30 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-green-400 mb-1">Você já votou este mês!</div>
                  <div className="text-xs text-slate-400">
                    Categoria: <span className="text-green-300">{meuVoto.categoria}</span> •
                    Votado em: <span className="text-green-300">{new Date(meuVoto.votadoEm).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros de Categoria */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => mudarCategoria(cat.id)}
                className={`px-5 py-3 rounded-lg border-2 font-mono text-sm font-bold transition-all ${getCategoriaStyle(cat.id)}`}
              >
                {cat.emoji} {cat.nome}
              </button>
            ))}
          </div>

          {/* Info de Paginação */}
          {avataresFiltrados.length > 0 && (
            <div className="text-center mt-4">
              <span className="text-sm text-slate-500 font-mono">
                Mostrando {indiceInicio + 1}-{Math.min(indiceFim, avataresFiltrados.length)} de {avataresFiltrados.length} avatares
              </span>
            </div>
          )}
        </div>

        {/* Grid de Avatares Concorrentes */}
        {avataresFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">👑</div>
            <h3 className="text-2xl font-bold text-slate-500 mb-3">Nenhum concorrente</h3>
            <p className="text-slate-600">Não há avatares nesta categoria no momento.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {avataresPaginados.map((avatar) => {
              const jaVotou = meuVoto?.avatarId === avatar.id;
              const podeVotar = !meuVoto && avatar.userId !== user.id;

              return (
                <div
                  key={avatar.id}
                  className="group relative"
                >
                  {/* Card do Avatar */}
                  <div className={`relative bg-slate-950/80 backdrop-blur-xl border-2 rounded-xl overflow-hidden transition-all ${
                    jaVotou
                      ? 'border-green-500 ring-4 ring-green-500/30'
                      : podeVotar
                      ? 'border-slate-800 hover:border-pink-500/50'
                      : 'border-slate-800 opacity-60'
                  }`}>
                    {/* Badge de Voto */}
                    {jaVotou && (
                      <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        ✓ SEU VOTO
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="p-4">
                      <div className="flex justify-center mb-3">
                        <AvatarSVG avatar={avatar} tamanho={180} />
                      </div>

                      {/* Nome e Info */}
                      <div className="text-center mb-3">
                        <h3 className="text-lg font-bold text-cyan-400 mb-1">{avatar.nome}</h3>
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <span className={`px-2 py-1 rounded border ${
                            avatar.raridade === 'Lendário' ? 'bg-amber-950/50 border-amber-500/50 text-amber-400' :
                            avatar.raridade === 'Raro' ? 'bg-purple-950/50 border-purple-500/50 text-purple-400' :
                            'bg-gray-950/50 border-gray-500/50 text-gray-400'
                          }`}>
                            {avatar.raridade}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{avatar.elemento}</span>
                        </div>
                      </div>

                      {/* Votos Recebidos */}
                      <div className="text-center mb-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded-full">
                          <span className="text-pink-400">❤️</span>
                          <span className="text-sm font-bold text-slate-300">{avatar.votosRecebidos || 0}</span>
                          <span className="text-xs text-slate-500">votos</span>
                        </div>
                      </div>

                      {/* Botão de Votar - Mobile Optimized */}
                      {podeVotar ? (
                        <button
                          onClick={() => votar(avatar.id, avatar.raridade)}
                          className="w-full min-h-[48px] group/btn relative"
                        >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg blur opacity-50 group-hover/btn:opacity-75 transition-all"></div>
                          <div className="relative px-4 py-3 bg-slate-950 rounded-lg border border-pink-500/50 transition-all active:scale-[0.98]">
                            <span className="font-bold text-pink-400">👑 VOTAR</span>
                          </div>
                        </button>
                      ) : avatar.userId === user.id ? (
                        <div className="text-center py-3 bg-blue-950/30 border border-blue-500/30 rounded-lg">
                          <span className="text-xs text-blue-400 font-mono">Seu Avatar</span>
                        </div>
                      ) : (
                        <div className="text-center py-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                          <span className="text-xs text-slate-500 font-mono">Já votou este mês</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controles de Paginação */}
          <Pagination
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            onMudarPagina={setPaginaAtual}
            corTema="pink"
          />
        </>
        )}

        {/* Ranking Section */}
        {Object.values(ranking).some(r => r.length > 0) && (
          <div className="mt-12">
            <h2 className="text-2xl font-black text-center mb-6 bg-gradient-to-r from-amber-300 to-pink-300 bg-clip-text text-transparent">
              🏆 TOP 3 POR CATEGORIA
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {['Comum', 'Raro', 'Lendário'].map(cat => (
                <div key={cat} className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                  <h3 className={`text-center font-bold mb-4 ${
                    cat === 'Lendário' ? 'text-amber-400' :
                    cat === 'Raro' ? 'text-purple-400' :
                    'text-gray-400'
                  }`}>
                    {cat === 'Lendário' ? '🟡' : cat === 'Raro' ? '💜' : '⚪'} {cat}
                  </h3>
                  {ranking[cat]?.slice(0, 3).map((avatar, idx) => (
                    <div key={avatar.id} className="flex items-center gap-3 mb-3 p-2 bg-slate-900/50 rounded-lg">
                      <div className="text-2xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-cyan-400 truncate">{avatar.nome}</div>
                        <div className="text-xs text-slate-500">{avatar.votosRecebidos} votos</div>
                      </div>
                    </div>
                  ))}
                  {(!ranking[cat] || ranking[cat].length === 0) && (
                    <p className="text-center text-slate-600 text-xs py-4">Nenhum voto ainda</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hall da Fama - Campeões Históricos */}
        {campeoes.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                👑 HALL DA FAMA
              </h2>
              <p className="text-slate-400 text-sm">Galeria dos avatares mais belos de cada mês</p>
            </div>

            {/* Filtro de Ano */}
            <div className="flex justify-center gap-3 mb-8">
              {[...new Set(campeoes.map(c => c.ano))].sort((a, b) => b - a).map(ano => (
                <button
                  key={ano}
                  onClick={() => setAnoSelecionado(ano)}
                  className={`px-5 py-2 rounded-lg border-2 font-mono text-sm font-bold transition-all ${
                    anoSelecionado === ano
                      ? 'border-amber-500 bg-amber-900/80 text-amber-300'
                      : 'border-slate-700 bg-slate-900/50 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                  }`}
                >
                  {ano}
                </button>
              ))}
            </div>

            {/* Timeline de Campeões */}
            <div className="space-y-8">
              {campeoes
                .filter(c => c.ano === anoSelecionado)
                .sort((a, b) => b.mes - a.mes)
                .map((campeao) => {
                  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                  const nomeMes = meses[campeao.mes - 1];

                  return (
                    <div key={`${campeao.ano}-${campeao.mes}`} className="relative">
                      {/* Linha do Tempo */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 via-pink-500/50 to-purple-500/50 -z-10"></div>

                      {/* Badge do Mês */}
                      <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-900/50 to-pink-900/50 border-2 border-amber-500/50 rounded-full backdrop-blur-xl">
                          <span className="text-2xl">📅</span>
                          <span className="text-lg font-black text-amber-300">{nomeMes} {campeao.ano}</span>
                        </div>
                      </div>

                      {/* Cards dos Vencedores por Categoria */}
                      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {['Comum', 'Raro', 'Lendário'].map(categoria => {
                          const vencedor = campeao.vencedores?.[categoria];
                          if (!vencedor) return null;

                          return (
                            <div
                              key={categoria}
                              className={`relative group ${
                                categoria === 'Lendário' ? 'ring-2 ring-amber-500/50' :
                                categoria === 'Raro' ? 'ring-2 ring-purple-500/50' :
                                'ring-2 ring-gray-500/50'
                              } rounded-xl`}
                            >
                              <div className={`bg-gradient-to-b ${
                                categoria === 'Lendário' ? 'from-amber-950/80 to-amber-900/40' :
                                categoria === 'Raro' ? 'from-purple-950/80 to-purple-900/40' :
                                'from-gray-950/80 to-gray-900/40'
                              } backdrop-blur-xl rounded-xl p-5`}>
                                {/* Medalha e Categoria */}
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-3xl">🥇</span>
                                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                    categoria === 'Lendário' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
                                    categoria === 'Raro' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' :
                                    'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                                  }`}>
                                    {categoria === 'Lendário' ? '🟡' : categoria === 'Raro' ? '💜' : '⚪'} {categoria}
                                  </span>
                                </div>

                                {/* Avatar */}
                                <div className="flex justify-center mb-4">
                                  <div className="relative">
                                    <div className={`absolute -inset-2 ${
                                      categoria === 'Lendário' ? 'bg-amber-500/20' :
                                      categoria === 'Raro' ? 'bg-purple-500/20' :
                                      'bg-gray-500/20'
                                    } rounded-full blur-xl`}></div>
                                    <AvatarSVG avatar={vencedor.avatar} tamanho={140} />
                                  </div>
                                </div>

                                {/* Nome do Avatar */}
                                <div className="text-center mb-3">
                                  <h3 className={`text-xl font-black mb-1 ${
                                    categoria === 'Lendário' ? 'text-amber-400' :
                                    categoria === 'Raro' ? 'text-purple-400' :
                                    'text-gray-400'
                                  }`}>
                                    {vencedor.avatarNome}
                                  </h3>
                                  <div className="text-xs text-slate-500 mb-1">{vencedor.avatar.elemento}</div>
                                </div>

                                {/* Proprietário */}
                                <div className="mb-3 p-2 bg-slate-900/50 rounded-lg">
                                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Caçador</div>
                                  <div className="text-sm font-bold text-cyan-400">{vencedor.cacadorNome}</div>
                                </div>

                                {/* Votos */}
                                <div className="text-center">
                                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/70 border border-slate-700 rounded-full">
                                    <span className="text-pink-400">❤️</span>
                                    <span className="text-base font-black text-slate-300">{vencedor.votos}</span>
                                    <span className="text-xs text-slate-500">votos</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Mensagem caso não tenha campeões no ano selecionado */}
            {campeoes.filter(c => c.ano === anoSelecionado).length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-4 opacity-30">🏆</div>
                <p className="text-slate-500">Nenhum campeão registrado em {anoSelecionado}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Regras */}
      {modalRegras && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModalRegras(false)}
        >
          <div
            className="max-w-lg w-full bg-slate-950/95 border border-cyan-500/30 rounded-xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar - Mobile Optimized */}
            <button
              onClick={() => setModalRegras(false)}
              className="absolute top-2 right-2 z-10 min-w-[44px] min-h-[44px] w-11 h-11 bg-slate-900/80 hover:bg-cyan-900/80 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700/50 hover:border-cyan-500/50 active:scale-95"
              aria-label="Fechar"
            >
              ✕
            </button>
            <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 p-4 border-b border-cyan-500/30">
              <h3 className="text-xl font-black text-cyan-300">📜 REGRAS DO CAMPEONATO</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="text-cyan-400">•</span>
                  <span>Cada jogador tem <strong>1 voto por mês</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400">•</span>
                  <span>Você <strong>não pode votar</strong> em seus próprios avatares</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400">•</span>
                  <span>Categorias separadas: <strong>Comum, Raro, Lendário</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400">•</span>
                  <span>Premiação no <strong>último dia do mês</strong></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400">•</span>
                  <span>Apenas avatares <strong>vivos</strong> podem concorrer</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-cyan-400">•</span>
                  <span>Votos são <strong>públicos</strong> e permanentes</span>
                </li>
              </ul>
              <button
                onClick={() => setModalRegras(false)}
                className="w-full min-h-[48px] mt-6 px-4 py-3 bg-cyan-900/50 hover:bg-cyan-800/50 border border-cyan-500/50 rounded-lg text-cyan-400 font-bold transition-all active:scale-[0.98]"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prêmios */}
      {modalPremios && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModalPremios(false)}
        >
          <div
            className="max-w-lg w-full bg-slate-950/95 border border-amber-500/30 rounded-xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão Fechar - Mobile Optimized */}
            <button
              onClick={() => setModalPremios(false)}
              className="absolute top-2 right-2 z-10 min-w-[44px] min-h-[44px] w-11 h-11 bg-slate-900/80 hover:bg-amber-900/80 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all border border-slate-700/50 hover:border-amber-500/50 active:scale-95"
              aria-label="Fechar"
            >
              ✕
            </button>
            <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 p-4 border-b border-amber-500/30">
              <h3 className="text-xl font-black text-amber-300">🏆 PREMIAÇÃO</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Prêmio Lendário */}
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🥇</span>
                    <div>
                      <div className="font-bold text-amber-400">1º Lugar - Lendário</div>
                      <div className="text-xs text-slate-400">O mais belo dos lendários</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-amber-300">500 💎 + 5.000 💰</div>
                </div>

                {/* Prêmio Raro */}
                <div className="bg-purple-950/30 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🥇</span>
                    <div>
                      <div className="font-bold text-purple-400">1º Lugar - Raro</div>
                      <div className="text-xs text-slate-400">O mais belo dos raros</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-purple-300">300 💎 + 3.000 💰</div>
                </div>

                {/* Prêmio Comum */}
                <div className="bg-gray-950/30 border border-gray-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🥇</span>
                    <div>
                      <div className="font-bold text-gray-400">1º Lugar - Comum</div>
                      <div className="text-xs text-slate-400">O mais belo dos comuns</div>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gray-300">150 💎 + 1.500 💰</div>
                </div>

                <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-800">
                  Prêmios distribuídos automaticamente no último dia do mês
                </div>
              </div>
              <button
                onClick={() => setModalPremios(false)}
                className="w-full min-h-[48px] mt-6 px-4 py-3 bg-amber-900/50 hover:bg-amber-800/50 border border-amber-500/50 rounded-lg text-amber-400 font-bold transition-all active:scale-[0.98]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
