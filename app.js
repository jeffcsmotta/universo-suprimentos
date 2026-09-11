/**
 * Universo Suprimentos Corporativos - Vitrine Digital B2B
 * Sistema de Cotação Dinâmica com Opções (Variações e Observações por Produto)
 */

(function () {
  'use strict';

  const WHATSAPP_PHONE = '5554999500444'; // (54) 9 9950-0444
  const CART_STORAGE_KEY = 'universo_b2b_quote_cart_v2';

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
  const modalProductTitle = document.getElementById('modal-product-title');
  const modalProductDesc = document.getElementById('modal-product-desc');
  const modalOptionsContainer = document.getElementById('modal-options-container');
  const modalObsText = document.getElementById('modal-obs-text');
  const modalQtyVal = document.getElementById('modal-qty-val');
  const btnModalMinus = document.getElementById('btn-modal-minus');
  const btnModalPlus = document.getElementById('btn-modal-plus');
  const btnConfirmAdd = document.getElementById('btn-confirm-add');

  // Quick List
  const quickListText = document.getElementById('quick-list-text');
  const btnSendQuickList = document.getElementById('btn-send-quick-list');
  const btnHeaderUpload = document.getElementById('btn-header-upload');

  // Inicialização
  async function init() {
    loadCartFromStorage();
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

  // Renderizar catálogo
  function renderProducts() {
    if (!filteredProducts.length) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: #6C757D;">
          <h3 style="color: #1C1E21; margin-bottom: 0.5rem;">Nenhum produto encontrado</h3>
          <p style="font-size: 0.9rem;">Não encontramos nenhum item para "${searchTerm}". Tente outra busca ou envie sua lista personalizada.</p>
        </div>
      `;
      productsCountEl.textContent = '0 itens';
      return;
    }

    productsCountEl.textContent = `${filteredProducts.length} itens`;

    const html = filteredProducts.map(product => {
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <span>${product.package}</span>
            </div>
            <div class="product-footer">
              <div class="product-quote-info">
                <span class="quote-label">Preço Corporativo</span>
                <span class="quote-value">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  Sob Consulta
                </span>
              </div>
              <button type="button" class="btn-open-options ${inCartCount > 0 ? 'added' : ''}" onclick="event.stopPropagation(); window.universoApp.openProductModal('${product.id}')">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${inCartCount > 0 
                    ? '<polyline points="20 6 9 17 4 12"></polyline>' 
                    : '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'}
                </svg>
                <span>${inCartCount > 0 ? `Na Lista (${inCartCount})` : 'Opções & Cotar'}</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    productsGrid.innerHTML = html;
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
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

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
    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    modalOverlay.classList.remove('open');
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

    // Gerar chave única para itens com diferentes opções
    const cartItemId = `${currentProductForOptions.id}_${JSON.stringify(modalSelectedOptions)}_${obs}`;

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

    if (cart.length === 0) {
      emptyCartState.style.display = 'block';
      cartItemsList.innerHTML = '';
      cartFooter.style.display = 'none';
      return;
    }

    emptyCartState.style.display = 'none';
    cartFooter.style.display = 'block';

    const html = cart.map(item => `
      <div class="cart-item-row" data-cart-id="${item.cartItemId}">
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
              <button type="button" class="btn-qty" onclick="window.universoApp.changeCartItemQty('${item.cartItemId}', -1)">-</button>
              <span class="qty-display">${item.quantity}</span>
              <button type="button" class="btn-qty" onclick="window.universoApp.changeCartItemQty('${item.cartItemId}', 1)">+</button>
            </div>
            <button type="button" class="btn-remove-item" onclick="window.universoApp.removeCartItem('${item.cartItemId}')" title="Remover item">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

  function changeCartItemQty(cartItemId, delta) {
    const item = cart.find(i => i.cartItemId === cartItemId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.cartItemId !== cartItemId);
    }

    saveCartToStorage();
    updateCartUI();
    renderProducts();
  }

  function removeCartItem(cartItemId) {
    cart = cart.filter(i => i.cartItemId !== cartItemId);
    saveCartToStorage();
    updateCartUI();
    renderProducts();
  }

  function openCartDrawer() {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
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
    message += `Favor retornar com a melhor proposta comercial, prazo de entrega e condições de faturamento PJ. Obrigado!`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
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
      btnHeaderUpload.addEventListener('click', () => {
        document.getElementById('quick-quote-section').scrollIntoView({ behavior: 'smooth' });
        quickListText.focus();
      });
    }

    // Inicializar carrossel de ofertas
    setupOfferCarousel();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (modalOverlay.classList.contains('open')) closeProductModal();
        else if (cartDrawer.classList.contains('open')) closeCartDrawer();
      }
    });
  }

  window.universoApp = {
    openProductModal,
    setOption,
    changeCartItemQty,
    removeCartItem,
    openCartDrawer,
    closeCartDrawer,
    nextOfferSlide,
    prevOfferSlide,
    goToOfferSlide,
    addDirectOffer
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
