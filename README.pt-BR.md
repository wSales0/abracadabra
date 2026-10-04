<p align="center">
  <a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR)" src="https://img.shields.io/badge/lang-Portugu%C3%AAs%20(BR)-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p>

<p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p>

<h1 align="center">Abracadabra</h1>

<p align="center">
  <strong>Aprenda. Pratique. Interaja. Comprove.</strong><br/>
  Uma plataforma gamificada que leva pessoas de "o que é uma wallet?" até builders on-chain na Solana.
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-em%20estrutura%C3%A7%C3%A3o-7C3AED" />
  <img alt="Rede" src="https://img.shields.io/badge/rede-Solana%20Devnet-14F195" />
  <img alt="Categoria" src="https://img.shields.io/badge/categoria-EdTech-09090F" />
</p>

> **Status:** projeto em estruturação, criado para o hackathon Superteam Brasil / Colosseum.
> As seções abaixo descrevem a direção planejada, não funcionalidades prontas.

---

## O problema

A Web3 tem uma curva de aprendizado íngreme. Wallets, transações, contas e programas parecem desconectados quando aprendidos só por documentação e vídeos longos. A maioria dos iniciantes lê sobre blockchain, mas nunca chega a usá-la.

## O que a Abracadabra faz

A Abracadabra transforma o ensino de Web3 em uma jornada guiada e prática:

1. **Diagnosticar.** Um diagnóstico rápido define o nível inicial do usuário.
2. **Aprender.** Uma trilha personalizada com aulas curtas.
3. **Praticar.** Quests e desafios interativos.
4. **Interagir.** O usuário conecta uma wallet e realiza ações reais na Solana Devnet.
5. **Comprovar.** O app verifica a atividade on-chain, concede XP e desbloqueia conquistas.

A Abracadabra está mais para uma jornada guiada do que para um catálogo de cursos: a pessoa aprende Web3 usando, passo a passo.

## Como a Solana é usada

A Solana faz parte do ciclo de aprendizado, e não só do conteúdo:

- O usuário conecta uma wallet (Solana Wallet Adapter).
- As quests pedem ações reais na Devnet, como receber SOL de teste e enviar a primeira transação.
- A Abracadabra verifica a atividade pelo endereço e pela assinatura da transação antes de conceder XP.
- Conquistas (por exemplo, **First Spell**) são desbloqueadas a partir de atividade on-chain verificada.

Credenciais on-chain e um programa Anchor próprio estão **planejados**, e não fazem parte do protótipo atual.

## Exemplo de fluxo (alvo do demo)

```
Continue as Test User
  -> cria username
  -> diagnóstico de conhecimento (nível inicial)
  -> dashboard mostra a primeira quest
  -> aprende sobre wallets e transações
  -> conecta a wallet
  -> recebe SOL na Devnet
  -> envia a primeira transação
  -> a Abracadabra verifica
  -> +XP e a conquista "First Spell"
  -> próxima quest liberada
```

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Solana | `@solana/web3.js`, Solana Wallet Adapter, Devnet |
| Programas on-chain | Anchor (planejado, só se necessário) |
| Persistência (protótipo) | Armazenamento no cliente (`localStorage`) para o Test User |
| Backend | Deliberadamente em aberto / a definir |
| Deploy | Vercel |

## Arquitetura

```
            ABRACADABRA
                 |
      +----------+-----------+
   Frontend                Backend
  Next.js / TS          (a definir, desacoplado)
      |
  Aprendizado | Gamificação | Wallet / Auth
      |
  Integração Solana
      |
  Wallet | Devnet | Programas (futuro)
```

- O frontend é desacoplado de qualquer backend. O armazenamento fica atrás de módulos pequenos (`userStorage`, `progressStorage`, `questStorage`, `achievementStorage`), então a persistência local pode ser trocada por uma API depois sem reescrever a interface.
- A autenticação está planejada atrás de uma interface `AuthProvider`, com os modos `guest` e `authenticated`.
- Off-chain: aulas, quizzes, XP, progresso, streaks e catálogo de quests. On-chain: endereço da wallet, transações dos desafios, atividade verificável e conquistas (quando implementadas).

## Segurança

- O app nunca pede nem armazena seed phrase ou chave privada.
- As atividades educacionais rodam na Devnet, com fundos de teste.
- O usuário é avisado claramente sempre que uma transação estiver prestes a ser assinada.
- Recompensas só devem ser concedidas depois de verificar a transação no servidor ou on-chain, nunca apenas com base em dados enviados pelo cliente.

## Como começar

Repositório: [github.com/wSales0/abracadabra](https://github.com/wSales0/abracadabra)

O repositório ainda está sendo estruturado. As instruções de instalação serão adicionadas quando a primeira versão do app for commitada.

## Estrutura sugerida do repositório

A estrutura pode começar menor que isto.

```
abracadabra/
├── apps/web/          # app Next.js (onboarding, dashboard, learn, quests, achievements, profile)
├── programs/          # programas Anchor (futuro)
├── packages/          # tipos e configs compartilhados
├── content/           # aulas e quests (fundamentals, wallets, solana, development)
└── README.md
```

## Design

| Token | Valor |
| --- | --- |
| Primária | `#7C3AED` (roxo) |
| Acento | `#14F195` (verde, inspirado na Solana) |
| Fundo | `#09090F` |

## Time

- [wSales0](https://github.com/wSales0)
- [gsoares0017](https://github.com/gsoares0017)
- [001zk](https://github.com/001zk)
- [higomvp](https://github.com/higomvp)

## Licença

A ser definida pelo time. Esta seção será atualizada quando um arquivo `LICENSE` for adicionado.
