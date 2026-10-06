# Handoff para integração do backend

Este documento descreve as diretrizes, decisões, arquitetura e checklist para a futura integração do backend do **Abracadabra** (com TypeScript, Supabase e Vercel), mantendo a integridade do protótipo atual.

---

> ### 📌 Decisão para o Momento Atual
> **Sem banco de dados no momento:** O projeto opera em modo protótipo/standalone utilizando o usuário demonstrativo (`teste123` / `123`) com armazenamento no cliente (`sessionStorage`/`localStorage`). Nenhuma dependência obrigatória de banco de dados ou backend ativo é exigida para executar ou demonstrar o frontend.

---

## 1. Contexto atual do Frontend

O frontend já possui implementado e funcional:

- **Autenticação demonstrativa:** login com `teste123` / `123` via `src/lib/demoAuth.ts`;
- **Login oficial com Google / Gmail:** integração OAuth com Google Identity Services (`src/lib/googleAuth.ts`) com geração automática de carteira de prática;
- **Carteira de Prática Web3 (Simulada / Devnet):** gerador automático de carteira de treino (`src/lib/practiceWallet.ts`), com saldo inicial de 2.50 SOL simulado, Faucet interativo (+1.0 SOL), simulador de envio com cálculo de taxa de rede (gas fee) e assinaturas on-chain, histórico de transações e integração Learn & Earn (+0.05 SOL por questão acertada);
- **Dashboard pós-login:** navegação entre abas Mercado, Carteira Prática, Atividades e Perfil, com badge de saldo no cabeçalho;
- **Perfil editável:** alteração de nome, bio, preferências, avatar e visualização detalhada da carteira de prática vinculada;
- **Mercado cripto:** dados ao vivo via API pública (`src/lib/cryptoApi.ts`) com radar de alta/baixa/capitalização e manchetes sob demanda;
- **Atividades e Gamificação:** perguntas procedurais com alternativas embaralhadas, níveis, streak, cálculo de XP e recompensas em SOL simulado (`src/lib/activityEngine.ts`);
- **Persistência local:** estado salvo no navegador via `sessionStorage` / `localStorage`.

---

## 2. Roteiro e Decisões para Futura Integração com Supabase

Quando for iniciada a etapa de conexão com banco de dados e backend, a pessoa responsável deverá seguir as etapas abaixo:

### 2.1 Autenticação (Supabase Auth)
- **Métodos:** `signUp`, `signInWithPassword`, `signOut` e recuperação de senha.
- **Sessões:** Persistência de token JWT e renovação automática via `@supabase/supabase-js`.
- **Proteção de Rotas:** Guarda de rotas `/app` validando a sessão ativa.
- **Transição de Usuário Demo:** Manter o login demonstrativo para testes rápidos sem interferir em contas reais.

### 2.2 Modelo de Dados Proposto (PostgreSQL / Supabase)

#### Tabela `profiles`
```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  focus text default 'Fundamentos de Web3',
  weekly_digest boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### Tabela `activity_progress`
```sql
create table public.activity_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer default 0 check (xp >= 0),
  level text default 'Iniciante',
  streak integer default 0 check (streak >= 0),
  completed_activities integer default 0 check (completed_activities >= 0),
  correct_answers integer default 0 check (correct_answers >= 0),
  answered_questions integer default 0 check (answered_questions >= 0),
  last_activity_at timestamptz,
  updated_at timestamptz default now()
);
```

#### Tabela `activity_attempts`
```sql
create table public.activity_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  difficulty text not null check (difficulty in ('iniciante', 'intermediario', 'avancado')),
  selected_answer integer not null,
  is_correct boolean not null,
  xp_awarded integer not null default 0,
  created_at timestamptz default now()
);
```

#### Tabela `question_catalog` (Opcional se mantido em código)
```sql
create table public.question_catalog (
  id text primary key,
  category text not null,
  difficulty text not null check (difficulty in ('iniciante', 'intermediario', 'avancado')),
  prompt text not null,
  options jsonb not null,
  answer_index integer not null,
  explanation text not null,
  xp_reward integer not null default 10,
  published boolean default true,
  version integer default 1,
  created_at timestamptz default now()
);
```

---

## 3. Segurança e Row Level Security (RLS)

Ao ativar o banco de dados:

- Habilitar RLS em todas as tabelas (`alter table ... enable row level security;`).
- Cada usuário só pode ler e atualizar seu próprio registro em `profiles` e `activity_progress`.
- Inserção em `activity_attempts` permitida apenas para `auth.uid() = user_id`.
- **Cálculo de XP Server-Side:** O cliente nunca deve atualizar `xp` diretamente. O cálculo e a validação de respostas devem ocorrer em Edge Functions ou RPCs protegidas.
- **Segurança Web3:** Nunca solicitar ou armazenar `seed phrase`, `chave privada` ou segredos de wallet.

---

## 4. Endpoints e Supabase Edge Functions

### Perfil
- `GET /profile` — Obter dados do perfil do usuário autenticado.
- `PATCH /profile` — Atualizar nome, bio e preferências.
- Upload de avatar no Supabase Storage com validação de tamanho e tipo MIME.

### Atividades
- `POST /activities/answer` — Validação da resposta e concessão de XP no servidor.
- Prevenção de replay attacks (tentativas duplicadas para ganhar XP infinito).

### Mercado e Notícias
- Mover chamadas externas (`https://cryptocurrency.cv/`) para uma Edge Function para controle de rate limiting e cache.

---

## 5. Diretrizes de Direitos Autorais e Notícias

A API pública de notícias agrega conteúdo de terceiros:
- Exibir somente **título**, **fonte (publisher)**, **data** e **link original**.
- Manter atribuição visível com link direto para o publisher.
- Não reproduzir nem salvar corpo completo, resumos ou imagens não licenciadas.
- Manter o aviso claro de que as informações de mercado não constituem recomendação financeira.

---

## 6. Integração com Wallet (Solana) — Fase Futura

- Utilizar `@solana/wallet-adapter-react`.
- Inicialmente conectar exclusivamente à **Solana Devnet**.
- Armazenar apenas chave pública (`public_key`), rede (`network`) e assinaturas de transação (`tx_hash`) para verificação de conquistas.

---

## 7. Critérios de Aceite para Conclusão do Backend

- [ ] Usuário real consegue criar conta, confirmar e-mail e autenticar.
- [ ] Rota `/app` bloqueia acessos não autenticados (mantendo opção de modo demo se configurado).
- [ ] Perfil e avatar persistem no Supabase.
- [ ] XP e tentativas são validados e gravados no servidor.
- [ ] Chaves de API e segredos ficam protegidos em variáveis de ambiente da Vercel/Supabase.
- [ ] Build e deploy na Vercel executam sem erros.
