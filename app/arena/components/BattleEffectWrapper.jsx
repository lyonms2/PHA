"use client";

import { useState } from 'react';
import FloatingNumber from './FloatingNumber';
import ElementalEffect from './ElementalEffect';

/**
 * Wrapper que gerencia todos os efeitos visuais de batalha
 * Combina números flutuantes, efeitos elementais e shake do avatar
 */
export default function BattleEffectWrapper({ children, effect, className = "" }) {
  const [showNumber, setShowNumber] = useState(!!effect?.number);
  const [showElemental, setShowElemental] = useState(!!effect?.elemento);
  const [avatarShake, setAvatarShake] = useState(false);

  // Ativar shake quando recebe dano
  if (effect?.type === 'damage' || effect?.type === 'critical') {
    if (!avatarShake) {
      setAvatarShake(true);
      setTimeout(() => setAvatarShake(false), 400);
    }
  }

  // Ativar brilho quando cura
  const healGlow = effect?.type === 'heal';

  return (
    <div className={`relative ${className}`}>
      {/* Avatar com efeitos */}
      <div className={`
        ${avatarShake ? 'animate-avatar-hit' : ''}
        ${healGlow ? 'animate-avatar-heal' : ''}
      `}>
        {children}
      </div>

      {/* Número flutuante */}
      {showNumber && effect?.number && (
        <FloatingNumber
          value={effect.number}
          type={effect.type}
          onComplete={() => setShowNumber(false)}
        />
      )}

      {/* Efeito elemental */}
      {showElemental && effect?.elemento && (
        <ElementalEffect
          elemento={effect.elemento}
          intensity={effect.type === 'critical' ? 'critical' : 'normal'}
          onComplete={() => setShowElemental(false)}
        />
      )}
    </div>
  );
}
