import { useState } from 'react';

/**
 * Hook para gerenciar estados de filtros e ordenação
 * @returns {Object} Estados de filtros e setters
 */
export function useAvatarFilters() {
  const [filtroRaridade, setFiltroRaridade] = useState('Todos');
  const [filtroElemento, setFiltroElemento] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [ordenacao, setOrdenacao] = useState('nivel_desc');

  return {
    // Estados
    filtroRaridade,
    filtroElemento,
    filtroStatus,
    ordenacao,
    // Setters
    setFiltroRaridade,
    setFiltroElemento,
    setFiltroStatus,
    setOrdenacao
  };
}
