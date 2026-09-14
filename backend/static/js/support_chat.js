/**
 * KaamSetu — AI Support Assistant & Live Chat Client
 */

document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');

  if (chatMessages && chatInput && chatSendBtn) {
    async function sendMessage() {
      const text = chatInput.value.trim();
      if (!text) return;

      // Append user bubble
      const userBubble = document.createElement('div');
      userBubble.className = 'chat-bubble chat-bubble-user';
      userBubble.innerText = text;
      chatMessages.appendChild(userBubble);
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Typing indicator
      const typingBubble = document.createElement('div');
      typingBubble.className = 'chat-bubble chat-bubble-ai';
      typingBubble.innerText = 'Assistant is typing...';
      chatMessages.appendChild(typingBubble);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const res = await fetch('/api/support/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken') || ''
          },
          body: JSON.stringify({ message: text })
        });

        if (res.ok) {
          const data = await res.json();
          typingBubble.innerText = data.reply || 'Thank you for reaching out.';
          if (data.escalated) {
            const escNotice = document.createElement('div');
            escNotice.className = 'text-xs text-coral mt-1 font-bold';
            escNotice.innerText = '⚡ Issue escalated to human support agent.';
            typingBubble.appendChild(escNotice);
          }
        } else {
          typingBubble.innerText = 'I am sorry, I am currently unable to answer. Please create a support ticket below.';
        }
      } catch (err) {
        typingBubble.innerText = 'Network connection issue. Please submit a support ticket.';
      }
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});
