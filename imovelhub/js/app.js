// ===== Doce Lar — lógica principal =====

// ─── CONFIGURAÇÕES DO SITE ────────────────────────────────────────────────────
// Edite este bloco com os dados reais antes de publicar
const CONFIG = {
  pixChave:        'docelar@email.com',   // chave PIX (email, CPF, telefone ou aleatória)
  pixNome:         'Doce Lar Imóveis',
  whatsappSuporte: '11999999999',         // número para receber comprovantes

  planos: {
    Destaque: {
      preco:      49,
      linkCartao: '#', // cole aqui o link do Mercado Pago / Stripe para R$ 49/mês
    },
    Imobiliária: {
      preco:      199,
      linkCartao: '#', // cole aqui o link do Mercado Pago / Stripe para R$ 199/mês
    },
  },

  // ── Firebase (firebase.google.com → Configurações do projeto → Seus apps) ──
  firebase: {
    apiKey:            'SUA_API_KEY',
    authDomain:        'seu-projeto.firebaseapp.com',
    projectId:         'seu-projeto-id',
    storageBucket:     'seu-projeto.appspot.com',
    messagingSenderId: 'SEU_SENDER_ID',
    appId:             'SEU_APP_ID',
  },
};
// ─────────────────────────────────────────────────────────────────────────────

// ===== Favoritos & Meus Anúncios =====
function getFavoritos() {
  try { return JSON.parse(localStorage.getItem('favoritos') || '[]'); } catch { return []; }
}
function getMeusAnunciosIds() {
  try { return JSON.parse(localStorage.getItem('meusAnunciosIds') || '[]'); } catch { return []; }
}
function salvarMeuAnuncioId(id) {
  const ids = getMeusAnunciosIds();
  const sid = String(id);
  if (!ids.includes(sid)) { ids.push(sid); localStorage.setItem('meusAnunciosIds', JSON.stringify(ids)); }
}
function toggleFavorito(id) {
  const favs = getFavoritos();
  const sid = String(id);
  const idx = favs.indexOf(sid);
  if (idx === -1) favs.push(sid); else favs.splice(idx, 1);
  localStorage.setItem('favoritos', JSON.stringify(favs));
  document.querySelectorAll(`.btn-fav[data-id="${id}"]`).forEach(btn => {
    btn.classList.toggle('ativo', favs.includes(sid));
    btn.setAttribute('aria-label', favs.includes(sid) ? 'Remover dos favoritos' : 'Salvar nos favoritos');
  });
  atualizarContadorFav();
  const painel = document.getElementById('modal-meus-anuncios');
  if (painel && painel.classList.contains('aberto') && tabPainel === 'favoritos') renderPainel();
}
function atualizarContadorFav() {
  const n = getFavoritos().length;
  const el = document.getElementById('fav-count');
  if (!el) return;
  el.textContent = n || '';
  el.style.display = n > 0 ? '' : 'none';
}

// ===== Firebase =====
let db, storage, firebaseAtivo = false;

function initFirebase() {
  const cfg = CONFIG.firebase;
  if (!cfg?.apiKey || cfg.apiKey === 'SUA_API_KEY') return;
  try {
    firebase.initializeApp(cfg);
    db      = firebase.firestore();
    storage = firebase.storage();
    firebaseAtivo = true;
  } catch (e) { console.error('Firebase:', e); }
}

async function uploadFotosFirebase(fotos) {
  const urls = [];
  for (const { file } of fotos) {
    const ref = storage.ref(`imoveis/${Date.now()}_${Math.random().toString(36).slice(2)}`);
    await ref.put(file);
    urls.push(await ref.getDownloadURL());
  }
  return urls;
}

function iniciarListenerFirebase() {
  if (!firebaseAtivo) { carregarImoveisLocais(); return; }

  db.collection('imoveis').orderBy('_criadoEm', 'desc').onSnapshot(
    (snap) => {
      snap.docChanges().forEach(({ type, doc }) => {
        const im = { ...doc.data(), id: doc.id, _criadoEm: null };
        if (type === 'added' && !imoveis.find((i) => i.id === im.id)) {
          imoveis.unshift(im);
        } else if (type === 'removed') {
          const idx = imoveis.findIndex((i) => i.id === im.id);
          if (idx !== -1) imoveis.splice(idx, 1);
        }
      });
      popularFiltros();
      renderTudo();
    },
    () => { carregarImoveisLocais(); popularFiltros(); renderTudo(); }
  );
}

