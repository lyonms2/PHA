# 🎯 Guia de Teste: Sistema de Missões Diárias

## 📋 Pré-requisitos

Antes de começar os testes, certifique-se de que:
- ✅ Você tem uma conta de usuário criada
- ✅ Você já fez pelo menos uma invocação de avatar
- ✅ Você tem pelo menos 1 avatar ativo
- ✅ O servidor está rodando (`npm run dev`)

---

## 🚀 Passo 1: Acessar Missões Diárias

### Via Dashboard:
1. Faça login no jogo
2. No **Dashboard**, procure o botão **"MISSÕES DIÁRIAS"** (ícone 📋)
   - Localização: Coluna direita, logo abaixo de "O OCULTISTA"
   - Cor: Dourado/Âmbar
3. Clique no botão

### Via URL Direta:
Acesse: `http://localhost:3000/missoes-diarias`

### ✅ Resultado Esperado:
- Página carrega com 5 missões diárias
- Display do seu Hunter Rank no topo
- Contador de Streak (inicialmente 0 dias)
- Progresso das missões (inicialmente 0/meta)

---

## 🎮 Passo 2: Testar Tracking Automático

Execute as ações abaixo e verifique se o progresso é atualizado automaticamente:

### A) Testar Treino IA (VITORIA_TREINO)
1. Vá para **Arena** > **Treinamento**
2. Inicie uma batalha de treino
3. **Vença** a batalha
4. Volte para `/missoes-diarias` e **recarregue a página**
5. ✅ Verifique: Progresso de missões relacionadas a treino deve ter aumentado

**Missões afetadas:**
- "Guerreiro Iniciante" (3 vitórias treino)
- "Batalhas de Aquecimento" (5 vitórias treino)
- "Treinador Persistente" (10 vitórias treino)

### B) Testar PVP (PARTICIPAR_PVP, VITORIA_PVP)
1. Vá para **Arena** > **PVP**
2. Crie ou entre em uma sala
3. Complete a batalha (vitória ou derrota)
4. Volte para `/missoes-diarias` e **recarregue**
5. ✅ Verifique: Missões de PVP atualizadas

**Missões afetadas:**
- "Primeira Batalha Real" (1 PVP)
- "Lutador de Arena" (3 PVPs)
- "Campeão da Arena" (5 vitórias PVP)

### C) Testar Invocação (INVOCAR_AVATAR)
1. Vá para **O Ocultista**
2. Invoque um novo avatar
   - Se não tiver recursos, use o console do navegador:
   ```javascript
   // Adicionar recursos temporariamente
   fetch('/api/player-stats', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({userId: 'SEU_USER_ID', moedas: 5000, fragmentos: 100})
   })
   ```
3. Volte para `/missoes-diarias` e **recarregue**
4. ✅ Verifique: Missão de invocação atualizada

**Missões afetadas:**
- "Colecionador Iniciante" (2 invocações)
- "Invocador Experiente" (5 invocações)
- "Colecionador de Raros" (1 avatar raro)
- "Mestre Invocador" (1 avatar lendário)

### D) Testar Mercado (COMPRAR_AVATAR, VENDER_AVATAR)
1. Vá para **Mercado**
2. Coloque um avatar à venda (VENDER_AVATAR)
3. Volte para `/missoes-diarias` e **recarregue**
4. ✅ Verifique: Missão de vender atualizada

**Missões afetadas:**
- "Negociante Ativo" (3 vendas)
- "Comerciante" (2 compras)

### E) Testar Level Up (GANHAR_NIVEL)
1. Faça várias batalhas para ganhar XP
2. Quando um avatar subir de nível
3. Volte para `/missoes-diarias` e **recarregue**
4. ✅ Verifique: Missão de level up atualizada

**Missões afetadas:**
- "Caminho do Poder" (5 níveis)

---

## 🎁 Passo 3: Testar Coleta de Recompensas

### Coletar Missão Individual:
1. Complete uma missão (progresso = meta)
2. Recarregue a página
3. ✅ Verifique: Botão **"Coletar"** aparece na missão
4. Clique em **"Coletar"**
5. ✅ Verifique:
   - Alert mostra recompensas recebidas
   - Moedas/Fragmentos/XP atualizados no seu perfil
   - Botão muda para **"Coletada ✓"**

