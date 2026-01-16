import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from "@/lib/firebase/firestore";
import { validateRequest } from '@/lib/api/middleware';

/**
 * POST /api/renovar-vela
 *
 * Renova a vela memorial de um avatar morto
 * - Primeira renovação: acende a vela pela primeira vez (7 dias de proteção)
 * - Renovações seguintes: estende proteção por mais 7 dias
 *
 * MECÂNICA:
 * - Avatar morto sem vela: pode renovar a qualquer momento
 * - Vela ativa (< 7 dias): NÃO pode renovar ainda
 * - Período crítico (7-8 dias): DEVE renovar urgentemente
 * - Após 8 dias: Avatar deletado automaticamente
 */
export async function POST(request) {
  console.log("=== RENOVAR VELA MEMORIAL ===");

  try {
    const validation = await validateRequest(request, ['userId', 'avatarId']);
    if (!validation.valid) return validation.response;

    const { userId, avatarId } = validation.body;

    // Buscar avatar
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar) {
      return NextResponse.json(
        { message: "Avatar não encontrado" },
        { status: 404 }
      );
    }

    // Verificar ownership
    if (avatar.user_id !== userId) {
      return NextResponse.json(
        { message: "Este avatar não pertence a você" },
        { status: 403 }
      );
    }

    // Só pode renovar vela de avatar morto
    if (avatar.vivo) {
      return NextResponse.json(
        { message: "Avatar está vivo, não precisa de vela memorial" },
        { status: 400 }
      );
    }

    const agora = new Date();
    const agoraMs = agora.getTime();

    // ==================== PRIMEIRA RENOVAÇÃO ====================
    if (!avatar.vela_ultima_renovacao) {
      console.log("🕯️ Primeira renovação - acendendo vela memorial");

      await updateDocument('avatares', avatarId, {
        vela_ultima_renovacao: agora.toISOString(),
        updated_at: agora.toISOString()
      });

      return NextResponse.json({
        message: "🕯️ Vela memorial acesa! Este avatar está protegido por 7 dias.",
        vela: {
          estado: 'ativa',
          proxima_renovacao: new Date(agoraMs + 7 * 24 * 60 * 60 * 1000).toISOString(),
          dias_restantes: 7
        }
      });
    }

    // ==================== VERIFICAR SE PODE RENOVAR ====================
    let ultimaRenovacaoMs;
    if (avatar.vela_ultima_renovacao.toDate) {
      ultimaRenovacaoMs = avatar.vela_ultima_renovacao.toDate().getTime();
    } else if (avatar.vela_ultima_renovacao.seconds) {
      ultimaRenovacaoMs = avatar.vela_ultima_renovacao.seconds * 1000;
    } else if (typeof avatar.vela_ultima_renovacao === 'string') {
      ultimaRenovacaoMs = new Date(avatar.vela_ultima_renovacao).getTime();
    } else {
      ultimaRenovacaoMs = avatar.vela_ultima_renovacao;
    }

    const tempoDesdeRenovacao = agoraMs - ultimaRenovacaoMs;
    const DURACAO_VELA = 7 * 24 * 60 * 60 * 1000; // 7 dias

    // Se a vela ainda está ativa (< 7 dias), não pode renovar
    if (tempoDesdeRenovacao < DURACAO_VELA) {
      const tempoRestante = DURACAO_VELA - tempoDesdeRenovacao;
      const diasRestantes = Math.floor(tempoRestante / (1000 * 60 * 60 * 24));
      const horasRestantes = Math.floor((tempoRestante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      return NextResponse.json({
        message: "Vela ainda está acesa! Aguarde o período crítico para renovar.",
        vela: {
          estado: 'ativa',
          pode_renovar: false,
          tempo_restante: `${diasRestantes}d ${horasRestantes}h`
        }
      }, { status: 400 });
    }

    // ==================== RENOVAR VELA ====================
    console.log("🕯️ Renovando vela memorial (período crítico)");

    await updateDocument('avatares', avatarId, {
      vela_ultima_renovacao: agora.toISOString(),
      updated_at: agora.toISOString()
    });

    return NextResponse.json({
      message: "🕯️ Vela renovada! Avatar protegido por mais 7 dias.",
      vela: {
        estado: 'ativa',
        proxima_renovacao: new Date(agoraMs + 7 * 24 * 60 * 60 * 1000).toISOString(),
        dias_restantes: 7
      }
    });

  } catch (error) {
    console.error("❌ ERRO:", error);
    return NextResponse.json(
      { message: "Erro ao renovar vela: " + error.message },
      { status: 500 }
    );
  }
}