const imoveis = [
  {
    id: 1,
    titulo: "Apartamento 3 quartos com varanda gourmet",
    tipo: "Apartamento", operacao: "Venda",
    cidade: "São Paulo", bairro: "Pinheiros", estado: "SP",
    preco: 890000, quartos: 3, banheiros: 2, vagas: 2, area: 98,
    destaque: true,
    descricao: "Moderno apartamento de 98 m² no coração de Pinheiros, com sala integrada à varanda gourmet, 3 quartos sendo 1 suíte, cozinha planejada e 2 vagas na garagem. Condomínio com piscina, academia e portaria 24h. A 5 minutos do metrô Faria Lima.",
    imagem: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80"
    ],
    anunciante: "Imobiliária Prime", telefone: "11999990001"
  },
  {
    id: 2,
    titulo: "Casa térrea em condomínio fechado",
    tipo: "Casa", operacao: "Venda",
    cidade: "Campinas", bairro: "Alphaville", estado: "SP",
    preco: 1450000, quartos: 4, banheiros: 4, vagas: 4, area: 320,
    destaque: true,
    descricao: "Espaçosa casa de 320 m² em condomínio de alto padrão com segurança 24h. 4 dormitórios todos com suíte, sala de estar e jantar integradas, cozinha gourmet com ilha, home theater, piscina aquecida e ampla área de lazer. 4 vagas na garagem.",
    imagem: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80",
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=900&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80"
    ],
    anunciante: "RE/Imóveis Campinas", telefone: "19999990002"
  },
  {
    id: 3,
    titulo: "Studio mobiliado para aluguel",
    tipo: "Studio", operacao: "Aluguel",
    cidade: "São Paulo", bairro: "Vila Mariana", estado: "SP",
    preco: 2800, quartos: 1, banheiros: 1, vagas: 1, area: 32,
    destaque: false,
    descricao: "Studio completamente mobiliado e equipado, pronto para morar. Ideal para quem busca praticidade e localização. A 10 min da linha 2 do metrô, próximo a shoppings, restaurantes e ciclovias. Ar-condicionado, internet fibra e água incluídos no aluguel.",
    imagem: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80",
      "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=900&q=80"
    ],
    anunciante: "Aluga Fácil", telefone: "11999990003"
  },
  {
    id: 4,
    titulo: "Cobertura duplex com vista para o mar",
    tipo: "Cobertura", operacao: "Venda",
    cidade: "Rio de Janeiro", bairro: "Barra da Tijuca", estado: "RJ",
    preco: 3200000, quartos: 4, banheiros: 5, vagas: 3, area: 280,
    destaque: true,
    descricao: "Cobertura duplex de 280 m² com vista panorâmica para o mar da Barra da Tijuca. 4 suítes, sala com pé-direito duplo, área gourmet com churrasqueira, piscina privativa e 3 vagas. Acabamento de altíssimo padrão. Edifício com sistema de segurança completo.",
    imagem: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80",
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=900&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=900&q=80",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80"
    ],
    anunciante: "Luxo Imóveis RJ", telefone: "21999990004"
  },
  {
    id: 5,
    titulo: "Apartamento 2 quartos próximo à praia",
    tipo: "Apartamento", operacao: "Aluguel",
    cidade: "Florianópolis", bairro: "Canasvieiras", estado: "SC",
    preco: 3500, quartos: 2, banheiros: 1, vagas: 1, area: 65,
    destaque: false,
    descricao: "Apartamento luminoso a 800m da Praia de Canasvieiras, em Florianópolis. 2 quartos, cozinha americana, varanda com vista parcial para o mar. Ideal para moradia ou temporada. Condomínio com área de lazer e estacionamento coberto.",
    imagem: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=900&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80"
    ],
    anunciante: "Floripa Imóveis", telefone: "48999990005"
  },
  {
    id: 6,
    titulo: "Terreno comercial em avenida principal",
    tipo: "Terreno", operacao: "Venda",
    cidade: "Belo Horizonte", bairro: "Savassi", estado: "MG",
    preco: 980000, quartos: 0, banheiros: 0, vagas: 0, area: 450,
    destaque: false,
    descricao: "Terreno comercial de 450 m² em posição estratégica na Avenida Savassi, uma das principais vias comerciais de BH. Zoneamento ZC-1 (comercial), com 15m de frente e documentação regularizada. Ideal para empreendimentos de médio porte.",
    imagem: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80",
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=80"
    ],
    anunciante: "BH Negócios", telefone: "31999990006"
  },
  {
    id: 7,
    titulo: "Casa de 3 quartos com quintal amplo",
    tipo: "Casa", operacao: "Venda",
    cidade: "Curitiba", bairro: "Boa Vista", estado: "PR",
    preco: 620000, quartos: 3, banheiros: 2, vagas: 2, area: 150,
    destaque: false,
    descricao: "Casa de 150 m² em bairro tranquilo de Curitiba. 3 quartos (1 suíte), sala espaçosa, cozinha com churrasqueira coberta, quintal amplo com área de lazer e horta. 2 vagas de garagem. Próximo a escolas, supermercados e parques.",
    imagem: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80",
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=900&q=80"
    ],
    anunciante: "Curitiba Lar", telefone: "41999990007"
  },
  {
    id: 8,
    titulo: "Loft industrial reformado no centro",
    tipo: "Loft", operacao: "Aluguel",
    cidade: "Porto Alegre", bairro: "Centro Histórico", estado: "RS",
    preco: 2200, quartos: 1, banheiros: 1, vagas: 0, area: 55,
    destaque: false,
    descricao: "Loft de 55 m² em edifício industrial reformado no Centro Histórico. Pé-direito de 4m, tijolinhos expostos, cozinha integrada no estilo industrial. Ambiente único e cheio de charme. A 5 min a pé do Mercado Público e das principais atrações da cidade.",
    imagem: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=900&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=900&q=80"
    ],
    anunciante: "POA Urbano", telefone: "51999990008"
  }
];

const fmtMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor);

function popularFiltros() {
  const cidades = [...new Set(imoveis.map((i) => i.cidade))].sort();
  const tipos   = [...new Set(imoveis.map((i) => i.tipo))].sort();

  const selCidade = document.getElementById('f-cidade');
  while (selCidade.options.length > 1) selCidade.remove(1);
  cidades.forEach((c) => selCidade.add(new Option(c, c)));

  const selTipo = document.getElementById('f-tipo');
  while (selTipo.options.length > 1) selTipo.remove(1);
  tipos.forEach((t) => selTipo.add(new Option(t, t)));
}

// ===== Persistência local =====
function carregarImoveisLocais() {
  try {
    const salvos = JSON.parse(localStorage.getItem('imoveisDocelar') || '[]');
    salvos.forEach((im) => {
      if (!imoveis.find((i) => i.id === im.id)) imoveis.push(im);
    });
  } catch (e) {}
}

function salvarLocalmente(imovel) {
  try {
    const salvos = JSON.parse(localStorage.getItem('imoveisDocelar') || '[]');
    salvos.push(imovel);
    localStorage.setItem('imoveisDocelar', JSON.stringify(salvos));
  } catch (e) {
    // Quota exceeded (fotos pesadas) — salva sem imagens
    try {
      const salvos = JSON.parse(localStorage.getItem('imoveisDocelar') || '[]');
      const semFoto = {
        ...imovel,
        imagem: 'https://placehold.co/800x600/e9edf5/1a56db?text=Imóvel',
        fotos:  ['https://placehold.co/900x600/e9edf5/1a56db?text=Foto+em+breve'],
      };
      salvos.push(semFoto);
      localStorage.setItem('imoveisDocelar', JSON.stringify(salvos));
    } catch (e2) {}
  }
}

async function publicarImovel() {
  const plano = document.querySelector('input[name="a-plano"]:checked')?.value || 'Básico';
  let fotos = fotosAnuncio.length > 0
    ? fotosAnuncio.map((f) => f.url)
    : ['https://placehold.co/900x600/e9edf5/1a56db?text=Foto+em+breve'];

  const novo = {
    id:        Date.now(),
    titulo:    document.getElementById('a-titulo').value.trim() || 'Imóvel anunciado',
    tipo:      document.querySelector('input[name="a-tipo"]:checked')?.value || 'Outros',
    operacao:  document.querySelector('input[name="a-operacao"]:checked')?.value || 'Venda',
    cidade:    document.getElementById('a-cidade').value.trim(),
    bairro:    document.getElementById('a-bairro').value.trim(),
    estado:    document.getElementById('a-estado').value,
    preco:     parseFloat(document.getElementById('a-preco').value) || 0,
    quartos:   parseInt(document.getElementById('a-quartos').value)  || 0,
    banheiros: parseInt(document.getElementById('a-banheiros').value) || 1,
    vagas:     parseInt(document.getElementById('a-vagas').value)    || 0,
    area:      parseFloat(document.getElementById('a-area').value)   || 0,
    descricao: document.getElementById('a-descricao').value.trim(),
    destaque:  plano === 'Destaque' || plano === 'Imobiliária',
    imagem:    fotos[0],
    fotos,
    anunciante: document.getElementById('a-nome').value.trim(),
    telefone:   document.getElementById('a-tel').value.replace(/\D/g, ''),
  };

  if (firebaseAtivo) {
    if (fotosAnuncio.length > 0) {
      novo.fotos  = await uploadFotosFirebase(fotosAnuncio);
      novo.imagem = novo.fotos[0];
    }
    const { id: _id, ...dados } = novo;
    dados._criadoEm = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection('imoveis').add(dados);
    novo.id = ref.id;
  } else {
    salvarLocalmente(novo);
  }

  if (!imoveis.find((i) => i.id === novo.id)) imoveis.unshift(novo);
  salvarMeuAnuncioId(novo.id);
  popularFiltros();
  renderTudo();
  return novo;
}

