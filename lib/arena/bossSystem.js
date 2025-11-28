/**
 * Sistema de Bosses para Desafios Épicos
 * Bosses são inimigos muito poderosos com mecânicas especiais
 */

import { selecionarHabilidadesIniciais } from '@/app/avatares/sistemas/abilitiesSystem';

/**
 * Multiplicadores de Boss por dificuldade
 */
const BOSS_MULTIPLICADORES = {
  boss: {
    hp: 3.0,        // 3x HP
    stats: 1.5,     // 1.5x stats
    nivel: 10
  },
  lendario: {
    hp: 4.0,        // 4x HP
    stats: 2.0,     // 2x stats
    nivel: 15
  },
  proibido: {
    hp: 5.0,        // 5x HP
    stats: 2.5,     // 2.5x stats
    nivel: 20
  }
};

/**
 * Habilidades especiais de bosses
 */
const HABILIDADES_BOSS = {
  // Titãs Elementais
  rage_50: {
    nome: 'Fúria Titânica',
    descricao: 'Quando HP < 50%, todos stats +30%',
    tipo: 'passiva',
    gatilho: { hp_abaixo: 0.5 },
    efeito: { bonus_stats: 0.3 }
  },

  escudo_fogo: {
    nome: 'Escudo Flamejante',
    descricao: 'Reflete 20% do dano recebido',
    tipo: 'passiva',
    efeito: { refletir_dano: 0.2 }
  },

  invocar_adds: {
    nome: 'Invocar Elementais',
    descricao: 'Invoca 2 elementais menores (HP < 30%)',
    tipo: 'ativa',
    gatilho: { hp_abaixo: 0.3, unico: true },
    efeito: { invocar: 2 }
  },

  tsunami: {
    nome: 'Tsunami Devastador',
    descricao: 'Dano massivo de água (50% HP jogador)',
    tipo: 'ativa',
    cooldown: 3,
    efeito: { dano_percentual: 0.5 }
  },

  pressao_abissal: {
    nome: 'Pressão Abissal',
    descricao: 'Reduz velocidade e evasão em 40%',
    tipo: 'debuff',
    efeito: { reducao_agilidade: 0.4 }
  },

  regeneracao_aquatica: {
    nome: 'Regeneração Aquática',
    descricao: 'Recupera 5% HP por turno',
    tipo: 'passiva',
    efeito: { regen_percentual: 0.05 }
  },

  armadura_rochosa: {
    nome: 'Armadura Rochosa',
    descricao: 'Reduz todo dano recebido em 30%',
    tipo: 'passiva',
    efeito: { reducao_dano: 0.3 }
  },

  terremoto: {
    nome: 'Terremoto',
    descricao: 'Dano em área + chance de atordoar',
    tipo: 'ativa',
    cooldown: 2,
    efeito: { dano_base: 40, atordoar: 0.5 }
  },

  fortificacao: {
    nome: 'Fortificação',
    descricao: 'Quando HP < 40%, resistência +50%',
    tipo: 'passiva',
    gatilho: { hp_abaixo: 0.4 },
    efeito: { bonus_resistencia: 0.5 }
  },

  tornado: {
    nome: 'Tornado Cortante',
    descricao: 'Múltiplos ataques rápidos',
    tipo: 'ativa',
    cooldown: 2,
    efeito: { ataques: 3, dano_por_ataque: 20 }
  },

  velocidade_extrema: {
    nome: 'Velocidade Extrema',
    descricao: '+100% chance de esquiva',
    tipo: 'passiva',
    efeito: { bonus_evasao: 1.0 }
  },

  evasao_total: {
    nome: 'Forma Etérea',
    descricao: 'Próximo ataque sempre erra (HP < 25%)',
    tipo: 'ativa',
    gatilho: { hp_abaixo: 0.25 },
    efeito: { esquiva_garantida: true }
  },

  tempestade_eletrica: {
    nome: 'Tempestade Elétrica',
    descricao: 'Dano contínuo de eletricidade por 3 turnos',
    tipo: 'ativa',
    cooldown: 3,
    efeito: { dot_eletrico: 15, duracao: 3 }
  },

  paralisia_massiva: {
    nome: 'Paralisia Massiva',
    descricao: '60% chance de paralisar por 1 turno',
    tipo: 'ativa',
    cooldown: 4,
    efeito: { paralisar: 0.6 }
  },

  sobrecarga: {
    nome: 'Sobrecarga Elétrica',
    descricao: 'Quando HP < 30%, dano +80% mas recebe +20%',
    tipo: 'passiva',
    gatilho: { hp_abaixo: 0.3 },
    efeito: { bonus_dano: 0.8, bonus_dano_recebido: 0.2 }
  },

  absorver_luz: {
    nome: 'Absorver Luz',
    descricao: 'Absorve 50% da cura do oponente',
    tipo: 'passiva',
    efeito: { roubar_cura: 0.5 }
  },

  terror_primordial: {
    nome: 'Terror Primordial',
    descricao: 'Reduz todos stats do oponente em 25%',
    tipo: 'debuff',
    efeito: { reducao_stats: 0.25 }
  },

  duplicacao_sombria: {
    nome: 'Duplicação Sombria',
    descricao: 'Cria clone com 50% HP (HP < 40%, único)',
    tipo: 'ativa',
    gatilho: { hp_abaixo: 0.4, unico: true },
    efeito: { criar_clone: 0.5 }
  },

  explosao_solar: {
    nome: 'Explosão Solar',
    descricao: 'Dano massivo de luz (60% HP)',
    tipo: 'ativa',
    cooldown: 4,
    efeito: { dano_percentual: 0.6 }
  },

  purificacao: {
    nome: 'Purificação',
    descricao: 'Remove todos debuffs a cada 2 turnos',
    tipo: 'passiva',
    efeito: { limpar_debuffs: true, frequencia: 2 }
  },

  barreira_divina: {
    nome: 'Barreira Divina',
    descricao: 'Imune ao próximo ataque (HP < 20%)',
    tipo: 'ativa',
    gatilho: { hp_abaixo: 0.2 },
    efeito: { imunidade: true }
  },

  // Lendas Antigas
  mordida_fatal: {
    nome: 'Mordida Fatal',
    descricao: 'Dano enorme + sangramento',
    tipo: 'ativa',
    cooldown: 2,
    efeito: { dano_base: 80, sangramento: 10 }
  },

  uivo_primordial: {
    nome: 'Uivo Primordial',
    descricao: 'Aterroriza o oponente (-40% stats por 2 turnos)',
    tipo: 'ativa',
    cooldown: 3,
    efeito: { terror: 0.4, duracao: 2 }
  },

  frenesi_berserker: {
    nome: 'Frenesi Berserker',
    descricao: 'Quando HP < 30%, ataca 2x por turno',
    tipo: 'passiva',
    gatilho: { hp_abaixo: 0.3 },
    efeito: { ataques_extras: 1 }
  },

  rage_total: {
    nome: 'Fúria Total',
    descricao: 'Quando HP < 10%, todos stats +100%',
    tipo: 'passiva',
    gatilho: { hp_abaixo: 0.1 },
    efeito: { bonus_stats: 1.0 }
  },

  renascimento: {
    nome: 'Renascimento das Cinzas',
    descricao: 'Ao morrer, renasce com 50% HP (1x apenas)',
    tipo: 'passiva',
    gatilho: { ao_morrer: true, unico: true },
    efeito: { reviver: 0.5 }
  },

  chamas_eternas: {
    nome: 'Chamas Eternas',
    descricao: 'Todo ataque causa queimadura (5% HP/turno)',
    tipo: 'passiva',
    efeito: { queimadura_auto: 0.05 }
  },

  explosao_final: {
    nome: 'Explosão Final',
    descricao: 'Ao reviver, causa dano massivo em área',
    tipo: 'ativa',
    gatilho: { apos_reviver: true },
    efeito: { dano_percentual: 0.4 }
  },

  fase_dois: {
    nome: 'Forma Verdadeira',
    descricao: 'Após reviver, todos stats +50%',
    tipo: 'passiva',
    gatilho: { apos_reviver: true },
    efeito: { bonus_stats: 0.5 }
  },

  // Guardiões Proibidos
  distorcao_realidade: {
    nome: 'Distorção da Realidade',
    descricao: 'Inverte efeitos (cura vira dano, dano vira cura)',
    tipo: 'passiva',
    efeito: { inverter_efeitos: true }
  },

  tentaculos_void: {
    nome: 'Tentáculos do Vazio',
    descricao: 'Ataque múltiplo que drena vida',
    tipo: 'ativa',
    cooldown: 2,
    efeito: { ataques: 4, dano_por_ataque: 15, roubo_vida: 0.5 }
  },

  loucura: {
    nome: 'Induzir Loucura',
    descricao: 'Faz oponente atacar a si mesmo',
    tipo: 'ativa',
    cooldown: 5,
    efeito: { confusao: true }
  },

  imortalidade_temporaria: {
    nome: 'Imortalidade Temporária',
    descricao: 'Não pode morrer por 2 turnos (HP mínimo 1)',
    tipo: 'ativa',
    gatilho: { hp_abaixo: 0.15, unico: true },
    efeito: { imortal: true, duracao: 2 }
  }
};

