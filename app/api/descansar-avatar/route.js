// ==================== API: DESCANSAR AVATAR ====================
// SISTEMA SIMPLES: Remove 50 pontos de exaustão instantaneamente

import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { validateRequest } from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Validar campo obrigatório
    const validation = await validateRequest(request, ['avatarId']);
    if (!validation.valid) return validation.response;

    const { avatarId } = validation.body;

    // Buscar avatar
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar) {
      return NextResponse.json(
        { message: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se está vivo
    if (!avatar.vivo) {
      return NextResponse.json(
        { message: 'Avatar morto não pode descansar' },
        { status: 400 }
      );
    }

    const exaustaoAtual = avatar.exaustao || 0;

    // Já está descansado
    if (exaustaoAtual === 0) {
      return NextResponse.json({
        sucesso: true,
        mensagem: 'Avatar já está descansado!',
        avatar: avatar
      });
    }

    // RECUPERAÇÃO SIMPLES: Remove 50 pontos
    const novaExaustao = Math.max(0, exaustaoAtual - 50);

    // Atualizar no banco
    await updateDocument('avatares', avatarId, {
      exaustao: novaExaustao,
      updated_at: new Date().toISOString()
    });

    // Buscar avatar atualizado
    const avatarAtualizado = await getDocument('avatares', avatarId);

    return NextResponse.json({
      sucesso: true,
      mensagem: novaExaustao === 0
        ? 'Avatar completamente descansado!'
        : `Exaustão reduzida de ${exaustaoAtual} para ${novaExaustao}`,
      avatar: avatarAtualizado,
      recuperacao: {
        exaustao_antes: exaustaoAtual,
        exaustao_depois: novaExaustao,
        pontos_recuperados: exaustaoAtual - novaExaustao
      }
    });

  } catch (error) {
    console.error('Erro ao descansar:', error);
    return NextResponse.json(
      { message: 'Erro ao processar', erro: error.message },
      { status: 500 }
    );
  }
}
