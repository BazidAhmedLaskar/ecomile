document.addEventListener('DOMContentLoaded', () => {
  if (isUserLoggedIn()) {
    redirectToDashboard();
    return;
  }
  initializeLogin();
});

function isUserLoggedIn() {
  return auth.currentUser !== null;
}

function redirectToDashboard() {
  const userType = localStorage.getItem('ecomiles_login_type') || 'user';
  window.location.href = userType === 'driver' 
    ? 'driver-dashboard.html' 
    : 'dashboard.html';
}

function initializeLogin() {
  // Set up both buttons
  document.getElementById('userSignInBtn').addEventListener('click', () => handleGoogleSignIn('user'));
  document.getElementById('driverSignInBtn').addEventListener('click', () => handleGoogleSignIn('driver'));

  auth.onAuthStateChanged((user) => {
    if (user) {
      showStatus('Login successful! Redirecting...', 'success');
      setTimeout(redirectToDashboard, 1500);
    }
  });
}

async function handleGoogleSignIn(userType) {
  localStorage.setItem('ecomiles_login_type', userType);
  const signInBtn = userType === 'driver' 
    ? document.getElementById('driverSignInBtn') 
    : document.getElementById('userSignInBtn');
  
  if (!signInBtn) {
    console.error('Sign in button not found');
    return;
  }

  try {
    signInBtn.disabled = true;
    signInBtn.innerHTML = '<span class="spinner">⏳</span> Signing in...';
    hideError();
    showStatus('Opening Google sign-in...', 'info');

    await auth.signInWithPopup(googleProvider);
  } catch (error) {
    console.error('Login error:', error);
    signInBtn.disabled = false;
    // Reset to original button text based on user type
    signInBtn.innerHTML = userType === 'driver' 
      ? '<span>🚌</span> Continue as Driver' 
      : '<span>🚶</span> Continue as Passenger';
    hideStatus();

    let msg = 'Login failed. Please try again.';
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        msg = 'Popup closed. Please try again.'; break;
      case 'auth/popup-blocked':
        msg = 'Popup blocked. Please allow popups.'; break;
      case 'auth/network-request-failed':
        msg = 'Network error. Please check your connection.'; break;
      case 'auth/too-many-requests':
        msg = 'Too many attempts. Try again later.'; break;
    }
    showError(msg);
  }
}

// ... (keep the existing showError, hideError, showStatus, hideStatus functions)
