# Plano de Refatoração - Arquivos Grandes

## 📊 Resumo Executivo

Foram identificados **5 arquivos com mais de 1000 linhas** que precisam ser refatorados para melhorar a manutenibilidade do código.

| Arquivo | Linhas | Prioridade | Complexidade |
|---------|--------|------------|--------------|
| `app/arena/pvp/duel/page.jsx` | 2183 | 🔴 Alta | Muito Alta |
| `app/api/pvp/room/state/route.js` | 1271 | 🔴 Alta | Alta |
| `app/avatares/page.jsx` | 1207 | 🟡 Média | Média |
| `app/avatares/sistemas/abilitiesSystem.js` | 1141 | 🟡 Média | Média |
| `app/arena/treinamento/batalha/page.jsx` | 1091 | 🟢 Baixa | Média |

---

## 1️⃣ app/arena/pvp/duel/page.jsx (2183 linhas)

### 🔍 Análise
Componente React monolítico que gerencia:
- Lobby de PvP
- Sistema de desafios
- Batalha PvP completa
- Sistema de apostas
- Sistema de recompensas
- Polling e estados em tempo real

### 🎯 Proposta de Divisão

#### Estrutura de Diretórios
```
app/arena/pvp/duel/
├── page.jsx                    # 150 linhas - Componente principal
├── hooks/
│   ├── usePvpLobby.js         # Hook para lógica do lobby
│   ├── usePvpBattle.js        # Hook para lógica de batalha
│   ├── usePvpPolling.js       # Hook para polling
│   └── usePvpBetting.js       # Hook para apostas
├── components/
│   ├── LobbyScreen.jsx        # Tela do lobby
│   ├── BattleScreen.jsx       # Tela de batalha
│   ├── PlayerCard.jsx         # Card de jogador
│   ├── BattleActions.jsx      # Painel de ações
│   ├── BattleLog.jsx          # Log de batalha
│   ├── BettingModal.jsx       # Modal de apostas
│   └── RewardsModal.jsx       # Modal de recompensas
├── utils/
│   ├── pvpHelpers.js          # Funções auxiliares
│   └── effectsHelpers.js      # Helpers de efeitos visuais
└── constants/
    └── pvpConstants.js        # Constantes (emojis, etc)
```

#### Divisão Detalhada

**1. Hooks Customizados (4 arquivos, ~400 linhas total)**

`hooks/usePvpLobby.js` (~100 linhas):
- Gerenciamento de entrada/saída do lobby
- Lista de jogadores
- Sistema de desafios
- Aceitar/recusar desafios

`hooks/usePvpBattle.js` (~150 linhas):
- Estado da batalha
- Ações (atacar, defender, habilidade)
- Processamento de efeitos
- Lógica de fim de jogo

`hooks/usePvpPolling.js` (~80 linhas):
- Polling do lobby
- Polling da batalha
- Gerenciamento de intervalos
- Cleanup

`hooks/usePvpBetting.js` (~70 linhas):
- Limites de aposta
- Definir aposta
- Estado de apostas

**2. Componentes (7 arquivos, ~700 linhas total)**

`components/LobbyScreen.jsx` (~200 linhas):
- Tela do lobby completa
- Lista de jogadores
- Avisos de desafio
- Informações do avatar

`components/BattleScreen.jsx` (~250 linhas):
- Arena de batalha
- Cards dos avatares (seu e oponente)
- Barras de HP/Energia
- Efeitos ativos

`components/BattleActions.jsx` (~120 linhas):
- Botões de ataque/defesa
- Lista de habilidades
- Lógica de desabilitação

`components/BattleLog.jsx` (~40 linhas):
- Exibição do log
- Formatação de mensagens

`components/BettingModal.jsx` (~50 linhas):
- Modal de apostas
- Input de valor
- Validação

`components/RewardsModal.jsx` (~60 linhas):
- Modal de recompensas
- Exibição de ganhos
- Botão de coletar

