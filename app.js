// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcZetecRzDRuOHxsNge0uH770_HMpeY3M",
  authDomain: "clowai1v.firebaseapp.com",
  projectId: "clowai1v",
  storageBucket: "clowai1v.appspot.com",
  messagingSenderId: "82096858124",
  appId: "1:82096858124:web:182d7d0719848f3f867a29",
  measurementId: "G-6L7YLCEKXZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// API Configuration
const API_KEY = "sk-ws-H.IRHEPY.hSui.MEYCIQDiK2-tuF51VD1_O2uN6WudTu_AQK85sXR7Hqo6TVHzJgIhAKJ-3OhGD1TxKyXKjaMhSXSAT5hc629TbFfJul1MHimf"; // خپل API key دلته ولیکئ
const API_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

// Global Variables
let chats = {};
let current = Date.now().toString();
let currentUser = null;

// ============ AUTH STATE LISTENER ============
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    
    // Update user info
    document.getElementById('userName').textContent = user.displayName || 'User';
    document.getElementById('userAvatar').src = user.photoURL || 'https://i.postimg.cc/Wb8c2DFr/file-00000000974071f58a753a2f8b810e7c.png';
    
    initApp();
  } else {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
  }
});

// ============ INITIALIZE APP ============
function initApp() {
  loadUserChats();
  setupEventListeners();
  autoGrow();
}

// ============ LOAD CHATS FROM FIRESTORE ============
async function loadUserChats() {
  if (!currentUser) return;
  
  try {
    const doc = await db.collection('chats').doc(currentUser.uid).get();
    if (doc.exists) {
      chats = doc.data().chats || {};
      if (!chats[current]) {
        chats[current] = {title: "New Chat", messages: []};
        await saveChats();
      }
    } else {
      chats = {};
      chats[current] = {title: "New Chat", messages: []};
      await saveChats();
    }
    renderChat();
    renderList();
  } catch (error) {
    console.error("Error loading chats:", error);
    showToast("Error loading chat history");
    chats[current] = {title: "New Chat", messages: []};
    renderChat();
    renderList();
  }
}

// ============ SAVE CHATS TO FIRESTORE ============
async function saveChats() {
  if (!currentUser) return;
  
  try {
    await db.collection('chats').doc(currentUser.uid).set({
      chats: chats,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error saving chats:", error);
    showToast("Error saving chat");
  }
}

// ============ SETUP EVENT LISTENERS ============
function setupEventListeners() {
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
      document.getElementById('userDropdown').classList.remove('active');
    }
  });

  // Close sidebar when pressing Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  // Auto-resize textarea
  document.getElementById('input').addEventListener('input', autoGrow);
  
  // Enter to send, Shift+Enter for new line
  document.getElementById('input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// ============ AUTH FUNCTIONS ============
function toggleAuth() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  
  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'flex';
    signupForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
    forgotPasswordLink.style.display = 'block';
    document.querySelector('.auth-box h1').textContent = 'Welcome to ClowAi1V';
    document.querySelector('.auth-box .auth-header p').textContent = 'Sign in to continue';
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'flex';
    forgotPasswordForm.style.display = 'none';
    forgotPasswordLink.style.display = 'none';
    document.querySelector('.auth-box h1').textContent = 'Create Account';
    document.querySelector('.auth-box .auth-header p').textContent = 'Sign up to get started';
  }
}

function showForgotPassword() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('forgotPasswordForm').style.display = 'flex';
  document.getElementById('forgotPasswordLink').style.display = 'none';
}

// Login with Email/Password
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  try {
    showToast('Signing in...');
    await auth.signInWithEmailAndPassword(email, password);
    showToast('Signed in successfully!');
  } catch (error) {
    handleAuthError(error);
  }
});

// Sign Up with Email/Password
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  
  try {
    showToast('Creating account...');
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await result.user.updateProfile({
      displayName: name
    });
    showToast('Account created successfully!');
  } catch (error) {
    handleAuthError(error);
  }
});

// Forgot Password
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('resetEmail').value;
  
  try {
    await auth.sendPasswordResetEmail(email);
    showToast('Password reset email sent!');
    toggleAuth(); // Go back to login
  } catch (error) {
    handleAuthError(error);
  }
});

// Google Sign In
async function googleSignIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    showToast('Signing in with Google...');
    await auth.signInWithPopup(provider);
    showToast('Signed in successfully!');
  } catch (error) {
    handleAuthError(error);
  }
}

