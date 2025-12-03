// ==================== HABILIDADES COOPERATIVAS ====================
// Arquivo: /app/avatares/sistemas/constants/cooperativeAbilities.js

/**
 * Habilidades Cooperativas (requerem vínculo alto)
 */
export const HABILIDADES_COOPERATIVAS = {
  COMBO_BASICO: {
    nome: 'Ataque Sincronizado',
    descricao: 'Caçador e Avatar atacam em perfeita sincronia',
    vinculo_minimo: 40,
    tipo: 'combo',
    multiplicador_dano: 1.5,
    custo_energia: 50
  },

  PROTECAO_MUTUA: {
    nome: 'Proteção Mútua',
    descricao: 'Avatar protege o caçador, dividindo o dano recebido',
    vinculo_minimo: 60,
    tipo: 'especial',
    divisao_dano: 0.5, // 50% do dano pro avatar
    duracao: 3,
    custo_energia: 60
  },

  FUSAO_ELEMENTAL: {
    nome: 'Fusão Elemental',
    descricao: 'Caçador canaliza o poder elemental do avatar',
    vinculo_minimo: 80,
    tipo: 'ultimate',
    multiplicador_dano: 3.0,
    bonus_todos_stats: 0.50,
    duracao: 2,
    custo_energia: 100
  }
};

/**
 * Tabela de referência do sistema de habilidades
 */
export const TABELA_HABILIDADES = `
╔═══════════════════════════════════════════════════════════════╗
║                    SISTEMA DE HABILIDADES                     ║
╠═══════════════════════════════════════════════════════════════╣
║ TIPOS DE HABILIDADES:                                         ║
║   Ofensiva: Causa dano direto                                 ║
║   Defensiva: Protege e reduz dano                             ║
║   Suporte: Cura e buffa aliados                               ║
║   Controle: Impede/dificulta ações inimigas                   ║
║   Passiva: Sempre ativa                                       ║
╠═══════════════════════════════════════════════════════════════╣
║ RARIDADE DE HABILIDADES:                                      ║
║   Básica: Disponível desde o início                           ║
║   Avançada: Desbloqueada no nível 10-15                      ║
║   Ultimate: Requer nível 25+ e vínculo 60+                   ║
╠═══════════════════════════════════════════════════════════════╣
║ EVOLUÇÃO:                                                      ║
║   Habilidades básicas evoluem no nível 10                     ║
║   Habilidades avançadas evoluem no nível 25                   ║
║   Ultimates não evoluem (já são máximas)                      ║
╠═══════════════════════════════════════════════════════════════╣
║ HABILIDADES COOPERATIVAS:                                     ║
║   Combo (Vínculo 40+): +50% dano                             ║
║   Especial (Vínculo 60+): Proteção mútua                     ║
║   Ultimate (Vínculo 80+): +200% dano, fusão completa         ║
╚═══════════════════════════════════════════════════════════════╝
`;
