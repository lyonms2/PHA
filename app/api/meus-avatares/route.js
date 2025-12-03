import { getDocuments, getDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import { processarRecuperacao } from "@/app/avatares/sistemas/exhaustionSystem";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { message: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const avatares = await getDocuments('avatares', {
      where: [['user_id', '==', userId]],
      orderBy: ['created_at', 'desc']
    });

    if (!avatares) {
      console.error("Erro ao buscar avatares");
      return Response.json(
        { message: "Erro ao buscar avatares" },
        { status: 500 }
      );
    }

    // ==================== RECUPERAÇÃO PASSIVA DE EXAUSTÃO ====================
    // Para cada avatar vivo e inativo, calcular recuperação baseada em tempo real
    const avataresAtualizados = [];
    const agora = new Date();

    for (const avatar of (avatares || [])) {
      // ===== INICIALIZAR HP SE NÃO EXISTIR =====
      // Avatares antigos podem não ter hp_atual inicializado
      let avatarAtualizado = { ...avatar };
      if (avatarAtualizado.hp_atual === undefined || avatarAtualizado.hp_atual === null) {
        const hpMaximo = (avatarAtualizado.resistencia * 10) + (avatarAtualizado.nivel * 5);
        avatarAtualizado.hp_atual = hpMaximo; // Inicializar com HP máximo

        // Atualizar no banco de dados
        try {
          await updateDocument('avatares', avatar.id, {
            hp_atual: hpMaximo,
            updated_at: agora.toISOString()
          });
          console.log(`✅ HP inicializado para avatar ${avatar.nome}: ${hpMaximo}`);
        } catch (err) {
          console.error(`Erro ao inicializar HP do avatar ${avatar.nome}:`, err);
        }
      }

      // ===== RECUPERAÇÃO AUTOMÁTICA DE EXAUSTÃO =====
      // Só processar para avatares vivos com exaustão > 0
      const exaustaoAtual = avatarAtualizado.exaustao || 0;

      if (!avatarAtualizado.vivo || exaustaoAtual === 0) {
        avataresAtualizados.push(avatarAtualizado);
        continue;
      }

      // Calcular tempo decorrido desde última atualização
      const ultimaAtualizacao = avatarAtualizado.updated_at
        ? new Date(avatarAtualizado.updated_at)
        : new Date(avatarAtualizado.created_at || agora);

      const minutosPassados = Math.floor((agora - ultimaAtualizacao) / (1000 * 60));

      // Debug: log para ver se está processando
      if (exaustaoAtual > 0) {
        console.log(`[EXAUSTÃO] Avatar ${avatarAtualizado.nome}:`, {
          exaustao: exaustaoAtual,
          ativo: avatarAtualizado.ativo,
          minutos_passados: minutosPassados,
          ultima_atualizacao: ultimaAtualizacao.toISOString()
        });
      }

      // Processar recuperação se passou pelo menos 1 minuto
      if (minutosPassados < 1) {
        avataresAtualizados.push(avatarAtualizado);
        continue;
      }

      const horasPassadas = minutosPassados / 60;

      // Avatar ATIVO não recupera (está em uso)
      // Avatar INATIVO recupera automaticamente (8 pontos/hora)
      const estaAtivo = avatarAtualizado.ativo === true;
      const taxaRecuperacao = estaAtivo ? 0 : 8; // pontos por hora
      const recuperacao = taxaRecuperacao * horasPassadas;

      if (recuperacao > 0) {
        const novaExaustao = Math.max(0, exaustaoAtual - recuperacao);

        console.log(`✅ [RECUPERAÇÃO AUTOMÁTICA] Avatar ${avatarAtualizado.nome}:`, {
          exaustao_antes: exaustaoAtual,
          exaustao_depois: novaExaustao,
          minutos_passados: minutosPassados,
          recuperacao_aplicada: recuperacao,
          ativo: estaAtivo
        });

        // Atualizar no Firestore
        try {
          await updateDocument('avatares', avatarAtualizado.id, {
            exaustao: novaExaustao,
            updated_at: agora.toISOString()
          });

          avataresAtualizados.push({
            ...avatarAtualizado,
            exaustao: novaExaustao,
            updated_at: agora.toISOString()
          });
        } catch (updateError) {
          console.error("❌ Erro ao atualizar exaustão:", updateError);
          avataresAtualizados.push(avatarAtualizado);
        }
      } else {
        avataresAtualizados.push(avatarAtualizado);
      }
    }

    return Response.json({
      avatares: avataresAtualizados,
      total: avataresAtualizados.length
    });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const requestTime = new Date().toISOString();
  console.log(`\n[ATIVAR AVATAR] ====== REQUISIÇÃO em ${requestTime} ======`);

  try {
    const body = await request.json();
    const { userId, avatarId } = body;

    console.log(`[ATIVAR AVATAR] userId=${userId?.substring(0, 8)}, avatarId=${avatarId?.substring(0, 8)}`);

    if (!userId || !avatarId) {
      return Response.json(
        { message: "userId e avatarId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o avatar existe, pertence ao usuário e está vivo
    const avatarToActivate = await getDocument('avatares', avatarId);

    if (!avatarToActivate || avatarToActivate.user_id !== userId) {
      console.log(`[ATIVAR AVATAR] ❌ Avatar não encontrado`);
      return Response.json(
        { message: "Avatar não encontrado ou não pertence ao usuário" },
        { status: 404 }
      );
    }

    console.log(`[ATIVAR AVATAR] Avatar encontrado: ${avatarToActivate.nome} (vivo=${avatarToActivate.vivo}, ativo atual=${avatarToActivate.ativo})`);

    if (!avatarToActivate.vivo) {
      console.log(`[ATIVAR AVATAR] ❌ Avatar morto, não pode ativar`);
      return Response.json(
        { message: "Não é possível ativar um avatar destruído" },
        { status: 400 }
      );
    }

    // Desativar todos os avatares do usuário
    console.log(`[ATIVAR AVATAR] 1️⃣ Desativando TODOS os avatares do usuário...`);

    const timestampNow = new Date().toISOString();

    // Buscar todos os avatares do usuário
    const userAvatares = await getDocuments('avatares', {
      where: [['user_id', '==', userId]]
    });

    // Desativar todos em batch
    let desativadosCount = 0;
    for (const av of userAvatares || []) {
      try {
        await updateDocument('avatares', av.id, {
          ativo: false,
          updated_at: timestampNow
        });
        desativadosCount++;
      } catch (error) {
        console.error(`Erro ao desativar avatar ${av.id}:`, error);
      }
    }

    console.log(`[ATIVAR AVATAR] ✅ ${desativadosCount} avatares desativados`);

    // Ativar o avatar escolhido
    console.log(`[ATIVAR AVATAR] 2️⃣ Ativando avatar ${avatarToActivate.nome}...`);
    const timestampAtivacao = new Date().toISOString();

    try {
      await updateDocument('avatares', avatarId, {
        ativo: true,
        em_venda: false,  // Remover da venda ao ativar
        preco_venda: null,
        preco_fragmentos: null,
        updated_at: timestampAtivacao
      });
    } catch (activateError) {
      console.error("[ATIVAR AVATAR] ❌ Erro ao ativar avatar:", activateError);
      return Response.json(
        { message: "Erro ao ativar avatar" },
        { status: 500 }
      );
    }

    console.log(`[ATIVAR AVATAR] ✅ Avatar ativado com sucesso!`);

    // Buscar todos os avatares atualizados
    console.log(`[ATIVAR AVATAR] 3️⃣ Buscando todos os avatares atualizados...`);
    const todosAvatares = await getDocuments('avatares', {
      where: [['user_id', '==', userId]],
      orderBy: ['created_at', 'desc']
    });

    const avatarAtivado = todosAvatares?.find(av => av.id === avatarId);

    console.log(`[ATIVAR AVATAR] Estado final dos avatares:`);
    todosAvatares?.forEach(av => {
      console.log(`  - ${av.nome}: ativo=${av.ativo} (${typeof av.ativo})`);
    });

    console.log(`[ATIVAR AVATAR] ====== FIM REQUISIÇÃO ======\n`);

    return Response.json({
      success: true,
      message: "Avatar ativado com sucesso!",
      avatar: avatarAtivado,
      avatares: todosAvatares || []
    });

  } catch (error) {
    console.error("[ATIVAR AVATAR] Erro crítico:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { userId, avatarId } = body;

    if (!userId || !avatarId) {
      return Response.json(
        { message: "userId e avatarId são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o avatar pertence ao usuário
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar || avatar.user_id !== userId) {
      return Response.json(
        { message: "Avatar não encontrado" },
        { status: 404 }
      );
    }

    // Deletar o avatar do Firestore
    try {
      await deleteDocument('avatares', avatarId);
    } catch (deleteError) {
      console.error("Erro ao deletar avatar:", deleteError);
      return Response.json(
        { message: "Erro ao deletar avatar" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Avatar removido com sucesso"
    });

  } catch (error) {
    console.error("Erro ao deletar:", error);
    return Response.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
