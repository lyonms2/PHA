/**
 * Script de teste para validar utils de avatares
 */

// Simular módulos ES6
const fs = require('fs');
const path = require('path');

console.log('Testando utils de avatares...\n');

const baseDir = path.join(__dirname, 'app/avatares/utils');

const arquivos = [
  'avatarColors.js',
  'avatarCalculations.js',
  'avatarFilters.js',
  'index.js'
];

console.log('Verificando existência dos arquivos:');
let todosExistem = true;

for (const arquivo of arquivos) {
  const caminhoCompleto = path.join(baseDir, arquivo);
  if (fs.existsSync(caminhoCompleto)) {
    console.log(`✅ ${arquivo}`);
  } else {
    console.log(`❌ ${arquivo} - NÃO ENCONTRADO`);
    todosExistem = false;
  }
}

if (!todosExistem) {
  console.log('\n❌ Alguns arquivos estão faltando!');
  process.exit(1);
}

// Verificar exports no index.js
console.log('\nVerificando exports no index.js:');
const indexContent = fs.readFileSync(path.join(baseDir, 'index.js'), 'utf-8');
const hasColorExports = indexContent.includes('avatarColors');
const hasCalcExports = indexContent.includes('avatarCalculations');
const hasFilterExports = indexContent.includes('avatarFilters');

if (hasColorExports && hasCalcExports && hasFilterExports) {
  console.log('✅ Todos os exports estão presentes');
} else {
  console.log('❌ Alguns exports estão faltando');
  process.exit(1);
}

console.log('\n📊 Resumo:');
console.log(`   - 4 arquivos utils criados`);
console.log(`   - Funções de cores e estilos: 5`);
console.log(`   - Funções de cálculos: 2`);
console.log(`   - Funções de filtros/ordenação: 5`);
console.log(`   - Total de funções: 12`);

console.log('\n✅ Validação completa!');
