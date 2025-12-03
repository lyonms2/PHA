import { NextResponse } from 'next/server';
import { updateDocument } from '@/lib/firebase/firestore';

/**
 * Handler para ação 'process_effects'
 * Processa efeitos de status no início do turno
 * (dano contínuo, regeneração, paralisia, etc.)
 */
export async function handleProcessEffects({ room, isHost }) {
  const myEffectsField = isHost ? 'host_effects' : 'guest_effects';
  const myHpField = isHost ? 'host_hp' : 'guest_hp';
  let myEffects = room[myEffectsField] || [];
  let currentHp = isHost ? room.host_hp : room.guest_hp;
  const hpMax = isHost ? (room.host_hp_max || 100) : (room.guest_hp_max || 100);

  const logsEfeitos = [];
  let danoTotal = 0;
  let curaTotal = 0;
  let paralisado = false;

  // ===== VERIFICAR PARALISIA - PULA TURNO =====
  const efeitoParalisia = myEffects.find(ef => ef.tipo === 'paralisia' || ef.tipo === 'paralisado');
  if (efeitoParalisia) {
    paralisado = true;
    logsEfeitos.push('⚡⚡ PARALISADO! Você não pode agir neste turno!');

    // Remover ou decrementar paralisia
    myEffects = myEffects.map(ef => {
      if (ef.tipo === 'paralisia' || ef.tipo === 'paralisado') {
        ef.turnosRestantes -= 1;
        if (ef.turnosRestantes <= 0) {
          logsEfeitos.push('✖️ Paralisia expirou');
        }
      }
      return ef;
    }).filter(ef => ef.turnosRestantes > 0);

    // Passar o turno automaticamente
    await updateDocument('pvp_duel_rooms', room.id, {
      [myEffectsField]: myEffects,
      current_turn: isHost ? 'guest' : 'host'
    });

    return NextResponse.json({
      success: true,
      newHp: currentHp,
      danoTotal: 0,
      curaTotal: 0,
      logsEfeitos,
      efeitosRestantes: myEffects,
      finished: false,
      paralisado: true
    });
  }

  // Se não há efeitos, retornar sem fazer nada
  if (myEffects.length === 0) {
    return NextResponse.json({
      success: true,
      newHp: currentHp,
      danoTotal: 0,
      curaTotal: 0,
      logsEfeitos: [],
      efeitosRestantes: [],
      finished: false
    });
  }

  // Processar cada efeito
  const efeitosRestantes = [];
  const emojiMap = {
    'queimadura': '🔥', 'queimadura_intensa': '🔥🔥', 'veneno': '💀', 'sangramento': '🩸',
    'eletrocutado': '⚡', 'eletrocucao': '⚡', 'afogamento': '💧', 'maldito': '💀',
    'paralisia_intensa': '⚡⚡⚡', 'fissuras_explosivas': '💥🌍'
  };

  for (const ef of myEffects) {
    // Aplicar dano contínuo
    if (ef.danoPorTurno > 0) {
      danoTotal += ef.danoPorTurno;
      const emoji = emojiMap[ef.tipo] || '💥';
      logsEfeitos.push(`${emoji} ${ef.tipo}: -${ef.danoPorTurno} HP`);
    }

    // Regeneração (com ou sem acento)
    if (ef.tipo === 'regeneração' || ef.tipo === 'regeneracao') {
      const curaEfeito = Math.floor(hpMax * 0.05);
      curaTotal += curaEfeito;
      logsEfeitos.push(`💚 Regeneração: +${curaEfeito} HP`);
    }

    // Auto-cura
    if (ef.tipo === 'auto_cura') {
      const curaEfeito = Math.floor(hpMax * 0.03);
      curaTotal += curaEfeito;
      logsEfeitos.push(`💚 Auto-cura: +${curaEfeito} HP`);
    }

    // Decrementar duração
    ef.turnosRestantes -= 1;
    if (ef.turnosRestantes > 0) {
      efeitosRestantes.push(ef);
    } else {
      logsEfeitos.push(`✖️ ${ef.tipo} expirou`);
    }
  }

  // Calcular novo HP
  const newHp = Math.min(hpMax, Math.max(0, currentHp - danoTotal + curaTotal));

  const updates = {
    [myHpField]: newHp,
    [myEffectsField]: efeitosRestantes
  };

  // Verificar morte por efeito
  if (newHp <= 0) {
    updates.status = 'finished';
    updates.winner = isHost ? 'guest' : 'host';
  }

  await updateDocument('pvp_duel_rooms', room.id, updates);

  return NextResponse.json({
    success: true,
    newHp,
    danoTotal,
    curaTotal,
    logsEfeitos,
    efeitosRestantes,
    finished: newHp <= 0
  });
}
