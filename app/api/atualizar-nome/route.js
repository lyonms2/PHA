import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { validateRequest, validateAvatarName } from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/atualizar-nome
 * Atualiza nome de operação do jogador (hunter name)
 *
 * Body: {
 *   userId: string,
 *   nomeOperacao: string
 * }
 */
export async function PUT(request) {
  console.log("=== ATUALIZAR NOME DE OPERAÇÃO ===");

  try {
    // Validar campos obrigatórios
    const validation = await validateRequest(request, ['userId', 'nomeOperacao']);
    if (!validation.valid) return validation.response;

    const { userId, nomeOperacao } = validation.body;

    // Validar nome usando validateAvatarName (funciona para nomes de operação também)
    const nameCheck = validateAvatarName(nomeOperacao, 1, 30);
    if (!nameCheck.valid) {
      return NextResponse.json({ message: nameCheck.error }, { status: 400 });
    }
    const nomeValidado = nameCheck.nome;

    console.log(`Atualizando nome para usuário ${userId}: "${nomeValidado}"`);

    // Verificar se jogador existe no Firestore
    const playerStats = await getDocument('player_stats', userId);

    if (!playerStats) {
      return NextResponse.json(
        { message: "Jogador não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar nome no Firestore
    await updateDocument('player_stats', userId, {
      nome_operacao: nomeValidado,
      updated_at: new Date().toISOString()
    });

    // Buscar stats atualizados
    const statsAtualizados = await getDocument('player_stats', userId);

    console.log("✅ Nome atualizado com sucesso:", statsAtualizados.nome_operacao);

    return NextResponse.json({
      success: true,
      message: "Nome de operação atualizado com sucesso!",
      stats: statsAtualizados
    });

  } catch (error) {
    console.error("❌ ERRO:", error);
    return NextResponse.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
