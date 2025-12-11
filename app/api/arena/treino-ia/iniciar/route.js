// ==================== API: INICIAR TREINO COM IA ====================
// Arquivo: /app/api/arena/treino-ia/iniciar/route.js

import { NextResponse } from 'next/server';
import { getDocument } from '@/lib/firebase/firestore';
import { selecionarHabilidadesIniciais } from '@/app/avatares/sistemas/abilitiesSystem';
import { escolherPersonalidade } from '@/lib/pvp/ai-engine';
import { aplicarSinergia } from '@/lib/combat/synergyApplicator';

export const dynamic = 'force-dynamic';

/**
 * Gera um avatar IA balanceado baseado em poder
 */
function gerarAvatarIABalanceado(poderJogador, minPower, maxPower, dificuldade) {
  const elementos = ['Fogo', 'Água', 'Terra', 'Vento', 'Eletricidade', 'Sombra', 'Luz'];
  const elemento = elementos[Math.floor(Math.random() * elementos.length)];

  // Calcular poder alvo baseado na dificuldade e faixa de poder
  let multiplicadorDificuldade = 1.0;
  switch (dificuldade) {
    case 'facil':
      multiplicadorDificuldade = 0.7;
      break;
    case 'normal':
      multiplicadorDificuldade = 1.0;
      break;
    case 'dificil':
      multiplicadorDificuldade = 1.3;
      break;
    default:
      multiplicadorDificuldade = 1.0;
  }

  // Poder alvo do oponente
  const poderAlvo = Math.floor(poderJogador * multiplicadorDificuldade);

  // Garantir que está na faixa permitida
  const poderFinal = Math.max(minPower, Math.min(maxPower, poderAlvo));

  // Distribuir o poder em stats (força, agilidade, resistência, foco)
  // Poder total é aproximadamente: (força + agilidade + resistência + foco)
  const statsTotal = poderFinal;

  // Gerar distribuição aleatória de stats
  const distribuicao = gerarDistribuicaoStats(statsTotal);

  // Definir raridade baseada na dificuldade
  let raridade;
  const randRaridade = Math.random();

  switch (dificuldade) {
    case 'facil':
      raridade = 'Comum';
      break;
    case 'normal':
      raridade = randRaridade < 0.7 ? 'Comum' : 'Incomum';
      break;
    case 'dificil':
      raridade = randRaridade < 0.4 ? 'Raro' : randRaridade < 0.8 ? 'Incomum' : 'Comum';
      break;
    default:
      raridade = 'Comum';
  }

  // Gerar habilidades apropriadas
  const habilidades = selecionarHabilidadesIniciais(elemento, raridade);

  // Calcular nível baseado no poder
  const nivel = Math.max(1, Math.floor(poderFinal / 10));

  // Nomes temáticos por elemento
  const nomesPorElemento = {
    'Fogo': ['Ignis', 'Pyro', 'Blaze', 'Inferno', 'Ember'],
    'Água': ['Aqua', 'Hydro', 'Wave', 'Tide', 'Stream'],
    'Terra': ['Terra', 'Rock', 'Stone', 'Boulder', 'Granite'],
    'Vento': ['Zephyr', 'Gale', 'Breeze', 'Tempest', 'Storm'],
    'Eletricidade': ['Volt', 'Spark', 'Thunder', 'Lightning', 'Surge'],
    'Sombra': ['Shadow', 'Dark', 'Umbra', 'Shade', 'Phantom'],
    'Luz': ['Lux', 'Radiant', 'Shine', 'Glow', 'Aurora']
  };

  const sufixos = ['o Desafiante', 'o Treinador', 'o Guardião', 'o Protetor', 'o Adversário'];
  const nomeBase = nomesPorElemento[elemento][Math.floor(Math.random() * nomesPorElemento[elemento].length)];
  const sufixo = sufixos[Math.floor(Math.random() * sufixos.length)];
  const nome = `${nomeBase} ${sufixo}`;

  return {
    id: `ia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nome,
    elemento,
    raridade,
    nivel,
    forca: distribuicao.forca,
    agilidade: distribuicao.agilidade,
    resistencia: distribuicao.resistencia,
    foco: distribuicao.foco,
    habilidades,
    vivo: true,
    vinculo: 0,
    exaustao: 0,
    // Metadata para debugging
    _poderTotal: poderFinal,
    _dificuldade: dificuldade
  };
}

/**
 * Gera distribuição balanceada de stats
 */
function gerarDistribuicaoStats(total) {
  // Garantir valores mínimos
  const minPorStat = 5;
  const maxPorStat = Math.floor(total * 0.5); // Nenhum stat pode ter mais de 50% do total

  // Gerar pesos aleatórios
  const pesoForca = Math.random();
  const pesoAgilidade = Math.random();
  const pesoResistencia = Math.random();
  const pesoFoco = Math.random();

  const pesoTotal = pesoForca + pesoAgilidade + pesoResistencia + pesoFoco;

  // Distribuir o total baseado nos pesos
  let forca = Math.floor((pesoForca / pesoTotal) * total);
  let agilidade = Math.floor((pesoAgilidade / pesoTotal) * total);
  let resistencia = Math.floor((pesoResistencia / pesoTotal) * total);
  let foco = Math.floor((pesoFoco / pesoTotal) * total);

  // Ajustar para garantir que soma total
  const soma = forca + agilidade + resistencia + foco;
  const diferenca = total - soma;

  // Distribuir diferença aleatoriamente
  if (diferenca > 0) {
    const stats = ['forca', 'agilidade', 'resistencia', 'foco'];
    for (let i = 0; i < diferenca; i++) {
      const stat = stats[Math.floor(Math.random() * stats.length)];
      if (stat === 'forca') forca++;
      else if (stat === 'agilidade') agilidade++;
      else if (stat === 'resistencia') resistencia++;
      else if (stat === 'foco') foco++;
    }
  }

  // Garantir mínimos
  forca = Math.max(minPorStat, forca);
  agilidade = Math.max(minPorStat, agilidade);
  resistencia = Math.max(minPorStat, resistencia);
  foco = Math.max(minPorStat, foco);

  // Aplicar máximos
  forca = Math.min(maxPorStat, forca);
  agilidade = Math.min(maxPorStat, agilidade);
  resistencia = Math.min(maxPorStat, resistencia);
  foco = Math.min(maxPorStat, foco);

  return {
    forca,
    agilidade,
    resistencia,
    foco
  };
}

export async function POST(request) {
  try {
    const { userId, avatarId, suporteId, minPower, maxPower, dificuldade } = await request.json();

    if (!userId || !avatarId || minPower === undefined || maxPower === undefined || !dificuldade) {
      return NextResponse.json(
        { message: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Buscar avatar principal do jogador no Firestore
    const avatar = await getDocument('avatares', avatarId);

    if (!avatar || avatar.user_id !== userId) {
      return NextResponse.json(
        { message: 'Avatar não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se pode lutar
    if (!avatar.vivo) {
      return NextResponse.json(
        { message: 'Avatar está morto!' },
        { status: 400 }
      );
    }

    if (avatar.exaustao >= 100) {
      return NextResponse.json(
        { message: 'Avatar está colapsado! Precisa descansar.' },
        { status: 400 }
      );
    }

    // Buscar avatar suporte (opcional)
    let avatarSuporte = null;
    let sinergiaInfo = null;

    if (suporteId) {
      avatarSuporte = await getDocument('avatares', suporteId);

      if (!avatarSuporte || avatarSuporte.user_id !== userId) {
        return NextResponse.json(
          { message: 'Avatar suporte não encontrado' },
          { status: 404 }
        );
      }

      // Aplicar sinergia entre Principal e Suporte
      const resultado = aplicarSinergia(avatar, avatarSuporte);

      // Substituir stats do avatar principal pelos stats com sinergia aplicada
      Object.assign(avatar, resultado.stats);

      // Armazenar informações da sinergia
      sinergiaInfo = {
        ...resultado.synergy,
        modificadores: resultado.modificadores,
        avatarSuporte: {
          id: avatarSuporte.id,
          nome: avatarSuporte.nome,
          elemento: avatarSuporte.elemento,
          nivel: avatarSuporte.nivel
        }
      };

      console.log('✨ Sinergia aplicada:', {
        principal: avatar.nome,
        suporte: avatarSuporte.nome,
        sinergia: sinergiaInfo.nome,
        modificadores: Object.keys(resultado.modificadores).length
      });
    }

    // Calcular poder do avatar do jogador
    const poderJogador = (avatar.forca || 0) + (avatar.agilidade || 0) +
                         (avatar.resistencia || 0) + (avatar.foco || 0);

    console.log('🎮 Iniciando treino IA:', {
      jogador: avatar.nome,
      poderJogador,
      faixa: `${minPower}-${maxPower}`,
      dificuldade
    });

    // Gerar oponente IA balanceado (Principal)
    const oponentePrincipal = gerarAvatarIABalanceado(poderJogador, minPower, maxPower, dificuldade);

    // Gerar avatar suporte da IA (menor poder, elemento diferente)
    const elementosSuporte = ['Fogo', 'Água', 'Terra', 'Vento', 'Eletricidade', 'Sombra', 'Luz', 'Void', 'Aether']
      .filter(el => el !== oponentePrincipal.elemento);
    const elementoSuporte = elementosSuporte[Math.floor(Math.random() * elementosSuporte.length)];

    // Suporte tem poder menor (70-85% do principal)
    const poderSuporte = Math.floor(oponentePrincipal._poderTotal * (0.7 + Math.random() * 0.15));
    const oponenteSuporte = gerarAvatarIABalanceado(poderJogador, Math.max(0, poderSuporte - 5), poderSuporte + 5, dificuldade);
    oponenteSuporte.elemento = elementoSuporte;
    oponenteSuporte.nome = `${oponenteSuporte.nome} (Suporte)`;

    // Aplicar sinergia da IA
    const resultadoSinergiaIA = aplicarSinergia(oponentePrincipal, oponenteSuporte);
    Object.assign(oponentePrincipal, resultadoSinergiaIA.stats);

    const sinergiaIA = {
      ...resultadoSinergiaIA.synergy,
      modificadores: resultadoSinergiaIA.modificadores,
      avatarSuporte: {
        id: oponenteSuporte.id,
        nome: oponenteSuporte.nome,
        elemento: oponenteSuporte.elemento,
        nivel: oponenteSuporte.nivel
      }
    };

    // Escolher personalidade da IA
    const personalidadeIA = escolherPersonalidade();

    console.log('🤖 Oponente IA gerado:', {
      principal: {
        nome: oponentePrincipal.nome,
        elemento: oponentePrincipal.elemento,
        poder: oponentePrincipal._poderTotal
      },
      suporte: {
        nome: oponenteSuporte.nome,
        elemento: oponenteSuporte.elemento,
        poder: oponenteSuporte._poderTotal
      },
      sinergia: sinergiaIA.nome,
      personalidade: personalidadeIA.tipo
    });

    // Retornar dados para o frontend
    return NextResponse.json({
      sucesso: true,
      oponente: oponentePrincipal,
      personalidadeIA,
      dificuldade,
      sinergia: sinergiaInfo, // Sinergia do jogador
      sinergiaIA: sinergiaIA // Sinergia da IA
    });

  } catch (error) {
    console.error('Erro ao iniciar treino IA:', error);
    return NextResponse.json(
      { message: 'Erro ao iniciar treino', erro: error.message },
      { status: 500 }
    );
  }
}
