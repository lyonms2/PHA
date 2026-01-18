// ==================== TESTE DETALHADO: AETHER VS FOGO ====================
// Arquivo: /scripts/testAetherVsFogo.js
//
// Investiga por que Aether (elemento supremo) perde para Fogo (elemento básico)

import { COMBAT_BALANCE } from '../app/avatares/sistemas/balance/combatBalance.js';
import { COOLDOWN_BALANCE } from '../app/avatares/sistemas/balance/cooldownBalance.js';
import { EFFECT_BALANCE } from '../app/avatares/sistemas/balance/effectBalance.js';
import { ELEMENTAL_BALANCE, getElementalMultiplier } from '../app/avatares/sistemas/balance/elementalBalance.js';
import { EFEITOS_STATUS } from '../app/avatares/sistemas/effects/statusEffects.js';

// ==================== CLASSE AVATAR (SIMPLIFICADA) ====================

class AvatarBatalha {
  constructor(nome, elemento, stats, habilidades) {
    this.nome = nome;
    this.elemento = elemento;
    this.stats = stats;
    this.hp_atual = stats.hp;
    this.hp_max = stats.hp;
    this.energia_atual = COMBAT_BALANCE.ENERGIA_MAXIMA;
    this.energia_max = COMBAT_BALANCE.ENERGIA_MAXIMA;
    this.habilidades = habilidades;
    this.cooldowns = {};
    this.efeitos_ativos = [];
  }

  resetar() {
    this.hp_atual = this.hp_max;
    this.energia_atual = this.energia_max;
    this.cooldowns = {};
    this.efeitos_ativos = [];
  }

  aplicarEfeito(efeito) {
    this.efeitos_ativos.push(efeito);
  }

  removerEfeito(nomeEfeito) {
    this.efeitos_ativos = this.efeitos_ativos.filter(e => e.nome !== nomeEfeito);
  }

  getStatComBuffs(stat) {
    let valor = this.stats[stat];
    for (const efeito of this.efeitos_ativos) {
      if (efeito.tipo === 'sobrecarga' && stat === 'foco') {
        valor *= (1 + EFFECT_BALANCE.BUFF_STAT_MEDIO);
      }
    }
    return Math.floor(valor);
  }

  recuperarEnergia(quantidade) {
    this.energia_atual = Math.min(this.energia_max, this.energia_atual + quantidade);
  }

  gastarEnergia(quantidade) {
    this.energia_atual = Math.max(0, this.energia_atual - quantidade);
  }

  receberDano(dano) {
    this.hp_atual = Math.max(0, this.hp_atual - dano);
  }

  curar(quantidade) {
    this.hp_atual = Math.min(this.hp_max, this.hp_atual + quantidade);
  }

  estaVivo() {
    return this.hp_atual > 0;
  }
}

// ==================== ENGINE DE COMBATE (MODO VERBOSE) ====================

class CombatEngine {
  constructor(avatar1, avatar2) {
    this.player = avatar1;
    this.enemy = avatar2;
    this.turno = 0;
  }

  log(mensagem) {
    console.log(mensagem);
  }

  decrementarCooldowns(avatar) {
    for (const habilidade in avatar.cooldowns) {
      if (avatar.cooldowns[habilidade] > 0) {
        avatar.cooldowns[habilidade]--;
      }
    }
  }

  processarEfeitos(avatar) {
    const efeitosExpirados = [];
    for (const efeito of avatar.efeitos_ativos) {
      efeito.turnosRestantes--;

      // DoT
      if (efeito.tipo === 'queimadura' || efeito.tipo === 'sangramento') {
        const dano = Math.floor(avatar.hp_max * EFFECT_BALANCE.DOT_FRACO);
        avatar.receberDano(dano);
        this.log(`   💥 ${avatar.nome} sofre ${dano} de ${efeito.nome}`);
      }

      if (efeito.turnosRestantes <= 0) {
        efeitosExpirados.push(efeito.nome);
      }
    }

    for (const nomeEfeito of efeitosExpirados) {
      avatar.removerEfeito(nomeEfeito);
    }
  }

  calcularDanoAtaqueBasico(atacante, defensor) {
    const forca = atacante.getStatComBuffs('forca');
    let dano = COMBAT_BALANCE.DANO_ATAQUE_BASICO_BASE + (forca * COMBAT_BALANCE.MULTIPLICADOR_ATAQUE_BASICO);
    const multElemental = getElementalMultiplier(atacante.elemento, defensor.elemento);
    dano *= multElemental;
    return Math.floor(dano);
  }

  calcularDanoHabilidade(habilidade, atacante, defensor) {
    const stat = atacante.getStatComBuffs(habilidade.stat_primario || 'forca');
    let dano = habilidade.dano_base + (stat * habilidade.multiplicador_stat);
    const multElemental = getElementalMultiplier(atacante.elemento, defensor.elemento);
    dano *= multElemental;
    return Math.floor(dano);
  }