/**
 * Definições completas dos bosses
 */
export const BOSSES_DATA = {
  // Titãs Elementais
  ifrit_titan: {
    nome: 'Ifrit, Titã das Chamas',
    elemento: 'Fogo',
    dificuldade: 'boss',
    stats_base: { forca: 30, agilidade: 20, resistencia: 35, foco: 25 },
    mecanicas_especiais: ['rage_50', 'escudo_fogo', 'invocar_adds']
  },

  leviathan_titan: {
    nome: 'Leviatã, Senhor dos Mares',
    elemento: 'Água',
    dificuldade: 'boss',
    stats_base: { forca: 25, agilidade: 30, resistencia: 30, foco: 25 },
    mecanicas_especiais: ['tsunami', 'pressao_abissal', 'regeneracao_aquatica']
  },

  titan_terra: {
    nome: 'Golias, Colosso de Pedra',
    elemento: 'Terra',
    dificuldade: 'boss',
    stats_base: { forca: 35, agilidade: 15, resistencia: 40, foco: 20 },
    mecanicas_especiais: ['armadura_rochosa', 'terremoto', 'fortificacao']
  },

  garuda_titan: {
    nome: 'Garuda, Rainha dos Ventos',
    elemento: 'Vento',
    dificuldade: 'boss',
    stats_base: { forca: 20, agilidade: 40, resistencia: 25, foco: 25 },
    mecanicas_especiais: ['tornado', 'velocidade_extrema', 'evasao_total']
  },

  raijin_titan: {
    nome: 'Raijin, Deus do Trovão',
    elemento: 'Eletricidade',
    dificuldade: 'boss',
    stats_base: { forca: 28, agilidade: 32, resistencia: 28, foco: 22 },
    mecanicas_especiais: ['tempestade_eletrica', 'paralisia_massiva', 'sobrecarga']
  },

  umbra_titan: {
    nome: 'Umbra, Devorador de Luz',
    elemento: 'Sombra',
    dificuldade: 'boss',
    stats_base: { forca: 32, agilidade: 28, resistencia: 32, foco: 28 },
    mecanicas_especiais: ['absorver_luz', 'terror_primordial', 'duplicacao_sombria']
  },

  aurora_titan: {
    nome: 'Aurora, Imperatriz da Luz',
    elemento: 'Luz',
    dificuldade: 'boss',
    stats_base: { forca: 30, agilidade: 26, resistencia: 34, foco: 30 },
    mecanicas_especiais: ['explosao_solar', 'purificacao', 'barreira_divina']
  },

  // Lendas Antigas
  fenrir_legend: {
    nome: 'Fenrir, o Devorador de Mundos',
    elemento: 'Sombra',
    dificuldade: 'lendario',
    stats_base: { forca: 40, agilidade: 35, resistencia: 40, foco: 30 },
    mecanicas_especiais: ['mordida_fatal', 'uivo_primordial', 'frenesi_berserker', 'rage_total']
  },

  phoenix_legend: {
    nome: 'Fênix Imortal',
    elemento: 'Fogo',
    dificuldade: 'lendario',
    stats_base: { forca: 35, agilidade: 40, resistencia: 38, foco: 32 },
    mecanicas_especiais: ['renascimento', 'chamas_eternas', 'explosao_final', 'fase_dois']
  },

  // Guardiões Proibidos
  void_keeper: {
    nome: 'Guardião do Vazio',
    elemento: 'Sombra',
    dificuldade: 'proibido',
    stats_base: { forca: 50, agilidade: 45, resistencia: 50, foco: 40 },
    mecanicas_especiais: ['distorcao_realidade', 'tentaculos_void', 'loucura', 'imortalidade_temporaria']
  }
};

