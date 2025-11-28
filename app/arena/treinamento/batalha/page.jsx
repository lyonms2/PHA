"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateDocument, getDocument } from "@/lib/firebase/firestore";

export default function BatalhaTreinoIA() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [battleId, setBattleId] = useState(null);
  const [battle, setBattle] = useState(null);
  const [log, setLog] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  // Inicializar batalha
  useEffect(() => {
    const iniciarBatalha = async () => {
      try {
        // Pegar dados do sessionStorage
        const dadosJSON = sessionStorage.getItem('treino_ia_dados');
        if (!dadosJSON) {
          setErro('Dados de treino não encontrados');
          return;
        }

        const dados = JSON.parse(dadosJSON);
        const { playerAvatar, oponente, personalidadeIA, dificuldade } = dados;

        // Inicializar batalha via API
        const response = await fetch('/api/arena/treino-ia/batalha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'init',
            playerAvatar,
            iaAvatar: oponente,
            personalidadeIA
          })
        });

        const result = await response.json();

        if (!result.success) {
          setErro(result.error || 'Erro ao iniciar batalha');
          return;
        }

        setBattleId(result.battleId);
        adicionarLog(`⚔️ Batalha iniciada contra ${oponente.nome}!`);
        adicionarLog(`💪 Dificuldade: ${dificuldade}`);

        // Buscar estado inicial
        await atualizarEstado(result.battleId);

      } catch (error) {
        console.error('Erro ao iniciar batalha:', error);
        setErro('Erro ao conectar com servidor');
      }
    };

    iniciarBatalha();
  }, []);

  // Atualizar estado da batalha
  const atualizarEstado = async (id) => {
    try {
      const response = await fetch(`/api/arena/treino-ia/batalha?battleId=${id || battleId}`);
      const result = await response.json();

      if (result.success) {
        setBattle(result.battle);

        // Se for turno da IA, executar automaticamente
        if (result.battle.currentTurn === 'ia' && result.battle.status === 'active') {
          setTimeout(() => executarTurnoIA(id || battleId), 1500);
        }

        // Verificar fim de batalha
        if (result.battle.status === 'finished') {
          finalizarBatalha(result.battle.winner);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar estado:', error);
    }
  };

  // Executar turno da IA
  const executarTurnoIA = async (id) => {
    try {
      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId: id || battleId,
          action: 'ia_turn'
        })
      });

      const result = await response.json();

      if (result.success) {
        // Adicionar log da ação da IA
        if (result.iaAction === 'attack') {
          if (result.errou) {
            adicionarLog(`❌ ${battle.iaNoome} atacou mas ERROU!`);
          } else {
            const critico = result.critico ? ' CRÍTICO!' : '';
            adicionarLog(`🗡️ ${battle.iaNoome} atacou e causou ${result.dano} de dano${critico}`);
          }
        } else if (result.iaAction === 'defend') {
          adicionarLog(`🛡️ ${battle.iaNoome} defendeu e recuperou energia`);
        } else if (result.iaAction === 'ability') {
          if (result.errou) {
            adicionarLog(`❌ ${battle.iaNoome} usou ${result.nomeHabilidade} mas ERROU!`);
          } else {
            adicionarLog(`✨ ${battle.iaNoome} usou ${result.nomeHabilidade}!`);
            if (result.dano > 0) {
              adicionarLog(`   💥 ${result.dano} de dano`);
            }
            if (result.efeitos && result.efeitos.length > 0) {
              adicionarLog(`   ${result.efeitos.join(', ')}`);
            }
          }
        }

        // Atualizar estado
        await atualizarEstado(id || battleId);
      }
    } catch (error) {
      console.error('Erro no turno da IA:', error);
    }
  };

  // Ações do jogador
  const atacar = async () => {
    if (processando || !battle || battle.currentTurn !== 'player') return;

    setProcessando(true);
    try {
      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId,
          action: 'attack'
        })
      });

      const result = await response.json();

      if (result.success) {
        if (result.errou) {
          adicionarLog(`❌ Você atacou mas ERROU!`);
        } else {
          const critico = result.critico ? ' CRÍTICO!' : '';
          adicionarLog(`⚔️ Você atacou e causou ${result.dano} de dano${critico}`);
          if (result.contraAtaque) {
            adicionarLog(`   🔥 Contra-ataque! Você foi queimado!`);
          }
        }

        await atualizarEstado();
      } else {
        adicionarLog(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao atacar:', error);
      adicionarLog('❌ Erro ao atacar');
    } finally {
      setProcessando(false);
    }
  };

  const defender = async () => {
    if (processando || !battle || battle.currentTurn !== 'player') return;

    setProcessando(true);
    try {
      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId,
          action: 'defend'
        })
      });

      const result = await response.json();

      if (result.success) {
        adicionarLog(`🛡️ Você defendeu e recuperou ${result.energyGained} de energia`);
        await atualizarEstado();
      } else {
        adicionarLog(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao defender:', error);
      adicionarLog('❌ Erro ao defender');
    } finally {
      setProcessando(false);
    }
  };

  const usarHabilidade = async (index) => {
    if (processando || !battle || battle.currentTurn !== 'player') return;

    setProcessando(true);
    try {
      const response = await fetch('/api/arena/treino-ia/batalha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          battleId,
          action: 'ability',
          abilityIndex: index
        })
      });

      const result = await response.json();

      if (result.success) {
        if (result.errou) {
          adicionarLog(`❌ ${result.nomeHabilidade} ERROU!`);
        } else {
          adicionarLog(`✨ Você usou ${result.nomeHabilidade}!`);
          if (result.dano > 0) {
            const critico = result.critico ? ' CRÍTICO' : '';
            adicionarLog(`   💥 ${result.dano} de dano${critico}`);
          }
          if (result.cura > 0) {
            adicionarLog(`   💚 Recuperou ${result.cura} HP`);
          }
          if (result.efeitosAplicados && result.efeitosAplicados.length > 0) {
            adicionarLog(`   ${result.efeitosAplicados.join(', ')}`);
          }
        }

        await atualizarEstado();
      } else {
        adicionarLog(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao usar habilidade:', error);
      adicionarLog('❌ Erro ao usar habilidade');
    } finally {
      setProcessando(false);
    }
  };

  const finalizarBatalha = async (vencedor) => {
    const vitoria = vencedor === 'player';

    setResultado({
      vitoria,
      mensagem: vitoria ? '🎉 Vitória!' : '💀 Derrota...',
      recompensas: vitoria ? { xp: 50, moedas: 25 } : { xp: 10, moedas: 5 }
    });

    // Atualizar avatar (exaustão, recompensas)
    if (battle && battle.playerAvatar) {
      try {
        const avatarId = sessionStorage.getItem('avatar_ativo_id');
        if (avatarId) {
          const avatar = await getDocument('avatares', avatarId);
          if (avatar) {
            await updateDocument('avatares', avatarId, {
              exaustao: Math.min(100, (avatar.exaustao || 0) + 10),
              xp: (avatar.xp || 0) + (vitoria ? 50 : 10)
            });
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar avatar:', error);
      }
    }
  };

  const adicionarLog = (mensagem) => {
    setLog(prev => [...prev, { id: Date.now(), texto: mensagem }]);
  };

  const voltar = () => {
    sessionStorage.removeItem('treino_ia_dados');
    router.push('/arena/treinamento');
  };

  if (erro) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold mb-4">❌ Erro</h2>
          <p className="mb-4">{erro}</p>
          <button
            onClick={voltar}
            className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Preparando batalha...</p>
        </div>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg border-2 border-yellow-500 p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-center mb-6">{resultado.mensagem}</h2>

          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="text-xl font-semibold mb-3">Recompensas:</h3>
            <div className="space-y-2">
              <p>✨ XP: +{resultado.recompensas.xp}</p>
              <p>💰 Moedas: +{resultado.recompensas.moedas}</p>
            </div>
          </div>

          <button
            onClick={voltar}
            className="w-full bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-semibold transition"
          >
            Voltar ao Treinamento
          </button>
        </div>
      </div>
    );
  }

  const isPlayerTurn = battle.currentTurn === 'player';
  const playerHpPercent = (battle.playerHp / battle.playerHpMax) * 100;
  const iaHpPercent = (battle.iaHp / battle.iaHpMax) * 100;
  const playerEnergyPercent = (battle.playerEnergy / 100) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">⚔️ Treino contra IA</h1>
          <p className="text-yellow-400">
            {isPlayerTurn ? '🔥 SEU TURNO!' : '⏳ Turno do Oponente...'}
          </p>
        </div>

        {/* Battle Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Jogador */}
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-700/30 border-2 border-blue-500 rounded-lg p-4">
            <h3 className="text-xl font-bold mb-3">👤 {battle.playerNome}</h3>

            <div className="space-y-2 mb-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>❤️ HP</span>
                  <span>{battle.playerHp} / {battle.playerHpMax}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-red-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${playerHpPercent}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>⚡ Energia</span>
                  <span>{battle.playerEnergy} / 100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-blue-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${playerEnergyPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Efeitos Ativos */}
            {battle.playerEffects && battle.playerEffects.length > 0 && (
              <div className="bg-gray-800/50 rounded p-2 text-sm">
                <p className="font-semibold mb-1">Efeitos:</p>
                <div className="flex flex-wrap gap-1">
                  {battle.playerEffects.map((ef, i) => (
                    <span key={i} className="bg-purple-600 px-2 py-1 rounded text-xs">
                      {ef.tipo} ({ef.turnosRestantes})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {battle.playerDefending && (
              <div className="bg-yellow-600/30 border border-yellow-500 rounded p-2 mt-2 text-sm">
                🛡️ Defendendo (-50% dano recebido)
              </div>
            )}
          </div>

          {/* Oponente IA */}
          <div className="bg-gradient-to-br from-red-900/50 to-red-700/30 border-2 border-red-500 rounded-lg p-4">
            <h3 className="text-xl font-bold mb-3">🤖 {battle.iaNoome}</h3>

            <div className="space-y-2 mb-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>❤️ HP</span>
                  <span>{battle.iaHp} / {battle.iaHpMax}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-red-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${iaHpPercent}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>⚡ Energia</span>
                  <span>{battle.iaEnergy} / 100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-orange-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(battle.iaEnergy / 100) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Elemento */}
            <div className="bg-gray-800/50 rounded p-2 text-sm mb-2">
              <p>🔥 Elemento: {battle.iaAvatar?.elemento || 'Desconhecido'}</p>
            </div>

            {battle.iaDefending && (
              <div className="bg-yellow-600/30 border border-yellow-500 rounded p-2 text-sm">
                🛡️ Defendendo
              </div>
            )}
          </div>
        </div>

        {/* Ações */}
        {isPlayerTurn && battle.status === 'active' && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="text-xl font-bold mb-4">⚔️ Ações</h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={atacar}
                disabled={processando || battle.playerEnergy < 10}
                className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition"
              >
                ⚔️ Atacar (-10 energia)
              </button>

              <button
                onClick={defender}
                disabled={processando}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition"
              >
                🛡️ Defender (+20 energia)
              </button>
            </div>

            {/* Habilidades */}
            {battle.playerAvatar?.habilidades && battle.playerAvatar.habilidades.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">✨ Habilidades:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {battle.playerAvatar.habilidades.map((hab, i) => (
                    <button
                      key={i}
                      onClick={() => usarHabilidade(i)}
                      disabled={processando || battle.playerEnergy < (hab.custo_energia || 20)}
                      className="bg-purple-700 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-left transition"
                    >
                      <div className="font-semibold">{hab.nome}</div>
                      <div className="text-xs text-gray-300">
                        -{hab.custo_energia || 20} energia • {hab.tipo}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Log de Batalha */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-xl font-bold mb-3">📜 Log de Batalha</h3>
          <div className="bg-black/50 rounded p-3 h-48 overflow-y-auto space-y-1">
            {log.map(item => (
              <div key={item.id} className="text-sm">{item.texto}</div>
            ))}
          </div>
        </div>

        {/* Botão Voltar */}
        <div className="mt-6 text-center">
          <button
            onClick={voltar}
            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
