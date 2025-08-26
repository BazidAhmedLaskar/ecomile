document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase if not already done
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  if (isUserLoggedIn()) {
    redirectToDashboard();
    return;
  }
  initializeLogin();
});

// Auth state functions
function isUserLoggedIn() {
  return firebase.auth().currentUser !== null;
}

function redirectToDashboard() {
  const userType = localStorage.getItem('ecomiles_login_type') || 'user';
  window.location.href = userType === 'driver' 
    ? 'driver-dashboard.html' 
    : 'dashboard.html';
}

// Login initialization
function initializeLogin() {
  const auth = firebase.auth();
  const googleProvider = new firebase.auth.GoogleAuthProvider();
  
  // Set up both buttons with proper error handling
  const userBtn = document.getElementById('userSignInBtn');
  const driverBtn = document.getElementById('driverSignInBtn');
  
  if (userBtn) {
    userBtn.addEventListener('click', () => handleGoogleSignIn('user', auth, googleProvider));
  } else {
    console.error('User sign-in button not found');
  }
  
  if (driverBtn) {
    driverBtn.addEventListener('click', () => handleGoogleSignIn('driver', auth, googleProvider));
  } else {
    console.error('Driver sign-in button not found');
  }

  // Auth state listener
  auth.onAuthStateChanged((user) => {
    if (user) {
      showStatus('Login successful! Redirecting...', 'success');
      setTimeout(redirectToDashboard, 1500);
    }
  });
}

// Unified Google Sign-In handler
async function handleGoogleSignIn(userType, auth, provider) {
  localStorage.setItem('ecomiles_login_type', userType);
  
  const signInBtn = userType === 'driver' 
    ? document.getElementById('driverSignInBtn') 
    : document.getElementById('userSignInBtn');
  
  if (!signInBtn) {
    console.error('Sign in button not found');
    showError('System error. Please refresh the page.');
    return;
  }

  // Save original button state
  const originalHTML = signInBtn.innerHTML;
  const originalDisabled = signInBtn.disabled;

  try {
    // Update UI
    signInBtn.disabled = true;
    signInBtn.innerHTML = '<span class="spinner">⏳</span> Signing in...';
    hideError();
    showStatus('Opening Google sign-in...', 'info');

    // Add slight delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Perform sign-in
    await auth.signInWithPopup(provider);
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Reset button state
    signInBtn.disabled = originalDisabled;
    signInBtn.innerHTML = originalHTML;
    hideStatus();

    // Handle specific error cases
    let msg = 'Login failed. Please try again.';
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        msg = 'Sign-in was canceled.'; break;
      case 'auth/popup-blocked':
        msg = 'Popup blocked! Please allow popups for this site.'; break;
      case 'auth/network-request-failed':
        msg = 'Network error. Please check your connection.'; break;
      case 'auth/too-many-requests':
        msg = 'Too many attempts. Please try again later.'; break;
      case 'auth/cancelled-popup-request':
        msg = 'Another sign-in attempt is already in progress.'; break;
    }
    
    showError(msg);
  }
}

// UI helper functions
function showError(message) {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }
}

function hideError() {
  const errorDiv = document.getElementById('loginError');
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
}

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('loginStatus');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.classList.remove('hidden');
    statusDiv.style.background = type === 'success' ? '#d4edda' : 
                               type === 'error' ? '#f8d7da' : '#d1ecf1';
    statusDiv.style.color = type === 'success' ? '#155724' : 
                           type === 'error' ? '#721c24' : '#0c5460';
  }
}

function hideStatus() {
  const statusDiv = document.getElementById('loginStatus');
  if (statusDiv) {
    statusDiv.classList.add('hidden');
  }
}
