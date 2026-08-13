# 🏠 ImóvelHub — Diretório de Imóveis

Site de diretório/agregador de imóveis (venda e aluguel) em **HTML, CSS e JavaScript puro**.
Sem frameworks, sem build, sem servidor obrigatório.

## ▶️ Como abrir no VSCode

1. Descompacte esta pasta.
2. Abra a pasta no VSCode (**Arquivo → Abrir Pasta**).
3. Abra o `index.html`:
   - **Mais fácil:** instale a extensão **Live Server** e clique em "Go Live".
   - **Ou** dê duplo-clique no `index.html` (esta versão funciona até sem servidor).

## 📁 Estrutura

```
imovelhub/
├── index.html        # Página principal
├── css/
│   └── styles.css    # Estilos
└── js/
    └── app.js        # Lógica + dados dos imóveis (edite o array "imoveis")
```

## 💰 Monetização já incluída

- **Destaque pago** → seção "Imóveis em destaque" + selo ★ (use `destaque: true`)
- **Listagem paga** → 3 planos (Grátis / R$ 49 / R$ 199)
- **Afiliados** → banner de crédito imobiliário (`rel="sponsored"`)

## ➕ Adicionar um imóvel

Abra `js/app.js`, copie um bloco `{ ... }` dentro do array `imoveis` e edite os campos.

## 🚀 Publicar na Vercel

Sem configuração nenhuma:

1. Suba a pasta para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com): **Add New → Project** → importe o repo.
3. Framework Preset: **Other** (deixe Build/Output vazios) → **Deploy**.

Ou pelo terminal:
```bash
npm i -g vercel
vercel
```
