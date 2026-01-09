// Page Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showLogin() {
    showPage('loginPage');
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function showRegister() {
    showPage('registerPage');
    document.getElementById('navbar').style.display = 'none';
    document.getElementById('registerForm').reset();
}

function showDashboard() {
    showPage('dashboardPage');
    loadDashboardData();
}

function showForms() {
    showPage('formsPage');
    loadForms();
}

function showEmployees() {
    showPage('employeesPage');
    loadEmployees();
}

function showProfile() {
    showPage('profilePage');
    loadProfile();
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

function checkAuth() {
    const token = getAccessToken();
    if (token) {
        document.getElementById('navbar').style.display = 'block';
        loadUserInfo();
        showDashboard();
    } else {
        showLogin();
    }
}

// Load User Info
async function loadUserInfo() {
    try {
        const user = await authAPI.getProfile();
        localStorage.setItem('user', JSON.stringify(user));
        document.getElementById('navUser').textContent = `Welcome, ${user.username}`;
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const data = await authAPI.login(username, password);
        setTokens(data.access, data.refresh);
        
        showAlert('Login successful!', 'success');
        document.getElementById('navbar').style.display = 'block';
        loadUserInfo();
        showDashboard();
    } catch (error) {
        showError(error);
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();
    
    const password = document.getElementById('regPassword').value;
    const password2 = document.getElementById('regPassword2').value;
    
    if (password !== password2) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    const userData = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        password: password,
        password2: password2,
        first_name: document.getElementById('regFirstName').value,
        last_name: document.getElementById('regLastName').value,
        phone: document.getElementById('regPhone').value,
        address: document.getElementById('regAddress').value
    };
    
    try {
        const data = await authAPI.register(userData);
        setTokens(data.tokens.access, data.tokens.refresh);
        
        showAlert('Registration successful!', 'success');
        document.getElementById('navbar').style.display = 'block';
        loadUserInfo();
        showDashboard();
    } catch (error) {
        showError(error);
    }
}

// Logout
function logout() {
    clearTokens();
    document.getElementById('navbar').style.display = 'none';
    showLogin();
    showAlert('Logged out successfully', 'info');
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const forms = await formsAPI.list();
        const employees = await employeesAPI.list();
        
        document.getElementById('totalForms').textContent = forms.length || 0;
        document.getElementById('totalEmployees').textContent = employees.length || 0;
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load Profile
async function loadProfile() {
    try {
        const user = await authAPI.getProfile();
        
        document.getElementById('profileUsername').value = user.username;
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profileFirstName').value = user.first_name || '';
        document.getElementById('profileLastName').value = user.last_name || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileAddress').value = user.address || '';
    } catch (error) {
        showError(error);
    }
}

// Handle Update Profile
async function handleUpdateProfile(event) {
    event.preventDefault();
    
    const userData = {
        email: document.getElementById('profileEmail').value,
        first_name: document.getElementById('profileFirstName').value,
        last_name: document.getElementById('profileLastName').value,
        phone: document.getElementById('profilePhone').value,
        address: document.getElementById('profileAddress').value
    };
    
    try {
        await authAPI.updateProfile(userData);
        showAlert('Profile updated successfully!', 'success');
        loadUserInfo();
    } catch (error) {
        showError(error);
    }
}

// Handle Change Password
async function handleChangePassword(event) {
    event.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const newPassword2 = document.getElementById('newPassword2').value;
    
    if (newPassword !== newPassword2) {
        showAlert('New passwords do not match', 'error');
        return;
    }
    
    const passwordData = {
        old_password: document.getElementById('oldPassword').value,
        new_password: newPassword,
        new_password2: newPassword2
    };
    
    try {
        await authAPI.changePassword(passwordData);
        showAlert('Password changed successfully!', 'success');
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        showError(error);
    }
}