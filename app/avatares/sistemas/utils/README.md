# Utilitários de Sistema de Habilidades

Refatoração do `abilitiesSystem.js` em três módulos especializados para melhor manutenção e reutilização.

## Estrutura

```
utils/
├── abilityHelpers.js      # Seleção e gestão de habilidades
├── damageCalculator.js    # Cálculos de dano
├── abilityValidator.js    # Validações de uso
├── index.js              # Exportações centralizadas
└── README.md             # Este arquivo
```

## Módulos

### 1. abilityHelpers.js
**Funções auxiliares para seleção e gestão de habilidades**

#### Funções Exportadas:

- **`selecionarHabilidadesIniciais(elemento, raridade): Array`**
  - Seleciona habilidades iniciais para um novo avatar
  - Retorna 1, 2 ou 3 habilidades conforme raridade (Comum, Raro, Lendário)
  - Sempre inclui a habilidade básica

- **`getHabilidadesDisponiveis(elemento, nivel, vinculo): Array`**
  - Retorna todas as habilidades disponíveis para um avatar
  - Filtra por nível e vínculo mínimos

- **`podeEvoluirHabilidade(habilidade, nivel): Object|null`**
  - Verifica se uma habilidade pode evoluir
  - Retorna a habilidade evoluída ou null

- **`gerarDescricaoCompleta(habilidade, stats?, nivel?, calcularDanoHabilidade?): String`**
  - Gera descrição formatada completa da habilidade
  - Inclui custo de energia, cooldown, dano estimado, efeitos, evolução
  - Suporta função externa para cálculo de dano

- **`verificarRequisitosHabilidade(avatar, habilidade): Object`**
  - Verifica todos os requisitos da habilidade
  - Retorna objeto com `valido: boolean` e array de `erros: string[]`

#### Exemplo de Uso:

```javascript
import {
  selecionarHabilidadesIniciais,
  getHabilidadesDisponiveis,
  podeEvoluirHabilidade
} from './utils/abilityHelpers.js';

// Selecionar habilidades iniciais
const habilidades = selecionarHabilidadesIniciais('Fogo', 'Raro');

// Obter habilidades disponíveis
const disponiveis = getHabilidadesDisponiveis('Água', 15, 50);

// Evoluir habilidade
const evoluida = podeEvoluirHabilidade(habilidade, 20);
if (evoluida) {
  console.log(`Evoluiu para: ${evoluida.nome}`);
}
```

---

### 2. damageCalculator.js
**Lógica de cálculo de dano de habilidades**

#### Funções Exportadas:

- **`calcularDanoHabilidade(habilidade, stats, nivel, vinculo?): Number`**
  - Calcula dano final considerando múltiplos fatores
  - Fórmula: `dano_base + (stat × multiplicador) × (1 + bônus_nível) × (1 + bônus_vínculo)`
  - Bônus de nível: 1% por nível
  - Bônus de vínculo: até 20% em vínculo 80+

- **`aplicarDefesa(dano, defesa): Number`**
  - Reduz dano baseado na defesa do alvo
  - Fórmula: `dano × (1 - (defesa / (defesa + 100)))`

- **`calcularDanoCritico(dano, chanceCritico?, multiplicadorCritico?): Object`**
  - Calcula dano com possibilidade de crítico
  - Retorna `{ dano, foi_critico }`

- **`aplicarChanceAcerto(dano, chanceAcerto?, evasao?): Object`**
  - Aplica chance de acerto e evasão
  - Retorna `{ dano, acertou, motivo }`

- **`calcularDanoEfeito(hpMaximo, percentualDano, duracao): Object`**
  - Calcula dano por turno de efeitos contínuos
  - Retorna `{ danoTurno, danoBonusTotal }`

- **`calcularDanoTotal(danoDireto, hpMaximoAlvo, efeitosStatus?, efeitosStatusMap?): Object`**
  - Calcula dano total incluindo efeitos contínuos
  - Retorna `{ danoDireto, danoEfeitos, danoTotal }`

#### Exemplo de Uso:

```javascript
import {
  calcularDanoHabilidade,
  aplicarDefesa,
  calcularDanoCritico,
  calcularDanoTotal
} from './utils/damageCalculator.js';

const habilidade = {
  dano_base: 30,
  stat_primario: 'forca',
  multiplicador_stat: 1.2
};
const stats = { forca: 50, resistencia: 30, agilidade: 40, foco: 45 };

// Dano base
const dano = calcularDanoHabilidade(habilidade, stats, 15, 60);

// Aplicar defesa do alvo
const danoReduzido = aplicarDefesa(dano, 20);

// Aplicar crítico
const { dano: danoCrit, foi_critico } = calcularDanoCritico(danoReduzido, 5, 1.5);

// Dano total com efeitos
const danoTotal = calcularDanoTotal(danoCrit, 100, ['queimadura'], EFEITOS_STATUS);
```

