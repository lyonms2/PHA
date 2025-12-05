import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';
import { getHunterRank, aplicarDescontoMerge, calcularXpFeito, verificarPromocao } from '@/lib/hunter/hunterRankSystem';
import {
  validateRequest,
  validateAvatarOwnership,
  validateAvatarIsAlive,
  combineValidations
} from '@/lib/api/middleware';

export const dynamic = 'force-dynamic';

/**
 * POST /api/merge-avatares
 *
 * Funde dois avatares: base recebe 30% dos stats do sacrifício.
 * Avatar sacrificado é destruído permanentemente.
 *
 * Mecânicas:
 * - Chance de sucesso diminui com cada merge (100% → 40% no 8º merge)
 * - 30% chance de transmutação de elemento (se diferentes)
 * - Custo baseado em níveis e raridade
 * - Máximo 8 merges por avatar
 *
 * Se falhar: Avatar sacrificado é perdido, base permanece intacto
 */
export async function POST(request) {
  try {
    // Validar campos obrigatórios
    const validation = await validateRequest(request, ['userId', 'avatarBaseId', 'avatarSacrificioId']);
    if (!validation.valid) return validation.response;

    const { userId, avatarBaseId, avatarSacrificioId } = validation.body;

    // Validar que não são o mesmo avatar
    if (avatarBaseId === avatarSacrificioId) {
      return NextResponse.json(
        { message: "Não é possível fundir um avatar com ele mesmo" },
        { status: 400 }
      );
    }

    // Validar propriedade do avatar base
    const avatarBaseCheck = await validateAvatarOwnership(avatarBaseId, userId);
    if (!avatarBaseCheck.valid) return avatarBaseCheck.response;
    const avatarBase = avatarBaseCheck.avatar;

    // Validar propriedade do avatar sacrifício
    const avatarSacrificioCheck = await validateAvatarOwnership(avatarSacrificioId, userId);
    if (!avatarSacrificioCheck.valid) return avatarSacrificioCheck.response;
    const avatarSacrificio = avatarSacrificioCheck.avatar;

    // Validar que avatar base está vivo
    const baseAliveCheck = validateAvatarIsAlive(avatarBase);
    if (!baseAliveCheck.valid) return baseAliveCheck.response;

    // Validar que avatar sacrifício está vivo
    const sacrificioAliveCheck = validateAvatarIsAlive(avatarSacrificio);
    if (!sacrificioAliveCheck.valid) return sacrificioAliveCheck.response;

    // Validar que avatares estão inativos (lógica customizada)
    if (avatarBase.ativo) {
      return NextResponse.json(
        { message: "Avatar base deve estar inativo" },
        { status: 400 }
      );
    }

    if (avatarSacrificio.ativo) {
      return NextResponse.json(
        { message: "Avatar de sacrifício deve estar inativo" },
        { status: 400 }
      );
    }

    // 3.5. Verificar limite de merges (máximo 8)
    const mergeCount = avatarBase.merge_count || 0;
    if (mergeCount >= 8) {
      return Response.json(
        { message: "Este avatar atingiu o limite máximo de fusões (8)" },
        { status: 400 }
      );
    }

    // 3.6. Calcular chance de sucesso baseada em merge_count
    // 0 merges: 100%, 1: 92.5%, 2: 85%, 3: 77.5%, 4: 70%, 5: 62.5%, 6: 55%, 7: 47.5%, 8: 40%
    const chanceBase = 100;
    const reducaoPorMerge = 7.5;
    const chanceMinima = 40;
    const chanceSucesso = Math.max(chanceBase - (mergeCount * reducaoPorMerge), chanceMinima);

    // 3.7. Rolar para ver se o merge é bem sucedido
    const roll = Math.random() * 100;
    const mergeSuccessful = roll <= chanceSucesso;

    // 4. Buscar stats do player no Firestore (para verificar saldo e aplicar desconto)
    const playerStats = await getDocument('player_stats', userId);

    if (!playerStats) {
      return NextResponse.json(
        { message: "Erro ao carregar estatísticas do jogador" },
        { status: 500 }
      );
    }

    // 4.1 Obter rank do cacador para aplicar desconto
    const hunterRank = getHunterRank(playerStats.hunterRankXp || 0);

    // 4.2 Calcular custo base
    const nivelTotal = avatarBase.nivel + avatarSacrificio.nivel;
    const multiplicador = avatarBase.raridade === 'Lendário' ? 2 :
                          avatarBase.raridade === 'Raro' ? 1.5 : 1;

    const custoMoedasBase = Math.floor(nivelTotal * 100 * multiplicador);
    const custoFragmentosBase = Math.floor(nivelTotal * 10 * multiplicador);

    // 4.3 Aplicar desconto do rank do cacador
    const custoMoedas = aplicarDescontoMerge(custoMoedasBase, hunterRank);
    const custoFragmentos = aplicarDescontoMerge(custoFragmentosBase, hunterRank);

    const descontoAplicado = custoMoedasBase - custoMoedas;

    // 5. Verificar se tem saldo (lógica customizada com mensagens específicas)
    if (playerStats.moedas < custoMoedas) {
      return NextResponse.json(
        { message: `Moedas insuficientes. Você tem ${playerStats.moedas}, precisa de ${custoMoedas}` },
        { status: 400 }
      );
    }

    if (playerStats.fragmentos < custoFragmentos) {
      return NextResponse.json(
        { message: `Fragmentos insuficientes. Você tem ${playerStats.fragmentos}, precisa de ${custoFragmentos}` },
        { status: 400 }
      );
    }

    // 7. Calcular ganhos de stats (30% do sacrifício)
    const ganhoForca = Math.floor(avatarSacrificio.forca * 0.3);
    const ganhoAgilidade = Math.floor(avatarSacrificio.agilidade * 0.3);
    const ganhoResistencia = Math.floor(avatarSacrificio.resistencia * 0.3);
    const ganhoFoco = Math.floor(avatarSacrificio.foco * 0.3);

    // 8. Rolar chance de transmutação de elemento (30% se elementos forem diferentes)
    let elementoTransmutado = false;
    let novoElemento = avatarBase.elemento;

    if (avatarBase.elemento !== avatarSacrificio.elemento) {
      const rollElemento = Math.random();
      if (rollElemento < 0.3) { // 30% de chance
        elementoTransmutado = true;
        novoElemento = avatarSacrificio.elemento;
      }
    }

    // 9. Preparar dados para atualização
    let updateData = {
      merge_count: mergeCount + 1, // Sempre incrementa, mesmo se falhar
      updated_at: new Date().toISOString()
    };

    // 10. Se o merge foi bem sucedido, aplicar ganhos de stats
    if (mergeSuccessful) {
      const novaForca = avatarBase.forca + ganhoForca;
      const novaAgilidade = avatarBase.agilidade + ganhoAgilidade;
      const novaResistencia = avatarBase.resistencia + ganhoResistencia;
      const novoFoco = avatarBase.foco + ganhoFoco;

      updateData = {
        ...updateData,
        forca: novaForca,
        agilidade: novaAgilidade,
        resistencia: novaResistencia,
        foco: novoFoco,
        elemento: novoElemento
      };
    }

    // 11. Atualizar avatar base no Firestore
    await updateDocument('avatares', avatarBaseId, updateData);

    // 12. Marcar avatar de sacrifício como morto no Firestore
    await updateDocument('avatares', avatarSacrificioId, {
      vivo: false,
      hp_atual: 0,
      marca_morte: true,
      causa_morte: 'fusao', // Para epitáfio personalizado no memorial
      ativo: false,
      updated_at: new Date().toISOString()
    });

    // 13. Calcular XP de rank ganho por merge
    const xpRankGanho = calcularXpFeito('MERGE_REALIZADO');
    const xpAnterior = playerStats.hunterRankXp || 0;
    const novoHunterRankXp = xpAnterior + xpRankGanho;
    const promocaoRank = verificarPromocao(xpAnterior, novoHunterRankXp);

    // 14. Deduzir custos e atualizar XP do player no Firestore
    await updateDocument('player_stats', userId, {
      moedas: playerStats.moedas - custoMoedas,
      fragmentos: playerStats.fragmentos - custoFragmentos,
      hunterRankXp: novoHunterRankXp,
      updated_at: new Date().toISOString()
    });

    // 14. Buscar avatar base atualizado para retornar
    const avatarAtualizado = await getDocument('avatares', avatarBaseId);

    // 15. Retornar resultado da fusão
    return Response.json({
      message: mergeSuccessful ? "Fusão realizada com sucesso!" : "A fusão falhou! O avatar sacrificado foi perdido, mas o base está intacto.",
      resultado: {
        avatarBase: avatarAtualizado,
        avatarSacrificio: avatarSacrificio,
        sucesso: mergeSuccessful,
        chanceSucesso: chanceSucesso,
        mergeCount: mergeCount + 1,
        ganhos: mergeSuccessful ? {
          forca: ganhoForca,
          agilidade: ganhoAgilidade,
          resistencia: ganhoResistencia,
          foco: ganhoFoco
        } : {
          forca: 0,
          agilidade: 0,
          resistencia: 0,
          foco: 0
        },
        mudouElemento: mergeSuccessful && elementoTransmutado,
        elementoOriginal: avatarBase.elemento,
        elementoNovo: mergeSuccessful ? novoElemento : avatarBase.elemento,
        custos: {
          moedas: custoMoedas,
          fragmentos: custoFragmentos,
          desconto: descontoAplicado
        }
      },
      hunterRank: {
        xpGanho: xpRankGanho,
        xpTotal: novoHunterRankXp,
        rank: hunterRank,
        promocao: promocaoRank.promovido ? promocaoRank : null
      }
    });

  } catch (error) {
    console.error("Erro no servidor:", error);
    return Response.json(
      { message: "Erro ao processar: " + error.message },
      { status: 500 }
    );
  }
}
