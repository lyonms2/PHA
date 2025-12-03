/**
 * Funções auxiliares para cálculos de avatares
 * (XP, nível, progresso, etc)
 */

/**
 * Calcula XP necessário para alcançar o próximo nível
 * @param {number} nivel - Nível atual do avatar
 * @returns {number} XP necessário
 */
export function calcularXPNecessario(nivel) {
  return nivel * 100; // 100 XP por nível
}

/**
 * Calcula percentual de progresso de XP
 * @param {number} xpAtual - XP atual do avatar
 * @param {number} nivel - Nível atual do avatar
 * @returns {number} Percentual (0-100)
 */
export function calcularProgressoXP(xpAtual, nivel) {
  const xpNecessario = calcularXPNecessario(nivel);
  return Math.min((xpAtual / xpNecessario) * 100, 100);
}
