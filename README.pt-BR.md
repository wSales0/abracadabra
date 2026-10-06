<p align="center">
<a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR )" src="https://img.shields.io/badge/lang-Português%20(BR )-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p> <p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p> <h1 align="center">Abracadabra</h1> <p align="center">
  <strong>Aprenda. Pratique. Interaja. Comprove.</strong>  

  Uma experiência gamificada para aprender Web3 praticando, do primeiro conceito às primeiras decisões on-chain.
</p> <p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-protótipo%20de%20hackathon-7C3AED" />
  <img alt="Rede" src="https://img.shields.io/badge/rede-Solana%20Devnet-14F195" />
  <img alt="Categoria" src="https://img.shields.io/badge/categoria-EdTech-09090F" />
</p>

> **Status atual:** o frontend já possui landing page, login demonstrativo, dashboard do aluno, perfil editável, mercado cripto, manchetes relacionadas e sistema inicial de atividades com XP. Wallet, backend, autenticação real e ações on-chain ainda não estão integrados.

## O produto

A Abracadabra transforma o aprendizado de Web3 em uma jornada prática e progressiva. A pessoa entra, acompanha o mercado, responde perguntas, recebe feedback e acumula XP enquanto constrói uma base de segurança e fundamentos.

A experiência atual é um protótipo visual e funcional para hackathon. Ela não deve ser confundida com uma plataforma pronta para produção ou com uma ferramenta de recomendação financeira.

## O que já foi implementado

- Landing page pública e área do aluno separadas.

- Login demonstrativo local com `teste123` / `123`.

- Dashboard com abas de Mercado, Perfil e Atividades.

- Perfil editável com nome, bio, preferências e avatar salvo localmente.

- Mercado com preço, variação de 24 horas, ranking e capitalização dos principais ativos.

- Radar com maior alta, maior queda e líder por valor.

- Manchetes relacionadas carregadas somente quando o aluno seleciona um ativo.

- Atividades com perguntas de conceitos, segurança e raciocínio.

- Dificuldades iniciante, intermediário e avançado.

- XP, nível, aproveitamento, questões respondidas e feedback imediato.

- Geração procedural de novas questões com alternativas embaralhadas e identificadores únicos locais.

## Integração de mercado e notícias

