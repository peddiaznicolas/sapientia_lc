// control_panel.js - JAVASCRIPT PARA PANEL DE CONTROL
// ============================================================================

let allLicenses = [];
let filteredLicenses = [];

async function loadControlTab() {
    try {
        await loadAdminDashboard();
        await loadAllLicenses();
    } catch (error) {
        console.error('Error cargando panel de control:', error);
    }
}

async function loadAdminDashboard() {
    try {
        const response = await fetch(`${API_BASE}/admin/dashboard`);
        const data = await response.json();
        
        document.getElementById('totalLicensesCount').textContent = data.stats.total_licenses;
        document.getElementById('activeLicensesCount').textContent = data.stats.active_licenses;
        document.getElementById('expiredLicensesCount').textContent = data.stats.expired_licenses;
        document.getElementById('validations24h').textContent = data.stats.recent_validations_24h;
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

async function loadAllLicenses() {
    try {
        const response = await fetch(`${API_BASE}/admin/licenses`);
        const data = await response.json();
        
        allLicenses = data.licenses;
        filteredLicenses = [...allLicenses];
        displayLicenses();
        
    } catch (error) {
        console.error('Error cargando licencias:', error);
        document.getElementById('licensesList').innerHTML = 
            '<div class="alert alert-error">❌ Error cargando licencias</div>';
    }
}

function displayLicenses() {
    const licensesList = document.getElementById('licensesList');
    
    if (filteredLicenses.length === 0) {
        licensesList.innerHTML = '<div class="alert alert-info">📄 No hay licencias que mostrar</div>';
        return;
    }
    
    const licensesHtml = filteredLicenses.map(license => {
        const isExpired = new Date(license.expiry_date) < new Date();
        const statusClass = license.is_active ? (isExpired ? 'expired' : 'active') : 'inactive';
        const statusText = license.is_active ? (isExpired ? 'Expirada' : 'Activa') : 'Inactiva';
        const statusIcon = license.is_active ? (isExpired ? '⏰' : '✅') : '❌';
        
        return `
            <div class="license-item" data-license="${license.id}">
                <div class="license-header">
                    <div>
                        <div class="license-key">${license.license_key}</div>
                        <div class="license-client">
                            <strong>${license.client_name}</strong> 
                            <span style="color: var(--text-secondary);">(${license.client_email})</span>
                        </div>
                    </div>
                    <div class="license-actions">
                        <span class="license-status ${statusClass}">${statusIcon} ${statusText}</span>
                        <button class="btn btn-small btn-${license.is_active ? 'delete' : 'edit'}" 
                                onclick="${license.is_active ? 'deactivate' : 'activate'}License(${license.id})" 
                                title="${license.is_active ? 'Desactivar' : 'Activar'}">
                            ${license.is_active ? '🚫' : '✅'}
                        </button>
                    </div>
                </div>
                <div class="license-details">
                    <div class="license-info">
                        <span>🎫 Tipo: ${license.license_type}</span>
                        <span>👥 Usuarios: ${license.current_users}/${license.max_users}</span>
                        <span>📅 Expira: ${new Date(license.expiry_date).toLocaleDateString()}</span>
                        <span>🔄 Validaciones: ${license.validation_count}</span>
                    </div>
                    <div class="license-modules">
                        <strong>Módulos:</strong>
                        ${license.allowed_modules.map(module => 
                            `<span class="module-tag">${module} 
                                <button onclick="blockModule(${license.id}, '${module}')" title="Bloquear módulo">❌</button>
                            </span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    licensesList.innerHTML = licensesHtml;
}

async function activateLicense(licenseId) {
    if (!confirm('¿Activar esta licencia?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/licenses/${licenseId}/toggle`, {
            method: 'POST'
        });
        
        const result = await response.json();
        if (result.success) {
            alert('✅ ' + result.message);
            await loadAllLicenses();
            await loadAdminDashboard();
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

async function deactivateLicense(licenseId) {
    if (!confirm('¿Desactivar esta licencia? El cliente no podrá usar los módulos.')) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/licenses/${licenseId}/toggle`, {
            method: 'POST'
        });
        
        const result = await response.json();
        if (result.success) {
            alert('✅ ' + result.message);
            await loadAllLicenses();
            await loadAdminDashboard();
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

async function blockModule(licenseId, moduleName) {
    if (!confirm(`¿Bloquear el módulo "${moduleName}" para este cliente?`)) return;
    
    try {
        const response = await fetch(`${API_BASE}/admin/licenses/${licenseId}/block-module?module_name=${moduleName}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        if (result.success) {
            alert('✅ ' + result.message);
            await loadAllLicenses();
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

function filterLicenses() {
    const searchTerm = document.getElementById('searchLicenses').value.toLowerCase();
    const typeFilter = document.getElementById('filterLicenseType').value;
    const statusFilter = document.getElementById('filterLicenseStatus').value;
    
    filteredLicenses = allLicenses.filter(license => {
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
    
    displayLicenses();
}