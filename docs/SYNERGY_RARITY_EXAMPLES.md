# Sistema de Multiplicadores de Raridade para Sinergias

## Como Funciona

A raridade do **Avatar Principal** (quem está lutando) multiplica os valores das sinergias:

- **Comum**: 100% - valores base
- **Raro**: 120% - +20% nos valores
- **Lendário**: 140% - +40% nos valores

⚠️ **IMPORTANTE**: As desvantagens TAMBÉM são multiplicadas (risco/recompensa balanceado)

---

## Exemplo: Combustão Intensa (Fogo + Fogo)

### Valores Base (Comum):
- ✅ **+25% Dano**
- ✅ **+15% Resistência**
- ❌ **-20% Energia**

### Avatar Principal RARO (x1.2):
- ✅ **+30% Dano** (25% × 1.2)
- ✅ **+18% Resistência** (15% × 1.2)
- ❌ **-24% Energia** (-20% × 1.2)

### Avatar Principal LENDÁRIO (x1.4):
- ✅ **+35% Dano** (25% × 1.4)
- ✅ **+21% Resistência** (15% × 1.4)
- ❌ **-28% Energia** (-20% × 1.4)

---

## Exemplo: Eclipse Total (Luz + Sombra)

Uma das sinergias mais poderosas do jogo!

### Valores Base (Comum):
- ✅ **+40% Dano**
- ✅ **-30% Resistência Inimiga**
- ❌ **-25% Resistência Própria**

### Avatar Principal RARO (x1.2):
- ✅ **+48% Dano** (40% × 1.2)
- ✅ **-36% Resistência Inimiga** (-30% × 1.2)
- ❌ **-30% Resistência Própria** (-25% × 1.2)

### Avatar Principal LENDÁRIO (x1.4):
- ✅ **+56% Dano** (40% × 1.4) 🔥
- ✅ **-42% Resistência Inimiga** (-30% × 1.4) 🔥
- ❌ **-35% Resistência Própria** (-25% × 1.4) ⚠️

**RISCO EXTREMO, RECOMPENSA EXTREMA!**

---

## Exemplo: Sinergias Perfeitas (Sem Desvantagem)

Algumas sinergias não têm desvantagem. Exemplo: **Radiância Suprema** (Luz + Luz)

### Valores Base (Comum):
- ✅ **+20% Dano**
- ✅ **+30% Cura**
- ❌ **SEM DESVANTAGEM**

### Avatar Principal RARO (x1.2):
- ✅ **+24% Dano** (20% × 1.2)
- ✅ **+36% Cura** (30% × 1.2)
- ❌ **SEM DESVANTAGEM** ✨

### Avatar Principal LENDÁRIO (x1.4):
- ✅ **+28% Dano** (20% × 1.4)
- ✅ **+42% Cura** (30% × 1.4) 🌟
- ❌ **SEM DESVANTAGEM** ✨

**Sinergias perfeitas escalam MUITO BEM com raridade!**

---

## Estratégias

### 1. Dupla Lendária Perfeita
- **Melhor caso**: Dois avatares Lendários com sinergia perfeita
- **Exemplo**: Luz + Aether = +39.2% Dano, +42% Cura (SEM DESVANTAGEM)
- **Endgame absoluto!**

### 2. Alto Risco, Alta Recompensa
- **Sinergia**: Eclipse Total (Luz + Sombra) com avatar Lendário
- **Resultado**: +56% Dano DEVASTADOR, mas -35% de resistência própria
- **Use com**: Avatares com alta agilidade/evasão

### 3. Tank Imortal
- **Sinergia**: Rocha Eterna (Aether + Terra) com avatar Lendário
- **Resultado**: +42% Resistência, +35% HP Máximo
- **Praticamente indestrutível!**

### 4. Progressão Natural
- **Comum→Raro**: +20% de efetividade nas sinergias
- **Raro→Lendário**: +16.67% adicional
- **Evolução vale muito a pena!**

---

## Balanceamento

✅ **Por que as desvantagens também aumentam?**
- Mantém o **equilíbrio** do jogo
- Evita que Lendários sejam **invencíveis**
- Cria **decisões estratégicas** (vale o risco?)
- Recompensa **planejamento de equipe**

✅ **Por que apenas o Avatar Principal afeta?**
- Evita **dupla multiplicação** (seria muito OP)
- Avatar Suporte já dá o **bônus de sinergia**
- Incentiva **evolução do avatar principal**
- Mantém **clareza** no sistema

---

## Implementação Técnica

```javascript
// Multiplicadores definidos em: lib/combat/synergyApplicator.js
const MULTIPLICADORES_RARIDADE = {
  'Comum': 1.0,      // 100% - valores base
  'Raro': 1.2,       // 120% - +20% nos valores
  'Lendário': 1.4    // 140% - +40% nos valores
};

// Aplicação automática em:
// - aplicarSinergia(principal, suporte)
// - previewSinergia(elementoPrincipal, elementoSuporte, raridadePrincipal)

// Todos os sistemas de combate já suportam:
// - PVP (arena/pvp)
// - Treino IA (arena/treinamento)
// - Boss Battles (arena/desafios)
```

---

## Conclusão

Este sistema adiciona **profundidade estratégica** sem complicar o jogo:

1. ✅ Simples de entender (raridade maior = sinergia mais forte)
2. ✅ Incentiva evolução de avatares
3. ✅ Cria metas de longo prazo (duplas lendárias)
4. ✅ Balanceado (desvantagens também aumentam)
5. ✅ Compatível com todo o sistema existente
