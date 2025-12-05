import { NextResponse } from 'next/server';
import { getDocuments, getDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import { validateRequest, validateAvatarOwnership, validateAvatarIsAlive } from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  console.log('\n🔔 ========== GET /meus-avatares CHAMADO ==========');
  console.log('⏰ Hora:', new Date().toISOString());

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    console.log('👤 userId:', userId);

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

    console.log(`📦 Avatares encontrados: ${avatares?.length || 0}`);

    if (!avatares) {
      console.error("Erro ao buscar avatares");
      return NextResponse.json(
        { message: "Erro ao buscar avatares" },
        { status: 500 }
      );
    }

    // ==================== RECUPERAÇÃO PASSIVA DE EXAUSTÃO ====================
    // SISTEMA SIMPLES: Recupera 10 pontos por hora automaticamente
    const avataresAtualizados = [];
    const agora = new Date();

    console.log('🔄 Iniciando processamento de recuperação...');

    for (const avatar of (avatares || [])) {
      let avatarAtualizado = { ...avatar };

      // Inicializar HP se não existir
      if (avatarAtualizado.hp_atual === undefined || avatarAtualizado.hp_atual === null) {
        const hpMaximo = (avatarAtualizado.resistencia * 10) + (avatarAtualizado.nivel * 5);
        avatarAtualizado.hp_atual = hpMaximo;

        try {
          await updateDocument('avatares', avatar.id, {
            hp_atual: hpMaximo,
            updated_at: agora.toISOString()
          });
        } catch (err) {
          console.error(`Erro ao inicializar HP:`, err);
        }
      }

      // ===== RECUPERAÇÃO AUTOMÁTICA DE EXAUSTÃO =====
      const exaustaoAtual = avatarAtualizado.exaustao || 0;

      console.log(`\n🔍 Avatar: ${avatarAtualizado.nome}`);
      console.log(`   Vivo: ${avatarAtualizado.vivo}`);
      console.log(`   Exaustão: ${exaustaoAtual}`);
      console.log(`   updated_at: ${avatarAtualizado.updated_at}`);

      // Só recupera se: vivo, exaustão > 0
      if (!avatarAtualizado.vivo) {
        console.log(`   ❌ SKIP: Avatar morto`);
        avataresAtualizados.push(avatarAtualizado);
        continue;
      }

      if (exaustaoAtual === 0) {
        console.log(`   ✅ SKIP: Exaustão já é 0`);
        avataresAtualizados.push(avatarAtualizado);
        continue;
      }

      // Calcular tempo desde última atualização
      // Firestore retorna Timestamps, preciso converter corretamente
      let ultimaAtualizacao;
      if (avatarAtualizado.updated_at) {
        // Se é Timestamp do Firestore, usar .toDate() ou .seconds
        if (avatarAtualizado.updated_at.toDate) {
          ultimaAtualizacao = avatarAtualizado.updated_at.toDate();
        } else if (avatarAtualizado.updated_at.seconds) {
          ultimaAtualizacao = new Date(avatarAtualizado.updated_at.seconds * 1000);
        } else if (typeof avatarAtualizado.updated_at === 'string') {
          ultimaAtualizacao = new Date(avatarAtualizado.updated_at);
        } else {
          ultimaAtualizacao = agora;
        }
      } else if (avatarAtualizado.created_at) {
        if (avatarAtualizado.created_at.toDate) {
          ultimaAtualizacao = avatarAtualizado.created_at.toDate();
        } else if (avatarAtualizado.created_at.seconds) {
          ultimaAtualizacao = new Date(avatarAtualizado.created_at.seconds * 1000);
        } else if (typeof avatarAtualizado.created_at === 'string') {
          ultimaAtualizacao = new Date(avatarAtualizado.created_at);
        } else {
          ultimaAtualizacao = agora;
        }
      } else {
        ultimaAtualizacao = agora;
      }

      const horasPassadas = (agora - ultimaAtualizacao) / (1000 * 60 * 60);
      const minutosPassados = horasPassadas * 60;

      console.log(`   ⏰ Última atualização: ${ultimaAtualizacao.toISOString()}`);
      console.log(`   ⌚ Tempo passado: ${horasPassadas.toFixed(2)}h (${minutosPassados.toFixed(1)} minutos)`);

      // Precisa ter passado pelo menos 5 minutos (0.083 horas)
      if (horasPassadas < 0.083) {
        console.log(`   ⏱️ SKIP: Menos de 5 minutos desde última atualização`);
        avataresAtualizados.push(avatarAtualizado);
        continue;
      }

      // RECUPERAÇÃO SIMPLES: 10 pontos por hora
      const recuperacao = Math.floor(horasPassadas * 10);

      if (recuperacao > 0) {
        const novaExaustao = Math.max(0, exaustaoAtual - recuperacao);

        console.log(`✅ Recuperação: ${avatarAtualizado.nome} | ${exaustaoAtual} → ${novaExaustao} (-${recuperacao} pts em ${horasPassadas.toFixed(2)}h)`);

        try {
          await updateDocument('avatares', avatarAtualizado.id, {
            exaustao: novaExaustao,
            updated_at: agora.toISOString()
          });

          avatarAtualizado.exaustao = novaExaustao;
          avatarAtualizado.updated_at = agora.toISOString();
        } catch (err) {
          console.error(`Erro ao atualizar exaustão:`, err);
        }
      }

      avataresAtualizados.push(avatarAtualizado);
    }

    console.log('\n✅ ========== GET /meus-avatares CONCLUÍDO ==========\n');

    return NextResponse.json({
      avatares: avataresAtualizados,
      total: avataresAtualizados.length
    });
  } catch (error) {
    console.error("❌ Erro no servidor:", error);
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
