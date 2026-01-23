/**
 * Script para atualizar descrições de habilidades dos avatares existentes
 *
 * Uso: node scripts/atualizarHabilidadesAvatares.js
 *
 * O que faz:
 * - Busca todos os avatares do Firestore
 * - Atualiza descrições de habilidades conforme arquivos atualizados
 * - Útil após mudanças em abilities/*.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Importar habilidades
const { HABILIDADES_FOGO } = require('../app/avatares/sistemas/abilities/fogo.js');
const { HABILIDADES_SOMBRA } = require('../app/avatares/sistemas/abilities/sombra.js');
const { HABILIDADES_AGUA } = require('../app/avatares/sistemas/abilities/agua.js');
const { HABILIDADES_TERRA } = require('../app/avatares/sistemas/abilities/terra.js');
const { HABILIDADES_VENTO } = require('../app/avatares/sistemas/abilities/vento.js');
const { HABILIDADES_ELETRICIDADE } = require('../app/avatares/sistemas/abilities/eletricidade.js');
const { HABILIDADES_LUZ } = require('../app/avatares/sistemas/abilities/luz.js');
const { HABILIDADES_VOID } = require('../app/avatares/sistemas/abilities/void.js');
const { HABILIDADES_AETHER } = require('../app/avatares/sistemas/abilities/aether.js');

// Mapear habilidades por nome
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

// Inicializar Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function atualizarHabilidadesAvatares() {
  console.log('🔄 Iniciando atualização de habilidades dos avatares...\n');

  try {
    // Buscar todos os avatares
    const avatarsSnapshot = await db.collection('avatares').get();

    if (avatarsSnapshot.empty) {
      console.log('⚠️  Nenhum avatar encontrado no banco de dados.');
      return;
    }

    console.log(`📊 Encontrados ${avatarsSnapshot.size} avatares\n`);

    let totalAtualizados = 0;
    let totalErros = 0;

    for (const doc of avatarsSnapshot.docs) {
      const avatar = doc.data();
      const avatarId = doc.id;

      try {
        // Verificar se o avatar tem habilidades
        if (!avatar.habilidades || !Array.isArray(avatar.habilidades)) {
          console.log(`⏭️  Pulando ${avatar.nome} (sem habilidades)`);
          continue;
        }

        let atualizou = false;
        const habilidadesAtualizadas = avatar.habilidades.map(hab => {
          // Buscar habilidade atualizada pelo nome
          const habAtualizada = TODAS_HABILIDADES[hab.nome];

          if (!habAtualizada) {
            console.log(`  ⚠️  Habilidade "${hab.nome}" não encontrada nos arquivos`);
            return hab; // Manter original
          }

          // Verificar se a descrição mudou
          if (hab.descricao !== habAtualizada.descricao) {
            console.log(`  ✏️  ${hab.nome}:`);
            console.log(`     Antes: ${hab.descricao}`);
            console.log(`     Depois: ${habAtualizada.descricao}`);
            atualizou = true;
          }

          // Retornar habilidade atualizada (mantendo estrutura completa)
          return {
            nome: habAtualizada.nome,
            descricao: habAtualizada.descricao,
            tipo: habAtualizada.tipo,
            raridade: habAtualizada.raridade,
            elemento: habAtualizada.elemento,
            custo_energia: habAtualizada.custo_energia,
            cooldown: habAtualizada.cooldown,
            dano_base: habAtualizada.dano_base,
            multiplicador_stat: habAtualizada.multiplicador_stat,
            stat_primario: habAtualizada.stat_primario,
            efeitos_status: habAtualizada.efeitos_status || [],
            alvo: habAtualizada.alvo,
            area: habAtualizada.area,
            num_alvos: habAtualizada.num_alvos,
            chance_acerto: habAtualizada.chance_acerto,
            chance_efeito: habAtualizada.chance_efeito,
            duracao_efeito: habAtualizada.duracao_efeito ?? null,
            nivel_minimo: habAtualizada.nivel_minimo,
            vinculo_minimo: habAtualizada.vinculo_minimo
          };
        });

        // Atualizar no banco se houve mudanças
        if (atualizou) {
          await db.collection('avatares').doc(avatarId).update({
            habilidades: habilidadesAtualizadas
          });
          console.log(`✅ ${avatar.nome} atualizado!\n`);
          totalAtualizados++;
        } else {
          console.log(`⏭️  ${avatar.nome} (sem mudanças)\n`);
        }

      } catch (error) {
        console.error(`❌ Erro ao atualizar ${avatar.nome}:`, error.message);
        totalErros++;
      }
    }

    console.log('\n📊 Resumo:');
    console.log(`  ✅ Avatares atualizados: ${totalAtualizados}`);
    console.log(`  ⏭️  Avatares sem mudanças: ${avatarsSnapshot.size - totalAtualizados - totalErros}`);
    console.log(`  ❌ Erros: ${totalErros}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  console.log('\n✅ Script finalizado!');
  process.exit(0);
}

// Executar
atualizarHabilidadesAvatares();
