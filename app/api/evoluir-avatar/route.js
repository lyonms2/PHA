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
      await updateDocument('player_stats', userId, {
        moedas: moedasJogador - config.custoMoedas,
        fragmentos: fragmentosJogador - config.custoFragmentos,
        updated_at: new Date().toISOString()
      });

      return NextResponse.json({
        sucesso: false,
        falhou: true,
        mensagem: resultado.mensagem,
        chanceSucesso: resultado.chanceSucesso,
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

    await Promise.all([
      // Atualizar avatar
      updateDocument('avatares', avatarId, {
        raridade: novaRaridade,
        forca: statsNovos.forca,
        agilidade: statsNovos.agilidade,
        resistencia: statsNovos.resistencia,
        foco: statsNovos.foco,
        hp_atual: hpMaximoCompleto, // Restaurar HP ao evoluir
        updated_at: new Date().toISOString()
      }),
      // Descontar recursos do jogador
      updateDocument('player_stats', userId, {
        moedas: moedasJogador - config.custoMoedas,
        fragmentos: fragmentosJogador - config.custoFragmentos,
        updated_at: new Date().toISOString()
      })
    ]);

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
