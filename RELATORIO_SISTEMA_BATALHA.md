# 📊 RELATÓRIO COMPLETO - SISTEMA DE BATALHA PHA

**Última atualização:** 2025-12-27
**Arquivo principal:** `/lib/arena/batalhaEngine.js`
**Versão:** 2.0 - **INCLUI SINERGIAS 9×9**

---

## 📋 ÍNDICE

1. [Configurações Globais](#configurações-globais)
2. [Cálculo de HP Máximo](#cálculo-de-hp-máximo)
3. [Sistema de Energia](#sistema-de-energia)
4. [Cálculo de Dano](#cálculo-de-dano)
5. [Sistema de Acerto/Evasão](#sistema-de-acertoevasão)
6. [Críticos](#críticos)
7. [Vantagem Elemental](#vantagem-elemental)
8. **[SINERGIAS 9×9](#sinergias-9×9)** ⭐ **NOVO**
9. [Buffs e Debuffs](#buffs-e-debuffs)
10. [Vínculo e Exaustão](#vínculo-e-exaustão)
11. [Efeitos de Status](#efeitos-de-status)
12. [Tipos de Ações](#tipos-de-ações)
13. [Condições de Vitória](#condições-de-vitória)

---

## ⚙️ CONFIGURAÇÕES GLOBAIS

```javascript
ENERGIA_INICIAL: 100
ENERGIA_MAXIMA: 100
ENERGIA_POR_RECARREGAR: 35
ENERGIA_POR_DEFENDER: 20
ENERGIA_POR_ATAQUE_BASICO: 10
RODADAS_MAXIMAS: 20
CHANCE_CRITICO_BASE: 0.05 (5%)
MULTIPLICADOR_CRITICO: 2.0
TEMPO_TURNO: 30000ms (30 segundos)
```

---

## 💚 CÁLCULO DE HP MÁXIMO

**Arquivo:** `/lib/combat/statsCalculator.js` → `calcularHPMaximoCompleto()`

### Fórmula Base:
```
HP = HP_BASE + (RESISTENCIA × MULTIPLICADOR_RESISTENCIA) + (NIVEL × BONUS_NIVEL)
```

**Valores:**
- HP_BASE: 100
- MULTIPLICADOR_RESISTENCIA: 15
- BONUS_NIVEL: 10

### Exemplo:
Avatar nível 5 com 30 de resistência:
```
HP = 100 + (30 × 15) + (5 × 10)
HP = 100 + 450 + 50
HP = 600
```

---

## ⚡ SISTEMA DE ENERGIA

### Energia Inicial
- **Jogador:** 100 (ou menos se afetado por exaustão)
- **Inimigo:** 100

### Regeneração de Energia
**IMPORTANTE:** Energia **NÃO regenera automaticamente** por turno!

Energia só é recuperada através de **ações específicas**:

| Ação | Energia Recuperada |
|------|-------------------|
| **Ataque Básico** | +10 |
| **Defender** | +20 |
| **Esperar/Recarregar** | +35 |

### Custo de Energia
- **Habilidades:** Varia por habilidade (geralmente 20-60)
- **Ataque Básico:** 0
- **Defender:** 0
- **Esperar:** 0

### Penalidade de Exaustão
Se avatar tiver exaustão >= 60:
```
Energia Máxima reduzida em 20-40%
```

---

## 💥 CÁLCULO DE DANO

### Fórmula Completa (Habilidades):

```javascript
1. DANO_BASE = habilidade.dano_base (ex: 30)

2. STAT_BONUS = stat_primario × multiplicador_stat
   Exemplo: forca (50) × 1.0 = 50

3. NIVEL_BONUS = nivel × 2
   Exemplo: nível 5 = +10

4. VANTAGEM_ELEMENTAL = multiplicador elemental (0.5 a 2.0)

5. CRITICO = ×2.0 se crítico

6. REDUCAO_DEFESA = min(resistencia × 0.5, dano × 0.5)
   - A defesa pode reduzir até 50% do dano
   - Bônus de buff de defesa aumenta esta redução

7. BONUS_VINCULO:
   - Vínculo >= 80: ×1.2 (+20%)
   - Vínculo >= 60: ×1.1 (+10%)
   - Vínculo < 60: sem bônus

8. PENALIDADE_EXAUSTAO:
   - Exaustão >= 80: ×0.5 (-50%)
   - Exaustão >= 60: ×0.75 (-25%)
   - Exaustão < 60: sem penalidade

9. MODIFICADORES_ESPECIAIS:
   - Perfuração: ignora 40% da defesa
   - Execução: +50% se HP do alvo <= 30%
   - Dano Massivo: ×1.5
   - Buffs/Debuffs aplicados

10. DANO_FINAL = max(1, floor(dano_calculado))
```

### Exemplo Completo:

**Cenário:**
- Avatar nível 5, Fogo, 50 de força, 60 de vínculo, 10 de exaustão
- Habilidade: "Bola de Fogo" (dano_base: 30, stat: força, mult: 1.0)
- Inimigo: Terra, 40 de resistência
- Crítico: Não

**Cálculo:**
```
1. Base: 30
2. Stat: 50 × 1.0 = 50
3. Nível: 5 × 2 = 10
4. Subtotal: 30 + 50 + 10 = 90
5. Vantagem: Fogo vs Terra = 1.0 (neutro)
6. Dano antes defesa: 90 × 1.0 = 90
7. Redução: min(40 × 0.5, 90 × 0.5) = min(20, 45) = 20
8. Pós-defesa: 90 - 20 = 70
9. Vínculo (60): 70 × 1.1 = 77
10. Exaustão (10): sem penalidade = 77
11. DANO FINAL: 77
```

### Fórmula para Ataque Básico:

Similar, mas com valores reduzidos:
```
DANO_BASE: 20
MULTIPLICADOR_STAT: 0.8
STAT_PRIMARIO: 'forca' (sempre)
```

---

## 🎯 SISTEMA DE ACERTO/EVASÃO

### Sistema d20 (Habilidades Ofensivas)

#### Rolagem do Atacante:
```
ROLAGEM = 1d20 + BONUS_FOCO + BONUS_ACERTO

BONUS_FOCO = floor(foco / 5)
Exemplo: 30 foco = +6

BONUS_ACERTO = floor(modificador_acerto × 5)
Modificador vem de buffs como "Precisão Aumentada"
```

#### Dificuldade (Defensor):
```
DIFICULDADE = BASE + BONUS_EVASAO + EVASAO_EXTRA

BASE = 10
BONUS_EVASAO = floor(agilidade / 4)
EVASAO_EXTRA = floor(modificador_evasao × 10)

Exemplo: 40 agilidade = +10 evasão
```

#### Teste de Acerto:
```
if (ROLAGEM >= DIFICULDADE) → ACERTA
if (ROLAGEM < DIFICULDADE) → ERRA
```

**Exceção:** Habilidades com `chance_acerto: 100` sempre acertam.

### Sistema d20 (Ataque Básico)

Similar, mas mais fácil de acertar:
```
BONUS_FOCO = floor(foco / 6)  (menos bônus)
DIFICULDADE_BASE = 8  (ao invés de 10)
```

### Habilidades Defensivas/Suporte

**Não precisam de teste de acerto** - sempre funcionam.

---

## 💥 CRÍTICOS

### Chance de Crítico (Completa):

```javascript
CHANCE_BASE = 5%

+0.3% por ponto de FOCO
Exemplo: 30 foco = +9% = 14% total

+10% se VINCULO >= 80

×0.5 (redução de 50%) se EXAUSTAO >= 60

CAP MÁXIMO: 50%
```

### Exemplo:
```
Avatar: 40 foco, 85 vínculo, 20 exaustão

Cálculo:
- Base: 5%
- Foco: 40 × 0.3% = 12%
- Vínculo: +10%
- Total: 5% + 12% + 10% = 27%
- Exaustão < 60: sem penalidade
CHANCE FINAL: 27%
```

### Multiplicador de Crítico:
```
DANO_CRITICO = DANO_NORMAL × 2.0
```

---

## ⚡ VANTAGEM ELEMENTAL

### Multiplicadores de Dano:

| Situação | Multiplicador |
|----------|--------------|
| **Oposto** (Luz vs Sombra) | ×2.0 |
| **Void vs Aether** ou vice-versa | ×1.4 |
| **Super Efetivo** | ×1.5 |
| **Neutro / Mesmo Elemento** | ×1.0 |
| **Resistente** | ×0.85 |
| **Pouco Efetivo** | ×0.75 |

### Tabela de Vantagens:

#### Elementos Básicos:
- **Fogo** → Forte vs **Vento** | Fraco vs **Água**
- **Água** → Forte vs **Fogo** | Fraco vs **Eletricidade**
- **Terra** → Forte vs **Eletricidade** | Fraco vs **Vento**
- **Vento** → Forte vs **Terra** | Fraco vs **Fogo**
- **Eletricidade** → Forte vs **Água** | Fraco vs **Terra**

#### Elementos Especiais:
- **Luz** ↔ **Sombra**: Opostos (×2.0 entre si)
- **Luz** → Forte vs **Void**
- **Void** → Forte vs **Luz** e **Sombra** | Fraco vs **Aether**
- **Aether** → Forte vs **Void**

---

## ✨ SINERGIAS 9×9

**Arquivos:** `/lib/combat/synergySystem.js` + `/lib/combat/synergyApplicator.js`

### O que são Sinergias?

No PVP (e opcionalmente no Treinamento), você escolhe **2 avatares**:
- **Avatar Principal:** Quem entra em batalha
- **Avatar Suporte:** Fica fora, mas dá bônus ao Principal

A **sinergia** é a combinação dos **elementos** desses dois avatares.

**Matriz:** 9 elementos × 9 elementos = **81 sinergias únicas**!

---

### Estrutura de uma Sinergia

Cada sinergia possui:

```javascript
{
  nome: "Nome da Sinergia",
  vantagem1: { tipo, valor },      // Primeiro bônus
  vantagem2: { tipo, valor },      // Segundo bônus
  desvantagem: { tipo, valor },    // Penalidade (ou null)
  descricao: "Descrição temática"
}
```

**Sinergias Perfeitas:** Algumas combinações **não têm desvantagem** (desvantagem: null)!

---

### Multiplicador de Raridade

Os valores da sinergia são **amplificados** pela raridade do Avatar Principal:

| Raridade | Multiplicador | Efeito |
|----------|---------------|--------|
| **Comum** | ×1.0 | Valores base da sinergia |
| **Raro** | ×1.2 | +20% nos bônus E penalidades |
| **Lendário** | ×1.4 | +40% nos bônus E penalidades |

**Exemplo:**
```
Sinergia: Combustão Intensa (Fogo + Fogo)
- Vantagem1: +25% Dano
- Avatar Comum: +25% Dano
- Avatar Raro: +30% Dano (25% × 1.2)
- Avatar Lendário: +35% Dano (25% × 1.4)
```

---

### Tipos de Modificadores

#### Modificadores do Jogador (Positivos):

| Tipo | Efeito | Exemplo |
|------|--------|---------|
| **dano** | +% Dano causado | +25% Dano |
| **hp** | +% HP Máximo | +20% HP Máx |
| **energia** | +% Energia Máxima | +15% Energia |
| **resistencia** | +% Resistência/Defesa | +30% Resistência |
| **evasao** | +% Evasão | +25% Evasão |
| **roubo_vida** | +% Roubo de Vida | +20% Roubo Vida |
| **cura** | +% Cura recebida | +30% Cura |

#### Modificadores do Inimigo (Negativos):

| Tipo | Efeito | Exemplo |
|------|--------|---------|
| **dano_inimigo** | -% Dano do inimigo | -10% Dano Inimigo |
| **resistencia_inimigo** | -% Resistência inimiga | -15% Resist. Inimiga |
| **evasao_inimigo** | -% Evasão inimiga | -20% Evasão Inimiga |
| **energia_inimigo** | -% Energia inicial inimiga | -25% Energia Inimiga |

**Observação:** Modificadores do inimigo são aplicados NO INÍCIO da batalha!

---

### Exemplos de Sinergias

#### 🔥 Combustão Intensa (Fogo + Fogo)
```
Vantagens:
  +25% Dano
  +15% Resistência
Desvantagem:
  -20% Energia Máxima

Descrição: Chamas se alimentam de chamas
```

#### 💧 Fonte da Vida (Água + Aether)
```
Vantagens:
  +35% Cura
  +15% HP Máximo
Desvantagem:
  -20% Dano

Descrição: Água primordial restauradora
```

#### ⚡ Sobrecarga (Eletricidade + Eletricidade)
```
Vantagens:
  +30% Dano
  +25% Energia Máxima
Desvantagem:
  -10% HP Máximo

Descrição: Poder elétrico extremo
```

#### 🌟 Radiância Suprema (Luz + Luz) - **PERFEITA**
```
Vantagens:
  +20% Dano
  +30% Cura
Desvantagem:
  NENHUMA

Descrição: Luz absoluta purificadora
```

#### 🌑 Eclipse Total (Luz + Sombra)
```
Vantagens:
  +40% Dano
  -30% Resistência Inimiga
Desvantagem:
  -25% Resistência

Descrição: Opostos em conflito caótico
```

#### 💀 Colapso do Vazio (Void + Void)
```
Vantagens:
  +45% Dano
  -40% Resistência Inimiga
Desvantagem:
  -35% HP Máximo

Descrição: Vazio consumindo vazio
```

#### 🌈 Paradoxo Dimensional (Void + Aether) - **MAIS FORTE**
```
Vantagens:
  +50% Dano
  -40% Resistência Inimiga
Desvantagem:
  -40% HP Máximo

Descrição: Opostos dimensionais
```

---

### Sinergias Perfeitas (Sem Desvantagem)

Lista de combinações que **NÃO têm penalidade**:

1. **Fogo + Luz** → Chama Solar
2. **Fogo + Aether** → Chama Primordial
3. **Água + Vento** → Tempestade Gélida
4. **Vento + Água** → Ciclone Úmido
5. **Vento + Aether** → Sopro Primordial
6. **Eletricidade + Luz** → Raio Divino
7. **Eletricidade + Aether** → Corrente Primordial
8. **Luz + Fogo** → Chama Sagrada
9. **Luz + Eletricidade** → Julgamento Divino
10. **Luz + Luz** → Radiância Suprema
11. **Luz + Aether** → Luz da Criação
12. **Aether + Fogo** → Chama da Criação
13. **Aether + Vento** → Sopro da Vida
14. **Aether + Eletricidade** → Faísca Divina
15. **Aether + Luz** → Gênese Radiante
16. **Aether + Aether** → Transcendência

---

### Como Sinergias Afetam os Cálculos

#### 1. HP Máximo
```javascript
HP_COM_SINERGIA = HP_BASE × (1 + hp_mult)

Exemplo:
HP Base: 600
Sinergia: +20% HP
HP Final: 600 × 1.2 = 720
```

#### 2. Energia Máxima
```javascript
ENERGIA_COM_SINERGIA = ENERGIA_BASE × (1 + energia_mult)

Exemplo:
Energia Base: 100
Sinergia: +25% Energia
Energia Final: 100 × 1.25 = 125
```

#### 3. Dano
```javascript
DANO_COM_SINERGIA = DANO_BASE × (1 + dano_mult)

Exemplo:
Dano Base: 80
Sinergia: +30% Dano
Dano Final: 80 × 1.3 = 104
```

#### 4. Resistência
```javascript
// Jogador
RESISTENCIA_JOGADOR = RESISTENCIA_BASE × (1 + resistencia_mult)

// Inimigo
RESISTENCIA_INIMIGO = RESISTENCIA_BASE × (1 - resistencia_inimigo_reducao)

Exemplo:
Resistência Inimigo: 50
Sinergia: -15% Resist. Inimiga
Resistência Final: 50 × 0.85 = 42.5 → 42
```

#### 5. Evasão
```javascript
// Jogador
EVASAO_JOGADOR = EVASAO_BASE × (1 + evasao_mult)

// Inimigo
EVASAO_INIMIGO = EVASAO_BASE × (1 - evasao_inimigo_reducao)
```

#### 6. Roubo de Vida
```javascript
ROUBO = DANO_CAUSADO × roubo_vida_percent

Exemplo:
Dano: 100
Sinergia: +20% Roubo Vida
Roubo: 100 × 0.20 = 20 HP recuperados
```

#### 7. Cura
```javascript
CURA_COM_SINERGIA = CURA_BASE × (1 + cura_mult)

Exemplo:
Cura Base: 50
Sinergia: +35% Cura
Cura Final: 50 × 1.35 = 67.5 → 67
```

#### 8. Energia Inicial do Inimigo
```javascript
ENERGIA_INIMIGO = 100 × (1 - energia_inimigo_reducao)

Exemplo:
Energia Base: 100
Sinergia: -25% Energia Inimiga
Energia Inicial Inimigo: 100 × 0.75 = 75
```

---

### Ordem de Aplicação (Importante!)

```
1. Stats Base do Avatar
2. Bônus de Vínculo
3. Penalidades de Exaustão
4. SINERGIAS ← Aplicadas aqui
5. Buffs/Debuffs de combate
6. Cálculos finais de dano/acerto
```

**Exemplo Completo:**
```
Avatar Fogo Lendário + Suporte Fogo
Stats Base: 50 Força, 600 HP
Vínculo 80: +15% stats = 57.5 Força
Exaustão 20: sem penalidade
Sinergia (Combustão Intensa ×1.4):
  - +35% Dano (25% × 1.4)
  - +21% Resistência (15% × 1.4)
  - -28% Energia (20% × 1.4)

HP: 600 (sem mod de sinergia)
Energia: 100 × 0.72 = 72
Dano: calculado com +35% no final
```

---

### Estratégias de Sinergia

#### 1. **Ataque Puro** (Alto Dano)
- Void + Void: +45% Dano, -40% Resist. Inimiga
- Void + Aether: +50% Dano, -40% Resist. Inimiga
- Luz + Sombra: +40% Dano, -30% Resist. Inimiga

**Trade-off:** Perda significativa de HP (-30% a -40%)

---

#### 2. **Tank/Defesa** (Alto HP/Resistência)
- Terra + Terra: +30% Resistência, +20% HP
- Terra + Aether: +30% Resistência, +30% HP
- Luz + Terra: +25% Resistência, +20% HP (com cura)

**Trade-off:** Baixa evasão (-15% a -20%)

---

#### 3. **Suporte/Cura**
- Água + Aether: +35% Cura, +15% HP
- Luz + Luz: +20% Dano, +30% Cura (SEM desvantagem!)
- Luz + Água: +30% Cura, +20% Resistência

**Trade-off:** Dano reduzido (-20% a -25%)

---

#### 4. **Evasão/Velocidade**
- Vento + Vento: +20% Dano, +30% Evasão
- Vento + Aether: +35% Evasão, +25% Energia (SEM desvantagem!)
- Sombra + Vento: +30% Evasão, +20% Roubo Vida

**Trade-off:** Resistência reduzida (-15% a -20%)

---

#### 5. **Drenagem/Roubo de Vida**
- Sombra + Sombra: +25% Dano, +35% Roubo Vida
- Sombra + Void: +35% Dano, +40% Roubo Vida
- Sombra + Água: +12% Dano, +25% Roubo Vida

**Trade-off:** HP ou Energia reduzidos (-15% a -30%)

---

#### 6. **Controle/Debuff Inimigo**
- Água + Void: +20% Dano, -30% Energia Inimiga
- Eletricidade + Void: +32% Dano, -35% Energia Inimiga
- Terra + Void: +28% Dano, -30% Evasão Inimiga

**Trade-off:** Evasão própria reduzida (-30% a -35%)

---

### Matriz Completa (Resumo)

**81 combinações únicas** - Aqui estão as mais notáveis:

| Principal | Suporte | Nome | Destaque |
|-----------|---------|------|----------|
| Void | Aether | Paradoxo Dimensional | Maior dano (+50%) |
| Void | Void | Colapso do Vazio | +45% Dano |
| Luz | Sombra | Eclipse Total | +40% Dano |
| Sombra | Luz | Crepúsculo Caótico | +45% Dano |
| Sombra | Void | Abismo das Almas | +35% Dano, +40% Roubo |
| Água | Aether | Fonte da Vida | +35% Cura |
| Terra | Aether | Fundação Primordial | +30% Resist, +30% HP |
| Vento | Aether | Sopro Primordial | +35% Evasão (Perfeita) |
| Luz | Luz | Radiância Suprema | +30% Cura (Perfeita) |

---

### Verificação em Combate

No início da batalha, você vê no log:

```
✨ Combustão Intensa (+35% Dano, +21% Resistência | -28% Energia Máxima)
```

**Onde:**
- ✨ = Sinergia ativa
- Nome da sinergia
- Vantagens listadas
- Desvantagem (se houver) após "|"

---

## 🛡️ BUFFS E DEBUFFS

### Modificadores de Stats

Buffs e debuffs afetam stats através de **multiplicadores**:

```javascript
STATS_MODIFICADOS = {
  forca: stat_base × modificador,
  agilidade: stat_base × modificador,
  resistencia: stat_base × modificador,
  foco: stat_base × modificador,
  evasao: valor_base + bonus_evasao,
  acerto: multiplicador
}
```

### Lista Completa de Buffs:

| Buff | Efeito | Duração Padrão |
|------|--------|----------------|
| **Defesa Aumentada** 🛡️ | +50% Resistência | 3 turnos |
| **Evasão Aumentada** 💨 | +30% Evasão | 3 turnos |
| **Velocidade Aumentada** ⚡ | +40% Agilidade | 3 turnos |
| **Benção** ✨ | +20% TODOS os stats | 3 turnos |
| **Sobrecarga** ⚡🔴 | +60% Foco, -30% Resistência | 3 turnos |
| **Precisão Aumentada** 🎯 | +30% Acerto | 3 turnos |
| **Invisível** 👻 | Evasão 100% | 2 turnos |
| **Postura Defensiva** 🛡️ | +50% Resistência | 1 turno |
| **Regeneração** 💚 | +5% HP/turno | 3 turnos |
| **Auto-Cura** 💚✨ | +8% HP/turno | 3 turnos |

### Lista Completa de Debuffs:

| Debuff | Efeito | Duração Padrão |
|--------|--------|----------------|
| **Queimadura** 🔥 | -5% HP/turno | 3 turnos |
| **Queimadura Intensa** 🔥🔥 | -10% HP/turno | 3 turnos |
| **Afogamento** 💧 | -8% HP/turno | 3 turnos |
| **Maldito** 💀 | -7% HP/turno + Impede Cura | 3 turnos |
| **Eletrocução** ⚡💀 | -6% HP/turno | 3 turnos |
| **Lentidão** 🐌 | -40% Agilidade | 3 turnos |
| **Enfraquecido** ⬇️ | -25% TODOS os stats | 3 turnos |
| **Desorientado** 🌀 | -30% Acerto | 3 turnos |
| **Terror** 😱 | -35% TODOS os stats | 3 turnos |
| **Congelado** ❄️ | Impede ação (pula turno) | 1-2 turnos |
| **Atordoado** 💫 | Pula turno | 1 turno |
| **Paralisia** ⚡ | 30% chance de falhar ação | 2 turnos |
| **Paralisia Intensa** ⚡⚡ | 60% chance de falhar ação | 2 turnos |

### Processamento de Efeitos:

**No início do turno:**
1. Processa cura contínua (buffs)
2. Processa dano contínuo (debuffs)
3. Reduz duração de todos os efeitos em 1
4. Remove efeitos com duração 0

---

## 🤝 VÍNCULO E EXAUSTÃO

### Sistema de Vínculo

#### Bônus de Stats:

| Nível | Vínculo | Bônus Stats | Bônus Dano | Bônus Crítico |
|-------|---------|-------------|------------|---------------|
| **Desconfiado** | 0-19 | -10% | 0% | 0% |
| **Distante** | 20-39 | 0% | 0% | 0% |
| **Neutro** | 40-59 | +5% | 0% | 0% |
| **Amigável** | 60-79 | +10% | +10% | 0% |
| **Alma Gêmea** | 80-100 | +15% | +20% | +10% |

#### Penalidades de Vínculo Baixo:
```
Se vínculo < 20:
- 5% de chance de recusar comando
- Gasta metade da energia da ação
```

### Sistema de Exaustão

#### Penalidades de Stats:

| Nível | Exaustão | Penalidade Stats | Energia Máxima | Crítico |
|-------|----------|------------------|----------------|---------|
| **Descansado** | 0-19 | 0% | 100 | Normal |
| **Cansado** | 20-39 | -5% | 100 | Normal |
| **Fatigado** | 40-59 | -10% | 100 | Normal |
| **Exausto** | 60-79 | -20% | -20% (80) | ×0.5 |
| **Esgotado** | 80-100 | -40% | -40% (60) | ×0.5 |

#### Penalidades de Dano:

Aplicadas **APÓS** todos os outros cálculos:

```javascript
if (exaustao >= 80) dano *= 0.5;  // -50%
else if (exaustao >= 60) dano *= 0.75;  // -25%
```

---

## 🎭 EFEITOS DE STATUS

### Categorias de Efeitos:

#### 1. Dano Contínuo
- Causa dano percentual do HP máximo por turno
- Exemplos: Queimadura, Afogamento, Eletrocução

#### 2. Cura Contínua
- Recupera percentual do HP máximo por turno
- Exemplos: Regeneração, Auto-Cura

#### 3. Buffs
- Aumenta stats ou capacidades
- Exemplos: Defesa Aumentada, Velocidade Aumentada

#### 4. Debuffs
- Reduz stats ou capacidades
- Exemplos: Lentidão, Enfraquecido, Desorientado

#### 5. Controle
- Impede ou dificulta ações
- Exemplos: Congelado, Atordoado, Paralisia

#### 6. Especiais
- Efeitos únicos mecânicos
- Exemplos: Roubo de Vida, Perfuração, Execução, Invisível

### Efeitos Especiais Detalhados:

#### Roubo de Vida 🩸
```
Cura = Dano × Percentual
- Roubo de Vida: 15%
- Roubo de Vida Intenso: 30%
- Roubo de Vida Massivo: 50%
```

#### Perfuração 🗡️
```
Ignora 40% da defesa do alvo
resistencia_efetiva = resistencia × 0.6
```

#### Execução 💀
```
Se HP do alvo <= 30%:
  Dano × 1.5 (+50%)
```

#### Dano Massivo 💥💥
```
Dano × 1.5 (+50%)
```

#### Invisível 👻
```
Evasão = 100% (todos os ataques erram)
```

#### Maldito 💀
```
Dano contínuo -7% HP/turno
+ Impede qualquer cura
```

---

## 🎮 TIPOS DE AÇÕES

### 1. Ataque Básico ⚔️

**Características:**
- Custo: 0 energia
- Recupera: +10 energia
- Dano base: 20
- Multiplicador stat: 0.8
- Dificuldade: 8 (mais fácil de acertar)

**Quando usar:**
- Quando sem energia para habilidades
- Para recuperar energia enquanto causa dano

---

### 2. Habilidade 🔥

**Características:**
- Custo: 20-60 energia (varia)
- Recupera: 0 energia (exceto algumas específicas)
- Dano: Depende da habilidade
- Efeitos: Pode aplicar buffs/debuffs

**Tipos de Habilidade:**

#### a) Ofensivas
- Causam dano direto
- Precisam acertar (teste d20)
- Podem ter efeitos adicionais

#### b) Defensivas
- Aplicam buffs de defesa
- Sempre funcionam (sem teste acerto)
- Exemplos: Armadura de Pedra, Escudo Flamejante

#### c) Suporte
- Curam ou aplicam buffs
- Sempre funcionam
- Algumas recuperam energia

---

### 3. Defender 🛡️

**Efeitos:**
- Custo: 0 energia
- Recupera: +20 energia
- Aplica buff: **Postura Defensiva**
  - +50% Resistência
  - Duração: 1 turno (apenas próximo ataque)

**Quando usar:**
- Quando com pouca energia
- Quando espera receber ataque forte
- Para recuperar energia defensivamente

---

### 4. Esperar/Recarregar ⚡

**Efeitos:**
- Custo: 0 energia
- Recupera: +35 energia
- Sem buffs/efeitos

**Quando usar:**
- Quando sem energia para habilidades
- Quando quer preparar combo de habilidades

---

## 🏆 CONDIÇÕES DE VITÓRIA

### 1. Derrota por HP

```javascript
if (HP <= 0) → DERROTA
```

**Observação:** HP nunca fica negativo, mínimo é 1 (corrigido após verificação).

---

### 2. Vitória por Pontos (Tempo Esgotado)

Se `rodada >= 20`:

```javascript
HP_PERCENT_JOGADOR = HP_atual / HP_maximo
HP_PERCENT_INIMIGO = HP_atual / HP_maximo

if (HP_PERCENT_JOGADOR > HP_PERCENT_INIMIGO) → VITORIA
else if (HP_PERCENT_INIMIGO > HP_PERCENT_JOGADOR) → DERROTA
else → EMPATE
```

---

### 3. Empate Mútuo

```javascript
if (jogador.HP <= 0 && inimigo.HP <= 0) → EMPATE
```

---

## 🎲 EXEMPLO DE TURNO COMPLETO

### Cenário:
**Avatar Jogador:**
- Elemento: Fogo 🔥
- Nível: 5
- Stats: Força 50, Agilidade 30, Resistência 40, Foco 35
- HP: 600/750 (80%)
- Energia: 45/100
- Vínculo: 75 (Amigável)
- Exaustão: 25 (Cansado)
- Buffs: Nenhum
- Debuffs: Queimadura (2 turnos, -5% HP/turno)

**Avatar Inimigo:**
- Elemento: Água 💧
- Nível: 5
- Stats: Força 45, Agilidade 35, Resistência 50, Foco 30
- HP: 800/900 (89%)
- Energia: 60/100
- Buffs: Defesa Aumentada (1 turno, +50% Resistência)

---

### TURNO DO JOGADOR

#### Início do Turno:

**1. Processar efeitos contínuos:**
```
Queimadura: -5% HP
Dano = 750 × 0.05 = 37.5 → 37
HP: 600 - 37 = 563

Reduzir duração:
Queimadura: 2 → 1 turno restante
```

**Estado atualizado:**
- HP: 563/750 (75%)
- Energia: 45/100

---

#### Ação: Usar Habilidade "Meteoro Flamejante"

**Habilidade:**
- Dano base: 40
- Stat primário: Força
- Multiplicador: 1.2
- Custo: 40 energia
- Efeitos: Queimadura Intensa (2 turnos)

---

**ETAPA 1: Verificar Energia**
```
Energia atual: 45
Custo: 40
✅ Energia suficiente
```

---

**ETAPA 2: Teste de Acerto (d20)**

**Rolagem do Atacante:**
```
d20: 14 (aleatório 1-20)
Bônus Foco: floor(35 / 5) = 7
Bônus Acerto: 0 (sem buffs)
Total: 14 + 7 = 21
```

**Dificuldade do Defensor:**
```
Base: 10
Bônus Evasão: floor(35 / 4) = 8
Evasão Extra: 0
Total: 10 + 8 = 18
```

**Resultado:** 21 >= 18 → ✅ ACERTA

---

**ETAPA 3: Verificar Crítico**

**Chance de Crítico:**
```
Base: 5%
Foco: 35 × 0.3% = 10.5%
Vínculo (75): 0% (precisa 80+)
Total: 15.5%

Rolagem: 0.87 (87%)
87% > 15.5% → ❌ NÃO É CRÍTICO
```

---

**ETAPA 4: Calcular Dano**

**Passo 1: Dano Base + Stats**
```
Base: 40
Stat (Força): 50 × 1.2 = 60
Nível: 5 × 2 = 10
Subtotal: 40 + 60 + 10 = 110
```

**Passo 2: Vantagem Elemental**
```
Fogo vs Água = 0.75 (Pouco efetivo)
Dano: 110 × 0.75 = 82.5 → 82
```

**Passo 3: Redução de Defesa**

Resistência do inimigo (COM BUFF):
```
Resistência base: 50
Buff Defesa Aumentada: +50%
Resistência efetiva: 50 × 1.5 = 75
```

Redução:
```
Redução = min(75 × 0.5, 82 × 0.5)
Redução = min(37.5, 41)
Redução = 37.5 → 37
```

Dano pós-defesa:
```
82 - 37 = 45
```

**Passo 4: Bônus de Vínculo (75)**
```
Amigável: +10% dano
45 × 1.1 = 49.5 → 49
```

**Passo 5: Penalidade de Exaustão (25)**
```
Cansado: -5% stats (já aplicado anteriormente)
Sem penalidade adicional de dano
Dano final: 49
```

---

**ETAPA 5: Aplicar Dano e Efeitos**

**Dano:**
```
HP Inimigo: 800 - 49 = 751
```

**Aplicar Efeito:**
```
Queimadura Intensa (2 turnos) aplicada ao inimigo
```

**Gastar Energia:**
```
Energia Jogador: 45 - 40 = 5
```

---

**RESULTADO DO TURNO:**

```
🎲 14+7 = 21 | Ifrit usou Meteoro Flamejante!
⚔️ 49 de dano (Pouco efetivo...)
| Efeitos: 🔥🔥 Queimadura Intensa
```

**Estado Final:**
- **Jogador:** HP 563/750 | Energia 5/100 | Debuff: Queimadura (1)
- **Inimigo:** HP 751/900 | Energia 60/100 | Buff: Defesa (0 → removido) | Debuff: Queimadura Intensa (2)

---

## 📊 RESUMO DOS FATORES DE CÁLCULO

### Ao Calcular Dano, o sistema considera:

1. ✅ **Dano Base da Habilidade**
2. ✅ **Stats do Avatar** (Força, Agilidade, Resistência, Foco)
3. ✅ **Nível do Avatar**
4. ✅ **Vantagem Elemental** (0.5x a 2.0x)
5. ✅ **SINERGIAS** (+0% a +50% dano, modificadores diversos) ⭐
6. ✅ **Crítico** (5% base + bônus de Foco + bônus de Vínculo)
7. ✅ **Resistência do Defensor** (reduz até 50% do dano, modificada por sinergias)
8. ✅ **Buffs de Ataque** (Benção, Sobrecarga, etc)
9. ✅ **Buffs de Defesa** (Defesa Aumentada, Postura Defensiva)
10. ✅ **Debuffs** (Enfraquecido, Terror, Lentidão)
11. ✅ **Vínculo** (+0% a +20% dano, +0% a +15% stats)
12. ✅ **Exaustão** (-0% a -50% dano, -0% a -40% stats)
13. ✅ **Efeitos Especiais** (Perfuração, Execução, Dano Massivo)
14. ✅ **Múltiplos Golpes** (algumas habilidades)
15. ✅ **Roubo de Vida** (cura baseada no dano + bônus de sinergia)

### Ao Determinar Acerto, o sistema considera:

1. ✅ **Rolagem d20** (1-20 aleatório)
2. ✅ **Foco do Atacante** (+1 por 5 de foco)
3. ✅ **Buffs de Acerto** (Precisão Aumentada)
4. ✅ **Agilidade do Defensor** (+1 evasão por 4 de agilidade)
5. ✅ **Buffs de Evasão** (Evasão Aumentada, Invisível)
6. ✅ **Debuffs de Acerto** (Desorientado)

### A Cada Turno, o sistema processa:

1. ✅ **Efeitos de Cura Contínua** (Regeneração, Auto-Cura)
2. ✅ **Efeitos de Dano Contínuo** (Queimadura, Afogamento, etc)
3. ✅ **Redução de Duração** de todos os buffs/debuffs
4. ✅ **Remoção de Efeitos Expirados** (duração = 0)

---

## 🎯 CONSIDERAÇÕES FINAIS

### Sim, o sistema é MUITO complexo!

O sistema de batalha considera:
- **15 fatores** ao calcular dano
- **6 fatores** para acerto/evasão
- **81 sinergias únicas** (9×9 elementos)
- **30+ efeitos de status** (buffs/debuffs)
- **16 sinergias perfeitas** (sem desvantagem)

### Por que tanta complexidade?

1. **Profundidade Estratégica:** Múltiplas formas de vencer
   - Dano bruto (Void + Aether: +50%)
   - Tank/Defesa (Terra + Aether: +30% HP, +30% Resist)
   - Evasão (Vento + Aether: +35% Evasão)
   - Roubo de Vida (Sombra + Void: +40% Roubo)
   - Controle de Energia (Eletricidade + Void: -35% Energia Inimiga)

2. **Variabilidade:** Cada batalha é única
   - 81 combinações de sinergia
   - Vínculo (0-100) e Exaustão (0-100)
   - Vantagem elemental (×0.5 a ×2.0)
   - Raridade (Comum/Raro/Lendário)

3. **Progressão Significativa:**
   - Stats, vínculo e exaustão fazem diferença real
   - Raridade amplifica sinergias (×1.0 a ×1.4)
   - Cada nível aumenta HP (+10) e dano (+2)

4. **Escolhas Táticas:**
   - Escolha de dupla (Principal + Suporte)
   - Gerenciamento de energia
   - Timing de buffs/habilidades
   - Trade-offs de sinergia (vantagem vs desvantagem)

### Pontos de Simplificação Possíveis:

Se quiser reduzir complexidade, aqui estão os **principais candidatos**:

1. **Reduzir matriz de sinergias** → 9×9 (81) para 5×5 (25) - apenas elementos básicos
2. **Remover multiplicador de raridade** → Todas as sinergias com valores fixos
3. **Remover sistema d20** → Usar chance % simples de acerto
4. **Simplificar efeitos de status** → Reduzir de 30+ para 10-15 essenciais
5. **Unificar bônus de vínculo** → Aplicar apenas em stats OU dano, não ambos
6. **Remover críticos** → Ou tornar fixo (sempre 5%, sem modificadores)
7. **Simplificar defesa** → Usar % fixo ao invés de cálculo com resistência
8. **Limitar sinergias perfeitas** → Máximo 5-6 combinações sem desvantagem

---

**Arquivo gerado automaticamente pelo sistema PHA**
**Versão:** 2.0 - Agora com Sistema de Sinergias 9×9 completo!