### Coletar Todas as Missões:
1. Complete **TODAS** as 5 missões do dia
2. Recarregue a página
3. ✅ Verifique: Banner especial **"🎉 Todas as Missões Concluídas!"**
4. Clique em **"Coletar Todas as Recompensas"**
5. ✅ Verifique:
   - Alert mostra recompensas totais
   - **Bônus de Streak** aplicado (se streak >= 3 dias)
   - Todas as missões marcadas como coletadas

---

## 🔥 Passo 4: Testar Sistema de Streaks

### Conceito:
- **Streak** = dias consecutivos completando **TODAS** as 5 missões
- Marcos: 3, 7, 14, 30 dias
- Quebra se você perder 1 dia

### Como Testar (Manualmente):

#### Método 1: Aguardar Dias Reais
1. Complete todas as 5 missões hoje
2. Colete todas
3. Aguarde até amanhã (00:00)
4. Novas missões serão geradas
5. Complete novamente
6. ✅ Verifique: Streak aumenta para 2 dias

#### Método 2: Manipular Data (Firestore)
1. Acesse o Firestore Console
2. Vá para coleção `daily_missions_progress`
3. Encontre seu documento (formato: `userId_YYYY-MM-DD`)
4. Modifique o campo `data` para ontem
5. Complete todas as missões
6. Colete todas
7. ✅ Verifique: Streak deve aumentar

**Marcos de Streak:**
- **3 dias**: +50 moedas
- **7 dias**: +100 moedas, +5 fragmentos
- **14 dias**: +200 moedas, +10 fragmentos, +1 Invocação Grátis
- **30 dias**: +500 moedas, +25 fragmentos, +Avatar Lendário

---

## ⭐ Passo 5: Testar Bônus Hunter Rank

### Conceito:
- Hunter Rank multiplica recompensas de missões
- Ranks: F (1.0x), E (1.05x), D (1.1x), C (1.15x), B (1.2x), A (1.25x), S (1.3x), SS (1.4x)

### Como Testar:
1. Verifique seu Hunter Rank atual no Dashboard
2. Complete uma missão
3. Ao coletar, observe as recompensas
4. ✅ Verifique: Valor recebido = base × multiplicador

**Exemplo:**
- Missão: 50 moedas base
- Hunter Rank A: 1.25x
- Recompensa final: 62 moedas (50 × 1.25)

### Aumentar Hunter Rank (para testar):
1. Faça várias ações (treino, PVP, invocar)
2. Ganhe XP de Caçador
3. Rank sobe automaticamente
4. Volte para missões e teste novamente

---

## 🐛 Passo 6: Verificar Logs e Debug

### Verificar Logs do Servidor:
```bash
# No terminal onde o servidor está rodando
# Procure por estas mensagens:
📋 [MISSÃO] Atualizada: <nome da missão> - <progresso>/<meta>
✅ [MISSÃO] Progresso salvo para evento: <tipo_evento>
```

### Verificar Logs do Navegador:
1. Abra DevTools (F12)
2. Vá para aba **Console**
3. Execute ações no jogo
4. ✅ Verifique: Sem erros relacionados a missões

### Verificar Firestore:
1. Acesse Firestore Console
2. Coleção: `daily_missions_progress`
3. ✅ Verifique estrutura do documento:
```javascript
{
  user_id: "...",
  data: "2025-12-05",
  missoes: [
    {
      id_unico: "...",
      nome: "...",
      progresso: 2,
      concluida: false,
      coletada: false,
      objetivo: {
        tipo: "VITORIA_TREINO",
        quantidade: 3
      },
      recompensas: {
        moedas: 50,
        fragmentos: 2,
        xpCacador: 10
      }
    }
  ],
  streak_dias_consecutivos: 1,
  todas_concluidas: false
}
```

---

## 📊 Checklist de Testes Completo

### ✅ UI e Navegação
- [ ] Botão "Missões Diárias" visível no Dashboard
- [ ] Página `/missoes-diarias` carrega sem erros
- [ ] 5 missões são exibidas
- [ ] Hunter Rank é exibido corretamente
- [ ] Contador de Streak é exibido
- [ ] Barras de progresso funcionam

### ✅ Tracking Automático
- [ ] Vitórias em treino normal atualizam missões
- [ ] Vitórias em treino difícil atualizam missões
- [ ] Participação em PVP atualiza missões
- [ ] Vitórias em PVP atualizam missões
- [ ] Invocações atualizam missões
- [ ] Compras no mercado atualizam missões
- [ ] Vendas no mercado atualizam missões
- [ ] Level up atualiza missões
- [ ] Aumento de vínculo atualiza missões

