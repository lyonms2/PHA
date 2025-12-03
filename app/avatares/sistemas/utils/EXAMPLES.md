# Exemplos Práticos de Uso dos Utilitários

Demonstrações reais de como usar cada módulo do sistema de habilidades refatorado.

---

## 1. Criar Avatar com Habilidades Iniciais

### Objetivo: Preparar um novo avatar com habilidades apropriadas para sua raridade

```javascript
import {
  selecionarHabilidadesIniciais,
  verificarRequisitosHabilidade
} from './utils/abilityHelpers.js';

function criarNovoAvatar(elemento, raridade, nivel = 1, vinculo = 0) {
  // Selecionar habilidades iniciais baseado no elemento e raridade
  const habilidades = selecionarHabilidadesIniciais(elemento, raridade);

  const avatar = {
    nome: 'Novo Avatar',
    elemento,
    raridade,
    nivel,
    vinculo,
    stats: {
      forca: 30,
      resistencia: 25,
      agilidade: 28,
      foco: 32
    },
    habilidades,
    energia: 100,
    hp: 100
  };

  console.log(`Avatar criado com ${habilidades.length} habilidades iniciais:`);
  habilidades.forEach((hab, i) => {
    console.log(`  ${i + 1}. ${hab.nome} - ${hab.descricao}`);
  });

  return avatar;
}

// Uso
const avatarRaro = criarNovoAvatar('Fogo', 'Raro', 1, 0);
```

---

## 2. Usar Habilidade em Combate

### Objetivo: Validar e executar uma habilidade durante combate

```javascript
import {
  calcularDanoHabilidade,
  aplicarDefesa,
  calcularDanoCritico
} from './utils/damageCalculator.js';

import {
  podeUsarHabilidade,
  validarCooldown,
  validarAlvoHabilidade
} from './utils/abilityValidator.js';

function usarHabilidade(usuario, alvo, habilidade, turnoCooldown) {
  // Validar se pode usar
  const validacao = podeUsarHabilidade(usuario, habilidade, usuario.energia);
  if (!validacao.pode_usar) {
    return {
      sucesso: false,
      mensagem: validacao.motivo
    };
  }

  // Validar cooldown
  const cooldown = validarCooldown(turnoCooldown);
  if (!cooldown.pode_usar) {
    return {
      sucesso: false,
      mensagem: cooldown.mensagem
    };
  }

  // Validar alvo
  const validacaoAlvo = validarAlvoHabilidade(
    habilidade,
    alvo,
    usuario,
    [], // aliados (vazio neste exemplo)
    [alvo] // inimigos
  );
  if (!validacaoAlvo.valido) {
    return {
      sucesso: false,
      mensagem: validacaoAlvo.motivo
    };
  }

  // Calcular dano
  let dano = calcularDanoHabilidade(
    habilidade,
    usuario.stats,
    usuario.nivel,
    usuario.vinculo
  );

  // Aplicar defesa do alvo
  dano = aplicarDefesa(dano, alvo.defesa || 10);

  // Chance de crítico (5% de chance, 1.5x multiplicador)
  const { dano: danoFinal, foi_critico } = calcularDanoCritico(dano, 5, 1.5);

  // Aplicar dano
  alvo.hp -= danoFinal;

  // Consumir energia
  usuario.energia -= habilidade.custo_energia;

  return {
    sucesso: true,
    mensagem: `${usuario.nome} usou ${habilidade.nome}!${foi_critico ? ' CRÍTICO!' : ''}`,
    dano: danoFinal,
    foi_critico,
    novaEnergia: usuario.energia,
    novaVidaAlvo: Math.max(0, alvo.hp)
  };
}

// Uso
const usuario = {
  nome: 'Avatar Fogo',
  nivel: 10,
  vinculo: 50,
  energia: 80,
  stats: { forca: 45, resistencia: 30, agilidade: 35, foco: 40 }
};

const alvo = {
  nome: 'Inimigo',
  hp: 100,
  defesa: 15,
  stats: { forca: 40, resistencia: 35, agilidade: 30, foco: 35 }
};

const habilidade = {
  nome: 'Explosão Ígnea',
  dano_base: 100,
  multiplicador_stat: 1.8,
  stat_primario: 'forca',
  custo_energia: 40,
  cooldown: 2,
  nivel_minimo: 10,
  vinculo_minimo: 0
};

const resultado = usarHabilidade(usuario, alvo, habilidade, 0);
console.log(resultado.mensagem);
console.log(`Dano: ${resultado.dano}`);
```

