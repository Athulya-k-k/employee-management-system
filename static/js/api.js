// API Configuration
const API_BASE_URL = window.location.origin;

// Token Management
function getAccessToken() {
    return localStorage.getItem('access_token');
}

function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}

function setTokens(access, refresh) {
    localStorage.setItem('access_token', access);
    if (refresh) {
        localStorage.setItem('refresh_token', refresh);
    }
}

function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
}

// Generic API Request Function
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAccessToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token && !options.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, config);
        
        // Handle 401 - Try to refresh token
        if (response.status === 401 && !options.skipRefresh) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                // Retry the request with new token
                return apiRequest(endpoint, { ...options, skipRefresh: true });
            } else {
                // Refresh failed, redirect to login
                showLogin();
                return null;
            }
        }
        
        // Check if response has content
        const contentType = response.headers.get('content-type');
        const hasJsonContent = contentType && contentType.includes('application/json');
        
        // For 204 No Content or responses without JSON, return success indicator
        if (response.status === 204 || !hasJsonContent) {
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }
            return { success: true, status: response.status };
        }
        
        // Parse JSON response
        const data = await response.json();
        
        if (!response.ok) {
            throw data;
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Refresh Access Token
async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            setTokens(data.access, null);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Token refresh error:', error);
        return false;
    }
}

// Auth API Calls
const authAPI = {
    login: (username, password) => 
        apiRequest('/api/users/login/', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify({ username, password })
        }),
    
    register: (userData) => 
        apiRequest('/api/users/register/', {
            method: 'POST',
            skipAuth: true,
            body: JSON.stringify(userData)
        }),
    
    getProfile: () => 
        apiRequest('/api/users/profile/', {
            method: 'GET'
        }),
    
    updateProfile: (userData) => 
        apiRequest('/api/users/profile/', {
            method: 'PATCH',
            body: JSON.stringify(userData)
        }),
    
    changePassword: (passwordData) => 
        apiRequest('/api/users/change-password/', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        })
};

// Forms API Calls
const formsAPI = {
    list: () => 
        apiRequest('/api/employees/forms/', {
            method: 'GET'
        }),
    
    get: (id) => 
        apiRequest(`/api/employees/forms/${id}/`, {
            method: 'GET'
        }),
    
    create: (formData) => 
        apiRequest('/api/employees/forms/', {
            method: 'POST',
            body: JSON.stringify(formData)
        }),
    
    update: (id, formData) => 
        apiRequest(`/api/employees/forms/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(formData)
        }),
    
    delete: (id) => 
        apiRequest(`/api/employees/forms/${id}/`, {
            method: 'DELETE'
        }),
    
    reorderFields: (id, fieldOrders) => 
        apiRequest(`/api/employees/forms/${id}/reorder_fields/`, {
            method: 'POST',
            body: JSON.stringify({ field_orders: fieldOrders })
        })
};

// Employees API Calls
const employeesAPI = {
    list: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/api/employees/records/?${queryString}` : '/api/employees/records/';
        return apiRequest(endpoint, {
            method: 'GET'
        });
    },
    
    get: (id) => 
        apiRequest(`/api/employees/records/${id}/`, {
            method: 'GET'
        }),
    
    create: (employeeData) => 
        apiRequest('/api/employees/records/', {
            method: 'POST',
            body: JSON.stringify(employeeData)
        }),
    
    update: (id, employeeData) => 
        apiRequest(`/api/employees/records/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(employeeData)
        }),
    
    delete: (id) => 
        apiRequest(`/api/employees/records/${id}/`, {
            method: 'DELETE'
        }),
    
    bulkDelete: (ids) => 
        apiRequest('/api/employees/records/bulk_delete/', {
            method: 'POST',
            body: JSON.stringify({ ids })
        }),
    
    getSearchFields: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/api/employees/records/search_fields/?${queryString}` : '/api/employees/records/search_fields/';
        return apiRequest(endpoint, {
            method: 'GET'
        });
    }
};

// Utility Functions
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    if (type === 'info') {
        alert.innerHTML = message; // Allow HTML for detailed views
    } else {
        alert.textContent = message;
    }
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, type === 'info' ? 5000 : 3000);
}

function showError(error) {
    let message = 'An error occurred';
    
    if (typeof error === 'string') {
        message = error;
    } else if (error.detail) {
        message = error.detail;
    } else if (error.message) {
        message = error.message;
    } else if (typeof error === 'object') {
        // Handle field errors
        const errors = Object.entries(error).map(([key, value]) => {
            if (Array.isArray(value)) {
                return `${key}: ${value.join(', ')}`;
            }
            return `${key}: ${value}`;
        });
        message = errors.join('\n');
    }
    
    showAlert(message, 'error');
}