function mensagemWpp(im) {
  const preco = im.operacao === 'Aluguel'
    ? `${fmtMoeda(im.preco)}/mês`
    : fmtMoeda(im.preco);
  const specs = im.tipo === 'Terreno'
    ? `${im.area} m²`
    : `${im.quartos} quartos · ${im.banheiros} banheiros · ${im.vagas} vagas · ${im.area} m²`;

  return [
    'Olá! Vi seu anúncio no Doce Lar e tenho interesse neste imóvel:',
    '',
    `*${im.titulo}*`,
    `${im.bairro}, ${im.cidade} — ${im.estado}`,
    `${im.tipo} · ${im.operacao} · ${preco}`,
    specs,
    '',
    'Poderia me passar mais informações? Obrigado!'
  ].join('\n');
}

function cardHTML(im) {
  const sufixoPreco = im.operacao === 'Aluguel' ? '<small>/mês</small>' : '';
  const tagDestaque = im.destaque ? '<span class="tag tag-destaque">★ Destaque</span>' : '';
  const wpp = `https://wa.me/55${im.telefone}?text=${encodeURIComponent(mensagemWpp(im))}`;
  const isFav = getFavoritos().includes(String(im.id));

  const specs = im.tipo === 'Terreno'
    ? `<span>${im.area} m²</span>`
    : `<span>${im.quartos} qts.</span>
       <span>${im.banheiros} ban.</span>
       <span>${im.vagas} ${im.vagas === 1 ? 'vaga' : 'vagas'}</span>
       <span>${im.area} m²</span>`;

  return `
  <article class="card ${im.destaque ? 'is-destaque' : ''}" onclick="abrirDetalhe('${im.id}')">
    <div class="card-img">
      <img src="${im.imagem}" alt="${im.titulo}" loading="lazy"
           onerror="this.src='https://placehold.co/800x600/e9edf5/1a56db?text=Imóvel'">
      <span class="tag tag-operacao">${im.operacao}</span>
      ${tagDestaque}
      <button class="btn-fav ${isFav ? 'ativo' : ''}" data-id="${im.id}"
              onclick="event.stopPropagation(); toggleFavorito('${im.id}')"
              aria-label="${isFav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
    </div>
    <div class="card-body">
      <div class="card-preco">${fmtMoeda(im.preco)} ${sufixoPreco}</div>
      <h3 class="card-titulo">${im.titulo}</h3>
      <p class="card-local">${im.bairro}, ${im.cidade} · ${im.estado}</p>
      <div class="card-specs">${specs}</div>
      <div class="card-anunciante">
        <span>${im.anunciante}</span>
        <a class="btn-contato" href="${wpp}" target="_blank" rel="noopener"
           onclick="event.stopPropagation()">Contato</a>
      </div>
    </div>
  </article>`;
}

function filtrar() {
  const cidade = document.getElementById('f-cidade').value;
  const tipo = document.getElementById('f-tipo').value;
  const operacao = document.getElementById('f-operacao').value;
  const precoMax = parseFloat(document.getElementById('f-preco').value) || Infinity;

  return imoveis.filter((im) =>
    (!cidade || im.cidade === cidade) &&
    (!tipo || im.tipo === tipo) &&
    (!operacao || im.operacao === operacao) &&
    im.preco <= precoMax
  );
}

function renderTudo() {
  const filtrados = filtrar();

  const destaques = filtrados.filter((i) => i.destaque);
  const elDestaques = document.getElementById('lista-destaques');
  const secaoDestaques = document.getElementById('secao-destaques');
  if (destaques.length) {
    elDestaques.innerHTML = destaques.map(cardHTML).join('');
    secaoDestaques.style.display = '';
  } else {
    secaoDestaques.style.display = 'none';
  }

  const lista = document.getElementById('lista-imoveis');
  lista.innerHTML = filtrados.length
    ? filtrados.map(cardHTML).join('')
    : '<p class="sem-resultados">Nenhum imóvel encontrado com esses filtros. 🔍<br>Tente ampliar a busca.</p>';

  document.getElementById('contador').textContent =
    `${filtrados.length} ${filtrados.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`;
}

