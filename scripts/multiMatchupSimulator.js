// ==================== SIMULADOR MULTI-BATALHA ====================
// Arquivo: /scripts/multiMatchupSimulator.js
//
// Testa múltiplos matchups elementais com estatísticas
// - Fogo vs Água (vantagem elemental)
// - Água vs Fogo (desvantagem)
// - Eletricidade vs Água (vantagem)
// - Água com cura (balanceamento)
// - Luz com cura (balanceamento)
//
// USO: node scripts/multiMatchupSimulator.js
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

// ==================== ENGINE DE COMBATE (MODO SILENCIOSO) ====================

class CombatEngine {
  constructor(avatar1, avatar2, silent = false) {
    this.player = avatar1;
    this.enemy = avatar2;
    this.turno = 0;
    this.silent = silent;
    this.totalCuras = 0; // Rastrear curas totais
  }

  log(mensagem) {
    if (!this.silent) {
      console.log(mensagem);
    }
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
      }

      // HoT
      if (efeito.tipo === 'regeneracao') {
        const cura = Math.floor(avatar.hp_max * EFFECT_BALANCE.HOT_FRACO);
        avatar.curar(cura);
        this.totalCuras += cura;
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
  }

  executarDefender(avatar) {
    avatar.recuperarEnergia(COMBAT_BALANCE.ENERGIA_DEFENDER_RECUPERA);
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
      this.totalCuras += cura;
    }
    // DANO
    else if (habilidade.multiplicador_stat > 0) {
      const dano = this.calcularDanoHabilidade(habilidade, atacante, defensor);
      defensor.receberDano(dano);
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
    this.decrementarCooldowns(this.player);
    this.decrementarCooldowns(this.enemy);
    this.processarEfeitos(this.player);
    this.processarEfeitos(this.enemy);

    // Player age
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

    return {
      vencedor: !this.player.estaVivo() ? this.enemy.nome : !this.enemy.estaVivo() ? this.player.nome : 'EMPATE',
      turnos: this.turno,
      hp_final_player: this.player.hp_atual,
      hp_final_enemy: this.enemy.hp_atual,
      totalCuras: this.totalCuras
    };
  }
}

// ==================== DEFINIÇÃO DE AVATARES ====================

function criarAvatarFogo() {
  return new AvatarBatalha('Fogo', 'Fogo', { hp: 300, forca: 25, resistencia: 15, foco: 20, agilidade: 18 }, [
    {
      nome: 'Explosão de Chamas',
      dano_base: 0,
      multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA,
      stat_primario: 'forca',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO,
      efeitos_status: []
    },
    {
      nome: 'Escudo de Chamas',
      dano_base: 0,
      multiplicador_stat: 0,
      stat_primario: 'resistencia',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_BUFF_MEDIO,
      efeitos_status: [],
      alvo: 'self'
    }
  ]);
}

function criarAvatarAgua() {
  return new AvatarBatalha('Água', 'Água', { hp: 350, forca: 18, resistencia: 20, foco: 25, agilidade: 20 }, [
    {
      nome: 'Maremoto',
      dano_base: 0,
      multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO,
      efeitos_status: []
    },
    {
      nome: 'Cura Aquática',
      dano_base: -25, // CURA 25% HP
      multiplicador_stat: 0,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_CURA_PEQUENA,
      efeitos_status: [],
      alvo: 'self'
    }
  ]);
}

