import { HABILIDADES_POR_ELEMENTO } from '@/app/avatares/sistemas/abilitiesSystem';

/**
 * Atualiza os valores de balanceamento de uma habilidade do avatar
 * com os valores mais recentes do sistema
 *
 * Isso garante que habilidades antigas do banco de dados
 * usem os valores de dano/custo/etc mais recentes do código
 *
 * @param {Object} habilidadeAvatar - Habilidade salva no avatar
 * @param {string} elemento - Elemento do avatar
 * @returns {Object} Habilidade com valores atualizados
 */
export function atualizarBalanceamentoHabilidade(habilidadeAvatar, elemento) {
  if (!habilidadeAvatar || !elemento) return habilidadeAvatar;

  const habilidadesSistema = HABILIDADES_POR_ELEMENTO[elemento];
  if (!habilidadesSistema) return habilidadeAvatar;

  // Procurar a habilidade correspondente no sistema pelo nome
  const habilidadeSistema = Object.values(habilidadesSistema).find(
    h => h.nome === habilidadeAvatar.nome
  );

  if (!habilidadeSistema) return habilidadeAvatar;

  // Mesclar: manter dados do avatar, mas sobrescrever valores de balanceamento do sistema
  return {
    ...habilidadeAvatar,
    tipo: habilidadeSistema.tipo, // CRÍTICO: tipo da habilidade
    custo_energia: habilidadeSistema.custo_energia,
    chance_efeito: habilidadeSistema.chance_efeito,
    duracao_efeito: habilidadeSistema.duracao_efeito,
    dano_base: habilidadeSistema.dano_base,
    multiplicador_stat: habilidadeSistema.multiplicador_stat,
    stat_primario: habilidadeSistema.stat_primario,
    num_golpes: habilidadeSistema.num_golpes,
    efeitos_status: habilidadeSistema.efeitos_status,
    efeitos: habilidadeSistema.efeitos, // Para compatibilidade
    cooldown: habilidadeSistema.cooldown,
    chance_acerto: habilidadeSistema.chance_acerto
  };
}
