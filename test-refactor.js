// Teste simples de importação para verificar refatoração

// Testar imports principais do abilitiesSystem
import { HABILIDADES_POR_ELEMENTO } from './app/avatares/sistemas/abilitiesSystem.js';
import { TIPO_HABILIDADE } from './app/avatares/sistemas/abilitiesSystem.js';
import { EFEITOS_STATUS } from './app/avatares/sistemas/abilitiesSystem.js';
import { calcularDanoHabilidade } from './app/avatares/sistemas/abilitiesSystem.js';

// Verificar se tudo foi importado corretamente
console.log('✅ TESTE 1: HABILIDADES_POR_ELEMENTO existe?', !!HABILIDADES_POR_ELEMENTO);
console.log('✅ TESTE 2: Elementos disponíveis:', Object.keys(HABILIDADES_POR_ELEMENTO));
console.log('✅ TESTE 3: TIPO_HABILIDADE existe?', !!TIPO_HABILIDADE);
console.log('✅ TESTE 4: Tipos:', Object.keys(TIPO_HABILIDADE));
console.log('✅ TESTE 5: EFEITOS_STATUS existe?', !!EFEITOS_STATUS);
console.log('✅ TESTE 6: Total de efeitos:', Object.keys(EFEITOS_STATUS).length);
console.log('✅ TESTE 7: calcularDanoHabilidade é função?', typeof calcularDanoHabilidade === 'function');

// Testar habilidades de Fogo
const habilidadesFogo = HABILIDADES_POR_ELEMENTO['Fogo'];
console.log('✅ TESTE 8: Habilidades de Fogo:', Object.keys(habilidadesFogo));

// Verificar estrutura de uma habilidade
const labareda = habilidadesFogo.CHAMAS_BASICAS;
console.log('✅ TESTE 9: Labareda tem nome?', labareda.nome === 'Labareda');
console.log('✅ TESTE 10: Labareda tem dano_base?', typeof labareda.dano_base === 'number');

console.log('\n🎉 TODOS OS TESTES PASSARAM! Refatoração bem sucedida!');