function criarAvatarEletricidade() {
  return new AvatarBatalha('Eletricidade', 'Eletricidade', { hp: 300, forca: 20, resistencia: 15, foco: 30, agilidade: 25 }, [
    {
      nome: 'Relâmpago',
      dano_base: 0,
      multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO,
      efeitos_status: []
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
  ]);
}

function criarAvatarLuz() {
  return new AvatarBatalha('Luz', 'Luz', { hp: 320, forca: 18, resistencia: 18, foco: 28, agilidade: 22 }, [
    {
      nome: 'Julgamento Divino',
      dano_base: 0,
      multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO,
      efeitos_status: []
    },
    {
      nome: 'Benção',
      dano_base: 0,
      multiplicador_stat: 0,
      stat_primario: 'foco',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_CURA_PEQUENA,
      efeitos_status: ['regeneracao'], // HoT 5% por turno
      duracao_efeito: COOLDOWN_BALANCE.DURACAO_DOT_FRACO,
      alvo: 'self'
    }
  ]);
}

function criarAvatarTerra() {
  return new AvatarBatalha('Terra', 'Terra', { hp: 380, forca: 28, resistencia: 25, foco: 18, agilidade: 15 }, [
    {
      nome: 'Terremoto',
      dano_base: 0,
      multiplicador_stat: COMBAT_BALANCE.MULTIPLICADOR_HABILIDADE_MEDIA,
      stat_primario: 'forca',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_FORTE,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_DANO_MEDIO,
      efeitos_status: []
    },
    {
      nome: 'Muralha de Pedra',
      dano_base: 0,
      multiplicador_stat: 0,
      stat_primario: 'resistencia',
      custo_energia: COMBAT_BALANCE.ENERGIA_HABILIDADE_MEDIA,
      cooldown: COOLDOWN_BALANCE.COOLDOWN_BUFF_MEDIO,
      efeitos_status: [],
      alvo: 'self'
    }
  ]);
}

// ==================== SIMULADOR DE MÚLTIPLAS BATALHAS ====================

function simularMatchup(criarAvatar1, criarAvatar2, nomeBatalha, numBatalhas = 10) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎮 MATCHUP: ${nomeBatalha}`);
  console.log(`${'='.repeat(60)}`);

  const resultados = [];
  let vitoriasP1 = 0;
  let vitoriasP2 = 0;
  let empates = 0;
  let somaTurnos = 0;
  let somaCuras = 0;

  for (let i = 0; i < numBatalhas; i++) {
    const avatar1 = criarAvatar1();
    const avatar2 = criarAvatar2();
    const engine = new CombatEngine(avatar1, avatar2, true); // silent = true
    const resultado = engine.simular();

    resultados.push(resultado);
    somaTurnos += resultado.turnos;
    somaCuras += resultado.totalCuras;

    if (resultado.vencedor === avatar1.nome) vitoriasP1++;
    else if (resultado.vencedor === avatar2.nome) vitoriasP2++;
    else empates++;

    avatar1.resetar();
    avatar2.resetar();
  }

  // Calcular estatísticas
  const mediaTurnos = (somaTurnos / numBatalhas).toFixed(1);
  const taxaVitoriaP1 = ((vitoriasP1 / numBatalhas) * 100).toFixed(0);
  const taxaVitoriaP2 = ((vitoriasP2 / numBatalhas) * 100).toFixed(0);
  const mediaCuras = (somaCuras / numBatalhas).toFixed(0);

  const avatar1 = criarAvatar1();
  const avatar2 = criarAvatar2();

  console.log(`\n📊 RESULTADOS (${numBatalhas} batalhas):`);
  console.log(`   ${avatar1.nome}: ${vitoriasP1} vitórias (${taxaVitoriaP1}%)`);
  console.log(`   ${avatar2.nome}: ${vitoriasP2} vitórias (${taxaVitoriaP2}%)`);
  console.log(`   Empates: ${empates}`);
  console.log(`\n📈 ESTATÍSTICAS:`);
  console.log(`   Média de turnos: ${mediaTurnos}`);
  console.log(`   Cura total média: ${mediaCuras} HP`);

  // Análise de balanceamento
  console.log(`\n💡 ANÁLISE:`);
  if (Math.abs(vitoriasP1 - vitoriasP2) <= 2) {
    console.log(`   ✅ BALANCEADO - Diferença de vitórias: ${Math.abs(vitoriasP1 - vitoriasP2)}`);
  } else if (Math.abs(vitoriasP1 - vitoriasP2) <= 4) {
    console.log(`   ⚠️  LIGEIRAMENTE DESBALANCEADO - Diferença: ${Math.abs(vitoriasP1 - vitoriasP2)}`);
  } else {
    console.log(`   ❌ DESBALANCEADO - Diferença: ${Math.abs(vitoriasP1 - vitoriasP2)}`);
  }

  if (parseFloat(mediaTurnos) < 5) {
    console.log(`   ⚠️  Batalhas muito rápidas (< 5 turnos)`);
  } else if (parseFloat(mediaTurnos) > 12) {
    console.log(`   ⚠️  Batalhas muito longas (> 12 turnos)`);
  } else {
    console.log(`   ✅ Duração ideal (5-12 turnos)`);
  }

  if (somaCuras > 0) {
    const percentualCura = (somaCuras / (avatar1.hp_max * numBatalhas)) * 100;
    console.log(`   📊 Cura média: ${percentualCura.toFixed(0)}% do HP máximo por batalha`);
    if (percentualCura > 80) {
      console.log(`   ⚠️  MUITA CURA - Pode estar OP!`);
    } else if (percentualCura > 40) {
      console.log(`   ✅ Cura equilibrada`);
    }
  }

  return { vitoriasP1, vitoriasP2, empates, mediaTurnos, mediaCuras };
}

// ==================== EXECUTAR TESTES ====================

console.log('\n🧪 ==================== SIMULADOR MULTI-BATALHA ====================');
console.log('📋 Testando balanceamento de elementos e cura...\n');

// Teste 1: Fogo vs Água (vantagem elemental Água)
simularMatchup(criarAvatarFogo, criarAvatarAgua, 'Fogo vs Água (Água tem vantagem)', 15);

// Teste 2: Água vs Fogo (invertido)
simularMatchup(criarAvatarAgua, criarAvatarFogo, 'Água vs Fogo (Água com CURA)', 15);

// Teste 3: Eletricidade vs Água (vantagem elemental Eletricidade)
simularMatchup(criarAvatarEletricidade, criarAvatarAgua, 'Eletricidade vs Água (Elétrico forte)', 15);

// Teste 4: Luz vs Fogo (testar cura HoT)
simularMatchup(criarAvatarLuz, criarAvatarFogo, 'Luz vs Fogo (Luz com REGENERAÇÃO)', 15);

// Teste 5: Terra vs Água (tanque vs cura)
simularMatchup(criarAvatarTerra, criarAvatarAgua, 'Terra vs Água (Tanque vs Cura)', 15);

// Teste 6: Água vs Luz (cura instantânea vs regeneração)
simularMatchup(criarAvatarAgua, criarAvatarLuz, 'Água vs Luz (CURA vs REGENERAÇÃO)', 15);

console.log(`\n${'='.repeat(60)}`);
console.log('✅ Testes completos!');
console.log(`${'='.repeat(60)}\n`);