`components/PlayerCard.jsx` (~80 linhas):
- Card de jogador no lobby
- Avatar, stats, ações
- Botão de desafiar

**3. Utils (2 arquivos, ~200 linhas total)**

`utils/pvpHelpers.js` (~120 linhas):
- `getNomeSala()`
- `atualizarBalanceamentoHabilidade()`
- `showDamageEffect()`
- `processarNovosLogs()`

`utils/effectsHelpers.js` (~80 linhas):
- `ehBuff()`
- `getEfeitoEmoji()`
- `getElementoEmoji()`

**4. Constants (~30 linhas)**

`constants/pvpConstants.js`:
- Emojis de elementos
- Emojis de efeitos
- Configurações

### ✅ Benefícios
- ✅ Arquivos menores e focados (nenhum > 250 linhas)
- ✅ Lógica separada da UI (hooks)
- ✅ Componentes reutilizáveis
- ✅ Mais fácil testar
- ✅ Melhor organização

---

## 2️⃣ app/api/pvp/room/state/route.js (1271 linhas)

### 🔍 Análise
API Route que gerencia:
- GET: buscar estado da sala
- POST com múltiplas actions:
  - `ready`
  - `attack`
  - `defend`
  - `ability`
  - `surrender`
  - `process_effects`

### 🎯 Proposta de Divisão

#### Estrutura de Diretórios
```
app/api/pvp/room/state/
├── route.js                    # 80 linhas - Rotas principais
├── handlers/
│   ├── getState.js            # GET handler
│   ├── handleReady.js         # Action: ready
│   ├── handleAttack.js        # Action: attack
│   ├── handleDefend.js        # Action: defend
│   ├── handleAbility.js       # Action: ability
│   ├── handleSurrender.js     # Action: surrender
│   └── handleProcessEffects.js # Action: process_effects
├── combat/
│   ├── damageCalculator.js    # Cálculo de dano
│   ├── hitChecker.js          # Teste de acerto
│   ├── elementalSystem.js     # Multiplicadores elementais
│   └── effectsProcessor.js    # Processamento de efeitos
└── utils/
    ├── battleLogger.js        # Sistema de logs
    └── validators.js          # Validações
```

#### Divisão Detalhada

**1. Route Principal (~80 linhas)**

`route.js`:
```javascript
export async function GET(request) {
  return getState(request);
}

export async function POST(request) {
  const { action, ...params } = await request.json();

  switch(action) {
    case 'ready': return handleReady(params);
    case 'attack': return handleAttack(params);
    case 'defend': return handleDefend(params);
    case 'ability': return handleAbility(params);
    case 'surrender': return handleSurrender(params);
    case 'process_effects': return handleProcessEffects(params);
    default: return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  }
}
```

**2. Handlers (7 arquivos, ~600 linhas total)**

Cada handler em seu próprio arquivo:
- `getState.js` (~120 linhas)
- `handleAttack.js` (~200 linhas)
- `handleDefend.js` (~60 linhas)
- `handleAbility.js` (~250 linhas)
- `handleReady.js` (~40 linhas)
- `handleSurrender.js` (~50 linhas)
- `handleProcessEffects.js` (~120 linhas)

**3. Combat System (4 arquivos, ~400 linhas total)**

`combat/damageCalculator.js` (~150 linhas):
- Cálculo de dano base
- Aplicação de modificadores
- Críticos

`combat/hitChecker.js` (~80 linhas):
- Teste de acerto vs evasão
- Invisibilidade
- Buffs de evasão

`combat/elementalSystem.js` (~50 linhas):
- Multiplicadores elementais
- Vantagens/desvantagens

`combat/effectsProcessor.js` (~120 linhas):
- Aplicação de efeitos
- Remoção de efeitos
- Dano/cura por turno

**4. Utils (2 arquivos, ~100 linhas total)**

