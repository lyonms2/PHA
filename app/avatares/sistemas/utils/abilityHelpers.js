// ==================== UTILITÁRIOS DE HABILIDADES ====================
// Arquivo: /app/avatares/sistemas/utils/abilityHelpers.js
// Funções auxiliares relacionadas a seleção e gestão de habilidades

import { HABILIDADES_POR_ELEMENTO, RARIDADE_HABILIDADE, EFEITOS_STATUS } from '../abilitiesSystem.js';

/**
 * Seleciona habilidades iniciais para um novo avatar
 * @param {string} elemento - Elemento do avatar
 * @param {string} raridade - Raridade do avatar (Comum, Raro, Lendário)
 * @returns {Array} Lista de habilidades iniciais
 */
export function selecionarHabilidadesIniciais(elemento, raridade) {
  const habilidadesElemento = HABILIDADES_POR_ELEMENTO[elemento];

  if (!habilidadesElemento) {
    return [];
  }

  const habilidadesDisponiveis = Object.values(habilidadesElemento)
    .filter(hab => hab.nivel_minimo === 1 || hab.raridade === RARIDADE_HABILIDADE.BASICA);

  let quantidade = 1; // Comum = 1 habilidade
  if (raridade === 'Raro') quantidade = 2;
  if (raridade === 'Lendário') quantidade = 3;

  // Sempre incluir a primeira habilidade (básica)
  const selecionadas = [habilidadesDisponiveis[0]];

  // Adicionar habilidades aleatórias adicionais
  const restantes = habilidadesDisponiveis.slice(1);
  while (selecionadas.length < quantidade && restantes.length > 0) {
    const index = Math.floor(Math.random() * restantes.length);
    selecionadas.push(restantes[index]);
    restantes.splice(index, 1);
  }

  return selecionadas;
}

/**
 * Retorna todas as habilidades disponíveis para um elemento e nível
 * @param {string} elemento - Elemento do avatar
 * @param {number} nivel - Nível do avatar
 * @param {number} vinculo - Vínculo do avatar
 * @returns {Array} Habilidades disponíveis
 */
export function getHabilidadesDisponiveis(elemento, nivel, vinculo) {
  const habilidadesElemento = HABILIDADES_POR_ELEMENTO[elemento];

  if (!habilidadesElemento) {
    return [];
  }

  return Object.values(habilidadesElemento).filter(hab =>
    hab.nivel_minimo <= nivel && hab.vinculo_minimo <= vinculo
  );
}

/**
 * Verifica se uma habilidade pode evoluir
 * @param {Object} habilidade - Habilidade atual
 * @param {number} nivel - Nível do avatar
 * @returns {Object|null} Habilidade evoluída ou null
 */
export function podeEvoluirHabilidade(habilidade, nivel) {
  if (!habilidade.evolui_para || !habilidade.nivel_evolucao) {
    return null;
  }

  if (nivel < habilidade.nivel_evolucao) {
    return null;
  }

  // Buscar habilidade evoluída
  const elemento = habilidade.elemento;
  const habilidadesElemento = HABILIDADES_POR_ELEMENTO[elemento];

  const evoluida = Object.values(habilidadesElemento).find(
    hab => hab.nome === habilidade.evolui_para
  );

  return evoluida || null;
}

/**
 * Gera descrição completa de uma habilidade
 * @param {Object} habilidade - Habilidade
 * @param {Object} stats - Stats do avatar (opcional)
 * @param {number} nivel - Nível do avatar (opcional)
 * @param {Function} calcularDanoHabilidade - Função para calcular dano (importada do damageCalculator)
 * @returns {string} Descrição formatada
 */
export function gerarDescricaoCompleta(habilidade, stats = null, nivel = 1, calcularDanoHabilidade = null) {
  let descricao = `${habilidade.nome} (${habilidade.tipo})\n`;
  descricao += `${habilidade.descricao}\n\n`;

  descricao += `⚡ Custo de Energia: ${habilidade.custo_energia}\n`;
  descricao += `⏱️ Cooldown: ${habilidade.cooldown} turno(s)\n`;

  if (stats && calcularDanoHabilidade) {
    const dano = calcularDanoHabilidade(habilidade, stats, nivel);
    if (dano > 0) {
      descricao += `💥 Dano Estimado: ${dano}\n`;
    } else if (dano < 0) {
      descricao += `💚 Cura Estimada: ${Math.abs(dano)}\n`;
    }
  }

  if (habilidade.efeitos_status.length > 0) {
    descricao += `\n🎯 Efeitos:\n`;
    habilidade.efeitos_status.forEach(ef => {
      const efeitoInfo = EFEITOS_STATUS[ef];
      if (efeitoInfo) {
        descricao += `  ${efeitoInfo.icone} ${efeitoInfo.nome}\n`;
      }
    });
  }

  if (habilidade.evolui_para) {
    descricao += `\n⬆️ Evolui para: ${habilidade.evolui_para} (Nível ${habilidade.nivel_evolucao})\n`;
  }

  return descricao;
}

/**
 * Verifica todos os requisitos de uma habilidade
 * @param {Object} avatar - Avatar que tentará usar a habilidade
 * @param {Object} habilidade - Habilidade a verificar
 * @returns {Object} { valido: boolean, erros: Array<string> }
 */
export function verificarRequisitosHabilidade(avatar, habilidade) {
  const erros = [];

  // Verificar nível
  if (avatar.nivel < habilidade.nivel_minimo) {
    erros.push(`Requer nível ${habilidade.nivel_minimo} (você tem ${avatar.nivel})`);
  }

  // Verificar vínculo
  if ((avatar.vinculo || 0) < habilidade.vinculo_minimo) {
    erros.push(`Requer vínculo ${habilidade.vinculo_minimo} (você tem ${avatar.vinculo || 0})`);
  }

  // Verificar raridade
  if (habilidade.raridade === RARIDADE_HABILIDADE.ULTIMATE && (avatar.vinculo || 0) < 60) {
    erros.push('Habilidades Ultimate requerem vínculo mínimo de 60');
  }

  return {
    valido: erros.length === 0,
    erros: erros
  };
}

// Exportação default
export default {
  selecionarHabilidadesIniciais,
  getHabilidadesDisponiveis,
  podeEvoluirHabilidade,
  gerarDescricaoCompleta,
  verificarRequisitosHabilidade
};
