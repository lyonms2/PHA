# 📊 RELATÓRIO COMPLETO - SISTEMA DE BATALHA PHA

**Última atualização:** 2025-12-27
**Arquivo principal:** `/lib/arena/batalhaEngine.js`

---

## 📋 ÍNDICE

1. [Configurações Globais](#configurações-globais)
2. [Cálculo de HP Máximo](#cálculo-de-hp-máximo)
3. [Sistema de Energia](#sistema-de-energia)
4. [Cálculo de Dano](#cálculo-de-dano)
5. [Sistema de Acerto/Evasão](#sistema-de-acertoevasão)
6. [Críticos](#críticos)
7. [Vantagem Elemental](#vantagem-elemental)
8. [Buffs e Debuffs](#buffs-e-debuffs)
9. [Vínculo e Exaustão](#vínculo-e-exaustão)
10. [Efeitos de Status](#efeitos-de-status)
11. [Tipos de Ações](#tipos-de-ações)
12. [Condições de Vitória](#condições-de-vitória)

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
5. ✅ **Crítico** (5% base + bônus de Foco + bônus de Vínculo)
6. ✅ **Resistência do Defensor** (reduz até 50% do dano)
7. ✅ **Buffs de Ataque** (Benção, Sobrecarga, etc)
8. ✅ **Buffs de Defesa** (Defesa Aumentada, Postura Defensiva)
9. ✅ **Debuffs** (Enfraquecido, Terror, Lentidão)
10. ✅ **Vínculo** (+0% a +20% dano, +0% a +15% stats)
11. ✅ **Exaustão** (-0% a -50% dano, -0% a -40% stats)
12. ✅ **Efeitos Especiais** (Perfuração, Execução, Dano Massivo)
13. ✅ **Múltiplos Golpes** (algumas habilidades)
14. ✅ **Roubo de Vida** (cura baseada no dano causado)

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

### Sim, o sistema é complexo!

O sistema de batalha considera **14 fatores principais** ao calcular dano e **6 fatores** para acerto/evasão.

### Por que tanta complexidade?

1. **Profundidade Estratégica:** Múltiplas formas de vencer (dano bruto, sinergias, controle, atrito)
2. **Variabilidade:** Cada batalha é única devido à combinação de elementos/stats/vínculo/exaustão
3. **Progressão Significativa:** Stats, vínculo e exaustão fazem diferença real
4. **Escolhas Táticas:** Gerenciamento de energia, timing de buffs, combos

### Pontos de Simplificação Possíveis:

Se quiser reduzir complexidade, aqui estão os **principais candidatos**:

1. **Remover sistema d20** → Usar chance % simples de acerto
2. **Simplificar efeitos de status** → Reduzir de 30+ para 10-15 essenciais
3. **Unificar bônus de vínculo** → Aplicar apenas em stats OU dano, não ambos
4. **Remover críticos** → Ou tornar fixo (sempre 5%, sem modificadores)
5. **Simplificar defesa** → Usar % fixo ao invés de cálculo com resistência

---

**Arquivo gerado automaticamente pelo sistema PHA**
**Versão:** 1.0
