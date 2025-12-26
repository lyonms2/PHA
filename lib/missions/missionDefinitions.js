// ==================== DEFINIÇÕES DE MISSÕES DIÁRIAS ====================
// Sistema completo de missões com rotação diária

/**
 * Tipos de objetivos possíveis
 */
export const TIPOS_OBJETIVO = {
  // Treinos
  PARTICIPAR_TREINO: 'PARTICIPAR_TREINO',
  VITORIAS_TREINO: 'VITORIAS_TREINO',
  VITORIAS_TREINO_NORMAL: 'VITORIAS_TREINO_NORMAL',
  VITORIAS_TREINO_DIFICIL: 'VITORIAS_TREINO_DIFICIL',

  // PVP
  PARTICIPAR_PVP: 'PARTICIPAR_PVP',
  VITORIAS_PVP: 'VITORIAS_PVP',
  VITORIAS_PVP_SEQUENCIAIS: 'VITORIAS_PVP_SEQUENCIAIS',

  // Vínculo
  GANHAR_VINCULO: 'GANHAR_VINCULO',
  VINCULO_MINIMO: 'VINCULO_MINIMO',

  // Invocação
  INVOCAR_AVATARES: 'INVOCAR_AVATARES',
  INVOCAR_RARO_OU_LENDARIO: 'INVOCAR_RARO_OU_LENDARIO',

  // Economia
  VENDER_AVATAR: 'VENDER_AVATAR',
  COMPRAR_AVATAR: 'COMPRAR_AVATAR',

  // Nível
  GANHAR_NIVEIS: 'GANHAR_NIVEIS',
  NIVEL_MINIMO: 'NIVEL_MINIMO'
};

/**
 * Pool de missões por categoria e dificuldade
 */
