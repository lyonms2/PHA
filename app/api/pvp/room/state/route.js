import { NextResponse } from 'next/server';
import { getDocument, updateDocument } from '@/lib/firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * Helper: Adicionar log de ação ao histórico da batalha
 * Mantém apenas as últimas 20 ações para não sobrecarregar
 * Remove campos undefined (Firestore não aceita)
 */
function adicionarLogBatalha(battleLog = [], novoLog) {
  // Remover campos undefined (Firestore não aceita)
  const logLimpo = {};
  for (const [key, value] of Object.entries(novoLog)) {
    if (value !== undefined) {
      logLimpo[key] = value;
    }
  }

  const logComId = {
    ...logLimpo,
    id: Date.now() + Math.random(), // ID único
    timestamp: new Date().toISOString()
  };

  const logsAtualizados = [...battleLog, logComId];

  // Manter apenas últimas 20 ações
  return logsAtualizados.slice(-20);
}

/**
 * GET /api/pvp/room/state?roomId=xxx&visitorId=xxx
 * Busca estado da sala
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');
    const visitorId = searchParams.get('visitorId');

    if (!roomId || !visitorId) {
      return NextResponse.json(
        { error: 'roomId e visitorId são obrigatórios' },
        { status: 400 }
      );
    }

    const room = await getDocument('pvp_duel_rooms', roomId);

    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    // Determinar se é host ou guest
    const isHost = room.host_user_id === visitorId;
    const isGuest = room.guest_user_id === visitorId;

    if (!isHost && !isGuest) {
      return NextResponse.json(
        { error: 'Você não está nesta sala' },
        { status: 403 }
      );
    }

    const role = isHost ? 'host' : 'guest';
    const isYourTurn = room.current_turn === role;

    return NextResponse.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        status: room.status,
        hostNome: room.host_nome,
        guestNome: room.guest_nome,
        hostReady: room.host_ready,
        guestReady: room.guest_ready,
        hostHp: room.host_hp,
        guestHp: room.guest_hp,
        currentTurn: room.current_turn,
        winner: room.winner
      },
      role,
      isYourTurn,
      myHp: isHost ? room.host_hp : room.guest_hp,
      myHpMax: isHost ? (room.host_hp_max ?? 100) : (room.guest_hp_max ?? 100),
      myExaustao: isHost ? (room.host_exaustao ?? 0) : (room.guest_exaustao ?? 0),
      opponentHp: isHost ? room.guest_hp : room.host_hp,
      opponentHpMax: isHost ? (room.guest_hp_max ?? 100) : (room.host_hp_max ?? 100),
      opponentExaustao: isHost ? (room.guest_exaustao ?? 0) : (room.guest_exaustao ?? 0),
      myEnergy: isHost ? (room.host_energy ?? 100) : (room.guest_energy ?? 100),
      opponentEnergy: isHost ? (room.guest_energy ?? 100) : (room.host_energy ?? 100),
      opponentNome: isHost ? room.guest_nome : room.host_nome,
      opponentAvatar: isHost ? room.guest_avatar : room.host_avatar,
      myEffects: isHost ? (room.host_effects || []) : (room.guest_effects || []),
      opponentEffects: isHost ? (room.guest_effects || []) : (room.host_effects || []),
      battleLog: room.battle_log || []
    });

  } catch (error) {
    console.error('Erro em GET /api/pvp/room/state:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pvp/room/state
 * Atualiza estado (ready, attack)
 */
