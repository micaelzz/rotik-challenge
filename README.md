# AI Agent Monitoring Dashboard — Rotik Fullstack Challenge

## 1. Contexto

Este projeto é um dashboard para monitoramento de agentes de inteligência artificial (AI Agents). A aplicação permite que usuários autenticados visualizem os agentes pertencentes à sua empresa (Client), acompanhem o consumo mensal de execuções contra o limite contratado, cadastrem novos agentes com limites herdados automaticamente do plano e acompanhem o histórico paginado de execuções.

A estrutura do repositório é organizada separando o **Backend** (`/backend`) e o **Frontend** (`/frontend`) em pastas dedicadas na raiz do projeto.

---

## 2. Discovery

Durante a análise técnica inicial, foram identificados os principais desafios do produto:
* **Garantia de limite estrito sob concorrência**: Múltiplas requisições simultâneas de execução para o mesmo agente não podem ultrapassar a quota mensal.
* **Isolamento multitenant (Client Isolation)**: Usuários de um cliente jamais podem visualizar ou executar agentes de outro cliente. Tentativas de acesso não autorizado devem retornar HTTP 404 (RESOURCE_NOT_FOUND) para evitar varredura ou divulgação da existência de recursos de terceiros.
* **Rollover automático de mês**: Viradas de mês devem iniciar automaticamente com quota limpa (0 execuções), permitindo que agentes bloqueados no mês anterior voltem a funcionar normalmente sem necessidade de rotinas cron de reset.

---

## 3. Perguntas e Assumptions (Discovery)

Na ausência de esclarecimentos adicionais, foram estabelecidas 5 premissas fundamentais para o desenvolvimento do MVP:

1. **Pergunta 1 (Execuções FAILED)**: *Execuções com falha devem consumir a quota do plano?*
   * **Assumption**: Somente execuções com status `SUCCESS` consomem a quota mensal. Execuções `FAILED` são salvas na tabela `executions` para fins de auditoria e diagnóstico do CS, mas **não** incrementam o contador em `agent_monthly_usages`.

2. **Pergunta 2 (Origem e Imutabilidade do Limite)**: *Como é definido o limite mensal no cadastro de um novo agente?*
   * **Assumption**: O frontend não informa o limite. O backend consulta a tabela `PlanAgentLimit` correspondente ao `AgentType` no `Plan` do `Client` do usuário autenticado. Uma vez copiado para o registro do `Agent`, o limite torna-se estável para o agente.

3. **Pergunta 3 (Comportamento sob Bloqueio)**: *Qual deve ser a resposta do sistema quando uma execução é tentada em um agente bloqueado ou sem saldo?*
   * **Assumption**: O endpoint de execução (`POST /api/agents/{agent}/executions`) bloqueia a requisição, marca o agente como `BLOCKED`, emite um log de aviso (`Log::warning`) e retorna HTTP 429 (`EXECUTION_LIMIT_REACHED`).

4. **Pergunta 4 (Rollover de Mês)**: *Como tratar o início de um novo mês para agentes que estouraram o limite no mês anterior?*
   * **Assumption**: O saldo é controlado de forma agregada pela tabela `agent_monthly_usages` com chave `(agent_id, year, month)`. Na virada do mês, o novo período inicia automaticamente com 0 execuções, desbloqueando a operação sem necessidade de rotinas batch/cron de reset.

5. **Pergunta 5 (Privacidade e Segurança Multitenant)**: *Como responder a tentativas de acesso a agentes de terceiros?*
   * **Assumption**: Qualquer tentativa de acessar ou executar um agente pertencente a outro cliente retorna HTTP 404 (`RESOURCE_NOT_FOUND`) em vez de HTTP 403, garantindo o isolamento total e impedindo que usuários mal-intencionados descubram IDs ou a existência de recursos de outros clientes.

---

## 4. Entidades

