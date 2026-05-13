let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
let carrinho = [];

/* SALVAR */
function salvar(){
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

/* CADASTRAR */
function cadastrar(){
  let cod = codInput.value;
  let nome = nomeInput.value;
  let preco = parseFloat(precoInput.value);

  if(!cod || !nome || isNaN(preco)){
    alert("Preencha corretamente");
    return;
  }

  produtos.push({cod,nome,preco});
  salvar();
  renderProdutos();

  codInput.value="";
  nomeInput.value="";
  precoInput.value="";
}

/* LISTAR PRODUTOS */
function renderProdutos(){
  if(!produtosDiv) return;

  produtosDiv.innerHTML="";

  produtos.forEach((p,index)=>{
    let div=document.createElement("div");
    div.className="produto";

    div.innerHTML=`
      ${p.cod} - ${p.nome} - R$ ${p.preco.toFixed(2)}
      <button onclick="removerProduto(${index})">X</button>
    `;

    produtosDiv.appendChild(div);
  });
}

/* EXCLUIR */
function removerProduto(index){
  if(confirm("Excluir produto?")){
    produtos.splice(index,1);
    salvar();
    renderProdutos();
  }
}

/* BUSCAR */
function buscar(){
  let cod = codigo.value;
  let p = produtos.find(x=>x.cod == cod);

  if(!p){
    alert("Produto não encontrado");
    return;
  }

  carrinho.push(p);
  renderCarrinho();
  codigo.value="";
}

/* ENTER */
function enterAdd(e){
  if(e.key==="Enter") buscar();
}

/* CARRINHO */
function renderCarrinho(){
  if(!carrinhoDiv) return;

  carrinhoDiv.innerHTML="";
  let total=0;

  carrinho.forEach((p,i)=>{
    total+=p.preco;

    let div=document.createElement("div");
    div.className="item";

    div.innerHTML=`
      ${p.nome} - R$ ${p.preco.toFixed(2)}
      <button onclick="remover(${i})">X</button>
    `;

    carrinhoDiv.appendChild(div);
  });

  totalSpan.textContent=total.toFixed(2);
}

/* REMOVER ITEM */
function remover(i){
  carrinho.splice(i,1);
  renderCarrinho();
}

/* LIMPAR */
function limpar(){
  carrinho=[];
  renderCarrinho();
}

/* FINALIZAR + SALVAR VENDA */
function finalizar(){
  if(carrinho.length === 0){
    alert("Carrinho vazio");
    return;
  }

  let vendas = JSON.parse(localStorage.getItem("vendas")) || [];
  let historico = JSON.parse(localStorage.getItem("historico")) || [];

  let hoje = new Date().toLocaleDateString();

  let total = carrinho.reduce((s,p)=>s+p.preco,0);

  let venda = {
    data: hoje,
    itens: carrinho,
    total: total
  };

  vendas.push(venda);
  localStorage.setItem("vendas", JSON.stringify(vendas));

  alert("Venda finalizada!");
  limpar();
}
