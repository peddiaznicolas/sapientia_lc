// config.js - CONFIGURACIÓN GLOBAL
// ============================================================================

// Configuración del API
const CONFIG = {
    API: {
        BASE_URL: window.location.origin,
        TIMEOUT: 30000,
        RETRY_ATTEMPTS: 3
    },
    
    APP: {
        NAME: 'Sapientia License Server',
        VERSION: '2.0.0',
        AUTHOR: 'Pedro Diaz Nicolas'
    },
    
    STORAGE: {
        PREFIX: 'sapientia_',
        KEYS: {
            HARDWARE_INFO: 'hardware_info',
            USER_PREFERENCES: 'user_preferences',
            LAST_TAB: 'last_tab'
        }
    },
    
    DEFAULTS: {
        HARDWARE_FINGERPRINT_VALIDITY: 24 * 60 * 60 * 1000, // 24 horas
        VALIDATION_INTERVAL: 5 * 60 * 1000, // 5 minutos
        LICENSE_TYPES: ['trial', 'standard', 'enterprise', 'unlimited'],
        MODULE_CATEGORIES: [
            'medical', 'retail', 'finance', 'manufacturing',
            'education', 'agriculture', 'real_estate', 'services',
            'logistics', 'custom'
        ]
    },
    
    UI: {
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 500,
        TOAST_DURATION: 5000
    }
};

// Variables globales compartidas

// Configuración específica para backend modular
window.BACKEND_TYPE = "modular";
window.BACKEND_VERSION = "medical_license_server";

window.SAPIENTIA = {
    // Estado global de la aplicación
    state: {
        currentTab: 'dashboard',
        isLoading: false,
        user: null,
        hardwareInfo: null
    },
    
    // Datos compartidos
    data: {
        selectedModules: [],
        availableModules: [],
        allModulesAdmin: [],
        filteredModulesAdmin: [],
        allLicenses: [],
        filteredLicenses: [],
        licenseTypes: []
    },
    
    // Cache para optimizar rendimiento
    cache: {
        modules: null,
        licenseTypes: null,
        lastFetch: {}
    },
    
    // Configuración
    config: CONFIG
};

// Constantes para fácil acceso
const API_BASE = CONFIG.API.BASE_URL;
const STORAGE_PREFIX = CONFIG.STORAGE.PREFIX;

// Funciones de utilidad global
const Utils = {
    // Almacenamiento local
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(STORAGE_PREFIX + key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(STORAGE_PREFIX + key);
                return true;
            } catch (error) {
                console.error('Error removing from localStorage:', error);
                return false;
            }
        },
        
        clear() {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(STORAGE_PREFIX)) {
                        localStorage.removeItem(key);
                    }
                });
                return true;
            } catch (error) {
                console.error('Error clearing localStorage:', error);
                return false;
            }
        }
    },
    
    // Debounce function
    debounce(func, delay = CONFIG.UI.DEBOUNCE_DELAY) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    // Format date
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options })
            .format(new Date(date));
    },
    
    // Format currency
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    // Sanitize HTML
    sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },
    
    // Generate random ID
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            return false;
        }
    }
};

// Logger para debugging
const Logger = {
    debug(...args) {
        if (CONFIG.ENV === 'development') {
            console.log('[DEBUG]', ...args);
        }
    },
    
    info(...args) {
        console.info('[INFO]', ...args);
    },
    
    warn(...args) {
        console.warn('[WARN]', ...args);
    },
    
    error(...args) {
        console.error('[ERROR]', ...args);
    }
};

// Event emitter simple
class EventBus {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, ...args) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    Logger.error('Error in event callback:', error);
                }
            });
        }
    }
}

// Instancia global del event bus
window.SAPIENTIA.events = new EventBus();

// Exportar utilidades para otros módulos
window.Utils = Utils;
window.Logger = Logger;

Logger.info('Sapientia License Server iniciado');