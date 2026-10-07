<p align="center">
  <a href="./README.md"><img alt="English" src="https://img.shields.io/badge/lang-English-7C3AED?style=for-the-badge" /></a>
  <a href="./README.pt-BR.md"><img alt="Português (BR)" src="https://img.shields.io/badge/lang-Português%20(BR)-14F195?style=for-the-badge&labelColor=09090F" /></a>
</p>

<p align="center">
  <img src="./assets/logo-abracadabra.png" alt="Abracadabra" width="220" />
</p>

<h1 align="center">Abracadabra · Web3 EdTech</h1>

<p align="center">
  <strong>Aprenda. Pratique. Converse. Evolua sem medo.</strong><br />
  A plataforma educacional Web3 pensada para todas as idades — de jovens estudantes a idosos dando seus primeiros passos no universo cripto.
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-live%20production-14F195" />
  <img alt="Rede" src="https://img.shields.io/badge/rede-Solana%20Devnet-14F195" />
  <img alt="Chat" src="https://img.shields.io/badge/chat-WebSockets%20ao%20vivo-7C3AED" />
  <img alt="Categoria" src="https://img.shields.io/badge/categoria-EdTech%20Web3-09090F" />
  <img alt="Deploy" src="https://img.shields.io/badge/deploy-Vercel-black" />
</p>

---

## 🧙‍♂️ O que é o Abracadabra?

O **Abracadabra** é uma plataforma EdTech gamificada que desmistifica o universo de blockchain e criptomoedas. 

Em vez de jogar os usuários direto em exchanges ou riscos reais, o Abracadabra oferece um **laboratório de prática 100% seguro**: analogias com o dia a dia (como comparar Chave Pública com Chave Pix), simuladores anti-golpe, carteira de teste com torneira de moedas gratuitas e uma comunidade ao vivo com pessoas de verdade navegando juntas.

---

## ✨ Principais Funcionalidades

### 🧪 1. Carteira Prática Web3 (Solana Devnet Simulada)
- **Geração Automática de Carteira:** Toda conta recebe uma chave pública e saldo inicial de treino (2.5 SOL Devnet).
- **Torneira Gratuita (Faucet):** Botão para solicitar +1.0 SOL de teste sempre que quiser praticar sem custo real.
- **Simulador de Envio On-Chain:** Pratique preencher chaves públicas de destino, acompanhar o débito de taxas de rede (*Gas Fee*) e verificar a assinatura/hash da transação.
- **Histórico Completo de Transações:** Exibição clara de débitos, créditos, taxas e status de confirmação.

### 💬 2. Comunidade & Chat em Tempo Real
- **Pessoas de Verdade ao Vivo:** Conexão contínua via WebSockets globais (MQTT sobre WSS via EMQX e HiveMQ + BroadcastChannel local).
- **Detecção de Presença (Heartbeat):** A coluna de alunos conectados exibe exatamente quem está navegando no site agora. Se você estiver sozinho, a plataforma avisa e disponibiliza botão de convite para amigos.
- **Troca de Ideias Instantânea:** Bate-papo ao vivo para tirar dúvidas com colegas e instrutores em tempo real.

### 🛡️ 3. Simulador Anti-Golpe ("Cilada ou Seguro?")
- **Casos Reais do Cotidiano:** Mensagens de WhatsApp se passando por suporte, falsos airdrops, sites clonados e contratos suspeitos.
- **Explicações Didáticas:** Ao responder se a situação é segura ou cilada, o aluno recebe a justificativa em linguagem clara e aprende regras de ouro (ex: *“Nunca compartilhe suas 12 palavras ou Chave Privada”*).

### 🎯 4. Trilha do Aprendiz (Missões Guiadas)
- Barra de progresso interativa com percentual de conclusão.
- Missões didáticas: descobrir a chave pública, coletar no faucet, fazer transferência de treino, acertar desafios no laboratório e passar no teste de segurança.
- Recompensas instantâneas em **XP** e **SOL de treino**.

### 👓 5. Acessibilidade Inclusiva (Para Jovens e Idosos)
- **Controle de Tamanho de Fonte:** Botão `Aa` no topo com 3 níveis (Normal, Grande, Muito Grande) com persistência local.
- **Leitor em Áudio (Voz Nativa):** Botão de áudio para ouvir as perguntas e explicações em voz alta em português (Web Speech API).
- **Tradutor do Cotidiano:** Dicionário intuitivo que compara termos técnicos com o dia a dia:
  - *Chave Pública* = Sua Chave Pix (pode compartilhar sem medo).
  - *Chave Privada* = Senha do Banco (nunca entregue a ninguém).
  - *Gas Fee* = Tarifa de envio do correio/cartório.
  - *Faucet* = Torneira pública de dinheiro de mentira para treinar.

### 📊 6. Radar de Mercado e Notícias em Tempo Real
- Cotações atualizadas das 8 principais moedas via API pública da [Crypto Vision News](https://cryptocurrency.cv/).
- Radar diário de maior alta, maior queda e líder por market cap.
- Manchetes com links diretos para as fontes originais respeitando direitos autorais.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite.
- **Estilização:** CSS3 Moderno com variáveis, gradientes, Glassmorphism e Dark Mode.
- **Comunicação em Tempo Real:** WebSockets (MQTT Client sobre TLS/WSS) + `BroadcastChannel` para multi-abas.
- **Acessibilidade:** Web Speech API (Text-to-Speech) e Dynamic Font Scaling.
- **Hospedagem & CI/CD:** Vercel integrada ao GitHub.

---

## 🚀 Como Rodar o Projeto Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/wSales0/abracadabra.git
cd abracadabra

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Abra no navegador:
# http://localhost:3000
```

Para gerar a build de produção otimizada:
```bash
npm run build
```

---

## 👥 Credenciais de Demonstração

Para navegar e testar a plataforma:
- **Login Demo:** `teste123`
- **Senha Demo:** `123`
- Ou utilize a opção **"Continuar com Google"** diretamente na tela inicial.

---

## 📄 Licença e Aviso Legal

O **Abracadabra** é um projeto com fins estritamente **educacionais** desenvolvido para hackathon. Os dados de mercado e notícias exibidos têm propósito pedagógico e não constituem recomendação de investimento financeiro.
