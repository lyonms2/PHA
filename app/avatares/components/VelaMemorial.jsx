'use client';

import { useState, useEffect } from 'react';
import { calcularEstadoVela, CONFIG_VELA } from '../sistemas/exhaustionSystem';

/**
 * Componente de Vela Memorial
 * Mostra o estado da vela e cronômetro para avatares mortos
 */
export default function VelaMemorial({ avatar, onRenovar, compacto = false }) {
  const [estadoAtual, setEstadoAtual] = useState(null);
  const [renovando, setRenovando] = useState(false);

  // Atualizar estado da vela a cada segundo
  useEffect(() => {
    const atualizarEstado = () => {
      const estado = calcularEstadoVela(avatar);
      setEstadoAtual(estado);
    };

    // Atualizar imediatamente
    atualizarEstado();

    // Atualizar a cada 1 segundo
    const intervalo = setInterval(atualizarEstado, 1000);

    return () => clearInterval(intervalo);
  }, [avatar]);

  if (!estadoAtual) return null;
  if (avatar.vivo) return null; // Não mostrar para avatares vivos

  const handleRenovar = async () => {
    if (!estadoAtual.podeRenovar) return;

    setRenovando(true);
    try {
      await onRenovar();
    } finally {
      setRenovando(false);
    }
  };

  // Formatar tempo restante
  const formatarTempo = () => {
    if (estadoAtual.estado === CONFIG_VELA.ESTADOS.PRIMEIRA_VEZ) {
      return 'Nunca acesa';
    }

    if (estadoAtual.estado === CONFIG_VELA.ESTADOS.APAGADA) {
      return 'APAGADA';
    }

    const { dias, horas, minutos } = estadoAtual;

    if (estadoAtual.estado === CONFIG_VELA.ESTADOS.CRITICA) {
      return `${horas}h ${minutos}m`;
    }

    if (dias > 0) {
      return `${dias}d ${horas}h`;
    }

    return `${horas}h ${minutos}m`;
  };

  // Cores baseadas no estado
  const getCores = () => {
    switch (estadoAtual.estado) {
      case CONFIG_VELA.ESTADOS.PRIMEIRA_VEZ:
        return {
          bg: 'bg-slate-800/50',
          border: 'border-slate-600',
          texto: 'text-slate-400',
          emoji: '🕯️',
          botao: 'bg-cyan-600 hover:bg-cyan-500'
        };
      case CONFIG_VELA.ESTADOS.ATIVA:
        return {
          bg: 'bg-green-900/30',
          border: 'border-green-600',
          texto: 'text-green-400',
          emoji: '🕯️',
          botao: 'bg-gray-600 cursor-not-allowed'
        };
      case CONFIG_VELA.ESTADOS.CRITICA:
        return {
          bg: 'bg-red-900/50',
          border: 'border-red-500',
          texto: 'text-red-400',
          emoji: '🔥',
          botao: 'bg-red-600 hover:bg-red-500 animate-pulse'
        };
      case CONFIG_VELA.ESTADOS.APAGADA:
        return {
          bg: 'bg-gray-900/80',
          border: 'border-gray-700',
          texto: 'text-gray-500',
          emoji: '💀',
          botao: 'bg-gray-700 cursor-not-allowed'
        };
      default:
        return {
          bg: 'bg-slate-800',
          border: 'border-slate-600',
          texto: 'text-slate-400',
          emoji: '🕯️',
          botao: 'bg-gray-600'
        };
    }
  };

  const cores = getCores();

  // Versão compacta (para cards)
  if (compacto) {
    return (
      <div className={`${cores.bg} ${cores.border} border rounded-lg p-2`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{cores.emoji}</span>
            <div className="flex flex-col">
              <span className={`${cores.texto} font-bold text-xs`}>
                {formatarTempo()}
              </span>
              {estadoAtual.estado === CONFIG_VELA.ESTADOS.CRITICA && (
                <span className="text-[10px] text-red-400 font-bold animate-pulse">
                  URGENTE!
                </span>
              )}
            </div>
          </div>

          {estadoAtual.podeRenovar && (
            <button
              onClick={handleRenovar}
              disabled={renovando}
              className={`${cores.botao} text-white text-xs font-bold px-3 py-1 rounded transition-colors disabled:opacity-50`}
            >
              {renovando ? '...' : '🕯️'}
            </button>
          )}
        </div>

        {/* Barra de progresso */}
        {estadoAtual.estado !== CONFIG_VELA.ESTADOS.PRIMEIRA_VEZ && (
          <div className="mt-2 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                estadoAtual.estado === CONFIG_VELA.ESTADOS.CRITICA
                  ? 'bg-red-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${estadoAtual.percentualRestante}%` }}
            ></div>
          </div>
        )}
      </div>
    );
  }

  // Versão completa (para modal de detalhes)
  return (
    <div className={`${cores.bg} ${cores.border} border-2 rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{cores.emoji}</span>
          <div>
            <h4 className="text-cyan-400 font-bold text-sm uppercase">Vela Memorial</h4>
            <p className={`${cores.texto} text-xs mt-1`}>
              {estadoAtual.mensagem}
            </p>
          </div>
        </div>
      </div>

      {/* Tempo restante */}
      <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">Tempo restante:</span>
          <span className={`${cores.texto} font-mono font-bold text-lg`}>
            {formatarTempo()}
          </span>
        </div>

        {/* Barra de progresso */}
        {estadoAtual.estado !== CONFIG_VELA.ESTADOS.PRIMEIRA_VEZ && (
          <div className="mt-2 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                estadoAtual.estado === CONFIG_VELA.ESTADOS.CRITICA
                  ? 'bg-gradient-to-r from-red-600 to-orange-500'
                  : 'bg-gradient-to-r from-green-600 to-green-400'
              }`}
              style={{ width: `${estadoAtual.percentualRestante}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* Informações do sistema */}
      <div className="bg-slate-900/30 rounded p-2 mb-3 text-xs text-slate-400">
        <p>• Vela ativa: 7 dias de proteção</p>
        <p>• Após 7 dias: janela crítica de 24h</p>
        <p>• Sem renovação: exclusão permanente</p>
      </div>

      {/* Botão de renovação */}
      {estadoAtual.podeRenovar && (
        <button
          onClick={handleRenovar}
          disabled={renovando}
          className={`w-full ${cores.botao} text-white font-bold py-3 rounded transition-colors disabled:opacity-50`}
        >
          {renovando ? 'Renovando...' : `🕯️ ${estadoAtual.estado === CONFIG_VELA.ESTADOS.PRIMEIRA_VEZ ? 'Acender Vela' : 'Renovar Vela'}`}
        </button>
      )}

      {!estadoAtual.podeRenovar && estadoAtual.estado === CONFIG_VELA.ESTADOS.ATIVA && (
        <div className="text-center text-xs text-green-400">
          ✓ Vela ativa - renovação disponível quando entrar no período crítico
        </div>
      )}
    </div>
  );
}