---

### 3. abilityValidator.js
**Validações relacionadas ao uso de habilidades**

#### Funções Exportadas:

- **`podeUsarHabilidade(avatar, habilidade, energiaAtual): Object`**
  - Valida se avatar pode usar uma habilidade
  - Verifica nível, vínculo e energia
  - Retorna `{ pode_usar: boolean, motivo: string|null }`

- **`validarCustoEnergia(energiaAtual, custoEnergiaHabilidade): Object`**
  - Valida energia suficiente
  - Retorna `{ valido, deficit, mensagem }`

- **`validarCooldown(cooldownRestante?): Object`**
  - Valida cooldown de habilidade
  - Retorna `{ pode_usar, turnos_restantes, mensagem }`

- **`validarAlvoHabilidade(habilidade, alvoAtual, usuario, aliados?, inimigos?): Object`**
  - Valida se alvo é válido para habilidade
  - Suporta tipos: `self`, `inimigo_unico`, `inimigos_area`, `aliado`, `aliados_area`
  - Retorna `{ valido, motivo }`

- **`validacaoCompleta(avatar, habilidade, energiaAtual, cooldownRestante?, alvoAtual?, aliados?, inimigos?): Object`**
  - Valida múltiplas condições de uso simultaneamente
  - Retorna `{ pode_usar, erros: string[] }`

- **`obterDetalhesValidacao(avatar, habilidade, energiaAtual, cooldownRestante?): Object`**
  - Retorna detalhes de todas as validações
  - Útil para mostrar ao usuário todos os requisitos faltantes

#### Exemplo de Uso:

```javascript
import {
  podeUsarHabilidade,
  validarCustoEnergia,
  validarCooldown,
  validacaoCompleta,
  obterDetalhesValidacao
} from './utils/abilityValidator.js';

const avatar = { nivel: 15, vinculo: 50 };
const habilidade = {
  nivel_minimo: 10,
  vinculo_minimo: 40,
  custo_energia: 30,
  cooldown: 2
};

// Validação simples
const resultado = podeUsarHabilidade(avatar, habilidade, 40);
if (!resultado.pode_usar) {
  console.log(resultado.motivo);
}

// Validação de energia
const validEnergia = validarCustoEnergia(40, 30); // true

// Validação de cooldown
const validCooldown = validarCooldown(0); // pode_usar: true

// Validação completa
const validacao = validacaoCompleta(avatar, habilidade, 40, 0);
if (!validacao.pode_usar) {
  validacao.erros.forEach(erro => console.log(erro));
}

// Detalhes para UI
const detalhes = obterDetalhesValidacao(avatar, habilidade, 40, 0);
console.log(detalhes.nivel);   // { requerido: 10, atual: 15, valido: true }
console.log(detalhes.energia); // { requerido: 30, atual: 40, valido: true, ... }
```

---

## Importação

### Importar de um módulo específico:

```javascript
import { selecionarHabilidadesIniciais } from './utils/abilityHelpers.js';
import { calcularDanoHabilidade } from './utils/damageCalculator.js';
import { podeUsarHabilidade } from './utils/abilityValidator.js';
```

### Importar via índice centralizado:

```javascript
import {
  selecionarHabilidadesIniciais,
  calcularDanoHabilidade,
  podeUsarHabilidade
} from './utils/index.js';
```

### Importar módulo completo:

```javascript
import * as abilityHelpers from './utils/abilityHelpers.js';
import * as damageCalculator from './utils/damageCalculator.js';
import * as abilityValidator from './utils/abilityValidator.js';

// Uso
const dano = damageCalculator.calcularDanoHabilidade(...);
```

---

## Dependências

Todos os módulos dependem de:
- `../abilitiesSystem.js` - Para constantes e dados de habilidades

Importações necessárias:
```javascript
import {
  HABILIDADES_POR_ELEMENTO,
  RARIDADE_HABILIDADE,
  EFEITOS_STATUS
} from '../abilitiesSystem.js';
```

---

## Próximos Passos

1. Atualizar imports em `abilitiesSystem.js` para usar estes módulos
2. Adicionar testes unitários para cada função
3. Considerar adicionar cache para cálculos repetidos
4. Documentar retorno de valores com TypeScript JSDoc

---

## Notas Importantes

- Todas as funções mantêm a lógica original do `abilitiesSystem.js`
- Comentários JSDoc completos para facilitar autocomplete
- Funções puras quando possível (sem efeitos colaterais)
- Validações robustas com mensagens descritivas
- Suporte para valores padrão em parâmetros opcionais
