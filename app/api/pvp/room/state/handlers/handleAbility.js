import { NextResponse } from 'next/server';
import { updateDocument } from '@/lib/firebase/firestore';
import { testarAcertoHabilidade } from '@/lib/combat/core/hitChecker';
import { calcularDanoHabilidade, calcularCuraHabilidade } from '@/lib/combat/core/damageCalculator';
import { atualizarBalanceamentoHabilidade, adicionarLogBatalha } from '../utils';
import { ativarCooldown } from '@/lib/combat/cooldownSystem';

/**
 * Handler para ação 'ability'
 * Executa habilidade: causa dano, cura, aplica efeitos de status
 */
export async function handleAbility({ room, role, isHost, abilityIndex }) {
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

  // Pegar avatar e habilidade
  const myAvatar = isHost ? room.host_avatar : room.guest_avatar;
  const opponentAvatar = isHost ? room.guest_avatar : room.host_avatar;

  if (!myAvatar?.habilidades || !myAvatar.habilidades[abilityIndex]) {
    return NextResponse.json(
      { error: 'Habilidade não encontrada' },
      { status: 400 }
    );
  }

  // Atualizar valores de balanceamento com os do sistema
  const habilidadeAvatar = myAvatar.habilidades[abilityIndex];
  const habilidade = atualizarBalanceamentoHabilidade(habilidadeAvatar, myAvatar.elemento);
  const custoEnergia = habilidade.custo_energia || 20;

  // Verificar energia
  const myEnergyField = isHost ? 'host_energy' : 'guest_energy';
  const currentEnergy = room[myEnergyField] ?? 100;
  if (currentEnergy < custoEnergia) {
    return NextResponse.json(
      { error: `Energia insuficiente! (${custoEnergia} necessária)` },
      { status: 400 }
    );
  }

  // ===== VERIFICAR COOLDOWN =====
  const myCooldownsField = isHost ? 'host_cooldowns' : 'guest_cooldowns';
  const currentCooldowns = room[myCooldownsField] || {};
  const cooldownRestante = currentCooldowns[habilidade.nome] || 0;

  if (cooldownRestante > 0) {
    return NextResponse.json(
      { error: `Habilidade ${habilidade.nome} em cooldown! Aguarde ${cooldownRestante} turno(s).` },
      { status: 400 }
    );
  }

  // Stats do atacante (sem penalidades de exaustão no PVP)
  const forca = myAvatar?.forca ?? 10;
  const foco = myAvatar?.foco ?? 10;
  const agilidadeOponente = opponentAvatar?.agilidade ?? 10;
  const resistenciaOponente = opponentAvatar?.resistencia ?? 10;
  const meuElemento = myAvatar?.elemento || 'Neutro';
  const elementoOponente = opponentAvatar?.elemento || 'Neutro';

  let dano = 0;
  let cura = 0;
  let efeito = '';
  let critico = false;
  let numGolpes = 1;
  let detalhesCalculo = {};

  // ===== TESTE DE ACERTO DA HABILIDADE =====
  const opponentEffects = isHost ? (room.guest_effects || []) : (room.host_effects || []);
  const chanceAcertoBase = habilidade.chance_acerto ?? 100;

  const resultadoAcerto = testarAcertoHabilidade({
    chanceAcertoBase,
    agilidadeOponente,
    opponentEffects
  });

  const meuNome = isHost ? room.host_nome : room.guest_nome;
  const oponenteNome = isHost ? room.guest_nome : room.host_nome;

  // Se errou (e é habilidade que pode errar)
  if (!resultadoAcerto.acertou && (habilidade.tipo === 'Ofensiva' || habilidade.tipo === 'Controle')) {
    const newEnergy = currentEnergy - custoEnergia;

    const battleLog = adicionarLogBatalha(room.battle_log || [], {
      acao: 'ability',
      jogador: meuNome,
      alvo: oponenteNome,
      habilidade: habilidade.nome,
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
      nomeHabilidade: habilidade.nome,
      newEnergy,
      detalhes: {
        mensagem: resultadoAcerto.invisivel ? 'Oponente está invisível!' : 'Habilidade errou!',
        chanceAcerto: resultadoAcerto.invisivel ? undefined : Math.floor(resultadoAcerto.chanceAcerto),
        chanceAcertoBase: resultadoAcerto.invisivel ? undefined : chanceAcertoBase,
        agilidadeOponente: resultadoAcerto.invisivel ? undefined : agilidadeOponente,
        reducaoEvasao: resultadoAcerto.invisivel ? undefined : Math.floor(agilidadeOponente * 0.5),
        rolouAcerto: resultadoAcerto.invisivel ? undefined : Math.floor(resultadoAcerto.rolouAcerto)
      }
    });
  }

  // ===== CALCULAR DANO/CURA BASEADO NO TIPO =====
  // Habilidades Ofensivas e de Controle geralmente causam dano
  if (habilidade.tipo === 'Ofensiva' || habilidade.tipo === 'Controle' || habilidade.dano_base > 0) {
    const opponentDefending = isHost ? room.guest_defending : room.host_defending;

    // Obter modificadores de sinergia
    const mySinergiaInfo = isHost ? room.host_sinergia : room.guest_sinergia;
    const opponentSinergiaInfo = isHost ? room.guest_sinergia : room.host_sinergia;
    const modificadoresSinergia = mySinergiaInfo?.modificadores || {};
    const defenderModifiers = opponentSinergiaInfo?.modificadores || {};

    const resultadoDano = calcularDanoHabilidade({
      habilidade,
      myAvatar,
      foco,
      resistenciaOponente,
      myExaustao,
      meuElemento,
      elementoOponente,
      opponentDefending,
      opponentEffects,
      modificadoresSinergia,
      defenderModifiers
    });

    dano = resultadoDano.dano;
    critico = resultadoDano.critico;
    numGolpes = resultadoDano.numGolpes;
    detalhesCalculo = resultadoDano.detalhes;
  }

  // ===== SISTEMA DE EFEITOS DE STATUS =====
  const efeitosAplicados = [];
  const opponentEffectsField = isHost ? 'guest_effects' : 'host_effects';
  const myEffectsField = isHost ? 'host_effects' : 'guest_effects';
  let currentOpponentEffects = room[opponentEffectsField] || [];
  let currentMyEffects = room[myEffectsField] || [];

  // Emojis por tipo de efeito
  const efeitoEmojis = {
    // Dano contínuo
    'queimadura': '🔥', 'queimadura_intensa': '🔥🔥', 'veneno': '💀', 'sangramento': '🩸',
    'eletrocutado': '⚡', 'eletrocucao': '⚡', 'afogamento': '💧', 'erosão': '🌪️',
    'maldito': '💀',
    // Buffs
    'defesa_aumentada': '🛡️', 'velocidade': '💨', 'velocidade_aumentada': '⚡💨',
    'evasao_aumentada': '👻', 'foco_aumentado': '🎯',
    'forca_aumentada': '💪', 'regeneração': '💚', 'regeneracao': '💚', 'escudo': '🛡️',
    'bencao': '✨', 'sobrecarga': '⚡🔴', 'precisao_aumentada': '🎯',
    'invisivel': '👻', 'auto_cura': '💚',
    // Debuffs
    'lentidão': '🐌', 'lentidao': '🐌', 'fraqueza': '⬇️', 'confusão': '🌀',
    'medo': '😱', 'cegueira': '🌑', 'silêncio': '🔇',
    'enfraquecido': '⬇️', 'terror': '😱💀', 'desorientado': '🌀',
    // Controle
    'congelado': '❄️', 'atordoado': '💫', 'paralisado': '⚡⚡', 'paralisia': '⚡⚡',
    'paralisia_intensa': '⚡⚡⚡', 'imobilizado': '🔒', 'sono': '😴',
    // Especiais
    'fantasma': '👻', 'drenar': '🗡️', 'maldição': '💀',
    'queimadura_contra_ataque': '🔥🛡️', 'roubo_vida': '🩸', 'roubo_vida_intenso': '🩸🩸',
    'roubo_vida_massivo': '🩸🩸🩸', 'perfuracao': '🗡️', 'execucao': '💀⚔️',
    'fissuras_explosivas': '💥🌍', 'vendaval_cortante': '💨⚔️',
    'limpar_debuffs': '✨🧹', 'dano_massivo_inimigos': '💥'
  };

  // Processar efeitos da habilidade
  if (habilidade.efeitos_status && habilidade.efeitos_status.length > 0) {
    for (const efeitoConfig of habilidade.efeitos_status) {
      const tipoEfeito = typeof efeitoConfig === 'string' ? efeitoConfig : efeitoConfig.tipo || efeitoConfig;

      // PULAR efeitos instantâneos que não são persistentes
      // Roubo de vida é processado separadamente e não deve criar efeito de status
      if (['roubo_vida', 'roubo_vida_intenso', 'roubo_vida_massivo'].includes(tipoEfeito)) {
        continue;
      }

      // ===== TESTAR CHANCE DO EFEITO =====
      const chanceEfeito = habilidade.chance_efeito ?? 100;
      const rolouEfeito = Math.random() * 100;
      if (rolouEfeito >= chanceEfeito) {
        // Efeito não ativou
        continue;
      }

      const valorEfeito = typeof efeitoConfig === 'object' ? (efeitoConfig.valor || 10) : 10;
      const duracaoEfeito = habilidade.duracao_efeito || 3;

      // ===== VERIFICAR SE JÁ TEM PARALISIA (NÃO EMPILHAR) =====
      if (tipoEfeito === 'paralisia' || tipoEfeito === 'paralisado') {
        const jaTemParalisia = currentOpponentEffects.some(ef =>
          ef.tipo === 'paralisia' || ef.tipo === 'paralisado'
        );
        if (jaTemParalisia) {
          // Já está paralisado, não aplicar novamente
          continue;
        }
      }

      // Determinar dano por turno baseado no tipo
      let danoPorTurno = 0;
      if (['queimadura', 'veneno', 'sangramento', 'eletrocutado', 'eletrocucao', 'afogamento', 'erosão', 'maldito', 'fissuras_explosivas'].includes(tipoEfeito)) {
        danoPorTurno = Math.floor(forca * 0.2) + 5;
      }
      if (tipoEfeito === 'queimadura_intensa') {
        danoPorTurno = Math.floor(forca * 0.4) + 10;
      }
      if (tipoEfeito === 'paralisia_intensa') {
        danoPorTurno = Math.floor(forca * 0.15) + 3; // Dano menor que queimadura
      }

      const novoEfeito = {
        tipo: tipoEfeito,
        valor: valorEfeito,
        danoPorTurno,
        duracao: duracaoEfeito,
        turnosRestantes: duracaoEfeito,
        origem: meuElemento
      };

      // Aplicar no alvo correto
      // Lista completa de buffs que aplicam em si mesmo
      const buffsPositivos = [
        'defesa_aumentada', 'velocidade', 'velocidade_aumentada', 'evasao_aumentada',
        'foco_aumentado', 'forca_aumentada', 'regeneração', 'regeneracao',
        'escudo', 'sobrecarga', 'benção', 'bencao', 'invisível', 'invisivel',
        'proteção', 'protecao', 'queimadura_contra_ataque'
      ];

      if (buffsPositivos.includes(tipoEfeito)) {
        // Buffs aplicam em si mesmo
        currentMyEffects = [...currentMyEffects.filter(e => e.tipo !== tipoEfeito), novoEfeito];
      } else {
        // Debuffs e dano aplicam no oponente
        currentOpponentEffects = [...currentOpponentEffects.filter(e => e.tipo !== tipoEfeito), novoEfeito];
      }

      const emoji = efeitoEmojis[tipoEfeito] || '✨';
      efeitosAplicados.push(`${emoji} ${tipoEfeito}`);
    }
  }

  // Montar mensagem de efeito
  if (efeitosAplicados.length > 0) {
    efeito = efeitosAplicados.join(', ');
  }

  // ===== ROUBO DE VIDA =====
  // Se a habilidade tem efeito roubo_vida e causou dano, cura o atacante
  if (dano > 0 && habilidade.efeitos_status) {
    const temRouboVida = habilidade.efeitos_status.some(ef =>
      typeof ef === 'string' && (ef === 'roubo_vida' || ef === 'roubo_vida_intenso' || ef === 'roubo_vida_massivo')
    );

    if (temRouboVida) {
      // Roubo de vida normal: 25% do dano
      // Roubo de vida intenso: 40% do dano
      // Roubo de vida massivo: 50% do dano
      let percentualRoubo = 0.25;
      if (habilidade.efeitos_status.includes('roubo_vida_intenso')) percentualRoubo = 0.40;
      if (habilidade.efeitos_status.includes('roubo_vida_massivo')) percentualRoubo = 0.50;

      const curaRoubo = Math.floor(dano * percentualRoubo);
      cura += curaRoubo;
      efeitosAplicados.push(`🩸 Roubou ${curaRoubo} HP`);
    }
  }

  // Tipo Suporte (cura)
  if (habilidade.tipo === 'Suporte' && habilidade.dano_base < 0) {
    cura = calcularCuraHabilidade({ habilidade, myAvatar });
    if (!efeito) efeito = '💚 Vida restaurada';
  }

  // Tipo Defensiva (buff puro)
  if (habilidade.tipo === 'Defensiva') {
    if (!efeito) efeito = '🛡️ Buff aplicado!';
  }

  // Tipo Controle (debuff/controle)
  if (habilidade.tipo === 'Controle' && dano === 0) {
    if (!efeito) efeito = '⬇️ Controle aplicado!';
  }

  // ===== VERIFICAR CONTRA-ATAQUE (HABILIDADES OFENSIVAS) =====
  let contraAtaqueAplicado = false;
  const temContraAtaqueHabilidade = opponentEffects.some(ef => ef.tipo === 'queimadura_contra_ataque');

  if (temContraAtaqueHabilidade && dano > 0) {
    // Aplicar queimadura no atacante
    const danoPorTurnoCA = Math.floor(forca * 0.2) + 5;
    const queimaduraContraAtaque = {
      tipo: 'queimadura',
      valor: 10,
      danoPorTurno: danoPorTurnoCA,
      duracao: 3,
      turnosRestantes: 3,
      origem: elementoOponente
    };
    currentMyEffects = [...currentMyEffects.filter(e => e.tipo !== 'queimadura'), queimaduraContraAtaque];
    contraAtaqueAplicado = true;
  }

  // Atualizar valores
  const opponentHpField = isHost ? 'guest_hp' : 'host_hp';
  const myHpField = isHost ? 'host_hp' : 'guest_hp';
  const myHpMax = isHost ? (room.host_hp_max || 100) : (room.guest_hp_max || 100);
  const opponentDefendingField = isHost ? 'guest_defending' : 'host_defending';

  const currentOpponentHp = isHost ? room.guest_hp : room.host_hp;
  const currentMyHp = isHost ? room.host_hp : room.guest_hp;

  const newOpponentHp = Math.max(0, currentOpponentHp - dano);
  const newMyHp = Math.min(myHpMax, currentMyHp + cura);
  const newEnergy = currentEnergy - custoEnergia;

  // ===== ADICIONAR LOG DE BATALHA =====
  const battleLog = adicionarLogBatalha(room.battle_log || [], {
    acao: 'ability',
    jogador: meuNome,
    alvo: habilidade.tipo === 'Suporte' ? meuNome : oponenteNome,
    habilidade: habilidade.nome,
    dano: dano > 0 ? dano : undefined,
    cura: cura > 0 ? cura : undefined,
    critico,
    bloqueado: detalhesCalculo.bloqueado || false,
    contraAtaque: contraAtaqueAplicado,
    efeitos: efeitosAplicados.length > 0 ? efeitosAplicados : undefined,
    numGolpes: numGolpes > 1 ? numGolpes : undefined,
    elemental: detalhesCalculo.elementalMult ? (detalhesCalculo.elementalMult > 1 ? 'vantagem' : detalhesCalculo.elementalMult < 1 ? 'desvantagem' : 'neutro') : 'neutro'
  });

  // ===== ATIVAR COOLDOWN SE HABILIDADE TEM COOLDOWN =====
  const cooldownHabilidade = habilidade.cooldown || 0;
  const updatedCooldowns = ativarCooldown(
    currentCooldowns,
    habilidade.nome,
    cooldownHabilidade,
    meuNome,
    'PVP'
  );

  const updates = {
    [myEnergyField]: newEnergy,
    [opponentDefendingField]: false,
    [opponentEffectsField]: currentOpponentEffects,
    [myEffectsField]: currentMyEffects,
    [myCooldownsField]: updatedCooldowns,
    current_turn: isHost ? 'guest' : 'host',
    battle_log: battleLog
  };

  if (dano > 0) {
    updates[opponentHpField] = newOpponentHp;
  }
  if (cura > 0) {
    updates[myHpField] = newMyHp;
  }

  // Verificar fim
  if (newOpponentHp <= 0) {
    updates.status = 'finished';
    updates.winner = role;
  }

  await updateDocument('pvp_duel_rooms', room.id, updates);

  return NextResponse.json({
    success: true,
    dano,
    cura,
    critico,
    bloqueado: detalhesCalculo.bloqueado || false,
    elemental: detalhesCalculo.elementalMult ? (detalhesCalculo.elementalMult > 1 ? 'vantagem' : detalhesCalculo.elementalMult < 1 ? 'desvantagem' : 'neutro') : 'neutro',
    contraAtaque: contraAtaqueAplicado,
    efeito,
    efeitosAplicados,
    nomeHabilidade: habilidade.nome,
    numGolpes: numGolpes > 1 ? numGolpes : undefined,
    newOpponentHp: dano > 0 ? newOpponentHp : undefined,
    newMyHp: cura > 0 ? newMyHp : undefined,
    newEnergy,
    finished: newOpponentHp <= 0,
    winner: newOpponentHp <= 0 ? role : null,
    detalhes: detalhesCalculo
  });
}
