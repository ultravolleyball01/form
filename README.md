# Ultra Volleyball — Inscrição de Camisetas

Aplicação React + Express para inscrição, escolha de camiseta, Checkout Integrado InfinitePay e administração.

## Requisitos

- Node.js 22.12 ou superior
- npm 11

## Desenvolvimento local

1. Copie `.env.example` para `.env` e substitua os valores de exemplo.
2. Use `INFINITEPAY_MODE=sandbox` durante o desenvolvimento.
3. Instale e execute:

```bash
npm ci
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

Na primeira inicialização local, se `ADMIN_INITIAL_PASSWORD` não estiver configurada, uma senha temporária é gerada e exibida uma única vez no terminal.

## Build de produção

```bash
npm run typecheck
npm run build
NODE_ENV=production npm start
```

O frontend é gerado em `dist/` e o servidor compilado em `dist-server/`.

## Variáveis obrigatórias em produção

- `NODE_ENV=production`
- `PORT`, normalmente fornecida pela hospedagem
- `APP_URL`, usando HTTPS e sem barra no final
- `ADMIN_SESSION_SECRET`, aleatório e com ao menos 32 caracteres
- `ADMIN_INITIAL_PASSWORD`, senha forte usada na primeira criação do banco
- `INFINITEPAY_HANDLE`, sem o caractere `$`
- `INFINITEPAY_MODE=production`

O servidor recusa inicialização em produção quando uma configuração obrigatória está ausente ou inválida.

## Pagamentos

O navegador nunca confirma um pagamento. A confirmação acontece somente pelo webhook exclusivo do pedido ou pela consulta server-to-server ao endpoint de `payment_check` da InfinitePay.

O simulador interno responde somente quando `INFINITEPAY_MODE=sandbox` e nunca fica disponível em produção.

## Deploy na Netlify

O projeto inclui `netlify.toml`, uma Netlify Function para toda a API e uma migration do Netlify Database.

1. Coloque o projeto em um repositório Git e importe-o na Netlify.
2. Em **Data & Storage > Database**, confirme a criação do Netlify Database. A dependência `@netlify/database` e a migration em `netlify/database/migrations` permitem o provisionamento automático durante o deploy.
3. Configure no painel, com escopo de Functions:

   - `ADMIN_SESSION_SECRET` com no mínimo 32 caracteres aleatórios;
   - `ADMIN_INITIAL_PASSWORD` com uma senha forte;
   - `INFINITEPAY_HANDLE` sem `$`;
   - `INFINITEPAY_MODE=production`.

4. O build e a pasta publicada são definidos pelo `netlify.toml`.
5. Depois do deploy, valide `https://SEU-DOMINIO/api/health`.

A Netlify fornece `URL` e `NETLIFY_DB_URL` automaticamente. Não copie a URL do banco para o frontend e não crie variáveis com prefixo `VITE_` para segredos.

As rotas `/api/*` são encaminhadas à Function Express. As demais rotas usam fallback para `index.html`, permitindo acesso direto às páginas do React.

## Docker opcional

```bash
docker build -t ultra-volleyball .
docker run --env-file .env -p 3000:3000 ultra-volleyball
```

## Verificação manual antes do deploy

- executar `npm ci`, `npm run typecheck` e `npm run build`;
- iniciar o artefato com `NODE_ENV=production`;
- verificar `/health`;
- testar inscrição e criação do checkout;
- confirmar que parâmetros adulterados no retorno não aprovam pagamento;
- validar webhook, pagamento duplicado e valor divergente;
- testar login, logout, alteração de senha, relatórios e exportação.

## Persistência

Em desenvolvimento sem Netlify, o sistema usa `data/ultra_db.json`, que está ignorado. Na Netlify, os dados são armazenados no PostgreSQL gerenciado através do Netlify Database. Operações mutáveis são serializadas em transação para evitar perda de atualização entre Functions concorrentes.