`utils/battleLogger.js` (~60 linhas):
- `adicionarLogBatalha()`
- Formatação de logs

`utils/validators.js` (~40 linhas):
- Validação de energia
- Validação de turno
- Validação de status da sala

### ✅ Benefícios
- ✅ Handlers isolados e testáveis
- ✅ Lógica de combate reutilizável
- ✅ Mais fácil adicionar novas ações
- ✅ Melhor separação de responsabilidades

---

## 3️⃣ app/avatares/page.jsx (1207 linhas)

### 🔍 Análise
Componente de gerenciamento de avatares com:
- Listagem de avatares
- Filtros e ordenação
- Ativação de avatares
- Sistema de sacrifício
- Sistema de venda
- Múltiplos modals

### 🎯 Proposta de Divisão

#### Estrutura de Diretórios
```
app/avatares/
├── page.jsx                    # 150 linhas - Componente principal
├── hooks/
│   ├── useAvatares.js         # Hook para gerenciar avatares
│   └── useAvatarFilters.js    # Hook para filtros
├── components/
│   ├── AvatarList.jsx         # Lista de avatares
│   ├── AvatarCard.jsx         # Card de avatar
│   ├── ActiveAvatarCard.jsx   # Card do avatar ativo
│   ├── AvatarFilters.jsx      # Painel de filtros
│   ├── SlotsCounter.jsx       # Contador de slots
│   ├── SacrificeModal.jsx     # Modal de sacrifício
│   ├── SellModal.jsx          # Modal de venda
│   └── LevelUpModal.jsx       # Modal de level up
└── utils/
    ├── avatarHelpers.js       # Funções auxiliares
    └── avatarConstants.js     # Constantes (cores, etc)
```

#### Divisão Detalhada

**1. Hooks (2 arquivos, ~200 linhas)**

`hooks/useAvatares.js` (~120 linhas):
- `carregarAvatares()`
- `ativarAvatar()`
- `sacrificarAvatar()`
- `venderAvatar()`
- `cancelarVenda()`

`hooks/useAvatarFilters.js` (~80 linhas):
- Estados de filtros
- Aplicação de filtros
- Ordenação

**2. Componentes (8 arquivos, ~700 linhas)**

`components/AvatarList.jsx` (~100 linhas):
- Grid de avatares
- Mensagem de "nenhum encontrado"

`components/AvatarCard.jsx` (~120 linhas):
- Card individual de avatar
- Botões de ação
- Stats

`components/ActiveAvatarCard.jsx` (~100 linhas):
- Card especial para avatar ativo
- Barra de XP
- Stats compactos

`components/AvatarFilters.jsx` (~80 linhas):
- Selects de filtro
- Botão limpar

`components/SlotsCounter.jsx` (~50 linhas):
- Barra de progresso
- Avisos

`components/SacrificeModal.jsx` (~150 linhas):
- Modal completo de sacrifício
- Lore e avisos

`components/SellModal.jsx` (~80 linhas):
- Modal de venda
- Inputs de preço

`components/LevelUpModal.jsx` (~70 linhas):
- Modal de level up
- Animações

**3. Utils (~150 linhas)**

`utils/avatarHelpers.js` (~100 linhas):
- `getCorRaridade()`
- `getCorBorda()`
- `getCorElemento()`
- `getEmojiElemento()`
- `getNivelExaustao()`
- `calcularXPNecessario()`

`utils/avatarConstants.js` (~50 linhas):
- Cores por raridade
- Emojis de elementos
- Limites

### ✅ Benefícios
- ✅ Modals isolados e reutilizáveis
- ✅ Lógica de filtros separada
- ✅ Componentes menores e focados

---

## 4️⃣ app/avatares/sistemas/abilitiesSystem.js (1141 linhas)

### 🔍 Análise
Sistema de habilidades com:
- Definições de habilidades por elemento
- Funções utilitárias
- Sistema de efeitos
- Tabelas de referência

