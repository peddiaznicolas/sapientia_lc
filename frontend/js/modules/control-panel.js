// modules/control-panel.js - PANEL DE CONTROL DE LICENCIAS
// ============================================================================

class ControlPanel {
    constructor() {
        this.allLicenses = [];
        this.filteredLicenses = [];
        this.refreshInterval = 60000; // 1 minuto
        this.intervalId = null;
    }
    
    async load() {
        Logger.debug('Cargando Control Panel...');
        
        try {
            await this.loadControlData();
            this.startAutoRefresh();
            
        } catch (error) {
            Logger.error('Error cargando Control Panel:', error);
            this.showError('Error cargando panel de control');
        }
    }
    
    async loadControlData() {
        try {
            // Cargar datos en paralelo
            const [dashboardStats, allLicenses] = await Promise.all([
                this.loadDashboardStats(),
                this.loadAllLicenses()
            ]);
            
            this.updateDashboard(dashboardStats);
            this.updateLicensesList(allLicenses);
            
        } catch (error) {
            Logger.error('Error cargando datos del control panel:', error);
            throw error;
        }
    }
    
    async loadDashboardStats() {
        try {
            const response = await window.apiClient.getDashboardStats();
            return response.stats || {};
        } catch (error) {
            Logger.warn('Error cargando estadísticas dashboard:', error);
            return {
                total_licenses: 0,
                active_licenses: 0,
                expired_licenses: 0,
                recent_validations_24h: 0
            };
        }
    }
    
    async loadAllLicenses() {
        try {
            const response = await window.apiClient.getAllLicenses();
            this.allLicenses = response.licenses || [];
            this.filteredLicenses = [...this.allLicenses];
            return this.allLicenses;
        } catch (error) {
            Logger.error('Error cargando licencias:', error);
            this.allLicenses = [];
            this.filteredLicenses = [];
            return [];
        }
    }
    