/**
 * Gera um boss completo com todas as características
 */
export function gerarBoss(bossId, nivelJogador) {
  const bossData = BOSSES_DATA[bossId];

  if (!bossData) {
    throw new Error(`Boss ${bossId} não encontrado`);
  }

  const multiplicador = BOSS_MULTIPLICADORES[bossData.dificuldade];

  // Calcular stats do boss
  const stats = {
    forca: Math.floor(bossData.stats_base.forca * multiplicador.stats),
    agilidade: Math.floor(bossData.stats_base.agilidade * multiplicador.stats),
    resistencia: Math.floor(bossData.stats_base.resistencia * multiplicador.stats),
    foco: Math.floor(bossData.stats_base.foco * multiplicador.stats)
  };

  // Gerar habilidades normais
  const habilidadesNormais = selecionarHabilidadesIniciais(
    bossData.elemento,
    bossData.dificuldade === 'proibido' ? 'Lendário' :
    bossData.dificuldade === 'lendario' ? 'Épico' : 'Raro'
  );

  // Adicionar mecânicas especiais
  const mecanicasEspeciais = bossData.mecanicas_especiais.map(mecId => ({
    ...HABILIDADES_BOSS[mecId],
    id: mecId
  }));

  return {
    id: `boss_${bossId}_${Date.now()}`,
    nome: bossData.nome,
    elemento: bossData.elemento,
    raridade: bossData.dificuldade === 'proibido' ? 'Mítico' :
              bossData.dificuldade === 'lendario' ? 'Lendário' : 'Épico',
    nivel: multiplicador.nivel,
    ...stats,
    habilidades: habilidadesNormais,
    mecanicasEspeciais: mecanicasEspeciais,
    multiplicadorHP: multiplicador.hp,
    dificuldade: bossData.dificuldade,
    vivo: true,
    isBoss: true,
    _bossId: bossId
  };
}

