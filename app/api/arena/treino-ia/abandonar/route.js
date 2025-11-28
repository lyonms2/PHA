// ==================== API: ABANDONO DE TREINO IA ====================
// Arquivo: /app/api/arena/treino-ia/abandonar/route.js
//
// Aplica penalidades quando jogador abandona batalha (refresh/sair)

import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { calcularPenalidadesAbandono } from '@/lib/arena/rewardsSystem';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.text();
    const { battleId, userId, avatarId, dificuldade } = JSON.parse(body);

    if (!userId || !avatarId || !dificuldade) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    console.log('⚠️ Abandono detectado:', { battleId, userId, avatarId, dificuldade });

    // Calcular penalidades
    const penalidades = calcularPenalidadesAbandono(dificuldade);

    // Buscar dados atuais
    const avatarData = await getDocument('avatares', avatarId);

    if (!avatarData) {
      console.error('Avatar não encontrado para abandono');
      return NextResponse.json(
        { error: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // Aplicar penalidades
    const vinculoAtual = avatarData.vinculo || 0;
    const exaustaoAtual = avatarData.exaustao || 0;

    const novoVinculo = Math.min(100, Math.max(0, vinculoAtual + penalidades.vinculo)); // negativo
    const novaExaustao = Math.min(100, Math.max(0, exaustaoAtual + penalidades.exaustao)); // positivo

    // Atualizar avatar
    await updateDocument('avatares', avatarId, {
      vinculo: novoVinculo,
      exaustao: novaExaustao
    });

    console.log('✅ Penalidades de abandono aplicadas:', {
      avatar: avatarData.nome,
      vinculo: `${vinculoAtual} → ${novoVinculo} (${penalidades.vinculo})`,
      exaustao: `${exaustaoAtual} → ${novaExaustao} (+${penalidades.exaustao})`
    });

    return NextResponse.json({
      success: true,
      penalidades: {
        vinculo: penalidades.vinculo,
        exaustao: penalidades.exaustao
      }
    });

  } catch (error) {
    console.error('Erro ao aplicar penalidades de abandono:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    );
  }
}