// Sign Out
async function signOut() {
  try {
    await auth.signOut();
    chats = {};
    current = Date.now().toString();
    showToast('Signed out successfully!');
  } catch (error) {
    console.error("Sign out error:", error);
    showToast('Error signing out');
  }
}

// Handle auth errors
function handleAuthError(error) {
  let message = 'An error occurred';
  switch (error.code) {
    case 'auth/user-not-found':
      message = 'No account found with this email';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password';
      break;
    case 'auth/email-already-in-use':
      message = 'Email already in use';
      break;
    case 'auth/weak-password':
      message = 'Password should be at least 6 characters';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email address';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Sign in cancelled';
      break;
    default:
      message = error.message;
  }
  showToast(message);
}

// ============ UI FUNCTIONS ============
function toggleMenu() {
  document.getElementById('sidebar').classList.toggle('active');
  document.getElementById('sidebarOverlay').classList.toggle('active');
}

function closeMenu() {
  document.getElementById('sidebar').classList.remove('active');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

function toggleTheme() {
  const body = document.body;
  const themeBtn = document.querySelector('.themeBtn');
  
  if (body.classList.contains('light')) {
    body.classList.remove('light');
    body.classList.add('dark');
    themeBtn.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark');
    body.classList.add('light');
    themeBtn.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  }
}

function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('active');
}

// Profile Modal
function showProfile() {
  document.getElementById('userDropdown').classList.remove('active');
  document.getElementById('profileModal').classList.add('active');
  document.getElementById('profileAvatar').src = currentUser?.photoURL || 'https://i.postimg.cc/Wb8c2DFr/file-00000000974071f58a753a2f8b810e7c.png';
  document.getElementById('profileName').textContent = currentUser?.displayName || 'User';
  document.getElementById('profileEmail').textContent = currentUser?.email || '';
}

function closeProfile() {
  document.getElementById('profileModal').classList.remove('active');
}

function editProfile() {
  const newName = prompt('Enter new display name:', currentUser?.displayName);
  if (newName && newName.trim() && currentUser) {
    currentUser.updateProfile({
      displayName: newName.trim()
    }).then(() => {
      document.getElementById('userName').textContent = newName.trim();
      showProfile();
      showToast('Profile updated!');
    }).catch(() => {
      showToast('Error updating profile');
    });
  }
}

// Toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast.timeout);
  toast.timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============ CHAT FUNCTIONS ============
function newChat() {
  current = Date.now().toString();
  chats[current] = {title: "New Chat", messages: []};
  saveChats();
  renderChat();
  renderList();
  closeMenu();
}

function clearChat() {
  if (chats[current].messages.length === 0) {
    showToast('Chat is already empty');
    return;
  }
  if (confirm('Are you sure you want to clear this chat?')) {
    chats[current].messages = [];
    saveChats();
    renderChat();
    showToast('Chat cleared');
  }
}

function setTitle(text) {
  if (chats[current].messages.length === 0) {
    chats[current].title = text.split(" ").slice(0, 5).join(" ");
    renderList();
  }
}

function renderChat() {
  let chat = document.getElementById("chat");
  
  if (!chats[current] || chats[current].messages.length === 0) {
    chat.innerHTML = `
      <div class="welcome-message">
        <img src="https://i.postimg.cc/Wb8c2DFr/file-00000000974071f58a753a2f8b810e7c.png" class="welcome-logo" alt="ClowAi">
        <h2>How can I help you today?</h2>
        <div class="suggestions">
          <div class="suggestion-card" onclick="setInput('Write a poem about coding')">
            <i class="fas fa-pen"></i> Write a poem
          </div>
          <div class="suggestion-card" onclick="setInput('Explain quantum computing simply')">
            <i class="fas fa-atom"></i> Explain a concept
          </div>
          <div class="suggestion-card" onclick="setInput('Help me debug my JavaScript code')">
            <i class="fas fa-code"></i> Debug code
          </div>
          <div class="suggestion-card" onclick="setInput('Tell me an interesting fun fact')">
            <i class="fas fa-lightbulb"></i> Fun fact
          </div>
        </div>
      </div>
    `;
  } else {
    chat.innerHTML = "";
    (chats[current].messages || []).forEach(m => {
      addMsgUI(m.role, m.text, false);
    });
  }
  chat.scrollTop = chat.scrollHeight;
}