/**
 * Calcula HP do boss (3-5x maior que normal)
 */
export function calcularHPBoss(boss) {
  const hpBase = boss.resistencia * 10 + boss.nivel * 5;
  return Math.floor(hpBase * (boss.multiplicadorHP || 3.0));
}

/**
 * Processa mecânicas especiais do boss durante a batalha
 * @param {Object} boss - Boss atual
 * @param {Object} player - Jogador
 * @param {number} turno - Turno atual
 * @returns {Object} Resultado das mecânicas ativadas
 */
export function processarMecanicasEspeciaisBoss(boss, player, turno) {
  if (!boss.mecanicasEspeciais || boss.mecanicasEspeciais.length === 0) {
    return { ativou: false };
  }

  const hpPercentual = boss.hp / boss.hp_max;

  // Verificar cada mecânica especial
  for (const mecanica of boss.mecanicasEspeciais) {
    // Rage Mode (HP < 50%)
    if (mecanica.id === 'rage_50' && hpPercentual < 0.5 && !boss._rage_ativado) {
      boss._rage_ativado = true;
      boss.forca = Math.floor(boss.forca * 1.3);
      boss.agilidade = Math.floor(boss.agilidade * 1.3);
      boss.resistencia = Math.floor(boss.resistencia * 1.3);
      boss.foco = Math.floor(boss.foco * 1.3);

      return {
        ativou: true,
        tipo: 'rage',
        descricao: `🔥 ${boss.nome} entrou em MODO FÚRIA! (+30% todos stats)`,
        efeitos: [{
          tipo: 'forca_aumentada',
          valor: 30,
          duracao: 999,
          turnosRestantes: 999
        }]
      };
    }

    // Invocar Adds (HP < 30%, único)
    if (mecanica.id === 'invocar_adds' && hpPercentual < 0.3 && !boss._adds_invocados) {
      boss._adds_invocados = true;

      return {
        ativou: true,
        tipo: 'invocar',
        descricao: `👹 ${boss.nome} invocou elementais menores!`,
        efeitosPlayer: [{
          tipo: 'medo',
          valor: 10,
          duracao: 2,
          turnosRestantes: 2
        }]
      };
    }

    // Tsunami (Cooldown 3)
    if (mecanica.id === 'tsunami' && turno % 3 === 0 && turno > 0) {
      const dano = Math.floor(player.hp_max * 0.3); // 30% HP máximo

      return {
        ativou: true,
        tipo: 'ataque_especial',
        descricao: `🌊 ${boss.nome} conjurou TSUNAMI DEVASTADOR!`,
        danoPlayer: dano,
        efeitosPlayer: [{
          tipo: 'afogamento',
          valor: 15,
          danoPorTurno: 10,
          duracao: 3,
          turnosRestantes: 3
        }]
      };
    }

    // Regeneração Aquática (passiva)
    if (mecanica.id === 'regeneracao_aquatica' && turno % 1 === 0) {
      const cura = Math.floor(boss.hp_max * 0.05);
      boss.hp = Math.min(boss.hp_max, boss.hp + cura);

      return {
        ativou: true,
        tipo: 'regeneracao',
        descricao: `💧 ${boss.nome} regenerou ${cura} HP!`,
        cura
      };
    }

    // Terremoto (Cooldown 2)
    if (mecanica.id === 'terremoto' && turno % 2 === 0 && turno > 0) {
      const dano = 40 + Math.floor(boss.forca * 0.5);
      const atordoar = Math.random() < 0.5;

      return {
        ativou: true,
        tipo: 'ataque_especial',
        descricao: `🌍 ${boss.nome} causou um TERREMOTO!`,
        danoPlayer: dano,
        efeitosPlayer: atordoar ? [{
          tipo: 'atordoado',
          valor: 20,
          duracao: 1,
          turnosRestantes: 1
        }] : []
      };
    }

    // Fortificação (HP < 40%)
    if (mecanica.id === 'fortificacao' && hpPercentual < 0.4 && !boss._fortificado) {
      boss._fortificado = true;
      boss.resistencia = Math.floor(boss.resistencia * 1.5);

      return {
        ativou: true,
        tipo: 'buff',
        descricao: `🛡️ ${boss.nome} ativou FORTIFICAÇÃO! (+50% resistência)`,
        efeitos: [{
          tipo: 'defesa_aumentada',
          valor: 50,
          duracao: 999,
          turnosRestantes: 999
        }]
      };
    }

    // Fênix Renascer (HP = 0, único)
    if (mecanica.id === 'phoenix_renascer' && boss.hp <= 0 && !boss._renasceu) {
      boss._renasceu = true;
      boss.hp = Math.floor(boss.hp_max * 0.5);

      return {
        ativou: true,
        tipo: 'renascer',
        descricao: `🔥 ${boss.nome} RENASCEU DAS CINZAS! (50% HP restaurado)`,
        efeitos: [{
          tipo: 'regeneracao',
          valor: 30,
          duracao: 3,
          turnosRestantes: 3
        }]
      };
    }

    // Void Distortion (Teleporte aleatório, evade próximo ataque)
    if (mecanica.id === 'void_distortion' && turno % 4 === 0 && turno > 0) {
      return {
        ativou: true,
        tipo: 'evasao',
        descricao: `🌀 ${boss.nome} distorceu o vazio e ficou INVISÍVEL!`,
        efeitos: [{
          tipo: 'invisivel',
          valor: 100,
          duracao: 1,
          turnosRestantes: 1
        }]
      };
    }
  }

  return { ativou: false };
}

export default {
  BOSSES_DATA,
  HABILIDADES_BOSS,
  BOSS_MULTIPLICADORES,
  gerarBoss,
  calcularHPBoss,
  processarMecanicasEspeciaisBoss
};
