// hardware-detection.js - DETECCIÓN DE HARDWARE DEL CLIENTE
// ============================================================================

class HardwareDetector {
    constructor() {
        this.hardwareInfo = null;
        this.detectionMethods = [
            'detectBasicInfo',
            'detectAdvancedInfo', 
            'detectBrowserInfo',
            'detectNetworkInfo'
        ];
    }
    
    async detectHardware() {
        Logger.debug('Iniciando detección de hardware...');
        
        try {
            const info = {
                mac_address: await this.getMACAddress(),
                processor_id: await this.getProcessorInfo(),
                motherboard_serial: await this.getMotherboardSerial(),
                disk_serial: await this.getDiskSerial(),
                os_info: this.getOSInfo(),
                hostname: this.getHostname(),
                browser_info: this.getBrowserInfo(),
                screen_info: this.getScreenInfo(),
                timezone: this.getTimezone(),
                language: this.getLanguage(),
                detected_at: new Date().toISOString()
            };
            
            this.hardwareInfo = info;
            
            // Guardar en cache local
            Utils.storage.set(CONFIG.STORAGE.KEYS.HARDWARE_INFO, info);
            
            // Emitir evento
            window.SAPIENTIA.events.emit('hardwareDetected', info);
            
            Logger.info('Hardware detectado exitosamente:', info);
            return info;
            
        } catch (error) {
            Logger.error('Error detectando hardware:', error);
            return this.getFallbackHardwareInfo();
        }
    }
    
    async getMACAddress() {
        try {
            // Intentar obtener MAC address (funciona solo en algunos entornos)
            if (navigator.connection && navigator.connection.effectiveType) {
                // Usar información de conexión como fallback
                const connection = navigator.connection;
                return this.generateMACFromConnection(connection);
            }
            
            // Usar canvas fingerprinting como alternativa
            return this.generateCanvasFingerprint();
            
        } catch (error) {
            Logger.warn('No se pudo obtener MAC address real, usando fingerprint');
            return this.generateBrowserFingerprint();
        }
    }
    
    generateCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Dibujar texto único
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Hardware Detection - Sapientia', 2, 2);
            
            // Obtener data del canvas
            const canvasData = canvas.toDataURL();
            
            // Crear hash del canvas
            let hash = 0;
            for (let i = 0; i < canvasData.length; i++) {
                const char = canvasData.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convertir a 32bit int
            }
            
