"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameNav from '../components/GameNav';

export default function ArenaLobby() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [penalidadeAplicada, setPenalidadeAplicada] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Verificar e aplicar penalidade de batalha abandonada
    const verificarBatalhaAbandonada = async () => {
      try {
        const response = await fetch(`/api/batalha/ativa?userId=${parsedUser.id}`);
        const data = await response.json();

        if (data.temBatalhaAtiva || data.batalhaExpirada) {
          // Aplicar penalidade
          const penResponse = await fetch('/api/batalha/ativa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: parsedUser.id,
              acao: 'aplicar_penalidade'
            })
          });

          const penData = await penResponse.json();

          if (penData.penalidadeAplicada) {
            setPenalidadeAplicada(penData.penalidadeAplicada);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar batalha abandonada:', error);
      }
    };

    verificarBatalhaAbandonada();
  }, [router]);

  const modos = [
    {
      id: 'treinamento',
      nome: 'Treinamento',
      emoji: '🎯',
      descricao: 'Lute contra IA em diferentes dificuldades',
      detalhes: 'Ganhe XP, moedas e fragmentos. Teste suas habilidades contra adversários controlados por IA com diferentes níveis de dificuldade.',
      recursos: [
        '4 níveis de dificuldade',
        'IA inteligente e adaptativa',
        'Recompensas balanceadas',
        'Sem risco de perda permanente'
      ],
      cor: 'from-green-600 to-green-800',
      corBorda: 'border-green-500',
      corBg: 'bg-green-900/10',
      corHover: 'hover:border-green-400',
      disponivel: true,
      rota: '/arena/treinamento'
    },
    {
      id: 'pvp',
      nome: 'Arena PvP',
      emoji: '⚔️',
      descricao: 'Enfrente outros jogadores em duelos táticos',
      detalhes: 'Combates PvP assíncronos contra avatares reais de outros jogadores. Ganhe ou perca Fama em batalhas estratégicas!',
      recursos: [
        'Salas divididas por poder total',
        'Avatares reais de outros jogadores',
        'Sistema de Fama e Rankings',
        '🧪 MODO TESTE - Sem morte permanente',
        'Sistema de Sinergias entre avatares'
      ],
      cor: 'from-red-600 to-red-800',
      corBorda: 'border-red-500',
      corBg: 'bg-red-900/10',
      corHover: 'hover:border-red-400',
      disponivel: true,
      rota: '/arena/pvp'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-gray-100 scrollbar-fire">
      {/* Navegação padronizada */}
      <GameNav
        backTo="/dashboard"
        backLabel="DASHBOARD"
        title="ARENA DE COMBATE"
        subtitle="Escolha seu modo de jogo e prove seu valor"
      />

      {/* Aviso de penalidade por abandono */}
      {penalidadeAplicada && (
        <div className="max-w-4xl mx-auto px-6 mt-4">
          <div className="bg-red-950/50 border border-red-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-bold text-red-400">Batalha Abandonada!</div>
                <div className="text-sm text-red-300">
                  Você abandonou uma batalha. Penalidade aplicada: -{penalidadeAplicada.hp_perdido} HP, +{penalidadeAplicada.exaustao}% Exaustão
                </div>
              </div>
              <button
                onClick={() => setPenalidadeAplicada(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-3 py-4">

        {/* Modos de Jogo */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {modos.map((modo) => (
            <button
              key={modo.id}
              onClick={() => modo.disponivel && router.push(modo.rota)}
              disabled={!modo.disponivel}
              className={`relative group text-left overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                modo.disponivel
                  ? `${modo.corBorda} ${modo.corBg} ${modo.corHover} hover:scale-105 hover:shadow-2xl cursor-pointer`
                  : 'border-slate-700 bg-slate-900/30 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Glow effect */}
              {modo.disponivel && (
                <div className={`absolute inset-0 bg-gradient-to-br ${modo.cor} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
              )}

              <div className="relative p-6">
                {/* Emoji */}
                <div className={`text-5xl md:text-6xl mb-4 ${modo.disponivel ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                  {modo.emoji}
                </div>

                {/* Nome */}
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                  {modo.nome}
                </h2>

                {/* Descrição */}
                <p className="text-base text-slate-300 font-semibold mb-3">
                  {modo.descricao}
                </p>

                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  {modo.detalhes}
                </p>

                {/* Recursos */}
                <div className="space-y-2 mb-5">
                  {modo.recursos.map((recurso, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className={`w-1.5 h-1.5 rounded-full ${modo.disponivel ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
                      <span className="text-slate-300">{recurso}</span>
                    </div>
                  ))}
                </div>

                {/* Botão */}
                {modo.disponivel ? (
                  <div className={`bg-gradient-to-r ${modo.cor} text-white font-black py-3 px-6 rounded-lg text-base text-center uppercase tracking-wider group-hover:shadow-lg transition-shadow`}>
                    Entrar →
                  </div>
                ) : (
                  <div className="bg-slate-800 text-slate-500 font-black py-3 px-6 rounded-lg text-base text-center uppercase tracking-wider">
                    Bloqueado
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Dicas de Combate */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <span>💡</span> Dicas de Combate
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 text-sm">⚔️</span>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Ataque Básico:</strong> Custa 10 de energia. Use quando quiser economizar energia das habilidades.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 text-sm">🛡️</span>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Defender:</strong> Reduz 40% do dano recebido no próximo turno. Ótimo para aguentar ataques fortes!
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 text-sm">🔥</span>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Elementos:</strong> Fogo → Terra → Vento → Água → Fogo. Vantagem causa +50% de dano!
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 text-sm">✨</span>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Sinergias:</strong> No PVP, escolha um avatar suporte para ativar modificadores poderosos!
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 text-sm">🧪</span>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Poções de HP:</strong> Use até 2 poções por batalha através do botão "Itens". Não consome energia!
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 text-sm">⏱️</span>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Cooldowns:</strong> Habilidades fortes têm tempo de recarga. Planeje suas ações!
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 text-sm">😰</span>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Exaustão:</strong> Recupera 5 pts/hora. Acima de 60% reduz stats em 30%, acima de 80% reduz 50%!
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5 text-sm">🎯</span>
                <div className="text-sm text-slate-300">
                  <strong className="text-white">Treinamento:</strong> Comece no Fácil, suba gradualmente. Sem morte permanente!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