  executarAtaqueBasico(atacante, defensor) {
    atacante.gastarEnergia(COMBAT_BALANCE.ENERGIA_ATAQUE_BASICO);
    const dano = this.calcularDanoAtaqueBasico(atacante, defensor);
    defensor.receberDano(dano);
    this.log(`   ⚔️  ${atacante.nome} ataca básico causando ${dano} de dano`);
    this.log(`      ${defensor.nome}: ${defensor.hp_atual}/${defensor.hp_max} HP`);
  }

  executarDefender(avatar) {
    avatar.recuperarEnergia(COMBAT_BALANCE.ENERGIA_DEFENDER_RECUPERA);
    this.log(`   🛡️  ${avatar.nome} defende e recupera ${COMBAT_BALANCE.ENERGIA_DEFENDER_RECUPERA} energia`);
  }

  executarHabilidade(habilidade, atacante, defensor) {
    if (atacante.cooldowns[habilidade.nome] > 0) return false;
    if (atacante.energia_atual < habilidade.custo_energia) return false;

    atacante.gastarEnergia(habilidade.custo_energia);
    atacante.cooldowns[habilidade.nome] = habilidade.cooldown;

    // CURA INSTANTÂNEA (dano_base negativo)
    if (habilidade.dano_base < 0) {
      const cura = Math.floor(atacante.hp_max * Math.abs(habilidade.dano_base) / 100);
      atacante.curar(cura);
      this.log(`   💚 ${atacante.nome} usa ${habilidade.nome} e cura ${cura} HP`);
    }
    // DANO
    else if (habilidade.multiplicador_stat > 0) {
      const dano = this.calcularDanoHabilidade(habilidade, atacante, defensor);
      defensor.receberDano(dano);
      this.log(`   💥 ${atacante.nome} usa ${habilidade.nome} causando ${dano} de dano`);
      this.log(`      ${defensor.nome}: ${defensor.hp_atual}/${defensor.hp_max} HP`);
    }

    // EFEITOS
    if (habilidade.efeitos_status && habilidade.efeitos_status.length > 0) {
      for (const efeitoNome of habilidade.efeitos_status) {
        const efeitoTemplate = EFEITOS_STATUS[efeitoNome];
        if (efeitoTemplate) {
          const alvo = habilidade.alvo === 'self' ? atacante : defensor;
          const efeito = {
            nome: efeitoTemplate.nome,
            tipo: efeitoTemplate.tipo,
            turnosRestantes: habilidade.duracao_efeito || efeitoTemplate.duracao_base
          };
          alvo.aplicarEfeito(efeito);
          this.log(`   ✨ ${alvo.nome} recebe efeito: ${efeitoTemplate.nome}`);
        }
      }
    }

    return true;
  }

  escolherAcaoIA(avatar, inimigo) {
    // Prioridade 1: Cura se HP baixo (< 50%)
    if (avatar.hp_atual < avatar.hp_max * 0.5) {
      const habilidadeCura = avatar.habilidades.find(h =>
        (h.dano_base < 0 || h.efeitos_status?.includes('regeneracao')) &&
        avatar.energia_atual >= h.custo_energia &&
        !avatar.cooldowns[h.nome]
      );
      if (habilidadeCura) {
        return { tipo: 'habilidade', habilidade: habilidadeCura };
      }
    }

    // Prioridade 2: Habilidade ofensiva
    const habilidadeOfensiva = avatar.habilidades.find(h =>
      h.multiplicador_stat > 0 &&
      avatar.energia_atual >= h.custo_energia &&
      !avatar.cooldowns[h.nome]
    );
    if (habilidadeOfensiva) {
      return { tipo: 'habilidade', habilidade: habilidadeOfensiva };
    }

    // Prioridade 3: Buff
    const habilidadeBuff = avatar.habilidades.find(h =>
      h.alvo === 'self' &&
      h.dano_base >= 0 &&
      avatar.energia_atual >= h.custo_energia &&
      !avatar.cooldowns[h.nome] &&
      avatar.efeitos_ativos.length === 0
    );
    if (habilidadeBuff) {
      return { tipo: 'habilidade', habilidade: habilidadeBuff };
    }

    // Prioridade 4: Ataque básico
    if (avatar.energia_atual >= COMBAT_BALANCE.ENERGIA_ATAQUE_BASICO) {
      return { tipo: 'ataque_basico' };
    }

    // Sem opção: defender
    return { tipo: 'defender' };
  }

