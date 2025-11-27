// Main app controller
let hangarData = [];
let buybackData = [];
let wishlistData = [];
let conciergeLevel = null;

const CURRENT_VERSION = '2.0.4';
const GITHUB_REPO = 'Copeman-1/StarCitizen-Hangar-Viewer';

// Check for updates on GitHub
async function checkForUpdates() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        const data = await response.json();
        
        const latestVersion = data.tag_name; // e.g., "2.0.2" or "v2.0.2"
        const cleanLatestVersion = latestVersion.replace(/^v/, ''); // Remove 'v' prefix if present
        
        console.log('Current version:', CURRENT_VERSION);
        console.log('Latest version:', cleanLatestVersion);
        
        if (cleanLatestVersion !== CURRENT_VERSION) {
            // Show update notification
            showUpdateNotification(cleanLatestVersion, data.html_url);
        }
    } catch (error) {
        console.error('Failed to check for updates:', error);
    }
}

// Show update notification
function showUpdateNotification(version, url) {
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        z-index: 3000;
        max-width: 350px;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 10px;">
            🚀 Update Available!
        </div>
        <div style="font-size: 0.9rem; margin-bottom: 15px;">
            Version ${version} is now available. You're on ${CURRENT_VERSION}.
        </div>
        <div style="display: flex; gap: 10px;">
            <a href="${url}" target="_blank" style="
                flex: 1;
                padding: 8px 16px;
                background: white;
                color: #f59e0b;
                text-align: center;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 600;
                font-size: 0.9rem;
            ">Download</a>
            <button id="dismiss-update-btn" style="
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9rem;
            ">Dismiss</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Add dismiss button event listener
    document.getElementById('dismiss-update-btn').addEventListener('click', () => {
        notification.remove();
    });
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// View titles mapping
const viewTitles = {
    fleet: 'Fleet Overview',
    ships: 'Ships',
    vehicles: 'Ground Vehicles',
    paints: 'Paints & Customization',
    equipment: 'Equipment & Armor',
    addons: 'Add-ons & Weapons Kits',
    buyback: 'Buyback Queue',
    wishlist: 'Wishlist',
    statistics: 'Fleet Statistics',
    value: 'Fleet Value Analysis',
    settings: 'Settings'
};

// Load all data on startup
function loadAllData() {
    chrome.storage.local.get(['hangarData', 'buybackData', 'wishlist', 'conciergeLevel'], (result) => {
        hangarData = result.hangarData || [];
        buybackData = result.buybackData || [];
        wishlistData = result.wishlist || [];
        conciergeLevel = result.conciergeLevel || null;
        
        // Generate loaner ships based on concept ships owned
        if (typeof LOANER_MATRIX !== 'undefined' && typeof getLoaner !== 'undefined') {
            const generatedLoaners = [];
            const addedLoaners = new Set(); // Track to avoid duplicates
            
            // Find all concept/in-production ships the user owns
            hangarData.forEach(ship => {
                if (ship.status === 'In Concept' || ship.status === 'In Production') {
                    const loaners = getLoaner(ship.name);
                    
                    if (loaners && loaners.length > 0) {
                        loaners.forEach(loanerName => {
                            // Only add if we haven't already added this loaner
                            if (!addedLoaners.has(loanerName.toLowerCase())) {
                                addedLoaners.add(loanerName.toLowerCase());
                                
                                // Create a loaner ship entry
                                generatedLoaners.push({
                                    id: `loaner-${generatedLoaners.length}`,
                                    name: loanerName,
                                    originalName: loanerName,
                                    type: 'Ship', // Most loaners are ships
                                    status: 'Flight Ready',
                                    insurance: 'N/A',
                                    meltValue: 0,
                                    date: 'N/A',
                                    pledgeId: `loaner-${loanerName}`,
                                    isLoaner: true,
                                    loanerFor: ship.name
                                });
                            }
                        });
                    }
                }
            });
            
            // Add generated loaners to hangarData
            hangarData = [...hangarData, ...generatedLoaners];
            
            console.log(`Generated ${generatedLoaners.length} loaner ships:`, generatedLoaners);
        }
        
        // Render current view
        const activeView = document.querySelector('.sidebar-item.active')?.getAttribute('data-view') || 'fleet';
        renderView(activeView);
    });
}

// Navigation
document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
        const viewName = item.getAttribute('data-view');
        
        // Update active state
        document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Update title
        document.getElementById('viewTitle').textContent = viewTitles[viewName];
        
        // Show view
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${viewName}-view`).classList.add('active');
        
        // Render view
        renderView(viewName);
    });
});

// Render different views
function renderView(viewName) {
    switch(viewName) {
        case 'fleet':
            renderFleetView();
            break;
        case 'ships':
            renderShipsView();
            break;
        case 'vehicles':
            renderVehiclesView();
            break;
        case 'paints':
            renderPaintsView();
            break;
        case 'equipment':
            renderEquipmentView();
            break;
        case 'addons':
            renderAddonsView();
            break;
        case 'buyback':
            renderBuybackView();
            break;
        case 'wishlist':
            renderWishlistView();
            break;
        case 'statistics':
            renderStatisticsView();
            break;
        case 'value':
            renderValueView();
            break;
        case 'settings':
            renderSettingsView();
            break;
    }
}

// Fleet View - Overview of everything
function renderFleetView() {
    const content = document.getElementById('fleet-content');
    
    // Filter out addons, equipment, and paints for fleet display
    const fleetItems = hangarData.filter(i => {
        // Exclude paints
        if (i.type === 'Paint') return false;
        
        // Exclude weapons kits and bundles (addons)
        if (i.type === 'Weapons Kit' || i.type === 'Bundle') return false;
        
        // Exclude equipment (check original name for keywords)
        const nameLower = (i.originalName || i.name).toLowerCase();
        const isEquipment = nameLower.includes('helmet') || 
                           nameLower.includes('core') || 
                           nameLower.includes('arms') || 
                           nameLower.includes('legs') || 
                           nameLower.includes('backpack') ||
                           nameLower.includes('armor') ||
                           nameLower.includes('suit') ||
                           nameLower.includes('gear') ||
                           nameLower.includes('weapon') ||
                           nameLower.includes('gun') ||
                           nameLower.includes('rifle') ||
                           nameLower.includes('pistol');
        
        if (isEquipment && !nameLower.includes('kit')) return false;
        
        return true;
    });
    
    // Exclude loaners from owned counts
    const ownedShips = fleetItems.filter(i => !i.isLoaner && !i.isCustom);
    const loanerShips = fleetItems.filter(i => i.isLoaner);
    
    const totalShips = ownedShips.filter(i => i.type === 'Ship').length;
    const totalVehicles = ownedShips.filter(i => i.type === 'Ground Vehicle').length;
    const totalValue = ownedShips.reduce((sum, i) => sum + (i.meltValue || 0), 0);
    const buybackCount = buybackData.length;
    const wishlistCount = wishlistData.length;
    const loanerCount = loanerShips.length;
    
    let html = '';
    
    // Concierge badge if applicable
    if (conciergeLevel) {
        html += `
            <div style="background: linear-gradient(135deg, rgba(218, 165, 32, 0.15) 0%, rgba(184, 134, 11, 0.15) 100%); 
                        border: 2px solid rgba(218, 165, 32, 0.4); 
                        border-radius: 12px; 
                        padding: 20px; 
                        margin-bottom: 30px;
                        text-align: center;">
                <div style="font-size: 1.1rem; color: #DAA520; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                    Concierge
                </div>
                <div style="font-size: 1.8rem; font-weight: bold; color: #FFD700;">
                    ${conciergeLevel}
                </div>
                <div style="font-size: 0.9rem; color: #B8860B; margin-top: 8px; font-style: italic;">
                    Chairman's Club
                </div>
            </div>
        `;
    }
    
    // Stats grid
    html += `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Ships</div>
                <div class="stat-value">${totalShips}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Ground Vehicles</div>
                <div class="stat-value">${totalVehicles}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Owned</div>
                <div class="stat-value">${ownedShips.length}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Fleet Value</div>
                <div class="stat-value">$${totalValue}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">🔄 Loaners</div>
                <div class="stat-value">${loanerCount}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Buyback Queue</div>
                <div class="stat-value">${buybackCount}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Wishlist</div>
                <div class="stat-value">${wishlistCount}</div>
            </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="color: #3b82f6; margin: 0;">Your Fleet</h3>
            <button id="add-custom-ship-btn" style="
                padding: 10px 20px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.9rem;
            ">+ Add In-Game Ship</button>
        </div>
        <div id="recent-items"></div>
    `;
    
    content.innerHTML = html;
    
    // Add custom ship button handler
    document.getElementById('add-custom-ship-btn').addEventListener('click', showAddCustomShipDialog);
    
    // Render fleet items (ships and vehicles only, no equipment/addons/paints)
    renderItemGrid(fleetItems, 'recent-items');
}

// Ships View
function renderShipsView() {
    const ships = hangarData.filter(i => i.type === 'Ship' && !i.isCustom);
    renderItemGrid(ships, 'ships-content');
}

// Vehicles View
function renderVehiclesView() {
    const vehicles = hangarData.filter(i => i.type === 'Ground Vehicle');
    renderItemGrid(vehicles, 'vehicles-content');
}

// Paints View
function renderPaintsView() {
    const paints = hangarData.filter(i => i.type === 'Paint');
    renderItemGrid(paints, 'paints-content');
}

// Equipment View - Armor and weapons (not kits)
function renderEquipmentView() {
    const equipment = hangarData.filter(i => {
        // Check ORIGINAL name for keywords (before cleaning)
        const nameLower = (i.originalName || i.name).toLowerCase();
        const hasEquipmentKeyword = nameLower.includes('helmet') || 
                                     nameLower.includes('core') || 
                                     nameLower.includes('arms') || 
                                     nameLower.includes('legs') || 
                                     nameLower.includes('backpack') ||
                                     nameLower.includes('weapon') ||
                                     nameLower.includes('gun') ||
                                     nameLower.includes('rifle') ||
                                     nameLower.includes('pistol') ||
                                     nameLower.includes('armor') ||
                                     nameLower.includes('suit') ||
                                     nameLower.includes('gear');
        
        // If it has equipment keywords, include it (even if it's a bundle/package)
        if (hasEquipmentKeyword && !nameLower.includes('kit')) {
            return true;
        }
        
        // Otherwise check if it's equipment type but not a kit
        return (i.type === 'Item' || i.type === 'Flair') && !nameLower.includes('kit');
    });
    renderItemGrid(equipment, 'equipment-content');
}

// Add-ons View - Weapons kits only (not equipment bundles)
function renderAddonsView() {
    const addons = hangarData.filter(i => {
        // Check ORIGINAL name for keywords (before cleaning)
        const nameLower = (i.originalName || i.name).toLowerCase();
        
        // Exclude equipment bundles (those with helmet, core, arms, legs, backpack keywords or "gear")
        const isEquipmentBundle = nameLower.includes('helmet') || 
                                  nameLower.includes('core') || 
                                  nameLower.includes('arms') || 
                                  nameLower.includes('legs') || 
                                  nameLower.includes('backpack') ||
                                  nameLower.includes('armor') ||
                                  nameLower.includes('suit') ||
                                  nameLower.includes('gear');
        
        if (isEquipmentBundle) {
            return false;
        }
        
        // Only show weapons kits and non-equipment bundles
        return i.type === 'Weapons Kit' || i.type === 'Bundle';
    });
    renderItemGrid(addons, 'addons-content');
}

// Buyback View
function renderBuybackView() {
    renderItemGrid(buybackData, 'buyback-content', true);
}

// Wishlist View
function renderWishlistView() {
    const content = document.getElementById('wishlist-content');
    
    let html = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-size: 2rem; color: #60a5fa; margin-bottom: 10px;">⭐ Ship Wishlist</h2>
            <p style="color: #94a3b8;">Browse all Star Citizen ships and build your dream fleet</p>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 30px;">
            <button class="wishlist-tab active" data-tab="all" style="padding: 10px 20px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">All Ships</button>
            <button class="wishlist-tab" data-tab="my-wishlist" style="padding: 10px 20px; background: rgba(51, 65, 85, 0.5); color: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">My Wishlist</button>
            <button class="wishlist-tab" data-tab="my-hangar" style="padding: 10px 20px; background: rgba(51, 65, 85, 0.5); color: #e2e8f0; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">My Hangar</button>
        </div>
        
        <div style="background: rgba(30, 41, 59, 0.6); padding: 20px; border-radius: 12px; border: 2px solid rgba(59, 130, 246, 0.3); margin-bottom: 30px;">
            <h3 style="color: #60a5fa; margin-bottom: 10px;">Wishlist Total</h3>
            <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">$${wishlistData.reduce((sum, s) => sum + s.price, 0)}</div>
            <div style="color: #94a3b8; margin-top: 5px;">${wishlistData.length} ships</div>
        </div>
        
        <div id="wishlist-ships-container"></div>
    `;
    
    content.innerHTML = html;
    
    // Render all ships from database
    renderWishlistShips('all');
    
    // Add tab handlers
    content.querySelectorAll('.wishlist-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            content.querySelectorAll('.wishlist-tab').forEach(t => {
                t.style.background = 'rgba(51, 65, 85, 0.5)';
                t.classList.remove('active');
            });
            tab.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
            tab.classList.add('active');
            renderWishlistShips(tab.getAttribute('data-tab'));
        });
    });
}