1. **Plan**: Define o plano contratado (ex: PRO).
2. **Client**: Empresa contratante pertencente a um Plan.
3. **User**: Usuário autenticado pertencente a um Client.
4. **PlanAgentLimit**: Define o limite mensal por tipo de agente (`SUPPORT`, `SALES`, `GENERAL`) para um plano.
5. **Agent**: Agente de IA pertencente a um Client, com tipo, limite e status (`ACTIVE` / `BLOCKED`).
6. **AgentMonthlyUsage**: Tabela agregada por `agent_id + year + month` que mantém o contador de execuções com sucesso.
7. **Execution**: Histórico granular de cada execução com carimbo de data/hora (`executed_at`) e status (`SUCCESS` / `FAILED`).

---

## 5. Escopo do MVP

* Autenticação via Laravel Sanctum (`POST /api/auth/login`).
* Listagem de agentes com consumo mensal atual e percentual visual (`GET /api/agents`).
* Consulta de tipos de agente disponíveis no plano (`GET /api/agents/available-types`).
* Cadastro de novos agentes (`POST /api/agents`).
* Execução concorrencial segura de agentes (`POST /api/agents/{agent}/executions`).
* Detalhes do agente e histórico paginado (`GET /api/agents/{agent}/executions`).
* Interface React + TypeScript com feedback visual de loading, erros, empty state e retry.

---

## 6. Fora do Escopo

* OAuth / Social Login completo.
* Gestão complexa de permissões (RBAC).
* Módulos de cobrança/billing.
* Event Sourcing, CQRS, WebSockets ou brokers de mensagem (Kafka/RabbitMQ).
* CRUD administrativo de planos/clientes.
* Exclusão de agentes no MVP.

---

## 7. Estrutura do Repositório

```
rotik-challenge/
├── backend/                  # Aplicação Laravel (PHP 8.4)
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── tests/
│   ├── Dockerfile
│   └── composer.json
├── frontend/                 # Aplicação React + Vite (TypeScript)
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # Orquestrador dos containers
└── README.md
```

---

## 8. Decisões de Arquitetura

* **Controllers Finos**: Apenas orquestram a validação via Form Requests, chamam os Services e formatam a resposta via API Resources.
* **Services**: Encapsulam toda a regra de negócio e controle de transações (`AgentService`, `ExecutionService`).
* **Policies**: Encapsulam a lógica de autorização por cliente (`AgentPolicy`).
* **Respostas Consistentes de Erro**: Formato unificado contendo `{ "error": { "code": "CÓDIGO", "message": "Mensagem" } }` para códigos 400, 401, 403, 404, 422, 429 e 500.

---

## 9. Stack e Justificativa

* **PHP 8.4 + Laravel 13**: Framework maduro, excelente ORM (Eloquent), suporte nativo a UUIDs e ecossistema robusto para APIs RESTful.
* **Laravel Sanctum**: Solução leve e segura para emissão de API Tokens Bearer.
* **PostgreSQL 16**: Banco de dados relacional forte em ACID, suporte nativo a UUIDs e travamento pessimista seguro (`SELECT ... FOR UPDATE`).
* **React + Vite + TypeScript**: Interface moderna, rápida, fortemente tipada e com hot reload instantâneo.
* **Zustand**: Gerenciamento de estado global mínimo e performático **exclusivamente** para a sessão/token de autenticação.
* **TailwindCSS**: Estilização moderna com utilitários CSS de alta fidelidade e acessibilidade visual.

---

## 10. Diagrama de Entidade-Relacionamento (ERD)

```mermaid
erDiagram
    PLAN ||--|{ CLIENT : "determina"
    PLAN ||--|{ PLAN_AGENT_LIMIT : "configura limites"
    CLIENT ||--|{ USER : "possui"
    CLIENT ||--|{ AGENT : "possui"
    AGENT ||--|{ AGENT_MONTHLY_USAGE : "acumula uso"
    AGENT ||--|{ EXECUTION : "registra histórico"

    PLAN {
        uuid id PK
        string name
        text description
    }

    CLIENT {
        uuid id PK
        string name
        uuid plan_id FK
    }

    USER {
        uuid id PK
        string name
        string email UK
        string password
        uuid client_id FK
    }

    PLAN_AGENT_LIMIT {
        uuid id PK
        uuid plan_id FK
        string agent_type
        int monthly_execution_limit
    }

    AGENT {
        uuid id PK
        uuid client_id FK
        string name
        string type
        int monthly_execution_limit
        string status
    }

    AGENT_MONTHLY_USAGE {
        uuid id PK
        uuid agent_id FK
        int year
        int month
        int execution_count
    }

    EXECUTION {
        uuid id PK
        uuid agent_id FK
        timestamp executed_at
        string status
    }
```

