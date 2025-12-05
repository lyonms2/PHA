import { NextResponse } from 'next/server';
import { getDocuments, getDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import { processarRecuperacao } from "@/app/avatares/sistemas/exhaustionSystem";
import { validateRequest, validateAvatarOwnership, validateAvatarIsAlive } from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
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
      return NextResponse.json(
        { message: "Erro ao buscar avatares" },
        { status: 500 }
      );
    }

    // ==================== RECUPERAÇÃO PASSIVA DE EXAUSTÃO ====================
    // Para cada avatar vivo e inativo, calcular recuperação baseada em tempo real
    const avataresAtualizados = [];
    const agora = new Date();

    console.log(`\n🔄 [RECUPERAÇÃO PASSIVA] Processando ${avatares?.length || 0} avatares...`);

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
      let ultimaAtualizacao = avatarAtualizado.updated_at
        ? new Date(avatarAtualizado.updated_at)
        : avatarAtualizado.created_at
          ? new Date(avatarAtualizado.created_at)
          : agora;

      // Validar se a data é válida
      if (isNaN(ultimaAtualizacao.getTime())) {
        console.warn(`⚠️ Data inválida para avatar ${avatarAtualizado.nome}, usando data atual`);
        ultimaAtualizacao = agora;
      }

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
        if (exaustaoAtual > 0) {
          console.log(`⏱️ [SKIP] Avatar ${avatarAtualizado.nome}: Menos de 1 min desde última atualização (${minutosPassados} min)`);
        }
        avataresAtualizados.push(avatarAtualizado);
        continue;
      }

      const horasPassadas = minutosPassados / 60;

      // Avatar INATIVO recupera automaticamente
      // Avatar ATIVO não recupera (está sendo usado)
      const estaAtivo = avatarAtualizado.ativo === true;

      // Avatares ativos não recuperam exaustão
      if (estaAtivo) {
        console.log(`⏸️ [ATIVO] Avatar ${avatarAtualizado.nome}: Não recupera exaustão (está ativo)`);
        avataresAtualizados.push(avatarAtualizado);
        continue;
      }

      // Usar função do sistema de exaustão
      const totalmenteInativo = true; // Avatar está desativado
      const resultado = processarRecuperacao(exaustaoAtual, horasPassadas, totalmenteInativo, false);

      const recuperacao = resultado.recuperacao;

      if (recuperacao > 0) {
        const novaExaustao = resultado.exaustao_nova;

        console.log(`✅ [RECUPERAÇÃO AUTOMÁTICA] Avatar ${avatarAtualizado.nome}:`, {
          exaustao_antes: exaustaoAtual,
          exaustao_depois: novaExaustao,
          minutos_passados: minutosPassados,
          horas_passadas: horasPassadas.toFixed(2),
          recuperacao_aplicada: recuperacao.toFixed(2),
          ativo: estaAtivo,
          taxa_usada: totalmenteInativo ? '15 pts/h (descansando)' : '8 pts/h (inativo)',
          nivel_antes: resultado.nivel_anterior.nome,
          nivel_depois: resultado.nivel_novo.nome
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

    return NextResponse.json({
      avatares: avataresAtualizados,
      total: avataresAtualizados.length
    });
  } catch (error) {
    console.error("Erro no servidor:", error);
    return NextResponse.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const requestTime = new Date().toISOString();
  console.log(`\n[ATIVAR AVATAR] ====== REQUISIÇÃO em ${requestTime} ======`);

  try {
    // Validar campos obrigatórios
    const validation = await validateRequest(request, ['userId', 'avatarId']);
    if (!validation.valid) return validation.response;

    const { userId, avatarId } = validation.body;

    console.log(`[ATIVAR AVATAR] userId=${userId?.substring(0, 8)}, avatarId=${avatarId?.substring(0, 8)}`);

    // Validar propriedade do avatar
    const avatarCheck = await validateAvatarOwnership(avatarId, userId);
    if (!avatarCheck.valid) {
      console.log(`[ATIVAR AVATAR] ❌ Avatar não encontrado`);
      return avatarCheck.response;
    }

    const avatarToActivate = avatarCheck.avatar;

    console.log(`[ATIVAR AVATAR] Avatar encontrado: ${avatarToActivate.nome} (vivo=${avatarToActivate.vivo}, ativo atual=${avatarToActivate.ativo})`);

    // Validar que avatar está vivo
    const aliveCheck = validateAvatarIsAlive(avatarToActivate);
    if (!aliveCheck.valid) {
      console.log(`[ATIVAR AVATAR] ❌ Avatar morto, não pode ativar`);
      return aliveCheck.response;
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
      return NextResponse.json(
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

    return NextResponse.json({
      success: true,
      message: "Avatar ativado com sucesso!",
      avatar: avatarAtivado,
      avatares: todosAvatares || []
    });

  } catch (error) {
    console.error("[ATIVAR AVATAR] Erro crítico:", error);
    return NextResponse.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Validar campos obrigatórios
    const validation = await validateRequest(request, ['userId', 'avatarId']);
    if (!validation.valid) return validation.response;

    const { userId, avatarId } = validation.body;

    // Validar propriedade do avatar
    const avatarCheck = await validateAvatarOwnership(avatarId, userId);
    if (!avatarCheck.valid) return avatarCheck.response;

    // Deletar o avatar do Firestore
    try {
      await deleteDocument('avatares', avatarId);
    } catch (deleteError) {
      console.error("Erro ao deletar avatar:", deleteError);
      return NextResponse.json(
        { message: "Erro ao deletar avatar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Avatar removido com sucesso"
    });

  } catch (error) {
    console.error("Erro ao deletar:", error);
    return NextResponse.json(
      { message: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}
