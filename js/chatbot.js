const chatContainer = document.getElementById('chatbot-messages');
const chatInput = document.getElementById('chatbot-input');
const chatButton = document.getElementById('chatbot-send-btn');
const botToggle = document.getElementById('chatbot-toggle');
const botWindow = document.getElementById('chatbot-window');

// --- Base de Conhecimento do Chatbot (Regras/Intenções) ---
const knowledgeBase = [
    {
        keywords: ['oi', 'ola', 'olá', 'saudacao', 'bom dia'],
        response: "Olá! Eu sou o assistente virtual da Lavtec. Como posso ajudar você a saber mais sobre a Lav SmartClean 2.1 hoje? [Pergunte sobre: *preço*, *etapas de lavagem*, *sustentabilidade* ou *dúvidas*]."
    },
    {
        keywords: ['preco', 'preço', 'valor', 'custa'],
        response: "O preço da Lav SmartClean 2.1 é de R$ 30.000,00. Você pode adicioná-la diretamente ao carrinho ou solicitar um orçamento personalizado para grandes volumes."
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

// Função Principal de Resposta
function getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Tenta encontrar a intenção (regra) que melhor se encaixa
    const foundIntention = knowledgeBase.find(item => 
        item.keywords.some(keyword => message.includes(keyword))
    );

    return foundIntention ? foundIntention.response : "Desculpe, não entendi. Tente perguntar sobre: *preço*, *etapas de lavagem* ou *sustentabilidade*."
}

// Renderiza a mensagem no chat
function appendMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', sender);
    messageElement.innerHTML = `<span>${text}</span>`;
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Rola para o final
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
    }, 800); // Simula o tempo de processamento do bot
}

// Event Listeners
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
if (botToggle) {
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

// Adiciona mensagem de boas-vindas inicial (só aparece se a janela for aberta)
document.addEventListener('DOMContentLoaded', () => {
    if (chatContainer) {
        // Nada aqui para evitar mensagem dupla
    }
});