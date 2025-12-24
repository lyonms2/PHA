# 🎮 DualCardBattleLayout - Layout de Batalha com Cards Empilhados

Layout cyberpunk/wasteland inspirado para batalhas com sistema de cards empilhados, onde o avatar principal aparece no card de "Ataque" e o avatar suporte aparece atrás no card de "Suporte".

## ✨ Características

### Visual
- 🎨 Estilo cyberpunk/wasteland com gradientes roxos
- 💳 Cards empilháveis (Ataque na frente, Suporte atrás)
- 🖱️ Clique nos cards para alternar qual está ativo
- ⚡ Animações suaves de transição
- 📱 Responsivo

### Funcionalidades
- ✅ Mostra avatar principal e suporte de cada lado
- ✅ Barras de HP e Energia em tempo real
- ✅ Efeitos de status visualizados
- ✅ Cooldowns de habilidades
- ✅ Log de batalha lateral
- ✅ Controles de ação (Atacar, Defender, Habilidades)

## 📦 Como Usar

### Exemplo no Treinamento IA

```jsx
import DualCardBattleLayout from '@/app/arena/components/DualCardBattleLayout';

function BatalhaTreinamento() {
  // ... seus states de batalha ...

  return (
    <DualCardBattleLayout
      // Avatares do jogador
      meuAvatar={playerAvatar}
      meuAvatarSuporte={playerSupportAvatar}

      // Avatares do oponente
      iaAvatar={iaAvatar}
      iaAvatarSuporte={iaSupportAvatar}

      // Estados de batalha do jogador
      myHp={myHp}
      myHpMax={myHpMax}
      myEnergy={myEnergy}
      myEnergyMax={myEnergyMax}

      // Estados de batalha do oponente
      opponentHp={opponentHp}
      opponentHpMax={opponentHpMax}
      opponentEnergy={opponentEnergy}
      opponentEnergyMax={opponentEnergyMax}

      // Efeitos
      myEffects={myEffects}
      opponentEffects={opponentEffects}

      // Cooldowns
      playerCooldowns={playerCooldowns}
      iaCooldowns={iaCooldowns}

      // Estado do jogo
      isYourTurn={isYourTurn}
      status={status}
      currentTurn={currentTurn}

      // Ações
      onAttack={() => handleAction('attack')}
      onDefend={() => handleAction('defend')}
      onAbilityUse={(ability) => handleAbility(ability)}
      onSurrender={() => handleSurrender()}

      // Habilidades disponíveis
      playerAbilities={playerAbilities}

      // Log
      log={log}

      // Nomes (opcional)
      playerName="Você"
      opponentName="IA Treinador"
    />
  );
}
```

### Exemplo no PVP

```jsx
import DualCardBattleLayout from '@/app/arena/components/DualCardBattleLayout';

function DueloPVP() {
  // ... seus states de PVP ...

  return (
    <DualCardBattleLayout
      // Seus avatares
      meuAvatar={myMainAvatar}
      meuAvatarSuporte={mySupportAvatar}

      // Avatares do oponente
      iaAvatar={opponentMainAvatar}
      iaAvatarSuporte={opponentSupportAvatar}

      // Estados (mapeie do room state)
      myHp={room.player1.hp}
      myHpMax={room.player1.hp_maximo}
      myEnergy={room.player1.energia}
      myEnergyMax={100}

      opponentHp={room.player2.hp}
      opponentHpMax={room.player2.hp_maximo}
      opponentEnergy={room.player2.energia}
      opponentEnergyMax={100}

      // ... resto das props
      playerName={room.player1.nome}
      opponentName={room.player2.nome}
    />
  );
}
```

## 🎯 Props Completas

### Avatares
| Prop | Tipo | Descrição |
|------|------|-----------|
| `meuAvatar` | Object | Avatar principal do jogador (card de ataque) |
| `meuAvatarSuporte` | Object | Avatar suporte do jogador (card de suporte) |
| `iaAvatar` | Object | Avatar principal do oponente |
| `iaAvatarSuporte` | Object | Avatar suporte do oponente |