### ✅ Coleta de Recompensas
- [ ] Botão "Coletar" aparece quando missão completa
- [ ] Coletar missão individual funciona
- [ ] Recompensas são adicionadas ao player_stats
- [ ] Botão muda para "Coletada ✓"
- [ ] Botão "Coletar Todas" aparece quando todas completas
- [ ] Coletar todas funciona corretamente

### ✅ Sistema de Streaks
- [ ] Streak inicia em 0
- [ ] Streak aumenta ao completar todas as missões
- [ ] Bônus de 3 dias funciona (50 moedas)
- [ ] Bônus de 7 dias funciona (100 moedas + 5 fragmentos)
- [ ] Bônus de 14 dias funciona (200 moedas + 10 fragmentos)
- [ ] Bônus de 30 dias funciona (500 moedas + 25 fragmentos)

### ✅ Bônus Hunter Rank
- [ ] Recompensas são multiplicadas pelo Hunter Rank
- [ ] Indicador de bônus é exibido (ex: "+25% rank")
- [ ] Valores corretos são adicionados ao player_stats

### ✅ Geração de Missões
- [ ] Novas missões são criadas no primeiro acesso do dia
- [ ] Mesmas missões persistem durante o dia
- [ ] Missões são renovadas no dia seguinte
- [ ] Dificuldade balanceada (2 fáceis, 2 médias, 1 difícil)

---

## 🎯 Cenários de Teste Avançados

### Cenário 1: Completar Todas as Missões em Sequência
1. Complete missão 1 → Colete
2. Complete missão 2 → Colete
3. Complete missão 3 → Colete
4. Complete missão 4 → Colete
5. Complete missão 5 → Colete
6. ✅ Verifique: Streak aplicado corretamente

### Cenário 2: Completar Tudo Antes de Coletar
1. Complete todas as 5 missões
2. **NÃO colete individualmente**
3. Use "Coletar Todas"
4. ✅ Verifique: Todas recompensas recebidas + streak

### Cenário 3: Quebrar Streak
1. Complete todas as missões hoje
2. Colete todas (streak = 1)
3. **Não jogue amanhã**
4. Volte depois de amanhã
5. ✅ Verifique: Streak resetado para 0

### Cenário 4: Múltiplos Eventos em Uma Ação
1. Entre em PVP e vença
2. ✅ Verifique:
   - Missão "PARTICIPAR_PVP" atualiza
   - Missão "VITORIA_PVP" atualiza

---

## 🛠️ Troubleshooting

### Problema: Missões não aparecem
**Solução:**
1. Verifique se o servidor está rodando
2. Verifique console do navegador (F12)
3. Tente recarregar a página
4. Verifique se userId está correto

### Problema: Progresso não atualiza
**Solução:**
1. Recarregue a página após executar ação
2. Verifique logs do servidor
3. Verifique se a ação está mapeada para um evento
4. Confira Firestore para ver se progresso foi salvo

### Problema: Não consigo coletar recompensas
**Solução:**
1. Verifique se missão está realmente completa (progresso >= meta)
2. Recarregue a página
3. Verifique console do navegador
4. Verifique se já não foi coletada

### Problema: Streak não aumenta
**Solução:**
1. Verifique se completou TODAS as 5 missões
2. Verifique se coletou todas as recompensas
3. Verifique campo `todas_concluidas` no Firestore
4. Verifique se passou pelo menos 1 dia

---

## 📝 Notas Importantes

1. **Missões são geradas por dia**: Mesmo pool de missões durante todo o dia
2. **Progresso é salvo automaticamente**: Não precisa fazer nada manualmente
3. **Recompensas só são creditadas ao coletar**: Complete a missão E clique em "Coletar"
4. **Streak requer coletar TODAS as missões**: Não basta completar, precisa coletar
5. **Hunter Rank afeta TODAS as recompensas**: Incluindo bônus de streak

---

## 🎉 Próximos Passos Após Testar

Após validar que tudo está funcionando:

1. **Adicionar notificações visuais**: Toast quando missão for completada
2. **Adicionar conquistas**: Baseadas em streaks longos
3. **Adicionar modal de recompensa**: Mais elaborado que o alert
4. **Adicionar indicador no dashboard**: Mostrar quantas missões estão pendentes
5. **Adicionar sistema de missões semanais**: Missões mais difíceis, recompensas maiores

---

## 📞 Suporte

Se encontrar bugs ou comportamentos inesperados:
1. Anote os passos para reproduzir
2. Tire screenshots se possível
3. Verifique logs do servidor e navegador
4. Reporte o problema

Boa sorte nos testes! 🚀