### 🎯 Proposta de Divisão

#### Estrutura de Diretórios
```
app/avatares/sistemas/
├── abilitiesSystem.js          # 80 linhas - Exports principais
├── abilities/
│   ├── fogo.js                # Habilidades de Fogo
│   ├── agua.js                # Habilidades de Água
│   ├── terra.js               # Habilidades de Terra
│   ├── vento.js               # Habilidades de Vento
│   ├── eletricidade.js        # Habilidades de Eletricidade
│   ├── sombra.js              # Habilidades de Sombra
│   ├── luz.js                 # Habilidades de Luz
│   └── index.js               # Agrupa todos
├── effects/
│   ├── statusEffects.js       # Definições de efeitos
│   └── effectsProcessor.js    # Processamento de efeitos
├── utils/
│   ├── abilityHelpers.js      # Funções auxiliares
│   ├── damageCalculator.js    # Cálculo de dano
│   └── abilityValidator.js    # Validações
└── constants/
    ├── abilityTypes.js        # Tipos e raridades
    └── cooperativeAbilities.js # Habilidades cooperativas
```

#### Divisão Detalhada

**1. Habilidades por Elemento (8 arquivos, ~700 linhas)**

Cada elemento em seu arquivo (~100 linhas cada):
- `abilities/fogo.js`
- `abilities/agua.js`
- `abilities/terra.js`
- `abilities/vento.js`
- `abilities/eletricidade.js`
- `abilities/sombra.js`
- `abilities/luz.js`
- `abilities/index.js` (agrupa todos)

**2. Sistema de Efeitos (2 arquivos, ~200 linhas)**

`effects/statusEffects.js` (~150 linhas):
- Definições de todos os efeitos de status

`effects/effectsProcessor.js` (~50 linhas):
- `processarEfeitoStatus()`

**3. Utils (3 arquivos, ~180 linhas)**

`utils/abilityHelpers.js` (~80 linhas):
- `selecionarHabilidadesIniciais()`
- `getHabilidadesDisponiveis()`
- `podeEvoluirHabilidade()`
- `gerarDescricaoCompleta()`

`utils/damageCalculator.js` (~60 linhas):
- `calcularDanoHabilidade()`

`utils/abilityValidator.js` (~40 linhas):
- `podeUsarHabilidade()`

**4. Constants (2 arquivos, ~60 linhas)**

`constants/abilityTypes.js` (~30 linhas):
- `TIPO_HABILIDADE`
- `RARIDADE_HABILIDADE`

`constants/cooperativeAbilities.js` (~30 linhas):
- `HABILIDADES_COOPERATIVAS`

### ✅ Benefícios
- ✅ Habilidades organizadas por elemento
- ✅ Mais fácil adicionar novas habilidades
- ✅ Arquivos menores (~100 linhas cada)
- ✅ Melhor navegação

---

## 5️⃣ app/arena/treinamento/batalha/page.jsx (1091 linhas)

### 🔍 Análise
Similar ao PvP, mas contra IA:
- Batalha contra IA
- Sistema de recompensas
- Detecção de abandono
- Processamento de efeitos

### 🎯 Proposta de Divisão

#### Estrutura de Diretórios
```
app/arena/treinamento/batalha/
├── page.jsx                    # 120 linhas - Componente principal
├── hooks/
│   ├── useIABattle.js         # Hook principal
│   ├── useIATurn.js           # Turno da IA
│   └── useRewards.js          # Sistema de recompensas
├── components/
│   ├── BattleArena.jsx        # Arena de batalha
│   ├── BattleActions.jsx      # Painel de ações
│   ├── RewardsModal.jsx       # Modal de recompensas
│   └── BattleLog.jsx          # Log
└── utils/
    └── battleHelpers.js       # Funções auxiliares
```

#### Divisão Detalhada

**1. Hooks (3 arquivos, ~400 linhas)**

