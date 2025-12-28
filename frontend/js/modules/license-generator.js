// modules/license-generator.js - GENERADOR DE LICENCIAS
// ============================================================================

class LicenseGenerator {
    constructor() {
        this.selectedModules = [];
        this.hardwareInfo = null;
        this.licenseTypes = [];
        this.availableModules = [];
    }
    
    async init() {
        Logger.debug('Inicializando License Generator...');
        
        try {
            this.bindEvents();
            await this.loadData();
            await this.setupForm();
            
        } catch (error) {
            Logger.error('Error inicializando License Generator:', error);
            this.showError('Error inicializando el generador de licencias');
        }
    }
    
    bindEvents() {
        // Form submission
        const form = document.getElementById('generateLicenseForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateLicense();
            });
            
            form.addEventListener('reset', () => {
                this.resetForm();
            });
        }
        
        // Module selection
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('module-checkbox')) {
                this.updateSelectedModules();
            }
        });
        
        // License type change
        const licenseTypeSelect = document.getElementById('licenseType');
        if (licenseTypeSelect) {
            licenseTypeSelect.addEventListener('change', () => {
                this.updateModuleAvailability();
            });
        }
    }
    
    async loadData() {
        try {
            // Cargar datos en paralelo
            const [licenseTypes, modules] = await Promise.all([
                window.cachedApi.getLicenseTypes(),
                window.cachedApi.getModules()
            ]);
            
            this.licenseTypes = licenseTypes;
            this.availableModules = modules;
            
            Logger.debug('Datos cargados:', { licenseTypes, modules });
            
        } catch (error) {
            Logger.error('Error cargando datos:', error);
            throw error;
        }
    }
    
    async setupForm() {
        this.populateLicenseTypes();
        this.populateModules();
        await this.detectHardware();
    }
    
    populateLicenseTypes() {
        const select = document.getElementById('licenseType');
        if (!select) return;
        
        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Selecciona un tipo de licencia...</option>';
        
        // Agregar tipos de licencia
        this.licenseTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.name;
            option.textContent = `${type.name} - $${type.price} (${type.max_users} usuarios, ${type.duration_days} días)`;
            option.title = type.description;
            select.appendChild(option);
        });
    }
    
    populateModules() {
        const container = document.getElementById('modulesList');
        if (!container) return;
        
        if (this.availableModules.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No hay módulos disponibles</div>';
            return;
        }
        
        // Agrupar módulos por categoría
        const modulesByCategory = this.groupModulesByCategory();
        
        let html = '<div class="modules-grid">';
        
        Object.entries(modulesByCategory).forEach(([category, modules]) => {
            html += `
                <div class="module-category">
                    <h4 class="category-title">${this.getCategoryDisplayName(category)}</h4>
                    <div class="module-list">
            `;
            
          modules.forEach(module => {
    html += `
        <label style="display: block; background: #2a2a2a; border: 1px solid #333; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; cursor: pointer; color: #fff;" class="module-item">
            <div style="display: flex; align-items: flex-start; gap: 1rem;">
                <input type="checkbox" class="module-checkbox" 
                       value="${module.name}" 
                       data-min-license="${module.min_license_level}"
                       style="margin-top: 4px;">
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 1.1rem; color: #00ffff; margin-bottom: 0.5rem;">${module.display_name}</div>
                    <div style="color: #d1d5db; margin-bottom: 0.5rem; line-height: 1.4;">${module.description || 'Sin descripción'}</div>
                    <div style="display: flex; gap: 1rem; font-size: 0.8rem; color: #6b7280;">
                        <span>🏷️ ${module.version}</span>
                        <span>🎫 Min: ${module.min_license_level}</span>
                    </div>
                </div>
            </div>
        </label>
    `;
});
            
            html += '</div></div>';
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    groupModulesByCategory() {
        const groups = {};
        
        this.availableModules.forEach(module => {
            const category = module.category || 'other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(module);
        });
        
        return groups;
    }
    
    getCategoryDisplayName(category) {
        const names = {
            'medical': '🏥 Médico',
            'retail': '🛒 Retail',
            'finance': '💰 Financiero',
            'manufacturing': '🏭 Manufactura',
            'education': '🎓 Educación',
            'agriculture': '🌱 Agricultura',
            'real_estate': '🏠 Bienes Raíces',
            'services': '🔧 Servicios',
            'logistics': '🚚 Logística',
            'custom': '⚙️ Personalizado',
            'other': '📦 Otros'
        };
        
        return names[category] || `📦 ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    }
    
    updateSelectedModules() {
        const checkboxes = document.querySelectorAll('.module-checkbox:checked');
        this.selectedModules = Array.from(checkboxes).map(cb => cb.value);
        
        Logger.debug('Módulos seleccionados:', this.selectedModules);
        this.updateModuleCount();
        this.validateLicenseType();
    }
    
    updateModuleCount() {
        const count = this.selectedModules.length;
        
        // Mostrar contador si existe
        const counter = document.getElementById('moduleCount');
        if (counter) {
            counter.textContent = `${count} módulo${count !== 1 ? 's' : ''} seleccionado${count !== 1 ? 's' : ''}`;
        }
        
        // Actualizar en el estado global
        window.SAPIENTIA.data.selectedModules = this.selectedModules;
    }
    
    updateModuleAvailability() {
        const selectedLicenseType = document.getElementById('licenseType').value;
        if (!selectedLicenseType) return;
        
        const licenseType = this.licenseTypes.find(lt => lt.name === selectedLicenseType);
        if (!licenseType) return;
        
        // Habilitar/deshabilitar módulos según nivel de licencia
        const checkboxes = document.querySelectorAll('.module-checkbox');
        
        checkboxes.forEach(checkbox => {
            const minLicense = checkbox.dataset.minLicense;
            const moduleItem = checkbox.closest('.module-item');
            
            if (this.canAccessModule(licenseType.name, minLicense)) {
                checkbox.disabled = false;
                moduleItem.classList.remove('disabled');
            } else {
                checkbox.disabled = true;
                checkbox.checked = false;
                moduleItem.classList.add('disabled');
            }
        });
        
        this.updateSelectedModules();
        this.validateModuleCount(licenseType);
    }
    
    canAccessModule(licenseType, minLicense) {
        const hierarchy = ['trial', 'standard', 'enterprise', 'unlimited'];
        const licenseIndex = hierarchy.indexOf(licenseType);
        const minIndex = hierarchy.indexOf(minLicense);
        
        return licenseIndex >= minIndex;
    }
    
    validateLicenseType() {
        const licenseTypeSelect = document.getElementById('licenseType');
        const selectedType = licenseTypeSelect.value;
        
        if (!selectedType) return;
        
        const licenseType = this.licenseTypes.find(lt => lt.name === selectedType);
        this.validateModuleCount(licenseType);
    }
    
    validateModuleCount(licenseType) {
        if (!licenseType) return;
        
        const maxModules = licenseType.max_modules;
        const selectedCount = this.selectedModules.length;
        
        const warning = document.getElementById('moduleCountWarning');
        if (warning) warning.remove();
        
        if (maxModules > 0 && selectedCount > maxModules) {
            const warningHtml = `
                <div class="alert alert-warning" id="moduleCountWarning">
                    ⚠️ Has seleccionado ${selectedCount} módulos. 
                    El tipo de licencia "${licenseType.name}" permite máximo ${maxModules} módulos.
                </div>
            `;
            
            const modulesList = document.getElementById('modulesList');
            if (modulesList) {
                modulesList.insertAdjacentHTML('afterend', warningHtml);
            }
        }
    }
    
    async detectHardware() {
        try {
            Logger.debug('Detectando hardware automáticamente...');
            
            this.hardwareInfo = await window.hardwareDetector.getHardwareInfo();
            
            // Mostrar información detectada
            this.displayHardwareInfo();
            
        } catch (error) {
            Logger.error('Error detectando hardware:', error);
            this.showHardwareError();
        }
    }
    
    displayHardwareInfo() {
        if (!this.hardwareInfo) return;
        
        const button = document.querySelector('button[onclick*="detectHardware"]');
        if (button) {
            button.innerHTML = '✅ Hardware Detectado';
            button.classList.add('btn-success');
            button.disabled = false;
        }
        
        // Mostrar detalles si hay un contenedor
        const container = document.getElementById('hardwareDetails');
        if (container) {
            window.hardwareDetector.displayHardwareInfo('hardwareDetails');
        }
    }
    
    showHardwareError() {
        const button = document.querySelector('button[onclick*="detectHardware"]');
        if (button) {
            button.innerHTML = '❌ Error de Detección - Reintentar';
            button.classList.add('btn-danger');
        }
    }
    
    async generateLicense() {
        try {
            Logger.debug('Generando licencia...');
            
            // Validar formulario
            if (!this.validateForm()) {
                return;
            }
            
            // Mostrar loading
            this.showLoading(true);
            
            // Preparar datos de la licencia
            const licenseData = this.prepareLicenseData();
            
            // Generar licencia
            const response = await window.apiClient.requestLicense(licenseData);
            
            // Mostrar resultado
            this.displayLicenseResult(response);
            
            Logger.info('Licencia generada exitosamente:', response);
            
        } catch (error) {
            Logger.error('Error generando licencia:', error);
            this.showError(`Error generando licencia: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    validateForm() {
        const clientName = document.getElementById('clientName').value.trim();
        const clientEmail = document.getElementById('clientEmail').value.trim();
        const licenseType = document.getElementById('licenseType').value;
        
        if (!clientName) {
            this.showError('El nombre del cliente es requerido');
            return false;
        }
        
        if (!clientEmail) {
            this.showError('El email del cliente es requerido');
            return false;
        }
        
        if (!licenseType) {
            this.showError('Debe seleccionar un tipo de licencia');
            return false;
        }
        
        if (this.selectedModules.length === 0) {
            this.showError('Debe seleccionar al menos un módulo');
            return false;
        }
        
        if (!this.hardwareInfo) {
            this.showError('Debe detectar el hardware del cliente');
            return false;
        }
        
        return true;
    }
    
    prepareLicenseData() {
        return {
            client_name: document.getElementById('clientName').value.trim(),
            client_email: document.getElementById('clientEmail').value.trim(),
            license_type: document.getElementById('licenseType').value,
            hardware_info: this.hardwareInfo,
            requested_modules: this.selectedModules
        };
    }
    
    displayLicenseResult(response) {
        const container = document.getElementById('licenseResult');
        if (!container) return;
        
        const resultHtml = `
            <div class="alert alert-success">
                <h4>✅ Licencia Generada Exitosamente</h4>
                
                <div class="license-details">
                    <div class="license-key-display">
                        <label>🔑 Clave de Licencia:</label>
                        <div class="license-key-value">
                            ${response.license_key}
                            <button class="btn btn-small btn-secondary" 
                                    onclick="licenseGenerator.copyToClipboard('${response.license_key}')">
                                📋 Copiar
                            </button>
                        </div>
                    </div>
                    
                    <div class="license-info-grid">
                        <div class="info-item">
                            <label>👤 Cliente:</label>
                            <span>${response.client_name}</span>
                        </div>
                        <div class="info-item">
                            <label>🎫 Tipo:</label>
                            <span>${response.license_type}</span>
                        </div>
                        <div class="info-item">
                            <label>📅 Expira:</label>
                            <span>${Utils.formatDate(response.expires_at || response.expiry_date)}</span>
                        </div>
                        <div class="info-item">
                            <label>👥 Usuarios:</label>
                            <span>${response.max_users}</span>
                        </div>
                    </div>
                    
                    <div class="license-modules">
                        <label>📦 Módulos:</label>
                        <div class="modules-tags">
                            ${response.allowed_modules.map(module => 
                                `<span class="module-tag">${module}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="license-actions">
                    <button class="btn btn-primary" onclick="licenseGenerator.downloadLicense()">
                        💾 Descargar Licencia
                    </button>
                    <button class="btn btn-secondary" onclick="licenseGenerator.emailLicense()">
                        📧 Enviar por Email
                    </button>
                    <button class="btn btn-secondary" onclick="licenseGenerator.resetForm()">
                        🔄 Generar Otra
                    </button>
                </div>
            </div>
        `;
        
        container.innerHTML = resultHtml;
        container.style.display = 'block';
        
        // Scroll to result
        container.scrollIntoView({ behavior: 'smooth' });
        
        // Store result for actions
        this.lastGeneratedLicense = response;
    }
    
    async copyToClipboard(text) {
        try {
            await Utils.copyToClipboard(text);
            this.showSuccess('Clave de licencia copiada al portapapeles');
        } catch (error) {
            this.showError('Error copiando al portapapeles');
        }
    }
    
    downloadLicense() {
        if (!this.lastGeneratedLicense) return;
        
        const licenseData = {
            license_key: this.lastGeneratedLicense.license_key,
            client_name: this.lastGeneratedLicense.client_name,
            license_type: this.lastGeneratedLicense.license_type,
            expiry_date: this.lastGeneratedLicense.expires_at || this.lastGeneratedLicense.expiry_date,
            max_users: this.lastGeneratedLicense.max_users,
            allowed_modules: this.lastGeneratedLicense.allowed_modules,
            generated_at: new Date().toISOString(),
            generated_by: 'Sapientia License Server'
        };
        
        const dataStr = JSON.stringify(licenseData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `license_${this.lastGeneratedLicense.license_key.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showSuccess('Licencia descargada exitosamente');
    }
    
    emailLicense() {
        if (!this.lastGeneratedLicense) return;
        
        const subject = encodeURIComponent('Nueva Licencia Sapientia');
        const body = encodeURIComponent(`
Estimado/a ${this.lastGeneratedLicense.client_name},

Su nueva licencia ha sido generada exitosamente:

🔑 Clave de Licencia: ${this.lastGeneratedLicense.license_key}
🎫 Tipo: ${this.lastGeneratedLicense.license_type}
📅 Válida hasta: ${Utils.formatDate(this.lastGeneratedLicense.expires_at || this.lastGeneratedLicense.expiry_date)}
👥 Usuarios permitidos: ${this.lastGeneratedLicense.max_users}
📦 Módulos: ${this.lastGeneratedLicense.allowed_modules.join(', ')}

Por favor, guarde esta información de manera segura.

Saludos,
Sapientia License Server
        `);
        
        const email = this.lastGeneratedLicense.client_email || '';
        const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
        
        window.open(mailtoLink);
        this.showSuccess('Cliente de email abierto');
    }
    
    resetForm() {
        const form = document.getElementById('generateLicenseForm');
        if (form) {
            form.reset();
        }
        
        this.selectedModules = [];
        this.hardwareInfo = null;
        
        // Ocultar resultado
        const result = document.getElementById('licenseResult');
        if (result) {
            result.style.display = 'none';
        }
        
        // Reset hardware detection
        const button = document.querySelector('button[onclick*="detectHardware"]');
        if (button) {
            button.innerHTML = '🖥️ Detectar Hardware Automáticamente';
            button.className = 'btn btn-secondary';
            button.disabled = false;
        }
        
        // Limpiar warnings
        const warnings = document.querySelectorAll('#moduleCountWarning');
        warnings.forEach(w => w.remove());
        
        Logger.debug('Formulario reseteado');
    }
    
    showLoading(show = true) {
        const button = document.querySelector('#generateLicenseForm button[type="submit"]');
        if (button) {
            if (show) {
                button.innerHTML = '<div class="loading"></div> Generando...';
                button.disabled = true;
            } else {
                button.innerHTML = '⚡ Generar Licencia';
                button.disabled = false;
            }
        }
    }
    
    showError(message) {
        const toast = this.createToast('error', 'Error', message);
        this.showToast(toast);
    }
    
    showSuccess(message) {
        const toast = this.createToast('success', 'Éxito', message);
        this.showToast(toast);
    }
    
    createToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${type === 'error' ? '❌' : '✅'}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        return toast;
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
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Instancia global
window.licenseGenerator = new LicenseGenerator();

Logger.info('License Generator initialized');