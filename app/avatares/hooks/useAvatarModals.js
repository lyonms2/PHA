import { useState } from 'react';

/**
 * Hook para gerenciar estados de modais da página de avatares
 * @returns {Object} Estados e setters dos modais
 */
export function useAvatarModals() {
  const [modalConfirmacao, setModalConfirmacao] = useState(null);
  const [modalLevelUp, setModalLevelUp] = useState(null);
  const [modalSacrificar, setModalSacrificar] = useState(null);
  const [modalVender, setModalVender] = useState(null);
  const [precoVendaMoedas, setPrecoVendaMoedas] = useState('');
  const [precoVendaFragmentos, setPrecoVendaFragmentos] = useState('');

  return {
    // Estados
    modalConfirmacao,
    modalLevelUp,
    modalSacrificar,
    modalVender,
    precoVendaMoedas,
    precoVendaFragmentos,
    // Setters
    setModalConfirmacao,
    setModalLevelUp,
    setModalSacrificar,
    setModalVender,
    setPrecoVendaMoedas,
    setPrecoVendaFragmentos
  };
}
