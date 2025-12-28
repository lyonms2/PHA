"use client";

import { useEffect, useState } from 'react';

/**
 * Componente de número flutuante animado
 * Mostra dano, cura, crítico, miss, etc com animações
 */
export default function FloatingNumber({ value, type, onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Remover após animação (1 segundo)
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  // Configurações por tipo
  const configs = {
    damage: {
      color: 'text-red-500',
      prefix: '-',
      size: 'text-3xl',
      animation: 'animate-float-up',
      glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
    },
    critical: {
      color: 'text-yellow-400',
      prefix: '💥 -',
      size: 'text-4xl',
      animation: 'animate-critical',
      glow: 'drop-shadow-[0_0_12px_rgba(250,204,21,1)]'
    },
    heal: {
      color: 'text-green-400',
      prefix: '+',
      size: 'text-3xl',
      animation: 'animate-float-up',
      glow: 'drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]'
    },
    miss: {
      color: 'text-gray-400',
      prefix: '',
      text: 'ERROU!',
      size: 'text-2xl',
      animation: 'animate-slide-side',
      glow: 'drop-shadow-[0_0_6px_rgba(156,163,175,0.6)]'
    },
    dodge: {
      color: 'text-cyan-400',
      prefix: '',
      text: 'ESQUIVOU!',
      size: 'text-2xl',
      animation: 'animate-slide-side',
      glow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
    },
    block: {
      color: 'text-blue-400',
      prefix: '',
      text: '🛡️ BLOQUEOU',
      size: 'text-xl',
      animation: 'animate-bounce-in',
      glow: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]'
    }
  };

  const config = configs[type] || configs.damage;

  // Determinar texto a exibir
  const displayText = config.text || (value != null ? `${config.prefix}${value}` : config.prefix);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className={`
        ${config.color}
        ${config.size}
        ${config.animation}
        ${config.glow}
        font-black
        tracking-wider
        text-center
      `}>
        {displayText}
      </div>
    </div>
  );
}