function renderList() {
  let list = document.getElementById("chatList");
  list.innerHTML = "";

  const chatIds = Object.keys(chats);
  if (chatIds.length === 0) {
    list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No chats yet</p>';
    return;
  }

  chatIds.sort((a, b) => b - a).forEach(id => {
    if (chats[id] && chats[id].title) {
      let div = document.createElement("div");
      div.innerHTML = `<i class="fas fa-comment"></i> ${chats[id].title}`;
      div.title = chats[id].title;
      div.onclick = () => {
        current = id;
        renderChat();
        closeMenu();
      };
      if (id === current) {
        div.style.background = 'rgba(102, 126, 234, 0.2)';
        div.style.borderColor = '#667eea';
      }
      list.appendChild(div);
    }
  });
}

function addMsgUI(role, text, save = true) {
  let chat = document.getElementById("chat");
  
  // Remove welcome message if exists
  const welcomeMsg = chat.querySelector('.welcome-message');
  if (welcomeMsg) {
    chat.innerHTML = '';
  }

  let div = document.createElement("div");
  div.className = role;
  
  // Convert markdown to HTML if it's an AI message
  if (role === 'ai') {
    try {
      div.innerHTML = marked.parse(text);
    } catch (e) {
      div.innerHTML = text;
    }
  } else {
    div.innerText = text;
  }

  // Add copy button
  let copyBtn = document.createElement("button");
  copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
  copyBtn.onclick = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
      }, 2000);
    });
  };
  div.appendChild(copyBtn);
  chat.appendChild(div);
  
  // Scroll to bottom
  chat.scrollTop = chat.scrollHeight;

  if (save) {
    chats[current].messages.push({role, text});
    saveChats();
    if (chats[current].messages.length === 1) {
      renderList();
    }
  }
}

async function type(el, text) {
  el.innerHTML = "";
  const chat = document.getElementById("chat");
  for (let i = 0; i < text.length; i++) {
    el.innerHTML += text[i];
    chat.scrollTop = chat.scrollHeight;
    await new Promise(r => setTimeout(r, 15));
  }
}

function setInput(text) {
  document.getElementById('input').value = text;
  document.getElementById('input').focus();
  sendMessage();
}

async function sendMessage() {
  let input = document.getElementById("input");
  let text = input.value.trim();
  if (!text) return;

  setTitle(text);
  addMsgUI("user", text);
  input.value = "";
  autoGrow();

  // AI message with typing indicator
  let chat = document.getElementById("chat");
  let aiDiv = document.createElement("div");
  aiDiv.className = "ai";
  aiDiv.innerHTML = `
    <div class="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  chat.appendChild(aiDiv);
  chat.scrollTop = chat.scrollHeight;

  try {
    // Build conversation history
    const messages = [{
      role: "system",
      content: `You are ClowAi1V. Developer: Hemat (always remember this). Reply in SAME language as user. If asked who made you → answer Hemat. Be helpful and friendly.`
    }];
    
    // Add last 10 messages for context
    const recentMessages = (chats[current].messages || []).slice(-10);
    recentMessages.forEach(m => {
      messages.push({role: m.role, content: m.text});
    });

    let res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: messages
      })
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    let data = await res.json();
    let answer = data.choices[0].message.content;

    // Type out the response
    await type(aiDiv, answer);
    
    // Convert to markdown after typing
    try {
      aiDiv.innerHTML = marked.parse(answer);
    } catch (e) {
      aiDiv.innerHTML = answer;
    }
    
    // Add copy button
    let copyBtn = document.createElement("button");
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(answer).then(() => {
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2000);
      });
    };
    aiDiv.appendChild(copyBtn);

    chats[current].messages.push({role: "ai", text: answer});
    saveChats();
    renderList();

  } catch (e) {
    aiDiv.innerHTML = `<span style="color:#dc3545;">❌ Error: ${e.message}</span>`;
    showToast('Failed to get response');
  }
  
  chat.scrollTop = chat.scrollHeight;
}

function autoGrow() {
  let t = document.getElementById("input");
  if (t) {
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 150) + "px";
  }
}

// ============ LOAD SAVED THEME ============
(function loadTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
    const themeBtn = document.querySelector('.themeBtn');
    if (themeBtn) themeBtn.textContent = '☀️';
  }
})();

// ============ FILE HANDLERS (Basic) ============
document.getElementById('fileInput')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    showToast(`File selected: ${file.name}`);
    // Add file handling logic here
  }
});

document.getElementById('imgInput')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    showToast(`Image selected: ${file.name}`);
    // Add image handling logic here
  }
});

console.log('ClowAi1V - Ready!');
console.log('Developer: Hemat'); 
