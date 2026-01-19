// ==================== LOGGER DE BATALHA DETALHADO ====================
// Arquivo: /lib/arena/battleLogger.js
//
// Sistema de logging configurável para batalhas
// Mostra todos os detalhes relevantes para testes e debugging

/**
 * Configuração do logger
 * Ative/desative categorias específicas
 */
export const BATTLE_LOG_CONFIG = {
  ENABLED: true,                    // Master switch
  HABILIDADES: true,               // Uso de habilidades
  DANO: true,                      // Cálculos de dano
  EFEITOS: true,                   // Efeitos de status aplicados
  SINERGIAS: true,                 // Bônus de sinergia
  VANTAGEM_ELEMENTAL: true,        // Vantagens/desvantagens elementais
  RESISTENCIA: true,               // Cálculo de resistência/defesa
  COOLDOWNS: true,                 // Estado de cooldowns
  DURACAO_EFEITOS: true,           // Duração de buffs/debuffs
  ENERGIA: true,                   // Gestão de energia
  CRITICO: true,                   // Golpes críticos
  STATS_MODIFICADOS: false,        // Stats após buffs/debuffs (verbose)
};

/**
 * Cores para diferentes tipos de log
 */
const COLORS = {
  HEADER: 'color: #00ffff; font-weight: bold; font-size: 14px',
  SUCCESS: 'color: #00ff00; font-weight: bold',
  ERROR: 'color: #ff0000; font-weight: bold',
  WARNING: 'color: #ffaa00; font-weight: bold',
  INFO: 'color: #aaaaaa',
  DAMAGE: 'color: #ff4444; font-weight: bold',
  HEAL: 'color: #44ff44; font-weight: bold',
  EFFECT: 'color: #ff44ff; font-weight: bold',
  ELEMENTAL: 'color: #ffaa00; font-weight: bold',
};

/**
 * Ícones para tipos de log
 */
const ICONS = {
  ATTACK: '⚔️',
  DEFEND: '🛡️',
  ABILITY: '✨',
  DAMAGE: '💥',
  HEAL: '💚',
  BUFF: '💪',
  DEBUFF: '💀',
  EFFECT: '🎯',
  ELEMENTAL: '⚡',
  SYNERGY: '🔗',
  COOLDOWN: '⏰',
  ENERGY: '⚡',
  CRITICAL: '💥💥',
  RESISTANCE: '🛡️',
};

class BattleLogger {
  constructor() {
    this.turnoAtual = 0;
  }

  // ==================== MÉTODOS PRINCIPAIS ====================

  iniciarBatalha(jogador, inimigo) {
    if (!BATTLE_LOG_CONFIG.ENABLED) return;

    console.log('\n');
    console.log('%c╔════════════════════════════════════════════════════════════╗', COLORS.HEADER);
    console.log(`%c║           ⚔️  BATALHA INICIADA  ⚔️                       ║`, COLORS.HEADER);
    console.log('%c╚════════════════════════════════════════════════════════════╝', COLORS.HEADER);
    console.log('\n');

    console.log(`${ICONS.ATTACK} ${jogador.nome} (${jogador.elemento})`);
    console.log(`   HP: ${jogador.hp_atual}/${jogador.hp_max} | Energia: ${jogador.energia_atual}/100`);
    console.log(`   Força: ${jogador.forca} | Foco: ${jogador.foco} | Resistência: ${jogador.resistencia} | Agilidade: ${jogador.agilidade}`);
    console.log('\n');
    console.log(`${ICONS.DEFEND} ${inimigo.nome} (${inimigo.elemento})`);
    console.log(`   HP: ${inimigo.hp_atual}/${inimigo.hp_max} | Energia: ${inimigo.energia_atual}/100`);
    console.log(`   Força: ${inimigo.forca} | Foco: ${inimigo.foco} | Resistência: ${inimigo.resistencia} | Agilidade: ${inimigo.agilidade}`);
    console.log('\n');
  }

  iniciarTurno(numero) {
    if (!BATTLE_LOG_CONFIG.ENABLED) return;

    this.turnoAtual = numero;
    console.log('\n');
    console.log('%c═══════════════════════════════════════════════════════════', COLORS.HEADER);
    console.log(`%c    TURNO ${numero}`, COLORS.HEADER);
    console.log('%c═══════════════════════════════════════════════════════════', COLORS.HEADER);
  }

