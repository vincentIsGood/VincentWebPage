document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.querySelector('.chatbot-trigger');
    const windowEl = document.querySelector('.chatbot-window');
    const closeBtn = document.querySelector('.chatbot-close');
    const input = document.querySelector('.chatbot-input');
    const sendBtn = document.querySelector('.chatbot-send');
    const messagesContainer = document.querySelector('.chatbot-messages');
    const welcomeBubble = document.querySelector('.chatbot-welcome-bubble');
    const notificationDot = document.querySelector('.chatbot-notification-dot');
    const container = document.querySelector('.chatbot-container');
    const aiWord = document.querySelector('.ai-word');

    let socket = null;
    let reconnectTimeout = null;
    let currentBotMessageDiv = null;
    let typingIndicator = null;
    const wsUrl = 'wss://vincent.strsx.com/vwp/api/v1/chat';

    // Show welcome bubble after 2 seconds
    setTimeout(() => {
        if (windowEl && windowEl.classList.contains('hidden') && welcomeBubble) {
            welcomeBubble.classList.add('visible');

            // Auto-hide after 5 seconds (only on index.html, detected via aiWord)
            if (aiWord) {
                setTimeout(() => {
                    welcomeBubble.classList.remove('visible');
                }, 5000);
            }
        }
    }, 2000);

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
        
        if (welcomeBubble) {
            welcomeBubble.classList.remove('visible');
        }

        if (notificationDot) {
            notificationDot.classList.add('hidden');
        }

        // Update position immediately so it moves to bottom-right when opening
        updatePosition();

        if (isHidden) {
            input.focus();
            connectWebSocket();
        }
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.add('hidden');
        // Update position so it moves back to hero if at top
        updatePosition();
    });

    // Hide welcome bubble on trigger hover
    trigger.addEventListener('mouseenter', () => {
        if (welcomeBubble) {
            welcomeBubble.classList.remove('visible');
        }
    });

    // Hero Integration Logic
    function updatePosition() {
        if (!aiWord || !container || !trigger) return;

        const isHero = window.scrollY < 50 && windowEl.classList.contains('hidden');
        
        if (isHero) {
            const wordRect = aiWord.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const triggerRect = trigger.getBoundingClientRect();

            // Calculate bottom/right instead of top/left for smooth transition
            const targetBottom = window.innerHeight - wordRect.bottom + 20 - 10;
            const targetRight = window.innerWidth - wordRect.right - 30 - 35;

            container.style.bottom = `${targetBottom}px`;
            container.style.right = `${targetRight}px`;

            // Apply hero-specific styles directly
            trigger.style.width = '40px';
            trigger.style.height = '40px';
            trigger.style.background = 'transparent';
            trigger.style.border = '1px solid var(--color-bright)';
            trigger.style.boxShadow = 'none';
            trigger.querySelector('svg').style.fill = 'var(--color-bright)';
            trigger.querySelector('svg').style.width = '20px';
            trigger.querySelector('svg').style.height = '20px';
        } else {
            // Revert to corner state (letting CSS transitions handle it)
            container.style.bottom = '2rem';
            container.style.right = '2rem';

            // Revert trigger styles
            trigger.style.width = '';
            trigger.style.height = '';
            trigger.style.background = '';
            trigger.style.border = '';
            trigger.style.boxShadow = '';
            trigger.querySelector('svg').style.fill = '';
            trigger.querySelector('svg').style.width = '';
            trigger.querySelector('svg').style.height = '';
        }
    }

    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    // Initial check
    setTimeout(updatePosition, 100);

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
