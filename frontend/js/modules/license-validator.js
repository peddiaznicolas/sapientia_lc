// modules/license-validator.js - VALIDADOR DE LICENCIAS
// ============================================================================

class LicenseValidator {
    constructor() {
        this.availableModules = [];
        this.validationHistory = [];
        this.currentLicenseInfo = null;
    }
    
    async init() {
        Logger.debug('Inicializando License Validator...');
        
        try {
            this.bindEvents();
            await this.loadData();
            this.setupForm();
            
        } catch (error) {
            Logger.error('Error inicializando License Validator:', error);
            this.showError('Error inicializando el validador de licencias');
        }
    }
    
    bindEvents() {
        // Form submission
        const form = document.getElementById('validateLicenseForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validateLicense();
            });
        }
        
        // License key input formatting
        const licenseKeyInput = document.getElementById('validateLicenseKey');
        if (licenseKeyInput) {
            licenseKeyInput.addEventListener('input', (e) => {
                this.formatLicenseKey(e.target);
            });
        }
    }
    
    async loadData() {
        try {
            this.availableModules = await window.cachedApi.getModules();
            Logger.debug('Módulos cargados para validación:', this.availableModules);
            
        } catch (error) {
            Logger.error('Error cargando módulos:', error);
            this.availableModules = [];
        }
    }
    
    setupForm() {
        this.populateModules();
        this.loadValidationHistory();
    }
    
    populateModules() {
        const select = document.getElementById('validateModuleName');
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecciona un módulo...</option>';
        
        this.availableModules.forEach(module => {
            const option = document.createElement('option');
            option.value = module.name;
            option.textContent = module.display_name;
            option.title = module.description || 'Sin descripción';
            select.appendChild(option);
        });
    }
    
    formatLicenseKey(input) {
        let value = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        
        // Formatear como XXX-XXXX-XXXX-XXXX
        const parts = [];
        if (value.length > 0) parts.push(value.substring(0, 3));
        if (value.length > 3) parts.push(value.substring(3, 7));
        if (value.length > 7) parts.push(value.substring(7, 11));
        if (value.length > 11) parts.push(value.substring(11, 15));
        
        input.value = parts.join('-');
    }
    
    async validateLicense() {
        try {
            Logger.debug('Validando licencia...');
            
            if (!this.validateForm()) {
                return;
            }
            
            this.showLoading(true);
            
            const validationData = await this.prepareValidationData();
            const result = await window.apiClient.validateLicense(validationData);
            
            this.displayValidationResult(result);
            this.addToHistory(validationData, result);
            
            Logger.info('Validación completada:', result);
            
        } catch (error) {
            Logger.error('Error validando licencia:', error);
            this.showError(`Error validando licencia: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    validateForm() {
        const licenseKey = document.getElementById('validateLicenseKey').value.trim();
        const moduleName = document.getElementById('validateModuleName').value;
        const userCount = parseInt(document.getElementById('validateUserCount').value);
        
        if (!licenseKey) {
            this.showError('La clave de licencia es requerida');
            return false;
        }
        
        if (!moduleName) {
            this.showError('Debe seleccionar un módulo');
            return false;
        }
        
        if (!userCount || userCount < 1) {
            this.showError('El número de usuarios debe ser mayor a 0');
            return false;
        }
        
        return true;
    }
    
    async prepareValidationData() {
        const hardwareInfo = await window.hardwareDetector.getHardwareInfo();
        
        return {
            license_key: document.getElementById('validateLicenseKey').value.trim(),
            module_name: document.getElementById('validateModuleName').value,
            hardware_info: hardwareInfo,
            user_count: parseInt(document.getElementById('validateUserCount').value)
        };
    }
    
    displayValidationResult(result) {
        const container = document.getElementById('validationResult');
        if (!container) return;
        
        const isValid = result.valid;
        const alertClass = isValid ? 'alert-success' : 'alert-error';
        const icon = isValid ? '✅' : '❌';
        const title = isValid ? 'Licencia Válida' : 'Licencia Inválida';
        
        let html = `<div class="alert ${alertClass}"><h4>${icon} ${title}</h4>`;
        
        if (isValid) {
            html += this.generateValidLicenseHtml(result);
        } else {
            html += this.generateInvalidLicenseHtml(result);
        }
        
        html += '</div>';
        
        container.innerHTML = html;
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    }
    
    generateValidLicenseHtml(result) {
        const expiryDate = new Date(result.expires_at);
        const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        return `
            <div class="validation-details">
                <div class="license-status-grid">
                    <div><strong>Cliente:</strong> ${result.client_name}</div>
                    <div><strong>Tipo:</strong> ${result.license_type}</div>
                    <div><strong>Expira:</strong> ${Utils.formatDate(result.expires_at)}</div>
                    <div><strong>Días Restantes:</strong> ${daysRemaining}</div>
                    <div><strong>Usuarios:</strong> ${result.current_users}/${result.max_users}</div>
                </div>
                
                <div class="license-modules-section">
                    <strong>Módulos Permitidos:</strong>
                    ${result.allowed_modules.map(module => `<span class="module-badge">${module}</span>`).join('')}
                </div>
                
                <div class="validation-actions">
                    <button class="btn btn-primary" onclick="licenseValidator.getLicenseInfo()">📋 Ver Info Completa</button>
                    <button class="btn btn-secondary" onclick="licenseValidator.copyValidationReport()">📋 Copiar Reporte</button>
                </div>
            </div>
        `;
    }
    
    generateInvalidLicenseHtml(result) {
        return `
            <div class="validation-error">
                <div class="error-details">
                    <strong>Error:</strong> ${result.error || result.message}
                </div>
                <div class="validation-actions">
                    <button class="btn btn-primary" onclick="licenseValidator.clearForm()">🔄 Intentar Otra</button>
                    <button class="btn btn-secondary" onclick="navigationManager.showTab('generate')">🎫 Generar Nueva</button>
                </div>
            </div>
        `;
    }
    
    async getLicenseInfo() {
        const licenseKey = document.getElementById('validateLicenseKey').value.trim();
        
        if (!licenseKey) {
            this.showError('Ingrese una clave de licencia primero');
            return;
        }
        
        try {
            this.showLoading(true, 'Obteniendo información...');
            const licenseInfo = await window.apiClient.getLicenseInfo(licenseKey);
            this.displayLicenseInfo(licenseInfo);
            
        } catch (error) {
            this.showError(`Error obteniendo información: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    displayLicenseInfo(licenseInfo) {
        const modal = this.createInfoModal(licenseInfo);
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 100);
    }
    
    createInfoModal(licenseInfo) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📋 Información de Licencia</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="license-info-complete">
                    <div><strong>Cliente:</strong> ${licenseInfo.client_name}</div>
                    <div><strong>Email:</strong> ${licenseInfo.client_email}</div>
                    <div><strong>Tipo:</strong> ${licenseInfo.license_type}</div>
                    <div><strong>Estado:</strong> ${licenseInfo.status}</div>
                    <div><strong>Expira:</strong> ${Utils.formatDate(licenseInfo.expiry_date)}</div>
                    <div><strong>Días Restantes:</strong> ${licenseInfo.days_remaining}</div>
                    <div><strong>Usuarios:</strong> ${licenseInfo.current_users}/${licenseInfo.max_users}</div>
                    <div><strong>Validaciones:</strong> ${licenseInfo.total_validations}</div>
                </div>
            </div>
        `;
        
        this.currentLicenseInfo = licenseInfo;
        return modal;
    }
    
    copyValidationReport() {
        const result = this.getLastValidationResult();
        if (!result) {
            this.showError('No hay resultado para copiar');
            return;
        }
        
        const report = `VALIDACIÓN DE LICENCIA - ${new Date().toLocaleString()}
Licencia: ${result.license_key}
Módulo: ${result.module_name}
Estado: ${result.result.valid ? 'VÁLIDA' : 'INVÁLIDA'}
${result.result.valid ? `Cliente: ${result.result.client_name}` : `Error: ${result.result.error}`}`;
        
        Utils.copyToClipboard(report).then(success => {
            if (success) this.showSuccess('Reporte copiado');
            else this.showError('Error copiando');
        });
    }
    
    addToHistory(validationData, result) {
        const historyEntry = {
            timestamp: Date.now(),
            license_key: validationData.license_key,
            module_name: validationData.module_name,
            result: result
        };
        
        this.validationHistory.unshift(historyEntry);
        if (this.validationHistory.length > 10) {
            this.validationHistory = this.validationHistory.slice(0, 10);
        }
        
        Utils.storage.set('validation_history', this.validationHistory);
    }
    
    loadValidationHistory() {
        this.validationHistory = Utils.storage.get('validation_history', []);
    }
    
    getLastValidationResult() {
        return this.validationHistory.length > 0 ? this.validationHistory[0] : null;
    }
    
    clearForm() {
        const form = document.getElementById('validateLicenseForm');
        if (form) form.reset();
        
        const result = document.getElementById('validationResult');
        if (result) result.style.display = 'none';
    }
    
    showLoading(show = true, text = 'Validando...') {
        const button = document.querySelector('#validateLicenseForm button[type="submit"]');
        if (button) {
            if (show) {
                button.innerHTML = `<div class="loading"></div> ${text}`;
                button.disabled = true;
            } else {
                button.innerHTML = '🔍 Validar Licencia';
                button.disabled = false;
            }
        }
    }
    
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <div class="toast-icon">❌</div>
            <div class="toast-content">
                <div class="toast-title">Error</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        this.showToast(toast);
    }
    
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <div class="toast-icon">✅</div>
            <div class="toast-content">
                <div class="toast-title">Éxito</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        this.showToast(toast);
    }
    
    showToast(toast) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
}

// Instancia global
window.licenseValidator = new LicenseValidator();

Logger.info('License Validator initialized');