import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { validarStats } from '../../avatares/sistemas/statsSystem';
import {
  validateRequest,
  validateAvatarOwnership,
  validateNoDeathMark,
  validateResources
} from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ressuscitar-avatar
 *
 * Sistema de Ressurreição Balanceado
 *
 * Penalidades:
 * - Stats reduzidos em 30% (não 50%)
 * - Vínculo reduzido em 50% (não zerado)
 * - XP reduzida em 30%
 * - Exaustão aumentada para 60 (Exausto)
 * - Marca da Morte permanente (não pode ser ressuscitado novamente)
 */
export async function POST(request) {
  console.log("=== INICIANDO RITUAL DE RESSURREIÇÃO ===");

  try {
    // Validar campos obrigatórios
    const validation = await validateRequest(request, ['userId', 'avatarId']);
    if (!validation.valid) return validation.response;

    const { userId, avatarId } = validation.body;
    console.log("Dados recebidos:", { userId, avatarId });

    // Validar propriedade do avatar
    const avatarCheck = await validateAvatarOwnership(avatarId, userId);
    if (!avatarCheck.valid) return avatarCheck.response;

    const avatar = avatarCheck.avatar;

    // Verificar se avatar está morto (lógica customizada)
    if (avatar.vivo) {
      console.error("❌ Avatar não está morto");
      return NextResponse.json(
        { message: "Avatar não está morto" },
        { status: 400 }
      );
    }

    console.log("✅ Avatar encontrado:", avatar.nome);

    // Validar que não tem marca da morte
    const markCheck = validateNoDeathMark(avatar);
    if (!markCheck.valid) {
      console.log("⚠️ Avatar já possui Marca da Morte");
      return NextResponse.json(
        {
          message: "Este avatar já foi ressuscitado uma vez e carrega a Marca da Morte. Não pode ser ressuscitado novamente.",
          aviso: "A morte é permanente para aqueles marcados pelo Necromante."
        },
        { status: 400 }
      );
    }

    // 2. Calcular custo baseado na raridade
    const custos = {
      'Comum': { moedas: 500, fragmentos: 50 },
      'Raro': { moedas: 1000, fragmentos: 100 },
      'Lendário': { moedas: 1500, fragmentos: 150 }
    };

    const custo = custos[avatar.raridade] || custos['Comum'];
    console.log("Custo do ritual:", custo);

    // 3. Verificar recursos do jogador
    console.log("Buscando recursos do jogador...");
    const stats = await getDocument('player_stats', userId);

    if (!stats) {
      console.log("❌ Stats não encontrados");
      return NextResponse.json(
        { message: "Jogador não encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ Recursos do jogador:", stats);

    // Validar recursos suficientes
    const resourceCheck = validateResources(stats, custo);
    if (!resourceCheck.valid) {
      console.log("❌ Recursos insuficientes");
      return resourceCheck.response;
    }

    // 4. CALCULAR PENALIDADES BALANCEADAS
    console.log("Calculando penalidades do ritual...");

    // Stats: -30% (mais justo que -50%)
    const statsReduzidos = {
      forca: Math.floor(avatar.forca * 0.7),
      agilidade: Math.floor(avatar.agilidade * 0.7),
      resistencia: Math.floor(avatar.resistencia * 0.7),
      foco: Math.floor(avatar.foco * 0.7)
    };

    // Validar se stats ainda estão dentro dos limites da raridade
    const validacao = validarStats(statsReduzidos, avatar.raridade);
    if (!validacao.valido) {
      console.log("⚠️ Stats fora dos limites, ajustando...");
      // Se ficaram abaixo do mínimo, ajustar para o mínimo da raridade
      const RANGES = {
        'Comum': { min: 5 },
        'Raro': { min: 10 },
        'Lendário': { min: 16 }
      };
      const minimo = RANGES[avatar.raridade].min;

      Object.keys(statsReduzidos).forEach(stat => {
        if (statsReduzidos[stat] < minimo) {
          statsReduzidos[stat] = minimo;
        }
      });
    }

    console.log("Stats após ressurreição:", statsReduzidos);

    // Vínculo: -50% (não zera completamente)
    const novoVinculo = Math.floor((avatar.vinculo || 0) * 0.5);
    console.log(`Vínculo: ${avatar.vinculo}% → ${novoVinculo}%`);

    // XP: -30% (perde parte da experiência)
    const novaXP = Math.floor((avatar.experiencia || 0) * 0.7);
    console.log(`XP: ${avatar.experiencia} → ${novaXP}`);

    // Exaustão: Sobe para 60 (estado Exausto)
    const novaExaustao = 60;
    console.log(`Exaustão: ${avatar.exaustao || 0} → ${novaExaustao} (EXAUSTO)`);

    // 5. Aplicar ressurreição no Firestore
    console.log("Aplicando ritual de ressurreição...");
    await updateDocument('avatares', avatarId, {
      // Status
      vivo: true,
      ativo: false, // Não ativa automaticamente

      // Stats reduzidos
      forca: statsReduzidos.forca,
      agilidade: statsReduzidos.agilidade,
      resistencia: statsReduzidos.resistencia,
      foco: statsReduzidos.foco,

      // Penalidades
      vinculo: novoVinculo,
      experiencia: novaXP,
      exaustao: novaExaustao,

      // Marca permanente
      marca_morte: true,
      updated_at: new Date().toISOString()
    });

    console.log("✅ Avatar ressuscitado!");

    // 6. Deduzir recursos do jogador no Firestore
    console.log("Deduzindo recursos do jogador...");
    await updateDocument('player_stats', userId, {
      moedas: stats.moedas - custo.moedas,
      fragmentos: stats.fragmentos - custo.fragmentos,
      updated_at: new Date().toISOString()
    });

    console.log("✅ Recursos deduzidos!");

    // 7. Buscar dados atualizados
    console.log("Buscando dados atualizados...");
    const statsAtualizados = await getDocument('player_stats', userId);
    const avatarRessuscitado = await getDocument('avatares', avatarId);

    console.log("✅ RITUAL DE RESSURREIÇÃO COMPLETO!");

    // Calcular perdas para mostrar ao jogador
    const perdas = {
      stats_perdidos: {
        forca: avatar.forca - statsReduzidos.forca,
        agilidade: avatar.agilidade - statsReduzidos.agilidade,
        resistencia: avatar.resistencia - statsReduzidos.resistencia,
        foco: avatar.foco - statsReduzidos.foco
      },
      vinculo_perdido: (avatar.vinculo || 0) - novoVinculo,
      xp_perdida: (avatar.experiencia || 0) - novaXP,
      porcentagem_reducao: 30
    };

    return Response.json({
      success: true,
      message: "O ritual foi concluído. Seu avatar retornou do além, mas carrega cicatrizes profundas.",
      avatar: avatarRessuscitado,
      stats: statsAtualizados,
      custoUtilizado: custo,
      penalidades: {
        descricao: "O Necromante arrancou sua alma do vazio, mas o preço foi alto:",
        perdas: perdas,
        avisos: [
          "💀 Marca da Morte: Este avatar não pode ser ressuscitado novamente",
          `📉 Stats reduzidos em 30%`,
          `💔 Vínculo reduzido em 50% (${avatar.vinculo}% → ${novoVinculo}%)`,
          `📖 XP reduzida em 30% (${avatar.experiencia} → ${novaXP})`,
          `😰 Estado: EXAUSTO (60/100 exaustão)`,
          "⏳ Necessita descanso antes de combater"
        ]
      },
      lore: {
        antes: "A morte havia levado sua essência para o vazio...",
        depois: "Agora retorna, enfraquecido, mas vivo. A Marca da Morte queimará eternamente em sua alma."
      }
    });

  } catch (error) {
    console.error("❌ ERRO CRÍTICO NO RITUAL:", error);
    console.error("Stack:", error.stack);
    return Response.json(
      {
        message: "O ritual falhou catastroficamente. Energias sombrias escaparam do controle.",
        erro_tecnico: error.message
      },
      { status: 500 }
    );
  }
}
