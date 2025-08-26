// Driver setup functionality
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    
    // Check if user is already a verified driver
    checkExistingDriver();
    
    // Setup form handling
    setupDriverForm();
});

async function checkExistingDriver() {
    try {
        const user = JSON.parse(localStorage.getItem('ecomiles_user') || '{}');
        
        // Check if driver profile already exists
        const response = await fetch(`/api/drivers/${user.uid}`);
        if (response.ok) {
            const driver = await response.json();
            if (driver.isVerified) {
                // Driver already exists and is verified, redirect to dashboard
                window.location.href = 'driver-dashboard.html';
                return;
            }
        }
        
        // Pre-fill form with existing user data
        prefillUserData(user);
        
    } catch (error) {
        console.error('Error checking existing driver:', error);
    }
}

function prefillUserData(user) {
    // Pre-fill any available user information
    if (user.name) {
        // Could pre-fill name field if we had one
    }
}

function setupDriverForm() {
    const form = document.getElementById('driverSetupForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Add input validation
    setupFormValidation();
    
    // Handle form submission
    form.addEventListener('submit', handleDriverSetup);
    
    // Real-time validation
    form.addEventListener('input', validateForm);
}

function setupFormValidation() {
    const licenseInput = document.getElementById('licenseNumber');
    const phoneInput = document.getElementById('phoneNumber');
    const emergencyInput = document.getElementById('emergencyContact');
    const vehicleIdInput = document.getElementById('vehicleId');
    const capacityInput = document.getElementById('capacity');
    
    // License number validation
    licenseInput.addEventListener('input', () => {
        const value = licenseInput.value.trim();
        if (value.length < 5) {
            setFieldError(licenseInput, 'License number must be at least 5 characters');
        } else {
            clearFieldError(licenseInput);
        }
    });
    
    // Phone number validation
    phoneInput.addEventListener('input', () => {
        const value = phoneInput.value.trim();
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (value && !phoneRegex.test(value.replace(/\s+/g, ''))) {
            setFieldError(phoneInput, 'Please enter a valid phone number');
        } else {
            clearFieldError(phoneInput);
        }
    });
    
    // Emergency contact validation
    emergencyInput.addEventListener('input', () => {
        const value = emergencyInput.value.trim();
        if (value) {
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
                setFieldError(emergencyInput, 'Please enter a valid phone number');
            } else {
                clearFieldError(emergencyInput);
            }
        } else {
            clearFieldError(emergencyInput);
        }
    });
    
    // Vehicle ID validation
    vehicleIdInput.addEventListener('input', () => {
        const value = vehicleIdInput.value.trim();
        if (value.length < 3) {
            setFieldError(vehicleIdInput, 'Vehicle ID must be at least 3 characters');
        } else {
            clearFieldError(vehicleIdInput);
        }
    });
    
    // Capacity validation
    capacityInput.addEventListener('input', () => {
        const value = parseInt(capacityInput.value);
        if (value < 1 || value > 100) {
            setFieldError(capacityInput, 'Capacity must be between 1 and 100');
        } else {
            clearFieldError(capacityInput);
        }
    });
}

function setFieldError(field, message) {
    field.classList.add('error');
    let errorDiv = field.parentNode.querySelector('.field-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        field.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function validateForm() {
    const form = document.getElementById('driverSetupForm');
    const submitBtn = document.getElementById('submitBtn');
    
    // Check required fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
        }
        if (field.type === 'checkbox' && !field.checked) {
            isValid = false;
        }
    });
    
    // Check for any field errors
    const errors = form.querySelectorAll('.error');
    if (errors.length > 0) {
        isValid = false;
    }
    
    submitBtn.disabled = !isValid;
    return isValid;
}

async function handleDriverSetup(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        showError('Please fill in all required fields correctly');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const form = document.getElementById('driverSetupForm');
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Profile...';
        loadingOverlay.style.display = 'flex';
        
        const user = JSON.parse(localStorage.getItem('ecomiles_user') || '{}');
        
        // Collect form data
        const formData = new FormData(form);
        const driverData = {
            userId: user.uid,
            licenseNumber: formData.get('licenseNumber'),
            phoneNumber: formData.get('phoneNumber'),
            emergencyContact: formData.get('emergencyContact') || null,
            experience: parseInt(formData.get('experience')),
            vehicleId: formData.get('vehicleId'),
            isVerified: false
        };
        
        const vehicleData = {
            vehicleId: formData.get('vehicleId'),
            route: formData.get('route'),
            type: formData.get('vehicleType'),
            capacity: parseInt(formData.get('capacity')),
            driverId: user.uid,
            status: 'inactive',
            passengers: [],
            speed: '0'
        };
        
        // Create driver profile
        const driverResponse = await fetch('/api/drivers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(driverData)
        });
        
        if (!driverResponse.ok) {
            throw new Error('Failed to create driver profile');
        }
        
        // Create vehicle
        const vehicleResponse = await fetch('/api/vehicles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vehicleData)
        });
        
        if (!vehicleResponse.ok) {
            throw new Error('Failed to register vehicle');
        }
        
        // Update user type to driver
        const userResponse = await fetch(`/api/users/${user.uid}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userType: 'driver' })
        });
        
        if (!userResponse.ok) {
            throw new Error('Failed to update user profile');
        }
        
        // Update localStorage
        const updatedUser = { ...user, userType: 'driver' };
        localStorage.setItem('ecomiles_user', JSON.stringify(updatedUser));
        
        // Show success message
        showSuccess();
        
    } catch (error) {
        console.error('Error setting up driver profile:', error);
        showError('Failed to create driver profile. Please try again.');
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Complete Setup';
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function showSuccess() {
    const form = document.getElementById('driverSetupForm');
    const successMessage = document.getElementById('successMessage');
    
    form.style.display = 'none';
    successMessage.style.display = 'block';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function skipSetup() {
    if (confirm('Are you sure you want to skip the driver setup? You can complete it later from your profile.')) {
        window.location.href = 'dashboard.html';
    }
}

function goToDashboard() {
    window.location.href = 'driver-dashboard.html';
}

function openTerms() {
    // Could open a modal or new page with terms
    alert('Terms of Service for drivers would be displayed here.');
}

function openPrivacy() {
    // Could open a modal or new page with privacy policy
    alert('Privacy Policy for drivers would be displayed here.');
}

// Utility function for authentication check
function requireAuth() {
    const user = localStorage.getItem('ecomiles_user');
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('ecomiles_user');
    localStorage.removeItem('ecomiles_login_type');
    window.location.href = 'login.html';
}