// ===== Modal Detalhe =====
let galeriaFotos = [];
let galeriaIdx = 0;

function abrirDetalhe(id) {
  const im = imoveis.find((i) => String(i.id) === String(id));
  if (!im) return;

  galeriaFotos = im.fotos;
  galeriaIdx = 0;

  const sufixoPreco = im.operacao === 'Aluguel' ? '<small>/mês</small>' : '';
  document.getElementById('d-preco').innerHTML = fmtMoeda(im.preco) + sufixoPreco;
  document.getElementById('d-titulo').textContent = im.titulo;
  document.getElementById('d-local').textContent = `${im.bairro}, ${im.cidade} · ${im.estado}`;
  document.getElementById('d-operacao-tag').textContent = im.operacao;
  document.getElementById('d-destaque-tag').style.display = im.destaque ? '' : 'none';

  const specs = im.tipo === 'Terreno'
    ? `<span>${im.area} m²</span>`
    : `<span>${im.quartos} quartos</span>
       <span>${im.banheiros} banheiros</span>
       <span>${im.vagas} ${im.vagas === 1 ? 'vaga' : 'vagas'}</span>
       <span>${im.area} m²</span>`;
  document.getElementById('d-specs').innerHTML = specs;

  document.getElementById('d-desc').textContent = im.descricao;
  document.getElementById('d-anunciante-nome').textContent = im.anunciante;

  const wpp = `https://wa.me/55${im.telefone}?text=${encodeURIComponent(mensagemWpp(im))}`;
  document.getElementById('d-wpp').href = wpp;

  const temNav = galeriaFotos.length > 1;
  document.getElementById('galeria-prev').style.display = temNav ? '' : 'none';
  document.getElementById('galeria-next').style.display = temNav ? '' : 'none';

  const thumbsEl = document.getElementById('galeria-thumbs');
  if (temNav) {
    thumbsEl.style.display = '';
    thumbsEl.innerHTML = galeriaFotos.map((src, i) =>
      `<img src="${src}" alt="Foto ${i + 1}" class="${i === 0 ? 'ativa' : ''}"
            onclick="irFoto(${i})"
            onerror="this.src='https://placehold.co/144x104/e9edf5/1a56db?text=Foto'">`
    ).join('');
  } else {
    thumbsEl.style.display = 'none';
  }

  atualizarGaleria(0);

  document.getElementById('modal-detalhe').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharDetalhe() {
  document.getElementById('modal-detalhe').classList.remove('aberto');
  document.body.style.overflow = '';
}

function atualizarGaleria(idx) {
  galeriaIdx = (idx + galeriaFotos.length) % galeriaFotos.length;
  const img = document.getElementById('galeria-img');
  img.src = galeriaFotos[galeriaIdx];
  img.alt = `Foto ${galeriaIdx + 1}`;
  document.getElementById('galeria-contador').textContent = `${galeriaIdx + 1} / ${galeriaFotos.length}`;

  document.querySelectorAll('#galeria-thumbs img').forEach((el, i) => {
    el.classList.toggle('ativa', i === galeriaIdx);
  });
}

function irFoto(idx) { atualizarGaleria(idx); }

// ===== Modal Anunciar (multi-step) =====
let stepAtual = 1;
const TOTAL_STEPS = 4;
let fotosAnuncio = [];

function abrirModal() {
  stepAtual = 1;
  fotosAnuncio = [];
  document.getElementById('form-anuncio').reset();
  renderThumbs();
  irParaStep(1);
  document.getElementById('modal-anunciar').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modal-anunciar').classList.remove('aberto');
  document.body.style.overflow = '';
}

function irParaStep(n) {
  document.querySelectorAll('.form-step').forEach((el) => el.classList.remove('ativo'));
  document.getElementById(`step-${n}`).classList.add('ativo');

  document.querySelectorAll('.step-item').forEach((el) => {
    const s = parseInt(el.dataset.step);
    el.classList.toggle('ativo', s === n);
    el.classList.toggle('concluido', s < n);
  });
  document.querySelectorAll('.step-linha').forEach((el, i) => {
    el.classList.toggle('concluida', i < n - 1);
  });

  document.getElementById('btn-voltar').style.display = n === 1 ? 'none' : '';
  document.getElementById('btn-avancar').style.display = n === TOTAL_STEPS ? 'none' : '';
  document.getElementById('btn-enviar').style.display = n === TOTAL_STEPS ? '' : 'none';

  stepAtual = n;
  if (n === TOTAL_STEPS) gerarResumo();
}

function validarStepAtual() {
  if (stepAtual === 1) {
    if (!document.querySelector('input[name="a-operacao"]:checked')) {
      alert('Selecione a operação: Venda ou Aluguel.');
      return false;
    }
    if (!document.querySelector('input[name="a-tipo"]:checked')) {
      alert('Selecione o tipo de imóvel.');
      return false;
    }
  }
  if (stepAtual === 2) {
    if (!document.getElementById('a-titulo').value.trim()) {
      alert('Preencha o título do anúncio.');
      return false;
    }
    if (!document.getElementById('a-preco').value) {
      alert('Informe o preço do imóvel.');
      return false;
    }
  }
  if (stepAtual === 3) {
    if (!document.getElementById('a-cidade').value.trim()) {
      alert('Informe a cidade do imóvel.');
      return false;
    }
  }
  return true;
}

function gerarResumo() {
  const operacao = document.querySelector('input[name="a-operacao"]:checked')?.value || '-';
  const tipo = document.querySelector('input[name="a-tipo"]:checked')?.value || '-';
  const plano = document.querySelector('input[name="a-plano"]:checked')?.value || '-';
  const titulo = document.getElementById('a-titulo').value.trim() || '-';
  const preco = parseFloat(document.getElementById('a-preco').value);
  const cidade = document.getElementById('a-cidade').value.trim() || '-';
  const bairro = document.getElementById('a-bairro').value.trim();

  const precoFmt = preco
    ? fmtMoeda(preco) + (operacao === 'Aluguel' ? '/mês' : '')
    : '-';
  const local = bairro ? `${bairro}, ${cidade}` : cidade;

  document.getElementById('resumo-anuncio').innerHTML = `
    <h4>Resumo do anúncio</h4>
    <div class="resumo-linha"><span>Tipo</span><strong>${tipo} — ${operacao}</strong></div>
    <div class="resumo-linha"><span>Título</span><strong>${titulo}</strong></div>
    <div class="resumo-linha"><span>Preço</span><strong>${precoFmt}</strong></div>
    <div class="resumo-linha"><span>Localização</span><strong>${local}</strong></div>
    <div class="resumo-linha"><span>Fotos</span><strong>${fotosAnuncio.length} foto${fotosAnuncio.length !== 1 ? 's' : ''}</strong></div>
    <div class="resumo-linha"><span>Plano</span><strong>${plano}</strong></div>
  `;
}

function initUpload() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('a-fotos');

  uploadArea.addEventListener('click', (e) => {
    if (!e.target.closest('.foto-thumb')) fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    adicionarFotos(fileInput.files);
    fileInput.value = '';
  });
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });
  uploadArea.addEventListener('dragleave', (e) => {
    if (!uploadArea.contains(e.relatedTarget)) uploadArea.classList.remove('drag-over');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    adicionarFotos(e.dataTransfer.files);
  });
}

