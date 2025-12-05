import { useState } from 'react';

/**
 * Hook para gerenciar operações de avatares
 * (carregar, ativar, sacrificar, vender, cancelar venda)
 *
 * @param {Object} user - Objeto do usuário logado
 * @param {Function} setModalConfirmacao - Função para mostrar modal de confirmação
 * @param {Function} setModalLevelUp - Função para mostrar modal de level up
 * @returns {Object} Estados e funções de operações
 */
export function useAvatarOperations(user, setModalConfirmacao, setModalLevelUp) {
  const [avatares, setAvatares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ativando, setAtivando] = useState(false);
  const [sacrificando, setSacrificando] = useState(false);
  const [vendendo, setVendendo] = useState(false);

  /**
   * Carrega avatares do usuário da API
   * Verifica level ups e atualiza localStorage
   */
  const carregarAvatares = async (userId) => {
    try {
      setLoading(true);
      console.log('🔵 [FRONTEND] Chamando API /api/meus-avatares com userId:', userId);
      const response = await fetch(`/api/meus-avatares?userId=${userId}&t=${Date.now()}`);
      console.log('🔵 [FRONTEND] Resposta recebida, status:', response.status);
      const data = await response.json();

      if (response.ok) {
        console.log('🔵 [FRONTEND] Avatares recebidos:', data.avatares?.length || 0);
        // Verificar level ups
        const niveisAnteriores = JSON.parse(localStorage.getItem('avatares_niveis') || '{}');
        const avatarAtivo = data.avatares.find(av => av.ativo && av.vivo);

        if (avatarAtivo && niveisAnteriores[avatarAtivo.id]) {
          const nivelAnterior = niveisAnteriores[avatarAtivo.id];
          const nivelAtual = avatarAtivo.nivel || 1;

          // Se subiu de nível, mostrar modal
          if (nivelAtual > nivelAnterior) {
            setTimeout(() => {
              setModalLevelUp(avatarAtivo);
            }, 500);
          }
        }

        // Atualizar níveis no localStorage
        const novosNiveis = {};
        data.avatares.forEach(av => {
          novosNiveis[av.id] = av.nivel || 1;
        });
        localStorage.setItem('avatares_niveis', JSON.stringify(novosNiveis));

        setAvatares(data.avatares);
      } else {
        console.error("Erro ao carregar avatares:", data.message);
      }
    } catch (error) {
      console.error("Erro ao carregar avatares:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ativa um avatar específico
   */
  const ativarAvatar = async (avatarId, avatarNome) => {
    if (ativando) return;

    setAtivando(true);

    try {
      const response = await fetch("/api/meus-avatares", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, avatarId }),
      });

      const data = await response.json();

      if (response.ok) {
        await carregarAvatares(user.id);
        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `${avatarNome} foi ativado com sucesso!`
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao ativar avatar'
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao ativar avatar:", error);
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Erro de conexão ao ativar avatar'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
    } finally {
      setAtivando(false);
    }
  };

  /**
   * Sacrifica um avatar (envia ao memorial)
   */
  const sacrificarAvatar = async (avatar, setModalSacrificar) => {
    setSacrificando(true);
    try {
      const response = await fetch("/api/sacrificar-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatar.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalSacrificar(null);
        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `${avatar.nome} foi enviado ao Memorial...`
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
        await carregarAvatares(user.id);
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao sacrificar avatar'
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao sacrificar avatar:", error);
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Erro de conexão'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
    } finally {
      setSacrificando(false);
    }
  };

  /**
   * Coloca um avatar à venda no mercado
   */
  const venderAvatar = async (modalVender, precoMoedas, precoFragmentos, setModalVender, setPrecoVendaMoedas, setPrecoVendaFragmentos) => {
    const moedas = parseInt(precoMoedas) || 0;
    const fragmentos = parseInt(precoFragmentos) || 0;

    // Validar que pelo menos um preço foi definido
    if (moedas === 0 && fragmentos === 0) {
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Defina um preço em moedas e/ou fragmentos'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
      return;
    }

    // Validar limites
    if (moedas < 0 || moedas > 10000) {
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Moedas devem estar entre 0 e 10.000'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
      return;
    }

    if (fragmentos < 0 || fragmentos > 500) {
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Fragmentos devem estar entre 0 e 500'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
      return;
    }

    setVendendo(true);
    try {
      const response = await fetch("/api/mercado/vender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          avatarId: modalVender.id,
          precoMoedas: moedas,
          precoFragmentos: fragmentos
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalVender(null);
        setPrecoVendaMoedas('');
        setPrecoVendaFragmentos('');

        const precoTexto = [];
        if (moedas > 0) precoTexto.push(`${moedas} 💰`);
        if (fragmentos > 0) precoTexto.push(`${fragmentos} 💎`);

        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `${modalVender.nome} colocado à venda por ${precoTexto.join(' + ')}!`
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
        await carregarAvatares(user.id);
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao colocar avatar à venda'
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao vender avatar:", error);
      setModalConfirmacao({
        tipo: 'erro',
        mensagem: 'Erro de conexão'
      });
      setTimeout(() => setModalConfirmacao(null), 3000);
    } finally {
      setVendendo(false);
    }
  };

  /**
   * Cancela a venda de um avatar no mercado
   */
  const cancelarVenda = async (avatar) => {
    try {
      const response = await fetch("/api/mercado/cancelar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          avatarId: avatar.id
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalConfirmacao({
          tipo: 'sucesso',
          mensagem: `Venda de ${avatar.nome} cancelada!`
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
        await carregarAvatares(user.id);
      } else {
        setModalConfirmacao({
          tipo: 'erro',
          mensagem: data.message || 'Erro ao cancelar venda'
        });
        setTimeout(() => setModalConfirmacao(null), 3000);
      }
    } catch (error) {
      console.error("Erro ao cancelar venda:", error);
    }
  };

  return {
    // Estados
    avatares,
    loading,
    ativando,
    sacrificando,
    vendendo,
    // Funções
    carregarAvatares,
    ativarAvatar,
    sacrificarAvatar,
    venderAvatar,
    cancelarVenda
  };
}
