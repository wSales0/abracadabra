<p align="center">
<a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR )" src="https://img.shields.io/badge/lang-Português%20(BR )-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p> <p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p> <h1 align="center">Abracadabra · Web3 EdTech</h1> <p align="center">
  <strong>Aprenda. Pratique. Converse. Evolua com confiança.</strong>  

  Uma plataforma educacional Web3 que transforma conceitos difíceis em prática guiada e segura.
</p> <p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-protótipo%20funcional-7C3AED" />
  <img alt="Rede" src="https://img.shields.io/badge/rede-Solana%20Devnet-14F195" />
  <img alt="Chat" src="https://img.shields.io/badge/chat-MQTT%20sobre%20WSS-7C3AED" />
  <img alt="Categoria" src="https://img.shields.io/badge/categoria-EdTech%20Web3-09090F" />
  <img alt="Deploy" src="https://img.shields.io/badge/deploy-Vercel-black" />
</p>

> **Estado atual:** o projeto tem um protótipo funcional para demonstração. A carteira de treino, o chat, a presença, as missões, o simulador anti-golpe, a acessibilidade e o login social possuem fluxos locais ou simulados; isso não equivale a autenticação, custódia, banco de dados ou transações de produção.

## 🧙‍♂️ O que é o Abracadabra?

O **Abracadabra** é uma plataforma EdTech gamificada para tornar blockchain e criptomoedas mais fáceis de entender. Em vez de começar com risco financeiro real, o aluno pratica em um ambiente controlado: aprende por analogias do cotidiano, identifica golpes, acompanha missões, testa conceitos e interage com uma comunidade ao vivo.

A proposta é aproximar o aluno da Web3 com clareza e segurança, sem pedir seed phrase ou chave privada.

## ✨ Funcionalidades atuais

### 🧪 1. Carteira de prática Web3

- Cada aluno pode receber uma carteira de demonstração com endereço público e saldo inicial de prática.

- O faucet simulado adiciona saldo de treino sem movimentar dinheiro real.

- O fluxo de envio simulado mostra destino, taxa de rede, débito, saldo e hash de demonstração.

- O histórico apresenta transações, status e detalhes para fins educacionais.

- O modal também detecta extensões como Phantom, Solflare, Backpack e Coinbase Wallet quando disponíveis, além da opção de colar um endereço público.

> A carteira de demonstração e o fluxo de transação não devem ser tratados como custódia, carteira de produção ou prova de transação on-chain. A validação e a integração real com a Solana ainda precisam ser implementadas com cuidado.

### 💬 2. Comunidade e chat em tempo real

- Chat global com MQTT sobre WSS.

- Broker principal EMQX e fallback HiveMQ.

- `BroadcastChannel` para comunicação entre abas e fallback local.

- Mensagens ficam em cache local no navegador para a experiência do protótipo.

- A presença usa batimentos de 2 segundos.

- Um aluno é removido após 5 segundos sem sinal.

- A varredura de saída acontece a cada 1 segundo.

- O Last Will and Testament do MQTT publica uma saída quando a conexão cai.

- Existe atualização manual de presença e convite compartilhável quando não há outros colegas detectados.

A presença indica clientes conectados ao canal naquele momento; ela não é uma verificação de identidade civil. O broker público e o chat ainda precisam de autenticação, moderação, limites e infraestrutura própria antes de uma operação pública em escala.

### 🛡️ 3. Simulador anti-golpe — “Cilada ou Seguro?”

O aluno analisa situações inspiradas em golpes comuns, como falso suporte, falso airdrop, links maliciosos e solicitações de seed phrase. Depois da resposta, recebe explicação e orientação prática. O treinamento também pode ser ouvido em voz alta quando o navegador oferece suporte à Web Speech API.

### 🎯 4. Trilha do Aprendiz

A trilha organiza missões guiadas com barra de progresso. Entre os passos estão reconhecer a chave pública, usar o faucet de treino, praticar uma transferência simulada, responder desafios e concluir o laboratório de segurança. As recompensas atuais são XP e SOL de prática dentro do protótipo.

