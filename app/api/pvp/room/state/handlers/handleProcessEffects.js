import { NextResponse } from 'next/server';
import { updateDocument } from '@/lib/firebase/firestore';
import { processEffects } from '@/lib/combat/battle';

/**
 * Decrementa cooldowns no início do turno
 * Remove habilidades que ficaram prontas (cooldown = 0)
 */
function decrementarCooldowns(cooldowns, jogador) {
  const novosCooldowns = {};
  let decrementados = [];

  for (const [habilidade, turnos] of Object.entries(cooldowns)) {
    const novosTurnos = turnos - 1;
    if (novosTurnos > 0) {
      novosCooldowns[habilidade] = novosTurnos;
      decrementados.push(`${habilidade}:${novosTurnos}`);
    } else {
      console.log(`✅ [COOLDOWN PVP] ${habilidade} de ${jogador} disponível novamente!`);
    }
  }

  if (decrementados.length > 0) {
    console.log(`⏱️ [COOLDOWN PVP] Cooldowns de ${jogador}: ${decrementados.join(', ')}`);
  }

  return novosCooldowns;
}

/**
 * Handler para ação 'process_effects'
 * Processa efeitos de status no início do turno
 * (dano contínuo, regeneração, paralisia, atordoamento, etc.)
 *
 * AGORA USA LIB COMPARTILHADA: lib/combat/battle/engine.js
 */
export async function handleProcessEffects({ room, isHost }) {
  const myEffectsField = isHost ? 'host_effects' : 'guest_effects';
  const myHpField = isHost ? 'host_hp' : 'guest_hp';
  const myNome = isHost ? room.host_nome : room.guest_nome;
  const currentHp = isHost ? room.host_hp : room.guest_hp;
  const hpMax = isHost ? (room.host_hp_max || 100) : (room.guest_hp_max || 100);
  const myEffects = room[myEffectsField] || [];

  // ===== DECREMENTAR COOLDOWNS NO INÍCIO DO TURNO =====
  const myCooldownsField = isHost ? 'host_cooldowns' : 'guest_cooldowns';
  const currentCooldowns = room[myCooldownsField] || {};
  const updatedCooldowns = decrementarCooldowns(currentCooldowns, myNome);

  // ===== USAR LIB COMPARTILHADA =====
  const result = processEffects({
    hp: currentHp,
    hpMax,
    effects: myEffects,
    nome: myNome
  });

  // ===== VERIFICAR ATORDOAMENTO/PARALISIA - PULA TURNO =====
  if (result.stunned) {
    console.log(`😵 [PVP] ${myNome} está ${result.stunnedType} e pula o turno!`);

    const logsEfeitos = [`😵 ${result.stunnedType.toUpperCase()}! Você não pode agir neste turno!`];

    // Se efeito expirou, adicionar ao log
    if (result.efeitosProcessados) {
      result.efeitosProcessados.forEach(ef => {
        if (ef.acao === 'expirou') {
          logsEfeitos.push(`✖️ ${ef.tipo} expirou`);
        }
      });
    }

    // Passar o turno automaticamente
    await updateDocument('pvp_duel_rooms', room.id, {
      [myEffectsField]: result.newEffects,
      [myCooldownsField]: updatedCooldowns,
      current_turn: isHost ? 'guest' : 'host'
    });

    return NextResponse.json({
      success: true,
      newHp: currentHp,
      danoTotal: 0,
      curaTotal: 0,
      logsEfeitos,
      efeitosRestantes: result.newEffects,
      finished: false,
      stunned: true
    });
  }

  // ===== PROCESSAR EFEITOS NORMAIS (dano, cura, etc) =====
  const logsEfeitos = [];
  const emojiMap = {
    'queimadura': '🔥', 'queimadura_intensa': '🔥🔥', 'veneno': '💀', 'sangramento': '🩸',
    'eletrocutado': '⚡', 'eletrocucao': '⚡', 'afogamento': '💧', 'maldito': '💀',
    'paralisia_intensa': '⚡⚡⚡', 'fissuras_explosivas': '💥🌍'
  };

  // Gerar logs baseado nos efeitos processados
  if (result.efeitosProcessados) {
    result.efeitosProcessados.forEach(ef => {
      if (ef.acao === 'dano' && ef.valor > 0) {
        const emoji = emojiMap[ef.tipo] || '💥';
        logsEfeitos.push(`${emoji} ${ef.tipo}: -${ef.valor} HP`);
      } else if (ef.acao === 'cura' && ef.valor > 0) {
        logsEfeitos.push(`💚 ${ef.tipo}: +${ef.valor} HP`);
      } else if (ef.acao === 'expirou') {
        logsEfeitos.push(`✖️ ${ef.tipo} expirou`);
      }
    });
  }

  const updates = {
    [myHpField]: result.newHp,
    [myEffectsField]: result.newEffects,
    [myCooldownsField]: updatedCooldowns
  };

  // Verificar morte por efeito
  if (result.finished) {
    updates.status = 'finished';
    updates.winner = isHost ? 'guest' : 'host';
  }

  await updateDocument('pvp_duel_rooms', room.id, updates);

  return NextResponse.json({
    success: true,
    newHp: result.newHp,
    danoTotal: result.dano,
    curaTotal: result.cura,
    logsEfeitos,
    efeitosRestantes: result.newEffects,
    finished: result.finished
  });
}
