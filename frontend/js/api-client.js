// api-client.js - CLIENTE API CENTRALIZADO
// ============================================================================

class ApiClient {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
        this.retryAttempts = CONFIG.API.RETRY_ATTEMPTS;
    }
    
    // Método base para hacer peticiones
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.timeout
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                Logger.debug(`API Request: ${finalOptions.method} ${url} (attempt ${attempt})`);
                
                const response = await fetch(url, finalOptions);
                
                if (!response.ok) {
                    const errorData = await response.text();
                    let errorMessage;
                    
                    try {
                        const jsonError = JSON.parse(errorData);
                        errorMessage = jsonError.detail || jsonError.message || `HTTP ${response.status}`;
                    } catch {
                        errorMessage = errorData || `HTTP ${response.status}`;
                    }
                    
                    throw new Error(`${response.status}: ${errorMessage}`);
                }
                
                // const data = await response.json();
                const responseText = await response.text();
console.log('Raw response:', responseText);
console.log('Response headers:', [...response.headers.entries()]);

let data;
try {
    data = JSON.parse(responseText);
} catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    console.error('Response that failed to parse:', responseText);
    throw new Error(`Invalid JSON response: ${parseError.message}`);
}
                Logger.debug(`API Response: ${finalOptions.method} ${url}`, data);
                
                return data;
                
            } catch (error) {
                lastError = error;
                Logger.warn(`API attempt ${attempt} failed:`, error.message);
                
                if (attempt === this.retryAttempts) {
                    Logger.error(`API request failed after ${this.retryAttempts} attempts:`, error);
                    throw error;
                }
                
                // Wait before retry (exponential backoff)
                await this.sleep(Math.pow(2, attempt - 1) * 1000);
            }
        }
        
        throw lastError;
    }
    
    // Helper para esperar
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Métodos HTTP específicos
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    
    // ============================================================================
    // ENDPOINTS ESPECÍFICOS DE LICENCIAS
    // ============================================================================
    
    // Salud del sistema
    async getHealth() {
        return this.get('/health');
    }
    
    async getSystemInfo() {
        return this.get('/api/info');  // ← ESTO DEVUELVE JSON
    }
    
    // Tipos de licencia
    async getLicenseTypes() {
        return this.get('/license/types');
    }
    
    // Módulos
    async getModules() {
        return this.get('/license/modules');
    }
    
    async getAdminModules() {
        return this.get('/admin/modules');
    }
    
    async createModule(moduleData) {
        return this.post('/admin/modules', moduleData);
    }
    
    async updateModule(moduleId, moduleData) {
        return this.put(`/admin/modules/${moduleId}`, moduleData);
    }
    
    async deleteModule(moduleId) {
        return this.delete(`/admin/modules/${moduleId}`);
    }
    
    // Licencias
    async requestLicense(licenseData) {
        return this.post('/license/request', licenseData);
    }
    
    async validateLicense(validationData) {
        return this.post('/license/validate', validationData);
    }
    
    async getLicenseInfo(licenseKey) {
        return this.get(`/license/info/${licenseKey}`);
    }
    
    async renewLicense(licenseKey, renewalDays = 365) {
        return this.post(`/license/renew/${licenseKey}?renewal_days=${renewalDays}`);
    }
    
    async deactivateLicense(licenseKey) {
        return this.post(`/license/deactivate/${licenseKey}`);
    }
    
    // Administración de licencias
    async getDashboardStats() {
        return this.get('/admin/dashboard');
    }
    
    async getAllLicenses() {
        return this.get('/admin/licenses');
    }
    
    async toggleLicenseStatus(licenseId) {
        return this.post(`/admin/licenses/${licenseId}/toggle`);
    }
    
    async blockModule(licenseId, moduleName) {
        return this.post(`/admin/licenses/${licenseId}/block-module?module_name=${moduleName}`);
    }
    
    async getPurchases() {
        return this.get('/admin/purchases');
    }
    
    // Estadísticas
    async getAdminStats() {
        return this.get('/admin/stats');
    }
    
    async getCategories() {
        return this.get('/admin/categories');
    }
}

// Instancia global del cliente API
window.apiClient = new ApiClient();

// Sistema de caché inteligente
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.ttl = new Map(); // Time To Live
    }
    
    set(key, data, ttlMs = 300000) { // 5 minutos por defecto
        this.cache.set(key, data);
        this.ttl.set(key, Date.now() + ttlMs);
    }
    
    get(key) {
        const expiry = this.ttl.get(key);
        if (expiry && Date.now() > expiry) {
            this.delete(key);
            return null;
        }
        return this.cache.get(key);
    }
    
    delete(key) {
        this.cache.delete(key);
        this.ttl.delete(key);
    }
    
    clear() {
        this.cache.clear();
        this.ttl.clear();
    }
    
    // Limpiar items expirados
    cleanup() {
        const now = Date.now();
        for (const [key, expiry] of this.ttl.entries()) {
            if (now > expiry) {
                this.delete(key);
            }
        }
    }
}

// Instancia global del cache
window.cacheManager = new CacheManager();

// Limpiar cache cada 5 minutos
setInterval(() => {
    window.cacheManager.cleanup();
}, 5 * 60 * 1000);

// Wrapper con cache para datos que no cambian frecuentemente
const CachedApi = {
    async getLicenseTypes() {
        const cacheKey = 'license_types';
        let data = window.cacheManager.get(cacheKey);
        
        if (!data) {
            data = await window.apiClient.getLicenseTypes();
            window.cacheManager.set(cacheKey, data, 600000); // 10 minutos
        }
        
        return data;
    },
    
    async getModules() {
        const cacheKey = 'modules';
        let data = window.cacheManager.get(cacheKey);
        
        if (!data) {
            data = await window.apiClient.getModules();
            window.cacheManager.set(cacheKey, data, 300000); // 5 minutos
        }
        
        return data;
    }
};

// Exportar API con cache
window.cachedApi = CachedApi;

Logger.info('API Client initialized');