function renderWishlistShips(tab) {
    const container = document.getElementById('wishlist-ships-container');
    let ships = [];
    
    if (tab === 'all') {
        ships = SHIPS_DATABASE || [];
    } else if (tab === 'my-wishlist') {
        ships = wishlistData;
    } else if (tab === 'my-hangar') {
        ships = hangarData.map(i => ({
            name: i.name,
            price: i.meltValue,
            status: i.status,
            type: i.type
        }));
    }
    
    if (ships.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">No ships found</div>';
        return;
    }
    
    const html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">${ships.map(ship => {
        const inWishlist = wishlistData.some(s => s.name === ship.name);
        const inHangar = hangarData.some(h => h.name === ship.name);
        
        return `
            <div style="
                background: rgba(30, 41, 59, 0.6);
                border-radius: 8px;
                padding: 20px;
                border: 2px solid ${inWishlist ? 'rgba(34, 197, 94, 0.5)' : 'rgba(59, 130, 246, 0.3)'};
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <div style="font-size: 1.1rem; font-weight: 600; color: white;">${ship.name}</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #f59e0b;">$${ship.price}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 0.75rem; color: #64748b;">Type</div>
                        <div style="color: white;">${ship.type}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #64748b;">Status</div>
                        <div style="color: white;">${ship.status}</div>
                    </div>
                </div>
                ${inHangar ? '<div style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 8px; border-radius: 6px; text-align: center; margin-bottom: 10px; font-weight: 600;">✓ In Your Hangar</div>' : ''}
                <button class="wishlist-toggle-btn" data-ship='${JSON.stringify(ship)}' style="
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    background: ${inWishlist ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'};
                    color: white;
                ">${inWishlist ? '✓ In Wishlist' : '+ Add to Wishlist'}</button>
            </div>
        `;
    }).join('')}</div>`;
    
    container.innerHTML = html;
    
    // Add wishlist toggle handlers
    container.querySelectorAll('.wishlist-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const ship = JSON.parse(btn.getAttribute('data-ship'));
            toggleWishlist(ship);
        });
    });
}

function toggleWishlist(ship) {
    const index = wishlistData.findIndex(s => s.name === ship.name);
    
    if (index > -1) {
        wishlistData.splice(index, 1);
    } else {
        wishlistData.push(ship);
    }
    
    chrome.storage.local.set({ wishlist: wishlistData }, () => {
        renderWishlistView();
    });
}

// Statistics View
function renderStatisticsView() {
    const content = document.getElementById('statistics-content');
    
    // Calculate stats
    const byType = {};
    const byStatus = {};
    const byInsurance = {};
    
    hangarData.forEach(item => {
        byType[item.type] = (byType[item.type] || 0) + 1;
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        byInsurance[item.insurance] = (byInsurance[item.insurance] || 0) + 1;
    });
    
    let html = '<h3 style="margin-bottom: 20px; color: #3b82f6;">Fleet Breakdown</h3>';
    html += '<div class="stats-grid">';
    
    // By Type
    html += '<div class="stat-card"><div class="stat-label">By Type</div>';
    for (const [type, count] of Object.entries(byType)) {
        html += `<div style="display: flex; justify-content: space-between; margin-top: 10px;"><span>${type}</span><span style="color: #3b82f6;">${count}</span></div>`;
    }
    html += '</div>';
    
    // By Status
    html += '<div class="stat-card"><div class="stat-label">By Status</div>';
    for (const [status, count] of Object.entries(byStatus)) {
        html += `<div style="display: flex; justify-content: space-between; margin-top: 10px;"><span>${status}</span><span style="color: #3b82f6;">${count}</span></div>`;
    }
    html += '</div>';
    
    // By Insurance
    html += '<div class="stat-card"><div class="stat-label">By Insurance</div>';
    for (const [insurance, count] of Object.entries(byInsurance)) {
        html += `<div style="display: flex; justify-content: space-between; margin-top: 10px;"><span>${insurance}</span><span style="color: #3b82f6;">${count}</span></div>`;
    }
    html += '</div>';
    
    html += '</div>';
    content.innerHTML = html;
}

// Value View
function renderValueView() {
    const content = document.getElementById('value-content');
    
    const totalValue = hangarData.reduce((sum, i) => sum + (i.meltValue || 0), 0);
    const avgValue = hangarData.length > 0 ? totalValue / hangarData.length : 0;
    const maxValue = Math.max(...hangarData.map(i => i.meltValue || 0));
    const topShips = hangarData.sort((a, b) => (b.meltValue || 0) - (a.meltValue || 0)).slice(0, 10);
    
    let html = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Fleet Value</div>
                <div class="stat-value">$${totalValue}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Value</div>
                <div class="stat-value">$${avgValue.toFixed(0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Highest Value</div>
                <div class="stat-value">$${maxValue}</div>
            </div>
        </div>
        
        <h3 style="margin: 30px 0 20px; color: #3b82f6;">Top 10 Most Valuable</h3>
    `;
    
    content.innerHTML = html;
    renderItemGrid(topShips, 'value-content', false, true);
}

