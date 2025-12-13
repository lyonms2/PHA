"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarSVG from '../components/AvatarSVG';
import AvatarDetalhes from "./components/AvatarDetalhes";
import GameNav, { COMMON_ACTIONS } from '../components/GameNav';
import { calcularPoderTotal } from '@/lib/gameLogic';
import {
  getCorRaridade,
  getCorBorda,
  getCorElemento,
  getEmojiElemento,
  getNivelExaustao,
  filtrarAvataresSemMemorial,
  aplicarFiltros,
  ordenarAvatares,
  contarAvataresCaidos,
  calcularSlots
} from './utils';
import { calcularXPNecessario } from './sistemas/progressionSystem';
import {
  useAvatarOperations,
  useAvatarModals,
  useAvatarFilters
} from './hooks';

export default function AvatarsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatarSelecionado, setAvatarSelecionado] = useState(null);

  // Hooks customizados
  const {
    modalConfirmacao,
    modalLevelUp,
    modalSacrificar,
    modalVender,
    precoVendaMoedas,
    precoVendaFragmentos,
    setModalConfirmacao,
    setModalLevelUp,
    setModalSacrificar,
    setModalVender,
    setPrecoVendaMoedas,
    setPrecoVendaFragmentos
  } = useAvatarModals();

  const {
    filtroRaridade,
    filtroElemento,
    filtroStatus,
    ordenacao,
    setFiltroRaridade,
    setFiltroElemento,
    setFiltroStatus,
    setOrdenacao
  } = useAvatarFilters();

  const {
    avatares,
    loading,
    ativando,
    sacrificando,
    vendendo,
    carregarAvatares,
    ativarAvatar,
    sacrificarAvatar,
    venderAvatar,
    cancelarVenda
  } = useAvatarOperations(user, setModalConfirmacao, setModalLevelUp);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    carregarAvatares(parsedUser.id);

    // Recarregar avatares quando a página volta a ficar visível
    const handleVisibilityChange = () => {
      if (!document.hidden && parsedUser?.id) {
        console.log('🔄 Página visível novamente - recarregando avatares...');
        carregarAvatares(parsedUser.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Auto-refresh a cada 5 minutos para recuperação de exaustão
    console.log('⏰ Auto-refresh configurado: recarregando a cada 5 minutos');
    const intervalId = setInterval(() => {
      if (parsedUser?.id) {
        console.log('🔄 Auto-refresh: recarregando avatares...');
        carregarAvatares(parsedUser.id);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const avatarAtivo = avatares.find(av => av.ativo && av.vivo);

  // Filtrar avatares (EXCLUINDO mortos com marca_morte que estão no memorial)
  let avataresFiltrados = filtrarAvataresSemMemorial(avatares);

  // Aplicar filtros
  avataresFiltrados = aplicarFiltros(avataresFiltrados, {
    filtroRaridade,
    filtroElemento,
    filtroStatus
  });

  // Aplicar ordenação
  avataresFiltrados = ordenarAvatares(avataresFiltrados, ordenacao);

  // Separar ativo dos inativos
  const avataresInativos = avataresFiltrados.filter(av => !av.ativo || !av.vivo);

  // Contar avatares caídos (para o botão memorial)
  const avataresCaidos = contarAvataresCaidos(avatares);

  // Sistema de limite de avatares
  const LIMITE_AVATARES = 15;
  const { usados: slotsUsados, disponiveis: slotsDisponiveis, percentual: percentualOcupado } = calcularSlots(avatares, LIMITE_AVATARES);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando coleção...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 relative overflow-hidden">
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl top-20 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/5 rounded-full blur-3xl bottom-20 -right-48 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Grid hexagonal */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTYiIGhlaWdodD0iMTAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yOCAwTDAgMTVWMzVMMjggNTBMNTYgMzVWMTVaTTI4IDUwTDAgNjVWODVMMjggMTAwTDU2IDg1VjY1WiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY3lhbiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] pointer-events-none"></div>

      {/* Vinheta */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none"></div>

      {/* Navegação padronizada */}
      <GameNav
        backTo="/dashboard"
        backLabel="DASHBOARD"
        title="MINHA COLEÇÃO"
        subtitle={`${avatares.length} Avatares | ${avatares.filter(a => a.vivo).length} Vivos`}
        compact={true}
        actions={[
          COMMON_ACTIONS.arena,
          COMMON_ACTIONS.mercado,
          COMMON_ACTIONS.inventario,
          COMMON_ACTIONS.fusao,
          COMMON_ACTIONS.invocar,
          COMMON_ACTIONS.necromante,
          COMMON_ACTIONS.purificador,
          ...(avataresCaidos > 0 ? [{ ...COMMON_ACTIONS.memorial, label: `MEMORIAL (${avataresCaidos})` }] : [])
        ]}
      />

      <div className="relative z-10 container mx-auto px-4 py-6 max-w-7xl">
        {/* Contador de Slots */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono text-sm font-bold ${
              percentualOcupado >= 100 ? 'text-red-400' :
              percentualOcupado >= 80 ? 'text-orange-400' :
              'text-cyan-400'
            }`}>
              📦 Slots: {slotsUsados}/{LIMITE_AVATARES}
            </span>
            {slotsDisponiveis > 0 && slotsDisponiveis <= 3 && (
              <span className="text-[10px] text-orange-400 font-bold animate-pulse">
                ⚠️ Quase cheio!
              </span>
            )}
            {slotsDisponiveis === 0 && (
              <span className="text-[10px] text-red-400 font-bold animate-pulse">
                🚫 LIMITE ATINGIDO
              </span>
            )}
          </div>
          <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                percentualOcupado >= 100 ? 'bg-red-500' :
                percentualOcupado >= 80 ? 'bg-orange-500' :
                percentualOcupado >= 60 ? 'bg-yellow-500' :
                'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(percentualOcupado, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-1">
            * Avatares no memorial não ocupam slots
          </p>
        </div>

        {/* Avatar Ativo (COMPACTO) */}
        {avatarAtivo && (
          <div className="mb-6">
            <div className="bg-gradient-to-r from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-lg p-4">
              <div className="flex items-center gap-6">
                {/* Avatar SVG pequeno */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur"></div>
                    <div className="relative bg-slate-900/50 rounded-full p-2 border border-cyan-500/30">
                      <AvatarSVG avatar={avatarAtivo} tamanho={80} />
                    </div>
                  </div>
                </div>

                {/* Info Compacta */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">AVATAR ATIVO</div>
                    <div className="font-bold text-cyan-300 text-lg">{avatarAtivo.nome}</div>
                    <div className="text-xs text-slate-400 mb-1">{avatarAtivo.elemento} • Nv.{avatarAtivo.nivel}</div>
                    {/* Barra de XP */}
                    <div className="mt-1">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1">
                        <span>XP: {avatarAtivo.xp || 0}/{calcularXPNecessario(avatarAtivo.nivel)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${Math.min(((avatarAtivo.xp || 0) / calcularXPNecessario(avatarAtivo.nivel)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">HP</div>
                    <div className="text-sm font-semibold text-green-400">
                      {avatarAtivo.hp_atual || 0} / {(avatarAtivo.resistencia * 10) + (avatarAtivo.nivel * 5) + (avatarAtivo.raridade === 'Lendário' ? 100 : avatarAtivo.raridade === 'Raro' ? 50 : 0)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">VÍNCULO</div>
                    <div className="text-sm font-semibold text-purple-400">{avatarAtivo.vinculo}%</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 mb-1">EXAUSTÃO</div>
                    <div className={`text-sm font-semibold ${getNivelExaustao(avatarAtivo.exaustao || 0).cor}`}>
                      {avatarAtivo.exaustao || 0}/100
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setAvatarSelecionado(avatarAtivo)}
                  className="flex-shrink-0 px-4 py-2 bg-cyan-900/30 hover:bg-cyan-800/40 border border-cyan-500/30 rounded-lg transition-all text-sm font-semibold text-cyan-400"
                >
                  DETALHES
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Raridade */}
            <select
              value={filtroRaridade}
              onChange={(e) => setFiltroRaridade(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Todos">Todas Raridades</option>
              <option value="Comum">Comum</option>
              <option value="Raro">Raro</option>
              <option value="Lendário">Lendário</option>
            </select>

            {/* Elemento */}
            <select
              value={filtroElemento}
              onChange={(e) => setFiltroElemento(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Todos">Todos Elementos</option>
              <option value="Fogo">🔥 Fogo</option>
              <option value="Água">💧 Água</option>
              <option value="Terra">🪨 Terra</option>
              <option value="Vento">💨 Vento</option>
              <option value="Eletricidade">⚡ Eletricidade</option>
              <option value="Sombra">🌑 Sombra</option>
              <option value="Luz">✨ Luz</option>
            </select>

            {/* Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="Todos">Todos Status</option>
              <option value="Vivos">Vivos</option>
              <option value="Mortos">Mortos</option>
              <option value="Com Marca">Com Marca Morte</option>
            </select>

            {/* Ordenação */}
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="nivel_desc">Nível (Maior→Menor)</option>
              <option value="nivel_asc">Nível (Menor→Maior)</option>
              <option value="nome_asc">Nome (A→Z)</option>
              <option value="raridade">Raridade</option>
            </select>

            {/* Limpar Filtros */}
            <button
              onClick={() => {
                setFiltroRaridade('Todos');
                setFiltroElemento('Todos');
                setFiltroStatus('Todos');
                setOrdenacao('nivel_desc');
              }}
              className="px-3 py-2 bg-red-900/30 hover:bg-red-800/40 border border-red-500/30 rounded text-sm font-semibold text-red-400 transition-all"
            >
              LIMPAR
            </button>
          </div>

          <div className="mt-3 text-xs text-slate-500 font-mono">
            Mostrando {avataresInativos.length} {avataresInativos.length === 1 ? 'avatar' : 'avatares'}
          </div>
        </div>

        {/* Lista de Avatares */}
        {avataresInativos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-20">🔍</div>
            <h3 className="text-xl font-bold text-slate-400 mb-2">Nenhum avatar encontrado</h3>
            <p className="text-slate-500 text-sm">Tente ajustar os filtros ou invoque novos avatares!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {avataresInativos.map((avatar) => (
              <div
                key={avatar.id}
                className="group relative"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${getCorRaridade(avatar.raridade)} rounded-lg blur opacity-20 group-hover:opacity-40 transition-all`}></div>

                <div className={`relative bg-slate-900/80 backdrop-blur-xl border ${getCorBorda(avatar.raridade)} rounded-lg overflow-hidden group-hover:border-opacity-100 transition-all`}>
                  {/* Badge Raridade */}
                  <div className={`px-3 py-1.5 text-center font-bold text-xs bg-gradient-to-r ${getCorRaridade(avatar.raridade)}`}>
                    {avatar.raridade.toUpperCase()}
                  </div>

                  {/* Avatar */}
                  <div className={`py-4 flex items-center justify-center ${!avatar.vivo ? 'opacity-40 grayscale' : ''}`}>
                    <AvatarSVG avatar={avatar} tamanho={120} />
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-white mb-1 truncate">{avatar.nome}</h3>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <span className={getCorElemento(avatar.elemento)}>{getEmojiElemento(avatar.elemento)} {avatar.elemento}</span>
                      <span>Nv.{avatar.nivel}</span>
                    </div>

                    {/* HP, Poder e Exaustão */}
                    <div className="space-y-1 mb-2 pb-2 border-b border-slate-700/50">
                      {/* HP */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-red-400">❤️ HP</span>
                        <span className="font-mono text-slate-300">{avatar.hp_atual || 0}/{(avatar.resistencia * 10) + (avatar.nivel * 5)}</span>
                      </div>
                      {/* Poder Total */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-cyan-400">⚔️ Poder</span>
                        <span className="font-mono text-slate-300">{calcularPoderTotal(avatar)}</span>
                      </div>
                      {/* Exaustão */}
                      {(avatar.exaustao || 0) > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-orange-400">😰 Exaustão</span>
                          <span className={`font-mono ${
                            (avatar.exaustao || 0) < 40 ? 'text-green-400' :
                            (avatar.exaustao || 0) < 70 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>{avatar.exaustao || 0}%</span>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {!avatar.vivo && (
                        <span className="px-2 py-0.5 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-400">
                          ☠️ Morto
                        </span>
                      )}
                      {avatar.marca_morte && (
                        <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-500/30 rounded text-xs text-purple-400">
                          💀 Marca
                        </span>
                      )}
                      {avatar.em_venda && (
                        <span className="px-2 py-0.5 bg-amber-900/30 border border-amber-500/30 rounded text-xs text-amber-400 animate-pulse">
                          🏪 À Venda
                        </span>
                      )}
                    </div>

                    {/* Botões */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAvatarSelecionado(avatar)}
                          className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-semibold text-slate-300 transition-all"
                        >
                          VER
                        </button>
                        {avatar.vivo && !avatar.ativo && (
                          <button
                            onClick={() => ativarAvatar(avatar.id, avatar.nome)}
                            disabled={ativando}
                            className="flex-1 px-3 py-1.5 bg-cyan-900/30 hover:bg-cyan-800/40 border border-cyan-500/30 rounded text-xs font-semibold text-cyan-400 transition-all disabled:opacity-50"
                          >
                            ATIVAR
                          </button>
                        )}
                      </div>

                      {/* Botão Sacrificar - Apenas para avatares vivos e inativos */}
                      {avatar.vivo && !avatar.ativo && !avatar.em_venda && (
                        <button
                          onClick={() => setModalSacrificar(avatar)}
                          className="w-full px-2 py-1 bg-red-950/20 hover:bg-red-900/30 border border-red-900/30 hover:border-red-800/50 rounded text-xs font-semibold text-red-500/70 hover:text-red-400 transition-all"
                        >
                          ⚠️ Sacrificar
                        </button>
                      )}

                      {/* Botão Vender - Apenas para avatares vivos, inativos, sem marca_morte e não em venda */}
                      {avatar.vivo && !avatar.ativo && !avatar.marca_morte && !avatar.em_venda && (
                        <button
                          onClick={() => {
                            setModalVender(avatar);
                            setPrecoVendaMoedas('');
                            setPrecoVendaFragmentos('');
                          }}
                          className="w-full px-2 py-1 bg-amber-950/20 hover:bg-amber-900/30 border border-amber-900/30 hover:border-amber-800/50 rounded text-xs font-semibold text-amber-500/70 hover:text-amber-400 transition-all"
                        >
                          🏪 Vender
                        </button>
                      )}

                      {/* Botão Cancelar Venda - Para avatares em venda */}
                      {avatar.em_venda && (
                        <button
                          onClick={() => cancelarVenda(avatar)}
                          className="w-full px-2 py-1 bg-slate-950/20 hover:bg-slate-900/30 border border-slate-700/30 hover:border-slate-600/50 rounded text-xs font-semibold text-slate-400/70 hover:text-slate-300 transition-all"
                        >
                          ✖️ Cancelar Venda
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detalhes */}
      {avatarSelecionado && (
        <AvatarDetalhes
          avatar={avatarSelecionado}
          onClose={() => setAvatarSelecionado(null)}
          onAtivar={(id, nome) => {
            ativarAvatar(id, nome);
            setAvatarSelecionado(null);
          }}
          getCorRaridade={getCorRaridade}
          getCorBorda={getCorBorda}
          getCorElemento={getCorElemento}
          getEmojiElemento={getEmojiElemento}
          userId={user?.id}
          onRename={(avatarId, novoNome) => {
            // Atualizar o nome no estado local
            setAvatares(prev => prev.map(av =>
              av.id === avatarId ? { ...av, nome: novoNome } : av
            ));
            // Atualizar o avatar selecionado também
            setAvatarSelecionado(prev =>
              prev && prev.id === avatarId ? { ...prev, nome: novoNome } : prev
            );
            // Mostrar confirmação
            setModalConfirmacao({
              tipo: 'sucesso',
              mensagem: `Avatar renomeado para "${novoNome}"!`
            });
            setTimeout(() => setModalConfirmacao(null), 3000);
          }}
        />
      )}

      {/* Modal de Sacrifício */}
      {modalSacrificar && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4"
          onClick={() => !sacrificando && setModalSacrificar(null)}
        >
          <div className="min-h-full flex items-center justify-center py-8">
            <div
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600/40 via-orange-600/40 to-red-600/40 rounded-lg blur opacity-75 animate-pulse"></div>

                <div className="relative bg-slate-950/95 backdrop-blur-xl border-2 border-red-900/50 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-red-900/80 to-orange-900/80 p-4 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
                    <div className="relative">
                      <div className="text-5xl mb-2 animate-pulse">⚠️</div>
                      <h2 className="text-xl font-black uppercase tracking-wider text-red-200">
                        Ritual de Sacrifício
                      </h2>
                      <p className="text-xs text-red-300/80 font-mono mt-1">
                        Esta ação é irreversível
                      </p>
                    </div>
                  </div>

                  {/* Botão Fechar */}
                  <button
                    onClick={() => setModalSacrificar(null)}
                    disabled={sacrificando}
                    className="absolute top-3 right-3 w-8 h-8 bg-slate-900/80 hover:bg-red-900/80 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-20 border border-slate-700/50 hover:border-red-500/50 disabled:opacity-50"
                  >
                    ✕
                  </button>

                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Coluna Esquerda - Avatar e Lore */}
                      <div className="space-y-4">
                        {/* Avatar Preview */}
                        <div className="bg-slate-900/70 rounded-lg p-6 aspect-square border-2 border-red-900/50 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5"></div>
                          <div className="relative">
                            <div className="absolute -inset-2 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-full blur"></div>
                            <div className="relative">
                              <AvatarSVG avatar={modalSacrificar} tamanho={200} />
                            </div>
                          </div>
                        </div>

                        {/* Nome e Info */}
                        <div className="text-center">
                          <h3 className="text-2xl font-black mb-2 text-white">
                            {modalSacrificar.nome}
                          </h3>
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-slate-300">
                              {getEmojiElemento(modalSacrificar.elemento)} {modalSacrificar.elemento}
                            </span>
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-slate-300">
                              {modalSacrificar.raridade}
                            </span>
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm font-mono text-slate-300">
                              Nv.{modalSacrificar.nivel}
                            </span>
                          </div>
                        </div>

                        {/* Lore Text */}
                        <div className="bg-gradient-to-br from-red-950/40 to-orange-950/40 rounded-lg p-4 border border-red-900/50">
                          <div className="text-xs text-red-400 font-bold uppercase mb-2 tracking-wider">⚠️ Aviso do Vazio</div>
                          <p className="text-sm text-red-200/90 leading-relaxed italic">
                            "Nas profundezas da Organização de Caçadores Dimensionais, existe um ritual sombrio reservado apenas para os mais desesperados.
                            <span className="block mt-2 font-bold text-red-300">
                              Ao sacrificar um avatar, sua essência é consumida pelo Vazio Dimensional, e sua alma é enviada ao Memorial Eterno.
                            </span>
                            <span className="block mt-2 text-red-400/80">
                              Uma vez realizado, não há retorno. Nem mesmo o Necromante mais poderoso pode trazer de volta o que foi entregue ao Vazio.
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Coluna Direita - Avisos e Confirmação */}
                      <div className="space-y-4">
                        {/* Stats do Avatar */}
                        <div>
                          <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-3">O que será perdido</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Força</div>
                              <div className="text-2xl font-bold text-red-400">{modalSacrificar.forca}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Agilidade</div>
                              <div className="text-2xl font-bold text-green-400">{modalSacrificar.agilidade}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Resistência</div>
                              <div className="text-2xl font-bold text-blue-400">{modalSacrificar.resistencia}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-red-500/30">
                              <div className="text-xs text-slate-500 uppercase mb-1">Foco</div>
                              <div className="text-2xl font-bold text-purple-400">{modalSacrificar.foco}</div>
                            </div>
                          </div>
                        </div>

                        {/* Poder Total */}
                        <div className="bg-gradient-to-r from-red-950/50 to-orange-950/50 rounded-lg p-4 border border-red-600/50">
                          <div className="text-center">
                            <div className="text-xs text-red-400 uppercase mb-1">Poder Total Perdido</div>
                            <div className="text-3xl font-black text-red-300">
                              {calcularPoderTotal(modalSacrificar)}
                            </div>
                            <div className="text-[10px] text-red-500 mt-1">
                              XP: {modalSacrificar.xp || 0} | Vínculo: {modalSacrificar.vinculo}%
                            </div>
                          </div>
                        </div>

                        {/* Warnings */}
                        <div>
                          <h4 className="text-red-400 font-bold text-xs uppercase tracking-wider mb-3">Consequências</h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                              <span className="text-xl">💀</span>
                              <div className="flex-1">
                                <div className="font-bold text-red-300 text-xs">Morte Permanente</div>
                                <div className="text-[10px] text-red-400/80">Marcado com a Marca da Morte e enviado ao Memorial</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                              <span className="text-xl">⛔</span>
                              <div className="flex-1">
                                <div className="font-bold text-red-300 text-xs">Sem Ressurreição</div>
                                <div className="text-[10px] text-red-400/80">Necromante e Purificador não podem reverter</div>
                              </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-red-950/30 rounded border border-red-900/50">
                              <span className="text-xl">🌑</span>
                              <div className="flex-1">
                                <div className="font-bold text-red-300 text-xs">Consumido pelo Vazio</div>
                                <div className="text-[10px] text-red-400/80">Todas habilidades e progresso perdidos</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Confirmation Question */}
                        <div className="bg-gradient-to-r from-slate-900/80 to-red-950/80 rounded-lg p-4 border-2 border-red-600/50">
                          <p className="text-center font-bold text-red-200 text-sm">
                            Você realmente deseja sacrificar {modalSacrificar.nome}?
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => setModalSacrificar(null)}
                            disabled={sacrificando}
                            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => sacrificarAvatar(modalSacrificar, setModalSacrificar)}
                            disabled={sacrificando}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-red-900/50"
                          >
                            {sacrificando ? 'Sacrificando...' : '💀 Confirmar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Venda */}
      {modalVender && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !vendendo && setModalVender(null)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 to-yellow-500/30 rounded-lg blur opacity-75"></div>

              <div className="relative bg-slate-950/95 backdrop-blur-xl border border-amber-900/50 rounded-lg overflow-hidden">
                <div className="p-4 text-center font-bold text-lg bg-gradient-to-r from-amber-600 to-yellow-600">
                  🏪 Colocar à Venda
                </div>

                <div className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{modalVender.nome}</h3>
                    <p className="text-sm text-slate-400">
                      {modalVender.raridade} • {modalVender.elemento} • Nv.{modalVender.nivel}
                    </p>
                  </div>

                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-mono text-slate-400 mb-2">
                        Preço em Moedas (opcional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        value={precoVendaMoedas}
                        onChange={(e) => setPrecoVendaMoedas(e.target.value)}
                        placeholder="0 a 10.000 moedas"
                        className="w-full px-4 py-3 bg-slate-900 border border-amber-500/30 rounded text-white text-center text-lg font-bold focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-mono text-slate-400 mb-2">
                        Preço em Fragmentos (opcional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={precoVendaFragmentos}
                        onChange={(e) => setPrecoVendaFragmentos(e.target.value)}
                        placeholder="0 a 500 fragmentos"
                        className="w-full px-4 py-3 bg-slate-900 border border-purple-500/30 rounded text-white text-center text-lg font-bold focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <p className="text-xs text-slate-500 text-center font-mono">
                      O mercado cobra 5% de taxa nas moedas (sem taxa nos fragmentos)
                    </p>

                    {/* Aviso sobre reset de vínculo */}
                    {modalVender.vinculo > 0 && (
                      <div className="mt-4 p-3 bg-orange-950/30 border border-orange-900/30 rounded-lg">
                        <p className="text-xs text-orange-400 font-mono text-center">
                          ⚠️ <span className="font-bold">Aviso:</span> Ao ser vendido, o avatar terá seu vínculo resetado de {modalVender.vinculo} para 0
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setModalVender(null)}
                      disabled={vendendo}
                      className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => venderAvatar(modalVender, precoVendaMoedas, precoVendaFragmentos, setModalVender, setPrecoVendaMoedas, setPrecoVendaFragmentos)}
                      disabled={vendendo}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      {vendendo ? 'Vendendo...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Level Up */}
      {modalLevelUp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="relative max-w-md w-full">
            {/* Efeitos de fundo */}
            <div className="absolute -inset-4">
              <div className="w-full h-full bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
            </div>

            {/* Conteúdo do modal */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-yellow-500/50 p-8 shadow-2xl">
              {/* Título com animação */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 mb-2">
                  LEVEL UP!
                </h2>
                <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-yellow-500 to-transparent rounded-full"></div>
              </div>

              {/* Info do Avatar */}
              <div className="bg-slate-950/50 rounded-xl p-6 mb-6 border border-yellow-500/30">
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/50 to-orange-500/50 rounded-full blur"></div>
                    <div className="relative bg-slate-900 rounded-full p-2 border-2 border-yellow-500">
                      <AvatarSVG avatar={modalLevelUp} tamanho={64} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold text-yellow-300">{modalLevelUp.nome}</div>
                    <div className="text-sm text-slate-400">{modalLevelUp.elemento}</div>
                  </div>
                </div>

                {/* Nível anterior -> Novo */}
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 mb-1">Nível Anterior</div>
                    <div className="text-3xl font-black text-slate-400">{(modalLevelUp.nivel || 1) - 1}</div>
                  </div>
                  <div className="text-4xl text-yellow-500">→</div>
                  <div className="text-center">
                    <div className="text-sm text-yellow-400 mb-1">Novo Nível</div>
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                      {modalLevelUp.nivel || 1}
                    </div>
                  </div>
                </div>

                {/* Stats aumentados */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-3 text-center">
                    ✨ Atributos Melhorados
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-900/50 rounded px-3 py-2 text-center">
                      <div className="text-slate-400">⚔️ Força</div>
                      <div className="text-red-400 font-bold">
                        {modalLevelUp.forca || 10}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded px-3 py-2 text-center">
                      <div className="text-slate-400">⚡ Agilidade</div>
                      <div className="text-yellow-400 font-bold">
                        {modalLevelUp.agilidade || 10}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded px-3 py-2 text-center">
                      <div className="text-slate-400">🛡️ Resistência</div>
                      <div className="text-blue-400 font-bold">
                        {modalLevelUp.resistencia || 10}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded px-3 py-2 text-center">
                      <div className="text-slate-400">🎯 Foco</div>
                      <div className="text-purple-400 font-bold">
                        {modalLevelUp.foco || 10}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded px-3 py-2 text-center col-span-2">
                      <div className="text-slate-400">💚 HP Máximo</div>
                      <div className="text-green-400 font-bold">
                        {Math.floor(50 + ((modalLevelUp.resistencia || 10) * 5) + ((modalLevelUp.nivel || 1) * 3))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão fechar */}
              <button
                onClick={() => setModalLevelUp(null)}
                className="w-full py-4 bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 hover:from-yellow-500 hover:via-orange-500 hover:to-yellow-500 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg"
              >
                🎊 Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Confirmação */}
      {modalConfirmacao && (
        <div className="fixed top-8 right-8 z-50 animate-fade-in">
          <div className={`px-6 py-4 rounded-lg border-2 ${
            modalConfirmacao.tipo === 'sucesso'
              ? 'bg-green-900/90 border-green-500'
              : 'bg-red-900/90 border-red-500'
          } backdrop-blur-xl`}>
            <p className={`font-semibold ${
              modalConfirmacao.tipo === 'sucesso' ? 'text-green-200' : 'text-red-200'
            }`}>
              {modalConfirmacao.mensagem}
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
