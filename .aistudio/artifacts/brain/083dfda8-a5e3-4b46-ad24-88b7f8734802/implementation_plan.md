# Fluxo Direto de Checkout InfinitePay — Ultra Volleyball

Plano de implementação para garantir que, ao clicar no botão **Pagar**, o participante seja direcionado imediatamente na mesma aba para o checkout oficial hospedado da InfinitePay (`$athrios-solucoes`), retornando após o pagamento para a tela de processamento e confirmação com comprovante.

---

### Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> **Decisões alinhadas na Fase 1:**
> - **Abertura do Checkout:** Redirecionamento direto na mesma aba do navegador (`window.location.href`), garantindo conformidade com dispositivos móveis e navegadores que bloqueiam popups.
> - **Fluxo Pós-Pagamento:** Retorno automático da InfinitePay para a tela de processamento (`/pagamento/processando?order_nsu=...`) com verificação em tempo real do status e transição automática para a tela de confirmação (`/inscricao/sucesso`) com comprovante oficial.
> - **Handle Oficial:** `$athrios-solucoes` em modo de produção (com endpoint oficial `https://pay.infinitepay.io/athrios-solucoes/{valor}`).

---

## 1. Visão Geral & Experiência do Usuário

O objetivo é proporcionar um fluxo de compra fluido, esportivo e confiável para os alunos e responsáveis da Ultra Volleyball:

1. O participante preenche seu nome, seleciona sua turma e escolhe o tamanho da camiseta (com acesso rápido à tabela oficial de medidas).
2. O resumo do pedido exibe exatamente 1 camiseta por R$ 60,00 (valor protegido e controlado exclusivamente pelo servidor).
3. Ao clicar em **Pagar**, o botão entra imediatamente em estado de carregamento (*"Gerando pagamento..."*), impedindo cliques duplos.
4. O backend registra a inscrição pendente, gera o identificador criptográfico `order_nsu` e o link oficial da InfinitePay.
5. O navegador redireciona o participante para o checkout seguro da InfinitePay:
   `https://pay.infinitepay.io/athrios-solucoes/60.00?order_nsu=...&redirect_url=...`
6. O cliente realiza o pagamento via PIX ou Cartão de Crédito.
7. Concluída a transação, a InfinitePay devolve o usuário à URL de retorno do sistema.
8. A tela de processamento confirma o pagamento junto ao servidor e exibe a tela de sucesso com confetes, código da inscrição (`ULTRA-XXXXXX`), comprovante e detalhes para confecção.

---

## 2. Diagrama da Arquitetura e Ciclo de Vida

```
┌─────────────────────────┐
│   Formulário Público    │  (1) Preenche dados & clica em "Pagar"
│   /inscricao            │
└────────────┬────────────┘
             │ POST /api/registrations (Validação + Snapshot R$ 60,00)
             │ POST /api/create-order (Idempotência com attempt_id)
             ▼
┌─────────────────────────┐
│  Servidor Ultra / API   │  (2) Gera order_nsu e link oficial
│  InfinitePayProvider    │
└────────────┬────────────┘
             │ Retorna checkoutUrl (https://pay.infinitepay.io/athrios-solucoes/60.00)
             ▼
┌─────────────────────────┐
│ Checkout InfinitePay    │  (3) Cliente paga via PIX ou Cartão
│ (Ambiente Produção)     │
└────────────┬────────────┘
             │ Retorna via redirect_url
             ▼
┌─────────────────────────┐
│ Tela de Processamento   │  (4) Polling POST /api/payment-check
│ /pagamento/processando  │      e GET /api/order-status
└────────────┬────────────┘
             │ Confirmação validada
             ▼
┌─────────────────────────┐
│   Tela de Sucesso       │  (5) Confetes, Comprovante, Código ULTRA-XXXXXX
│   /inscricao/sucesso    │      e medidas oficiais em cm
└─────────────────────────┘
```

---

## 3. Detalhamento Técnico das Modificações

### 3.1. Formulário Público (`src/pages/PublicFormPage.tsx`)
- Garantir que o manipulador de submissão do formulário (`handleSubmit`) execute o redirecionamento direto via `window.location.assign(orderResponse.checkout_url)` ou `window.location.href`.
- Bloquear o botão imediatamente após o clique para assegurar idempotência visual e de rede.
- Tratar cenários onde o retorno da API indique erro amigável na tela caso haja instabilidade de conexão.

### 3.2. Provedor InfinitePay (`src/services/InfinitePayProvider.ts` e `server/infinitepay.ts`)
- Configurar o link de redirecionamento no formato padrão de produção:
  ```
  https://pay.infinitepay.io/athrios-solucoes/{amountReais}?order_nsu={orderNsu}&customer_name={name}&description={desc}&redirect_url={returnUrl}
  ```
- O parâmetro `redirect_url` recebe a URL completa do ambiente com a rota `/pagamento/processando?order_nsu={orderNsu}` devidamente codificada (`encodeURIComponent`).

### 3.3. Tela de Processamento (`src/pages/ProcessingPage.tsx`)
- Realizar checagens periódicas via `/api/payment-check` a cada 2 segundos.
- Disponibilizar botão explícito de "Verificar agora" para o cliente que retornou da tela da InfinitePay.
- Transicionar para `/inscricao/sucesso?order_nsu={orderNsu}` assim que o status da inscrição mudar para `confirmed`.

### 3.4. Painel Administrativo (`/admin`)
- Manter a flexibilidade no painel `/admin/configuracoes` para permitir ao administrador visualizar o link direto, testar a URL da InfinitePay e alternar para o modo Sandbox para testes internos quando necessário.

---

## 4. Plano de Verificação e Testes

1. **Submissão e Redirecionamento:**
   - Preencher o formulário público com dados de teste.
   - Clicar em "Pagar" e validar que o navegador abre a URL oficial da InfinitePay com handle `athrios-solucoes` e valor R$ 60,00 na mesma aba.
2. **Idempotência:**
   - Validar que o `attempt_id` impede geração de ordens duplicadas para a mesma submissão.
3. **Fluxo de Retorno:**
   - Simular o retorno da InfinitePay para `/pagamento/processando?order_nsu=...`.
   - Garantir que a tela consulta o backend e exibe a mensagem de confirmação.
4. **Tela de Sucesso e Impressão:**
   - Validar a exibição dos dados da camiseta (tamanho, categoria, medidas em cm) e código da inscrição.
5. **Compilação e Linter:**
   - Executar `lint_applet` e `compile_applet` para assegurar ausência de erros de build.
