# LK Moda Masculina 🛍️

Loja online completa com Firebase, EmailJS e Pix estático.

## 🚀 Deploy na Vercel

### Opção 1 — Via GitHub (recomendado)
1. Suba esta pasta para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) → **New Project**
3. Importe o repositório
4. Clique em **Deploy** (sem configuração extra necessária)

### Opção 2 — Via CLI
```bash
npm i -g vercel
vercel
```

---

## 🔥 Configurar Firebase (obrigatório após deploy)

Após obter seu domínio Vercel (ex: `lkmodas.vercel.app`):

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Projeto **lk-modas-7c7b8** → **Authentication** → **Settings** → **Authorized domains**
3. Clique em **Add domain** e adicione seu domínio Vercel
4. Em **Firestore → Rules**, cole as regras do arquivo `firebase-lkmodas.js`

---

## 🔐 Acesso Admin

- URL: `/admin`
- E-mail: `lkmodamasculina089@gmail.com`
- Senha: `kamperlk122709!`
- 2FA: código exibido na tela (modo demo)

---

## 📁 Estrutura

```
├── index.html          # Homepage
├── produtos.html       # Catálogo
├── produto.html        # Detalhe do produto
├── carrinho.html       # Carrinho
├── checkout.html       # Finalização
├── payment-confirmation.html  # Confirmação Pix
├── login.html          # Login cliente
├── cadastro.html       # Cadastro
├── minha-conta.html    # Conta do cliente
├── admin.html          # Painel admin
├── assets/             # Logo e imagens estáticas
├── script.js           # JS principal
├── style.css           # CSS global
├── firebase-lkmodas.js # Integração Firebase
├── emailjs-lkmodas.js  # Integração EmailJS
└── vercel.json         # Config Vercel
```
