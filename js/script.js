// Array para armazenar os itens do carrinho
let cart = [];
let products = []; // Array global para produtos

// Seleciona os elementos do HTML (garantindo que existam)
const productGrid = document.getElementById('product-grid');
const cartItemsList = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const cartDrawer = document.getElementById('cart-drawer');
const toast = document.getElementById('toast');

// Dados de fallback caso a API não funcione - ATUALIZADO
const fallbackProducts = [
    {
        id: 1,
        name: 'Lav SmartClean 2.1',
        description: 'Ideal para indústrias de pequeno a grande porte.',
        price: 30000.00,
        image: 'https://via.placeholder.com/300x200?text=Lav+SmartClean+2.1'
    }
];

// --- FUNÇÕES GERAIS (TOAST, LOCALSTORAGE, CONTADORES) ---

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

// --- FUNÇÕES DE PRODUTOS E API ---

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
        // Elemento só existe em compra.html
        return;
    }

    try {
        productGrid.innerHTML = '<div class="loading-state">Carregando produtos...</div>';
        
        const apiAvailable = await testAPI();
        
        if (apiAvailable) {
            const response = await fetch('http://127.0.0.1:5000/api/products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            products = await response.json();
            showToast('Produtos carregados com sucesso!');
        } else {
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

// Função para renderizar os produtos na página (CARD ÚNICO)
function renderProducts(productsToRender) {
    if (!productGrid) return;
    
    const product = productsToRender[0];
    
    if (!product) {
        productGrid.innerHTML = '<p class="empty-state">Nenhum produto disponível no momento.</p>';
        return;
    }
    
    // Renderiza o card aprimorado (SEM O BOTÃO 'SOLICITAR ORÇAMENTO')
    productGrid.innerHTML = `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <p class="price-display">R$ ${Number(product.price).toFixed(2).replace('.', ',')}</p>
            <button class="add-to-cart-button cta-button" data-id="${product.id}">
                Adicionar ao Carrinho
            </button>
        </div>
    `;

    // Adiciona evento ao botão "Adicionar ao Carrinho"
    const button = productGrid.querySelector('.add-to-cart-button');
    if (button) {
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
    }
}

// --- FUNÇÕES DE CARRINHO ---

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

// --- LÓGICA DE FADE-IN (ANIMAÇÃO) ---

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


// --- LÓGICA DO CHATBOT ---

const chatContainer = document.getElementById('chatbot-messages');
const chatInput = document.getElementById('chatbot-input');
const chatButton = document.getElementById('chatbot-send-btn');
const botToggle = document.getElementById('chatbot-toggle');
const botWindow = document.getElementById('chatbot-window');

// Base de Conhecimento do Chatbot
const knowledgeBase = [
    {
        keywords: ['oi', 'ola', 'olá', 'saudacao', 'bom dia'],
        response: "Olá! Eu sou o assistente virtual da Lavtec. Como posso ajudar você a saber mais sobre a Lav SmartClean 2.1 hoje? [Pergunte sobre: *preço*, *etapas de lavagem*, *sustentabilidade* ou *dúvidas*]."
    },
    {
        keywords: ['preco', 'preço', 'valor', 'custa'],
        response: "O preço da Lav SmartClean 2.1 é de R$ 30.000,00. Você pode adicioná-la diretamente ao carrinho."
    },
    {
        keywords: ['etapas', 'fases', 'processo', 'lavagem'],
        response: "O processo de higienização possui 4 etapas: Pré-Lavagem, Lavagem Potente, Secagem Turbo e Entrega Automática. Qual delas você gostaria de saber mais?"
    },
    {
        keywords: ['pre-lavagem', 'pré-lavagem', 'residuos'],
        response: "A Pré-Lavagem usa um jato potente de água quente para remover os resíduos superficiais e preparar os utensílios para a higienização principal, otimizando a limpeza."
    },
    {
        keywords: ['secagem', 'secar', 'umidade', 'turbo'],
        response: "A Secagem Turbo utiliza um potente jato secador com ar quente de alta velocidade para eliminar totalmente a umidade em segundos, garantindo utensílios prontos para uso."
    },
    {
        keywords: ['sustentabilidade', 'agua', 'energia', 'economia'],
        response: "A Lav SmartClean 2.1 é focada em Sustentabilidade, utilizando tecnologia que reduz o consumo de água por meio de sistemas de recirculação e otimização de energia. Pergunte sobre a *economia de água* para mais detalhes."
    },
    {
        keywords: ['duvidas', 'falar com atendente', 'humano', 'suporte'],
        response: "No momento, estou focado nas informações técnicas da máquina. Se precisar de suporte humano, envie sua mensagem pela seção de Contato no nosso site, e responderemos em até 24h."
    },
    {
        keywords: ['adeus', 'obrigado', 'tchau', 'valeu'],
        response: "Foi um prazer ajudar! Não hesite em perguntar se tiver mais dúvidas. Tenha um ótimo dia!"
    },
];

// Função Principal de Resposta do Bot
function getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    const foundIntention = knowledgeBase.find(item => 
        item.keywords.some(keyword => message.includes(keyword))
    );

    return foundIntention ? foundIntention.response : "Desculpe, não entendi. Tente perguntar sobre: *preço*, *etapas de lavagem* ou *sustentabilidade*."
}

// Renderiza a mensagem no chat
function appendMessage(sender, text) {
    if (!chatContainer) return;

    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.innerHTML = `<span>${text}</span>`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Processa o envio da mensagem do usuário
function handleSendMessage() {
    const userText = chatInput.value.trim();
    if (userText === '') return;

    chatInput.value = '';
    appendMessage('user', userText);

    setTimeout(() => {
        const botResponse = getBotResponse(userText);
        appendMessage('bot', botResponse);
    }, 800);
}

// --- INICIALIZAÇÃO E EVENT LISTENERS GERAIS ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. CARREGA DADOS DO CARRINHO
    loadCart();
    
    // 2. INICIA PRODUTOS (se for a página de compra)
    if (productGrid) {
        fetchAndRenderProducts();
    }
    
    // 3. CONFIGURA BOTÕES DO CARRINHO
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

    // 4. INICIA ANIMAÇÕES FADE-IN
    setupFadeInObserver();

    // 5. CONFIGURA CHATBOT
    if (chatButton) {
        chatButton.addEventListener('click', handleSendMessage);
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
    }
    if (botToggle && botWindow) {
        botToggle.addEventListener('click', () => {
            botWindow.classList.toggle('open');
            botToggle.classList.toggle('open');
            if (botWindow.classList.contains('open')) {
                setTimeout(() => {
                    appendMessage('bot', "Olá! Eu sou o assistente virtual da Lavtec. Posso responder sobre a Lav SmartClean 2.1. Tente perguntar sobre o *preço* ou *etapas*.");
                }, 500);
            }
        });
    }
    
    console.log('Inicialização completa: Carrinho, Produtos e Chatbot.');
});

// Torna funções globais para uso nos eventos HTML
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;