export const POOL_MISSOES = {
  BATALHA: {
    facil: [
      {
        id: 'batalha_facil_1',
        nome: "Guerreiro Iniciante",
        descricao: "Vença 3 treinos em qualquer dificuldade",
        objetivo: { tipo: TIPOS_OBJETIVO.VITORIAS_TREINO, quantidade: 3 },
        recompensas: {
          moedas: 50,
          fragmentos: 2,
          xpCacador: 10
        },
        icone: "⚔️"
      },
      {
        id: 'batalha_facil_2',
        nome: "Treinamento Básico",
        descricao: "Participe de 5 treinos (vitória ou derrota)",
        objetivo: { tipo: TIPOS_OBJETIVO.PARTICIPAR_TREINO, quantidade: 5 },
        recompensas: {
          moedas: 60,
          fragmentos: 2,
          xpCacador: 12
        },
        icone: "🎯"
      }
    ],
    media: [
      {
        id: 'batalha_media_1',
        nome: "Combatente Experiente",
        descricao: "Vença 5 treinos na dificuldade Normal ou superior",
        objetivo: { tipo: TIPOS_OBJETIVO.VITORIAS_TREINO_NORMAL, quantidade: 5 },
        recompensas: {
          moedas: 100,
          fragmentos: 5,
          xpCacador: 20
        },
        icone: "⚔️"
      },
      {
        id: 'batalha_media_2',
        nome: "Guerreiro Dedicado",
        descricao: "Vença 3 treinos na dificuldade Normal",
        objetivo: { tipo: TIPOS_OBJETIVO.VITORIAS_TREINO_NORMAL, quantidade: 3 },
        recompensas: {
          moedas: 80,
          fragmentos: 4,
          xpCacador: 16
        },
        icone: "🗡️"
      }
    ],
    dificil: [
      {
        id: 'batalha_dificil_1',
        nome: "Mestre da Arena",
        descricao: "Vença 3 treinos na dificuldade Difícil",
        objetivo: { tipo: TIPOS_OBJETIVO.VITORIAS_TREINO_DIFICIL, quantidade: 3 },
        recompensas: {
          moedas: 200,
          fragmentos: 10,
          xpCacador: 40
        },
        icone: "👑"
      },
      {
        id: 'batalha_dificil_2',
        nome: "Desafiante Supremo",
        descricao: "Vença 5 treinos na dificuldade Difícil",
        objetivo: { tipo: TIPOS_OBJETIVO.VITORIAS_TREINO_DIFICIL, quantidade: 5 },
        recompensas: {
          moedas: 300,
          fragmentos: 15,
          xpCacador: 60
        },
        icone: "⭐"
      }
    ]
  },

  PVP: {
    facil: [
      {
        id: 'pvp_facil_1',
        nome: "Duelista Novato",
        descricao: "Participe de 2 duelos PVP (vitória ou derrota)",
        objetivo: { tipo: TIPOS_OBJETIVO.PARTICIPAR_PVP, quantidade: 2 },
        recompensas: {
          moedas: 75,
          fragmentos: 3,
          xpCacador: 15
        },
        icone: "⚡"
      }
    ],
    media: [
      {
        id: 'pvp_media_1',
        nome: "Gladiador",
        descricao: "Vença 3 duelos PVP",
        objetivo: { tipo: TIPOS_OBJETIVO.VITORIAS_PVP, quantidade: 3 },
        recompensas: {
          moedas: 150,
          fragmentos: 7,
          xpCacador: 30
        },
        icone: "🏆"
      },
      {
        id: 'pvp_media_2',
        nome: "Competidor",
        descricao: "Vença 2 duelos PVP",
        objetivo: { tipo: TIPOS_OBJETIVO.VITORIAS_PVP, quantidade: 2 },
        recompensas: {
          moedas: 120,
          fragmentos: 5,
          xpCacador: 24
        },
        icone: "🎖️"
      }
    ],
    dificil: [
      {
        id: 'pvp_dificil_1',
        nome: "Campeão Invicto",
        descricao: "Vença 5 duelos PVP sem perder nenhum",
        objetivo: { tipo: TIPOS_OBJETIVO.VITORIAS_PVP_SEQUENCIAIS, quantidade: 5 },
        recompensas: {
          moedas: 300,
          fragmentos: 15,
          xpCacador: 60
        },
        icone: "👑"
      }
    ]
  },

  VINCULO: {
    facil: [
      {
        id: 'vinculo_facil_1',
        nome: "Laços Crescentes",
        descricao: "Ganhe 15 pontos de vínculo (batalhas, etc)",
        objetivo: { tipo: TIPOS_OBJETIVO.GANHAR_VINCULO, quantidade: 15 },
        recompensas: {
          moedas: 60,
          fragmentos: 2,
          xpCacador: 12
        },
        icone: "💕"
      }
    ],
    media: [
      {
        id: 'vinculo_media_1',
        nome: "Fortalecendo Laços",
        descricao: "Alcance 50+ de vínculo com um avatar",
        objetivo: { tipo: TIPOS_OBJETIVO.VINCULO_MINIMO, valor: 50 },
        recompensas: {
          moedas: 120,
          fragmentos: 5,
          xpCacador: 25
        },
        icone: "💖"
      }
    ]
  },

  INVOCACAO: {
    facil: [
      {
        id: 'invocacao_facil_1',
        nome: "Colecionador",
        descricao: "Invoque 2 avatares",
        objetivo: { tipo: TIPOS_OBJETIVO.INVOCAR_AVATARES, quantidade: 2 },
        recompensas: {
          moedas: 40,
          fragmentos: 1,
          xpCacador: 8
        },
        icone: "✨"
      },
      {
        id: 'invocacao_facil_2',
        nome: "Invocador Iniciante",
        descricao: "Invoque 1 avatar",
        objetivo: { tipo: TIPOS_OBJETIVO.INVOCAR_AVATARES, quantidade: 1 },
        recompensas: {
          moedas: 30,
          fragmentos: 1,
          xpCacador: 6
        },
        icone: "🌟"
      }
    ],
    media: [
      {
        id: 'invocacao_media_1',
        nome: "Mestre Invocador",
        descricao: "Invoque 1 avatar Raro ou Lendário",
        objetivo: { tipo: TIPOS_OBJETIVO.INVOCAR_RARO_OU_LENDARIO, quantidade: 1 },
        recompensas: {
          moedas: 100,
          fragmentos: 8,
          xpCacador: 25
        },
        icone: "💎"
      }
    ]
  },

  ECONOMIA: {
    facil: [
      {
        id: 'economia_facil_1',
        nome: "Comerciante",
        descricao: "Venda 1 avatar no mercado",
        objetivo: { tipo: TIPOS_OBJETIVO.VENDER_AVATAR, quantidade: 1 },
        recompensas: {
          moedas: 50,
          fragmentos: 2,
          xpCacador: 10
        },
        icone: "💰"
      }
    ],
    media: [
      {
        id: 'economia_media_1',
        nome: "Negociante Astuto",
        descricao: "Compre 1 avatar do mercado",
        objetivo: { tipo: TIPOS_OBJETIVO.COMPRAR_AVATAR, quantidade: 1 },
        recompensas: {
          moedas: 80,
          fragmentos: 4,
          xpCacador: 15
        },
        icone: "🛒"
      }
    ]
  },

  NIVEL: {
    media: [
      {
        id: 'nivel_media_1',
        nome: "Treinador Dedicado",
        descricao: "Suba 2 níveis com qualquer avatar",
        objetivo: { tipo: TIPOS_OBJETIVO.GANHAR_NIVEIS, quantidade: 2 },
        recompensas: {
          moedas: 100,
          fragmentos: 5,
          xpCacador: 20
        },
        icone: "📈"
      }
    ],
    dificil: [
      {
        id: 'nivel_dificil_1',
        nome: "Mestre Evolucionista",
        descricao: "Suba um avatar para nível 25+",
        objetivo: { tipo: TIPOS_OBJETIVO.NIVEL_MINIMO, valor: 25 },
        recompensas: {
          moedas: 250,
          fragmentos: 12,
          xpCacador: 50
        },
        icone: "🌟"
      }
    ]
  }
};