            // Formatear como MAC address
            const hex = Math.abs(hash).toString(16).padStart(12, '0').substring(0, 12);
            return hex.match(/.{2}/g).join(':').toUpperCase();
            
        } catch (error) {
            return this.generateRandomMAC();
        }
    }
    
    generateBrowserFingerprint() {
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            navigator.platform,
            new Date().getTimezoneOffset()
        ].join('|');
        
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        const hex = Math.abs(hash).toString(16).padStart(12, '0').substring(0, 12);
        return hex.match(/.{2}/g).join(':').toUpperCase();
    }
    
    generateRandomMAC() {
        // Generar MAC address válida pero aleatoria
        let mac = '';
        for (let i = 0; i < 6; i++) {
            if (i > 0) mac += ':';
            mac += Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
        }
        return mac;
    }
    
    async getProcessorInfo() {
        try {
            // Intentar usar API de hardware (limitada)
            if (navigator.hardwareConcurrency) {
                let cpuInfo = `${navigator.hardwareConcurrency} cores`;
                
                // Agregar información de rendimiento si está disponible
                if (window.performance && window.performance.memory) {
                    const memory = window.performance.memory;
                    cpuInfo += ` - ${Math.round(memory.jsHeapSizeLimit / 1048576)}MB heap`;
                }
                
                return cpuInfo;
            }
            
            return this.estimateProcessorFromUserAgent();
            
        } catch (error) {
            return 'Unknown Processor';
        }
    }
    
    estimateProcessorFromUserAgent() {
        const ua = navigator.userAgent;
        
        if (ua.includes('Intel')) return 'Intel Processor';
        if (ua.includes('AMD')) return 'AMD Processor';
        if (ua.includes('ARM')) return 'ARM Processor';
        if (ua.includes('x86_64')) return 'x86_64 Processor';
        if (ua.includes('x86')) return 'x86 Processor';
        
        // Detectar por plataforma
        if (navigator.platform.includes('Mac')) return 'Apple Silicon/Intel';
        if (navigator.platform.includes('Win')) return 'Intel/AMD x86_64';
        if (navigator.platform.includes('Linux')) return 'Linux Processor';
        
        return `Unknown (${navigator.platform})`;
    }
    
    async getMotherboardSerial() {
        // No es posible obtener serial de motherboard desde el navegador
        // Usar un identificador único basado en características del sistema
        try {
            const systemInfo = [
                navigator.platform,
                screen.width + 'x' + screen.height + 'x' + screen.colorDepth,
                navigator.hardwareConcurrency || 'unknown',
                this.getTimezone()
            ].join('-');
            
            // Crear hash único
            let hash = 0;
            for (let i = 0; i < systemInfo.length; i++) {
                const char = systemInfo.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            
            return 'MB-' + Math.abs(hash).toString(16).toUpperCase();
            
        } catch (error) {
            return 'MB-UNKNOWN';
        }
    }
    
    async getDiskSerial() {
        // No es posible obtener serial de disco desde el navegador
        // Usar storage disponible como indicador
        try {
            let storageInfo = 'DISK';
            
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                if (estimate.quota) {
                    storageInfo += `-${Math.round(estimate.quota / 1073741824)}GB`;
                }
            }
            
            // Agregar información del localStorage
            const localStorageSize = this.getLocalStorageSize();
            storageInfo += `-LS${localStorageSize}`;
            
            return storageInfo;
            
        } catch (error) {
            return 'DISK-UNKNOWN';
        }
    }
    
    getLocalStorageSize() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return Math.round(total / 1024); // KB
        } catch (error) {
            return 0;
        }
    }
    
    getOSInfo() {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        
        // Windows
        if (ua.includes('Windows NT 10.0')) return 'Windows 10/11';
        if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
        if (ua.includes('Windows NT 6.1')) return 'Windows 7';
        if (ua.includes('Windows')) return 'Windows';
        
        // macOS
        if (ua.includes('Mac OS X')) {
            const version = ua.match(/Mac OS X ([0-9_]+)/);
            if (version) {
                return `macOS ${version[1].replace(/_/g, '.')}`;
            }
            return 'macOS';
        }
        
        // Linux
        if (ua.includes('Linux')) {
            if (ua.includes('Ubuntu')) return 'Ubuntu Linux';
            if (ua.includes('Fedora')) return 'Fedora Linux';
            if (ua.includes('CentOS')) return 'CentOS Linux';
            return 'Linux';
        }
        
        // Mobile
        if (ua.includes('Android')) {
            const version = ua.match(/Android ([0-9.]+)/);
            return version ? `Android ${version[1]}` : 'Android';
        }
        
        if (ua.includes('iPhone OS')) {
            const version = ua.match(/iPhone OS ([0-9_]+)/);
            return version ? `iOS ${version[1].replace(/_/g, '.')}` : 'iOS';
        }
        
        return `${platform} - ${navigator.userAgent.substring(0, 50)}...`;
    }
    
    getHostname() {
        try {
            // Intentar obtener hostname real (solo en algunos entornos)
            if (location.hostname && location.hostname !== 'localhost') {
                return location.hostname;
            }
            
            // Usar información del navegador para crear un hostname único
            const browserName = this.getBrowserName();
            const timestamp = Date.now().toString(36);
            
            return `${browserName}-${timestamp}`;
            
        } catch (error) {
            return 'unknown-host';
        }
    }
    
    getBrowserName() {
        const ua = navigator.userAgent;
        
        if (ua.includes('Chrome') && !ua.includes('Chromium')) return 'chrome';
        if (ua.includes('Firefox')) return 'firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
        if (ua.includes('Edge')) return 'edge';
        if (ua.includes('Opera')) return 'opera';
        
        return 'unknown';
    }
    
    getBrowserInfo() {
        return {
            name: this.getBrowserName(),
            version: this.getBrowserVersion(),
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine,
            cookies_enabled: navigator.cookieEnabled
        };
    }
    
    getBrowserVersion() {
        const ua = navigator.userAgent;
        let match;
        
        if ((match = ua.match(/Chrome\/([0-9.]+)/))) return match[1];
        if ((match = ua.match(/Firefox\/([0-9.]+)/))) return match[1];
        if ((match = ua.match(/Safari\/([0-9.]+)/))) return match[1];
        if ((match = ua.match(/Edge\/([0-9.]+)/))) return match[1];
        if ((match = ua.match(/Opera\/([0-9.]+)/))) return match[1];
        
        return 'unknown';
    }
    
    getScreenInfo() {
        return {
            width: screen.width,
            height: screen.height,
            color_depth: screen.colorDepth,
            pixel_depth: screen.pixelDepth,
            available_width: screen.availWidth,
            available_height: screen.availHeight,
            device_pixel_ratio: window.devicePixelRatio || 1
        };
    }
    
    getTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (error) {
            return `UTC${-new Date().getTimezoneOffset() / 60}`;
        }
    }
    
    getLanguage() {
        return {
            primary: navigator.language,
            all: navigator.languages || [navigator.language]
        };
    }
    
    getFallbackHardwareInfo() {
        return {
            mac_address: this.generateRandomMAC(),
            processor_id: 'Unknown Processor',
            motherboard_serial: 'MB-FALLBACK',
            disk_serial: 'DISK-FALLBACK',
            os_info: navigator.platform,
            hostname: 'fallback-host',
            browser_info: this.getBrowserInfo(),
            screen_info: this.getScreenInfo(),
            timezone: this.getTimezone(),
            language: this.getLanguage(),
            detected_at: new Date().toISOString(),
            is_fallback: true
        };
    }
    
    // Obtener hardware info cacheada
    getCachedHardwareInfo() {
        const cached = Utils.storage.get(CONFIG.STORAGE.KEYS.HARDWARE_INFO);
        if (cached && cached.detected_at) {
            const age = Date.now() - new Date(cached.detected_at).getTime();
            if (age < CONFIG.DEFAULTS.HARDWARE_FINGERPRINT_VALIDITY) {
                return cached;
            }
        }
        return null;
    }
    
    // Método público para obtener hardware info (con cache)
    async getHardwareInfo(forceRefresh = false) {
        if (!forceRefresh) {
            const cached = this.getCachedHardwareInfo();
            if (cached) {
                Logger.debug('Usando hardware info cacheada');
                return cached;
            }
        }
        
        return await this.detectHardware();
    }
    
    // Mostrar información detectada en UI
    displayHardwareInfo(containerId = 'hardwareInfo') {
        const container = document.getElementById(containerId);
        if (!container || !this.hardwareInfo) return;
        
        const info = this.hardwareInfo;
        container.innerHTML = `
            <div class="hardware-info">
                <h4>🖥️ Hardware Detectado:</h4>
                <div class="info-grid">
                    <div><strong>MAC:</strong> ${info.mac_address}</div>
                    <div><strong>Procesador:</strong> ${info.processor_id}</div>
                    <div><strong>OS:</strong> ${info.os_info}</div>
                    <div><strong>Host:</strong> ${info.hostname}</div>
                    <div><strong>Navegador:</strong> ${info.browser_info.name} ${info.browser_info.version}</div>
                    <div><strong>Resolución:</strong> ${info.screen_info.width}x${info.screen_info.height}</div>
                    <div><strong>Zona Horaria:</strong> ${info.timezone}</div>
                    <div><strong>Idioma:</strong> ${info.language.primary}</div>
                </div>
                ${info.is_fallback ? '<div class="alert alert-warning">⚠️ Información básica (limitaciones del navegador)</div>' : ''}
            </div>
        `;
    }
}

// Instancia global
window.hardwareDetector = new HardwareDetector();

// Auto-detectar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await window.hardwareDetector.detectHardware();
        Logger.info('Hardware detector initialized');
    } catch (error) {
        Logger.error('Error initializing hardware detector:', error);
    }
});