// Settings View
function renderSettingsView() {
    const content = document.getElementById('settings-content');
    
    // Get current border color from storage or use default
    chrome.storage.local.get(['cardBorderColor'], (result) => {
        const currentColor = result.cardBorderColor || '#64748b';
        
        content.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #3b82f6;">Settings</h3>
            
            <div class="stat-card" style="max-width: 600px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 15px;">Appearance</h4>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; color: #94a3b8; margin-bottom: 8px; font-size: 0.9rem;">Card Border Color</label>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <input type="color" id="card-border-color" value="${currentColor}" style="
                            width: 60px;
                            height: 40px;
                            border: 2px solid #334155;
                            border-radius: 6px;
                            cursor: pointer;
                            background: transparent;
                        ">
                        <input type="text" id="card-border-hex" value="${currentColor}" style="
                            flex: 1;
                            padding: 10px;
                            background: rgba(30, 41, 59, 0.5);
                            border: 2px solid #334155;
                            border-radius: 6px;
                            color: white;
                            font-family: monospace;
                        ">
                        <button id="reset-border-color" style="
                            padding: 10px 20px;
                            background: rgba(51, 65, 85, 0.5);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 0.9rem;
                        ">Reset</button>
                    </div>
                    <div style="color: #64748b; font-size: 0.8rem; margin-top: 8px;">
                        Default: #64748b (Slate Gray)
                    </div>
                </div>
                <button id="save-appearance-btn" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Save Appearance Settings</button>
            </div>
            
            <div class="stat-card" style="max-width: 600px;">
                <h4 style="margin-bottom: 15px;">Data Management</h4>
                <button id="clear-data-btn" class="btn btn-secondary" style="width: 100%; margin-top: 10px;">Clear All Data</button>
                <button id="export-data-btn" class="btn btn-secondary" style="width: 100%; margin-top: 10px;">Export to CSV</button>
            </div>
        `;
        
        // Color picker sync
        const colorPicker = document.getElementById('card-border-color');
        const hexInput = document.getElementById('card-border-hex');
        
        colorPicker.addEventListener('input', (e) => {
            hexInput.value = e.target.value;
        });
        
        hexInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                colorPicker.value = value;
            }
        });
        
        // Reset button
        document.getElementById('reset-border-color').addEventListener('click', () => {
            colorPicker.value = '#64748b';
            hexInput.value = '#64748b';
        });
        
        // Save appearance settings
        document.getElementById('save-appearance-btn').addEventListener('click', () => {
            const color = colorPicker.value;
            chrome.storage.local.set({ cardBorderColor: color }, () => {
                // Apply immediately
                applyCardBorderColor(color);
                // Show feedback
                const btn = document.getElementById('save-appearance-btn');
                const originalText = btn.textContent;
                btn.textContent = '✓ Saved!';
                btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 2000);
            });
        });
        
        // Add event listeners for data management
        document.getElementById('clear-data-btn').addEventListener('click', clearAllData);
        document.getElementById('export-data-btn').addEventListener('click', exportData);
    });
}

// Close detail panel (must be defined before openDetailPanel)
window.closeDetailPanel = function() {
    const panel = document.getElementById('detail-panel');
    if (panel) {
        panel.style.right = '-500px';
        setTimeout(() => panel.remove(), 300);
    }
};

// Open detail side panel
function openDetailPanel(item) {
    // Remove existing panel if present
    const existingPanel = document.getElementById('detail-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    // Create new panel
    const panel = document.createElement('div');
    panel.id = 'detail-panel';
    panel.style.cssText = `
        position: fixed;
        right: -500px;
        top: 0;
        width: 500px;
        height: 100vh;
        background: rgba(15, 23, 42, 0.98);
        border-left: 1px solid rgba(51, 65, 85, 0.5);
        z-index: 1000;
        overflow-y: auto;
        transition: right 0.3s;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.5);
    `;
    document.body.appendChild(panel);
    
    // Add click outside to close
    setTimeout(() => {
        document.addEventListener('click', function closeOnClickOutside(e) {
            if (panel && !panel.contains(e.target) && !e.target.closest('.ship-card')) {
                window.closeDetailPanel();
                document.removeEventListener('click', closeOnClickOutside);
            }
        });
    }, 100);
    
    const getBackgroundStyle = (itemName) => {
        const shipNameLower = itemName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const shipNameCap = itemName
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '');
        const baseUrl = 'https://raw.githubusercontent.com/Copeman-1/StarCitizen-Hangar-Data/refs/heads/main/ships/images';
        return `background: url('${baseUrl}/${shipNameCap}.jpg') center/cover, url('${baseUrl}/${shipNameCap}.png') center/cover, url('${baseUrl}/${shipNameLower}.jpg') center/cover, url('${baseUrl}/${shipNameLower}.png') center/cover, url('ship-backgrounds/${shipNameLower}.jpg') center/cover, url('ship-backgrounds/${shipNameLower}.png') center/cover, linear-gradient(135deg, #1e293b 0%, #334155 100%);`;
    };
    
    // Check if this is a loaner or custom
    const isLoaner = item.isLoaner === true;
    const isCustom = item.isCustom === true;
    const originalShip = item.loanerFor || null;
    
    panel.innerHTML = `
        <div style="position: sticky; top: 0; background: rgba(15, 23, 42, 0.98); z-index: 10; padding: 20px; border-bottom: 1px solid rgba(51, 65, 85, 0.5);">
            <button id="close-panel-btn" style="
                position: absolute;
                right: 20px;
                top: 20px;
                background: rgba(51, 65, 85, 0.5);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1.2rem;
                transition: background 0.2s;
            ">✕</button>
            <div style="
                ${getBackgroundStyle(item.name)}
                height: 200px;
                border-radius: 8px;
                margin-bottom: 20px;
            "></div>
            <h2 style="color: white; margin-bottom: 5px;">${item.name}</h2>
            <div style="color: #94a3b8; font-size: 0.9rem;">#${item.pledgeId || item.id}</div>
        </div>
        
        <div style="padding: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div>
                    <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;">Type</div>
                    <div style="color: white; font-size: 1.1rem;">${item.type || 'N/A'}</div>
                </div>
                <div>
                    <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;">Status</div>
                    <div style="color: white; font-size: 1.1rem;">${item.status || 'N/A'}</div>
                </div>
                ${!isLoaner ? `
                    <div>
                        <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;">Insurance</div>
                        <div style="color: white; font-size: 1.1rem;">${item.insurance && item.insurance !== 'N/A' ? item.insurance : '—'}</div>
                    </div>
                ` : `
                    <div>
                        <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;">Loaner For</div>
                        <div style="color: white; font-size: 1.1rem;">${originalShip}</div>
                    </div>
                `}
                ${!isLoaner && !isCustom ? `
                    <div>
                        <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;">Melt Value</div>
                        <div style="color: #f59e0b; font-size: 1.3rem; font-weight: bold;">$${item.meltValue || 0}</div>
                    </div>
                ` : ''}
            </div>
            
            ${isLoaner ? `
                <div style="
                    background: rgba(245, 158, 11, 0.2);
                    border: 1px solid rgba(245, 158, 11, 0.4);
                    padding: 15px;
                    border-radius: 8px;
                    color: #f59e0b;
                    margin-bottom: 20px;
                ">
                    <div style="font-weight: 600; margin-bottom: 5px;">🔄 Loaner Ship</div>
                    <div style="font-size: 0.9rem;">This ship is temporarily provided until ${originalShip} becomes flight ready.</div>
                </div>
            ` : ''}
            
            ${isCustom ? `
                <div style="
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.4);
                    padding: 15px;
                    border-radius: 8px;
                    color: #60a5fa;
                    margin-bottom: 20px;
                ">
                    <div style="font-weight: 600; margin-bottom: 5px;">🎮 In-Game Ship</div>
                    <div style="font-size: 0.9rem;">This ship was added manually and is not part of your pledge hangar.</div>
                </div>
                <button id="delete-custom-ship-btn" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(239, 68, 68, 0.2);
                    border: 2px solid rgba(239, 68, 68, 0.5);
                    color: #ef4444;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.2s;
                ">
                    🗑️ Delete In-Game Ship
                </button>
            ` : ''}
            
            ${item.date && item.date !== 'N/A' ? `
                <div style="margin-bottom: 20px;">
                    <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;">Upgraded From</div>
                    <div style="color: white; font-size: 1.1rem;">${item.date}</div>
                </div>
            ` : ''}
            
            ${item.canUseCredit !== undefined ? `
                <div style="margin-bottom: 20px;">
                    <div style="color: #64748b; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px;">Buyback</div>
                    <div style="color: ${item.canUseCredit ? '#22c55e' : '#ef4444'}; font-size: 1.1rem;">
                        ${item.canUseCredit ? '✓ Can use Store Credit' : '⚠ Fresh Money Required'}
                    </div>
                </div>
            ` : ''}
            
            ${item.meltValue > 0 ? `
                <div style="
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.4);
                    padding: 15px;
                    border-radius: 8px;
                    color: #60a5fa;
                    text-align: center;
                    font-weight: 600;
                ">✓ Meltable</div>
            ` : ''}
        </div>
    `;
    
    // Add click handler to close button
    const closeBtn = panel.querySelector('#close-panel-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.closeDetailPanel();
        });
        
        closeBtn.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(71, 85, 105, 0.8)';
        });
        
        closeBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(51, 65, 85, 0.5)';
        });
    }
    
    // Add delete button handler for custom ships
    if (isCustom) {
        const deleteBtn = panel.querySelector('#delete-custom-ship-btn');
        if (deleteBtn) {
            // Hover effects
            deleteBtn.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(239, 68, 68, 0.3)';
                this.style.borderColor = '#ef4444';
            });
            
            deleteBtn.addEventListener('mouseleave', function() {
                this.style.background = 'rgba(239, 68, 68, 0.2)';
                this.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            });
            
            // Delete handler
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Confirm deletion
                if (confirm(`Are you sure you want to delete "${item.name}" from your fleet?`)) {
                    // Remove from hangarData
                    const index = hangarData.findIndex(ship => ship.id === item.id);
                    if (index > -1) {
                        hangarData.splice(index, 1);
                    }
                    
                    // Update storage
                    chrome.storage.local.get(['hangarData'], (result) => {
                        const storedData = result.hangarData || [];
                        const storedIndex = storedData.findIndex(ship => ship.id === item.id);
                        if (storedIndex > -1) {
                            storedData.splice(storedIndex, 1);
                            chrome.storage.local.set({ hangarData: storedData }, () => {
                                // Close panel
                                window.closeDetailPanel();
                                // Reload view
                                loadAllData();
                            });
                        }
                    });
                }
            });
        }
    }
    
    // Slide in
    setTimeout(() => {
        panel.style.right = '0';
    }, 10);
}

