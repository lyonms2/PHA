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
      descricao: 'Batalhe contra avatares de outros jogadores controlados por IA',
      detalhes: 'Sistema de IA inteligente que simula batalhas realistas contra avatares reais. Ganhe ou perca Fama em combates estratégicos!',
      recursos: [
        'IA com 5 personalidades diferentes',
        'Avatares reais de outros jogadores',
        'Sistema de Fama e Rankings',
        '🧪 MODO TESTE - Sem morte permanente',
        'Mecânicas de Render e Fuga'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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

              <div className="relative p-4">
                {/* Emoji */}
                <div className={`text-4xl md:text-5xl mb-3 ${modo.disponivel ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                  {modo.emoji}
                </div>

                {/* Nome */}
                <h2 className="text-xl md:text-2xl font-black text-white mb-1">
                  {modo.nome}
                </h2>

                {/* Descrição */}
                <p className="text-sm text-slate-300 font-semibold mb-2">
                  {modo.descricao}
                </p>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {modo.detalhes}
                </p>

                {/* Recursos */}
                <div className="space-y-1 mb-4">
                  {modo.recursos.map((recurso, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <div className={`w-1 h-1 rounded-full ${modo.disponivel ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
                      <span className="text-slate-400">{recurso}</span>
                    </div>
                  ))}
                </div>

                {/* Botão */}
                {modo.disponivel ? (
                  <div className={`bg-gradient-to-r ${modo.cor} text-white font-black py-2 px-4 rounded-lg text-sm text-center uppercase tracking-wider group-hover:shadow-lg transition-shadow`}>
                    Entrar →
                  </div>
                ) : (
                  <div className="bg-slate-800 text-slate-500 font-black py-2 px-4 rounded-lg text-sm text-center uppercase tracking-wider">
                    Bloqueado
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Dicas de Combate */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
            <h3 className="text-base font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <span>💡</span> Dicas de Combate
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">▸</span>
                <span><strong>Gestão de Energia:</strong> "Esperar" restaura +30 energia, "Defender" +15 e reduz dano recebido em 40%.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">▸</span>
                <span><strong>Vantagem Elemental:</strong> Fogo &gt; Terra &gt; Vento &gt; Água &gt; Fogo. Eletricidade/Luz/Sombra são neutros.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">▸</span>
                <span><strong>Habilidades:</strong> Cada avatar tem 3 habilidades únicas baseadas em seu elemento e raridade.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">▸</span>
                <span><strong>Exaustão:</strong> Acima de 60% reduz Força/Resistência em 30%. Acima de 80% reduz em 50%!</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">▸</span>
                <span><strong>No PvP:</strong> Use "Render-se" para fugir quando HP &lt; 30% e evitar penalidades maiores.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">▸</span>
                <span><strong>Treinamento:</strong> Comece em "Fácil" para aprender mecânicas, depois suba a dificuldade.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