### 👓 5. Acessibilidade e linguagem simples

- Controle `Aa` com os tamanhos Normal, Grande e Muito Grande.

- Preferência de fonte persistida localmente.

- Leitura em voz alta em português para enunciados e explicações.

- “Tradutor do Cotidiano” com analogias simples:
  - Chave Pública = Chave Pix;
  - Chave Privada = Senha do banco;
  - Gas Fee = Tarifa de envio;
  - Faucet = Torneira de saldo de brincadeira para treinar.

### 📊 6. Mercado e notícias

- Dados de mercado das principais moedas pela API pública da [Crypto Vision News](https://cryptocurrency.cv/).

- Radar com maior alta, maior queda e líder por capitalização.

- Manchetes relacionadas com título, fonte, data e link para o artigo original.

Dados de mercado e manchetes são exibidos para contexto educacional e não constituem recomendação financeira.

### 🔑 7. Autenticação

- Login demonstrativo rápido.

- Fluxo de acesso rápido apresentado como “Continuar com Google”.

- Janela oficial do Google disponível somente quando um Google OAuth Client ID válido é configurado.

- O login social rápido sem OAuth configurado é uma demonstração local, não uma autenticação Google completa.

## 📌 Atualização mais recente

O commit mais recente do GitHub é `555ca80`, com a mensagem `perf: presenca ultra-rapida de alunos online com Last Will no broker, heartbeat de 2s e varredura de saida a cada 1s`.

Essa atualização alterou:

- `src/components/CommunityChatPanel.tsx`;

- `src/lib/communityChat.ts`;

- `src/styles.css`.

O foco foi tornar a presença mais rápida, adicionar Last Will no broker e incluir atualização manual da lista de alunos.

## 🛠️ Tecnologias

- **Frontend:** React 19, TypeScript e Vite.

- **Estilos:** CSS moderno com variáveis, gradientes, glassmorphism e dark mode.

- **Tempo real:** MQTT sobre WSS, EMQX, HiveMQ e `BroadcastChannel`.

- **Acessibilidade:** Web Speech API e escala dinâmica de fonte.

- **Dados de mercado:** API pública da Crypto Vision News.

- **Hospedagem:** Vercel integrada ao GitHub.

## ⚖️ Direitos autorais e uso de notícias

A API agrega manchetes e metadados de publishers terceiros. O fato de a API ser pública ou gratuita não significa que as matérias sejam livres de direitos autorais. O conteúdo original continua pertencendo aos publishers.

O Abracadabra deve manter apenas o necessário para encaminhar o usuário à fonte:

- título;

- publisher;

- data;

- URL original;

- atribuição visível.

Não copiar ou redistribuir corpo da matéria, resumo editorial, imagens de terceiros ou reescritas automáticas. A atribuição não substitui uma licença editorial. Antes de uso comercial, cache prolongado ou redistribuição em escala, revisar os [termos da API](https://cryptocurrency.cv/terms) e as regras dos publishers.

## 🚀 Como executar

```bash
git clone https://github.com/wSales0/abracadabra.git
cd abracadabra
npm install
npm run dev
```

Depois, abra o endereço indicado pelo Vite. Para build de produção:

```bash
npm run build
```

## 👥 Credenciais de demonstração

```
Usuário: teste123
Senha: 123
```

O fluxo de Google OAuth oficial exige configuração própria no Google Cloud e não deve receber credenciais secretas no frontend.

## 🔮 Próximos passos técnicos

Para produção, será necessário adicionar autenticação real, banco de dados, RLS, moderação de chat, broker próprio ou protegido, rate limiting, cache server-side, validação de XP no servidor e integração on-chain verificável. Supabase Auth, Database, Storage e Edge Functions são opções compatíveis com a arquitetura planejada.

## 📄 Licença e aviso

O Abracadabra é um projeto educacional para demonstração e hackathon. Dados de mercado e notícias não constituem recomendação financeira. As licenças da API, dos publishers e dos brokers externos são independentes da licença do código do Abracadabra; revise seus termos antes de uso comercial.
