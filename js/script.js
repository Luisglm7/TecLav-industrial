// Array para armazenar os itens do carrinho
let cart = [];
let products = []; // Array global para produtos

// Seleciona os elementos do HTML (garantindo que existam)
const productGrid = document.getElementById('product-grid');
const cartItemsList = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const cartDrawer = document.getElementById('cart-drawer');
const toast = document.getElementById('toast');

// Dados de fallback caso a API não funcione
const fallbackProducts = [
    {
        id: 1,
        name: 'Lava-louças industrial P-50',
        description: 'Ideal para cozinhas de pequeno e médio porte.',
        price: 30000.00,
        image: 'https://via.placeholder.com/300x200?text=Modelo+P-50'
    }
];

// Função para mostrar toast
function showToast(message, type = 'success') {
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    console.log(`Toast [${type}]:`, message);
}

// Função para salvar carrinho no localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCounters();
}

// Função para carregar carrinho do localStorage
function loadCart() {
    try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            renderCart();
        }
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        cart = [];
    }
}

// Função para atualizar todos os contadores do carrinho no navbar e no drawer
function updateCartCounters() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Atualiza todos os elementos com a classe .cart-count (nos navbars)
    document.querySelectorAll('.cart-count').forEach(element => {
        element.textContent = totalCount;
    });
    
    // Atualiza o contador dentro do próprio carrinho (se existir)
    const cartDrawerCountSpan = document.querySelector('#cart-drawer #cart-count');
    if (cartDrawerCountSpan) cartDrawerCountSpan.textContent = `(${totalCount})`;
    
    // Atualiza o total do carrinho
    if (cartTotalSpan) cartTotalSpan.textContent = totalPrice.toFixed(2).replace('.', ',');

    // Desabilita o botão de finalizar compra se o carrinho estiver vazio
    const checkoutButton = document.querySelector('.checkout-button');
    if (checkoutButton) {
        checkoutButton.disabled = totalCount === 0;
    }
}

// Função para testar a conexão com a API
async function testAPI() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/health');
        return response.ok;
    } catch (error) {
        console.log('API não disponível, usando fallback');
        return false;
    }
}

// Função para buscar os produtos da API e renderizá-los
async function fetchAndRenderProducts() {
    if (!productGrid) {
        console.error('Elemento product-grid não encontrado');
        return;
    }

    try {
        productGrid.innerHTML = '<div class="loading-state">Carregando produtos...</div>';
        
        console.log('Tentando conectar com a API...');
        const apiAvailable = await testAPI();
        
        if (apiAvailable) {
            console.log('API disponível, buscando produtos...');
            const response = await fetch('http://127.0.0.1:5000/api/products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            products = await response.json();
            console.log('Produtos carregados da API:', products);
            showToast('Produtos carregados com sucesso!');
        } else {
            console.log('Usando produtos fallback');
            products = fallbackProducts;
            showToast('Modo offline - produtos de demonstração', 'error');
        }
        
        renderProducts(products);
        
    } catch (error) {
        console.error('Erro ao buscar os produtos:', error);
        
        products = fallbackProducts;
        renderProducts(products);
        
        productGrid.innerHTML += '<p class="error-state">⚠️ Usando dados locais. Servidor offline.</p>';
        showToast('Servidor offline - usando dados locais', 'error');
    }
}

// Função para renderizar os produtos na página
function renderProducts(productsToRender) {
    if (!productGrid) return;
    
    productGrid.innerHTML = '';
    
    if (!productsToRender || productsToRender.length === 0) {
        productGrid.innerHTML = '<p class="empty-state">Nenhum produto disponível no momento.</p>';
        return;
    }
    
    console.log('Renderizando produtos:', productsToRender);
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="price">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p>
            <button class="add-to-cart-button" data-id="${product.id}">
                Adicionar ao Carrinho
            </button>
        `;
        productGrid.appendChild(productCard);
    });

    document.querySelectorAll('.add-to-cart-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = Number(event.target.dataset.id);
            const product = productsToRender.find(p => Number(p.id) === productId);
            if (product) {
                addToCart(product);
                event.target.disabled = true;
                event.target.textContent = 'Adicionado!';
                setTimeout(() => {
                    event.target.disabled = false;
                    event.target.textContent = 'Adicionar ao Carrinho';
                }, 2000);
            }
        });
    });
}

// Função para adicionar um produto ao carrinho
function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            ...product, 
            quantity: 1 
        });
    }
    
    renderCart();
    saveCart();
    showToast(`${product.name} adicionado ao carrinho!`);
    
    if (cartDrawer && !cartDrawer.classList.contains('open')) {
        openCart();
    }
}

// Função para remover item do carrinho
function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex > -1) {
        const removedItem = cart[itemIndex];
        cart.splice(itemIndex, 1);
        renderCart();
        saveCart();
        showToast(`${removedItem.name} removido do carrinho`, 'error');
    }
}

// Função para atualizar quantidade do item
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            renderCart();
            saveCart();
        }
    }
}

// Função para renderizar o carrinho de compras
function renderCart() {
    if (!cartItemsList) return;
    
    cartItemsList.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<li class="empty-cart-message">O carrinho está vazio.</li>';
    } else {
        cart.forEach(item => {
            const li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML = `
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <div>R$ ${Number(item.price).toFixed(2).replace('.', ',')} cada</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-item" onclick="removeFromCart(${item.id})" title="Remover item">🗑️</button>
                </div>
            `;
            cartItemsList.appendChild(li);
        });
    }
    
    updateCartCounters();
}

// Funções para abrir/fechar carrinho
function openCart() {
    if (cartDrawer) {
        cartDrawer.classList.add('open');
    }
}

function closeCart() {
    if (cartDrawer) {
        cartDrawer.classList.remove('open');
    }
}

// Função para finalizar compra
function checkout() {
    if (cart.length === 0) {
        showToast('Carrinho vazio! Adicione produtos antes de finalizar.', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    showToast(`Compra finalizada! Total: R$ ${total.toFixed(2).replace('.', ',')}`);
    
    cart = [];
    renderCart();
    saveCart();
    closeCart();
}

// LÓGICA DE FADE-IN
function setupFadeInObserver() {
    const fadeInElements = document.querySelectorAll('.fade-in');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeInElements.forEach(element => {
        observer.observe(element);
    });
}

// Inicializa a página
document.addEventListener('DOMContentLoaded', () => {
    console.log('Página carregada, inicializando...');
    
    loadCart();
    
    if (window.location.pathname.includes('compra.html') || productGrid) {
        fetchAndRenderProducts();
    }
    
    document.querySelectorAll('.cart-btn').forEach(btn => {
        btn.addEventListener('click', openCart);
    });
    
    if (document.querySelector('.close-cart')) {
        document.querySelector('.close-cart').addEventListener('click', closeCart);
    }
    
    if (document.querySelector('.checkout-button')) {
        document.querySelector('.checkout-button').addEventListener('click', checkout);
    }
    
    document.addEventListener('click', (event) => {
        if (cartDrawer && cartDrawer.classList.contains('open') && 
            !event.target.closest('.cart-section') && 
            !event.target.closest('.cart-btn')) {
            closeCart();
        }
    });

    // Inicia a observação para o efeito de fade-in
    setupFadeInObserver();
    
    console.log('Inicialização concluída');
});

// Torna funções globais para uso nos eventos HTML
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;