export async function POST(request) {
  try {
    const { roomId, visitorId, action, abilityIndex } = await request.json();

    if (!roomId || !visitorId || !action) {
      return NextResponse.json(
        { error: 'roomId, visitorId e action são obrigatórios' },
        { status: 400 }
      );
    }

    const room = await getDocument('pvp_duel_rooms', roomId);

    if (!room) {
      return NextResponse.json(
        { error: 'Sala não encontrada' },
        { status: 404 }
      );
    }

    const isHost = room.host_user_id === visitorId;
    const isGuest = room.guest_user_id === visitorId;

    if (!isHost && !isGuest) {
      return NextResponse.json(
        { error: 'Você não está nesta sala' },
        { status: 403 }
      );
    }

    const role = isHost ? 'host' : 'guest';

    // Ação: marcar como pronto
    if (action === 'ready') {
      const field = isHost ? 'host_ready' : 'guest_ready';
      await updateDocument('pvp_duel_rooms', roomId, {
        [field]: true
      });

      // Verificar se ambos estão prontos
      const updatedRoom = await getDocument('pvp_duel_rooms', roomId);
      if (updatedRoom.host_ready && updatedRoom.guest_ready) {
        await updateDocument('pvp_duel_rooms', roomId, {
          status: 'active',
          current_turn: 'host' // Host começa
        });
      }

      return NextResponse.json({ success: true, message: 'Pronto!' });
    }

    // Ação: atacar
    if (action === 'attack') {
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

      // Stats do atacante e defensor
      const forca = myAvatar?.forca ?? 10;
      const foco = myAvatar?.foco ?? 10;
      const agilidade = myAvatar?.agilidade ?? 10;
      const resistenciaOponente = opponentAvatar?.resistencia ?? 10;
      const agilidadeOponente = opponentAvatar?.agilidade ?? 10;
      const vinculo = myAvatar?.vinculo ?? 0;
      const meuElemento = myAvatar?.elemento || 'Neutro';
      const elementoOponente = opponentAvatar?.elemento || 'Neutro';

      // ===== TESTE DE AGILIDADE (HIT CHECK) =====
      // Verificar buffs de evasão do oponente
      const opponentEffectsAtk = isHost ? (room.guest_effects || []) : (room.host_effects || []);
      const temInvisibilidadeAtk = opponentEffectsAtk.some(ef => ef.tipo === 'invisivel' || ef.tipo === 'invisível');
      const temEvasaoAumentadaAtk = opponentEffectsAtk.some(ef => ef.tipo === 'evasao_aumentada');
      const temVelocidadeAumentadaAtk = opponentEffectsAtk.some(ef => ef.tipo === 'velocidade' || ef.tipo === 'velocidade_aumentada');

      // Invisibilidade = sempre esquiva
      if (temInvisibilidadeAtk) {
        const newEnergy = currentEnergy - 10;

        // Log de esquiva por invisibilidade
        const meuNome = isHost ? room.host_nome : room.guest_nome;
        const oponenteNome = isHost ? room.guest_nome : room.host_nome;
        const battleLog = adicionarLogBatalha(room.battle_log || [], {
          acao: 'attack',
          jogador: meuNome,
          alvo: oponenteNome,
          errou: true,
          esquivou: true,
          invisivel: true
        });

        await updateDocument('pvp_duel_rooms', roomId, {
          [myEnergyField]: newEnergy,
          current_turn: isHost ? 'guest' : 'host',
          battle_log: battleLog
        });

        return NextResponse.json({
          success: true,
          errou: true,
          esquivou: true,
          invisivel: true,
          dano: 0,
          newOpponentHp: isHost ? room.guest_hp : room.host_hp,
          newEnergy,
          detalhes: {
            mensagem: 'Oponente está invisível!'
          }
        });
      }

      // Calcular bônus de evasão de buffs
      let bonusEvasaoAtk = 0;
      if (temEvasaoAumentadaAtk) bonusEvasaoAtk += 30; // +30% evasão
      if (temVelocidadeAumentadaAtk) bonusEvasaoAtk += 15; // +15% evasão

      // Base 70% + diferença de agilidade * 2% - bônus evasão
      let chanceAcerto = 70 + (agilidade - agilidadeOponente) * 2 - bonusEvasaoAtk;
      chanceAcerto = Math.min(95, Math.max(5, chanceAcerto)); // Mínimo 5%, máximo 95%
      const rolouAcerto = Math.random() * 100;
      const acertou = rolouAcerto < chanceAcerto;

      if (!acertou) {
        // Errou o ataque - passa o turno sem causar dano
        const newEnergy = currentEnergy - 10;

        // Log de erro
        const meuNome = isHost ? room.host_nome : room.guest_nome;
        const oponenteNome = isHost ? room.guest_nome : room.host_nome;
        const battleLog = adicionarLogBatalha(room.battle_log || [], {
          acao: 'attack',
          jogador: meuNome,
          alvo: oponenteNome,
          errou: true,
          chanceAcerto: Math.floor(chanceAcerto)
        });

        await updateDocument('pvp_duel_rooms', roomId, {
          [myEnergyField]: newEnergy,
          current_turn: isHost ? 'guest' : 'host',
          battle_log: battleLog
        });

        return NextResponse.json({
          success: true,
          errou: true,
          dano: 0,
          newOpponentHp: isHost ? room.guest_hp : room.host_hp,
          newEnergy,
          detalhes: {
            chanceAcerto: Math.floor(chanceAcerto),
            agilidade,
            agilidadeOponente,
            rolouAcerto: Math.floor(rolouAcerto)
          }
        });
      }

      // Calcular multiplicador elemental
      const calcularMultiplicadorElemental = (atacante, defensor) => {
        // Ciclo: Fogo > Vento > Terra > Eletricidade > Água > Fogo
        const vantagens = {
          'Fogo': 'Vento',
          'Vento': 'Terra',
          'Terra': 'Eletricidade',
          'Eletricidade': 'Água',
          'Água': 'Fogo',
          'Luz': 'Sombra',
          'Sombra': 'Luz'
        };

        if (vantagens[atacante] === defensor) {
          return { mult: 1.5, tipo: 'vantagem' };
        }
        if (vantagens[defensor] === atacante) {
          return { mult: 0.75, tipo: 'desvantagem' };
        }
        return { mult: 1.0, tipo: 'neutro' };
      };

      const elemental = calcularMultiplicadorElemental(meuElemento, elementoOponente);

      // Calcular dano base: 5 + (força × 0.5) + random(1-5)
      const random = Math.floor(Math.random() * 5) + 1;
      let danoBase = 5 + (forca * 0.5) + random;

      // Redução por defesa: - (resistência × 0.3)
      const reducaoDefesa = resistenciaOponente * 0.3;
      let dano = danoBase - reducaoDefesa;

      // Penalidade de exaustão
      let penalidade = 1.0;
      let penalidadeTexto = '';
      if (myExaustao >= 80) { penalidade = 0.5; penalidadeTexto = '-50%'; }
      else if (myExaustao >= 60) { penalidade = 0.75; penalidadeTexto = '-25%'; }
      else if (myExaustao >= 40) { penalidade = 0.95; penalidadeTexto = '-5%'; }
      dano = dano * penalidade;

      // Bônus de vínculo
      let bonusVinculo = 1.0;
      let vinculoTexto = '';
      if (vinculo >= 80) { bonusVinculo = 1.2; vinculoTexto = '+20%'; }
      else if (vinculo >= 60) { bonusVinculo = 1.15; vinculoTexto = '+15%'; }
      else if (vinculo >= 40) { bonusVinculo = 1.1; vinculoTexto = '+10%'; }
      dano = dano * bonusVinculo;

      // Multiplicador elemental
      dano = dano * elemental.mult;

      // Chance de crítico: 5% + (foco × 0.3%)
      const chanceCritico = 5 + (foco * 0.3);
      const rolou = Math.random() * 100;
      const critico = rolou < chanceCritico;

      if (critico) {
        dano = dano * 2;
      }

      // Garantir dano mínimo de 1
      dano = Math.max(1, Math.floor(dano));

      // Verificar se oponente está defendendo (reduz dano em 50%)
      const opponentDefending = isHost ? room.guest_defending : room.host_defending;
      if (opponentDefending) {
        dano = Math.floor(dano * 0.5);
      }

      // Detalhes do cálculo para o log
      const detalhes = {
        danoBase: Math.floor(danoBase),
        forca,
        random,
        reducaoDefesa: Math.floor(reducaoDefesa),
        resistenciaOponente,
        penalidadeExaustao: penalidadeTexto,
        bonusVinculo: vinculoTexto,
        elementalMult: elemental.mult,
        chanceCritico: Math.floor(chanceCritico)
      };

      // ===== VERIFICAR CONTRA-ATAQUE =====
      // Se o oponente tem queimadura_contra_ataque, aplicar queimadura no atacante
      const myEffectsField = isHost ? 'host_effects' : 'guest_effects';
      let myEffects = room[myEffectsField] || [];
      const opponentEffectsField = isHost ? 'guest_effects' : 'host_effects';
      const opponentEffects = room[opponentEffectsField] || [];
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
      const newEnergy = currentEnergy - 10;

      // ===== ADICIONAR LOG DE BATALHA =====
      const meuNome = isHost ? room.host_nome : room.guest_nome;
      const oponenteNome = isHost ? room.guest_nome : room.host_nome;
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

      await updateDocument('pvp_duel_rooms', roomId, updates);

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

    // Ação: defender
    if (action === 'defend') {
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

      const myEnergyField = isHost ? 'host_energy' : 'guest_energy';
      const myDefendingField = isHost ? 'host_defending' : 'guest_defending';
      const currentEnergy = room[myEnergyField] ?? 100;

      // Recuperar energia (+20, max 100)
      const newEnergy = Math.min(100, currentEnergy + 20);
      const energyGained = newEnergy - currentEnergy;

      // Log de defesa
      const meuNome = isHost ? room.host_nome : room.guest_nome;
      const battleLog = adicionarLogBatalha(room.battle_log || [], {
        acao: 'defend',
        jogador: meuNome,
        energiaRecuperada: energyGained
      });

      const updates = {
        [myEnergyField]: newEnergy,
        [myDefendingField]: true, // Ativa defesa
        current_turn: isHost ? 'guest' : 'host', // Passa o turno
        battle_log: battleLog
      };

      await updateDocument('pvp_duel_rooms', roomId, updates);

      return NextResponse.json({
        success: true,
        newEnergy,
        energyGained: newEnergy - currentEnergy
      });
    }

    // Ação: usar habilidade
    if (action === 'ability') {

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

      const habilidade = myAvatar.habilidades[abilityIndex];
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

      // Stats do atacante
      const forca = myAvatar?.forca ?? 10;
      const foco = myAvatar?.foco ?? 10;
      const resistenciaOponente = opponentAvatar?.resistencia ?? 10;
      const myExaustao = isHost ? (room.host_exaustao ?? 0) : (room.guest_exaustao ?? 0);
      const meuElemento = myAvatar?.elemento || 'Neutro';
      const elementoOponente = opponentAvatar?.elemento || 'Neutro';

      // Calcular multiplicador elemental
      const calcularMultiplicadorElemental = (atacante, defensor) => {
        const vantagens = {
          'Fogo': 'Vento',
          'Vento': 'Terra',
          'Terra': 'Eletricidade',
          'Eletricidade': 'Água',
          'Água': 'Fogo',
          'Luz': 'Sombra',
          'Sombra': 'Luz'
        };
        if (vantagens[atacante] === defensor) {
          return { mult: 1.5, tipo: 'vantagem' };
        }
        if (vantagens[defensor] === atacante) {
          return { mult: 0.75, tipo: 'desvantagem' };
        }
        return { mult: 1.0, tipo: 'neutro' };
      };

      const elemental = calcularMultiplicadorElemental(meuElemento, elementoOponente);

      let dano = 0;
      let cura = 0;
      let efeito = '';
      let critico = false;
      let numGolpes = 1;

      // ===== TESTE DE ACERTO DA HABILIDADE =====
      // Habilidades têm chance de acerto configurada (padrão 100% se não especificado)
      const chanceAcertoBase = habilidade.chance_acerto ?? 100;
      const agilidadeOponente = opponentAvatar?.agilidade ?? 10;

      // Verificar buffs de evasão do oponente
      const opponentEffects = isHost ? (room.guest_effects || []) : (room.host_effects || []);
      const temInvisibilidade = opponentEffects.some(ef => ef.tipo === 'invisivel' || ef.tipo === 'invisível');
      const temEvasaoAumentada = opponentEffects.some(ef => ef.tipo === 'evasao_aumentada');
      const temVelocidadeAumentada = opponentEffects.some(ef => ef.tipo === 'velocidade' || ef.tipo === 'velocidade_aumentada');

      // Invisibilidade = sempre esquiva (a menos que seja habilidade de 100% acerto)
      if (temInvisibilidade && chanceAcertoBase < 100) {
        // Invisível = evasão automática
        const newEnergy = currentEnergy - custoEnergia;

        // Log de esquiva por invisibilidade
        const meuNome = isHost ? room.host_nome : room.guest_nome;
        const oponenteNome = isHost ? room.guest_nome : room.host_nome;
        const battleLog = adicionarLogBatalha(room.battle_log || [], {
          acao: 'ability',
          jogador: meuNome,
          alvo: oponenteNome,
          habilidade: habilidade.nome,
          errou: true,
          esquivou: true,
          invisivel: true
        });

        await updateDocument('pvp_duel_rooms', roomId, {
          [myEnergyField]: newEnergy,
          current_turn: isHost ? 'guest' : 'host',
          battle_log: battleLog
        });

        return NextResponse.json({
          success: true,
          errou: true,
          esquivou: true,
          invisivel: true,
          dano: 0,
          nomeHabilidade: habilidade.nome,
          newEnergy,
          detalhes: {
            mensagem: 'Oponente está invisível!'
          }
        });
      }

      // Calcular bônus de evasão de buffs
      let bonusEvasao = 0;
      if (temEvasaoAumentada) bonusEvasao += 30; // +30% evasão
      if (temVelocidadeAumentada) bonusEvasao += 15; // +15% evasão

      // Chance final = chance base da habilidade - (agilidade oponente × 0.5%) - bônus de evasão
      // Exemplo: habilidade 90% contra oponente com 20 AGI + evasão aumentada = 90% - 10% - 30% = 50%
      let chanceAcertoFinal = chanceAcertoBase - (agilidadeOponente * 0.5) - bonusEvasao;
      chanceAcertoFinal = Math.min(100, Math.max(5, chanceAcertoFinal)); // Mínimo 5%, máximo 100%
      const rolouAcerto = Math.random() * 100;
      const acertou = rolouAcerto < chanceAcertoFinal;

      let detalhesCalculo = {};

      if (!acertou && (habilidade.tipo === 'Ofensiva' || habilidade.tipo === 'Controle')) {
        // Habilidade ERROU - consome energia mas não causa efeito
        const newEnergy = currentEnergy - custoEnergia;

        // Log de erro
        const meuNome = isHost ? room.host_nome : room.guest_nome;
        const oponenteNome = isHost ? room.guest_nome : room.host_nome;
        const battleLog = adicionarLogBatalha(room.battle_log || [], {
          acao: 'ability',
          jogador: meuNome,
          alvo: oponenteNome,
          habilidade: habilidade.nome,
          errou: true,
          chanceAcerto: Math.floor(chanceAcertoFinal)
        });

        await updateDocument('pvp_duel_rooms', roomId, {
          [myEnergyField]: newEnergy,
          current_turn: isHost ? 'guest' : 'host',
          battle_log: battleLog
        });

        return NextResponse.json({
          success: true,
          errou: true,
          dano: 0,
          nomeHabilidade: habilidade.nome,
          newEnergy,
          detalhes: {
            chanceAcerto: Math.floor(chanceAcertoFinal),
            chanceAcertoBase,
            agilidadeOponente,
            reducaoEvasao: Math.floor(agilidadeOponente * 0.5),
            rolouAcerto: Math.floor(rolouAcerto)
          }
        });
      }

      // Calcular dano baseado no tipo de habilidade
      // Habilidades Ofensivas e de Controle geralmente causam dano
      if (habilidade.tipo === 'Ofensiva' || habilidade.tipo === 'Controle' || habilidade.dano_base > 0) {
        // Dano base da habilidade + multiplicador de stat
        const danoBase = habilidade.dano_base || 15;
        const multiplicadorStat = habilidade.multiplicador_stat || 0.5;

        // Usar o stat primário da habilidade (forca, foco, agilidade, etc.)
        const statPrimario = habilidade.stat_primario || 'forca';
        const statValue = myAvatar?.[statPrimario] ?? forca;

        const random = Math.floor(Math.random() * 5) + 1;
        dano = danoBase + (statValue * multiplicadorStat) + random;

        // ===== REDUÇÃO POR RESISTÊNCIA DO OPONENTE =====
        // Fórmula: Redução = resistência × 0.4 (mais impactante que ataques normais)
        const reducaoResistencia = resistenciaOponente * 0.4;
        dano = dano - reducaoResistencia;

        // ===== PENALIDADE DE EXAUSTÃO =====
        let penalidade = 1.0;
        let penalidadeTexto = '';
        if (myExaustao >= 80) { penalidade = 0.5; penalidadeTexto = '-50%'; }
        else if (myExaustao >= 60) { penalidade = 0.75; penalidadeTexto = '-25%'; }
        else if (myExaustao >= 40) { penalidade = 0.95; penalidadeTexto = '-5%'; }
        dano = dano * penalidade;

        // ===== BÔNUS DE VÍNCULO =====
        const vinculo = myAvatar?.vinculo ?? 0;
        let bonusVinculo = 1.0;
        let vinculoTexto = '';
        if (vinculo >= 80) { bonusVinculo = 1.2; vinculoTexto = '+20%'; }
        else if (vinculo >= 60) { bonusVinculo = 1.15; vinculoTexto = '+15%'; }
        else if (vinculo >= 40) { bonusVinculo = 1.1; vinculoTexto = '+10%'; }
        dano = dano * bonusVinculo;

        // ===== MULTIPLICADOR ELEMENTAL =====
        dano = dano * elemental.mult;

        // ===== CHANCE DE CRÍTICO =====
        const chanceCritico = 5 + (foco * 0.3);
        critico = Math.random() * 100 < chanceCritico;
        if (critico) {
          dano = dano * 2;
        }

        // ===== BLOQUEIO (DEFENDENDO) =====
        const opponentDefending = isHost ? room.guest_defending : room.host_defending;
        const bloqueado = opponentDefending;
        if (bloqueado) {
          dano = Math.floor(dano * 0.5);
        }

        // Garantir dano mínimo de 1
        dano = Math.max(1, Math.floor(dano));

        // ===== MÚLTIPLOS GOLPES =====
        // Se a habilidade tem num_golpes, multiplica o dano
        numGolpes = habilidade.num_golpes || 1;
        if (numGolpes > 1) {
          dano = dano * numGolpes;
        }

        // Salvar detalhes do cálculo
        detalhesCalculo = {
          danoBase: Math.floor(danoBase + (statValue * multiplicadorStat)),
          stat: statPrimario,
          statValue,
          random,
          reducaoResistencia: Math.floor(reducaoResistencia),
          resistenciaOponente,
          penalidadeExaustao: penalidadeTexto,
          bonusVinculo: vinculoTexto,
          elementalMult: elemental.mult,
          chanceCritico: Math.floor(chanceCritico),
          bloqueado
        };
      }

      // ===== VERIFICAR CONTRA-ATAQUE (HABILIDADES OFENSIVAS) =====
      let contraAtaqueAplicado = false;
      const currentOpponentEffectsBeforeAbility = isHost ? (room.guest_effects || []) : (room.host_effects || []);
      const temContraAtaqueHabilidade = currentOpponentEffectsBeforeAbility.some(ef => ef.tipo === 'queimadura_contra_ataque');

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
        'eletrocutado': '⚡', 'afogamento': '💧', 'erosão': '🌪️',
        // Buffs
        'defesa_aumentada': '🛡️', 'velocidade': '💨', 'foco_aumentado': '🎯',
        'forca_aumentada': '💪', 'regeneração': '✨', 'escudo': '🛡️',
        // Debuffs
        'lentidão': '🐌', 'fraqueza': '⬇️', 'confusão': '🌀',
        'medo': '😱', 'cegueira': '🌑', 'silêncio': '🔇',
        // Controle
        'congelado': '❄️', 'atordoado': '💫', 'paralisado': '⚡⚡',
        'imobilizado': '🔒', 'sono': '😴',
        // Especiais
        'fantasma': '👻', 'drenar': '🗡️', 'maldição': '💀',
        'queimadura_contra_ataque': '🔥🛡️'
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

          const valorEfeito = typeof efeitoConfig === 'object' ? (efeitoConfig.valor || 10) : 10;
          const duracaoEfeito = habilidade.duracao_efeito || 3;

          // Determinar dano por turno baseado no tipo
          let danoPorTurno = 0;
          if (['queimadura', 'veneno', 'sangramento', 'eletrocutado', 'afogamento', 'erosão'].includes(tipoEfeito)) {
            danoPorTurno = Math.floor(forca * 0.2) + 5;
          }
          if (tipoEfeito === 'queimadura_intensa') {
            danoPorTurno = Math.floor(forca * 0.4) + 10;
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
        const curaBase = Math.abs(habilidade.dano_base) || 20;
        const statPrimario = habilidade.stat_primario || 'foco';
        const statValue = myAvatar?.[statPrimario] ?? foco;
        cura = curaBase + (statValue * (habilidade.multiplicador_stat || 0.5));
        cura = Math.floor(cura);
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

      // ===== APLICAR CONTRA-ATAQUE (se habilidade causou dano) =====
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
      const meuNome = isHost ? room.host_nome : room.guest_nome;
      const oponenteNome = isHost ? room.guest_nome : room.host_nome;
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
        elemental: elemental.tipo
      });

      const updates = {
        [myEnergyField]: newEnergy,
        [opponentDefendingField]: false,
        [opponentEffectsField]: currentOpponentEffects,
        [myEffectsField]: currentMyEffects,
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

      await updateDocument('pvp_duel_rooms', roomId, updates);

      return NextResponse.json({
        success: true,
        dano,
        cura,
        critico,
        bloqueado: detalhesCalculo.bloqueado || false,
        elemental: elemental.tipo,
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

    // Ação: render-se
    if (action === 'surrender') {
      // Verificar se sala está ativa
      if (room.status !== 'active') {
        return NextResponse.json(
          { error: 'Batalha não está ativa' },
          { status: 400 }
        );
      }

      // Log de rendição
      const meuNome = isHost ? room.host_nome : room.guest_nome;
      const oponenteNome = isHost ? room.guest_nome : room.host_nome;
      const battleLog = adicionarLogBatalha(room.battle_log || [], {
        acao: 'surrender',
        jogador: meuNome,
        vencedor: oponenteNome
      });

      // Marcar como finalizada e o oponente como vencedor
      const opponentRole = isHost ? 'guest' : 'host';
      await updateDocument('pvp_duel_rooms', roomId, {
        status: 'finished',
        winner: opponentRole,
        battle_log: battleLog
      });

      return NextResponse.json({
        success: true,
        message: 'Você se rendeu. O oponente venceu!',
        winner: opponentRole
      });
    }

    // Ação: processar efeitos (chamado no início do turno)
    if (action === 'process_effects') {
      const myEffectsField = isHost ? 'host_effects' : 'guest_effects';
      const myHpField = isHost ? 'host_hp' : 'guest_hp';
      let myEffects = room[myEffectsField] || [];
      let currentHp = isHost ? room.host_hp : room.guest_hp;
      const hpMax = isHost ? (room.host_hp_max || 100) : (room.guest_hp_max || 100);

      const logsEfeitos = [];
      let danoTotal = 0;
      let curaTotal = 0;

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
      for (const ef of myEffects) {
        // Aplicar dano contínuo
        if (ef.danoPorTurno > 0) {
          danoTotal += ef.danoPorTurno;
          const emoji = ef.tipo === 'queimadura' ? '🔥' : ef.tipo === 'veneno' ? '💀' : '💥';
          logsEfeitos.push(`${emoji} ${ef.tipo}: -${ef.danoPorTurno} HP`);
        }

        // Regeneração (com ou sem acento)
        if (ef.tipo === 'regeneração' || ef.tipo === 'regeneracao') {
          const curaEfeito = Math.floor(hpMax * 0.05);
          curaTotal += curaEfeito;
          logsEfeitos.push(`✨ Regeneração: +${curaEfeito} HP`);
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

      await updateDocument('pvp_duel_rooms', roomId, updates);

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

    return NextResponse.json(
      { error: 'Ação inválida' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro em POST /api/pvp/room/state:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
