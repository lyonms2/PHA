// ==================== CALCULADOR DE DANO ====================
// Arquivo: /app/avatares/sistemas/utils/damageCalculator.js
// Lógica de cálculo de dano de habilidades

/**
 * Calcula dano final de uma habilidade
 * Aplica modificadores baseados em:
 * - Stat primário da habilidade
 * - Multiplicador de stat
 * - Nível do avatar (1% por nível)
 * - Bônus de vínculo (até 20% em Alma Gêmea)
 *
 * @param {Object} habilidade - Habilidade usada
 * @param {Object} stats - Stats do avatar (objeto com propriedades forca, resistencia, agilidade, foco)
 * @param {number} nivel - Nível do avatar
 * @param {number} vinculo - Vínculo do avatar (0-100), padrão 0
 * @returns {number} Dano calculado e arredondado
 *
 * @example
 * const dano = calcularDanoHabilidade(
 *   { dano_base: 30, stat_primario: 'forca', multiplicador_stat: 1.2 },
 *   { forca: 50, resistencia: 30, agilidade: 40, foco: 45 },
 *   15,
 *   60
 * );
 * // Retorna o dano calculado com todos os bônus aplicados
 */
export function calcularDanoHabilidade(habilidade, stats, nivel, vinculo = 0) {
  // Valores padrão caso a habilidade não tenha esses campos
  const statPrimario = habilidade.stat_primario || 'forca';
  const danoBase = habilidade.dano_base || 0;
  const multiplicadorStat = habilidade.multiplicador_stat || 1.0;

  const statValue = stats[statPrimario] || 10;

  // Dano base + (stat × multiplicador)
  let dano = danoBase + (statValue * multiplicadorStat);

  // Bônus de nível (1% por nível)
  dano *= (1 + (nivel * 0.01));

  // Bônus de vínculo (até 20% em Alma Gêmea)
  const bonusVinculo = vinculo >= 80 ? 0.20 : vinculo >= 60 ? 0.15 : vinculo >= 40 ? 0.10 : 0;
  dano *= (1 + bonusVinculo);

  return Math.floor(dano);
}

/**
 * Calcula redução de dano baseado em defesa
 * Fórmula: dano_final = dano * (1 - (defesa / (defesa + 100)))
 *
 * @param {number} dano - Dano antes da redução
 * @param {number} defesa - Valor de defesa do alvo
 * @returns {number} Dano após aplicar defesa
 */
export function aplicarDefesa(dano, defesa) {
  const reducao = defesa / (defesa + 100);
  return Math.floor(dano * (1 - reducao));
}

/**
 * Calcula dano crítico
 *
 * @param {number} dano - Dano base
 * @param {number} chanceCritico - Chance de crítico (0-100)
 * @param {number} multiplicadorCritico - Multiplicador crítico (padrão 1.5)
 * @returns {Object} { dano: number, foi_critico: boolean }
 */
export function calcularDanoCritico(dano, chanceCritico = 5, multiplicadorCritico = 1.5) {
  const aleatorio = Math.random() * 100;
  const foi_critico = aleatorio < chanceCritico;

  return {
    dano: foi_critico ? Math.floor(dano * multiplicadorCritico) : dano,
    foi_critico: foi_critico
  };
}

/**
 * Calcula dano com evasão considerada
 *
 * @param {number} dano - Dano calculado
 * @param {number} chanceAcerto - Chance de acerto da habilidade (0-100)
 * @param {number} evasao - Valor de evasão do alvo (0-100)
 * @returns {Object} { dano: number, acertou: boolean, motivo: string }
 */
export function aplicarChanceAcerto(dano, chanceAcerto = 100, evasao = 0) {
  const chanceEfetiva = chanceAcerto - evasao;
  const aleatorio = Math.random() * 100;
  const acertou = aleatorio < Math.max(0, Math.min(100, chanceEfetiva));

  return {
    dano: acertou ? dano : 0,
    acertou: acertou,
    motivo: !acertou ? 'Evadiu o ataque!' : null
  };
}

/**
 * Calcula dano por turno de um efeito de status
 *
 * @param {number} hpMaximo - HP máximo do alvo
 * @param {number} percentualDano - Percentual de dano por turno (ex: 0.05 = 5%)
 * @param {number} duracao - Duração do efeito em turnos
 * @returns {Object} { danoTurno: number, danoBonusTotal: number }
 */
export function calcularDanoEfeito(hpMaximo, percentualDano, duracao) {
  const danoTurno = Math.floor(hpMaximo * percentualDano);
  const danoBonusTotal = danoTurno * duracao;

  return {
    danoTurno: danoTurno,
    danoBonusTotal: danoBonusTotal
  };
}

/**
 * Calcula dano total inclindo efeitos contínuos
 *
 * @param {number} danoDireto - Dano direto da habilidade
 * @param {number} hpMaximoAlvo - HP máximo do alvo
 * @param {Array<Object>} efeitosStatus - Array de efeitos da habilidade
 * @param {Object} efeitosStatusMap - Map com definições de todos os efeitos
 * @returns {Object} { danoDireto: number, danoEfeitos: number, danoTotal: number }
 */
export function calcularDanoTotal(danoDireto, hpMaximoAlvo, efeitosStatus = [], efeitosStatusMap = {}) {
  let danoEfeitos = 0;

  efeitosStatus.forEach(efeitoNome => {
    const efeito = efeitosStatusMap[efeitoNome];
    if (efeito && efeito.dano_por_turno && efeito.duracao_base) {
      const { danoBonusTotal } = calcularDanoEfeito(
        hpMaximoAlvo,
        efeito.dano_por_turno,
        efeito.duracao_base
      );
      danoEfeitos += danoBonusTotal;
    }
  });

  return {
    danoDireto: danoDireto,
    danoEfeitos: danoEfeitos,
    danoTotal: danoDireto + danoEfeitos
  };
}

// Exportação default
export default {
  calcularDanoHabilidade,
  aplicarDefesa,
  calcularDanoCritico,
  aplicarChanceAcerto,
  calcularDanoEfeito,
  calcularDanoTotal
};
