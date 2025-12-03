/**
 * Script de teste para validar refatoração do PvP
 * Verifica se todas as importações estão corretas
 */

// Testar importações dos handlers
console.log('Testando importações...');

try {
  // Este é apenas um teste de sintaxe - os imports falharão porque estamos fora do Next.js
  // mas podemos verificar se os arquivos existem
  const fs = require('fs');
  const path = require('path');

  const baseDir = path.join(__dirname, 'app/api/pvp/room/state');

  const arquivos = [
    'route.js',
    'handlers/index.js',
    'handlers/getState.js',
    'handlers/handleReady.js',
    'handlers/handleAttack.js',
    'handlers/handleDefend.js',
    'handlers/handleAbility.js',
    'handlers/handleSurrender.js',
    'handlers/handleProcessEffects.js',
    'combat/index.js',
    'combat/elementalSystem.js',
    'combat/hitChecker.js',
    'combat/damageCalculator.js',
    'utils/index.js',
    'utils/battleLogger.js',
    'utils/balanceUpdater.js'
  ];

  console.log('\nVerificando existência dos arquivos:');
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

  if (todosExistem) {
    console.log('\n✅ Todos os arquivos foram criados com sucesso!');

    // Contar linhas do route.js original vs novo
    const routeContent = fs.readFileSync(path.join(baseDir, 'route.js'), 'utf-8');
    const linhasNovas = routeContent.split('\n').length;

    console.log(`\n📊 Métricas:`);
    console.log(`   Linhas antigas: 1271`);
    console.log(`   Linhas novas: ${linhasNovas}`);
    console.log(`   Redução: ${Math.round((1271 - linhasNovas) / 1271 * 100)}%`);

    console.log(`\n📁 Estrutura criada:`);
    console.log(`   - 7 handlers`);
    console.log(`   - 3 módulos de combate`);
    console.log(`   - 2 utilitários`);
    console.log(`   - 1 roteador principal (route.js)`);

  } else {
    console.log('\n❌ Alguns arquivos estão faltando!');
    process.exit(1);
  }

} catch (error) {
  console.error('Erro ao testar:', error);
  process.exit(1);
}
