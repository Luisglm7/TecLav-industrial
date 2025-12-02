// VARIÁVEIS DE FRETE (Estas variáveis são usadas pelo JS para fallback e pelo chatbot)
const BASE_FREIGHT_COST = 350.00;
const COST_PER_KM = 1.50;

// SIMULAÇÃO DE BANCO DE DADOS DE DISTÂNCIAS (Representa cidades pelo Brasil)
const simulatedDistances = [
    // CIDADES DE REFERÊNCIA PRÓXIMAS (SP)
    { search: '18200-000', city: 'Itu, SP', distance: 198 },
    { search: '13010-000', city: 'Campinas, SP', distance: 300 },
    { search: '01000-000', city: 'São Paulo, SP', distance: 350 },
    { search: '18000-000', city: 'Sorocaba, SP', distance: 150 },
    
    // CAPITAIS BRASILEIRAS (SIMULAÇÃO DE DISTÂNCIAS)
    { search: '80000-000', city: 'Curitiba, PR', distance: 380 },
    { search: '88000-000', city: 'Florianópolis, SC', distance: 680 },
    { search: '90000-000', city: 'Porto Alegre, RS', distance: 1200 },
    { search: '20000-000', city: 'Rio de Janeiro, RJ', distance: 580 },
    { search: '30000-000', city: 'Belo Horizonte, MG', distance: 550 },
    { search: '29000-000', city: 'Vitória, ES', distance: 1250 },
    { search: '70000-000', city: 'Brasília, DF', distance: 980 },
    { search: '78000-000', city: 'Cuiabá, MT', distance: 1680 },
    { search: '79000-000', city: 'Campo Grande, MS', distance: 850 },
    { search: '74000-000', city: 'Goiânia, GO', distance: 930 },
    { search: '40000-000', city: 'Salvador, BA', distance: 1800 },
    { search: '50000-000', city: 'Recife, PE', distance: 2500 },
    { search: '60000-000', city: 'Fortaleza, CE', distance: 2850 },
    { search: '59000-000', city: 'Natal, RN', distance: 2900 },
    { search: '57000-000', city: 'Maceió, AL', distance: 2350 },
    { search: '65000-000', city: 'São Luís, MA', distance: 2950 },
    { search: '51000-000', city: 'João Pessoa, PB', distance: 2600 },
    { search: '49000-000', city: 'Aracaju, SE', distance: 2100 },
    { search: '64000-000', city: 'Teresina, PI', distance: 2400 },
    { search: '69000-000', city: 'Manaus, AM', distance: 3500 },
    { search: '66000-000', city: 'Belém, PA', distance: 3100 },
    { search: '76800-000', city: 'Porto Velho, RO', distance: 2800 },
    { search: '69300-000', city: 'Boa Vista, RR', distance: 4000 },
    { search: '77000-000', city: 'Palmas, TO', distance: 1700 },
    { search: '68900-000', city: 'Macapá, AP', distance: 3400 },
    { search: '69900-000', city: 'Rio Branco, AC', distance: 3300 }
];


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

