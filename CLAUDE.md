# ObrasControle — App de Gestão de Obras e Construção Civil

## Stack
- React + Vite 5 (PWA)
- PocketBase como backend (mesmo servidor do financas-casa)
- E-mails enviados via servidor Node.js em mail.financascasa.online
- Frontend hospedado no VPS (nginx)
- URL: https://obras.financascasa.online

## Infraestrutura
- **VPS:** Locaweb — Debian 12 — IP em secrets do GitHub (VPS_HOST)
- **API compartilhada:** https://api.financascasa.online (PocketBase :8090)
- **App:** /var/www/obras-html/ (servido pelo nginx)
- **Código:** /var/www/obras-controle/

## Coleções no PocketBase (prefixo obras_)
- **obras_accounts**: email, name, password, role, status, parentEmail, mustChangePassword (bool), protected (bool)
- **obras_signup_requests**: email, name, requestedAt, status
- **obras_obras**: ownerEmail, nome, cliente, endereco, dataInicio, dataPrevisao, orcamento (number), obs, status
- **obras_gastos**: obraId, data, categoria, descricao, valor (number), obs
- **obras_etapas**: obraId, nome, ordem (number), status, obs
- **obras_pagamentos**: obraId, data, tipo, descricao, valor (number), status, paidAt
- **obras_diario**: obraId, data, descricao, trabalhadores (number), clima, obs

## Variáveis de ambiente (.env)
```
VITE_PB_URL=https://api.financascasa.online
VITE_ADMIN_EMAIL=<email_admin>
VITE_ADMIN_PASSWORD=<senha_admin>
```

## Comandos
- `npm run dev` — rodar local
- `npm run build` — gerar build
- `git add . && git commit -m "msg" && git push` — deploy automático

## Problemas conhecidos
- Usar Vite 5 (não 8) — Vite 8 falha com pocketbase no Linux
- PocketBase API Rules: deixar todos os campos vazios em cada coleção
- Não gerar IDs manuais — deixar o PocketBase criar
- Service worker: incrementar versão do CACHE em sw.js a cada deploy importante
- E-mail via mail.financascasa.online (Node.js + Gmail SMTP), não EmailJS