function adicionarFotos(files) {
  const MAX = 10;
  const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
  const restante = MAX - fotosAnuncio.length;
  if (restante <= 0) { alert('Limite de 10 fotos atingido.'); return; }

  arr.slice(0, restante).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      fotosAnuncio.push({ file, url: e.target.result });
      renderThumbs();
    };
    reader.readAsDataURL(file);
  });
}

function removerFoto(idx) {
  fotosAnuncio.splice(idx, 1);
  renderThumbs();
}

function renderThumbs() {
  const preview = document.getElementById('fotos-preview');
  const placeholder = document.getElementById('upload-placeholder');
  if (!preview) return;

  preview.innerHTML = fotosAnuncio.map((foto, i) => `
    <div class="foto-thumb">
      <img src="${foto.url}" alt="Foto ${i + 1}">
      <button type="button" class="foto-remover" onclick="removerFoto(${i})" aria-label="Remover">×</button>
      ${i === 0 ? '<span class="foto-capa">Capa</span>' : ''}
    </div>
  `).join('');

  if (placeholder) placeholder.style.display = fotosAnuncio.length === 0 ? '' : 'none';
}

function setCepStatus(tipo, msg) {
  const el = document.getElementById('cep-status');
  if (!el) return;
  el.textContent = msg;
  el.className = `cep-status${tipo ? ' ' + tipo : ''}`;
}