---

## 3. Verificar Disponibilidade de Habilidades

### Objetivo: Listar habilidades disponíveis para um avatar subir de nível

```javascript
import {
  getHabilidadesDisponiveis,
  podeEvoluirHabilidade
} from './utils/abilityHelpers.js';

function listarHabilidadesDisponiveisAoSubirNivel(avatar, novoNivel) {
  const disponiveis = getHabilidadesDisponiveis(
    avatar.elemento,
    novoNivel,
    avatar.vinculo
  );

  console.log(`\n=== Habilidades Disponíveis no Nível ${novoNivel} ===\n`);

  disponiveis.forEach(hab => {
    const jaTemOuEvoluvel = avatar.habilidades.some(h =>
      h.nome === hab.nome || h.evolui_para === hab.nome
    );

    if (!jaTemOuEvoluvel) {
      console.log(`[NOVA] ${hab.nome}`);
      console.log(`       ${hab.descricao}`);
      console.log(`       Custo: ${hab.custo_energia} energia\n`);
    }
  });

  // Verificar evoluções possíveis
  console.log(`\n=== Evoluções Possíveis ===\n`);
  avatar.habilidades.forEach(hab => {
    const evoluida = podeEvoluirHabilidade(hab, novoNivel);
    if (evoluida) {
      console.log(`[EVOLUÇÃO] ${hab.nome} -> ${evoluida.nome}`);
      console.log(`           Novo Dano: ${evoluida.dano_base}`);
      console.log(`           Novo Cooldown: ${evoluida.cooldown}\n`);
    }
  });
}

// Uso
const avatar = {
  elemento: 'Água',
  vinculo: 50,
  habilidades: [
    { nome: 'Corrente Aquática', evolui_para: 'Maremoto', nivel_evolucao: 10 },
    { nome: 'Regeneração Aquática', evolui_para: null }
  ]
};

listarHabilidadesDisponiveisAoSubirNivel(avatar, 15);
```

---

## 4. Dashboard de Habilidade (UI)

### Objetivo: Mostrar detalhes completos de uma habilidade para UI

```javascript
import {
  gerarDescricaoCompleta,
  verificarRequisitosHabilidade
} from './utils/abilityHelpers.js';

import {
  obterDetalhesValidacao,
  validacaoCompleta
} from './utils/abilityValidator.js';

import { calcularDanoHabilidade } from './utils/damageCalculator.js';

function renderizarDashboardHabilidade(avatar, habilidade) {
  // Descrição completa
  const descricao = gerarDescricaoCompleta(
    habilidade,
    avatar.stats,
    avatar.nivel,
    calcularDanoHabilidade
  );

  console.log('╔════════════════════════════════════════╗');
  console.log('║          DETALHES DA HABILIDADE        ║');
  console.log('╚════════════════════════════════════════╝\n');
  console.log(descricao);

  // Verificar requisitos
  const requisitos = verificarRequisitosHabilidade(avatar, habilidade);
  if (!requisitos.valido) {
    console.log('\n⚠️  REQUISITOS NÃO ATENDIDOS:');
    requisitos.erros.forEach(erro => console.log(`   - ${erro}`));
    return;
  }

  // Detalhes de validação
  const validacao = obterDetalhesValidacao(
    avatar,
    habilidade,
    avatar.energia,
    0
  );

  console.log('\n✓ REQUISITOS ATENDIDOS\n');
  console.log('📊 RESUMO DE VALIDAÇÃO:');
  console.log(`   Nível: ${validacao.nivel.atual}/${validacao.nivel.requerido} ${validacao.nivel.valido ? '✓' : '✗'}`);
  console.log(`   Vínculo: ${validacao.vinculo.atual}/${validacao.vinculo.requerido} ${validacao.vinculo.valido ? '✓' : '✗'}`);
  console.log(`   Energia: ${validacao.energia.atual}/${validacao.energia.requerido} ${validacao.energia.valido ? '✓' : '✗'}`);
  console.log(`   Cooldown: ${validacao.cooldown.pode_usar ? 'Disponível ✓' : `Indisponível (${validacao.cooldown.turnos_restantes} turnos)`}`);
}

// Uso
const avatar = {
  nome: 'Avatar Lendário',
  nivel: 25,
  vinculo: 75,
  energia: 85,
  stats: {
    forca: 65,
    resistencia: 50,
    agilidade: 55,
    foco: 70
  }
};

const habilidadeUltimate = {
  nome: 'Inferno Eterno',
  descricao: 'Invoca um inferno devastador com dano massivo e queimadura intensa',
  tipo: 'Ofensiva',
  dano_base: 220,
  multiplicador_stat: 2.6,
  stat_primario: 'forca',
  custo_energia: 80,
  cooldown: 5,
  nivel_minimo: 25,
  vinculo_minimo: 60,
  efeitos_status: ['queimadura_intensa'],
  evolui_para: null
};

renderizarDashboardHabilidade(avatar, habilidadeUltimate);
```

