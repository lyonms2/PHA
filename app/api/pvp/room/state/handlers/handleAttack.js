import { NextResponse } from 'next/server';
import { updateDocument } from '@/lib/firebase/firestore';
import { testarAcertoAtaque } from '@/lib/combat/core/hitChecker';
import { calcularDanoAtaque } from '@/lib/combat/core/damageCalculator';
import { adicionarLogBatalha } from '../utils';

/**
 * Handler para ação 'attack'
 * Executa ataque básico: consome 10 energia, causa dano baseado em força
 */
export async function handleAttack({ room, role, isHost }) {
  // Verificar se é seu turno
  if (room.current_turn !== role) {
    return NextResponse.json(
      { error: 'Não é seu turno!' },
      { status: 400 }
    );
  }

  // Verificar se sala está ativa
  if (room.status !== 'active') {
    return NextResponse.json(
      { error: 'Batalha não está ativa' },
      { status: 400 }
    );
  }

  // Verificar energia
  const myEnergyField = isHost ? 'host_energy' : 'guest_energy';
  const currentEnergy = room[myEnergyField] ?? 100;
  if (currentEnergy < 10) {
    return NextResponse.json(
      { error: 'Energia insuficiente! (10 necessária)' },
      { status: 400 }
    );
  }

  // Pegar stats dos avatares
  const myAvatar = isHost ? room.host_avatar : room.guest_avatar;
  const opponentAvatar = isHost ? room.guest_avatar : room.host_avatar;
  const myExaustao = isHost ? (room.host_exaustao ?? 0) : (room.guest_exaustao ?? 0);

  // Stats do atacante e defensor (sem penalidades de exaustão no PVP)
  const forca = myAvatar?.forca ?? 10;
  const foco = myAvatar?.foco ?? 10;
  const agilidade = myAvatar?.agilidade ?? 10;
  const resistenciaOponente = opponentAvatar?.resistencia ?? 10;
  const agilidadeOponente = opponentAvatar?.agilidade ?? 10;
  const vinculo = myAvatar?.vinculo ?? 0;
  const meuElemento = myAvatar?.elemento || 'Neutro';
  const elementoOponente = opponentAvatar?.elemento || 'Neutro';

  // ===== TESTE DE AGILIDADE (HIT CHECK) =====
  const opponentEffects = isHost ? (room.guest_effects || []) : (room.host_effects || []);
  const resultadoAcerto = testarAcertoAtaque({
    agilidade,
    agilidadeOponente,
    opponentEffects
  });

  const newEnergy = currentEnergy - 10;
  const meuNome = isHost ? room.host_nome : room.guest_nome;
  const oponenteNome = isHost ? room.guest_nome : room.host_nome;

  // Se errou ou oponente esquivou
  if (!resultadoAcerto.acertou) {
    const battleLog = adicionarLogBatalha(room.battle_log || [], {
      acao: 'attack',
      jogador: meuNome,
      alvo: oponenteNome,
      errou: true,
      esquivou: resultadoAcerto.esquivou,
      invisivel: resultadoAcerto.invisivel,
      chanceAcerto: resultadoAcerto.invisivel ? undefined : Math.floor(resultadoAcerto.chanceAcerto)
    });

    await updateDocument('pvp_duel_rooms', room.id, {
      [myEnergyField]: newEnergy,
      current_turn: isHost ? 'guest' : 'host',
      battle_log: battleLog
    });

    return NextResponse.json({
      success: true,
      errou: true,
      esquivou: resultadoAcerto.esquivou,
      invisivel: resultadoAcerto.invisivel,
      dano: 0,
      newOpponentHp: isHost ? room.guest_hp : room.host_hp,
      newEnergy,
      detalhes: {
        mensagem: resultadoAcerto.invisivel ? 'Oponente está invisível!' : 'Ataque errou!',
        chanceAcerto: resultadoAcerto.invisivel ? undefined : Math.floor(resultadoAcerto.chanceAcerto),
        agilidade: resultadoAcerto.invisivel ? undefined : agilidade,
        agilidadeOponente: resultadoAcerto.invisivel ? undefined : agilidadeOponente,
        rolouAcerto: resultadoAcerto.invisivel ? undefined : Math.floor(resultadoAcerto.rolouAcerto)
      }
    });
  }

  // ===== CALCULAR DANO =====
  const opponentDefending = isHost ? room.guest_defending : room.host_defending;
  const { dano, critico, elemental, detalhes } = calcularDanoAtaque({
    forca,
    foco,
    resistenciaOponente,
    myExaustao,
    vinculo,
    meuElemento,
    elementoOponente,
    opponentDefending,
    opponentEffects
  });

  // ===== VERIFICAR CONTRA-ATAQUE =====
  const myEffectsField = isHost ? 'host_effects' : 'guest_effects';
  let myEffects = room[myEffectsField] || [];
  const temContraAtaque = opponentEffects.some(ef => ef.tipo === 'queimadura_contra_ataque');

  if (temContraAtaque) {
    // Aplicar queimadura no atacante
    const danoPorTurno = Math.floor(forca * 0.2) + 5;
    const queimaduraEfeito = {
      tipo: 'queimadura',
      valor: 10,
      danoPorTurno,
      duracao: 3,
      turnosRestantes: 3,
      origem: elementoOponente
    };
    myEffects = [...myEffects.filter(e => e.tipo !== 'queimadura'), queimaduraEfeito];
  }

  // Atualizar HP do oponente e energia do atacante
  const opponentHpField = isHost ? 'guest_hp' : 'host_hp';
  const opponentDefendingField = isHost ? 'guest_defending' : 'host_defending';
  const newOpponentHp = Math.max(0, (isHost ? room.guest_hp : room.host_hp) - dano);

  // ===== ADICIONAR LOG DE BATALHA =====
  const battleLog = adicionarLogBatalha(room.battle_log || [], {
    acao: 'attack',
    jogador: meuNome,
    alvo: oponenteNome,
    dano,
    critico,
    bloqueado: opponentDefending,
    contraAtaque: temContraAtaque,
    elemental: elemental.tipo
  });

  const updates = {
    [opponentHpField]: newOpponentHp,
    [myEnergyField]: newEnergy,
    [myEffectsField]: myEffects, // Atualizar efeitos do atacante (contra-ataque)
    [opponentDefendingField]: false, // Reset defesa do oponente após ser atacado
    current_turn: isHost ? 'guest' : 'host', // Passa o turno
    battle_log: battleLog
  };

  // Verificar se acabou
  if (newOpponentHp <= 0) {
    updates.status = 'finished';
    updates.winner = role;
  }

  await updateDocument('pvp_duel_rooms', room.id, updates);

  return NextResponse.json({
    success: true,
    dano,
    critico,
    bloqueado: opponentDefending,
    elemental: elemental.tipo,
    contraAtaque: temContraAtaque,
    newOpponentHp,
    newEnergy,
    finished: newOpponentHp <= 0,
    winner: newOpponentHp <= 0 ? role : null,
    detalhes
  });
}
