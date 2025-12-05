# 🎮 Combat Core - Biblioteca Centralizada de Combate

Sistema centralizado de combate usado por **todos** os modos de batalha do jogo.

## 📁 Estrutura

```
/lib/combat/core/
├── damageCalculator.js   (231 linhas) - Cálculo de dano, cura e modificadores
├── hitChecker.js         (103 linhas) - Sistema de acerto/esquiva
└── elementalSystem.js     (37 linhas) - Vantagens elementais
```

## 🎯 Uso

**Modo Treinamento IA:**
```javascript
// /lib/combat/battle/engine.js
import { testarAcertoAtaque } from '@/lib/combat/core/hitChecker';
import { calcularDanoAtaque } from '@/lib/combat/core/damageCalculator';
```

**Modo PVP:**
```javascript
// /app/api/pvp/room/state/handlers/handleAttack.js
import { testarAcertoAtaque } from '@/lib/combat/core/hitChecker';
import { calcularDanoAtaque } from '@/lib/combat/core/damageCalculator';
```

## ⚙️ Funções Disponíveis

### damageCalculator.js
- `calcularDanoAtaque()` - Dano de ataque básico
- `calcularDanoHabilidade()` - Dano de habilidades
- `calcularCuraHabilidade()` - Cura de habilidades
- Aplicação de modificadores: exaustão, vínculo, elemental, crítico, bloqueio

### hitChecker.js
- `testarAcertoAtaque()` - Verifica se ataque básico acerta
- `testarAcertoHabilidade()` - Verifica se habilidade acerta
- Lógica de evasão, invisibilidade, buffs

### elementalSystem.js
- `calcularMultiplicadorElemental()` - Calcula vantagem elemental
- Matriz de vantagens/desvantagens entre elementos

## 📊 Impacto da Consolidação

**Antes:**
- ❌ `damageCalculator.js` duplicado em 2 lugares (462 linhas)
- ❌ `hitChecker.js` duplicado em 2 lugares (206 linhas)
- ❌ `elementalSystem.js` duplicado em 2 lugares (74 linhas)
- ❌ **Total: ~742 linhas duplicadas**

**Depois:**
- ✅ Arquivo único para cada módulo
- ✅ **~742 linhas eliminadas**
- ✅ Garantia de consistência entre modos
- ✅ Manutenção centralizada

## 🚀 Benefícios

1. **Consistência**: Mesmos cálculos em PVP e Treinamento
2. **Manutenção**: Uma mudança afeta todos os modos
3. **Balanceamento**: Ajustes centralizados facilitam equilíbrio
4. **Redução de Bugs**: Sem inconsistências entre duplicatas
5. **Testes**: Testar uma vez garante todos os modos

## 📝 Histórico

- **2024-12-04**: Biblioteca criada consolidando duplicatas de `/lib/combat/battle/combat/` e `/app/api/pvp/room/state/combat/`
