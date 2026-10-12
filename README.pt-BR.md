<p align="center">
<a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR )" src="https://img.shields.io/badge/lang-Português%20(BR )-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p> <p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p> <h1 align="center">Abracadabra · Web3 EdTech</h1> <p align="center">
  <strong>Aprenda. Pratique. Converse. Evolua com confiança.</strong>  

  Uma plataforma gamificada para transformar conceitos de Web3 e Solana em prática guiada.
</p> <p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-live%20production-14F195" />
  <img alt="Rede" src="https://img.shields.io/badge/rede-Solana%20Devnet-14F195" />
  <img alt="Backend" src="https://img.shields.io/badge/backend-MongoDB%20Atlas-47A248" />
  <img alt="Chat" src="https://img.shields.io/badge/chat-MQTT%20sobre%20WSS-7C3AED" />
  <img alt="Deploy" src="https://img.shields.io/badge/deploy-Vercel-black" />
</p>

## O que é o Abracadabra?

O **Abracadabra** é uma plataforma educacional gamificada para quem quer entender Web3, carteiras, segurança, mercado cripto e Solana de forma prática. A experiência combina trilhas guiadas, atividades interativas, missões, recompensas, comunidade e um ambiente de prática conectado ao ecossistema Solana.

A proposta é levar o aluno do primeiro contato com conceitos como chave pública, seed phrase e gas fee até experiências mais avançadas, como transferências de treino, swap, staking, leitura de transações e desafios de segurança.

## Funcionalidades

### Carteira de prática Solana

- Carteira didática com endereço público, saldo inicial e histórico de transações.

- Faucet de SOL de treino para praticar sem usar fundos reais.

- Envio e recebimento de SOL em ambiente de aprendizagem, com cálculo de taxa e assinatura de demonstração.

- QR Code, cópia de endereço e explorador de transações.

- Alertas visuais, sonoros e por voz para cripto recebida.

- Tokens de prática como SOL, USDC, ABRA e BTC.

### Swap, staking e conversão

- Swap educacional entre SOL, USDC e ABRA.

- Cofre de staking baseado em Proof-of-Stake, com saldo aplicado e recompensas de prática.

- Conversor de moedas para relacionar valores cripto e moedas tradicionais.

- Todos os fluxos foram desenhados para explicar conceitos e etapas de uso da Web3.

### Comunidade e chat ao vivo

- Sala de comunidade com mensagens persistidas no backend.

- Comunicação em tempo real via MQTT sobre WSS, com presença online e sincronização entre abas.

- MongoDB Atlas para histórico de mensagens, presença e eventos de transferência.

- Alertas quando uma transferência de prática chega para outro aluno.

### Ranking da turma

- Ranking persistente conectado ao MongoDB Atlas.

- Pódio visual para os três primeiros colocados e lista dos demais participantes.

- Pontuação calculada a partir de XP, respostas de atividades, missões concluídas e progresso individual.

- Critérios de desempate por atividades concluídas e nome do aluno.

- O ranking retorna os 25 melhores participantes e destaca o usuário atual.

### Trilha, atividades e segurança

- Missões guiadas com progresso, XP e SOL de prática.

- Perguntas geradas por conceito, cenário e dificuldade: iniciante, intermediário e avançado.

- Laboratório anti-golpe com situações de phishing, falsos airdrops, pedidos de seed phrase e promessas de lucro.

- Desafio interativo para organizar uma seed phrase de 12 palavras.

- Laboratório de diagnóstico para analisar falhas e situações comuns de rede.

- Progresso de atividades salvo com histórico, acertos, respostas e XP.

### Badges e certificado

- Galeria de badges por marcos de aprendizagem, prática e segurança.

- Certificado de conclusão Web3 preparado para a jornada do aluno.

- Perfil com foto, nome, bio, foco de estudo, resumo semanal e preferências de acessibilidade.

### Mercado e aprendizagem acessível

- Cotações atualizadas de ativos e preço da SOL.

- Radar com maior alta, maior queda e líder por capitalização.

- Manchetes relacionadas com fonte, data e link para o artigo original.

- Controle de fonte em três tamanhos e leitura em voz alta em português.

- Analogias simples para aproximar conceitos técnicos do cotidiano.

## Backend e arquitetura

O frontend é construído com React, TypeScript e Vite. As funções serverless em `api/` são executadas pela Vercel e conectam o produto ao MongoDB Atlas.

As rotas atuais incluem:

- `api/user`: perfis, presença, transferências de prática e ranking.

- `api/activities`: respostas, histórico, acertos e XP.

- `api/missions`: missões concluídas por aluno.

- `api/chat`: histórico e persistência das mensagens da comunidade.

O cliente usa uma camada de serviço em `src/lib/mongoDbService.ts`, mantendo a interface desacoplada das rotas de backend. O ranking consolida dados de usuários, atividades e missões para ordenar a turma por progresso.

## Tecnologias

- **Frontend:** React 19, TypeScript e Vite.

- **Backend:** Vercel Serverless Functions, Node.js e MongoDB Atlas.

- **Banco:** MongoDB com coleções de usuários, atividades, missões e mensagens.

- **Tempo real:** MQTT sobre WSS, broker seguro e `BroadcastChannel`.

- **Web3:** conceitos e fluxos educacionais baseados em Solana Devnet.

- **Acessibilidade:** Web Speech API e escala dinâmica de fonte.

- **Deploy:** Vercel integrada ao GitHub.

## Como executar

```bash
git clone https://github.com/wSales0/abracadabra.git
cd abracadabra
npm install
npm run dev
```

Abra `http://localhost:3000` no navegador. Para gerar a build:

```bash
npm run build
```

Para executar o backend localmente, configure as variáveis de ambiente do MongoDB usadas pelas funções serverless e rode o projeto com o ambiente compatível da Vercel.

## Credenciais de demonstração

```
Usuário: teste123
Senha: 123
```

Também existe um fluxo de acesso rápido com Google na interface.

## Direitos autorais e aviso

O Abracadabra é a versão final do projeto desenvolvida para o hackathon. Dados de mercado e manchetes são usados para contexto, com atribuição e links para as fontes originais. O conteúdo editorial pertence aos respectivos publishers e não deve ser reproduzido sem autorização. Dados de mercado não constituem recomendação financeira.
