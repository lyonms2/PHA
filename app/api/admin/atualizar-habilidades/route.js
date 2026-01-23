/**
 * API para atualizar descrições de habilidades dos avatares existentes
 *
 * GET /api/admin/atualizar-habilidades
 *
 * Atualiza todos os avatares no banco com as descrições mais recentes
 */

import { db } from '@/lib/firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { HABILIDADES_FOGO } from '@/app/avatares/sistemas/abilities/fogo';
import { HABILIDADES_SOMBRA } from '@/app/avatares/sistemas/abilities/sombra';
import { HABILIDADES_AGUA } from '@/app/avatares/sistemas/abilities/agua';
import { HABILIDADES_TERRA } from '@/app/avatares/sistemas/abilities/terra';
import { HABILIDADES_VENTO } from '@/app/avatares/sistemas/abilities/vento';
import { HABILIDADES_ELETRICIDADE } from '@/app/avatares/sistemas/abilities/eletricidade';
import { HABILIDADES_LUZ } from '@/app/avatares/sistemas/abilities/luz';
import { HABILIDADES_VOID } from '@/app/avatares/sistemas/abilities/void';
import { HABILIDADES_AETHER } from '@/app/avatares/sistemas/abilities/aether';
import { NextResponse } from 'next/server';

// Mapear todas as habilidades por nome
const TODAS_HABILIDADES = {};

function carregarHabilidades(habilidadesElemento) {
  Object.values(habilidadesElemento).forEach(hab => {
    TODAS_HABILIDADES[hab.nome] = hab;
  });
}

carregarHabilidades(HABILIDADES_FOGO);
carregarHabilidades(HABILIDADES_SOMBRA);
carregarHabilidades(HABILIDADES_AGUA);
carregarHabilidades(HABILIDADES_TERRA);
carregarHabilidades(HABILIDADES_VENTO);
carregarHabilidades(HABILIDADES_ELETRICIDADE);
carregarHabilidades(HABILIDADES_LUZ);
carregarHabilidades(HABILIDADES_VOID);
carregarHabilidades(HABILIDADES_AETHER);

export async function GET(request) {
  try {
    console.log('🔄 Iniciando atualização de habilidades dos avatares...\n');

    // Buscar todos os avatares
    const avatarsSnapshot = await getDocs(collection(db, 'avatares'));
    console.log(`📊 Total de avatares encontrados: ${avatarsSnapshot.size}`);

    let avatarsAtualizados = 0;
    let habilidadesAtualizadas = 0;
    const erros = [];

    for (const docSnap of avatarsSnapshot.docs) {
      const avatar = docSnap.data();
      const avatarId = docSnap.id;

      if (!avatar.habilidades || avatar.habilidades.length === 0) {
        console.log(`⚠️ Avatar ${avatar.nome} não tem habilidades, pulando...`);
        continue;
      }

      // Atualizar cada habilidade do avatar
      const habilidadesAtualizadasAvatar = avatar.habilidades.map(hab => {
        const habAtualizada = TODAS_HABILIDADES[hab.nome];

        if (habAtualizada) {
          habilidadesAtualizadas++;
          return {
            nome: habAtualizada.nome,
            descricao: habAtualizada.descricao,
            tipo: habAtualizada.tipo,
            elemento: habAtualizada.elemento,
            dano_base: habAtualizada.dano_base,
            multiplicador_stat: habAtualizada.multiplicador_stat,
            stat_primario: habAtualizada.stat_primario,
            custo_energia: habAtualizada.custo_energia,
            cooldown: habAtualizada.cooldown,
            chance_efeito: habAtualizada.chance_efeito,
            duracao_efeito: habAtualizada.duracao_efeito,
            efeitos_status: habAtualizada.efeitos_status || [],
            alvo: habAtualizada.alvo,
            ignora_defesa: habAtualizada.ignora_defesa,
            num_golpes: habAtualizada.num_golpes,
            nivel_minimo: habAtualizada.nivel_minimo || 1
          };
        }

        return hab; // Manter original se não encontrada
      });

      // Atualizar no Firestore
      try {
        await updateDoc(doc(db, 'avatares', avatarId), {
          habilidades: habilidadesAtualizadasAvatar
        });

        avatarsAtualizados++;
        console.log(`✅ Avatar ${avatar.nome} atualizado`);
      } catch (error) {
        erros.push({ avatar: avatar.nome, erro: error.message });
        console.error(`❌ Erro ao atualizar ${avatar.nome}:`, error.message);
      }
    }

    const resultado = {
      sucesso: true,
      avatarsAtualizados,
      habilidadesAtualizadas,
      totalAvatares: avatarsSnapshot.size,
      erros: erros.length > 0 ? erros : undefined
    };

    console.log('\n✅ Atualização concluída!');
    console.log(`📊 Resumo: ${avatarsAtualizados} avatares atualizados`);
    console.log(`📊 Total: ${habilidadesAtualizadas} habilidades atualizadas`);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('❌ Erro na atualização:', error);
    return NextResponse.json(
      {
        sucesso: false,
        erro: error.message
      },
      { status: 500 }
    );
  }
}
