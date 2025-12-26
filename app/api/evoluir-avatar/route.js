import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import {
  verificarEvolucaoPossivel,
  calcularChanceSucesso,
  processarEvolucao,
  EVOLUCAO_CONFIG
} from '@/app/avatares/sistemas/evolutionSystem';
import { getHunterRank } from '@/lib/hunter/hunterRankSystem';
import { calcularHPMaximoCompleto } from '@/lib/combat/statsCalculator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/evoluir-avatar
 * Evolui um avatar de uma raridade para outra
 * Body: { userId, avatarId }
 */
export async function POST(request) {
  try {
    const { userId, avatarId } = await request.json();

    if (!userId || !avatarId) {
      return NextResponse.json(
        { error: 'userId e avatarId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados do jogador e avatar
    const [playerStats, avatar] = await Promise.all([
      getDocument('player_stats', userId),
      getDocument('avatares', avatarId)
    ]);

    if (!playerStats) {
      return NextResponse.json(
        { error: 'Jogador não encontrado' },
        { status: 404 }
      );
    }

    if (!avatar) {
      return NextResponse.json(
        { error: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se avatar pertence ao jogador
    if (avatar.user_id !== userId) {
      return NextResponse.json(
        { error: 'Avatar não pertence ao jogador' },
        { status: 403 }
      );
    }

    // Verificar se evolução é possível
    const verificacao = verificarEvolucaoPossivel(avatar);
    if (!verificacao.podeEvoluir) {
      return NextResponse.json(
        { error: verificacao.motivo, podeEvoluir: false },
        { status: 400 }
      );
    }

    const { tipoEvolucao, config } = verificacao;

    // Verificar se jogador tem recursos suficientes
    const moedasJogador = playerStats.moedas || 0;
    const fragmentosJogador = playerStats.fragmentos || 0;

    if (moedasJogador < config.custoMoedas) {
      return NextResponse.json(
        { error: `Moedas insuficientes. Necessário: ${config.custoMoedas}` },
        { status: 400 }
      );
    }

    if (fragmentosJogador < config.custoFragmentos) {
      return NextResponse.json(
        { error: `Fragmentos insuficientes. Necessário: ${config.custoFragmentos}` },
        { status: 400 }
      );
    }

    // Obter Hunter Rank para bônus
    const hunterRank = getHunterRank(playerStats.hunterRankXp || 0);

    // Processar evolução
    const resultado = processarEvolucao(avatar, hunterRank);

    if (!resultado.sucesso) {
      // Evolução falhou! Descontar recursos mas não evoluir
      const timestamp = new Date().toISOString();

      await Promise.all([
        // Descontar recursos
        updateDocument('player_stats', userId, {
          moedas: moedasJogador - config.custoMoedas,
          fragmentos: fragmentosJogador - config.custoFragmentos,
          updated_at: timestamp
        }),
        // 🆕 AUDIT LOG - Registrar tentativa falha
        updateDocument('avatares', avatarId, {
          tentativas_evolucao_falhas: (avatar.tentativas_evolucao_falhas || 0) + 1,
          ultima_tentativa_evolucao: timestamp,
          ultima_tentativa_tipo: tipoEvolucao,
          updated_at: timestamp
        })
      ]);

      console.log('❌ [EVOLUÇÃO] Falha na evolução:', {
        avatar: avatar.nome,
        tipo: tipoEvolucao,
        chance: resultado.chanceSucesso,
        tentativasFalhas: (avatar.tentativas_evolucao_falhas || 0) + 1
      });

      return NextResponse.json({
        sucesso: false,
        falhou: true,
        mensagem: resultado.mensagem,
        chanceSucesso: resultado.chanceSucesso,
        tentativasFalhas: (avatar.tentativas_evolucao_falhas || 0) + 1,
        recursosGastos: {
          moedas: config.custoMoedas,
          fragmentos: config.custoFragmentos
        },
        saldoRestante: {
          moedas: moedasJogador - config.custoMoedas,
          fragmentos: fragmentosJogador - config.custoFragmentos
        }
      });
    }

    // Sucesso! Atualizar avatar e descontar recursos
    const { statsNovos, novaRaridade, hpMaximo } = resultado;

    // Calcular HP máximo com a função completa
    const hpMaximoCompleto = calcularHPMaximoCompleto({
      ...avatar,
      ...statsNovos,
      raridade: novaRaridade
    });

    // ==================== TRANSAÇÃO ATÔMICA (Simulada com Rollback) ====================
    let avatarAtualizado = false;
    let recursosAtualizados = false;
    const timestamp = new Date().toISOString();

    try {
      // Passo 1: Atualizar avatar (evolução)
      console.log('🔨 [EVOLUÇÃO] Aplicando evolução ao avatar...');
      await updateDocument('avatares', avatarId, {
        raridade: novaRaridade,
        forca: statsNovos.forca,
        agilidade: statsNovos.agilidade,
        resistencia: statsNovos.resistencia,
        foco: statsNovos.foco,
        hp_atual: hpMaximoCompleto, // Restaurar HP ao evoluir

        // 🆕 AUDIT LOG - Registro de evolução
        evoluido: true,
        evoluido_em: timestamp,
        evoluido_de: avatar.raridade, // Raridade anterior
        evoluido_para: novaRaridade,
        evolucoes_totais: (avatar.evolucoes_totais || 0) + 1,
        stats_pre_evolucao: {
          forca: avatar.forca,
          agilidade: avatar.agilidade,
          resistencia: avatar.resistencia,
          foco: avatar.foco
        },

        updated_at: timestamp
      });
      avatarAtualizado = true;
      console.log('✅ [EVOLUÇÃO] Avatar evoluído!');

      // Passo 2: Descontar recursos do jogador (se falhar, reverte avatar)
      console.log('💰 [EVOLUÇÃO] Deduzindo recursos...');
      await updateDocument('player_stats', userId, {
        moedas: moedasJogador - config.custoMoedas,
        fragmentos: fragmentosJogador - config.custoFragmentos,
        updated_at: timestamp
      });
      recursosAtualizados = true;
      console.log('✅ [EVOLUÇÃO] Recursos deduzidos!');

    } catch (transactionError) {
      // ROLLBACK: Se recursos falharam mas avatar foi atualizado, reverter avatar
      if (avatarAtualizado && !recursosAtualizados) {
        console.log("🔄 ROLLBACK: Revertendo evolução do avatar...");
        try {
          await updateDocument('avatares', avatarId, {
            // Reverter raridade
            raridade: avatar.raridade,

            // Reverter stats
            forca: avatar.forca,
            agilidade: avatar.agilidade,
            resistencia: avatar.resistencia,
            foco: avatar.foco,
            hp_atual: avatar.hp_atual,

            // Remover audit log
            evoluido: false,
            evoluido_em: null,
            evoluido_de: null,
            evoluido_para: null,
            stats_pre_evolucao: null,

            updated_at: timestamp
          });
          console.log("✅ ROLLBACK completo - avatar revertido ao estado original");
        } catch (rollbackError) {
          console.error("💥 ERRO CRÍTICO: Falha no rollback!", rollbackError);
          console.error("⚠️ ESTADO INCONSISTENTE: Avatar evoluído mas recursos não deduzidos");
          console.error("Avatar ID:", avatarId);
          console.error("User ID:", userId);
          console.error("Raridade Original:", avatar.raridade, "→ Nova:", novaRaridade);
        }

        return NextResponse.json(
          { error: "Falha ao deduzir recursos. Evolução revertida." },
          { status: 500 }
        );
      }

      throw transactionError;
    }

    console.log('✅ Avatar evoluído com sucesso:', {
      avatar: avatar.nome,
      evolucao: tipoEvolucao,
      statsAntigos: resultado.statsAntigos,
      statsNovos: statsNovos
    });

    return NextResponse.json({
      sucesso: true,
      mensagem: resultado.mensagem,
      avatar: {
        id: avatarId,
        nome: avatar.nome,
        raridadeAnterior: avatar.raridade,
        raridadeNova: novaRaridade,
        statsAntigos: resultado.statsAntigos,
        statsNovos: statsNovos,
        hpMaximo: hpMaximoCompleto
      },
      chanceSucesso: resultado.chanceSucesso,
      recursosGastos: {
        moedas: config.custoMoedas,
        fragmentos: config.custoFragmentos
      },
      saldoRestante: {
        moedas: moedasJogador - config.custoMoedas,
        fragmentos: fragmentosJogador - config.custoFragmentos
      },
      hunterRank: {
        nome: hunterRank.nome,
        bonus: `+${Math.round((hunterRank.nivel || 0) * (config.bonusHunterRank * 100))}%`
      }
    });

  } catch (error) {
    console.error('Erro ao evoluir avatar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    );
  }
}
