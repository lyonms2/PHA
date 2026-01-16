import { NextResponse } from "next/server";
import { getCollection, getDocument, updateDocument } from "@/app/firebase/firebaseAdmin";

// GET - Carregar avatares concorrentes e status de voto
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "userId é obrigatório" }, { status: 400 });
    }

    // Buscar todos os avatares vivos (concorrentes)
    const avatarsSnapshot = await getCollection('avatares');
    const avatares = [];

    for (const doc of avatarsSnapshot.docs) {
      const data = doc.data();
      if (data.vivo) { // Apenas avatares vivos podem concorrer
        avatares.push({
          id: doc.id,
          nome: data.nome,
          raridade: data.raridade,
          elemento: data.elemento,
          cor_primaria: data.cor_primaria,
          cor_secundaria: data.cor_secundaria,
          cor_roupa: data.cor_roupa,
          estilo_roupa: data.estilo_roupa,
          cor_cabelo: data.cor_cabelo,
          estilo_cabelo: data.estilo_cabelo,
          cor_olhos: data.cor_olhos,
          cor_pele: data.cor_pele,
          acessorio: data.acessorio,
          userId: data.userId,
          votosRecebidos: data.votosRecebidos || 0
        });
      }
    }

    // Buscar voto do usuário (se existe)
    let meuVoto = null;
    try {
      const statsDoc = await getDocument('stats', userId);
      if (statsDoc.voto_beleza) {
        const votoData = statsDoc.voto_beleza;
        // Verificar se o voto é do mês atual
        const dataVoto = new Date(votoData.votadoEm);
        const agora = new Date();
        if (dataVoto.getMonth() === agora.getMonth() && dataVoto.getFullYear() === agora.getFullYear()) {
          meuVoto = votoData;
        }
      }
    } catch (err) {
      console.error('Erro ao buscar voto:', err);
    }

    // Calcular ranking por categoria
    const ranking = {
      Comum: avatares.filter(av => av.raridade === 'Comum').sort((a, b) => (b.votosRecebidos || 0) - (a.votosRecebidos || 0)),
      Raro: avatares.filter(av => av.raridade === 'Raro').sort((a, b) => (b.votosRecebidos || 0) - (a.votosRecebidos || 0)),
      Lendário: avatares.filter(av => av.raridade === 'Lendário').sort((a, b) => (b.votosRecebidos || 0) - (a.votosRecebidos || 0))
    };

    return NextResponse.json({
      avatares,
      meuVoto,
      ranking
    });

  } catch (error) {
    console.error("Erro em GET /campeonato-beleza:", error);
    return NextResponse.json(
      { message: "Erro ao carregar campeonato" },
      { status: 500 }
    );
  }
}

// POST - Registrar voto
export async function POST(request) {
  try {
    const { userId, avatarId, categoria } = await request.json();

    if (!userId || !avatarId || !categoria) {
      return NextResponse.json(
        { message: "userId, avatarId e categoria são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o avatar existe e é da categoria correta
    const avatar = await getDocument('avatares', avatarId);
    if (!avatar) {
      return NextResponse.json({ message: "Avatar não encontrado" }, { status: 404 });
    }

    if (avatar.raridade !== categoria) {
      return NextResponse.json({ message: "Avatar não pertence a esta categoria" }, { status: 400 });
    }

    if (!avatar.vivo) {
      return NextResponse.json({ message: "Apenas avatares vivos podem receber votos" }, { status: 400 });
    }

    // Verificar se está tentando votar em seu próprio avatar
    if (avatar.userId === userId) {
      return NextResponse.json({ message: "Você não pode votar em seus próprios avatares" }, { status: 400 });
    }

    // Verificar se já votou este mês
    const stats = await getDocument('stats', userId);
    if (stats.voto_beleza) {
      const dataVoto = new Date(stats.voto_beleza.votadoEm);
      const agora = new Date();
      if (dataVoto.getMonth() === agora.getMonth() && dataVoto.getFullYear() === agora.getFullYear()) {
        return NextResponse.json(
          { message: "Você já votou este mês. Aguarde o próximo campeonato!" },
          { status: 400 }
        );
      }
    }

    // Registrar voto
    const agora = new Date();
    const voto = {
      avatarId,
      categoria,
      votadoEm: agora.toISOString()
    };

    // Atualizar stats do votante
    await updateDocument('stats', userId, {
      voto_beleza: voto
    });

    // Incrementar votos recebidos pelo avatar
    await updateDocument('avatares', avatarId, {
      votosRecebidos: (avatar.votosRecebidos || 0) + 1
    });

    console.log(`✅ Voto registrado: User ${userId} votou em ${avatar.nome} (${categoria})`);

    return NextResponse.json({
      message: "Voto registrado com sucesso!",
      voto
    });

  } catch (error) {
    console.error("Erro em POST /campeonato-beleza:", error);
    return NextResponse.json(
      { message: "Erro ao processar voto" },
      { status: 500 }
    );
  }
}