---

## 5. Sistema de Treinamento

### Objetivo: Simular treinamento e melhorias de habilidades

```javascript
import {
  calcularDanoHabilidade,
  calcularDanoTotal
} from './utils/damageCalculator.js';

import { EFEITOS_STATUS } from '../abilitiesSystem.js';

function treinarHabilidade(avatar, habilidade, sessoes = 10) {
  const historicoProgressao = [];

  console.log(`\n=== Treinamento: ${habilidade.nome} ===\n`);

  for (let i = 1; i <= sessoes; i++) {
    // Simular melhoria de stats
    avatar.stats.forca += 1;
    avatar.stats.foco += 0.5;
    avatar.nivel += 0.1;

    // Recalcular dano
    const dano = calcularDanoHabilidade(
      habilidade,
      avatar.stats,
      Math.floor(avatar.nivel),
      avatar.vinculo
    );

    // Calcular dano com efeitos
    const danoTotal = calcularDanoTotal(
      dano,
      100,
      habilidade.efeitos_status,
      EFEITOS_STATUS
    );

    historicoProgressao.push({
      sessao: i,
      dano: dano,
      danoTotal: danoTotal.danoTotal,
      stats: { ...avatar.stats }
    });

    if (i % 2 === 0 || i === sessoes) {
      console.log(`Sessão ${i}: Dano Base ${dano} | Dano Total ${danoTotal.danoTotal}`);
    }
  }

  // Mostrar progresso
  const inicial = historicoProgressao[0];
  const final = historicoProgressao[historicoProgressao.length - 1];
  const progresso = ((final.dano - inicial.dano) / inicial.dano * 100).toFixed(1);

  console.log(`\n📈 Progresso Total: +${progresso}% no dano base`);
  console.log(`   Inicial: ${inicial.dano}`);
  console.log(`   Final: ${final.dano}`);

  return historicoProgressao;
}

// Uso
const avatar = {
  nivel: 10,
  vinculo: 50,
  stats: { forca: 40, resistencia: 30, agilidade: 35, foco: 42 }
};

const habilidade = {
  nome: 'Explosão Ígnea',
  dano_base: 100,
  multiplicador_stat: 1.8,
  stat_primario: 'forca',
  efeitos_status: ['queimadura']
};

treinarHabilidade(avatar, habilidade, 5);
```

---

## 6. Comparação de Habilidades

### Objetivo: Ajudar avatar a escolher melhor habilidade

