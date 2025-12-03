// ==================== ÍNDICE DE UTILITÁRIOS DE HABILIDADES ====================
// Arquivo: /app/avatares/sistemas/utils/index.js
// Centraliza exportações de todos os utilitários

// Importar e exportar funções de seleção e gestão
export {
  selecionarHabilidadesIniciais,
  getHabilidadesDisponiveis,
  podeEvoluirHabilidade,
  gerarDescricaoCompleta,
  verificarRequisitosHabilidade
} from './abilityHelpers.js';

// Importar e exportar funções de cálculo de dano
export {
  calcularDanoHabilidade,
  aplicarDefesa,
  calcularDanoCritico,
  aplicarChanceAcerto,
  calcularDanoEfeito,
  calcularDanoTotal
} from './damageCalculator.js';

// Importar e exportar funções de validação
export {
  podeUsarHabilidade,
  validarCustoEnergia,
  validarCooldown,
  validarAlvoHabilidade,
  validacaoCompleta,
  obterDetalhesValidacao
} from './abilityValidator.js';

// Exportação de índices de submódulos
export * as abilityHelpers from './abilityHelpers.js';
export * as damageCalculator from './damageCalculator.js';
export * as abilityValidator from './abilityValidator.js';
