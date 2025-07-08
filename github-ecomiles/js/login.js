
document.addEventListener('DOMContentLoaded', () => {
  if (isUserLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }
  initializeLogin();
});

function initializeLogin() {
  const signInBtn = document.getElementById('googleSignInBtn');
  signInBtn.addEventListener('click', handleGoogleSignIn);

  auth.onAuthStateChanged((user) => {
    if (user) {
      showStatus('Login successful! Redirecting to dashboard...', 'success');
      setTimeout(() => {
        // Redirect based on user type
        if (userType === 'driver') {
            window.location.href = 'driver-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
      }, 1500);
    }
  });
}

async function handleGoogleSignIn(userType = 'user') {
  // Store login type temporarily
  localStorage.setItem('ecomiles_login_type', userType);
  const signInBtn = document.getElementById('googleSignInBtn');
  try {
    signInBtn.disabled = true;
    signInBtn.innerHTML = '<span>⏳</span> Signing in...';
    hideError();
    showStatus('Opening Google sign-in...', 'info');

    await auth.signInWithPopup(googleProvider);
  } catch (error) {
    console.error('Login error:', error);
    signInBtn.disabled = false;
    signInBtn.innerHTML = '<span>🔐</span> Sign in with Google';
    hideStatus();

    let msg = 'Login failed. Please try again.';
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        msg = 'Popup closed. Please try again.'; break;
      case 'auth/popup-blocked':
        msg = 'Popup blocked. Allow popups.'; break;
      case 'auth/network-request-failed':
        msg = 'Network error.'; break;
      case 'auth/too-many-requests':
        msg = 'Too many attempts. Try later.'; break;
    }
    showError(msg);
  }
}

function showError(message) {
  const errorDiv = document.getElementById('loginError');
  errorDiv.textContent = message;
  errorDiv.classList.remove('hidden');
}

function hideError() {
  const errorDiv = document.getElementById('loginError');
  errorDiv.classList.add('hidden');
}

function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('loginStatus');
  statusDiv.textContent = message;
  statusDiv.classList.remove('hidden');
  statusDiv.style.background = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1';
  statusDiv.style.color = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460';
}

function hideStatus() {
  document.getElementById('loginStatus').classList.add('hidden');
}
