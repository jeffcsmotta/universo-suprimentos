/**
 * Universo Suprimentos Corporativos - Vitrine Digital B2B
 * Sistema de Cotação Dinâmica via WhatsApp (Preços sob consulta corporativa)
 */

(function () {
  'use strict';

  // Configurações do WhatsApp Comercial
  const WHATSAPP_PHONE = '5554999500444'; // (54) 9 9950-0444
  const CART_STORAGE_KEY = 'universo_b2b_quote_cart';

  // Estado da Aplicação
  let allProducts = [];
  let filteredProducts = [];
  let cart = [];
  let activeCategory = 'todos';
  let searchTerm = '';

  // Elementos DOM
  const productsGrid = document.getElementById('products-grid');
  const productsCountEl = document.getElementById('products-count');
  const categoryTitleEl = document.getElementById('category-title');
  const searchInput = document.getElementById('search-input');
  const categoryBtns = document.querySelectorAll('.category-tab-btn');

  // Elementos do Carrinho
  const cartTriggerBtn = document.getElementById('btn-cart-trigger');
  const cartBadgeEl = document.getElementById('cart-badge');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartOverlay = document.getElementById('cart-overlay');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const cartItemsList = document.getElementById('cart-items-list');
  const emptyCartState = document.getElementById('empty-cart-state');
  const cartFooter = document.getElementById('cart-footer');
  const btnCheckoutWhatsapp = document.getElementById('btn-checkout-whatsapp');

  // Quick List Elements
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

  // Carregar produtos do JSON
  async function loadProducts() {
    try {
      const response = await fetch('products.json');
      if (!response.ok) throw new Error('Falha ao carregar catálogo');
      allProducts = await response.json();
      filteredProducts = [...allProducts];
      renderProducts();
    } catch (error) {
      console.error('Erro carregando produtos:', error);
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748B;">
          <p>Ocorreu um erro ao carregar os itens do catálogo. Por favor, recarregue a página.</p>
        </div>
      `;
    }
  }

  // Renderizar catálogo de produtos
  function renderProducts() {
    if (!filteredProducts.length) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: #64748B;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 0.75rem; color: #94A3B8;">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3 style="color: #0A2240; margin-bottom: 0.5rem;">Nenhum produto encontrado</h3>
          <p style="font-size: 0.9rem;">Não encontramos nenhum item para "${searchTerm}". Tente outra busca ou envie sua lista personalizada.</p>
        </div>
      `;
      productsCountEl.textContent = '0 itens';
      return;
    }

    productsCountEl.textContent = `${filteredProducts.length} itens`;

    const html = filteredProducts.map(product => {
      const isAdded = cart.some(item => item.id === product.id);
      return `
        <article class="product-card" data-id="${product.id}">
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
              <button class="btn-add-quote ${isAdded ? 'added' : ''}" data-id="${product.id}" onclick="window.universoApp.toggleProduct('${product.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${isAdded 
                    ? '<polyline points="20 6 9 17 4 12"></polyline>' 
                    : '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'}
                </svg>
                <span>${isAdded ? 'Na Lista' : 'Adicionar'}</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    productsGrid.innerHTML = html;
  }

  // Obter nome legível da categoria
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

  // Filtrar produtos
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

  // Manipulação de Categorias
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

  // Alternar produto no carrinho de cotação
  function toggleProduct(productId) {
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
      cart.splice(existingIndex, 1);
    } else {
      const product = allProducts.find(p => p.id === productId);
      if (product) {
        cart.push({
          id: product.id,
          name: product.name,
          package: product.package,
          image: product.image,
          quantity: 1
        });
      }
    }

    saveCartToStorage();
    updateCartUI();
    renderProducts(); // Atualiza os botões "Na Lista / Adicionar"
  }

  // Alterar quantidade de item no carrinho
  function changeQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(i => i.id !== productId);
    }

    saveCartToStorage();
    updateCartUI();
    renderProducts();
  }

  // Remover item do carrinho
  function removeItem(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCartToStorage();
    updateCartUI();
    renderProducts();
  }

  // Atualizar a interface do Carrinho de Cotação
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
      <div class="cart-item-row" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
        <div class="cart-item-details">
          <div class="cart-item-name" title="${item.name}">${item.name}</div>
          <div class="cart-item-unit">${item.package}</div>
          <div class="cart-qty-control">
            <button class="btn-qty" onclick="window.universoApp.changeQuantity('${item.id}', -1)">-</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="btn-qty" onclick="window.universoApp.changeQuantity('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="btn-remove-item" onclick="window.universoApp.removeItem('${item.id}')" title="Remover da cotação">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `).join('');

    cartItemsList.innerHTML = html;
  }

  // Abrir / Fechar Drawer do Carrinho
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

  // Finalizar e Enviar Cotação para o WhatsApp
  function checkoutWhatsapp() {
    if (cart.length === 0) {
      alert('Sua lista de cotação está vazia. Adicione itens antes de solicitar!');
      return;
    }

    const companyName = document.getElementById('input-company').value.trim();
    const contactPerson = document.getElementById('input-name').value.trim();
    const city = document.getElementById('input-city').value.trim() || 'Região da Serra Gaúcha';
    const paymentPref = document.getElementById('select-payment').value;

    let message = `🏢 *SOLICITAÇÃO DE COTAÇÃO CORPORATIVA — UNIVERSO SUPRIMENTOS*\n\n`;

    if (companyName) message += `*Empresa:* ${companyName}\n`;
    if (contactPerson) message += `*Responsável:* ${contactPerson}\n`;
    message += `*Localização:* ${city}\n`;
    message += `*Condição Pretendida:* ${paymentPref}\n\n`;

    message += `📦 *ITENS SELECIONADOS PARA COTAÇÃO:*\n`;
    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n   ↳ Quantidade: *${item.quantity}* (${item.package})\n`;
    });

    message += `\n💬 _Olá time Universo! Gostaria de receber a cotação com as melhores condições para faturamento corporativo._`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
  }

  // Envio Rápido de Lista Copiada/Colada
  function sendQuickList() {
    const text = quickListText.value.trim();
    if (!text) {
      alert('Por favor, cole ou digite os itens da sua lista no campo acima.');
      quickListText.focus();
      return;
    }

    let message = `📋 *SOLICITAÇÃO DE COTAÇÃO VIA LISTA PRONTA — UNIVERSO*\n\n`;
    message += `Olá! Segue a relação de materiais que precisamos cotar para nossa empresa:\n\n`;
    message += `"${text}"\n\n`;
    message += `Por favor, nos enviem uma proposta com valores faturados para PJ e prazo de entrega.`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank');
  }

  // Armazenamento Local do Carrinho
  function saveCartToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Erro ao salvar no localStorage', e);
    }
  }

  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        cart = JSON.parse(saved);
      }
    } catch (e) {
      cart = [];
    }
  }

  // Event Listeners
  function setupEventListeners() {
    // Busca
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      applyFilters();
    });

    // Filtros de Categoria
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setCategory(btn.dataset.category, btn);
      });
    });

    // Gaveta / Drawer
    cartTriggerBtn.addEventListener('click', openCartDrawer);
    btnCloseDrawer.addEventListener('click', closeCartDrawer);
    cartOverlay.addEventListener('click', closeCartDrawer);

    // Botões de Cotação
    btnCheckoutWhatsapp.addEventListener('click', checkoutWhatsapp);
    btnSendQuickList.addEventListener('click', sendQuickList);

    // Botão Header Upload
    if (btnHeaderUpload) {
      btnHeaderUpload.addEventListener('click', () => {
        document.getElementById('quick-quote-section').scrollIntoView({ behavior: 'smooth' });
        quickListText.focus();
      });
    }

    // Fechar com tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cartDrawer.classList.contains('open')) {
        closeCartDrawer();
      }
    });
  }

  // Expor métodos para o escopo global do botão inline
  window.universoApp = {
    toggleProduct,
    changeQuantity,
    removeItem,
    openCartDrawer,
    closeCartDrawer
  };

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