async function buscarCep(cep) {
  setCepStatus('loading', 'Consultando CEP...');
  const input = document.getElementById('a-cep');
  input.setAttribute('readonly', true);

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (data.erro) {
      setCepStatus('erro', 'CEP não encontrado.');
      return;
    }

    if (data.uf) document.getElementById('a-estado').value = data.uf;
    if (data.localidade) document.getElementById('a-cidade').value = data.localidade;
    if (data.bairro) document.getElementById('a-bairro').value = data.bairro;

    setCepStatus('sucesso', 'Endereço preenchido automaticamente.');

    const proximoCampo = !data.bairro
      ? document.getElementById('a-bairro')
      : document.getElementById('a-cidade');
    setTimeout(() => proximoCampo && proximoCampo.focus(), 50);
  } catch {
    setCepStatus('erro', 'Não foi possível consultar o CEP. Preencha manualmente.');
  } finally {
    input.removeAttribute('readonly');
  }
}

async function enviarAnuncio(e) {
  e.preventDefault();
  if (!document.getElementById('a-nome').value.trim()) { alert('Preencha seu nome.'); return; }
  if (!document.getElementById('a-tel').value.trim()) { alert('Preencha seu WhatsApp.'); return; }

  const plano  = document.querySelector('input[name="a-plano"]:checked')?.value || 'Básico';
  const btnEnv = document.getElementById('btn-enviar');
  const txtOri = btnEnv.textContent;
  btnEnv.disabled    = true;
  btnEnv.textContent = firebaseAtivo && fotosAnuncio.length > 0
    ? 'Enviando fotos...'
    : 'Publicando...';

  try {
    await publicarImovel();
    fecharModal();
    fotosAnuncio = [];

    if (plano !== 'Básico') {
      abrirCheckout(plano);
    } else {
      alert('Anúncio publicado! Seu imóvel já aparece na listagem.');
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao publicar. Verifique sua conexão e tente novamente.');
  } finally {
    btnEnv.disabled    = false;
    btnEnv.textContent = txtOri;
  }
}

// ===== Checkout =====
function abrirCheckout(plano) {
  const cfg = CONFIG.planos[plano];
  if (!cfg) return;

  document.getElementById('checkout-plano-nome').textContent = `Plano ${plano}`;
  document.getElementById('checkout-plano-preco').textContent =
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cfg.preco);
  document.getElementById('pix-chave').textContent = CONFIG.pixChave;
  document.getElementById('pix-valor').textContent =
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(cfg.preco);
  document.getElementById('pix-nome').textContent = CONFIG.pixNome;

  const msgWpp = encodeURIComponent(
    `Olá! Acabei de realizar o pagamento PIX do *Plano ${plano}* (R$ ${cfg.preco}/mês) no Doce Lar.\n\nSegue o comprovante:`
  );
  document.getElementById('btn-comprovante').href =
    `https://wa.me/55${CONFIG.whatsappSuporte}?text=${msgWpp}`;
  document.getElementById('btn-pagar-cartao').href = cfg.linkCartao;

  selecionarMetodo('pix');
  document.getElementById('modal-checkout').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharCheckout() {
  document.getElementById('modal-checkout').classList.remove('aberto');
  document.body.style.overflow = '';
}

function selecionarMetodo(metodo) {
  document.querySelectorAll('.metodo-btn').forEach((btn) => {
    btn.classList.toggle('ativo', btn.dataset.metodo === metodo);
  });
  document.getElementById('checkout-pix').style.display = metodo === 'pix' ? '' : 'none';
  document.getElementById('checkout-cartao').style.display = metodo === 'cartao' ? '' : 'none';
}

function copiarPix() {
  const chave = CONFIG.pixChave;
  const btn = document.getElementById('btn-copiar-pix');
  const aplicar = (ok) => {
    btn.textContent = ok ? 'Copiado!' : 'Erro';
    btn.style.background = ok ? 'var(--verde)' : '#dc2626';
    setTimeout(() => { btn.textContent = 'Copiar'; btn.style.background = ''; }, 2200);
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(chave).then(() => aplicar(true)).catch(() => aplicar(false));
  } else {
    const el = document.createElement('textarea');
    el.value = chave;
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); aplicar(true); } catch { aplicar(false); }
    document.body.removeChild(el);
  }
}

// ===== Painel Minha Área =====
let tabPainel = 'anuncios';

function abrirMeusAnuncios(tab) {
  tabPainel = tab || 'anuncios';
  renderPainel();
  document.getElementById('modal-meus-anuncios').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}