```javascript
import {
  calcularDanoHabilidade,
  calcularDanoTotal
} from './utils/damageCalculator.js';

import { EFEITOS_STATUS } from '../abilitiesSystem.js';

function compararHabilidades(avatar, habilidades) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║            COMPARAÇÃO DE HABILIDADES                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const comparacao = habilidades.map(hab => {
    const dano = calcularDanoHabilidade(
      hab,
      avatar.stats,
      avatar.nivel,
      avatar.vinculo
    );

    const danoTotal = calcularDanoTotal(
      dano,
      100,
      hab.efeitos_status,
      EFEITOS_STATUS
    );

    const eficienciaEnergia = dano / hab.custo_energia;

    return {
      nome: hab.nome,
      dano,
      danoTotal: danoTotal.danoTotal,
      custoensia: hab.custo_energia,
      eficienciaEnergia: eficienciaEnergia.toFixed(2),
      cooldown: hab.cooldown,
      efeitos: hab.efeitos_status.length
    };
  });

  // Exibir tabela
  console.log('Nome                    | Dano | Total | Custo | Eficiência | Cooldown | Efeitos');
  console.log('─'.repeat(85));

  comparacao.forEach(c => {
    console.log(
      `${c.nome.padEnd(23)} | ${String(c.dano).padEnd(4)} | ${String(c.danoTotal).padEnd(5)} | ${String(c.custoensia).padEnd(5)} | ${String(c.eficienciaEnergia).padEnd(10)} | ${String(c.cooldown).padEnd(8)} | ${c.efeitos}`
    );
  });

  // Achar melhor por categoria
  const melhorDano = comparacao.reduce((a, b) => a.dano > b.dano ? a : b);
  const melhorEficiencia = comparacao.reduce((a, b) =>
    parseFloat(a.eficienciaEnergia) > parseFloat(b.eficienciaEnergia) ? a : b
  );

  console.log('\n🏆 RECOMENDAÇÕES:');
  console.log(`   Maior Dano: ${melhorDano.nome} (${melhorDano.dano} dano)`);
  console.log(`   Melhor Eficiência: ${melhorEficiencia.nome} (${melhorEficiencia.eficienciaEnergia} dano/energia)`);
}

// Uso
const avatar = {
  nivel: 15,
  vinculo: 50,
  stats: { forca: 50, resistencia: 35, agilidade: 40, foco: 48 }
};

const habilidades = [
  {
    nome: 'Choque Básico',
    dano_base: 28,
    multiplicador_stat: 1.3,
    stat_primario: 'foco',
    custo_energia: 35,
    cooldown: 0,
    efeitos_status: ['paralisia']
  },
  {
    nome: 'Raio Perfurante',
    dano_base: 85,
    multiplicador_stat: 1.8,
    stat_primario: 'foco',
    custo_energia: 40,
    cooldown: 2,
    efeitos_status: ['paralisia']
  }
];

compararHabilidades(avatar, habilidades);
```

---

## 7. Sistema de Vínculo e Habilidades Cooperativas

### Objetivo: Mostrar impacto do vínculo no dano

```javascript
import { calcularDanoHabilidade } from './utils/damageCalculator.js';

function mostrarImpactoVinculo(avatar, habilidade) {
  const vinculos = [0, 40, 60, 80, 100];

  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║    IMPACTO DO VÍNCULO NO DANO - ${habilidade.nome}`);
  console.log(`╚════════════════════════════════════════════════════╝\n`);

  const dados = vinculos.map(vinculo => {
    const dano = calcularDanoHabilidade(
      habilidade,
      avatar.stats,
      avatar.nivel,
      vinculo
    );

    let nomeVinculo;
    let bonus = '0%';

    if (vinculo >= 80) {
      nomeVinculo = 'Alma Gêmea';
      bonus = '+20%';
    } else if (vinculo >= 60) {
      nomeVinculo = 'Companheiro Fiel';
      bonus = '+15%';
    } else if (vinculo >= 40) {
      nomeVinculo = 'Bom Companheiro';
      bonus = '+10%';
    } else {
      nomeVinculo = 'Nenhum';
      bonus = '0%';
    }

    return { vinculo, nomeVinculo, dano, bonus };
  });

  // Exibir progressão
  dados.forEach(d => {
    const barraProgresso = '█'.repeat(Math.floor(d.dano / 10)) + '░'.repeat(20 - Math.floor(d.dano / 10));
    console.log(`Vínculo ${String(d.vinculo).padEnd(3)} - ${d.nomeVinculo.padEnd(17)} | Dano: ${String(d.dano).padEnd(3)} | ${barraProgresso} ${d.bonus}`);
  });

  console.log(`\nOBS: Aumentar vínculo de 0 para 80 aumenta o dano em ${(((dados[4].dano - dados[0].dano) / dados[0].dano) * 100).toFixed(1)}%`);
}

// Uso
mostrarImpactoVinculo(avatar, habilidade);
```

---

## Resumo de Padrões

Estes exemplos demonstram:

- ✓ Criação e inicialização de avatares
- ✓ Validação antes de usar habilidades
- ✓ Cálculo de dano com múltiplos fatores
- ✓ Gestão de recursos (energia, cooldown)
- ✓ Listagem de habilidades disponíveis
- ✓ Evolução de habilidades
- ✓ Renderização em UI
- ✓ Comparação e análise
- ✓ Sistemas de progressão
- ✓ Impacto de stats e vínculo

Todos os exemplos usam funções modularizadas dos utilitários!
