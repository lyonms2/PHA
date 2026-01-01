# Configuração de Cron Jobs no Vercel - Limpeza Automática PVP

## 📋 O que foi configurado

Criamos um **Cron Job** no Vercel que executa automaticamente a limpeza de salas PVP antigas a cada 24 horas.

## 🔧 Configuração Atual

### Arquivo: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/pvp/cleanup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Significado:**
- `path`: Endpoint que será chamado automaticamente
- `schedule`: `0 3 * * *` = Todo dia às 3h da manhã (horário UTC)

## ⏰ Entendendo o formato do Schedule (Cron Expression)

```
 ┌───────────── minuto (0 - 59)
 │ ┌───────────── hora (0 - 23)
 │ │ ┌───────────── dia do mês (1 - 31)
 │ │ │ ┌───────────── mês (1 - 12)
 │ │ │ │ ┌───────────── dia da semana (0 - 6) (Domingo = 0)
 │ │ │ │ │
 │ │ │ │ │
 * * * * *
```

### Exemplos de Schedules:

```javascript
"0 3 * * *"      // Todo dia às 3h da manhã UTC
"0 */6 * * *"    // A cada 6 horas
"0 0 * * *"      // Todo dia à meia-noite UTC
"0 2 * * 0"      // Todo domingo às 2h UTC
"*/30 * * * *"   // A cada 30 minutos
"0 0,12 * * *"   // Às 00h e 12h UTC todos os dias
```

## 🚀 Como fazer o Deploy

### 1. Commitar o arquivo `vercel.json`

```bash
git add vercel.json
git commit -m "Configure Vercel cron job for PVP cleanup"
git push origin main
```

### 2. Deploy no Vercel

O Vercel detectará automaticamente o arquivo `vercel.json` no próximo deploy:

```bash
vercel --prod
```

Ou se você usa integração GitHub/GitLab, apenas faça push para a branch principal.

## ✅ Verificando se está funcionando

### 1. Via Dashboard do Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Cron Jobs**
4. Você verá a lista de cron jobs configurados
5. Clique em **View Logs** para ver execuções

### 2. Via Logs em Tempo Real

1. No dashboard, vá em **Logs**
2. Filtre por `[PVP CLEANUP]`
3. Você verá logs como:

```
🧹 [PVP CLEANUP] Iniciando limpeza de salas antigas...
📊 [PVP CLEANUP] Encontradas 5 salas finalizadas
🗑️ [PVP CLEANUP] 3 salas com mais de 24h serão deletadas
✅ [PVP CLEANUP] Sala deletada: abc123...
🎯 [PVP CLEANUP] Limpeza concluída: 3/3 salas deletadas
```

### 3. Testar Manualmente

Você pode testar a rota manualmente antes do cron executar:

```bash
# Local
curl http://localhost:3000/api/pvp/cleanup

# Produção
curl https://seu-dominio.vercel.app/api/pvp/cleanup
```

Resposta esperada:
```json
{
  "success": true,
  "message": "Limpeza concluída com sucesso",
  "total_finalizadas": 5,
  "antigas": 3,
  "deleted": 3
}
```

## 📊 Monitoramento

### Ver próximas execuções

No Vercel Dashboard → Cron Jobs, você verá:
- ✅ **Status**: Active
- ⏰ **Next Run**: Data/hora da próxima execução
- 📜 **Last Run**: Resultado da última execução

### Logs importantes

Procure por esses logs no Vercel:

| Emoji | Log | Significado |
|-------|-----|-------------|
| 🧹 | Iniciando limpeza | Cron job iniciou |
| 📊 | X salas finalizadas | Total de salas finished encontradas |
| 🗑️ | Y salas antigas | Salas que serão deletadas |
| ✅ | Sala deletada | Confirmação de deleção |
| 🎯 | Limpeza concluída | Resumo final |
| ❌ | Erro ao deletar | Falha na deleção |

## ⚙️ Limitações do Vercel Cron

### Plano Hobby (Gratuito):
- ✅ Disponível
- ⏱️ Mínimo: execução a cada 1 dia
- 📊 Máximo: 2 cron jobs

### Plano Pro:
- ⏱️ Mínimo: execução a cada 1 minuto
- 📊 Máximo: 20 cron jobs por projeto

## 🔄 Alternativas se precisar mais frequência

Se você estiver no plano gratuito e precisar executar mais vezes por dia, considere:

### Opção 1: Serviço externo (cron-job.org)

1. Crie conta em https://cron-job.org
2. Adicione novo job:
   - URL: `https://seu-dominio.vercel.app/api/pvp/cleanup`
   - Schedule: Configure como quiser (ex: a cada 6 horas)

### Opção 2: GitHub Actions

Crie `.github/workflows/cleanup.yml`:

```yaml
name: PVP Cleanup
on:
  schedule:
    - cron: '0 */6 * * *'  # A cada 6 horas
  workflow_dispatch:  # Permite execução manual

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup endpoint
        run: curl https://seu-dominio.vercel.app/api/pvp/cleanup
```

### Opção 3: Executar manualmente quando necessário

Simplesmente visite a URL no navegador:
```
https://seu-dominio.vercel.app/api/pvp/cleanup
```

## 🛠️ Troubleshooting

### Cron não aparece no Dashboard

**Problema**: Arquivo `vercel.json` não foi detectado

**Solução**:
1. Verifique se `vercel.json` está na **raiz** do projeto
2. Faça novo deploy: `vercel --prod`
3. Aguarde 1-2 minutos para Vercel processar

### Cron falha ao executar

**Problema**: Timeout ou erro 500

**Solução**:
1. Teste a rota manualmente primeiro
2. Verifique logs de erro no Vercel
3. Verifique se Firebase tem permissões corretas

### Horário está errado

**Problema**: Cron executa em horário diferente do esperado

**Solução**:
- Vercel usa **UTC** timezone
- Se você está em **BRT** (Brasília -3h), ajuste:
  - 3h UTC = 0h BRT
  - 6h UTC = 3h BRT
  - 12h UTC = 9h BRT

Para executar às 3h BRT, use: `"0 6 * * *"` (6h UTC)

## 📝 Notas Importantes

1. **Primeira execução**: Pode levar até 24h após deploy
2. **Timeout**: Vercel tem limite de 10s (plano hobby) ou 60s (pro) para serverless functions
3. **Cold starts**: Se houver muitas salas, considere paginar a limpeza
4. **Logs**: Ficam disponíveis por 7 dias no plano gratuito

## 🎯 Resumo - Checklist

- [x] Criar `vercel.json` na raiz do projeto
- [x] Configurar schedule no formato cron
- [ ] Fazer commit e push
- [ ] Deploy no Vercel
- [ ] Verificar no Dashboard → Cron Jobs
- [ ] Testar manualmente primeiro
- [ ] Aguardar primeira execução automática
- [ ] Monitorar logs

## 📚 Referências

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Vercel Dashboard](https://vercel.com/dashboard)