function fecharMeusAnuncios() {
  document.getElementById('modal-meus-anuncios').classList.remove('aberto');
  document.body.style.overflow = '';
}
function trocarTab(tab) {
  tabPainel = tab;
  renderPainel();
}
function renderPainel() {
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.classList.toggle('ativo', btn.dataset.tab === tabPainel));

  const favs = getFavoritos();
  const meusIds = getMeusAnunciosIds();
  const lista = tabPainel === 'anuncios'
    ? imoveis.filter(im => meusIds.includes(String(im.id)))
    : imoveis.filter(im => favs.includes(String(im.id)));

  const corpo = document.getElementById('meus-corpo');
  if (lista.length === 0) {
    const msg = tabPainel === 'anuncios'
      ? 'Você ainda não publicou nenhum anúncio neste dispositivo.'
      : 'Você não salvou nenhum imóvel nos favoritos ainda.';
    const btnAnunciar = tabPainel === 'anuncios'
      ? `<button class="btn btn-dourado" onclick="fecharMeusAnuncios(); abrirModal()">+ Anunciar imóvel</button>`
      : '';
    corpo.innerHTML = `<div class="painel-vazio">
      <svg class="painel-vazio-icone" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        ${tabPainel === 'anuncios'
          ? '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'
          : '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'}
      </svg>
      <p>${msg}</p>${btnAnunciar}
    </div>`;
    return;
  }
  corpo.innerHTML = `<div class="painel-grid">${lista.map(cardHTML).join('')}</div>`;
}

// ===== Inicialização =====
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  popularFiltros();
  renderTudo();
  iniciarListenerFirebase();

  ['f-cidade', 'f-tipo', 'f-operacao', 'f-preco'].forEach((id) => {
    document.getElementById(id).addEventListener('input', renderTudo);
  });

  // Modal anunciar
  document.querySelectorAll('[data-anunciar]').forEach((btn) =>
    btn.addEventListener('click', abrirModal));
  document.getElementById('fechar-modal').addEventListener('click', fecharModal);
  document.getElementById('modal-anunciar').addEventListener('click', (e) => {
    if (e.target.id === 'modal-anunciar') fecharModal();
  });
  document.getElementById('form-anuncio').addEventListener('submit', enviarAnuncio);
  document.getElementById('btn-avancar').addEventListener('click', () => {
    if (validarStepAtual()) irParaStep(stepAtual + 1);
  });
  document.getElementById('btn-voltar').addEventListener('click', () => {
    irParaStep(stepAtual - 1);
  });

  initUpload();

  // Checkout
  document.getElementById('fechar-checkout').addEventListener('click', fecharCheckout);
  document.getElementById('modal-checkout').addEventListener('click', (e) => {
    if (e.target.id === 'modal-checkout') fecharCheckout();
  });
  document.querySelectorAll('.metodo-btn').forEach((btn) => {
    btn.addEventListener('click', () => selecionarMetodo(btn.dataset.metodo));
  });

  document.getElementById('a-cep').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8);
    e.target.value = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
    if (v.length === 8) buscarCep(v);
    if (v.length < 8) setCepStatus('', '');
  });
  document.getElementById('a-tel').addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    e.target.value = v;
  });

  // Modal Minha Área
  atualizarContadorFav();
  document.querySelectorAll('[data-meus-anuncios]').forEach(el =>
    el.addEventListener('click', () => abrirMeusAnuncios()));
  document.getElementById('fechar-meus-anuncios').addEventListener('click', fecharMeusAnuncios);
  document.getElementById('modal-meus-anuncios').addEventListener('click', (e) => {
    if (e.target.id === 'modal-meus-anuncios') fecharMeusAnuncios();
  });

  // Modal detalhe
  document.getElementById('fechar-detalhe').addEventListener('click', fecharDetalhe);
  document.getElementById('modal-detalhe').addEventListener('click', (e) => {
    if (e.target.id === 'modal-detalhe') fecharDetalhe();
  });
  document.getElementById('galeria-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    atualizarGaleria(galeriaIdx - 1);
  });
  document.getElementById('galeria-next').addEventListener('click', (e) => {
    e.stopPropagation();
    atualizarGaleria(galeriaIdx + 1);
  });

  // Navegação por teclado no modal de detalhe
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('modal-detalhe').classList.contains('aberto')) return;
    if (e.key === 'ArrowLeft') atualizarGaleria(galeriaIdx - 1);
    if (e.key === 'ArrowRight') atualizarGaleria(galeriaIdx + 1);
    if (e.key === 'Escape') fecharDetalhe();
  });
});