/**
 * Retorna um conjunto de 5 missões diárias (2 fáceis, 2 médias, 1 difícil)
 * com rotação baseada na data
 */
export function gerarMissoesDiarias(data) {
  // Usar data como seed para gerar sempre as mesmas missões no mesmo dia
  const seed = parseInt(data.replace(/-/g, ''));

  // Função auxiliar para pegar missão aleatória com seed
  const getMissaoComSeed = (pool, offset) => {
    const index = (seed + offset) % pool.length;
    return pool[index];
  };

  // Coletar pools de todas as categorias
  const poolsFaceis = [];
  const poolsMedias = [];
  const poolsDificeis = [];

  Object.values(POOL_MISSOES).forEach(categoria => {
    if (categoria.facil) poolsFaceis.push(...categoria.facil);
    if (categoria.media) poolsMedias.push(...categoria.media);
    if (categoria.dificil) poolsDificeis.push(...categoria.dificil);
  });

  // Selecionar missões (2 fáceis, 2 médias, 1 difícil)
  const missoes = [
    getMissaoComSeed(poolsFaceis, 0),
    getMissaoComSeed(poolsFaceis, 100),
    getMissaoComSeed(poolsMedias, 200),
    getMissaoComSeed(poolsMedias, 300),
    getMissaoComSeed(poolsDificeis, 400)
  ];

  return missoes.map((missao, index) => ({
    ...missao,
    id_unico: `${data}_${missao.id}`,
    ordem: index,
    dificuldade: index < 2 ? 'facil' : index < 4 ? 'media' : 'dificil'
  }));
}

export default {
  TIPOS_OBJETIVO,
  POOL_MISSOES,
  gerarMissoesDiarias
};