  executarTurno() {
    this.turno++;
    this.log(`\n━━━━━━━━━━━ TURNO ${this.turno} ━━━━━━━━━━━`);

    this.decrementarCooldowns(this.player);
    this.decrementarCooldowns(this.enemy);
    this.processarEfeitos(this.player);
    this.processarEfeitos(this.enemy);

    // Status inicial
    this.log(`📊 ${this.player.nome}: ${this.player.hp_atual}/${this.player.hp_max} HP | ${this.player.energia_atual}/${this.player.energia_max} Energia`);
    this.log(`📊 ${this.enemy.nome}: ${this.enemy.hp_atual}/${this.enemy.hp_max} HP | ${this.enemy.energia_atual}/${this.enemy.energia_max} Energia`);

    // Player age
    this.log(`\n🔵 ${this.player.nome} age:`);
    const acaoPlayer = this.escolherAcaoIA(this.player, this.enemy);
    if (acaoPlayer.tipo === 'ataque_basico') {
      this.executarAtaqueBasico(this.player, this.enemy);
    } else if (acaoPlayer.tipo === 'defender') {
      this.executarDefender(this.player);
    } else if (acaoPlayer.tipo === 'habilidade') {
      this.executarHabilidade(acaoPlayer.habilidade, this.player, this.enemy);
    }

    if (!this.enemy.estaVivo()) return;

    // Enemy age
    this.log(`\n🔴 ${this.enemy.nome} age:`);
    const acaoEnemy = this.escolherAcaoIA(this.enemy, this.player);
    if (acaoEnemy.tipo === 'ataque_basico') {
      this.executarAtaqueBasico(this.enemy, this.player);
    } else if (acaoEnemy.tipo === 'defender') {
      this.executarDefender(this.enemy);
    } else if (acaoEnemy.tipo === 'habilidade') {
      this.executarHabilidade(acaoEnemy.habilidade, this.enemy, this.player);
    }
  }

  simular(maxTurnos = 20) {
    while (this.player.estaVivo() && this.enemy.estaVivo() && this.turno < maxTurnos) {
      this.executarTurno();
    }

    const vencedor = !this.player.estaVivo() ? this.enemy.nome : !this.enemy.estaVivo() ? this.player.nome : 'EMPATE';

    this.log(`\n${'═'.repeat(60)}`);
    this.log(`🏆 VENCEDOR: ${vencedor}`);
    this.log(`📊 Turnos totais: ${this.turno}`);
    this.log(`${'═'.repeat(60)}\n`);

    return {
      vencedor,
      turnos: this.turno,
      hp_final_player: this.player.hp_atual,
      hp_final_enemy: this.enemy.hp_atual
    };
  }
}

// ==================== DEFINIÇÃO DE AVATARES ====================

function criarAvatarAether() {
  return new AvatarBatalha('Aether', 'Aether', { hp: 300, forca: 15, resistencia: 20, foco: 35, agilidade: 22 }, [
    {
      nome: 'Raio Primordial',
      dano_base: COMBAT_BALANCE.DANO_BASE_HABILIDADE_FORTE, // 10
      multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_FORTE, // 4.5
      stat_primario: 'foco',
      ignora_defesa: 0.75,
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE + 5, // 40 (balanceado)
      cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_FORTE, // 3 turnos
      efeitos_status: []
    },
    {
      nome: 'Campo de Transcendência',
      dano_base: 0,
      multiplicador_stat: 0,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA, // 25 (balanceado)
      cooldown: COOLDOWN_BALANCE.COOLDOWN_SUPORTE_ESPECIAL,
      efeitos_status: ['transcendencia'],
      duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,
      alvo: 'self'
    }
  ]);
}

function criarAvatarFogo() {
  return new AvatarBatalha('Fogo', 'Fogo', { hp: 300, forca: 25, resistencia: 15, foco: 20, agilidade: 18 }, [
    {
      nome: 'Explosão de Chamas',
      dano_base: 0,
      multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA, // 3.5
      stat_primario: 'forca',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE, // 35
      cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO, // 2 turnos
      efeitos_status: []
    },
    {
      nome: 'Escudo de Chamas',
      dano_base: 0,
      multiplicador_stat: 0,
      stat_primario: 'resistencia',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA, // 25
      cooldown: COOLDOWN_BALANCE.COOLDOWN_BUFF_MEDIO,
      efeitos_status: [],
      alvo: 'self'
    }
  ]);
}

// ==================== EXECUTAR TESTE ====================

console.log('\n🧪 ==================== TESTE DETALHADO ====================');
console.log('⚡ AETHER vs 🔥 FOGO');
console.log('Investigando por que elemento supremo perde para básico\n');

console.log('📋 STATS:');
console.log('   Aether: HP 300 | Foco 35 | Raio Primordial: 10 + (35 × 4.5) = 167.5 dano');
console.log('   Fogo:   HP 300 | Força 25 | Explosão Chamas: 0 + (25 × 3.5) = 87.5 dano');
console.log('   Diferença: Aether causa ~80 dano a mais por hit!\n');

const aether = criarAvatarAether();
const fogo = criarAvatarFogo();
const engine = new CombatEngine(aether, fogo);
engine.simular();

console.log('\n💡 ANÁLISE:');
console.log('   Aether tem dano superior (4.5x vs 3.5x, +10 base damage)');
console.log('   Custo energia BALANCEADO:');
console.log('   - Raio Primordial: 40 energia (vs 35 do Fogo)');
console.log('   - Transcendência: 25 energia (igual outros buffs)');
console.log('   - Total: 65 energia em 2 turnos → permite combo sustentável');
