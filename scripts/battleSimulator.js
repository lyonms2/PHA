// ==================== SIMULADOR DE BATALHA ====================
// Arquivo: /scripts/battleSimulator.js
//
// Simula batalhas completas para testar o sistema de balanceamento
// Verifica: Cooldowns, Durações, Dano, Energia, Flow do jogo
//
// USO: node scripts/battleSimulator.js
// ================================================================

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

  resetCooldowns() {
    this.cooldowns = {};
  }

  aplicarEfeito(efeito) {
    this.efeitos_ativos.push(efeito);
  }

  removerEfeito(nomeEfeito) {
    this.efeitos_ativos = this.efeitos_ativos.filter(e => e.nome !== nomeEfeito);
  }

  getStatComBuffs(stat) {
    let valor = this.stats[stat];

    // Aplicar buffs/debuffs
    for (const efeito of this.efeitos_ativos) {
      if (efeito.tipo === 'sobrecarga' && stat === 'foco') {
        valor *= (1 + EFFECT_BALANCE.BUFF_STAT_MEDIO);
      }
      // Adicionar outros efeitos conforme necessário
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

// ==================== ENGINE DE COMBATE ====================

class CombatEngine {
  constructor(avatar1, avatar2) {
    this.player = avatar1;
    this.enemy = avatar2;
    this.turno = 0;
    this.logs = [];
  }

  log(mensagem, tipo = 'info') {
    const emoji = {
      info: 'ℹ️',
      damage: '⚔️',
      heal: '💚',
      effect: '✨',
      energy: '⚡',
      cooldown: '🔒',
      victory: '🏆'
    };

    this.logs.push(`${emoji[tipo] || ''} ${mensagem}`);
    console.log(`${emoji[tipo] || ''} ${mensagem}`);
  }

  // Decrementa cooldowns no início do turno
  decrementarCooldowns(avatar) {
    for (const habilidade in avatar.cooldowns) {
      if (avatar.cooldowns[habilidade] > 0) {
        avatar.cooldowns[habilidade]--;
        this.log(`${avatar.nome}: ${habilidade} cooldown ${avatar.cooldowns[habilidade]}`, 'cooldown');
      }
    }
  }

  // Processar efeitos contínuos (DoT, HoT, buffs)
  processarEfeitos(avatar) {
    const efeitosExpirados = [];

    for (const efeito of avatar.efeitos_ativos) {
      // Decrementar duração
      efeito.turnosRestantes--;

      // Processar DoT
      if (efeito.tipo === 'queimadura' || efeito.tipo === 'sangramento') {
        const dano = Math.floor(avatar.hp_max * EFFECT_BALANCE.DOT_FRACO);
        avatar.receberDano(dano);
        this.log(`${avatar.nome} sofre ${dano} de ${efeito.nome} (${efeito.turnosRestantes} turnos restantes)`, 'damage');
      }

      // Processar HoT
      if (efeito.tipo === 'regeneracao') {
        const cura = Math.floor(avatar.hp_max * EFFECT_BALANCE.HOT_FRACO);
        avatar.curar(cura);
        this.log(`${avatar.nome} regenera ${cura} HP (${efeito.turnosRestantes} turnos restantes)`, 'heal');
      }

      // Marcar para remoção se expirou
      if (efeito.turnosRestantes <= 0) {
        efeitosExpirados.push(efeito.nome);
      }
    }

    // Remover efeitos expirados
    for (const nomeEfeito of efeitosExpirados) {
      avatar.removerEfeito(nomeEfeito);
      this.log(`${avatar.nome}: ${nomeEfeito} expirou`, 'effect');
    }
  }

  // Calcular dano de ataque básico
  calcularDanoAtaqueBasico(atacante, defensor) {
    const forca = atacante.getStatComBuffs('forca');
    let dano = COMBAT_BALANCE.DANO_ATAQUE_BASICO_BASE + (forca * COMBAT_BALANCE.MULTIPLICADOR_ATAQUE_BASICO);

    // Aplicar vantagem elemental
    const multElemental = getElementalMultiplier(atacante.elemento, defensor.elemento);
    dano *= multElemental;

    return Math.floor(dano);
  }

  // Calcular dano de habilidade
  calcularDanoHabilidade(habilidade, atacante, defensor) {
    const stat = atacante.getStatComBuffs(habilidade.stat_primario || 'forca');
    let dano = habilidade.dano_base + (stat * habilidade.multiplicador_stat);

    // Aplicar vantagem elemental
    const multElemental = getElementalMultiplier(atacante.elemento, defensor.elemento);
    dano *= multElemental;

    return Math.floor(dano);
  }

  // Executar ataque básico
  executarAtaqueBasico(atacante, defensor) {
    atacante.gastarEnergia(COMBAT_BALANCE.ENERGIA_ATAQUE_BASICO);

    const dano = this.calcularDanoAtaqueBasico(atacante, defensor);
    defensor.receberDano(dano);

    this.log(`${atacante.nome} usa Ataque Básico → ${dano} de dano (${defensor.hp_atual}/${defensor.hp_max} HP)`, 'damage');
  }

  // Executar defender
  executarDefender(avatar) {
    avatar.recuperarEnergia(COMBAT_BALANCE.ENERGIA_DEFENDER_RECUPERA);
    this.log(`${avatar.nome} DEFENDE → Recupera ${COMBAT_BALANCE.ENERGIA_DEFENDER_RECUPERA} energia (${avatar.energia_atual}/${avatar.energia_max})`, 'energy');
  }

  // Executar habilidade
  executarHabilidade(habilidade, atacante, defensor) {
    // Verificar cooldown
    if (atacante.cooldowns[habilidade.nome] > 0) {
      this.log(`${atacante.nome} tentou usar ${habilidade.nome} mas está em cooldown!`, 'cooldown');
      return false;
    }

    // Verificar energia
    if (atacante.energia_atual < habilidade.custo_energia) {
      this.log(`${atacante.nome} não tem energia para ${habilidade.nome}!`, 'energy');
      return false;
    }

    // Gastar energia
    atacante.gastarEnergia(habilidade.custo_energia);

    // Aplicar cooldown
    atacante.cooldowns[habilidade.nome] = habilidade.cooldown;

    // DANO
    if (habilidade.multiplicador_stat > 0) {
      const dano = this.calcularDanoHabilidade(habilidade, atacante, defensor);
      defensor.receberDano(dano);
      this.log(`${atacante.nome} usa ${habilidade.nome} → ${dano} de dano (${defensor.hp_atual}/${defensor.hp_max} HP)`, 'damage');
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
          this.log(`${alvo.nome} recebeu ${efeito.nome} (${efeito.turnosRestantes} turnos)`, 'effect');
        }
      }
    }

    return true;
  }

  // IA simples: escolher ação
  escolherAcaoIA(avatar, inimigo) {
    // Prioridade 1: Usar habilidade ofensiva se disponível
    const habilidadeOfensiva = avatar.habilidades.find(h =>
      h.multiplicador_stat > 0 &&
      avatar.energia_atual >= h.custo_energia &&
      !avatar.cooldowns[h.nome]
    );

    if (habilidadeOfensiva) {
      return { tipo: 'habilidade', habilidade: habilidadeOfensiva };
    }

    // Prioridade 2: Usar buff se disponível e não tem buff ativo
    const habilidadeBuff = avatar.habilidades.find(h =>
      h.alvo === 'self' &&
      avatar.energia_atual >= h.custo_energia &&
      !avatar.cooldowns[h.nome] &&
      avatar.efeitos_ativos.length === 0
    );

    if (habilidadeBuff) {
      return { tipo: 'habilidade', habilidade: habilidadeBuff };
    }

    // Prioridade 3: Ataque básico se tem energia
    if (avatar.energia_atual >= COMBAT_BALANCE.ENERGIA_ATAQUE_BASICO) {
      return { tipo: 'ataque_basico' };
    }

    // Sem opção: defender
    return { tipo: 'defender' };
  }

  // Executar turno
  executarTurno() {
    this.turno++;
    this.log(`\n========== TURNO ${this.turno} ==========`, 'info');

    // Decrementar cooldowns
    this.decrementarCooldowns(this.player);
    this.decrementarCooldowns(this.enemy);

    // Processar efeitos
    this.processarEfeitos(this.player);
    this.processarEfeitos(this.enemy);

    // Player age
    this.log(`\n--- ${this.player.nome} [${this.player.hp_atual}/${this.player.hp_max} HP | ${this.player.energia_atual}/${this.player.energia_max} ⚡] ---`, 'info');

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
    this.log(`\n--- ${this.enemy.nome} [${this.enemy.hp_atual}/${this.enemy.hp_max} HP | ${this.enemy.energia_atual}/${this.enemy.energia_max} ⚡] ---`, 'info');

    const acaoEnemy = this.escolherAcaoIA(this.enemy, this.player);

    if (acaoEnemy.tipo === 'ataque_basico') {
      this.executarAtaqueBasico(this.enemy, this.player);
    } else if (acaoEnemy.tipo === 'defender') {
      this.executarDefender(this.enemy);
    } else if (acaoEnemy.tipo === 'habilidade') {
      this.executarHabilidade(acaoEnemy.habilidade, this.enemy, this.player);
    }
  }

  // Simular batalha completa
  simular(maxTurnos = 20) {
    this.log('\n🎮 ==================== INÍCIO DA BATALHA ====================', 'info');
    this.log(`${this.player.nome} (${this.player.elemento}) VS ${this.enemy.nome} (${this.enemy.elemento})`, 'info');

    while (this.player.estaVivo() && this.enemy.estaVivo() && this.turno < maxTurnos) {
      this.executarTurno();
    }

    this.log('\n🏁 ==================== FIM DA BATALHA ====================', 'info');

    if (!this.player.estaVivo()) {
      this.log(`${this.enemy.nome} VENCEU! (${this.enemy.hp_atual}/${this.enemy.hp_max} HP restantes)`, 'victory');
    } else if (!this.enemy.estaVivo()) {
      this.log(`${this.player.nome} VENCEU! (${this.player.hp_atual}/${this.player.hp_max} HP restantes)`, 'victory');
    } else {
      this.log(`EMPATE! Limite de ${maxTurnos} turnos atingido`, 'info');
    }

    this.log(`\nTotal de turnos: ${this.turno}`, 'info');

    return {
      vencedor: !this.player.estaVivo() ? this.enemy.nome : !this.enemy.estaVivo() ? this.player.nome : 'EMPATE',
      turnos: this.turno,
      hp_final_player: this.player.hp_atual,
      hp_final_enemy: this.enemy.hp_atual
    };
  }
}

