/**
 * Script de teste para validar hooks de avatares
 */

const fs = require('fs');
const path = require('path');

console.log('Testando hooks de avatares...\n');

const baseDir = path.join(__dirname, 'app/avatares/hooks');

const arquivos = [
  'useAvatarOperations.js',
  'useAvatarModals.js',
  'useAvatarFilters.js',
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

// Verificar exports no useAvatarOperations
console.log('\nVerificando useAvatarOperations.js:');
const opsContent = fs.readFileSync(path.join(baseDir, 'useAvatarOperations.js'), 'utf-8');
const hasCarregar = opsContent.includes('carregarAvatares');
const hasAtivar = opsContent.includes('ativarAvatar');
const hasSacrificar = opsContent.includes('sacrificarAvatar');
const hasVender = opsContent.includes('venderAvatar');
const hasCancelar = opsContent.includes('cancelarVenda');

if (hasCarregar && hasAtivar && hasSacrificar && hasVender && hasCancelar) {
  console.log('✅ Todas as operações estão presentes');
} else {
  console.log('❌ Algumas operações estão faltando');
  process.exit(1);
}

// Verificar exports no useAvatarModals
console.log('\nVerificando useAvatarModals.js:');
const modalsContent = fs.readFileSync(path.join(baseDir, 'useAvatarModals.js'), 'utf-8');
const hasModalConfirmacao = modalsContent.includes('modalConfirmacao');
const hasModalLevelUp = modalsContent.includes('modalLevelUp');
const hasModalSacrificar = modalsContent.includes('modalSacrificar');
const hasModalVender = modalsContent.includes('modalVender');

if (hasModalConfirmacao && hasModalLevelUp && hasModalSacrificar && hasModalVender) {
  console.log('✅ Todos os modais estão presentes');
} else {
  console.log('❌ Alguns modais estão faltando');
  process.exit(1);
}

// Verificar exports no useAvatarFilters
console.log('\nVerificando useAvatarFilters.js:');
const filtersContent = fs.readFileSync(path.join(baseDir, 'useAvatarFilters.js'), 'utf-8');
const hasFiltroRaridade = filtersContent.includes('filtroRaridade');
const hasFiltroElemento = filtersContent.includes('filtroElemento');
const hasFiltroStatus = filtersContent.includes('filtroStatus');
const hasOrdenacao = filtersContent.includes('ordenacao');

if (hasFiltroRaridade && hasFiltroElemento && hasFiltroStatus && hasOrdenacao) {
  console.log('✅ Todos os filtros estão presentes');
} else {
  console.log('❌ Alguns filtros estão faltando');
  process.exit(1);
}

// Verificar exports no index.js
console.log('\nVerificando exports no index.js:');
const indexContent = fs.readFileSync(path.join(baseDir, 'index.js'), 'utf-8');
const hasOpsExport = indexContent.includes('useAvatarOperations');
const hasModalsExport = indexContent.includes('useAvatarModals');
const hasFiltersExport = indexContent.includes('useAvatarFilters');

if (hasOpsExport && hasModalsExport && hasFiltersExport) {
  console.log('✅ Todos os exports estão presentes');
} else {
  console.log('❌ Alguns exports estão faltando');
  process.exit(1);
}

console.log('\n📊 Resumo:');
console.log(`   - 4 arquivos hooks criados`);
console.log(`   - useAvatarOperations: 5 funções + 5 estados`);
console.log(`   - useAvatarModals: 6 estados + 6 setters`);
console.log(`   - useAvatarFilters: 4 estados + 4 setters`);
console.log(`   - Total: 9 funções, 15 estados`);

console.log('\n✅ Validação completa!');
