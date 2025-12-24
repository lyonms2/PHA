# 📦 Arquivos Frontend Obsoletos - Arena

Estes arquivos foram arquivados em **24/12/2025** durante a refatoração do frontend de batalhas.

## Motivo do Arquivamento

Páginas antigas que foram substituídas por implementações mais modernas e específicas:

### `/batalha/` - Página Unificada Antiga
- **Tamanho:** 14KB
- **Status:** Apenas redirecionava para `/arena/pvp/duel`
- **Motivo:** Substituída por páginas específicas (PVP e Treinamento)
- **Componentes inclusos:**
  - `components/BattleArena.jsx`
  - `components/BattleActions.jsx`
  - `components/BattleResult.jsx`
  - `components/BattleLog.jsx`
  - `hooks/usePvPSync.js`

### `/batalha-teste/` - Página de Teste
- **Tamanho:** 14KB
- **Status:** Página de desenvolvimento/teste
- **Motivo:** Não estava em uso ativo

## Páginas Ativas Atualmente

1. **`/app/arena/pvp/duel/page.jsx`** - PVP ao vivo
2. **`/app/arena/treinamento/batalha/page.jsx`** - Treino vs IA

## Mudanças Relacionadas

Na mesma refatoração:
- ✅ Centralizado `battleEffects.js` em `/lib/arena/`
- ✅ Normalizado case sensitivity de efeitos (lowercase)
- ✅ Removido código duplicado
- ✅ Unificado imports entre PVP e Treinamento

## Restauração

Se precisar restaurar:
```bash
# Voltar para app/arena/
mv scripts/archived/frontend/arena/batalha app/arena/
mv scripts/archived/frontend/arena/batalha-teste app/arena/
```

**Nota:** Não recomendado. Use as implementações modernas em `/pvp/duel` e `/treinamento/batalha`.