O protótipo usa a API pública da [Crypto Vision News / cryptocurrency.cv](https://cryptocurrency.cv/):

```
GET https://cryptocurrency.cv/api/market/coins?limit=8
GET https://cryptocurrency.cv/api/news?category=bitcoin&limit=5
GET https://cryptocurrency.cv/api/news?search=NomeDaCripto Simbolo&limit=5
```

A integração está em `src/lib/cryptoApi.ts`. Atualmente não há chave de API no frontend.

### Direitos autorais e atribuição

A API agrega metadados e manchetes de publishers terceiros. O conteúdo original continua pertencendo aos respectivos publishers. A API ser pública ou gratuita **não significa que todas as matérias sejam livres de direitos autorais**.

Por isso, o Abracadabra deve:

- exibir somente título, publisher, data e link original;

- manter atribuição visível à fonte;

- levar o usuário ao artigo original;

- não reproduzir corpo, resumo ou reescrita automática da matéria;

- não copiar imagens de terceiros;

- não apresentar o conteúdo como produzido pelo Abracadabra;

- exibir o aviso de que os dados não constituem recomendação financeira.

Para uso comercial ou publicação em escala, é necessário revisar novamente os [termos da API](https://cryptocurrency.cv/terms) e, quando necessário, confirmar os direitos diretamente com os publishers. A atribuição, sozinha, não substitui uma licença editorial.

A API também informa limites de uso. O frontend faz poucas chamadas: mercado ao abrir o dashboard e notícias apenas quando o usuário seleciona um ativo. Não adicionar polling agressivo sem cache e controle de limites.

## O que a pessoa do backend precisa buscar

Antes de trocar o protótipo por Supabase ou outra API, o responsável pelo backend deve definir e obter:

### 1. Autenticação

- provedor escolhido: Supabase Auth ou outro;

- fluxo de cadastro, login, logout e recuperação de senha;

- formato da sessão e renovação do token;

- confirmação de e-mail, se será obrigatória;

- regras de acesso às rotas privadas;

- migração do usuário demonstrativo para usuários reais.

### 2. Banco de dados

Criar e documentar tabelas equivalentes a:

- `profiles`: usuário, nome, bio, avatar, foco e preferências;

- `activity_progress`: XP, nível, respostas, acertos e sequência;

- `activity_attempts`: questão, alternativa escolhida, acerto, XP e timestamp;

- `question_catalog`: banco de questões versionado;

- `news_cache`: somente metadados permitidos e cache com prazo curto, se os termos permitirem;

- `wallet_connections`: endereço público, rede e data de conexão, sem seed phrase ou chave privada.

Também é necessário definir chaves, índices, timestamps, política de exclusão e retenção.

### 3. Segurança e RLS

- habilitar Row Level Security;

- permitir que o usuário leia e edite somente o próprio perfil;

- impedir que o cliente conceda XP livremente;

- validar respostas, tentativas e recompensas no servidor;

- nunca armazenar seed phrase ou chave privada;

- manter chaves de serviços apenas em variáveis server-side;

- configurar rate limiting e logs de erro.

### 4. API de mercado e notícias

- mover as chamadas de `cryptoApi.ts` para uma Edge Function ou API server-side;

- adicionar cache e limite por usuário/IP;

- definir o comportamento quando a fonte estiver indisponível;

- guardar somente os campos autorizados: título, fonte, data e URL;

- revisar os termos de cada publisher antes de monetizar ou redistribuir;

- validar URLs e impedir conteúdo injetado no frontend.

### 5. Atividades e XP

- decidir se as questões continuarão no código, em tabela ou em CMS;

- versionar questões e respostas corretas no servidor;

- criar endpoint para iniciar uma atividade;

- criar endpoint para enviar resposta e calcular XP server-side;

- impedir repetição por usuário usando histórico de tentativas;

- definir regras de dificuldade, streak, limite diário e níveis;

- registrar eventos para analytics sem armazenar dados desnecessários.

### 6. Wallet e Solana

- escolher Wallet Adapter e wallets suportadas;

- definir Devnet/Mainnet por ambiente;

- validar assinatura e transações no servidor;

- verificar RPC, limites, confirmação e tratamento de transações pendentes;

- conceder conquistas somente após atividade on-chain verificável;

- definir o que será armazenado: endereço público, assinatura, rede e status.

## Estrutura atual do frontend

```
src/
├── data/mockNews.ts              # dados antigos de demonstração
├── lib/activityEngine.ts         # geração de questões, XP e níveis
├── lib/cryptoApi.ts              # mercado e manchetes externas
├── lib/demoAuth.ts               # autenticação e perfil locais
├── pages/DashboardPage.tsx       # Mercado, Perfil e Atividades
├── main.tsx                      # entrada e navegação do frontend
├── styles.css                    # identidade visual e responsividade
└── types.ts                      # tipos de domínio
```

## Como executar

```bash
npm install
npm run dev
```

O projeto usa Vite, React e TypeScript e pode ser publicado na Vercel como frontend estático. O protótipo atual persiste login, perfil, contador de questões e progresso no `localStorage` do navegador.

## Segurança do protótipo

- Nunca inserir seed phrase ou chave privada.

- Não tratar o dashboard como recomendação financeira.

- Não considerar o XP salvo no cliente como prova válida para produção.

- Não publicar chaves secretas no frontend.

- Não armazenar corpo, resumo ou imagem de notícias de terceiros.

## Time

- [wSales0](https://github.com/wSales0)

- [gsoares0017](https://github.com/gsoares0017)

- [001zk](https://github.com/001zk)

- [higomvp](https://github.com/higomvp)

## Licença

A ser definida pelo time. As licenças das fontes externas e dos publishers são independentes da licença do código do Abracadabra.
