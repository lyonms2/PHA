import { getDocuments, updateDocument, createDocument } from '@/lib/firebase/firestore';

/**
 * Encerra uma temporada ativa e cria uma nova
 * @param {Object} temporadaAtiva - A temporada a ser encerrada
 * @returns {Promise<Object>} Resultado do encerramento
 */
export async function encerrarTemporada(temporadaAtiva) {
  console.log('[ENCERRAR TEMPORADA] Iniciando encerramento...');

  // 1. Buscar todos os rankings da temporada
  const rankings = await getDocuments('pvp_rankings', {
    where: [['temporada_id', '==', temporadaAtiva.temporada_id]]
  });

  // 2. Ordenar por fama e calcular posições
  const rankingsOrdenados = (rankings || [])
    .sort((a, b) => b.fama - a.fama)
    .map((ranking, index) => ({
      ...ranking,
      posicao_final: index + 1
    }));

  // 3. Processar cada jogador (salvar histórico, gerar recompensas, títulos)
  const promises = rankingsOrdenados.map(async (ranking, index) => {
    // Salvar histórico
    await createDocument('pvp_historico_temporadas', {
      user_id: ranking.user_id,
      temporada_id: temporadaAtiva.temporada_id,
      posicao_final: ranking.posicao_final,
      fama_final: ranking.fama,
      vitorias: ranking.vitorias,
      derrotas: ranking.derrotas,
      streak_maximo: ranking.streak_maximo,
      data_encerramento: new Date().toISOString()
    });

    // Gerar recompensas baseadas na posição
    let moedas = 0;
    let fragmentos = 0;
    let avatarLendario = false;
    let avatarRaro = false;

    if (index === 0) {
      // 1º lugar
      moedas = 1000;
      fragmentos = 100;
      avatarLendario = true;
    } else if (index === 1) {
      // 2º lugar
      moedas = 500;
      fragmentos = 50;
      avatarRaro = true;
    } else if (index === 2) {
      // 3º lugar
      moedas = 250;
      fragmentos = 30;
      avatarRaro = true;
    } else if (index < 10) {
      // Top 10
      moedas = 100;
      fragmentos = 20;
    } else if (index < 50) {
      // Top 50
      moedas = 50;
      fragmentos = 10;
    }

    // Criar recompensa se houver
    if (moedas > 0) {
      await createDocument('pvp_recompensas_pendentes', {
        user_id: ranking.user_id,
        temporada_id: temporadaAtiva.temporada_id,
        posicao: ranking.posicao_final,
        moedas,
        fragmentos,
        avatar_lendario: avatarLendario,
        avatar_raro: avatarRaro,
        coletada: false,
        created_at: new Date().toISOString()
      });
    }

    // Criar títulos para top 10
    if (index < 10) {
      const titulosNomes = [
        'Campeão Lendário',      // 1º
        'Guerreiro Épico',       // 2º
        'Lutador Raro',          // 3º
        'Mestre de Combate',     // 4º
        'Gladiador Supremo',     // 5º
        'Herói de Arena',        // 6º
        'Campeão Elite',         // 7º
        'Guardião Valente',      // 8º
        'Duelista Honrado',      // 9º
        'Combatente Lendário'    // 10º
      ];

      await createDocument('pvp_titulos', {
        user_id: ranking.user_id,
        temporada_id: temporadaAtiva.temporada_id,
        titulo_nome: titulosNomes[index],
        titulo_icone: index < 3 ? '🏆' : '🎖️',
        posicao: ranking.posicao_final,
        ativo: false, // Jogador precisa ativar manualmente
        data_conquista: new Date().toISOString()
      });
    }
  });

  await Promise.all(promises);

  // 4. Desativar temporada atual
  await updateDocument('pvp_temporadas', temporadaAtiva.id, {
    ativa: false,
    data_encerramento: new Date().toISOString()
  });

  console.log('[ENCERRAR TEMPORADA] Temporada encerrada com sucesso!');

  // 5. Criar nova temporada automaticamente
  const novoNumero = (temporadaAtiva.numero || 1) + 1;
  const novaTemporadaId = `temporada_${Date.now()}`;
  const dataInicio = new Date();
  const dataFim = new Date(dataInicio);
  dataFim.setDate(dataFim.getDate() + 30); // 30 dias

  await createDocument('pvp_temporadas', {
    temporada_id: novaTemporadaId,
    numero: novoNumero,
    nome: `Temporada ${novoNumero}`,
    data_inicio: dataInicio.toISOString(),
    data_fim: dataFim.toISOString(),
    ativa: true,
    created_at: new Date().toISOString()
  }, novaTemporadaId);

  console.log(`[ENCERRAR TEMPORADA] Nova temporada ${novoNumero} criada!`);

  return {
    success: true,
    message: 'Temporada encerrada e nova temporada criada com sucesso',
    jogadores_processados: rankingsOrdenados.length,
    nova_temporada: novoNumero
  };
}