---

## 11. Regras de Quota e Agregação Mensal

### Por que agregar em `agent_monthly_usage` em vez de contar `executions` a cada requisição?

1. **Performance de Leitura**: Executar `SELECT COUNT(*) FROM executions WHERE agent_id = ? AND executed_at >= ?` em uma aplicação com milhões de execuções exige escaneamento de índices ou tabelas volumosas, causando latência e alto consumo de CPU/I/O no banco.
2. **Atomicidade e Concorrência**: Com a tabela agregada `agent_monthly_usages`, a operação de consumo é reduzida a um `UPDATE agent_monthly_usages SET execution_count = execution_count + 1 WHERE agent_id = ? AND year = ? AND month = ?` protegido por um lock de linha (`lockForUpdate()`), garantindo altíssimo throughput e zero condição de corrida.
3. **Rollover de Mês sem Cron**: Como a chave primária de uso é `(agent_id, year, month)`, na virada do mês a query automaticamente busca ou cria o registro do novo mês. Agentes bloqueados em agosto não possuem registro para setembro e, portanto, têm quota 0/limit no novo mês, desbloqueando-se automaticamente na primeira execução com sucesso.

---

## 12. Instruções Locais

### Backend (Laravel)
```bash
# 1. Entrar na pasta do backend
cd backend

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Instalar dependências
composer install

# 4. Gerar chave da aplicação
php artisan key:generate

# 5. Executar migrações e seed de demonstração
php artisan migrate:fresh --seed

# 6. Iniciar servidor de desenvolvimento
php artisan serve
```

### Frontend (React)
```bash
# 1. Entrar na pasta do frontend
cd frontend

# 2. Instalar dependências
npm install

# 3. Iniciar servidor Vite (porta 3000 com proxy para localhost:8000)
npm run dev
```

Credenciais de Demonstração:
* **Email**: `demo@rotik.com`
* **Senha**: `password`

---

## 13. Docker

A aplicação é totalmente dockerizada através do Docker Compose:

```bash
# Subir os containers de Banco de Dados (PostgreSQL 16), Backend (Laravel) e Frontend (Nginx)
docker compose up -d --build
```

Endereços disponíveis:
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:8000/api`
* **PostgreSQL**: `localhost:5432`

---

## 14. Testes

```bash
# Executar suíte de testes backend
cd backend && php artisan test

# Executar padronização de código backend
cd backend && ./vendor/bin/pint --test

# Executar build de produção do frontend
cd frontend && npm run build
```

---

## 15. Integração Contínua (CI)

O workflow do **GitHub Actions** em `.github/workflows/ci.yml` valida:
* **Backend**: Instalação de dependências em `backend/`, verificação Pint e suíte de 18 testes automatizados contra banco PostgreSQL.
* **Frontend**: Instalação em `frontend/`, verificação de tipos e build Vite.

---

## 16. Deploy

* **Frontend**: Deploy na Vercel ou Netlify a partir da pasta `frontend/`.
* **Backend**: Deploy no Render, Railway ou Fly.io a partir da pasta `backend/`.
* **Banco de Dados**: PostgreSQL gerenciado (Neon Postgres, Supabase, Render Postgres).

URL de Demonstração Pública:
* Frontend: `https://rotik-challenge.vercel.app`
* API: `https://rotik-challenge-api.onrender.com`

---

## 17. Debugging (Resolução de Problemas Durante o Desenvolvimento)

### Problema 1: `VerbatimModuleSyntax` na compilação TypeScript do Frontend
* **Sintoma**: Falha no comando `npm run build` com os erros `TS1484: 'Agent' is a type and must be imported using a type-only import`.
* **Causa**: O template Vite TypeScript ativou a flag `verbatimModuleSyntax` no `tsconfig.app.json`, exigindo importações explícitas de tipo.
* **Solução**: Atualização de todos os arquivos do frontend para usar a sintaxe `import type { ... }` para interfaces e tipos.
* **Validação**: Execução com sucesso do comando `npm run build`.

