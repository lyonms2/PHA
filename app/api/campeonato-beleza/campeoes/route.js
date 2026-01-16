import { NextResponse } from "next/server";
import { getDocuments, getDocument, setDocument } from "@/lib/firebase/firestore";

export const dynamic = 'force-dynamic';

// GET - Buscar histórico de campeões
export async function GET(request) {
  try {
    // Buscar todos os registros de vencedores
    const vencedoresData = await getDocuments('campeonato_vencedores');

    // Formatar dados para o frontend
    const campeoes = vencedoresData.map(doc => ({
      id: doc.id, // formato: "2026-01"
      ano: doc.ano,
      mes: doc.mes,
      vencedores: doc.vencedores // { Comum: {...}, Raro: {...}, Lendário: {...} }
    }));

    // Ordenar por ano e mês (mais recente primeiro)
    campeoes.sort((a, b) => {
      if (a.ano !== b.ano) return b.ano - a.ano;
      return b.mes - a.mes;
    });

    return NextResponse.json({
      campeoes
    });

  } catch (error) {
    console.error("Erro em GET /campeonato-beleza/campeoes:", error);
    return NextResponse.json(
      { message: "Erro ao carregar histórico de campeões" },
      { status: 500 }
    );
  }
}

// POST - Registrar campeões do mês (administrativo)
export async function POST(request) {
  try {
    const { ano, mes, adminKey } = await request.json();

    // Validação de segurança (chave administrativa)
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 403 }
      );
    }

    if (!ano || !mes) {
      return NextResponse.json(
        { message: "Ano e mês são obrigatórios" },
        { status: 400 }
      );
    }

    // ID do documento: formato "YYYY-MM"
    const docId = `${ano}-${String(mes).padStart(2, '0')}`;

    // Buscar todos os avatares e calcular ranking
    const avatarsData = await getDocuments('avatares');
    const avatares = avatarsData.filter(av => av.vivo); // Apenas vivos

    // Separar por categoria e ordenar por votos
    const ranking = {
      Comum: avatares.filter(av => av.raridade === 'Comum').sort((a, b) => (b.votosRecebidos || 0) - (a.votosRecebidos || 0)),
      Raro: avatares.filter(av => av.raridade === 'Raro').sort((a, b) => (b.votosRecebidos || 0) - (a.votosRecebidos || 0)),
      Lendário: avatares.filter(av => av.raridade === 'Lendário').sort((a, b) => (b.votosRecebidos || 0) - (a.votosRecebidos || 0))
    };

    // Pegar o 1º lugar de cada categoria
    const vencedores = {};

    for (const [categoria, avataresCat] of Object.entries(ranking)) {
      if (avataresCat.length > 0 && avataresCat[0].votosRecebidos > 0) {
        const vencedor = avataresCat[0];

        // Buscar informações do caçador (dono do avatar)
        const statsDoc = await getDocument('stats', vencedor.userId);
        const cacadorNome = statsDoc?.nome_operacao || 'Caçador Desconhecido';

        vencedores[categoria] = {
          avatarId: vencedor.id,
          avatarNome: vencedor.nome,
          userId: vencedor.userId,
          cacadorNome,
          votos: vencedor.votosRecebidos,
          avatar: {
            // Dados completos do avatar para renderização
            cor_primaria: vencedor.cor_primaria,
            cor_secundaria: vencedor.cor_secundaria,
            cor_roupa: vencedor.cor_roupa,
            estilo_roupa: vencedor.estilo_roupa,
            cor_cabelo: vencedor.cor_cabelo,
            estilo_cabelo: vencedor.estilo_cabelo,
            cor_olhos: vencedor.cor_olhos,
            cor_pele: vencedor.cor_pele,
            acessorio: vencedor.acessorio,
            elemento: vencedor.elemento,
            raridade: vencedor.raridade
          }
        };
      }
    }

    // Salvar no Firestore
    await setDocument('campeonato_vencedores', docId, {
      ano,
      mes,
      vencedores,
      registradoEm: new Date().toISOString()
    });

    console.log(`✅ Campeões de ${mes}/${ano} registrados com sucesso!`);

    return NextResponse.json({
      message: "Campeões registrados com sucesso!",
      vencedores
    });

  } catch (error) {
    console.error("Erro em POST /campeonato-beleza/campeoes:", error);
    return NextResponse.json(
      { message: "Erro ao registrar campeões" },
      { status: 500 }
    );
  }
}
