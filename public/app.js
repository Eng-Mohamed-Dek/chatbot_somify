const chatMessages = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typingIndicator");
const clearBtn = document.getElementById("clearBtn");
const newChatBtn = document.getElementById("newChatBtn");

let conversationHistory = [];


// ============================================
// SEND MESSAGE
// ============================================

async function sendMessage(message) {

  if (!message || !message.trim()) {
    return;
  }

  const cleanMessage = message.trim();

  // Remove welcome screen
  const welcome = document.querySelector(".welcome");

  if (welcome) {
    welcome.remove();
  }

  // Show user message
  addMessage("user", cleanMessage);

  // Clear input
  messageInput.value = "";
  autoResize();

  // Disable send
  setLoading(true);

  try {

    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: cleanMessage,
        history: conversationHistory
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Failed to get chatbot response."
      );
    }

    const reply = data.reply;

    // Add response to UI
    addMessage("bot", reply);

    // Update history
    conversationHistory.push({
      role: "user",
      text: cleanMessage
    });

    conversationHistory.push({
      role: "model",
      text: reply
    });

  } catch (error) {

    console.error(error);

    addMessage(
      "bot",
      "Sorry, I'm having trouble connecting right now. Please try again in a moment."
    );

  } finally {

    setLoading(false);

  }
}


// ============================================
// ADD MESSAGE
// ============================================

function addMessage(role, text) {

  const message = document.createElement("div");

  message.className = `message ${role}`;

  const avatar = document.createElement("div");

  avatar.className = "message-avatar";

  avatar.textContent = role === "bot" ? "S" : "You";

  const content = document.createElement("div");

  content.className = "message-content";

  const bubble = document.createElement("div");

  bubble.className = "message-bubble";

  // Convert URLs into clickable links
  bubble.innerHTML = formatMessage(text);

  content.appendChild(bubble);

  message.appendChild(avatar);
  message.appendChild(content);

  chatMessages.appendChild(message);

  scrollToBottom();
}


// ============================================
// FORMAT MESSAGE
// ============================================

function formatMessage(text) {

  // Escape HTML first
  const escaped = escapeHtml(text);

  // Convert URLs into links
  const urlRegex =
    /(https?:\/\/[^\s<]+)/g;

  return escaped.replace(
    urlRegex,
    (url) => {

      const cleanUrl = url.replace(
        /[.,!?;:]+$/,
        ""
      );

      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${cleanUrl}</a>`;
    }
  );
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(text) {

  const div = document.createElement("div");

  div.textContent = text;

  return div.innerHTML;
}


// ============================================
// LOADING
// ============================================

function setLoading(isLoading) {

  sendBtn.disabled = isLoading;
  messageInput.disabled = isLoading;

  if (isLoading) {

    typingIndicator.classList.remove("hidden");

    scrollToBottom();

  } else {

    typingIndicator.classList.add("hidden");

    messageInput.disabled = false;

    sendBtn.disabled = false;

    messageInput.focus();
  }
}


// ============================================
// SCROLL
// ============================================

function scrollToBottom() {

  setTimeout(() => {

    chatMessages.scrollTo({
      top: chatMessages.scrollHeight,
      behavior: "smooth"
    });

  }, 50);
}


// ============================================
// FORM SUBMIT
// ============================================

chatForm.addEventListener("submit", (event) => {

  event.preventDefault();

  sendMessage(messageInput.value);

});


// ============================================
// ENTER TO SEND
// ============================================

messageInput.addEventListener("keydown", (event) => {

  if (event.key === "Enter" && !event.shiftKey) {

    event.preventDefault();

    sendMessage(messageInput.value);

  }

});


// ============================================
// AUTO RESIZE TEXTAREA
// ============================================

messageInput.addEventListener(
  "input",
  autoResize
);

function autoResize() {

  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(
      messageInput.scrollHeight,
      120
    ) + "px";
}


// ============================================
// QUICK BUTTONS
// ============================================

document.querySelectorAll(
  ".quick-btn, .suggestion"
).forEach((button) => {

  button.addEventListener(
    "click",
    () => {

      const message =
        button.dataset.message;

      if (message) {
        sendMessage(message);
      }

    }
  );

});


// ============================================
// CLEAR CHAT
// ============================================

function clearChat() {

  conversationHistory = [];

  chatMessages.innerHTML = `
    <div class="welcome">

      <div class="welcome-icon">
        S
      </div>

      <h2>
        Welcome to Somify 👋
      </h2>

      <p>
        I'm Somify's AI assistant. I can help you find the right
        website, web application, or management system for your
        organization.
      </p>

      <div class="suggestions">

        <button
          class="suggestion"
          data-message="Tell me about Somify Agency."
        >
          What does Somify do?
        </button>

        <button
          class="suggestion"
          data-message="I need software for my school."
        >
          School solution
        </button>

        <button
          class="suggestion"
          data-message="I need software for my hospital."
        >
          Healthcare solution
        </button>

        <button
          class="suggestion"
          data-message="I need a website for my business."
        >
          Business website
        </button>

      </div>

    </div>
  `;

  // Reattach suggestion buttons
  document.querySelectorAll(
    ".suggestion"
  ).forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const message =
          button.dataset.message;

        if (message) {
          sendMessage(message);
        }

      }
    );

  });

  messageInput.value = "";

  messageInput.focus();
}


clearBtn.addEventListener(
  "click",
  clearChat
);

newChatBtn.addEventListener(
  "click",
  clearChat
);


// ============================================
// INITIAL FOCUS
// ============================================

messageInput.focus();
