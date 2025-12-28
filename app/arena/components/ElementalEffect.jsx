"use client";

import { useEffect, useState } from 'react';

/**
 * Componente de efeito elemental
 * Mostra efeitos visuais baseados no elemento do ataque
 */
export default function ElementalEffect({ elemento, intensity = 'normal', onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Remover após animação
    const duration = intensity === 'critical' ? 800 : 600;
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [intensity, onComplete]);

  if (!visible) return null;

  // Configurações por elemento
  const effects = {
    Fogo: {
      flash: 'bg-gradient-radial from-red-500/40 via-orange-500/20 to-transparent',
      particles: '🔥',
      particleColor: 'text-red-500',
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.6)]',
      animation: 'animate-fire-burst'
    },
    Água: {
      flash: 'bg-gradient-radial from-blue-500/40 via-cyan-500/20 to-transparent',
      particles: '💧',
      particleColor: 'text-blue-400',
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.6)]',
      animation: 'animate-water-splash'
    },
    Terra: {
      flash: 'bg-gradient-radial from-amber-700/40 via-yellow-800/20 to-transparent',
      particles: '🪨',
      particleColor: 'text-amber-600',
      glow: 'shadow-[0_0_30px_rgba(180,83,9,0.6)]',
      animation: 'animate-earth-shake'
    },
    Vento: {
      flash: 'bg-gradient-radial from-cyan-300/40 via-white/20 to-transparent',
      particles: '💨',
      particleColor: 'text-cyan-300',
      glow: 'shadow-[0_0_30px_rgba(103,232,249,0.6)]',
      animation: 'animate-wind-gust'
    },
    Eletricidade: {
      flash: 'bg-gradient-radial from-yellow-300/50 via-white/30 to-transparent',
      particles: '⚡',
      particleColor: 'text-yellow-300',
      glow: 'shadow-[0_0_40px_rgba(253,224,71,0.8)]',
      animation: 'animate-lightning-flash'
    },
    Luz: {
      flash: 'bg-gradient-radial from-yellow-200/50 via-white/30 to-transparent',
      particles: '✨',
      particleColor: 'text-yellow-200',
      glow: 'shadow-[0_0_40px_rgba(254,240,138,0.8)]',
      animation: 'animate-light-burst'
    },
    Sombra: {
      flash: 'bg-gradient-radial from-purple-900/60 via-black/40 to-transparent',
      particles: '🌑',
      particleColor: 'text-purple-400',
      glow: 'shadow-[0_0_30px_rgba(88,28,135,0.8)]',
      animation: 'animate-shadow-pulse'
    },
    Void: {
      flash: 'bg-gradient-radial from-black/70 via-purple-950/50 to-transparent',
      particles: '🌀',
      particleColor: 'text-purple-300',
      glow: 'shadow-[0_0_40px_rgba(0,0,0,0.9)]',
      animation: 'animate-void-distort'
    },
    Aether: {
      flash: 'bg-gradient-radial from-pink-300/40 via-blue-300/30 to-transparent',
      particles: '🌟',
      particleColor: 'text-pink-300',
      glow: 'shadow-[0_0_40px_rgba(249,168,212,0.8)]',
      animation: 'animate-aether-shine'
    }
  };

  const effect = effects[elemento] || effects.Fogo;
  const particleCount = intensity === 'critical' ? 8 : 5;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Flash de fundo */}
      <div className={`
        absolute inset-0
        ${effect.flash}
        ${effect.glow}
        ${effect.animation}
      `} />

      {/* Partículas */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(particleCount)].map((_, i) => {
          const angle = (360 / particleCount) * i;
          const delay = i * 50;

          return (
            <div
              key={i}
              className={`
                absolute text-2xl
                ${effect.particleColor}
                animate-particle-burst
              `}
              style={{
                transform: `rotate(${angle}deg) translateY(-50px)`,
                animationDelay: `${delay}ms`,
                opacity: 0
              }}
            >
              {effect.particles}
            </div>
          );
        })}
      </div>
    </div>
  );
}
