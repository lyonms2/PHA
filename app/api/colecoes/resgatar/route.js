import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { COLECOES, TIPOS_RESGATE } from '@/lib/collections/collectionDefinitions';
import { verificarColecaoCompleta } from '@/lib/collections/collectionProgress';
import { getHunterRank, aplicarMultiplicadorRecompensas } from '@/lib/hunter/hunterRankSystem';

export const dynamic = 'force-dynamic';

/**
 * POST /api/colecoes/resgatar
 * Resgata recompensas de uma coleção completada
 * Body: { userId, colecaoId, avataresDedicados? }
 * - avataresDedicados: Array de IDs dos avatares a dedicar (apenas para coleções DEDICADAS)
 */
export async function POST(request) {
  try {
    const { userId, colecaoId, avataresDedicados } = await request.json();

    if (!userId || !colecaoId) {
      return NextResponse.json(
        { error: 'userId e colecaoId são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar stats do jogador
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      return NextResponse.json({ error: 'Player stats não encontrado' }, { status: 404 });
    }

    // Buscar definição da coleção
    const colecao = COLECOES.find(c => c.id === colecaoId);

    if (!colecao) {
      return NextResponse.json({ error: 'Coleção não encontrada' }, { status: 404 });
    }

    // Verificar se já foi completada
    const colecoesCompletadas = stats.colecoes_completadas || [];

    if (colecoesCompletadas.includes(colecaoId)) {
      return NextResponse.json(
        { error: 'Coleção já foi resgatada anteriormente' },
        { status: 400 }
      );
    }

    // Verificar se está realmente completa
    const avatares = stats.avatars || [];
    const { completa } = verificarColecaoCompleta(colecao, avatares);

    if (!completa) {
      return NextResponse.json(
        { error: 'Coleção não está completa' },
        { status: 400 }
      );
    }

    // Processar dedicação de avatares (se for coleção DEDICADA)
    let avataresAtualizados = avatares;
    let hallDaFama = stats.avatares_hall_da_fama || [];
    let avataresDedicadosInfo = null;

    if (colecao.tipoResgate === TIPOS_RESGATE.DEDICADA) {
      if (!avataresDedicados || avataresDedicados.length === 0) {
        return NextResponse.json(
          { error: 'Coleção dedicada requer seleção de avatares' },
          { status: 400 }
        );
      }

      // Validar que os avatares existem e estão disponíveis
      const avataresParaDedicar = avatares.filter(av =>
        avataresDedicados.includes(av.id)
      );

      if (avataresParaDedicar.length !== avataresDedicados.length) {
        return NextResponse.json(
          { error: 'Alguns avatares selecionados não estão disponíveis' },
          { status: 400 }
        );
      }

      // Adicionar informação de dedicação aos avatares
      const avataresComDedicacao = avataresParaDedicar.map(av => ({
        ...av,
        dedicado_em: new Date().toISOString(),
        colecao_dedicada: colecaoId,
        colecao_nome: colecao.nome
      }));

      // Mover avatares para Hall da Fama
      hallDaFama = [...hallDaFama, ...avataresComDedicacao];

      // Remover avatares dedicados da lista ativa
      avataresAtualizados = avatares.filter(av =>
        !avataresDedicados.includes(av.id)
      );

      avataresDedicadosInfo = {
        quantidade: avataresParaDedicar.length,
        avatares: avataresParaDedicar.map(av => ({
          id: av.id,
          nome: av.nome,
          raridade: av.raridade,
          elemento: av.elemento
        }))
      };
    }

    // Aplicar bônus de Hunter Rank nas recompensas
    const hunterRank = getHunterRank(stats.hunterRankXp || 0);
    const recompensasComBonus = aplicarMultiplicadorRecompensas(colecao.recompensas, hunterRank);

    // Preparar título se houver
    let titulosAtualizados = stats.titulos || [];
    if (recompensasComBonus.titulo && !titulosAtualizados.includes(recompensasComBonus.titulo)) {
      titulosAtualizados = [...titulosAtualizados, recompensasComBonus.titulo];
    }

    // Atualizar stats do jogador
    const novasMoedas = (stats.moedas || 0) + recompensasComBonus.moedas;
    const novosFragmentos = (stats.fragmentos || 0) + recompensasComBonus.fragmentos;
    const novoXpCacador = (stats.hunterRankXp || 0) + recompensasComBonus.xpCacador;

    const updateData = {
      moedas: novasMoedas,
      fragmentos: novosFragmentos,
      hunterRankXp: novoXpCacador,
      colecoes_completadas: [...colecoesCompletadas, colecaoId],
      updated_at: new Date().toISOString()
    };

    // Adicionar mudanças de avatares se for dedicada
    if (colecao.tipoResgate === TIPOS_RESGATE.DEDICADA) {
      updateData.avatars = avataresAtualizados;
      updateData.avatares_hall_da_fama = hallDaFama;
    }

    // Adicionar títulos se houver
    if (titulosAtualizados.length > (stats.titulos || []).length) {
      updateData.titulos = titulosAtualizados;
    }

    await updateDocument('player_stats', userId, updateData);

    const resposta = {
      success: true,
      colecao: {
        id: colecao.id,
        nome: colecao.nome,
        icone: colecao.icone,
        tipoResgate: colecao.tipoResgate
      },
      recompensas: recompensasComBonus,
      bonus_hunter_rank: {
        rank: hunterRank.nome,
        percentual: Math.floor((hunterRank.multiplicadorRecompensas - 1.0) * 100)
      },
      novos_valores: {
        moedas: novasMoedas,
        fragmentos: novosFragmentos,
        hunterRankXp: novoXpCacador
      }
    };

    // Adicionar informações de dedicação se aplicável
    if (avataresDedicadosInfo) {
      resposta.avatares_dedicados = avataresDedicadosInfo;
      resposta.hall_da_fama_total = hallDaFama.length;
      resposta.slots_liberados = avataresDedicados.length;
    }

    return NextResponse.json(resposta);

  } catch (error) {
    console.error('[COLECOES] Erro ao resgatar coleção:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
