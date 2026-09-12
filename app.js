/**
 * Universo Suprimentos Corporativos - Vitrine Digital B2B
 * Sistema de Cotação Dinâmica com Opções (Variações e Observações por Produto)
 */

(function () {
  'use strict';

  const WHATSAPP_PHONE = '5554999500444'; // (54) 9 9950-0444
  const CART_STORAGE_KEY = 'universo_b2b_quote_cart_v2';
  const LAST_QUOTE_STORAGE_KEY = 'universo_b2b_last_quote_v1';

  // Estado da Aplicação
  let allProducts = [];
  let filteredProducts = [];
  let cart = [];
  let activeCategory = 'todos';
  let searchTerm = '';

  // Estado do Modal de Opções
  let currentProductForOptions = null;
  let modalSelectedOptions = {};
  let modalQuantity = 1;

  // Elementos DOM
  const productsGrid = document.getElementById('products-grid');
  const productsCountEl = document.getElementById('products-count');
  const categoryTitleEl = document.getElementById('category-title');
  const searchInput = document.getElementById('search-input');
  const categoryBtns = document.querySelectorAll('.category-tab-btn');

  // Elementos do Carrinho Drawer
  const cartTriggerBtn = document.getElementById('btn-cart-trigger');
  const cartBadgeEl = document.getElementById('cart-badge');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const cartItemsList = document.getElementById('cart-items-list');
  const emptyCartState = document.getElementById('empty-cart-state');
  const cartFooter = document.getElementById('cart-footer');
  const btnCheckoutWhatsapp = document.getElementById('btn-checkout-whatsapp');

  // Elementos do Modal de Opções
  const modalOverlay = document.getElementById('modal-overlay');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const modalProductThumb = document.getElementById('modal-product-thumb');
  const modalProductBadge = document.getElementById('modal-product-badge');
  const modalProductPackage = document.getElementById('modal-product-package');
  const modalProductTitle = document.getElementById('modal-product-title');
  const modalProductDesc = document.getElementById('modal-product-desc');
  const modalOptionsContainer = document.getElementById('modal-options-container');
  const modalObsText = document.getElementById('modal-obs-text');
  const modalQtyVal = document.getElementById('modal-qty-val');
  const btnModalMinus = document.getElementById('btn-modal-minus');
  const btnModalPlus = document.getElementById('btn-modal-plus');
  const btnConfirmAdd = document.getElementById('btn-confirm-add');

  // Quick List & Novos Modais
  const quickListText = document.getElementById('quick-list-text');
  const btnSendQuickList = document.getElementById('btn-send-quick-list');
  const btnHeaderUpload = document.getElementById('btn-header-upload');
  const btnClearCartGlobal = document.getElementById('btn-clear-cart-global');
  const btnClearCartDrawer = document.getElementById('btn-clear-cart-drawer');
  const btnDirectWhatsappQuote = document.getElementById('btn-direct-whatsapp-quote');

  // Modal Limpar Pedido
  const modalClearCart = document.getElementById('modal-clear-cart');
  const btnCloseClearModal = document.getElementById('btn-close-clear-modal');
  const btnCancelClearCart = document.getElementById('btn-cancel-clear-cart');
  const btnConfirmClearCart = document.getElementById('btn-confirm-clear-cart');

  // Modal Cotar Lista Pronta
  const modalQuickQuote = document.getElementById('modal-quick-quote');
  const btnCloseQuickModal = document.getElementById('btn-close-quick-modal');
  const btnCancelQuickModal = document.getElementById('btn-cancel-quick-modal');
  const btnModalSendQuick = document.getElementById('btn-modal-send-quick');
  const modalQuickQuoteText = document.getElementById('modal-quick-quote-text');

  // Inicialização
  async function init() {
    loadCartFromStorage();
    checkRepeatQuoteButton();
    setupEventListeners();
    await loadProducts();
    updateCartUI();
  }

  // Carregar produtos
  async function loadProducts() {
    try {
      const response = await fetch('products.json');
      if (!response.ok) throw new Error('Falha ao carregar catálogo');
      allProducts = await response.json();
      filteredProducts = [...allProducts];
      renderProducts();
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #6C757D;">
          <p>Ocorreu um erro ao carregar os itens do catálogo. Por favor, recarregue a página.</p>
        </div>
      `;
    }
  }

  const CATEGORIES = [
    { 
      id: 'escritorio', 
      name: 'Escritório & Papelaria', 
      icon: '📄', 
      subtitle: 'Papéis A4 Suzano/Chamex, pastas, canetas, toners e arquivos',
      image: 'assets/images/bg_cat_escritorio.jpg',
      highlight: 'Caixas Fechadas 5.000 fls'
    },
    { 
      id: 'higiene', 
      name: 'Higiene & Limpeza', 
      icon: '🧼', 
      subtitle: 'Papel toalha interfolha, sabonete 5L, álcool 70%, desinfetantes e químicos',
      image: 'assets/images/bg_cat_higiene.jpg',
      highlight: 'Uso Profissional & Fardos'
    },
    { 
      id: 'descartaveis', 
      name: 'Descartáveis & Embalagens', 
      icon: '🥤', 
      subtitle: 'Copos 180ml/50ml, bobinas plásticas, sacos de lixo e filmes',
      image: 'assets/images/bg_cat_descartaveis.jpg',
      highlight: 'Tiradores de Copos & Bobinas'
    },
    { 
      id: 'copa', 
      name: 'Copa & Cozinha', 
      icon: '☕', 
      subtitle: 'Café Bom Jesus, Melitta, açúcar cristal/sachê, chás e mexedores',
      image: 'assets/images/bg_cat_copa.jpg',
      highlight: 'Fardos p/ Empresas & Refeitórios'
    },
    { 
      id: 'epis', 
      name: 'Segurança & EPIs', 
      icon: '🦺', 
      subtitle: 'Luvas látex/nitrílicas, máscaras cirúrgicas, toucas e proteção individual',
      image: 'assets/images/bg_cat_epis.jpg',
      highlight: 'Norma NR & Certificação'
    },
    { 
      id: 'hospitalar', 
      name: 'Linha Hospitalar', 
      icon: '🏥', 
      subtitle: 'Aventais descartáveis, lençóis de papel, caixas Descarpack e biossegurança',
      image: 'assets/images/bg_cat_hospitalar.jpg',
      highlight: 'Clínicas & Laboratórios'
    },
    { 
      id: 'informatica', 
      name: 'Informática & Conectividade', 
      icon: '💻', 
      subtitle: 'Pilhas alcalinas, toners para impressora, mouses, teclados e cabos',
      image: 'assets/images/bg_cat_informatica.jpg',
      highlight: 'Periféricos & Suprimentos TI'
    }
  ];

  function renderProductCard(product) {
    const inCartCount = cart.filter(item => item.productId === product.id).reduce((sum, i) => sum + i.quantity, 0);
    return `
      <article class="product-card" data-id="${product.id}" onclick="window.universoApp.openProductModal('${product.id}')">
        <div class="product-thumb-box">
          ${product.badge ? `<span class="product-badge-tag">${product.badge}</span>` : ''}
          <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='assets/images/produtos/folhas_report_a4.jpg'">
        </div>
        <div class="product-content">
          <span class="product-category-label">${getCategoryName(product.category)}</span>
          <h3 class="product-title" title="${product.name}">${product.name}</h3>
          <p class="product-desc">${product.description}</p>
          <div class="product-package-tag">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span>${product.package}</span>
          </div>
          <div class="product-footer">
            <button type="button" class="btn-open-options full-width ${inCartCount > 0 ? 'added' : ''}" onclick="event.stopPropagation(); window.universoApp.openProductModal('${product.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                ${inCartCount > 0 
                  ? '<polyline points="20 6 9 17 4 12"></polyline>' 
                  : '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'}
              </svg>
              <span>${inCartCount > 0 ? `Na Lista de Cotação (${inCartCount})` : '+ Adicionar à Cotação'}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  // Renderizar catálogo
  function renderProducts() {
    if (!allProducts.length) return;

    // Cenário 1: Busca ativa por texto
    if (searchTerm) {
      if (!filteredProducts.length) {
        productsGrid.className = 'products-grid';
        productsGrid.innerHTML = `
          <div class="search-empty-state">
            <div class="search-empty-icon">🔍</div>
            <h3>Nenhum produto encontrado para "${searchTerm}"</h3>
            <p>Verifique os termos digitados ou mande sua lista personalizada de compras para o consultor.</p>
            <button type="button" class="btn-reset-search" onclick="window.universoApp.clearSearch()">Limpar Busca</button>
          </div>
        `;
        productsCountEl.textContent = '0 itens';
        return;
      }

      productsCountEl.textContent = `${filteredProducts.length} produtos`;
      productsGrid.className = 'products-grid search-results-grid';
      productsGrid.innerHTML = `
        <div class="search-results-header">
          <div>
            <h4>Resultados da busca para: <strong>"${searchTerm}"</strong></h4>
            <span class="search-results-sub">${filteredProducts.length} itens encontrados no catálogo</span>
          </div>
          <button type="button" class="btn-clear-search-pill" onclick="window.universoApp.clearSearch()">✕ Limpar Busca</button>
        </div>
        ${filteredProducts.map(renderProductCard).join('')}
      `;
      return;
    }

    // Cenário 2: Categoria isolada (quando o usuário clica em Conhecer Categoria ou seleciona no filtro)
    if (activeCategory !== 'todos') {
      const catObj = CATEGORIES.find(c => c.id === activeCategory);
      productsCountEl.textContent = `${filteredProducts.length} produtos`;
      productsGrid.className = 'products-grid category-focus-grid';
      productsGrid.innerHTML = `
        <div class="category-focus-header category-hero-banner" style="--cat-bg: url('${catObj ? catObj.image : 'assets/images/produtos/folhas_report_a4.jpg'}')">
          <div class="cat-focus-overlay"></div>
          <div class="cat-focus-info">
            <div class="cat-hero-text">
              <div class="cat-hero-tag-row">
                <span class="cat-badge-label">DEPARTAMENTO CORPORATIVO</span>
                <span class="rail-count-badge">${filteredProducts.length} itens em grade</span>
              </div>
              <h3 class="cat-hero-title">${catObj ? catObj.name : 'Departamento'}</h3>
              <p class="cat-hero-sub">${catObj ? catObj.subtitle : ''}</p>
            </div>
          </div>
          <button type="button" class="btn-back-streaming" onclick="window.universoApp.setCategory('todos')">
            ← Ver Todos os Departamentos
          </button>
        </div>
        ${filteredProducts.map(renderProductCard).join('')}
      `;
      return;
    }

    // Cenário 3: MODO STREAMING (Trilhos Horizontais de Categorias - Estilo Netflix B2B)
    productsCountEl.textContent = `${allProducts.length} produtos`;
    productsGrid.className = 'streaming-rails-container';

    let railsHtml = '';
    CATEGORIES.forEach(cat => {
      const catProducts = allProducts.filter(p => p.category === cat.id);
      if (!catProducts.length) return;

      railsHtml += `
        <section class="streaming-rail-section" id="rail-${cat.id}">
          <div class="streaming-rail-header category-mini-hero clickable-rail-header" style="--cat-bg: url('${cat.image}')" onclick="window.universoApp.setCategory('${cat.id}')" title="Clique para explorar todos os itens de ${cat.name} em grade">
            <div class="cat-mini-hero-overlay"></div>
            <div class="rail-title-box">
              <div class="cat-mini-hero-meta">
                <div class="cat-tag-badge-line">
                  <span class="cat-badge-label">CATEGORIA</span>
                  <span class="rail-count-badge">${catProducts.length} itens</span>
                </div>
                <h3 class="rail-title">${cat.name}</h3>
                <span class="rail-subtitle-desktop">${cat.subtitle}</span>
              </div>
            </div>
            <div class="rail-see-all-btn minimal-arrow-btn">
              <span class="btn-label-desktop">Explorar</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>

          <div class="streaming-rail-wrapper">
            <button type="button" class="rail-nav-btn rail-nav-prev" onclick="window.universoApp.scrollRail('track-${cat.id}', -1)" aria-label="Anterior">‹</button>
            <div class="streaming-rail-track" id="track-${cat.id}">
              ${catProducts.map(renderProductCard).join('')}
            </div>
            <button type="button" class="rail-nav-btn rail-nav-next" onclick="window.universoApp.scrollRail('track-${cat.id}', 1)" aria-label="Próximo">›</button>
          </div>
        </section>
      `;
    });

    productsGrid.innerHTML = railsHtml;
  }

  function scrollRail(trackId, direction) {
    const track = document.getElementById(trackId);
    if (!track) return;
    const scrollAmount = track.clientWidth * 0.75 * direction;
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }

  function clearSearch() {
    if (searchInput) searchInput.value = '';
    searchTerm = '';
    applyFilters();
  }

  function getCategoryName(cat) {
    const names = {
      'escritorio': 'Escritório & Papelaria',
      'higiene': 'Higiene & Limpeza',
      'descartaveis': 'Descartáveis & Embalagens',
      'copa': 'Copa & Cozinha',
      'epis': 'Segurança & EPIs',
      'hospitalar': 'Linha Hospitalar',
      'informatica': 'Informática & Acessórios'
    };
    return names[cat] || 'Geral';
  }

  function applyFilters() {
    filteredProducts = allProducts.filter(p => {
      const matchCat = activeCategory === 'todos' || p.category === activeCategory;
      const matchSearch = !searchTerm || 
        p.name.toLowerCase().includes(searchTerm) || 
        p.description.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm);
      return matchCat && matchSearch;
    });
    renderProducts();
  }

  function setCategory(cat, btn) {
    activeCategory = cat;
    categoryBtns.forEach(b => {
      if (b.dataset.category === cat) b.classList.add('active');
      else b.classList.remove('active');
    });

    const catLabels = {
      'todos': 'Todos os Materiais & Suprimentos',
      'escritorio': 'Escritório & Papelaria Corporativa',
      'higiene': 'Higiene & Limpeza Profissional',
      'descartaveis': 'Descartáveis & Embalagens Industriais',
      'copa': 'Copa & Cozinha Empresarial',
      'epis': 'Equipamentos de Proteção Individual (EPIs)',
      'hospitalar': 'Linha Hospitalar & Clínicas',
      'informatica': 'Informática & Periféricos de Escritório'
    };
    categoryTitleEl.textContent = catLabels[cat] || 'Catálogo de Produtos';
    applyFilters();

    if (!btn && cat !== 'todos') {
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ==========================================================================
  // MODAL DE OPÇÕES DO PRODUTO (Estilo Gastro / Onira.fly)
  // ==========================================================================
  function openProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    currentProductForOptions = product;
    modalQuantity = 1;
    modalSelectedOptions = {};

    modalProductThumb.src = product.image;
    modalProductThumb.onerror = () => { modalProductThumb.src = 'assets/images/produtos/folhas_report_a4.jpg'; };
    modalProductTitle.textContent = product.name;
    modalProductDesc.textContent = product.description;
    if (modalProductPackage) {
      modalProductPackage.textContent = product.package || 'Faturamento Corporativo PJ';
    }
    if (modalProductBadge) {
      if (product.badge) {
        modalProductBadge.textContent = product.badge;
        modalProductBadge.style.display = 'inline-block';
      } else {
        modalProductBadge.style.display = 'none';
      }
    }
    modalObsText.value = '';
    modalQtyVal.textContent = '1';

    // Construir opções dinamicamente
    if (product.options && product.options.length > 0) {
      modalOptionsContainer.innerHTML = product.options.map((group, gIdx) => {
        // Selecionar o primeiro item por padrão se for obrigatório
        modalSelectedOptions[group.name] = group.choices[0];

        const choicesHtml = group.choices.map((choice, cIdx) => `
          <label class="option-choice-label">
            <span class="choice-text">
              <input type="radio" name="opt_group_${gIdx}" value="${choice}" ${cIdx === 0 ? 'checked' : ''} onchange="window.universoApp.setOption('${group.name}', '${choice}')">
              ${choice}
            </span>
          </label>
        `).join('');

        return `
          <div class="option-group">
            <div class="option-group-title">
              <span>${group.name}</span>
              ${group.required ? '<span class="option-group-badge">Obrigatório</span>' : '<span class="option-group-badge">Opcional</span>'}
            </div>
            <div class="option-choices-list">
              ${choicesHtml}
            </div>
          </div>
        `;
      }).join('');
    } else {
      modalOptionsContainer.innerHTML = `
        <div style="padding: 0.5rem 0; color: #5C6370; font-size: 0.85rem;">
          Item pronto para adicionar em caixas fechadas ou volumes corporativos.
        </div>
      `;
    }

    modalOverlay.classList.add('open');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    modalOverlay.classList.remove('open');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    currentProductForOptions = null;
  }

  function setOption(groupName, choice) {
    modalSelectedOptions[groupName] = choice;
  }

  function changeModalQty(delta) {
    modalQuantity = Math.max(1, modalQuantity + delta);
    modalQtyVal.textContent = modalQuantity;
  }

  // Confirmar e Adicionar à Lista de Cotação
  function confirmAddOptions() {
    if (!currentProductForOptions) return;

    const obs = modalObsText.value.trim();
    const optionsArray = Object.entries(modalSelectedOptions).map(([key, val]) => `${key}: ${val}`);

    // Gerar identificador limpo e seguro (sem quebra por caracteres especiais em atributos HTML)
    const optionsKey = Object.entries(modalSelectedOptions).map(([k, v]) => `${k}-${v}`).join('_').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanObsKey = obs.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
    const cartItemId = `${currentProductForOptions.id}_${optionsKey || 'std'}_${cleanObsKey || 'none'}`;

    const existingIndex = cart.findIndex(item => item.cartItemId === cartItemId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += modalQuantity;
    } else {
      cart.push({
        cartItemId,
        productId: currentProductForOptions.id,
        name: currentProductForOptions.name,
        package: currentProductForOptions.package,
        image: currentProductForOptions.image,
        quantity: modalQuantity,
        options: optionsArray,
        obs: obs
      });
    }

    saveCartToStorage();
    updateCartUI();
    renderProducts();
    closeProductModal();

    // Abrir o carrinho para dar feedback imediato de sucesso
    openCartDrawer();
  }

  // ==========================================================================
  // CARRINHO DRAWER (SEM ROLAGEM INDESEJADA NOS ITENS)
  // ==========================================================================
  function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadgeEl.textContent = totalCount;

    // Atualizar visibilidade dos botões de limpar pedido (fora e dentro do carrinho)
    if (btnClearCartGlobal) {
      btnClearCartGlobal.style.display = cart.length > 0 ? 'inline-flex' : 'none';
    }
    if (btnClearCartDrawer) {
      btnClearCartDrawer.style.display = cart.length > 0 ? 'inline-flex' : 'none';
    }

    if (cart.length === 0) {
      cartTriggerBtn.classList.remove('has-items');
      emptyCartState.style.display = 'block';
      cartItemsList.innerHTML = '';
      cartFooter.style.display = 'none';
      return;
    }

    cartTriggerBtn.classList.add('has-items');
    emptyCartState.style.display = 'none';
    cartFooter.style.display = 'block';

    const html = cart.map((item, index) => `
      <div class="cart-item-row" data-cart-id="${item.cartItemId}" data-cart-index="${index}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          ${item.options && item.options.length ? `
            <div class="cart-item-options-summary">
              ${item.options.map(opt => `• ${opt}`).join('<br>')}
            </div>
          ` : `
            <div class="cart-item-options-summary">• ${item.package}</div>
          `}
          ${item.obs ? `<div class="cart-item-obs">Obs: "${item.obs}"</div>` : ''}
          <div class="cart-item-bottom-row">
            <div class="cart-qty-control">
              <button type="button" class="btn-qty" onclick="event.stopPropagation(); window.universoApp.changeCartItemQtyByIndex(${index}, -1)">-</button>
              <span class="qty-display">${item.quantity}</span>
              <button type="button" class="btn-qty" onclick="event.stopPropagation(); window.universoApp.changeCartItemQtyByIndex(${index}, 1)">+</button>
            </div>
            <button type="button" class="btn-remove-item" onclick="event.stopPropagation(); window.universoApp.removeCartItemByIndex(${index})" title="Remover item da cotação">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    cartItemsList.innerHTML = html;
  }

  function changeCartItemQtyByIndex(index, delta) {
    if (index < 0 || index >= cart.length) return;
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCartToStorage();
    updateCartUI();
    renderProducts();
  }

  function changeCartItemQty(cartItemId, delta) {
    const item = cart.find(i => String(i.cartItemId) === String(cartItemId));
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => String(i.cartItemId) !== String(cartItemId));
    }

    saveCartToStorage();
    updateCartUI();
    renderProducts();
  }

  function removeCartItemByIndex(index) {
    if (index >= 0 && index < cart.length) {
      cart.splice(index, 1);
      saveCartToStorage();
      updateCartUI();
      renderProducts();
    }
  }

  function removeCartItem(cartItemId) {
    const initialLen = cart.length;
    cart = cart.filter(i => String(i.cartItemId) !== String(cartItemId));
    
    // Se não encontrou pelo ID exato, remove o primeiro item como resguardo
    if (cart.length === initialLen && initialLen > 0) {
      cart.splice(0, 1);
    }

    saveCartToStorage();
    updateCartUI();
    renderProducts();
  }

  // MODAL LIMPAR PEDIDO
  function openClearCartModal() {
    if (cart.length === 0) return;
    if (modalClearCart) {
      modalClearCart.classList.add('open');
    }
  }

  function closeClearCartModal() {
    if (modalClearCart) {
      modalClearCart.classList.remove('open');
    }
  }

  function confirmClearCartAction() {
    cart = [];
    saveCartToStorage();
    updateCartUI();
    renderProducts();
    closeClearCartModal();
    closeCartDrawer();
  }

  function clearCart() {
    if (cart.length === 0) return;
    openClearCartModal();
  }

  // MODAL COTAR MINHA LISTA PRONTA (COLA DO CLIENTE)
  function openQuickQuoteModal() {
    if (modalQuickQuote) {
      modalQuickQuote.classList.add('open');
      setTimeout(() => {
        if (modalQuickQuoteText) modalQuickQuoteText.focus();
      }, 150);
    }
  }

  function closeQuickQuoteModal() {
    if (modalQuickQuote) {
      modalQuickQuote.classList.remove('open');
    }
  }

  function sendModalQuickQuote() {
    if (!modalQuickQuoteText) return;
    const text = modalQuickQuoteText.value.trim();
    if (!text) {
      alert('Por favor, cole ou digite sua lista de compras antes de enviar.');
      modalQuickQuoteText.focus();
      return;
    }

    let message = `📋 *SOLICITAÇÃO DE COTAÇÃO VIA LISTA PRONTA — UNIVERSO SUPRIMENTOS*\n`;
    message += `────────────────────────────\n\n`;
    message += `Olá! Segue a relação de materiais corporativos que precisamos orçar:\n\n`;
    message += `"${text}"\n\n`;
    message += `────────────────────────────\n`;
    message += `🏢 *Condição Desejada:* Faturamento PJ / Boleto a Prazo\n`;
    message += `Favor nos responder com os valores disponíveis e previsão de entrega!`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
    closeQuickQuoteModal();
  }

  // Cotação Direta do Modal para o WhatsApp
  function quoteDirectOnWhatsApp() {
    if (!currentProductForOptions) return;

    const obs = modalObsText.value.trim();
    const optionsArray = Object.entries(modalSelectedOptions).map(([key, val]) => `${key}: ${val}`);

    let msg = `*COTAÇÃO DIRETA VIA CATÁLOGO • UNIVERSO SUPRIMENTOS*\n`;
    msg += `────────────────────────────\n\n`;
    msg += `Olá! Gostaria de cotar este item com entrega para empresa:\n\n`;
    msg += `📦 *Produto:* ${currentProductForOptions.name}\n`;
    msg += `▫️ *Qtd Solicitada:* ${modalQuantity} ${currentProductForOptions.package ? `(${currentProductForOptions.package})` : ''}\n`;
    if (optionsArray.length) {
      optionsArray.forEach(opt => {
        msg += `▫️ ${opt}\n`;
      });
    }
    if (obs) {
      msg += `▫️ _Obs: ${obs}_\n`;
    }
    msg += `\n🏢 *Condição Desejada:* Faturamento PJ / Boleto a Prazo\n`;
    msg += `Favor me informar disponibilidade e melhor condição comercial!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encoded}`, '_blank');
    closeProductModal();
  }

  function openCartDrawer() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.classList.add('cart-open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.classList.remove('cart-open');
    document.body.style.overflow = '';
  }

  // Finalizar cotação corporativa via WhatsApp
  function checkoutWhatsapp() {
    if (cart.length === 0) {
      alert('Sua lista de cotação está vazia. Adicione produtos antes de enviar!');
      return;
    }

    const companyName = document.getElementById('input-company').value.trim();
    const contactPerson = document.getElementById('input-name').value.trim();
    const city = document.getElementById('input-city').value.trim() || 'Caxias do Sul / Serra Gaúcha';
    const paymentPref = document.getElementById('selected-payment-val') ? document.getElementById('selected-payment-val').value : 'Boleto Faturado a Prazo (PJ)';

    // Mensagem Limpa, Direta e Elegante (Padrão Executivo B2B Onira)
    let message = `*SOLICITAÇÃO DE COTAÇÃO B2B • UNIVERSO SUPRIMENTOS*\n`;
    message += `────────────────────────────\n\n`;

    // Dados do Solicitante
    message += `🏢 *DADOS DA EMPRESA*\n`;
    if (companyName) message += `• *Empresa:* ${companyName}\n`;
    if (contactPerson) message += `• *Contato:* ${contactPerson}\n`;
    message += `• *Entrega:* ${city}\n`;
    message += `• *Condição:* ${paymentPref}\n\n`;

    // Lista de Itens Formatada
    message += `📦 *ITENS SELECIONADOS (${cart.reduce((s, i) => s + i.quantity, 0)} unids)*\n`;
    cart.forEach((item, index) => {
      message += `\n*${index + 1}. ${item.name}*\n`;
      message += `   ▫️ *Qtd:* ${item.quantity} ${item.package ? `(${item.package})` : ''}\n`;
      
      if (item.options && item.options.length) {
        item.options.forEach(opt => {
          message += `   ▫️ ${opt}\n`;
        });
      }
      if (item.obs) {
        message += `   ▫️ _Obs: ${item.obs}_\n`;
      }
    });

    message += `\n────────────────────────────\n`;
    message += `💬 *A/C Equipe Comercial Universo:*\n`;
    // Salvar como última cotação realizada para recompra inteligente
    try {
      localStorage.setItem(LAST_QUOTE_STORAGE_KEY, JSON.stringify({
        date: new Date().toLocaleDateString('pt-BR'),
        items: cart,
        companyName,
        contactPerson,
        city,
        paymentPref
      }));
      checkRepeatQuoteButton();
    } catch (err) {
      console.warn('Erro ao salvar última cotação:', err);
    }

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
  }

  // Feature: Repetir Última Cotação
  function checkRepeatQuoteButton() {
    const btn = document.getElementById('btn-repeat-quote');
    const drawerBtn = document.getElementById('btn-drawer-repeat-quote');
    const label = document.getElementById('repeat-quote-label');

    try {
      const saved = localStorage.getItem(LAST_QUOTE_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && data.items && data.items.length > 0) {
          const totalQty = data.items.reduce((s, i) => s + i.quantity, 0);
          if (btn) {
            btn.style.display = 'inline-flex';
            if (label) label.textContent = `Repetir Última Cotação (${totalQty} itens)`;
          }
          if (drawerBtn) {
            drawerBtn.style.display = 'inline-flex';
          }
          return;
        }
      }
    } catch (e) {}
    if (btn) btn.style.display = 'none';
    if (drawerBtn) drawerBtn.style.display = 'none';
  }

  function repeatLastQuote() {
    try {
      const saved = localStorage.getItem(LAST_QUOTE_STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data || !data.items || !data.items.length) return;

      cart = JSON.parse(JSON.stringify(data.items));
      saveCartToStorage();
      updateCartUI();
      renderProducts();
      openCartDrawer();

      // Preencher campos da empresa se existirem
      if (data.companyName) {
        const el = document.getElementById('input-company');
        if (el) el.value = data.companyName;
      }
      if (data.contactPerson) {
        const el = document.getElementById('input-name');
        if (el) el.value = data.contactPerson;
      }
      if (data.city) {
        const el = document.getElementById('input-city');
        if (el) el.value = data.city;
      }
    } catch (e) {
      console.warn('Erro ao restaurar última cotação:', e);
    }
  }

  // Envio de Lista Pronta
  function sendQuickList() {
    const text = quickListText.value.trim();
    if (!text) {
      alert('Por favor, digite ou cole a sua lista no campo indicado.');
      quickListText.focus();
      return;
    }

    let message = `📋 *SOLICITAÇÃO DE COTAÇÃO VIA LISTA PRONTA — UNIVERSO*\n\n`;
    message += `Olá! Segue a relação de materiais corporativos que precisamos cotar:\n\n`;
    message += `"${text}"\n\n`;
    message += `Por favor, nos enviem os valores com faturamento PJ e prazo de entrega.`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
  }

  function saveCartToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Erro salvando carrinho:', e);
    }
  }

  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) cart = JSON.parse(saved);
    } catch (e) {
      cart = [];
    }
  }

  // ==========================================================================
  // CARROSSEL DE OFERTAS DA HERO
  // ==========================================================================
  let currentOfferSlide = 0;
  const totalOfferSlides = 3;
  let offerAutoplayTimer = null;

  function updateOfferCarouselUI() {
    const track = document.getElementById('offers-track');
    const dotsContainer = document.getElementById('offers-dots');
    if (!track) return;

    track.style.transform = `translateX(-${currentOfferSlide * 100}%)`;

    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.carousel-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentOfferSlide);
      });
    }
  }

  function nextOfferSlide() {
    currentOfferSlide = (currentOfferSlide + 1) % totalOfferSlides;
    updateOfferCarouselUI();
  }

  function prevOfferSlide() {
    currentOfferSlide = (currentOfferSlide - 1 + totalOfferSlides) % totalOfferSlides;
    updateOfferCarouselUI();
  }

  function goToOfferSlide(index) {
    if (index >= 0 && index < totalOfferSlides) {
      currentOfferSlide = index;
      updateOfferCarouselUI();
      resetOfferAutoplay();
    }
  }

  function startOfferAutoplay() {
    if (offerAutoplayTimer) clearInterval(offerAutoplayTimer);
    offerAutoplayTimer = setInterval(() => {
      nextOfferSlide();
    }, 5500);
  }

  function resetOfferAutoplay() {
    startOfferAutoplay();
  }

  function setupOfferCarousel() {
    const carouselContainer = document.getElementById('hero-offers-carousel');
    if (!carouselContainer) return;

    carouselContainer.addEventListener('mouseenter', () => {
      if (offerAutoplayTimer) clearInterval(offerAutoplayTimer);
    });

    carouselContainer.addEventListener('mouseleave', () => {
      startOfferAutoplay();
    });

    // Suporte a gestos touch swipe no Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carouselContainer.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchStartX = e.changedTouches[0].screenX;
      }
      if (offerAutoplayTimer) clearInterval(offerAutoplayTimer);
    }, { passive: true });

    carouselContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }
      startOfferAutoplay();
    }, { passive: true });

    function handleSwipe() {
      const swipeThreshold = 40;
      if (touchEndX < touchStartX - swipeThreshold) {
        nextOfferSlide();
      } else if (touchEndX > touchStartX + swipeThreshold) {
        prevOfferSlide();
      }
    }

    startOfferAutoplay();
  }

  // Adicionar oferta direta da Hero ao carrinho
  function addDirectOffer(productId, packageOption, detailOption, qty, price) {
    const product = allProducts.find(p => p.id === productId);
    const productName = product ? product.name : 'Item Oferta Especial';
    const productImage = product ? product.image : 'assets/images/produtos/folhas_report_a4.jpg';

    const optionsArray = [
      `Embalagem: ${packageOption}`,
      `Especificação: ${detailOption}`,
      `Oferta Especial B2B: R$ ${price.toFixed(2).replace('.', ',')}`
    ];

    const cartItemId = `${productId}_offer_${packageOption.replace(/\s+/g, '_')}`;
    const existingIndex = cart.findIndex(item => item.cartItemId === cartItemId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        cartItemId,
        productId,
        name: productName,
        package: packageOption,
        image: productImage,
        quantity: qty,
        options: optionsArray,
        obs: 'Preço promocional acordado na Vitrine de Ofertas Hero'
      });
    }

    saveCartToStorage();
    updateCartUI();
    renderProducts();
    openCartDrawer();
  }

  function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      applyFilters();
    });

    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setCategory(btn.dataset.category, btn);
      });
    });

    // Drawer
    cartTriggerBtn.addEventListener('click', openCartDrawer);
    btnCloseDrawer.addEventListener('click', closeCartDrawer);
    cartOverlay.addEventListener('click', closeCartDrawer);

    // Modal de Opções
    btnCloseModal.addEventListener('click', closeProductModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeProductModal();
    });
    btnModalMinus.addEventListener('click', () => changeModalQty(-1));
    btnModalPlus.addEventListener('click', () => changeModalQty(1));
    btnConfirmAdd.addEventListener('click', confirmAddOptions);

    // Cotação
    btnCheckoutWhatsapp.addEventListener('click', checkoutWhatsapp);
    btnSendQuickList.addEventListener('click', sendQuickList);

    // Seleção de Forma de Pagamento por Botões (Pills)
    const paymentPills = document.querySelectorAll('.btn-payment-pill');
    const hiddenPaymentInput = document.getElementById('selected-payment-val');
    paymentPills.forEach(pill => {
      pill.addEventListener('click', () => {
        paymentPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        if (hiddenPaymentInput) {
          hiddenPaymentInput.value = pill.dataset.value;
        }
      });
    });

    if (btnHeaderUpload) {
      btnHeaderUpload.addEventListener('click', (e) => {
        e.preventDefault();
        openQuickQuoteModal();
      });
    }

    // Eventos do Modal Limpar Pedido
    if (btnCloseClearModal) {
      btnCloseClearModal.addEventListener('click', closeClearCartModal);
    }
    if (btnCancelClearCart) {
      btnCancelClearCart.addEventListener('click', closeClearCartModal);
    }
    if (btnConfirmClearCart) {
      btnConfirmClearCart.addEventListener('click', confirmClearCartAction);
    }
    if (modalClearCart) {
      modalClearCart.addEventListener('click', (e) => {
        if (e.target === modalClearCart) closeClearCartModal();
      });
    }

    // Eventos do Modal Cotar Lista Pronta
    if (btnCloseQuickModal) {
      btnCloseQuickModal.addEventListener('click', closeQuickQuoteModal);
    }
    if (btnCancelQuickModal) {
      btnCancelQuickModal.addEventListener('click', closeQuickQuoteModal);
    }
    if (btnModalSendQuick) {
      btnModalSendQuick.addEventListener('click', sendModalQuickQuote);
    }
    if (modalQuickQuote) {
      modalQuickQuote.addEventListener('click', (e) => {
        if (e.target === modalQuickQuote) closeQuickQuoteModal();
      });
    }

    // Inicializar carrossel de ofertas
    setupOfferCarousel();

    // Reduzir opacidade do widget flutuante durante a rolagem para não sobrepor botões
    const floatingWidget = document.getElementById('onira-floating-widget');
    if (floatingWidget) {
      let scrollTimer = null;
      window.addEventListener('scroll', () => {
        floatingWidget.classList.add('is-scrolling');
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          floatingWidget.classList.remove('is-scrolling');
        }, 350);
      }, { passive: true });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modalClearCart && modalClearCart.classList.contains('open')) closeClearCartModal();
        else if (modalQuickQuote && modalQuickQuote.classList.contains('open')) closeQuickQuoteModal();
        else if (modalOverlay && modalOverlay.classList.contains('open')) closeProductModal();
        else if (cartDrawer && cartDrawer.classList.contains('open')) closeCartDrawer();
      }
    });
  }

  window.universoApp = {
    openProductModal,
    setOption,
    changeCartItemQty,
    changeCartItemQtyByIndex,
    removeCartItem,
    removeCartItemByIndex,
    clearCart,
    openClearCartModal,
    closeClearCartModal,
    confirmClearCartAction,
    openQuickQuoteModal,
    closeQuickQuoteModal,
    sendModalQuickQuote,
    quoteDirectOnWhatsApp,
    openCartDrawer,
    closeCartDrawer,
    nextOfferSlide,
    prevOfferSlide,
    goToOfferSlide,
    addDirectOffer,
    scrollRail,
    clearSearch,
    setCategory,
    repeatLastQuote,
    checkRepeatQuoteButton
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
