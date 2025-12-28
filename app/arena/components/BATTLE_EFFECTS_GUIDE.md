# 🎨 Guia de Efeitos Visuais de Batalha

Sistema completo de efeitos visuais usando **CSS puro** - sem imagens ou GIFs necessários!

## 📦 Componentes Disponíveis

### 1. FloatingNumber
Números animados que aparecem sobre o avatar.

```jsx
import FloatingNumber from './FloatingNumber';

// Exemplo de uso
<div className="relative">
  <AvatarSVG avatar={avatar} />
  {damageEffect && (
    <FloatingNumber
      value={damageEffect.amount}
      type={damageEffect.type}
      onComplete={() => setDamageEffect(null)}
    />
  )}
</div>
```

**Tipos disponíveis:**
- `damage` - Dano normal (vermelho, -X)
- `critical` - Crítico (amarelo, 💥 -X, maior)
- `heal` - Cura (verde, +X)
- `miss` - Erro (cinza, "ERROU!")
- `dodge` - Esquiva (ciano, "ESQUIVOU!")
- `block` - Bloqueio (azul, 🛡️)

---

### 2. ElementalEffect
Efeitos visuais baseados no elemento do ataque.

```jsx
import ElementalEffect from './ElementalEffect';

<div className="relative">
  <AvatarSVG avatar={avatar} />
  {elementalEffect && (
    <ElementalEffect
      elemento={elementalEffect.elemento}
      intensity={elementalEffect.critical ? 'critical' : 'normal'}
      onComplete={() => setElementalEffect(null)}
    />
  )}
</div>
```

**Elementos disponíveis:**
- 🔥 `Fogo` - Flash vermelho + partículas subindo
- 💧 `Água` - Flash azul + ondas
- 🪨 `Terra` - Shake + poeira marrom
- 💨 `Vento` - Movimento lateral + rajadas
- ⚡ `Eletricidade` - Flash branco + raios piscando
- ✨ `Luz` - Brilho dourado radiante
- 🌑 `Sombra` - Escurecimento + névoa roxa
- 🌀 `Void` - Distorção espacial rotativa
- 🌟 `Aether` - Brilho multicolorido

---

### 3. BattleEffectWrapper (Recomendado)
Wrapper que combina tudo automaticamente.

```jsx
import BattleEffectWrapper from './BattleEffectWrapper';

// Estado do efeito
const [avatarEffect, setAvatarEffect] = useState(null);

// Quando ataque acontece
function handleAttack(damage, critical, elemento) {
  setAvatarEffect({
    type: critical ? 'critical' : 'damage',
    number: damage,
    elemento: elemento
  });

  // Limpar após 1 segundo
  setTimeout(() => setAvatarEffect(null), 1000);
}

// Render
<BattleEffectWrapper effect={avatarEffect}>
  <AvatarSVG avatar={avatar} tamanho={100} />
</BattleEffectWrapper>
```

---

## 🎮 Exemplos Práticos

### Ataque Normal
```javascript
// Quando jogador ataca e causa 15 de dano
setOpponentEffect({
  type: 'damage',
  number: 15,
  elemento: meuAvatar.elemento  // 'Fogo', 'Água', etc
});
```

### Ataque Crítico
```javascript
// Quando ataque é crítico (30 de dano)
setOpponentEffect({
  type: 'critical',
  number: 30,
  elemento: meuAvatar.elemento
});
```

### Cura
```javascript
// Quando avatar se cura (20 HP)
setMyEffect({
  type: 'heal',
  number: 20,
  elemento: null  // Não precisa de efeito elemental
});
```

### Miss/Esquiva
```javascript
// Quando ataque erra
setOpponentEffect({
  type: 'miss',
  number: null,  // Não mostra número
  elemento: null
});

// Ou quando avatar esquiva
setMyEffect({
  type: 'dodge',
  number: null,
  elemento: null
});
```

### Defender
```javascript
// Quando avatar defende
setMyEffect({
  type: 'block',
  number: null,
  elemento: null
});
```

---

## 🔧 Integração Completa (Exemplo)

```jsx
"use client";
import { useState } from 'react';
import AvatarSVG from '@/app/components/AvatarSVG';
import BattleEffectWrapper from '@/app/arena/components/BattleEffectWrapper';

export default function BattlePage() {
  const [myEffect, setMyEffect] = useState(null);
  const [opponentEffect, setOpponentEffect] = useState(null);

  async function handleAttack() {
    // Chamar API de ataque
    const result = await fetch('/api/battle/attack', { method: 'POST' });
    const data = await result.json();

    // Mostrar efeito no oponente
    setOpponentEffect({
      type: data.critico ? 'critical' : 'damage',
      number: data.dano,
      elemento: myAvatar.elemento
    });

    // Limpar após 1s
    setTimeout(() => setOpponentEffect(null), 1000);
  }

  return (
    <div className="battle-screen">
      {/* MEU AVATAR */}
      <BattleEffectWrapper effect={myEffect}>
        <AvatarSVG avatar={myAvatar} tamanho={100} />
      </BattleEffectWrapper>

      {/* AVATAR OPONENTE */}
      <BattleEffectWrapper effect={opponentEffect}>
        <AvatarSVG avatar={opponentAvatar} tamanho={100} />
      </BattleEffectWrapper>

      {/* Botões de ação */}
      <button onClick={handleAttack}>Atacar</button>
    </div>
  );
}
```

---

## 🎨 Personalizações Avançadas

### Ajustar duração das animações
Edite `/app/globals.css` e modifique os keyframes:

```css
.animate-float-up {
  animation: float-up 2s ease-out forwards;  /* Era 1s */
}
```

### Criar novo tipo de efeito
Em `FloatingNumber.jsx`, adicione à configuração:

```javascript
const configs = {
  // ... outros tipos
  shield: {
    color: 'text-blue-300',
    prefix: '🛡️ ',
    size: 'text-2xl',
    animation: 'animate-bounce-in',
    glow: 'drop-shadow-[0_0_8px_rgba(147,197,253,0.8)]'
  }
};
```

---

## ✅ Checklist de Implementação

- [ ] Importar `BattleEffectWrapper` na página de batalha
- [ ] Criar states para `myEffect` e `opponentEffect`
- [ ] Atualizar funções de ataque para definir os efeitos
- [ ] Testar com diferentes elementos
- [ ] Testar críticos, miss, heal
- [ ] Ajustar timings se necessário

---

## 🎯 Próximas Melhorias Possíveis

- [ ] Sons de impacto por elemento
- [ ] Câmera shake em críticos
- [ ] Combo counters
- [ ] Status icons (buffs/debuffs)
- [ ] Victory/Defeat animations

---

**Tudo 100% CSS - Zero imagens necessárias!** 🎨✨
