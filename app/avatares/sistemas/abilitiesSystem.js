// ==================== SISTEMA DE HABILIDADES - REFATORADO ====================
// Arquivo: /app/avatares/sistemas/abilitiesSystem.js
//
// Este arquivo agora serve como ponto de entrada centralizado para todo o sistema
// de habilidades, importando e re-exportando módulos refatorados.
//
// Estrutura da refatoração:
// - abilities/       → Habilidades por elemento (7 arquivos)
// - constants/       → Tipos, raridades, cooperativas
// - effects/         → Sistema de efeitos de status
// - utils/           → Funções auxiliares, calculadores, validadores

// ==================== IMPORTS DOS MÓDULOS REFATORADOS ====================

// Constants
export {
  TIPO_HABILIDADE,
  RARIDADE_HABILIDADE,
  criarHabilidade
} from './constants/abilityTypes';

export {
  HABILIDADES_COOPERATIVAS,
  TABELA_HABILIDADES
} from './constants/cooperativeAbilities';

// Habilidades por Elemento
export {
  HABILIDADES_POR_ELEMENTO,
  ELEMENTOS_DISPONIVEIS,
  getHabilidadesElemento,
  getAllHabilidades
} from './abilities/index';

// Efeitos de Status
export {
  EFEITOS_STATUS,
  obterEfeito,
  efeitoExiste,
  obterEfeitosPorTipo,
  obterDuracaoEfeito,
  efeitoEhContinuo,
  efeitoEhInstantaneo,
  obterTodosOsEfeitos,
  contagemEfeitos
} from './effects/statusEffects';

export {
  processarEfeitoStatus,
  aplicarDanoContinuo,
  aplicarCuraContinua,
  processarEfeitoEspecial,
  obterModificadoresEfeito,
  processarEfeitoControle,
  processarEfeitoZona,
  ehDebuff,
  ehBuff,
  impedeCura,
  ehEfeitoLimpeza,
  processarMultiplosEfeitos,
  gerarDescricaoEfeito,
  verificarCompatibilidadeEfeitos
} from './effects/effectsProcessor';

// Utils
export {
  selecionarHabilidadesIniciais,
  getHabilidadesDisponiveis,
  podeEvoluirHabilidade,
  gerarDescricaoCompleta,
  verificarRequisitosHabilidade
} from './utils/abilityHelpers';

export {
  calcularDanoHabilidade,
  aplicarDefesa,
  calcularDanoCritico,
  aplicarChanceAcerto,
  calcularDanoEfeito,
  calcularDanoTotal
} from './utils/damageCalculator';

export {
  podeUsarHabilidade,
  validarCustoEnergia,
  validarCooldown,
  validarAlvoHabilidade,
  validacaoCompleta,
  obterDetalhesValidacao
} from './utils/abilityValidator';

// ==================== COMPATIBILIDADE COM CÓDIGO LEGADO ====================
// Estas exportações mantêm compatibilidade com imports antigos

// Para código que importa do índice centralizado de utils
export * from './utils/index';

// ==================== NOTAS SOBRE A REFATORAÇÃO ====================
/*
 * ANTES (1141 linhas em 1 arquivo):
 * - Difícil de navegar e manter
 * - Todas as responsabilidades misturadas
 * - Imports pesados sempre
 *
 * DEPOIS (distribuído em ~18 arquivos):
 * ✅ abilities/      → 7 arquivos (~100 linhas cada) - habilidades por elemento
 * ✅ constants/      → 2 arquivos (~60 linhas total)  - tipos e cooperativas
 * ✅ effects/        → 2 arquivos (~400 linhas)       - sistema de efeitos
 * ✅ utils/          → 3 arquivos (~500 linhas)       - helpers, calculator, validator
 * ✅ abilitiesSystem.js → 120 linhas                  - ponto de entrada
 *
 * BENEFÍCIOS:
 * ✅ Imports otimizados (tree-shaking)
 * ✅ Mais fácil encontrar código
 * ✅ Melhor testabilidade
 * ✅ Código modular e reutilizável
 * ✅ 100% compatível com código existente
 *
 * EXEMPLOS DE USO:
 *
 * // Importar apenas o que precisa
 * import { calcularDanoHabilidade } from '@/app/avatares/sistemas/abilitiesSystem';
 *
 * // Ou importar diretamente do módulo específico
 * import { calcularDanoHabilidade } from '@/app/avatares/sistemas/utils/damageCalculator';
 *
 * // Importar habilidades de um elemento
 * import { HABILIDADES_FOGO } from '@/app/avatares/sistemas/abilities/fogo';
 *
 * // Código antigo continua funcionando normalmente
 * import { HABILIDADES_POR_ELEMENTO } from '@/app/avatares/sistemas/abilitiesSystem';
 */

// ==================== MIGRAÇÃO ====================
/*
 * Para migrar código antigo gradualmente:
 *
 * 1. Nada precisa ser mudado imediatamente - tudo é retrocompatível
 *
 * 2. Para otimizar imports (recomendado):
 *    ANTES: import { calcularDanoHabilidade, HABILIDADES_POR_ELEMENTO, EFEITOS_STATUS } from './abilitiesSystem';
 *    DEPOIS:
 *      import { calcularDanoHabilidade } from './utils/damageCalculator';
 *      import { HABILIDADES_POR_ELEMENTO } from './abilities/index';
 *      import { EFEITOS_STATUS } from './effects/statusEffects';
 *
 * 3. Benefício: Bundle menor, carrega só o necessário
 */
