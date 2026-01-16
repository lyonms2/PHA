import { NextResponse } from "next/server";
import { getDocuments, getDocument, updateDocument, setDocument } from "@/lib/firebase/firestore";

export const dynamic = 'force-dynamic';

// GET - Carregar avatares concorrentes e status de voto
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ message: "userId é obrigatório" }, { status: 400 });
    }

    // Buscar todos os avatares vivos (concorrentes)
    const avatarsData = await getDocuments('avatares');
    const avatares = [];

    for (const avatar of avatarsData) {
      if (avatar.vivo) { // Apenas avatares vivos podem concorrer
        avatares.push({
          id: avatar.id,
          nome: avatar.nome,
          raridade: avatar.raridade,
          elemento: avatar.elemento,
          cor_primaria: avatar.cor_primaria,
          cor_secundaria: avatar.cor_secundaria,
          cor_roupa: avatar.cor_roupa,
          estilo_roupa: avatar.estilo_roupa,
          cor_cabelo: avatar.cor_cabelo,
          estilo_cabelo: avatar.estilo_cabelo,
          cor_olhos: avatar.cor_olhos,
          cor_pele: avatar.cor_pele,
          acessorio: avatar.acessorio,
          userId: avatar.userId,
          votosRecebidos: avatar.votosRecebidos || 0
        });
      }
    }

    // Buscar voto do usuário (se existe)
    let meuVoto = {
      Comum: null,
      Raro: null,
      Lendário: null
    };

    try {
      const statsDoc = await getDocument('stats', userId);
      if (statsDoc && statsDoc.voto_beleza) {
        const votoData = statsDoc.voto_beleza;
        const agora = new Date();

        // Verificar votos de cada categoria
        ['Comum', 'Raro', 'Lendário'].forEach(categoria => {
          if (votoData[categoria]) {
            const dataVoto = new Date(votoData[categoria].votadoEm);
            // Verificar se o voto é do mês atual
            if (dataVoto.getMonth() === agora.getMonth() && dataVoto.getFullYear() === agora.getFullYear()) {
              meuVoto[categoria] = votoData[categoria];
            }
          }
        });
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

    // Verificar se já votou nesta categoria este mês
    const stats = await getDocument('stats', userId);
    if (stats && stats.voto_beleza && stats.voto_beleza[categoria]) {
      const dataVoto = new Date(stats.voto_beleza[categoria].votadoEm);
      const agora = new Date();
      if (dataVoto.getMonth() === agora.getMonth() && dataVoto.getFullYear() === agora.getFullYear()) {
        return NextResponse.json(
          { message: `Você já votou na categoria ${categoria} este mês!` },
          { status: 400 }
        );
      }
    }

    // Registrar voto
    const agora = new Date();
    const votoCategoria = {
      avatarId,
      votadoEm: agora.toISOString()
    };

    // Preparar estrutura de votos completa
    const votosAtualizados = {
      Comum: stats?.voto_beleza?.Comum || null,
      Raro: stats?.voto_beleza?.Raro || null,
      Lendário: stats?.voto_beleza?.Lendário || null,
      [categoria]: votoCategoria
    };

    // Atualizar stats do votante (criar documento se não existir)
    if (!stats) {
      // Se o documento não existe, criar um novo com o voto
      await setDocument('stats', userId, {
        voto_beleza: votosAtualizados
      });
    } else {
      // Se existe, atualizar apenas o campo voto_beleza
      await updateDocument('stats', userId, {
        voto_beleza: votosAtualizados
      });
    }

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
