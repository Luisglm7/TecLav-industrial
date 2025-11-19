// VARIÁVEIS DE FRETE
const BASE_FREIGHT_COST = 350.00;
const COST_PER_KM = 1.50;

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

// --- FUNÇÕES DE CARRINHO E CHECKOUT ---

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

// Função para finalizar compra (ATUALIZADA)
function checkout() {
    if (cart.length === 0) {
        showToast('Carrinho vazio! Adicione produtos antes de finalizar.', 'error');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Armazena o total base (sem frete) no localStorage
    localStorage.setItem('checkoutSubtotal', total.toFixed(2));
    
    // Armazena os custos de frete no localStorage
    localStorage.setItem('freightCost', BASE_FREIGHT_COST.toFixed(2));
    localStorage.setItem('distanceKm', 0); // Zera a distância inicial
    
    // Redireciona para a página de checkout
    window.location.href = 'checkout.html';
}

// --- FUNÇÃO DE CÁLCULO DE FRETE ---
function calculateFreight(distanceKm) {
    if (distanceKm <= 0 || isNaN(distanceKm)) {
        return 0; // Se inválido, considera apenas o custo fixo.
    }
    return BASE_FREIGHT_COST + (distanceKm * COST_PER_KM);
}


// --- LÓGICA DE FADE-IN (ANIMAÇÃO) ---

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

// Base de Conhecimento do Chatbot (Regras/Intenções) - ATUALIZADA
const knowledgeBase = [
    {
        keywords: ['oi', 'ola', 'olá', 'saudacao', 'bom dia', 'boa tarde', 'boa noite'],
        response: "Olá! 😊 Seja bem-vindo(a) à TEC-LAV! Como posso te ajudar hoje?"
    },
    {
        keywords: ['comprar', 'compra', 'como faço para comprar', 'adquirir'],
        response: "É super simples! Clique no ícone ‘Comprar’ e siga as instruções da página."
    },
    {
        keywords: ['contato', 'entrar em contato', 'falar com a equipe', 'falar com atendente'],
        response: "Você pode falar com a nossa equipe pelo chat online, e-mail ou redes sociais."
    },
    {
        keywords: ['devolucao', 'devolver', 'como faço para fazer uma devolução'],
        response: "Para solicitar uma devolução, entre em contato com o nosso suporte informando o número do pedido."
    },
    {
        keywords: ['entrega', 'entregam', 'brasil inteiro', 'territorio nacional', 'frete'],
        response: "Sim! 🇧🇷 A TEC-LAV realiza entregas em todo o território nacional."
    },
    {
        keywords: ['maquina', 'eficiente', 'agil', 'rapida', 'tecnologia'],
        response: "Com certeza! 💧 Nossa máquina foi desenvolvida com tecnologia de ponta para garantir máxima eficiência."
    },
    {
        keywords: ['confiavel', 'confiavel', 'transparente', 'qualidade'],
        response: "Sim! 🌿 A TEC-LAV preza pela transparência, qualidade e satisfação dos clientes."
    },
    {
        keywords: ['garantia', 'tem garantia', 'garantias'],
        response: "Sim! Todos os nossos produtos possuem garantia contra defeitos de fabricação."
    },
    {
        keywords: ['pagamento', 'formas de pagamento', 'cartao', 'pix', 'boleto'],
        response: "Aceitamos cartões de crédito, débito, Pix e boleto bancário."
    },
    {
        keywords: ['adeus', 'obrigado', 'tchau', 'valeu', 'despedida'],
        response: "Obrigado por conversar comigo! 😊 Até a próxima."
    },
];

// Função Principal de Resposta do Bot
function getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    const foundIntention = knowledgeBase.find(item => 
        item.keywords.some(keyword => message.includes(keyword))
    );

    const isFarewell = knowledgeBase.find(item => 
        item.keywords.includes('despedida') && item.keywords.some(keyword => message.includes(keyword))
    );

    if (foundIntention) {
        return foundIntention.response;
    } else if (isFarewell) {
        return isFarewell.response;
    } else {
        return "Desculpe, não entendi. Tente perguntar sobre: *comprar*, *contato*, *devolução* ou *garantia*."
    }
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
    // ----------------------------------------------------
    // Lógica específica para a página de checkout.html
    // ----------------------------------------------------
    if (window.location.pathname.includes('checkout.html')) {
        const distanceInput = document.getElementById('distance-input');
        const calculateFreightBtn = document.getElementById('calculate-freight-btn');
        const freightCostElement = document.getElementById('freight-cost');
        const checkoutTotalElement = document.getElementById('checkout-total');
        const paymentForm = document.getElementById('payment-form');
        
        const subtotal = Number(localStorage.getItem('checkoutSubtotal') || 0);

        // Função para atualizar o total na tela
        function updateCheckoutTotal(freight) {
            const finalTotal = subtotal + freight;
            checkoutTotalElement.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
            freightCostElement.textContent = `R$ ${freight.toFixed(2).replace('.', ',')}`;
        }

        // Inicializa com o custo fixo de frete (R$ 350,00)
        updateCheckoutTotal(BASE_FREIGHT_COST); 

        // Evento do botão de Cálculo
        if (calculateFreightBtn) {
            calculateFreightBtn.addEventListener('click', () => {
                const distance = Number(distanceInput.value);
                if (distance > 0 && !isNaN(distance)) {
                    const calculatedFreight = calculateFreight(distance);
                    updateCheckoutTotal(calculatedFreight);
                    
                    // Armazena os novos valores
                    localStorage.setItem('distanceKm', distance);
                    localStorage.setItem('freightCost', calculatedFreight.toFixed(2));

                    showToast(`Frete calculado para ${distance} km!`, 'success');
                } else {
                    showToast('Insira uma distância válida (Km).', 'error');
                    updateCheckoutTotal(BASE_FREIGHT_COST); // Volta para o valor base se o cálculo falhar
                    localStorage.setItem('freightCost', BASE_FREIGHT_COST.toFixed(2));
                    localStorage.setItem('distanceKm', 0);
                }
            });
        }

        // Lógica do formulário de pagamento
        if (paymentForm) {
            paymentForm.addEventListener('submit', (event) => {
                event.preventDefault(); 
                
                const finalFreight = Number(localStorage.getItem('freightCost') || BASE_FREIGHT_COST);
                const finalTotal = subtotal + finalFreight;
                
                showToast(`Pagamento de R$ ${finalTotal.toFixed(2).replace('.', ',')} processado com sucesso!`, 'success');

                // Simulação: Limpa e redireciona
                cart = [];
                saveCart(); 
                localStorage.removeItem('checkoutSubtotal');
                localStorage.removeItem('freightCost');
                localStorage.removeItem('distanceKm');
                
                setTimeout(() => {
                    window.location.href = 'index.html'; 
                }, 2500);
            });
        }
    } 
    // ----------------------------------------------------
    // Lógica para as outras páginas (index.html, compra.html, sobre.html)
    // ----------------------------------------------------
    else {
        loadCart();
        
        if (productGrid) {
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
                !event.target.closest('.cart-btn') &&
                !event.target.closest('#chatbot-window') && 
                !event.target.closest('#chatbot-toggle')) {
                closeCart();
            }
        });

        // Configura Chatbot (para páginas que não são checkout)
        const chatButton = document.getElementById('chatbot-send-btn');
        const chatInput = document.getElementById('chatbot-input');
        const botToggle = document.getElementById('chatbot-toggle');
        const botWindow = document.getElementById('chatbot-window');

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
                        appendMessage('bot', "Olá! 😊 Seja bem-vindo(a) à TEC-LAV! Como posso te ajudar hoje?");
                    }, 500);
                }
            });
        }
    }
    
    // Inicia ANIMAÇÕES FADE-IN em todas as páginas
    setupFadeInObserver();
    
    console.log('Inicialização completa.');
});

// Torna funções globais para uso nos eventos HTML
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;