// Esta função agora chama a API Flask para calcular
async function calculateFreightFromAPI(distanceKm) {
    if (distanceKm <= 0 || isNaN(distanceKm)) {
        return BASE_FREIGHT_COST; // Custo fixo se a distância for inválida
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/freight?distance=${distanceKm}`);
        const data = await response.json();
        
        if (response.ok) {
            return data.freight_cost;
        } else {
            // Fallback para cálculo local se a API falhar
            return BASE_FREIGHT_COST + (distanceKm * COST_PER_KM);
        }
    } catch (e) {
        // Fallback total
        return BASE_FREIGHT_COST + (distanceKm * COST_PER_KM);
    }
}

// --- FUNÇÃO DE BUSCA DE DISTÂNCIA (SIMULAÇÃO) ---
function getSimulatedDistance(searchTerm) {
    // Procura o termo no array de simulação
    const match = simulatedDistances.find(item => item.search.includes(searchTerm) || item.city.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (match) {
        return { distance: match.distance, city: match.city };
    }
    // Retorna uma distância padrão alta se não encontrar (simulando um local longe)
    return { distance: 800, city: 'Local Desconhecido (800km)' }; 
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

// Respostas pré-definidas para o chatbot (conversacional)
const botResponses = {
    welcome: "💖 Bem-vindo(a) à Tec-Lav Industrial! Sua Parceira em Soluções de Limpeza! ✨\n\nOlá! Que alegria ter você por aqui! Meu nome é Lim e estou aqui para te ajudar com todas as suas dúvidas sobre os nossos produtos e serviços. Na Tec-Lav, nosso maior carinho é a sua satisfação!",
    contact: "📞 Precisa Falar Conosco?\n\nSeja para tirar dúvidas específicas ou receber um atendimento personalizado, ficaremos muito felizes em conversar com você!\n\nTelefone de Contato (WhatsApp): **(15) 98658-2311**\n\nE-mail: **contato@teclavindustrial.com.br**",
    devolution: "🛡️ Devolução:\n\nVocê tem até **6 (seis) meses de uso** para solicitar a devolução, caso o produto apresente algum defeito de fabricação. Sua tranquilidade é nossa prioridade!",
    warranty: "🛡️ Garantia:\n\nOferecemos uma **garantia completa de 1 (um ano)** contra defeitos de fabricação. Sua tranquilidade é nossa prioridade!",
    freight: "📦 Entrega e Frete - Entregamos para todo o Brasil!\n\nEnviamos os nossos produtos com todo o cuidado e carinho para qualquer lugar do nosso imenso Brasil!\n\n**Regiões Próximas a Itapeva (SP):** O **frete é por nossa conta!** Totalmente **grátis** para você!\n\n**Outras Regiões (Mais Distantes):** Para envios de longa distância, adicionamos um pequeno valor de **R$ 10,00 a R$ 20,00**, dependendo da proximidade. Este é um valor adicional para garantir que o seu pedido chegue em segurança e o mais rápido possível!",
    payment: "💳 Formas de Pagamento\n\nOferecemos diversas opções para você finalizar sua compra de forma prática:\n\nAceitamos **Boleto Bancário, Cartão de Crédito** e **PIX**.\n\nVocê pode parcelar sua compra no cartão! Oferecemos a opção de dividir o valor para que sua compra caiba no seu bolso.",
    products: "🛍️ Nossos Produtos\n\nPara conhecer todos os nossos produtos e ver as etapas de cada um em detalhes, acesse nossa página de produtos: [Link para Produtos].",
    farewell: "Obrigado por conversar comigo! 😊 Um abraço carinhoso! 💖",
    fallback: "Puxa, que pena! 😔 Essa é uma pergunta muito específica e **infelizmente não posso te ajudar com a resposta agora**. Mas não se preocupe! Você pode entrar em contato diretamente com a nossa equipe, que terá o maior prazer em te atender!\n\nLigue ou chame no WhatsApp: **(15) 98658-2311**\nOu envie um e-mail para: **contato@teclavindustrial.com.br**\n\nFico à disposição para qualquer outra dúvida sobre nossos produtos, entrega, pagamento e garantia! Um abraço carinhoso! 💖"
};

// Função Principal de Resposta do Bot (Mais conversacional)
function getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Priorize saudações e despedidas
    if (message.includes('olá') || message.includes('oi') || message.includes('bom dia') || message.includes('boa tarde') || message.includes('boa noite')) {
        return botResponses.welcome;
    }
    if (message.includes('obrigado') || message.includes('tchau') || message.includes('adeus') || message.includes('valeu')) {
        return botResponses.farewell;
    }

    // Tenta identificar a intenção principal sem palavras-chave rígidas
    if (message.includes('contato') || message.includes('falar') || message.includes('telefone') || message.includes('whatsapp') || message.includes('email')) {
        return botResponses.contact;
    }
    if (message.includes('devolu') || message.includes('troca')) { // 'devolu' para pegar devolução
        return botResponses.devolution;
    }
    if (message.includes('garantia')) {
        return botResponses.warranty;
    }
    if (message.includes('entrega') || message.includes('frete') || message.includes('envio') || message.includes('custo')) {
        return botResponses.freight;
    }
    if (message.includes('pagamento') || message.includes('parcelar') || message.includes('cartão') || message.includes('pix') || message.includes('boleto')) {
        return botResponses.payment;
    }
    if (message.includes('produto') || message.includes('maquina') || message.includes('catalogo') || message.includes('funciona')) {
        return botResponses.products;
    }

    // Se nenhuma intenção clara for encontrada, retorna a mensagem padrão da loja
    return botResponses.fallback;
}

// Renderiza a mensagem no chat
function appendMessage(sender, text) {
    if (!chatContainer) return;

    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    // Para renderizar quebras de linha (\n) corretamente
    messageElement.innerHTML = `<span>${text.replace(/\n/g, '<br>')}</span>`; 
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

        // Inicializa com o custo fixo de frete
        updateCheckoutTotal(BASE_FREIGHT_COST); 

        // Evento do botão de Cálculo
        if (calculateFreightBtn) {
            calculateFreightBtn.addEventListener('click', async () => {
                const searchTerm = distanceInput.value.trim();
                
                if (searchTerm.length < 3) {
                    showToast('Insira um CEP ou nome de cidade válido para pesquisa.', 'error');
                    return;
                }

                // 1. Simula a busca da distância pelo CEP/Endereço
                const { distance, city } = getSimulatedDistance(searchTerm);
                
                // 2. Calcula o frete usando a API (ou fallback)
                const calculatedFreight = await calculateFreightFromAPI(distance);

                // 3. Atualiza a tela
                updateCheckoutTotal(calculatedFreight);
                
                // 4. Atualiza os inputs e storage
                distanceInput.value = distance; // Mostra a distância encontrada
                distanceInput.placeholder = `Distância de ${city}`;

                localStorage.setItem('distanceKm', distance);
                localStorage.setItem('freightCost', calculatedFreight.toFixed(2));
                
                showToast(`Frete de R$ ${calculatedFreight.toFixed(2).replace('.', ',')} calculado para ${city} (${distance} km)!`, 'success');
            });
        }

        // Lógica do formulário de pagamento
        if (paymentForm) {
            paymentForm.addEventListener('submit', (event) => {
                event.preventDefault(); 
                
                const finalFreight = Number(localStorage.getItem('freightCost') || BASE_FREIGHT_COST);
                const finalTotal = subtotal + finalFreight;
                
                // Verifica se o frete foi calculado (se for só o valor base, avisa)
                if (finalFreight === BASE_FREIGHT_COST && distanceInput.value === '0') {
                    showToast('Por favor, calcule o frete antes de finalizar.', 'error');
                    return;
                }

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
                        appendMessage('bot', botResponses.welcome);
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