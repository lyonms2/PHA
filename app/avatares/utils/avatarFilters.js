/**
 * Funções auxiliares para filtrar e ordenar avatares
 */

/**
 * Filtra avatares excluindo os que estão no memorial
 * @param {Array} avatares - Lista de avatares
 * @returns {Array} Avatares filtrados
 */
export function filtrarAvataresSemMemorial(avatares) {
  return avatares.filter(av => {
    // Não mostrar avatares que estão no memorial
    if (!av.vivo && av.marca_morte) return false;
    return true;
  });
}

/**
 * Aplica filtros de raridade, elemento e status
 * @param {Array} avatares - Lista de avatares
 * @param {Object} filtros - Objeto com filtroRaridade, filtroElemento, filtroStatus
 * @returns {Array} Avatares filtrados
 */
export function aplicarFiltros(avatares, { filtroRaridade, filtroElemento, filtroStatus }) {
  let resultado = [...avatares];

  // Filtro de raridade
  if (filtroRaridade !== 'Todos') {
    resultado = resultado.filter(av => av.raridade === filtroRaridade);
  }

  // Filtro de elemento
  if (filtroElemento !== 'Todos') {
    resultado = resultado.filter(av => av.elemento === filtroElemento);
  }

  // Filtro de status
  if (filtroStatus !== 'Todos') {
    if (filtroStatus === 'Vivos') {
      resultado = resultado.filter(av => av.vivo);
    } else if (filtroStatus === 'Mortos') {
      resultado = resultado.filter(av => !av.vivo);
    } else if (filtroStatus === 'Com Marca') {
      resultado = resultado.filter(av => av.marca_morte);
    }
  }

  return resultado;
}

/**
 * Ordena avatares baseado no critério
 * @param {Array} avatares - Lista de avatares
 * @param {string} ordenacao - Critério de ordenação
 * @returns {Array} Avatares ordenados
 */
export function ordenarAvatares(avatares, ordenacao) {
  const resultado = [...avatares];

  resultado.sort((a, b) => {
    switch (ordenacao) {
      case 'nivel_desc':
        return b.nivel - a.nivel;
      case 'nivel_asc':
        return a.nivel - b.nivel;
      case 'nome_asc':
        return a.nome.localeCompare(b.nome);
      case 'raridade': {
        const raridadeOrder = { 'Lendário': 3, 'Raro': 2, 'Comum': 1 };
        return (raridadeOrder[b.raridade] || 0) - (raridadeOrder[a.raridade] || 0);
      }
      default:
        return 0;
    }
  });

  return resultado;
}

/**
 * Conta avatares caídos (no memorial)
 * @param {Array} avatares - Lista de avatares
 * @returns {number} Quantidade de avatares caídos
 */
export function contarAvataresCaidos(avatares) {
  return avatares.filter(av => !av.vivo && av.marca_morte).length;
}

/**
 * Calcula slots de avatares
 * @param {Array} avatares - Lista de avatares
 * @param {number} limite - Limite máximo de avatares (padrão 15)
 * @returns {Object} { usados, disponiveis, percentual }
 */
export function calcularSlots(avatares, limite = 15) {
  // Avatares mortos no memorial não contam
  const avataresConta = avatares.filter(av => !(av.marca_morte && !av.vivo)).length;
  const usados = avataresConta;
  const disponiveis = limite - usados;
  const percentual = (usados / limite) * 100;

  return { usados, disponiveis, percentual };
}
