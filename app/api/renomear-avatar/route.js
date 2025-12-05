import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import {
  validateRequest,
  validateAvatarOwnership,
  validateAvatarName
} from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/renomear-avatar
 *
 * Permite o caçador renomear seu avatar
 *
 * Body: {
 *   userId: string,
 *   avatarId: string,
 *   novoNome: string
 * }
 */
export async function POST(request) {
  try {
    // Validar campos obrigatórios
    const validation = await validateRequest(request, ['userId', 'avatarId', 'novoNome']);
    if (!validation.valid) return validation.response;

    const { userId, avatarId, novoNome } = validation.body;
    console.log('[RENOMEAR AVATAR]', { userId, avatarId, novoNome });

    // Validar nome
    const nameCheck = validateAvatarName(novoNome);
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }
    const nomeValidado = nameCheck.nome;

    // Validar propriedade do avatar
    const avatarCheck = await validateAvatarOwnership(avatarId, userId);
    if (!avatarCheck.valid) return avatarCheck.response;

    const avatar = avatarCheck.avatar;
    const nomeAntigo = avatar.nome;

    // Atualizar nome no Firestore
    await updateDocument('avatares', avatarId, {
      nome: nomeValidado,
      updated_at: new Date().toISOString()
    });

    console.log('[RENOMEAR AVATAR] Avatar renomeado com sucesso:', {
      avatarId,
      nomeAntigo,
      novoNome: nomeValidado
    });

    // Buscar avatar atualizado
    const avatarAtualizado = await getDocument('avatares', avatarId);

    return NextResponse.json({
      success: true,
      message: `Avatar renomeado de "${nomeAntigo}" para "${nomeValidado}"`,
      avatar: avatarAtualizado,
      nomeAntigo,
      novoNome: nomeValidado
    });

  } catch (error) {
    console.error('[RENOMEAR AVATAR] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
