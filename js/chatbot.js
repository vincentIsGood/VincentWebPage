/* AI Chatbot Logic */

document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.querySelector('.chatbot-trigger');
    const windowEl = document.querySelector('.chatbot-window');
    const closeBtn = document.querySelector('.chatbot-close');
    const input = document.querySelector('.chatbot-input');
    const sendBtn = document.querySelector('.chatbot-send');
    const messagesContainer = document.querySelector('.chatbot-messages');

    let socket = null;
    let reconnectTimeout = null;
    let currentBotMessageDiv = null;
    let typingIndicator = null;
    const wsUrl = 'ws://vincent.strsx.com/vwp/api/v1/chat';

    function connectWebSocket() {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }

        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket connected');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
            appendMessage('Trying to reconnect to server...', 'system');
            if (!reconnectTimeout) {
                reconnectTimeout = setTimeout(connectWebSocket, 5000);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    function handleServerMessage(data) {
        switch (data.type) {
            case 'ready':
                console.log('Backend ready');
                break;
            case 'chat_received':
                showTypingIndicator();
                break;
            case 'aimessagechunk':
                if (typingIndicator) {
                    removeTypingIndicator();
                }
                appendBotChunk(data.content);
                break;
            case 'chat_done':
                currentBotMessageDiv = null;
                break;
        }
    }

    function appendBotChunk(content) {
        if (!currentBotMessageDiv) {
            currentBotMessageDiv = appendMessage('', 'bot');
        }
        currentBotMessageDiv.textContent += content;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTypingIndicator() {
        if (typingIndicator) return;
        typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot typing-indicator-wrapper';
        typingIndicator.innerHTML = `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function removeTypingIndicator() {
        if (typingIndicator) {
            typingIndicator.remove();
            typingIndicator = null;
        }
    }

    // Toggle Chat Window
    trigger.addEventListener('click', () => {
        const isHidden = windowEl.classList.contains('hidden');
        windowEl.classList.toggle('hidden');
        if (isHidden) {
            input.focus();
            connectWebSocket();
        }
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.add('hidden');
    });

    // Handle Message Sending
    const sendMessage = () => {
        const text = input.value.trim();
        if (!text) return;

        if (socket && socket.readyState === WebSocket.OPEN) {
            // Add User Message
            appendMessage(text, 'user');
            socket.send(JSON.stringify({ type: 'chat', content: text }));
            input.value = '';
        } else {
            appendMessage('Connection lost. Reconnecting...', 'system');
            connectWebSocket();
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        
        // Simple inline style for system messages
        if (sender === 'system') {
            msgDiv.style.alignSelf = 'center';
            msgDiv.style.opacity = '0.6';
            msgDiv.style.fontSize = '0.8rem';
            msgDiv.style.background = 'transparent';
            msgDiv.style.color = 'var(--font-color-2nd)';
            msgDiv.style.border = 'none';
        }

        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return msgDiv;
    }
});
