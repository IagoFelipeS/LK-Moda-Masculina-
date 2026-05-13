# 🛠️ Troubleshooting - Produtos Não Aparecem + Logos Bugadas

## ⚡ Ações Rápidas (Tente Primeiro)

### 1️⃣ **Forçar Sincronização**
Abra no seu navegador:
```
http://localhost:5500/kamper_site/index.html#debug
```
Vai aparecer um botão **"🔄 Sincronizar"** no canto inferior direito. Clique!

### 2️⃣ **Limpar Cache do Navegador**
- Pressione `Ctrl + Shift + Delete` (Windows) ou `Cmd + Shift + Delete` (Mac)
- Selecione "Cache" e "Cookies"
- Clique em "Limpar dados"
- Recarregue a página

### 3️⃣ **Verificar Console**
- Abra DevTools: `F12`
- Vá em "Console"
- Procure por mensagens começando com **❌** (erro)
- Copie o erro e envie para debug

---

## 🔍 Diagnóstico Completo

Abra em seu navegador:
```
http://localhost:5500/kamper_site/diagnostico.html
```

Clique nos 3 botões em ordem:
1. ▶ **Executar Diagnóstico**
2. 🔥 **Testar Firebase**  
3. 🖼️ **Testar Logos**

Isso vai mostrar exatamente qual é o problema.

---

## 📋 Checklist de Problemas

### ❌ "Produtos não aparecem no site"

**Teste 1: Firebase está conectando?**
```javascript
// Cola no console (F12)
window.FB.getProducts().then(p => console.log(p))
```
- ✅ Se mostra uma lista → Firebase OK
- ❌ Se erro → Problema no Firebase

**Teste 2: Listener está ativo?**
```javascript
console.log('Listener:', Products._unsubscribe ? '✅ Ativo' : '❌ Inativo')
```
- ✅ Se "Ativo" → Sincronização funcionando
- ❌ Se "Inativo" → Executar `Products.startSync()`

**Teste 3: Cache tem produtos?**
```javascript
console.log('Produtos em cache:', window.__LK_PRODUCTS_CACHE.length)
```
- ✅ Se > 0 → Dados carregados
- ❌ Se 0 → Nenhum produto no Firebase

---

### 🖼️ "Logos não aparecem"

**Teste 1: Arquivo existe?**
```javascript
// Cola no console
fetch('assets/logo.svg').then(r => console.log('Status:', r.status))
```
- ✅ Status 200 → Arquivo OK
- ❌ Status 404 → Arquivo não encontrado

**Teste 2: Caminho correto?**
- HTML está em: `kamper_site/index.html`
- Logo deveria estar em: `kamper_site/assets/logo.svg`
- Se moveu a pasta, o caminho muda!

**Teste 3: Extensão correta?**
- `.svg` (vetorial) → Melhor qualidade
- `.png` (raster) → Se SVG não funciona
- Verificar se não está com nome errado

---

## 🔧 Soluções Comuns

### Solução 1: Firebase Offline
**Sintoma**: Erro "permission-denied" ou "offline"

**Ação**:
1. Verifique sua conexão de internet
2. Cheque se Firebase Console está acessível: https://console.firebase.google.com
3. Se não conseguir acessar, Firebase pode estar em manutenção

### Solução 2: Regras do Firestore Incorretas
**Sintoma**: Produtos carregam só para admin, não para usuários

**Ação**:
1. Vá em: https://console.firebase.google.com
2. Projeto: `lk-modas-7c7b8`
3. Firestore → Regras
4. Cole as regras corretas (verificar no `firebase-lkmodas.js`)

### Solução 3: Listener Não Iniciado
**Sintoma**: Adiciona produto no admin, não aparece no site

**Ação**:
```javascript
// Cola no console do site
Products.startSync()
```
Depois adicione um produto no admin - deve aparecer em 1-3 segundos

### Solução 4: Logos com Caminho Errado
**Sintoma**: Logos não carregam, mais arquivo não foi deletado

**Ação**:
1. Abra DevTools (F12)
2. Vá em Network
3. Procure por `logo.svg`
4. Veja qual é o status (200? 404?)
5. Se 404, o caminho está errado

---

## 📝 Checklist Final

Antes de chamar de "arrumado":

- [ ] Console sem erros (F12)
- [ ] Produtos aparecem em index.html
- [ ] Produtos aparecem em produtos.html
- [ ] Adicionar produto no admin aparece no site
- [ ] Logo carrega sem erro
- [ ] Notificações aparecem ao adicionar produto
- [ ] Sincronização funciona com 2 abas abertas

---

## 🆘 Se Ainda Não Funcionar

**Envie para debug:**
1. Screenshot do console (F12)
2. Resultado do `diagnostico.html`
3. O que tenta fazer e o que acontece
4. Qual navegador e sistema operacional

---

## 📚 Links Úteis

- Console do Firebase: https://console.firebase.google.com
- Arquivo de regras: `kamper_site/firestore.rules`
- Arquivo de sincronização: `kamper_site/script.js`
- Arquivo de conexão: `kamper_site/firebase-lkmodas.js`

---

**Última atualização**: 13 de maio de 2026
