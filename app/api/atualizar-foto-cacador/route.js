import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { validateRequest } from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/atualizar-foto-cacador
 * Atualiza foto do caçador no perfil do jogador
 *
 * Body: {
 *   userId: string,
 *   fotoCacador: string (caminho da imagem)
 * }
 */
export async function PUT(request) {
  console.log("=== ATUALIZAR FOTO DE CAÇADOR ===");

  try {
    // Validar campos obrigatórios
    const validation = await validateRequest(request, ['userId', 'fotoCacador']);
    if (!validation.valid) return validation.response;

    const { userId, fotoCacador } = validation.body;

    // Validar se o caminho da foto é válido (apenas aceitar fotos da pasta cacadores)
    if (!fotoCacador.startsWith('/personagens/cacadores/')) {
      return NextResponse.json(
        { message: "Caminho de foto inválido" },
        { status: 400 }
      );
    }

    console.log(`Atualizando foto para usuário ${userId}: "${fotoCacador}"`);

    // Verificar se jogador existe no Firestore
    const playerStats = await getDocument('player_stats', userId);

    if (!playerStats) {
      return NextResponse.json(
        { message: "Jogador não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar foto no Firestore
    await updateDocument('player_stats', userId, {
      foto_cacador: fotoCacador,
      updated_at: new Date().toISOString()
    });

    // Buscar stats atualizados
    const statsAtualizados = await getDocument('player_stats', userId);

    console.log("✅ Foto atualizada com sucesso:", statsAtualizados.foto_cacador);

    return NextResponse.json({
      success: true,
      message: "Foto de caçador atualizada com sucesso!",
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
