import { NextResponse } from 'next/server';
import { getDocument, createDocument } from "@/lib/firebase/firestore";
import { validateRequest } from '@/lib/api/middleware';

export async function POST(request) {
  try {
    // Validar campo obrigatório
    const validation = await validateRequest(request, ['userId']);
    if (!validation.valid) return validation.response;

    const { userId } = validation.body;

    console.log("Inicializando jogador:", userId);

    // Verificar se já existe no Firestore
    const existing = await getDocument('player_stats', userId);

    if (existing) {
      console.log("Jogador já existe:", existing);
      return NextResponse.json({
        message: "Jogador já inicializado",
        stats: existing
      });
    }

    console.log("Criando novo jogador...");

    // Criar stats iniciais no Firestore
    const statsData = {
      user_id: userId,
      moedas: 500,
      fragmentos: 10,
      divida: 0,
      ranking: 'F',
      hunterRankXp: 0, // XP para sistema de ranking de cacador F-SS
      missoes_completadas: 0,
      primeira_invocacao: true
    };

    await createDocument('player_stats', statsData, userId);

    const stats = { id: userId, ...statsData };

    console.log("Jogador criado com sucesso:", stats);

    return NextResponse.json({
      message: "Jogador inicializado com sucesso!",
      stats
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return NextResponse.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