### Problema 2: Status HTTP 201 vs 200 na Criação de Execução
* **Sintoma**: Falha nos testes da API de execução esperando código HTTP 200, enquanto a resposta retornava HTTP 201.
* **Causa**: Os recursos `JsonResource` do Laravel retornam automaticamente HTTP 201 Created quando acionados via método `POST`.
* **Solução**: Ajuste dos testes para validar o código RESTful correto (HTTP 201 Created).
* **Validação**: Todos os 18 testes passando com sucesso.

---

---

## 18. Etapa 7 — Mentalidade de Produto

### 1. Essa funcionalidade gera valor real para a Rotik? Para quem exatamente?
**Sim, gera valor altíssimo e imediato para três públicos principais:**
* **Time de CS / Suporte**: Elimina o diagnóstico manual via planilhas/logs brutos. O CS identifica em segundos por que um agente parou de responder (estouro de quota vs erro técnico).
* **Time Comercial / Vendas**: Habilita a detecção proativa de contas prontas para upgrade. Agentes atingindo 80–100% da quota representam oportunidades de expansão de receita (*upsell*) antes que o cliente sinta insatisfação.
* **Cliente Final**: Recebe clareza e transparência sobre o consumo do seu plano, evitando interrupções inesperadas de serviço.

---

### 2. Existiria uma solução mais simples que ainda resolveria o problema central?
**Sim.** Uma alternativa *No-Code / Low-Cost* inicial seria:
* **Automação via Cron Job + Webhook no Slack/Email**: Um script diário rodando uma consulta SQL agregada no banco atual que enviasse um alerta no canal do Slack do CS (`#cs-alerts-quota`) sempre que uma conta ultrapassasse 85% do limite.
* **Por que desenvolvemos o Dashboard?**: Embora o alerta simples no Slack informasse o estouro, ele não oferecia a funcionalidade crítica de cadastramento autônomo de agentes, visualização de histórico de execuções com causa de falha, nem a aplicação estrita de bloqueio em tempo real (`SELECT FOR UPDATE`).

---

### 3. Vale a pena a Rotik investir nisso agora, ou há algo mais prioritário?
**Vale a pena investir no MVP de Monitoramento agora.**
* **Justificativa**: O custo operacional de diagnosticar falhas manualmente e o risco de churn por agentes que param de responder sem aviso superam o custo de engenharia deste MVP.
* **Foco no Essencial**: Como o MVP foi modelado com escopo enxuto (foco no consumo e bloqueio sem over-engineering), o investimento é baixo e estanca a perda de tempo do time interno imediatamente.

---

### 4. Como medir se essa funcionalidade está dando certo após o lançamento? (Métricas Concretas)
1. **Redução no Time-to-Diagnose (MTTR) do CS**: Queda de 80%+ no tempo médio para suporte responder por que um agente parou de responder (meta: < 2 minutos).
2. **Taxa de Conversão de Upsell Proativo**: % de clientes alertados na faixa amarela (80-100% de uso) que realizaram upgrade de plano em até 14 dias.
3. **Quota Compliance Rate (% de Execuções Bloqueadas com Sucesso)**: 100% das tentativas excedentes bloqueadas sem estouro de infraestrutura.

---

## 19. Monitoramento de Produção e Observabilidade

Em ambiente de produção, a monitoria recomendada inclui:
* **Logs Estruturados**: O backend registra logs com nível `WARNING` para qualquer bloqueio de limite (`ExecutionLimitReachedException`), incluindo `agent_id`, `client_id`, `usage` e `limit`.
* **Métricas da Aplicação (Prometheus / Grafana / Datadog)**:
  * `rotik_agent_executions_total{status="success|failed|blocked"}`: Taxa por segundo de chamadas de agentes.
  * `rotik_agent_quota_usage_ratio`: Distribuição do percentual de consumo por cliente.
  * `rotik_execution_latency_seconds`: Histograma de tempo de resposta da transação de execução (target < 50ms).
* **Alertas em Tempo Real**: Alerta no Sentry/PagerDuty se a taxa de erros HTTP 500 subir acima de 0.5% ou se houver deadlock nas transações de quota.
