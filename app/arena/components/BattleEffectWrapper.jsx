"use client";

import { useState, useEffect } from 'react';
import FloatingNumber from './FloatingNumber';
import ElementalEffect from './ElementalEffect';

/**
 * Wrapper que gerencia todos os efeitos visuais de batalha
 * Combina números flutuantes, efeitos elementais e shake do avatar
 */
export default function BattleEffectWrapper({ children, effect, className = "" }) {
  const [showNumber, setShowNumber] = useState(false);
  const [showElemental, setShowElemental] = useState(false);
  const [avatarShake, setAvatarShake] = useState(false);

  // Atualizar quando effect muda
  useEffect(() => {
    if (effect) {
      console.log('⚡ [BattleEffectWrapper] Effect RECEBIDO:', effect);

      // Mostrar número se tiver tipo válido (mesmo sem number para miss/dodge/block)
      if (effect.type) {
        console.log('📊 [BattleEffectWrapper] Mostrando número:', effect.type);
        setShowNumber(true);
      }

      // Mostrar efeito elemental se tiver elemento
      if (effect.elemento) {
        console.log('🔥 [BattleEffectWrapper] Mostrando elemento:', effect.elemento);
        setShowElemental(true);
      }

      // Ativar shake quando recebe dano
      if (effect.type === 'damage' || effect.type === 'critical') {
        console.log('💥 [BattleEffectWrapper] Ativando shake');
        setAvatarShake(true);
        setTimeout(() => setAvatarShake(false), 400);
      }
    }
  }, [effect]);

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

      {/* Número flutuante - mostrar para todos os tipos */}
      {showNumber && effect?.type && (
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
