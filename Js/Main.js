// Local Storage Keys
const USERS_KEY = "chatbot_users";
const CURRENT_USER_KEY = "chatbot_current_user";
const CHATS_KEY_PREFIX = "chatbot_chats_";

let isSignUpMode = false;
let currentUser = null;
let currentChatId = null;

// DOM Elements
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const usernameGroup = document.getElementById("usernameGroup");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authToggleLink = document.getElementById("authToggleLink");
const authToggleMsg = document.getElementById("authToggleMsg");

const displayUserId = document.getElementById("displayUserId");
const displayUsername = document.getElementById("displayUsername");
const messageContainer = document.getElementById("messageContainer");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chatList = document.getElementById("chatList");
const logoutBtn = document.getElementById("logoutBtn");
const newChatBtn = document.getElementById("newChatBtn");

// Helper: Generate 14-digit ID starting with 00000000000001
function generate14DigitID() {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  const nextNumber = users.length + 1;
  return String(nextNumber).padStart(14, "0");
}

// Authentication Logic
authToggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isSignUpMode = !isSignUpMode;
  authTitle.textContent = isSignUpMode ? "Sign Up" : "Sign In";
  usernameGroup.style.display = isSignUpMode ? "block" : "none";
  authSubmitBtn.textContent = isSignUpMode ? "Create Account" : "Sign In";
  authToggleMsg.textContent = isSignUpMode ? "Already have an account?" : "Don't have an account?";
  authToggleLink.textContent = isSignUpMode ? "Sign In" : "Sign Up";
});

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");

  if (isSignUpMode) {
    const username = document.getElementById("username").value;
    if (users.find((u) => u.email === email)) {
      alert("Account already exists with this email.");
      return;
    }

    const newUser = {
      id: generate14DigitID(),
      username: username || "User",
      email: email,
      password: password
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    setCurrentUser(newUser);
  } else {
    const existingUser = users.find((u) => u.email === email && u.password === password);
    if (!existingUser) {
      alert("Invalid email or password.");
      return;
    }
    setCurrentUser(existingUser);
  }
});

function setCurrentUser(user) {
  currentUser = user;
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  authModal.style.display = "none";
  displayUserId.textContent = `ID: ${user.id}`;
  displayUsername.textContent = user.username;
  loadUserChats();
}

// Check logged in user on page load
window.addEventListener("DOMContentLoaded", () => {
  const storedUser = localStorage.getItem(CURRENT_USER_KEY);
  if (storedUser) {
    setCurrentUser(JSON.parse(storedUser));
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  location.reload();
});

// Chat Logic
function getUserChats() {
  if (!currentUser) return [];
  const key = `${CHATS_KEY_PREFIX}${currentUser.id}`;
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveUserChats(chats) {
  if (!currentUser) return;
  const key = `${CHATS_KEY_PREFIX}${currentUser.id}`;
  localStorage.setItem(key, JSON.stringify(chats));
}

function loadUserChats() {
  const chats = getUserChats();
  chatList.innerHTML = "";
  chats.forEach((chat) => {
    const li = document.createElement("li");
    li.className = "chat-item";
    li.textContent = chat.title || "Conversation";
    li.addEventListener("click", () => openChat(chat.id));
    chatList.appendChild(li);
  });

  if (chats.length > 0) {
    openChat(chats[0].id);
  } else {
    createNewChat();
  }
}

function createNewChat() {
  const chats = getUserChats();
  const newChat = {
    id: Date.now().toString(),
    title: `Chat #${chats.length + 1}`,
    messages: [{ sender: "bot", text: "Hello! How can I assist you today?" }]
  };
  chats.unshift(newChat);
  saveUserChats(chats);
  loadUserChats();
  openChat(newChat.id);
}

newChatBtn.addEventListener("click", createNewChat);

function openChat(chatId) {
  currentChatId = chatId;
  const chats = getUserChats();
  const chat = chats.find((c) => c.id === chatId);
  if (!chat) return;

  messageContainer.innerHTML = "";
  chat.messages.forEach((msg) => {
    appendMessage(msg.sender, msg.text);
  });
}

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = `message ${sender === "user" ? "user-message" : "bot-message"}`;
  div.textContent = text;
  messageContainer.appendChild(div);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function handleSendMessage() {
  const text = userInput.value.trim();
  if (!text || !currentChatId) return;

  appendMessage("user", text);
  userInput.value = "";

  const chats = getUserChats();
  const chat = chats.find((c) => c.id === currentChatId);
  if (chat) {
    chat.messages.push({ sender: "user", text });
    
    // Simple Rule-based AI Response
    setTimeout(() => {
      const botReply = generateBotResponse(text);
      appendMessage("bot", botReply);
      chat.messages.push({ sender: "bot", text: botReply });
      saveUserChats(chats);
    }, 600);
  }
}

function generateBotResponse(input) {
  const lower = input.toLowerCase();
  if (lower.includes("hello") || lower.includes("hi")) return "Greetings! How can I help you?";
  if (lower.includes("name")) return "I am your personal GitHub AI Assistant.";
  if (lower.includes("help")) return "I can help answer questions or hold simple conversations.";
  return `You said: "${input}". How else can I assist you?`;
}

sendBtn.addEventListener("click", handleSendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSendMessage();
});