// Render item grid (reusable)
function renderItemGrid(items, containerId, showCredit = false, append = false) {
    const container = document.getElementById(containerId);
    
    if (items.length === 0) {
        if (!append) container.innerHTML = '<div style="text-align: center; padding: 40px; color: #64748b;">No items found</div>';
        return;
    }
    
    const getBackgroundStyle = (itemName) => {
        const shipNameLower = itemName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const shipNameCap = itemName
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-+|-+$/g, '');
        const baseUrl = 'https://raw.githubusercontent.com/Copeman-1/StarCitizen-Hangar-Data/refs/heads/main/ships/images';
        return `background: url('${baseUrl}/${shipNameCap}.jpg') center/cover, url('${baseUrl}/${shipNameCap}.png') center/cover, url('${baseUrl}/${shipNameLower}.jpg') center/cover, url('${baseUrl}/${shipNameLower}.png') center/cover, url('ship-backgrounds/${shipNameLower}.jpg') center/cover, url('ship-backgrounds/${shipNameLower}.png') center/cover, linear-gradient(135deg, #1e293b 0%, #334155 100%);`;
    };
    
    const html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">${items.map((item, index) => {
        // Check if this is marked as a loaner or custom
        const isLoaner = item.isLoaner === true;
        const isCustom = item.isCustom === true;
        const originalShip = item.loanerFor || null;
        
        // Status badges
        const isInConcept = item.status === 'In Concept';
        const isFlightReady = item.status === 'Flight Ready';
        
        return `
        <div class="ship-card" data-item-index="${index}" style="
            ${getBackgroundStyle(item.name)}
            border-radius: 16px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s;
            border: 2px solid ${isLoaner ? 'rgba(245, 158, 11, 0.7)' : isCustom ? 'rgba(59, 130, 246, 0.7)' : 'transparent'};
            position: relative;
            aspect-ratio: 16/9;
        ">
            <div style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%);
                padding: 15px;
            ">
                <div style="font-size: 1.1rem; font-weight: 600; color: white; margin-bottom: 5px;">${item.name}</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 0.85rem; color: #94a3b8;">
                        ${item.type}${!isLoaner && !isCustom && item.insurance && item.insurance !== 'N/A' ? ' - ' + item.insurance : ''}
                        ${isLoaner && originalShip ? ' - Loaner for ' + originalShip : ''}
                        ${isCustom ? ' - In-Game' : ''}
                    </div>
                    ${!isCustom && !isLoaner ? `<div style="
                        background: #f59e0b;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-weight: 600;
                        font-size: 0.9rem;
                    ">$${item.meltValue || 0}</div>` : ''}
                </div>
            </div>
            ${isInConcept ? '<div style="position: absolute; top: 10px; left: 10px; background: rgba(239, 68, 68, 0.95); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">Concept</div>' : ''}
            ${isFlightReady && !isLoaner && !isCustom ? '<div style="position: absolute; top: 10px; left: 10px; background: rgba(34, 197, 94, 0.95); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">Flight Ready</div>' : ''}
            ${isLoaner ? '<div style="position: absolute; top: 10px; left: 10px; background: rgba(245, 158, 11, 0.95); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🔄 Loaner</div>' : ''}
            ${isCustom ? '<div style="position: absolute; top: 10px; left: 10px; background: rgba(59, 130, 246, 0.95); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🎮 In-Game</div>' : ''}
            ${showCredit && item.canUseCredit ? '<div style="position: absolute; top: 10px; right: 10px; background: rgba(34, 197, 94, 0.95); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">✓ Credit</div>' : ''}
        </div>
    `}).join('')}</div>`;
    
    if (append) {
        container.innerHTML += html;
    } else {
        container.innerHTML = html;
    }
    
    // Add click handlers to open side panel
    container.querySelectorAll('.ship-card').forEach((card, index) => {
        card.addEventListener('click', () => {
            openDetailPanel(items[index]);
        });
        
        card.addEventListener('mouseenter', function() {
            this.style.borderColor = '#3b82f6';
            this.style.transform = 'translateY(-4px)';
            this.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.borderColor = 'transparent';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
}

// Apply card border color
function applyCardBorderColor(color) {
    // Create or update style tag
    let styleTag = document.getElementById('custom-card-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'custom-card-styles';
        document.head.appendChild(styleTag);
    }
    
    styleTag.textContent = `
        .ship-card {
            border: 2px solid ${color} !important;
            border-radius: 16px !important;
        }
        
        .ship-card:hover {
            border-color: #3b82f6 !important;
        }
    `;
}

// Load and apply card border color on startup
function loadCardBorderColor() {
    chrome.storage.local.get(['cardBorderColor'], (result) => {
        const color = result.cardBorderColor || '#64748b';
        applyCardBorderColor(color);
    });
}

// Show dialog to add custom in-game ship
function showAddCustomShipDialog() {
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.id = 'custom-ship-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    overlay.innerHTML = `
        <div style="
            background: rgba(15, 23, 42, 0.98);
            border: 2px solid rgba(59, 130, 246, 0.5);
            border-radius: 12px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
        ">
            <h2 style="color: white; margin-bottom: 20px;">Add In-Game Ship</h2>
            <p style="color: #94a3b8; margin-bottom: 20px; font-size: 0.9rem;">
                Add ships you own in-game but aren't in your pledge hangar (bought with aUEC, rentals, etc.)
            </p>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: #94a3b8; margin-bottom: 8px; font-size: 0.9rem;">Ship Name</label>
                <input type="text" id="custom-ship-name" placeholder="e.g., Aegis Avenger Titan" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(30, 41, 59, 0.5);
                    border: 2px solid #334155;
                    border-radius: 8px;
                    color: white;
                    font-size: 1rem;
                ">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; color: #94a3b8; margin-bottom: 8px; font-size: 0.9rem;">Type</label>
                <select id="custom-ship-type" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(30, 41, 59, 0.5);
                    border: 2px solid #334155;
                    border-radius: 8px;
                    color: white;
                    font-size: 1rem;
                ">
                    <option value="Ship">Ship</option>
                    <option value="Ground Vehicle">Ground Vehicle</option>
                </select>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="cancel-custom-ship" style="
                    padding: 10px 20px;
                    background: rgba(51, 65, 85, 0.5);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Cancel</button>
                <button id="save-custom-ship" style="
                    padding: 10px 20px;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">Add Ship</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Focus input
    document.getElementById('custom-ship-name').focus();
    
    // Cancel button
    document.getElementById('cancel-custom-ship').addEventListener('click', () => {
        overlay.remove();
    });
    
    // Save button
    document.getElementById('save-custom-ship').addEventListener('click', () => {
        const name = document.getElementById('custom-ship-name').value.trim();
        const type = document.getElementById('custom-ship-type').value;
        
        if (!name) {
            alert('Please enter a ship name');
            return;
        }
        
        // Create custom ship entry
        const customShip = {
            id: `custom-${Date.now()}`,
            name: name,
            originalName: name,
            type: type,
            status: 'Flight Ready',
            insurance: 'N/A',
            meltValue: 0,
            date: 'N/A',
            pledgeId: `custom-${Date.now()}`,
            isCustom: true
        };
        
        // Add to hangarData
        hangarData.push(customShip);
        
        // Save to storage
        chrome.storage.local.get(['hangarData'], (result) => {
            const storedData = result.hangarData || [];
            storedData.push(customShip);
            chrome.storage.local.set({ hangarData: storedData }, () => {
                overlay.remove();
                loadAllData(); // Reload to show new ship
            });
        });
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// Action buttons
document.getElementById('extractBtn').addEventListener('click', () => {
    window.open('popup.html', '_blank', 'width=450,height=600');
});

document.getElementById('refreshBtn').addEventListener('click', () => {
    loadAllData();
});

// Utility functions
function clearAllData() {
    if (confirm('Are you sure you want to clear all data?')) {
        chrome.storage.local.clear(() => {
            loadAllData();
            alert('All data cleared!');
        });
    }
}

function exportData() {
    // CSV export logic
    let csv = 'Name,Type,Status,Insurance,Melt Value,Upgraded From\n';
    hangarData.forEach(item => {
        csv += `"${item.name}","${item.type}","${item.status}","${item.insurance}",${item.meltValue},"${item.date}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sc-hangar-export.csv';
    a.click();
}

// Initialize
async function initializeApp() {
    // Load card border color
    loadCardBorderColor();
    
    // Load data from GitHub first
    await Promise.all([
        loadShipsDatabase(),
        loadLoanerMatrix()
    ]);
    
    // Then load user data
    loadAllData();
    
    // Check for updates
    checkForUpdates();
}

initializeApp();
