import { NextResponse } from 'next/server';
import { updateDocument } from '@/lib/firebase/firestore';
import {
  validateRequest,
  validateAvatarOwnership
} from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sacrificar-avatar
 *
 * Sacrifica um avatar permanentemente, enviando-o ao Memorial Eterno.
 * O avatar é marcado como morto COM marca da morte.
 *
 * Validações:
 * - Avatar deve pertencer ao usuário
 * - Avatar não pode estar ativo
 */
export async function POST(request) {
  try {
    // Validar campos obrigatórios
    const validation = await validateRequest(request, ['userId', 'avatarId']);
    if (!validation.valid) return validation.response;

    const { userId, avatarId } = validation.body;

    // Validar propriedade do avatar
    const avatarCheck = await validateAvatarOwnership(avatarId, userId);
    if (!avatarCheck.valid) return avatarCheck.response;

    const avatar = avatarCheck.avatar;

    // Não pode sacrificar avatar ativo
    if (avatar.ativo) {
      return NextResponse.json(
        { message: "Não é possível sacrificar o avatar ativo" },
        { status: 400 }
      );
    }

    // Sacrificar avatar: marcar como morto COM marca da morte (vai pro memorial)
    const timestamp = new Date().toISOString();
    await updateDocument('avatares', avatarId, {
      vivo: false,
      hp_atual: 0,
      // 🆕 AUDIT LOG - Marca da morte com metadados
      marca_morte: true,
      marca_morte_aplicada_em: timestamp,
      marca_morte_causa: 'sacrificio',
      marca_morte_sacrificado_por: userId,
      causa_morte: 'sacrificio', // Para epitáfio personalizado no memorial
      ativo: false,
      updated_at: timestamp
    });

    return Response.json({
      message: `${avatar.nome} foi sacrificado e enviado ao Memorial Eterno...`
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