// ==================== TESTE: ELETRICIDADE VS ÁGUA ====================

console.log('\n🧪 Iniciando Simulador de Batalha...\n');

// Criar avatares
const eletricidade = new AvatarBatalha(
  'Avatar Elétrico',
  'Eletricidade',
  {
    hp: 300,
    forca: 20,
    resistencia: 15,
    foco: 30,
    agilidade: 25
  },
  [
    {
      nome: 'Relâmpago',
      dano_base: 0,
      multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO,
      efeitos_status: ['paralisia'],
      duracao_efeito: COOLDOWN_BALANCE.DURACAO_CONTROLE_FRACO
    },
    {
      nome: 'Sobrecarga',
      dano_base: 0,
      multiplicador_stat: 0,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_BUFF_MEDIO,
      efeitos_status: ['sobrecarga'],
      duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,
      alvo: 'self'
    }
  ]
);

const agua = new AvatarBatalha(
  'Avatar Aquático',
  'Água',
  {
    hp: 350,
    forca: 18,
    resistencia: 20,
    foco: 25,
    agilidade: 22
  },
  [
    {
      nome: 'Tsunami',
      dano_base: 0,
      multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_FORTE,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_FORTE,
      efeitos_status: [],
      duracao_efeito: 0
    },
    {
      nome: 'Corrente Temporal',
      dano_base: 0,
      multiplicador_stat: 0,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_SUPORTE_ESPECIAL,
      efeitos_status: ['corrente_temporal'],
      duracao_efeito: COOLDOWN_BALANCE.DURACAO_BUFF_SELF_MEDIO,
      alvo: 'self'
    }
  ]
);

// Simular batalha
const engine = new CombatEngine(eletricidade, agua);
const resultado = engine.simular();

console.log('\n📊 ==================== RESULTADO ====================');
console.log(`Vencedor: ${resultado.vencedor}`);
console.log(`Turnos: ${resultado.turnos}`);
console.log(`HP Final ${eletricidade.nome}: ${resultado.hp_final_player}/${eletricidade.hp_max}`);
console.log(`HP Final ${agua.nome}: ${resultado.hp_final_enemy}/${agua.hp_max}`);
