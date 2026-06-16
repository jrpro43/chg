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
    await auth.sign 
