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

  // ==================== SISTEMA DE HABILIDADES PROGRESSIVO ====================
  // Comum: 2 habilidades (1 ataque básico + 1 defesa/suporte)
  // Raro: 3 habilidades (1 básico + 1 defesa/suporte + 1 ataque avançado)
  // Lendário: 4 habilidades (todas)

  const todasHabilidades = Object.values(habilidadesElemento);

  // Categorizar habilidades por tipo/raridade
  const habilidadesBasicas = todasHabilidades.filter(
    hab => hab.raridade === RARIDADE_HABILIDADE.BASICA || hab.tipo === 'Ataque' && hab.nivel_minimo === 1
  );
  const habilidadesDefesaSuporte = todasHabilidades.filter(
    hab => hab.tipo === 'Defesa' || hab.tipo === 'Suporte' || hab.tipo === 'Cura'
  );
  const habilidadesAvancadas = todasHabilidades.filter(
    hab => hab.raridade === RARIDADE_HABILIDADE.AVANCADA ||
           (hab.tipo === 'Ataque' && hab.nivel_minimo > 1 && hab.raridade !== RARIDADE_HABILIDADE.ULTIMATE)
  );
  const habilidadesUltimate = todasHabilidades.filter(
    hab => hab.raridade === RARIDADE_HABILIDADE.ULTIMATE
  );

  const selecionadas = [];

  // Garantir pelo menos uma habilidade básica de ataque
  if (habilidadesBasicas.length > 0) {
    selecionadas.push(habilidadesBasicas[0]);
  }

  // COMUM: 2 habilidades (básico + defesa/suporte)
  if (raridade === 'Comum') {
    if (habilidadesDefesaSuporte.length > 0) {
      const index = Math.floor(Math.random() * habilidadesDefesaSuporte.length);
      selecionadas.push(habilidadesDefesaSuporte[index]);
    }
    console.log(`✅ Avatar ${raridade} de ${elemento} recebeu 2 habilidades (básico + defesa/suporte)`);
  }

  // RARO: 3 habilidades (básico + defesa/suporte + avançado)
  else if (raridade === 'Raro') {
    if (habilidadesDefesaSuporte.length > 0) {
      const index = Math.floor(Math.random() * habilidadesDefesaSuporte.length);
      selecionadas.push(habilidadesDefesaSuporte[index]);
    }
    if (habilidadesAvancadas.length > 0) {
      const index = Math.floor(Math.random() * habilidadesAvancadas.length);
      selecionadas.push(habilidadesAvancadas[index]);
    }
    console.log(`✅ Avatar ${raridade} de ${elemento} recebeu 3 habilidades (básico + defesa + avançado)`);
  }

  // LENDÁRIO: 4 habilidades (todas)
  else if (raridade === 'Lendário') {
    if (habilidadesDefesaSuporte.length > 0) {
      const index = Math.floor(Math.random() * habilidadesDefesaSuporte.length);
      selecionadas.push(habilidadesDefesaSuporte[index]);
    }
    if (habilidadesAvancadas.length > 0) {
      const index = Math.floor(Math.random() * habilidadesAvancadas.length);
      selecionadas.push(habilidadesAvancadas[index]);
    }
    if (habilidadesUltimate.length > 0) {
      const index = Math.floor(Math.random() * habilidadesUltimate.length);
      selecionadas.push(habilidadesUltimate[index]);
    }
    console.log(`✅ Avatar ${raridade} de ${elemento} recebeu 4 habilidades (todas as categorias)`);
  }

  // Se não conseguiu preencher (sistema antigo de 4 habilidades), completar com aleatórias
  if (selecionadas.length < 2 && raridade === 'Comum') {
    while (selecionadas.length < 2 && todasHabilidades.length > selecionadas.length) {
      const disponiveis = todasHabilidades.filter(h => !selecionadas.includes(h));
      if (disponiveis.length > 0) {
        const index = Math.floor(Math.random() * disponiveis.length);
        selecionadas.push(disponiveis[index]);
      } else break;
    }
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
