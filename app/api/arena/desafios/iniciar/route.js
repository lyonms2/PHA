// ==================== API: INICIAR DESAFIO DE BOSS ====================
// Arquivo: /app/api/arena/desafios/iniciar/route.js

import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firebase/firestore';
import { gerarBoss, calcularHPBoss } from '@/lib/arena/bossSystem';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { userId, avatarId, bossId } = await request.json();

    if (!userId || !avatarId || !bossId) {
      return NextResponse.json(
        { message: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Buscar avatar do jogador no Firestore
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar || avatar.user_id !== userId) {
      return NextResponse.json(
        { message: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se pode lutar
    if (!avatar.vivo) {
      return NextResponse.json(
        { message: 'Avatar está morto!' },
        { status: 400 }
      );
    }

    if (avatar.exaustao >= 100) {
      return NextResponse.json(
        { message: 'Avatar está colapsado! Precisa descansar.' },
        { status: 400 }
      );
    }

    console.log('🏆 Iniciando desafio de boss:', {
      jogador: avatar.nome,
      nivel: avatar.nivel,
      bossId
    });

    // Gerar boss
    const boss = gerarBoss(bossId, avatar.nivel);

    // Calcular HP do boss (3-5x maior)
    const hpBoss = calcularHPBoss(boss);
    boss.hp_maximo = hpBoss;
    boss.hp_atual = hpBoss;

    console.log('👹 Boss gerado:', {
      nome: boss.nome,
      nivel: boss.nivel,
      dificuldade: boss.dificuldade,
      hp: hpBoss,
      stats: {
        forca: boss.forca,
        agilidade: boss.agilidade,
        resistencia: boss.resistencia,
        foco: boss.foco
      },
      habilidades: boss.habilidades.map(h => h.nome),
      mecanicas: boss.mecanicasEspeciais.map(m => m.nome)
    });

    // Retornar dados para o frontend
    return NextResponse.json({
      sucesso: true,
      boss
    });

  } catch (error) {
    console.error('Erro ao iniciar desafio:', error);
    return NextResponse.json(
      { message: 'Erro ao iniciar desafio', erro: error.message },
      { status: 500 }
    );
  }
}