  // ==================== VANTAGEM ELEMENTAL ====================

  logVantagemElemental(atacanteElemento, defensorElemento, multiplicador) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.VANTAGEM_ELEMENTAL) return;

    let tipo = 'NEUTRO';
    let cor = COLORS.INFO;

    if (multiplicador > 1) {
      tipo = 'VANTAGEM';
      cor = COLORS.SUCCESS;
    } else if (multiplicador < 1) {
      tipo = 'DESVANTAGEM';
      cor = COLORS.ERROR;
    }

    console.log(`%c${ICONS.ELEMENTAL} Elemento: ${atacanteElemento} vs ${defensorElemento} → ${tipo} (${multiplicador}x)`, cor);
  }

  // ==================== SINERGIA ====================

  logSinergia(atacante, defensor, bonus) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.SINERGIAS) return;

    if (bonus > 0) {
      console.log(`%c${ICONS.SYNERGY} SINERGIA ATIVA: +${bonus}% de dano!`, COLORS.SUCCESS);
    }
  }

  // ==================== HABILIDADES ====================

  logUsarHabilidade(atacante, habilidade, custoEnergia) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.HABILIDADES) return;

    console.log('\n');
    console.log(`%c${ICONS.ABILITY} ${atacante.nome} usa: ${habilidade.nome}`, COLORS.HEADER);

    if (BATTLE_LOG_CONFIG.ENERGIA) {
      console.log(`   ${ICONS.ENERGY} Energia: ${atacante.energia_atual}/${100} → ${atacante.energia_atual - custoEnergia}/${100} (-${custoEnergia})`);
    }

    if (BATTLE_LOG_CONFIG.COOLDOWNS && habilidade.cooldown) {
      console.log(`   ${ICONS.COOLDOWN} Cooldown: ${habilidade.cooldown} turnos`);
    }
  }

  // ==================== DANO ====================

  logDano(dano, defensor, detalhes = {}) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.DANO) return;

    const {
      danoBase,
      multiplicadorStat,
      statValue,
      vantagemElemental,
      critico,
      reducaoResistencia,
      danoFinal
    } = detalhes;

    console.log('\n%c┌─ CÁLCULO DE DANO ─────────────────────────┐', COLORS.INFO);

    if (danoBase !== undefined && statValue !== undefined && multiplicadorStat !== undefined) {
      console.log(`│ Base: ${danoBase} + (${statValue} × ${multiplicadorStat}) = ${danoBase + (statValue * multiplicadorStat)}`);
    }

    if (vantagemElemental && vantagemElemental !== 1) {
      console.log(`│ ${ICONS.ELEMENTAL} Vantagem Elemental: ×${vantagemElemental}`);
    }

    if (critico) {
      console.log(`│ ${ICONS.CRITICAL} CRÍTICO! ×2.0`);
    }

    if (BATTLE_LOG_CONFIG.RESISTENCIA && reducaoResistencia !== undefined) {
      console.log(`│ ${ICONS.RESISTANCE} Resistência: -${reducaoResistencia} dano`);
    }

    console.log(`│ `);
    console.log(`│ ${ICONS.DAMAGE} Dano Total: ${danoFinal || dano}`);
    console.log(`│ ${defensor.nome}: ${defensor.hp_atual}/${defensor.hp_max} HP → ${Math.max(0, defensor.hp_atual - dano)}/${defensor.hp_max} HP`);
    console.log('%c└───────────────────────────────────────────┘', COLORS.INFO);
  }

  // ==================== CRÍTICO ====================

  logCritico() {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.CRITICO) return;
    console.log(`%c   ${ICONS.CRITICAL} GOLPE CRÍTICO! (×2 dano)`, COLORS.DAMAGE);
  }

  // ==================== EFEITOS DE STATUS ====================

  logAplicarEfeito(alvo, nomeEfeito, duracao, tipo) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.EFEITOS) return;

    const icone = tipo === 'buff' ? ICONS.BUFF : ICONS.DEBUFF;
    const cor = tipo === 'buff' ? COLORS.SUCCESS : COLORS.ERROR;

    if (BATTLE_LOG_CONFIG.DURACAO_EFEITOS && duracao) {
      console.log(`%c   ${icone} ${nomeEfeito} aplicado em ${alvo.nome} (${duracao} turnos)`, cor);
    } else {
      console.log(`%c   ${icone} ${nomeEfeito} aplicado em ${alvo.nome}`, cor);
    }
  }

  logEfeitosAtivos(avatar) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.EFEITOS) return;

    const buffs = avatar.buffs || [];
    const debuffs = avatar.debuffs || [];

    if (buffs.length > 0 || debuffs.length > 0) {
      console.log(`\n   ${ICONS.EFFECT} Efeitos ativos em ${avatar.nome}:`);

      buffs.forEach(buff => {
        if (BATTLE_LOG_CONFIG.DURACAO_EFEITOS) {
          console.log(`      ${ICONS.BUFF} ${buff.nome} (${buff.duracao} turnos restantes)`);
        }
      });

      debuffs.forEach(debuff => {
        if (BATTLE_LOG_CONFIG.DURACAO_EFEITOS) {
          console.log(`      ${ICONS.DEBUFF} ${debuff.nome} (${debuff.duracao} turnos restantes)`);
        }
      });
    }
  }

  logExpirarEfeito(alvo, nomeEfeito, tipo) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.DURACAO_EFEITOS) return;

    const icone = tipo === 'buff' ? ICONS.BUFF : ICONS.DEBUFF;
    console.log(`   ⏱️ ${nomeEfeito} expirou em ${alvo.nome}`);
  }

  // ==================== COOLDOWNS ====================

  logCooldowns(avatar) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.COOLDOWNS) return;

    const cooldowns = avatar.cooldowns || {};
    const ativas = Object.entries(cooldowns).filter(([_, valor]) => valor > 0);

    if (ativas.length > 0) {
      console.log(`\n   ${ICONS.COOLDOWN} Cooldowns de ${avatar.nome}:`);
      ativas.forEach(([habilidade, turnos]) => {
        console.log(`      • ${habilidade}: ${turnos} turnos`);
      });
    }
  }

  // ==================== ENERGIA ====================

  logEnergia(avatar, mudanca, motivo) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.ENERGIA) return;

    const sinal = mudanca >= 0 ? '+' : '';
    console.log(`   ${ICONS.ENERGY} Energia ${avatar.nome}: ${avatar.energia_atual} → ${avatar.energia_atual + mudanca} (${sinal}${mudanca} - ${motivo})`);
  }

  // ==================== CURA ====================

  logCura(cura, alvo) {
    if (!BATTLE_LOG_CONFIG.ENABLED) return;

    console.log(`%c   ${ICONS.HEAL} ${alvo.nome} recupera ${cura} HP (${alvo.hp_atual}/${alvo.hp_max} → ${Math.min(alvo.hp_max, alvo.hp_atual + cura)}/${alvo.hp_max})`, COLORS.HEAL);
  }

  // ==================== RESISTÊNCIA ====================

  logResistencia(defensor, reducao) {
    if (!BATTLE_LOG_CONFIG.ENABLED || !BATTLE_LOG_CONFIG.RESISTENCIA) return;

    console.log(`   ${ICONS.RESISTANCE} Resistência de ${defensor.nome}: ${defensor.resistencia} → Reduz ${reducao} de dano`);
  }

  // ==================== FIM DE BATALHA ====================

  finalizarBatalha(vencedor, perdedor, turnos) {
    if (!BATTLE_LOG_CONFIG.ENABLED) return;

    console.log('\n');
    console.log('%c╔════════════════════════════════════════════════════════════╗', COLORS.HEADER);
    console.log(`%c║              🏆  BATALHA FINALIZADA  🏆                    ║`, COLORS.HEADER);
    console.log('%c╚════════════════════════════════════════════════════════════╝', COLORS.HEADER);
    console.log('\n');
    console.log(`%c🏆 VENCEDOR: ${vencedor.nome}`, COLORS.SUCCESS);
    console.log(`   HP Restante: ${vencedor.hp_atual}/${vencedor.hp_max}`);
    console.log('\n');
    console.log(`💀 Derrotado: ${perdedor.nome}`);
    console.log(`   HP Final: ${perdedor.hp_atual}/${perdedor.hp_max}`);
    console.log('\n');
    console.log(`📊 Duração: ${turnos} turnos`);
    console.log('\n');
  }
}

// Exportar instância singleton
export const battleLogger = new BattleLogger();