### Estados de Batalha
| Prop | Tipo | Descrição |
|------|------|-----------|
| `myHp` | Number | HP atual do jogador |
| `myHpMax` | Number | HP máximo do jogador |
| `myEnergy` | Number | Energia atual do jogador |
| `myEnergyMax` | Number | Energia máxima do jogador |
| `opponentHp` | Number | HP atual do oponente |
| `opponentHpMax` | Number | HP máximo do oponente |
| `opponentEnergy` | Number | Energia atual do oponente |
| `opponentEnergyMax` | Number | Energia máxima do oponente |

### Efeitos e Cooldowns
| Prop | Tipo | Descrição |
|------|------|-----------|
| `myEffects` | Array | Efeitos ativos no jogador `[{tipo: 'queimadura', duracao: 2}]` |
| `opponentEffects` | Array | Efeitos ativos no oponente |
| `playerCooldowns` | Object | Cooldowns das habilidades `{hab1: 2, hab2: 0}` |
| `iaCooldowns` | Object | Cooldowns do oponente |

### Estado do Jogo
| Prop | Tipo | Descrição |
|------|------|-----------|
| `isYourTurn` | Boolean | Se é o turno do jogador |
| `status` | String | Status da batalha: 'active', 'finished' |
| `currentTurn` | Number | Número do turno atual |

### Ações (Callbacks)
| Prop | Tipo | Descrição |
|------|------|-----------|
| `onAttack` | Function | Callback ao clicar em "Atacar" |
| `onDefend` | Function | Callback ao clicar em "Defender" |
| `onAbilityUse` | Function | Callback ao usar habilidade `(ability) => {}` |
| `onSurrender` | Function | Callback ao abandonar batalha |

### Outros
| Prop | Tipo | Descrição |
|------|------|-----------|
| `playerAbilities` | Array | Lista de habilidades disponíveis |
| `log` | Array | Array de mensagens do log `[{turno: 1, texto: '...'}]` |
| `playerName` | String | Nome do jogador (padrão: "Você") |
| `opponentName` | String | Nome do oponente (padrão: "Oponente") |

## 🎨 Personalização

### Cores por Tipo de Card

**Card de Ataque:**
- Border: `border-purple-500`
- Hover: `border-purple-400`
- Label: `text-purple-400`

**Card de Suporte:**
- Border: `border-green-500`
- Hover: `border-green-400`
- Label: `text-green-400`

### Animações

O componente inclui:
- ✨ Transições suaves entre cards (400ms)
- 📈 Scale up quando card de suporte fica ativo (105%)
- 🌊 Animação de slide-in para logs
- 💫 Pulse animation no "VS"

## 🔧 Funcionalidades Interativas

### Toggle de Cards
Clique em qualquer card para alternar:
- **Card de Ataque clicado:** Nada acontece (já está ativo)
- **Card de Suporte clicado:** Vem para frente, ataque fica opaco

### Estados Visuais
- ✅ **Botões desabilitados:** Quando não é seu turno ou batalha acabou
- ⏱️ **Cooldown visual:** Número em círculo vermelho nos botões
- ⚡ **Falta de energia:** Botão desabilitado se não tem energia

## 📱 Responsividade

O layout se adapta automaticamente:
- 🖥️ Desktop: Layout horizontal (battlefield | log)
- 📱 Mobile: Pode empilhar verticalmente

## 🚀 Próximas Melhorias (Opcionais)

- [ ] Animações de dano (shake, flash)
- [ ] Partículas ao usar habilidades
- [ ] Som effects (opcional)
- [ ] Indicador visual de "Seu Turno"
- [ ] Preview de habilidade ao hover

## 🎯 Exemplo Completo de Integração

Ver arquivo: `/app/arena/treinamento/batalha/page-dual-card.jsx` (exemplo)
