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
 * Regras:
 * - Avatares sacrificados ou fundidos PODEM ser ressuscitados (1x)
 * - Avatares já ressuscitados NÃO podem ser ressuscitados novamente
 * - Avatares mortos em combate PODEM ser ressuscitados (1x)
 *
 * Penalidades:
 * - Vínculo reduzido em 50%
 * - XP reduzida em 30%
 * - Exaustão aumentada para 60 (Exausto)
 * - Marca da Morte permanente (não pode ser ressuscitado novamente)
 * - Stats mantidos (sem redução)
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

    // Validar marca da morte: Permite ressuscitar sacrificados, mas não ressuscitados anteriormente
    if (avatar.marca_morte) {
      const causa = avatar.marca_morte_causa;

      // Se foi ressuscitado antes, não pode ressuscitar de novo
      if (causa === 'ressurreicao') {
        console.log("⚠️ Avatar já foi ressuscitado anteriormente");
        return NextResponse.json(
          {
            message: "Este avatar já foi ressuscitado uma vez e carrega a Marca da Morte. Não pode ser ressuscitado novamente.",
            aviso: "A morte é permanente para aqueles marcados pelo Necromante."
          },
          { status: 400 }
        );
      }

      // Se foi sacrificado ou fundido, PODE ressuscitar (mas receberá marca de ressurreição)
      if (causa === 'sacrificio' || causa === 'fusao') {
        console.log(`✅ Avatar ${causa === 'sacrificio' ? 'sacrificado' : 'fundido'} - pode ser ressuscitado`);
      }
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

    // Stats: MANTIDOS (sem redução)
    const statsReduzidos = {
      forca: avatar.forca,
      agilidade: avatar.agilidade,
      resistencia: avatar.resistencia,
      foco: avatar.foco
    };

    console.log("Stats mantidos (sem penalidade):", statsReduzidos);

    // Vínculo: -50% (não zera completamente)
    const novoVinculo = Math.floor((avatar.vinculo || 0) * 0.5);
    console.log(`Vínculo: ${avatar.vinculo}% → ${novoVinculo}%`);

    // XP: -30% (perde parte da experiência)
    const novaXP = Math.floor((avatar.experiencia || 0) * 0.7);
    console.log(`XP: ${avatar.experiencia} → ${novaXP}`);

    // Exaustão: Sobe para 60 (estado Exausto)
    const novaExaustao = 60;
    console.log(`Exaustão: ${avatar.exaustao || 0} → ${novaExaustao} (EXAUSTO)`);

    // 5. Aplicar ressurreição no Firestore COM ROLLBACK
    console.log("Aplicando ritual de ressurreição...");

    // ==================== TRANSAÇÃO ATÔMICA (Simulada com Rollback) ====================
    let avatarAtualizado = false;
    let recursosAtualizados = false;
    const timestamp = new Date().toISOString();

    try {
      // Passo 1: Atualizar avatar
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

        // 🆕 AUDIT LOG - Marca permanente com metadados
        marca_morte: true,
        marca_morte_aplicada_em: timestamp,
        marca_morte_causa: 'ressurreicao',
        marca_morte_ressuscitado_por: userId,
        updated_at: timestamp
      });
      avatarAtualizado = true;
      console.log("✅ Avatar ressuscitado!");

      // Passo 2: Deduzir recursos (se falhar, reverte avatar)
      console.log("Deduzindo recursos do jogador...");
      await updateDocument('player_stats', userId, {
        moedas: stats.moedas - custo.moedas,
        fragmentos: stats.fragmentos - custo.fragmentos,
        updated_at: timestamp
      });
      recursosAtualizados = true;
      console.log("✅ Recursos deduzidos!");

    } catch (transactionError) {
      console.error("❌ ERRO NA TRANSAÇÃO:", transactionError);

      // ROLLBACK: Se recursos falharam mas avatar foi atualizado, reverter avatar
      if (avatarAtualizado && !recursosAtualizados) {
        console.log("🔄 ROLLBACK: Revertendo ressurreição do avatar...");
        try {
          await updateDocument('avatares', avatarId, {
            vivo: false,
            marca_morte: false,
            marca_morte_aplicada_em: null,
            marca_morte_causa: null,
            marca_morte_ressuscitado_por: null,
            forca: avatar.forca,
            agilidade: avatar.agilidade,
            resistencia: avatar.resistencia,
            foco: avatar.foco,
            vinculo: avatar.vinculo,
            experiencia: avatar.experiencia,
            exaustao: avatar.exaustao,
            updated_at: timestamp
          });
          console.log("✅ ROLLBACK completo - avatar revertido ao estado original");
        } catch (rollbackError) {
          console.error("💥 ERRO CRÍTICO: Falha no rollback!", rollbackError);
          // Log para auditoria - estado inconsistente
          console.error("⚠️ ESTADO INCONSISTENTE: Avatar ressuscitado mas recursos não deduzidos");
          console.error("Avatar ID:", avatarId);
          console.error("User ID:", userId);
        }

        throw new Error("Falha ao deduzir recursos. Transação revertida.");
      }

      throw transactionError;
    }
    // ==================================================================================

    // 7. Buscar dados atualizados
    console.log("Buscando dados atualizados...");
    const statsAtualizados = await getDocument('player_stats', userId);
    const avatarRessuscitado = await getDocument('avatares', avatarId);

    console.log("✅ RITUAL DE RESSURREIÇÃO COMPLETO!");

    // Calcular perdas para mostrar ao jogador
    const perdas = {
      vinculo_perdido: (avatar.vinculo || 0) - novoVinculo,
      xp_perdida: (avatar.experiencia || 0) - novaXP
    };

    // Mensagem especial se foi sacrificado ou fundido
    const causaAnterior = avatar.marca_morte_causa;
    let mensagemEspecial = "O ritual foi concluído. Seu avatar retornou do além, mas carrega cicatrizes profundas.";
    let loreAntes = "A morte havia levado sua essência para o vazio...";

    if (causaAnterior === 'sacrificio') {
      mensagemEspecial = "O ritual quebrou as correntes do sacrifício. Sua alma foi arrancada do Vazio Dimensional!";
      loreAntes = "Sacrificado ao Vazio Dimensional, sua essência estava perdida para sempre...";
    } else if (causaAnterior === 'fusao') {
      mensagemEspecial = "O ritual separou as almas fundidas. Seu avatar retorna fragmentado, mas livre!";
      loreAntes = "Fundido com outro ser, sua identidade estava diluída...";
    }

    return Response.json({
      success: true,
      message: mensagemEspecial,
      avatar: avatarRessuscitado,
      stats: statsAtualizados,
      custoUtilizado: custo,
      penalidades: {
        descricao: "O Necromante arrancou sua alma do vazio, mas o preço foi alto:",
        perdas: perdas,
        avisos: [
          "💀 Marca da Morte: Este avatar não pode ser ressuscitado novamente",
          `💔 Vínculo reduzido em 50% (${avatar.vinculo}% → ${novoVinculo}%)`,
          `📖 XP reduzida em 30% (${avatar.experiencia} → ${novaXP})`,
          `😰 Estado: EXAUSTO (60/100 exaustão)`,
          "⏳ Necessita descanso antes de combater"
        ]
      },
      lore: {
        antes: loreAntes,
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
