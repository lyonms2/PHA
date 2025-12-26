import { NextResponse } from 'next/server';
import { getDocument, getDocuments, createDocument, updateDocument } from "@/lib/firebase/firestore";
import { validateRequest } from '@/lib/api/middleware';
import { trackMissionProgress } from '@/lib/missions/missionTracker';

// Importar sistemas
import { ELEMENTOS, aplicarBonusElemental } from '../../avatares/sistemas/elementalSystem';
import { gerarStatsBalanceados } from '../../avatares/sistemas/statsSystem';
import { selecionarHabilidadesIniciais } from '../../avatares/sistemas/abilitiesSystem';
import { gerarNomeCompleto, gerarDescricaoNarrativa } from '../../avatares/sistemas/loreSystem';
import { getHunterRank, aplicarBonusInvocacao, calcularXpFeito, verificarPromocao, getLimiteAvatares } from '@/lib/hunter/hunterRankSystem';

// ==================== FUNÇÕES DE GERAÇÃO ====================

function escolherAleatorio(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Escolhe elemento INDEPENDENTE da raridade
 * Void e Aether são EXTREMAMENTE RAROS:
 * - 0.5% chance de Void (em QUALQUER raridade)
 * - 0.5% chance de Aether (em QUALQUER raridade)
 * - 99% chance de elementos comuns
 */
function escolherElemento(raridade) {
  // ==================== VOID/AETHER AJUSTADO ====================
  // INDEPENDENTE da raridade, Void/Aether têm chance fixa de 0.5% cada
  const rand = Math.random();

  if (rand < 0.005) {
    console.log(`🕳️ [VOID] Elemento raro VOID obtido! (0.5% de chance)`);
    return ELEMENTOS.VOID;  // 0.5% chance
  }

  if (rand < 0.01) {
    console.log(`✨ [AETHER] Elemento raro AETHER obtido! (0.5% de chance)`);
    return ELEMENTOS.AETHER; // 0.5% chance
  }

  // 99% chance de elemento comum
  const elementosComuns = [
    ELEMENTOS.FOGO,
    ELEMENTOS.AGUA,
    ELEMENTOS.TERRA,
    ELEMENTOS.VENTO,
    ELEMENTOS.ELETRICIDADE,
    ELEMENTOS.SOMBRA,
    ELEMENTOS.LUZ
  ];

  return escolherAleatorio(elementosComuns);
  // ==============================================================
}

/**
 * Determina raridade baseado em probabilidades balanceadas
 * Primeira invocação sempre é Comum
 * Aplica bônus do rank do caçador
 * PITY SYSTEM:
 * - 30 invocações sem Raro = Raro garantido
 * - 100 invocações sem Lendário = Lendário garantido
 */
function determinarRaridade(primeiraInvocacao = false, hunterRank = null, pityStats = null) {
  if (primeiraInvocacao) {
    return 'Comum';
  }

  // ==================== PITY SYSTEM ====================
  // Verificar pity antes do RNG
  if (pityStats) {
    const semRaro = pityStats.invocacoes_sem_raro || 0;
    const semLendario = pityStats.invocacoes_sem_lendario || 0;

    console.log(`🎲 [PITY] Invocações sem Raro: ${semRaro}/30 | Sem Lendário: ${semLendario}/100`);

    // PITY LENDÁRIO (prioridade máxima - 100 invocações)
    if (semLendario >= 100) {
      console.log(`🌟 [PITY] LENDÁRIO GARANTIDO! (100+ invocações sem lendário)`);
      return 'Lendário';
    }

    // PITY RARO (30 invocações)
    if (semRaro >= 30) {
      console.log(`✨ [PITY] RARO GARANTIDO! (30+ invocações sem raro)`);
      return 'Raro';
    }
  }
  // =====================================================

  // Chances base: 70% Comum, 28% Raro, 2% Lendário
  let chancesBase = {
    comum: 0.70,
    raro: 0.28,
    lendario: 0.02
  };

  // Aplicar bônus do rank do caçador
  if (hunterRank) {
    chancesBase = aplicarBonusInvocacao(chancesBase, hunterRank);
  }

  const rand = Math.random();

  // Verificar do mais raro para o mais comum
  if (rand < chancesBase.lendario) return 'Lendário';
  if (rand < chancesBase.lendario + chancesBase.raro) return 'Raro';
  return 'Comum';
}

/**
 * Gera um avatar completo usando todos os sistemas
 */
function gerarAvatarCompleto(primeiraInvocacao = false, hunterRank = null, pityStats = null) {
  console.log("=== GERANDO AVATAR COM NOVOS SISTEMAS ===");

  // 1. DETERMINAR RARIDADE (com bônus do rank + pity system)
  const raridade = determinarRaridade(primeiraInvocacao, hunterRank, pityStats);
  console.log(`Raridade: ${raridade}`);
  
  // 2. ESCOLHER ELEMENTO (com raridade para Void e Aether)
  const elemento = escolherElemento(raridade);
  console.log(`Elemento: ${elemento}`);
  
  // 3. GERAR NOME COM LORE SYSTEM
  const nome = gerarNomeCompleto(elemento, raridade);
  console.log(`Nome: ${nome}`);
  
  // 4. GERAR DESCRIÇÃO NARRATIVA
  const descricao = gerarDescricaoNarrativa(elemento, raridade);
  console.log(`Descrição: ${descricao.substring(0, 50)}...`);
  
  // 5. GERAR STATS BALANCEADOS
  const statsBase = gerarStatsBalanceados(raridade, elemento);
  console.log(`Stats base gerados:`, statsBase);
  
  // 6. APLICAR BÔNUS ELEMENTAL (já aplicado no gerarStatsBalanceados)
  const stats = statsBase;
  
  // 7. SELECIONAR HABILIDADES
  const habilidades = selecionarHabilidadesIniciais(elemento, raridade);
  console.log(`Habilidades selecionadas: ${habilidades.length}`);
  
  // 8. MONTAR AVATAR COMPLETO
  // Calcular HP máximo baseado em resistência, nível e raridade
  const bonusRaridade = raridade === 'Lendário' ? 200 : raridade === 'Raro' ? 100 : 0;
  const hpMaximo = (stats.resistencia * 20) + (1 * 10) + bonusRaridade; // nivel = 1 no início

  const avatar = {
    nome,
    descricao,
    elemento,
    raridade,
    nivel: 1,
    experiencia: 0,
    vinculo: 0,
    exaustao: 0, // Novo sistema de exaustão
    hp_atual: hpMaximo, // Inicializar com HP máximo

    // Stats
    forca: stats.forca,
    agilidade: stats.agilidade,
    resistencia: stats.resistencia,
    foco: stats.foco,
    
    // Habilidades (salvar objeto completo para funcionar em batalha)
    habilidades: habilidades.map(hab => ({
      nome: hab.nome,
      descricao: hab.descricao,
      tipo: hab.tipo,
      raridade: hab.raridade,
      elemento: hab.elemento,
      // Campos críticos para batalha
      custo_energia: hab.custo_energia,
      cooldown: hab.cooldown,
      dano_base: hab.dano_base,
      multiplicador_stat: hab.multiplicador_stat,
      stat_primario: hab.stat_primario,
      efeitos_status: hab.efeitos_status || [],
      alvo: hab.alvo,
      area: hab.area,
      num_alvos: hab.num_alvos,
      chance_acerto: hab.chance_acerto,
      chance_efeito: hab.chance_efeito,
      duracao_efeito: hab.duracao_efeito ?? null, // Converter undefined para null (Firebase não aceita undefined)
      nivel_minimo: hab.nivel_minimo,
      vinculo_minimo: hab.vinculo_minimo
    })),
    
    // Status
    vivo: true,
    ativo: false,
    marca_morte: false // Garantir que seja boolean
    
    // ❌ REMOVIDO: primeira_invocacao (metadado não vai pro banco)
    // ❌ REMOVIDO: data_invocacao (usando created_at do banco)
  };
  
  console.log("Avatar completo gerado!");
  return avatar;
}

// ==================== API ROUTE ====================

// ==================== TRANSAÇÕES ATÔMICAS ====================
// TODO: Implementar versão com runTransaction para garantir atomicidade completa
//
// ESTRUTURA RECOMENDADA:
// const db = admin.firestore();
// await db.runTransaction(async (transaction) => {
//   // 1. LER dados do jogador
//   const statsRef = db.collection('player_stats').doc(userId);
//   const statsDoc = await transaction.get(statsRef);
//
//   // 2. VALIDAR recursos
//   // 3. GERAR avatar (lógica pura, sem DB)
//   // 4. CRIAR avatar
//   const avatarRef = db.collection('avatares').doc();
//   transaction.set(avatarRef, avatarData);
//
//   // 5. ATUALIZAR stats do jogador
//   transaction.update(statsRef, { moedas, fragmentos, etc });
//
//   // TUDO OU NADA - rollback automático em erro
// });
//
// IMPORTANTE: Dentro de transações, todas as LEITURAS devem vir ANTES das ESCRITAS
// ================================================================

export async function POST(request) {
  console.log("=== INICIANDO INVOCAÇÃO COM SISTEMAS INTEGRADOS ===");

  try {
    // Validar campo obrigatório
    const validation = await validateRequest(request, ['userId']);
    if (!validation.valid) return validation.response;

    const { userId } = validation.body;
    console.log("Buscando stats do jogador:", userId);
    console.log("⚠️ [TRANSAÇÃO] Sistema ainda não usa transações atômicas - implementação futura");

    // Buscar stats do jogador do Firestore
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      console.error("Jogador não encontrado");
      return NextResponse.json(
        { message: "Jogador não encontrado. Inicialize o jogador primeiro." },
        { status: 404 }
      );
    }

    console.log("Stats encontrados:", stats);

    // ==================== VERIFICAR PRIMEIRA INVOCAÇÃO GRATUITA ====================
    const ehPrimeiraInvocacao = stats.primeira_invocacao;
    const custoMoedas = ehPrimeiraInvocacao ? 0 : 250;
    const custoFragmentos = ehPrimeiraInvocacao ? 0 : 5;

    console.log("🎁 [PRIMEIRA_INVOCACAO] Flag primeira_invocacao:", ehPrimeiraInvocacao);
    console.log("💰 [PRIMEIRA_INVOCACAO] Custo Moedas:", custoMoedas, "(normal: 250)");
    console.log("💎 [PRIMEIRA_INVOCACAO] Custo Fragmentos:", custoFragmentos, "(normal: 5)");

    if (ehPrimeiraInvocacao) {
      console.log("✅ [PRIMEIRA_INVOCACAO] INVOCAÇÃO GRATUITA! Custos zerados.");
    } else {
      console.log("💵 [PRIMEIRA_INVOCACAO] Invocação paga. Recursos atuais:", {
        moedas: stats.moedas,
        fragmentos: stats.fragmentos
      });
    }

    // Verificar recursos (lógica customizada porque é condicional)
    if (!ehPrimeiraInvocacao && (stats.moedas < custoMoedas || stats.fragmentos < custoFragmentos)) {
      console.log("❌ [PRIMEIRA_INVOCACAO] Recursos insuficientes!");
      return NextResponse.json(
        {
          message: stats.moedas < custoMoedas
            ? "Moedas insuficientes para invocação"
            : "Fragmentos insuficientes para invocação",
          recursos_necessarios: { moedas: custoMoedas, fragmentos: custoFragmentos },
          recursos_atuais: { moedas: stats.moedas, fragmentos: stats.fragmentos }
        },
        { status: 400 }
      );
    }
    // ===============================================================================

    // ==================== LIMITE PROGRESSIVO POR HUNTER RANK ====================
    // Obter rank do caçador primeiro para determinar limite de avatares
    const hunterRankAtual = getHunterRank(stats.hunterRankXp || 0);
    const LIMITE_AVATARES = getLimiteAvatares(hunterRankAtual);
    console.log(`📊 [LIMITE] Hunter Rank ${hunterRankAtual.nome}: limite de ${LIMITE_AVATARES} avatares`);

    // Verificar limite de avatares (avatares no memorial não contam)
    console.log("Verificando limite de avatares...");
    const avatares = await getDocuments('avatares', {
      where: [['user_id', '==', userId]]
    });

    if (!avatares) {
      console.error("Erro ao contar avatares");
      return Response.json(
        { message: "Erro ao verificar limite de avatares" },
        { status: 500 }
      );
    }

    // Contar apenas avatares que não estão no memorial (vivos OU mortos sem marca_morte)
    const avataresConta = avatares.filter(av => !(av.marca_morte && !av.vivo)).length;

    console.log(`Avatares contados: ${avataresConta}/${LIMITE_AVATARES}`);

    if (avataresConta >= LIMITE_AVATARES) {
      console.log("❌ Limite de avatares atingido!");
      return Response.json(
        {
          message: `Você atingiu o limite de ${LIMITE_AVATARES} avatares para seu Hunter Rank ${hunterRankAtual.nome}! Suba de rank para aumentar o limite, ou sacrifique avatares inativos.`,
          limite: LIMITE_AVATARES,
          avatares_atuais: avataresConta,
          slots_disponiveis: 0,
          hunter_rank: hunterRankAtual.nome
        },
        { status: 400 }
      );
    }
    // ============================================================================

    console.log("Gerando avatar com sistemas integrados...");

    // Obter rank do caçador para aplicar bônus
    const hunterRank = getHunterRank(stats.hunterRankXp || 0);
    console.log(`Hunter Rank: ${hunterRank.nome} (${stats.hunterRankXp || 0} XP)`);

    // Preparar pity stats
    const pityStats = {
      invocacoes_sem_raro: stats.invocacoes_sem_raro || 0,
      invocacoes_sem_lendario: stats.invocacoes_sem_lendario || 0
    };

    // GERAR AVATAR COM TODOS OS SISTEMAS (incluindo pity system)
    const avatarGerado = gerarAvatarCompleto(ehPrimeiraInvocacao, hunterRank, pityStats);
    avatarGerado.user_id = userId;
    // ❌ REMOVIDO: avatarGerado.data_invocacao (coluna não existe no banco)

    console.log("Avatar gerado:", {
      nome: avatarGerado.nome,
      raridade: avatarGerado.raridade,
      elemento: avatarGerado.elemento,
      stats: {
        forca: avatarGerado.forca,
        agilidade: avatarGerado.agilidade,
        resistencia: avatarGerado.resistencia,
        foco: avatarGerado.foco
      },
      habilidades: avatarGerado.habilidades.length
    });

    // Inserir avatar no Firestore (sem especificar ID, deixar Firestore gerar)
    const avatarId = await createDocument('avatares', avatarGerado);

    if (!avatarId) {
      console.error("Erro ao inserir avatar");
      return Response.json(
        { message: "Erro ao criar avatar" },
        { status: 500 }
      );
    }

    const avatar = { id: avatarId, ...avatarGerado };

    console.log("Avatar inserido no banco com ID:", avatar.id);

    // Atualizar recursos do jogador no Firestore
    const novosMoedas = stats.moedas - custoMoedas;
    const novosFragmentos = stats.fragmentos - custoFragmentos;

    // Calcular XP de rank ganho por invocar avatar
    const xpGanho = calcularXpFeito('AVATAR_INVOCADO');
    const xpAnterior = stats.hunterRankXp || 0;
    const novoHunterRankXp = xpAnterior + xpGanho;

    // Verificar promoção de rank
    const promocao = verificarPromocao(xpAnterior, novoHunterRankXp);

    // ==================== ATUALIZAR CONTADORES DE PITY ====================
    let novoContadorRaro = (stats.invocacoes_sem_raro || 0);
    let novoContadorLendario = (stats.invocacoes_sem_lendario || 0);

    if (avatar.raridade === 'Lendário') {
      // Reset AMBOS os contadores (Lendário também é Raro+)
      novoContadorRaro = 0;
      novoContadorLendario = 0;
      console.log(`🎲 [PITY] Contadores resetados (obteve Lendário)`);
    } else if (avatar.raridade === 'Raro') {
      // Reset contador de Raro, incrementa Lendário
      novoContadorRaro = 0;
      novoContadorLendario += 1;
      console.log(`🎲 [PITY] Contador Raro resetado | Lendário: ${novoContadorLendario}`);
    } else {
      // Comum: incrementa AMBOS
      novoContadorRaro += 1;
      novoContadorLendario += 1;
      console.log(`🎲 [PITY] Contadores incrementados | Raro: ${novoContadorRaro} | Lendário: ${novoContadorLendario}`);
    }
    // =====================================================================

    try {
      await updateDocument('player_stats', userId, {
        moedas: novosMoedas,
        fragmentos: novosFragmentos,
        hunterRankXp: novoHunterRankXp,
        primeira_invocacao: false,
        invocacoes_sem_raro: novoContadorRaro,
        invocacoes_sem_lendario: novoContadorLendario
      });

      console.log("✅ [PRIMEIRA_INVOCACAO] Flag primeira_invocacao setada para FALSE após invocação");
    } catch (updateError) {
      console.error("Erro ao atualizar stats:", updateError);
      // Não retornar erro aqui, avatar já foi criado
    }

    console.log("Stats atualizados. Novas moedas:", novosMoedas);

    // Registrar no histórico (se a coleção existir)
    try {
      await createDocument('invocacoes_historico', {
        user_id: userId,
        avatar_id: avatar.id,
        custo_moedas: custoMoedas,
        custo_fragmentos: custoFragmentos,
        gratuita: ehPrimeiraInvocacao,
        raridade: avatar.raridade,
        elemento: avatar.elemento
      });
    } catch (error) {
      console.log("Erro ao registrar histórico (ignorado):", error.message);
      // Não bloqueia a invocação se histórico falhar
    }

    // Mensagem especial baseada na raridade
    let mensagemEspecial = "";
    if (avatar.raridade === 'Lendário') {
      mensagemEspecial = "🌟 INVOCAÇÃO LENDÁRIA! Uma entidade primordial atendeu ao seu chamado!";
    } else if (avatar.raridade === 'Raro') {
      mensagemEspecial = "✨ Invocação rara! Um guardião experiente se apresenta!";
    } else {
      mensagemEspecial = ehPrimeiraInvocacao 
        ? "🎉 Primeira invocação concluída! Este é o início de uma grande jornada."
        : "Avatar invocado com sucesso!";
    }

    console.log("✅ Invocação concluída com sucesso!");

    // Rastrear progresso de missões (não bloqueia se falhar)
    trackMissionProgress(userId, 'INVOCAR_AVATAR', 1);

    // Rastrear raridade específica
    if (avatar.raridade === 'Lendário') {
      trackMissionProgress(userId, 'INVOCAR_LENDARIO', 1);
    } else if (avatar.raridade === 'Raro') {
      trackMissionProgress(userId, 'INVOCAR_RARO', 1);
    }

    return Response.json({
      message: mensagemEspecial,
      avatar: {
        ...avatar,
        // Adicionar informações extras para o frontend
        total_stats: avatar.forca + avatar.agilidade + avatar.resistencia + avatar.foco,
        primeira_invocacao: ehPrimeiraInvocacao
      },
      custos: {
        moedas: custoMoedas,
        fragmentos: custoFragmentos,
        gratuita: ehPrimeiraInvocacao
      },
      recursos_restantes: {
        moedas: novosMoedas,
        fragmentos: novosFragmentos
      },
      hunterRank: {
        xpGanho,
        xpTotal: novoHunterRankXp,
        rank: getHunterRank(novoHunterRankXp),
        promocao: promocao.promovido ? promocao : null
      },
      sistemas_aplicados: {
        elemental: true,
        stats: true,
        abilities: true,
        lore: true,
        progression: true,
        bond: true,
        exhaustion: true,
        hunterRank: true
      }
    });

  } catch (error) {
    console.error("❌ ERRO CRÍTICO:", error);
    return Response.json(
      { message: "Erro ao processar invocação: " + error.message },
      { status: 500 }
    );
  }
}