    updateDashboard(stats) {
        // Actualizar contadores
        const elements = {
            totalLicensesCount: stats.total_licenses,
            activeLicensesCount: stats.active_licenses,
            expiredLicensesCount: stats.expired_licenses,
            validations24h: stats.recent_validations_24h
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, value || 0);
            }
        });
    }
    
    animateNumber(element, targetValue) {
        const startValue = parseInt(element.textContent) || 0;
        const difference = targetValue - startValue;
        const steps = 30;
        const stepValue = difference / steps;
        let currentValue = startValue;
        let stepCount = 0;
        
        const timer = setInterval(() => {
            stepCount++;
            currentValue += stepValue;
            
            if (stepCount >= steps) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            
            element.textContent = Math.round(currentValue);
        }, 50);
    }
    
    updateLicensesList(licenses) {
        const container = document.getElementById('licensesList');
        if (!container) return;
        
        if (licenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📄</div>
                    <div class="empty-state-title">No hay licencias</div>
                    <div class="empty-state-description">No se encontraron licencias en el sistema</div>
                </div>
            `;
            return;
        }
        
        this.displayLicenses();
    }
    
    displayLicenses() {
        const container = document.getElementById('licensesList');
        if (!container) return;
        
        const licensesHtml = this.filteredLicenses.map(license => {
            return this.createLicenseItemHtml(license);
        }).join('');
        
        container.innerHTML = licensesHtml;
    }
    
    createLicenseItemHtml(license) {
        const isExpired = new Date(license.expiry_date) < new Date();
        const statusClass = license.is_active ? (isExpired ? 'expired' : 'active') : 'inactive';
        const statusText = license.is_active ? (isExpired ? 'Expirada' : 'Activa') : 'Inactiva';
        const statusIcon = license.is_active ? (isExpired ? '⏰' : '✅') : '❌';
        
        return `
            <div class="license-item ${statusClass}" data-license="${license.id}">
                <div class="license-header">
                    <div class="license-info-section">
                        <div class="license-key">${license.license_key}</div>
                        <div class="license-client">
                            <div class="license-client-name">${license.client_name}</div>
                            <div class="license-client-email">${license.client_email}</div>
                        </div>
                    </div>
                    <div class="license-actions">
                        <span class="license-status ${statusClass}">
                            ${statusIcon} ${statusText}
                        </span>
                        <div class="license-controls">
                            <button class="control-button ${license.is_active ? 'deactivate' : 'activate'}" 
                                    onclick="controlPanel.toggleLicense(${license.id})" 
                                    title="${license.is_active ? 'Desactivar' : 'Activar'} licencia">
                                ${license.is_active ? '🚫 Desactivar' : '✅ Activar'}
                            </button>
                            <button class="control-button info" 
                                    onclick="controlPanel.showLicenseDetails(${license.id})" 
                                    title="Ver detalles">
                                📋 Detalles
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="license-details">
                    <div class="license-info">
                        <div class="info-item">
                            <div class="info-label">Tipo</div>
                            <div class="info-value">🎫 ${license.license_type}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Usuarios</div>
                            <div class="info-value">👥 ${license.current_users}/${license.max_users}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Expira</div>
                            <div class="info-value">📅 ${Utils.formatDate(license.expiry_date)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Validaciones</div>
                            <div class="info-value">🔄 ${license.validation_count}</div>
                        </div>
                    </div>
                    
                    <div class="license-modules">
                        <div class="modules-header">📦 Módulos Permitidos:</div>
                        <div class="modules-list">
                            ${license.allowed_modules.map(module => `
                                <span class="module-tag">
                                    ${module}
                                    <button onclick="controlPanel.blockModule(${license.id}, '${module}')" 
                                            title="Bloquear módulo">❌</button>
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    filterLicenses() {
        const searchTerm = document.getElementById('searchLicenses')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('filterLicenseType')?.value || '';
        const statusFilter = document.getElementById('filterLicenseStatus')?.value || '';
        
        this.filteredLicenses = this.allLicenses.filter(license => {
            const matchesSearch = !searchTerm || 
                license.client_name.toLowerCase().includes(searchTerm) ||
                license.client_email.toLowerCase().includes(searchTerm) ||
                license.license_key.toLowerCase().includes(searchTerm);
            
            const matchesType = !typeFilter || license.license_type === typeFilter;
            
            const isExpired = new Date(license.expiry_date) < new Date();
            let matchesStatus = true;
            if (statusFilter === 'active') matchesStatus = license.is_active && !isExpired;
            if (statusFilter === 'inactive') matchesStatus = !license.is_active;
            if (statusFilter === 'expired') matchesStatus = isExpired;
            
            return matchesSearch && matchesType && matchesStatus;
        });
        
        this.displayLicenses();
    }
    
    async toggleLicense(licenseId) {
        const license = this.allLicenses.find(l => l.id === licenseId);
        if (!license) return;
        
        const action = license.is_active ? 'desactivar' : 'activar';
        const confirmMessage = license.is_active ? 
            '¿Desactivar esta licencia? El cliente no podrá usar los módulos.' : 
            '¿Activar esta licencia?';
        
        if (!confirm(confirmMessage)) return;
        
        try {
            this.showLoadingButton(licenseId, 'Procesando...');
            
            const response = await window.apiClient.toggleLicenseStatus(licenseId);
            
            if (response.success) {
                this.showSuccess(response.message);
                
                // Actualizar estado local
                license.is_active = !license.is_active;
                this.displayLicenses();
                await this.loadDashboardStats().then(stats => this.updateDashboard(stats));
            } else {
                this.showError('Error cambiando estado de licencia');
            }
            
        } catch (error) {
            Logger.error('Error toggling license:', error);
            this.showError(`Error ${action}ndo licencia: ${error.message}`);
        } finally {
            this.hideLoadingButton(licenseId);
        }
    }
    
    async blockModule(licenseId, moduleName) {
        if (!confirm(`¿Bloquear el módulo "${moduleName}" para este cliente?`)) return;
        
        try {
            const response = await window.apiClient.blockModule(licenseId, moduleName);
            
            if (response.success) {
                this.showSuccess(response.message);
                
                // Actualizar estado local
                const license = this.allLicenses.find(l => l.id === licenseId);
                if (license) {
                    license.allowed_modules = response.remaining_modules;
                    this.displayLicenses();
                }
            } else {
                this.showError('Error bloqueando módulo');
            }
            
        } catch (error) {
            Logger.error('Error blocking module:', error);
            this.showError(`Error bloqueando módulo: ${error.message}`);
        }
    }
    
    showLicenseDetails(licenseId) {
        const license = this.allLicenses.find(l => l.id === licenseId);
        if (!license) return;
        
        const modal = this.createLicenseDetailsModal(license);
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 100);
    }
    
    createLicenseDetailsModal(license) {
        const isExpired = new Date(license.expiry_date) < new Date();
        const daysRemaining = Math.ceil((new Date(license.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3 class="modal-title">🛡️ Detalles de Licencia</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                
                <div class="license-details-modal">
                    <div class="detail-section">
                        <h4>🔑 Información Principal</h4>
                        <div class="detail-grid">
                            <div><strong>Clave:</strong> ${license.license_key}</div>
                            <div><strong>Cliente:</strong> ${license.client_name}</div>
                            <div><strong>Email:</strong> ${license.client_email}</div>
                            <div><strong>Tipo:</strong> ${license.license_type}</div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>📅 Fechas y Estado</h4>
                        <div class="detail-grid">
                            <div><strong>Emitida:</strong> ${Utils.formatDate(license.issued_date)}</div>
                            <div><strong>Expira:</strong> ${Utils.formatDate(license.expiry_date)}</div>
                            <div><strong>Estado:</strong> ${license.is_active ? (isExpired ? '⏰ Expirada' : '✅ Activa') : '❌ Inactiva'}</div>
                            <div><strong>Días Restantes:</strong> ${isExpired ? 'Expirada' : `${daysRemaining} días`}</div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>👥 Uso y Límites</h4>
                        <div class="detail-grid">
                            <div><strong>Usuarios Actuales:</strong> ${license.current_users}</div>
                            <div><strong>Usuarios Máximos:</strong> ${license.max_users}</div>
                            <div><strong>Validaciones:</strong> ${license.validation_count}</div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>📦 Módulos</h4>
                        <div class="modules-detail">
                            ${license.allowed_modules.map(module => `
                                <span class="module-tag">${module}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cerrar</button>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    showLoadingButton(licenseId, text) {
        const buttons = document.querySelectorAll(`[data-license="${licenseId}"] .control-button`);
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.innerHTML = `<div class="loading"></div> ${text}`;
        });
    }
    
    hideLoadingButton(licenseId) {
        setTimeout(() => {
            this.displayLicenses();
        }, 500);
    }
    
    startAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.intervalId = setInterval(async () => {
            if (document.querySelector('#control.active')) {
                try {
                    await this.loadControlData();
                } catch (error) {
                    Logger.error('Error en auto-refresh del control panel:', error);
                }
            }
        }, this.refreshInterval);
    }
    
    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
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
    
    destroy() {
        this.stopAutoRefresh();
    }
}

// Instancia global
window.controlPanel = new ControlPanel();

Logger.info('Control Panel initialized');