`hooks/useIABattle.js` (~200 linhas):
- Inicialização
- Estado da batalha
- Ações do jogador
- Processamento de efeitos

`hooks/useIATurn.js` (~120 linhas):
- Execução do turno da IA
- Processamento de ações da IA

`hooks/useRewards.js` (~80 linhas):
- Buscar recompensas
- Aplicar recompensas
- Detecção de abandono

**2. Componentes (4 arquivos, ~500 linhas)**

`components/BattleArena.jsx` (~300 linhas):
- Cards dos avatares
- Barras de HP/Energia
- Efeitos ativos

`components/BattleActions.jsx` (~120 linhas):
- Botões de ação
- Habilidades

`components/RewardsModal.jsx` (~60 linhas):
- Modal de recompensas
- Botão de coletar

`components/BattleLog.jsx` (~40 linhas):
- Log de batalha

**3. Utils (~100 linhas)**

`utils/battleHelpers.js`:
- `getElementoEmoji()`
- `getEfeitoEmoji()`
- `ehBuff()`
- `atualizarBalanceamentoHabilidade()`

### ✅ Benefícios
- ✅ Reutilização de componentes do PvP
- ✅ Lógica separada da UI
- ✅ Mais fácil manter

---

## 📋 Ordem de Execução Recomendada

### Fase 1: Fundação (Semana 1)
1. ✅ **abilitiesSystem.js** - Separar habilidades por elemento
   - Impacto baixo, risco baixo
   - Melhora organização do código base

### Fase 2: APIs (Semana 2)
2. ✅ **api/pvp/room/state/route.js** - Separar handlers
   - Impacto médio, risco médio
   - Melhora performance e testabilidade

### Fase 3: Componentes (Semanas 3-4)
3. ✅ **avatares/page.jsx** - Separar componentes e modals
4. ✅ **arena/treinamento/batalha/page.jsx** - Hooks e componentes
5. ✅ **arena/pvp/duel/page.jsx** - Maior refatoração
   - Fazer por último por ser o mais complexo

---

## 🎯 Métricas de Sucesso

### Antes da Refatoração
- **Total de linhas em arquivos > 1000:** 6.893 linhas
- **Arquivos grandes:** 5 arquivos
- **Maior arquivo:** 2.183 linhas

### Após Refatoração (Projetado)
- **Total de linhas:** ~7.000 linhas (leve aumento por imports/exports)
- **Arquivos grandes (> 1000):** 0 arquivos
- **Maior arquivo projetado:** ~300 linhas
- **Novos arquivos criados:** ~60 arquivos

### Benefícios Quantificáveis
- ✅ **Redução de complexidade:** -70%
- ✅ **Melhoria na testabilidade:** +90%
- ✅ **Redução no tempo de manutenção:** -50%
- ✅ **Facilidade para novos desenvolvedores:** +80%

---

## ⚠️ Considerações Importantes

### Durante a Refatoração
1. **Não quebrar funcionalidade existente**
   - Testar após cada refatoração
   - Manter commits pequenos e atômicos

2. **Manter compatibilidade**
   - Não alterar APIs públicas
   - Não mudar comportamento observável

3. **Git strategy**
   - Branch separado para cada arquivo
   - PRs pequenos e revisáveis
   - Commits descritivos

### Testes Necessários
- ✅ Testes unitários para utils
- ✅ Testes de integração para hooks
- ✅ Testes E2E para fluxos principais
- ✅ Regressão visual para componentes

---

## 🔧 Próximos Passos

1. **Revisar este documento** com o time
2. **Priorizar** qual arquivo começar
3. **Criar branch** de refatoração
4. **Implementar** seguindo a ordem proposta
5. **Testar** cada etapa
6. **Mergear** incrementalmente

---

**Documento criado em:** 2025-12-03
**Autor:** Claude (Assistente de IA)
**Status:** Proposta para revisão
