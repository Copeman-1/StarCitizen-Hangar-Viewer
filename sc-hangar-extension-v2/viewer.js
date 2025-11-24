// Load data from Chrome storage
chrome.storage.local.get(['hangarData', 'conciergeLevel'], (result) => {
    const items = result.hangarData || [];
    const conciergeLevel = result.conciergeLevel || null;
    
    if (items.length === 0) {
        document.getElementById('content').innerHTML = `
            <div class="empty-state">
                <h2>No Hangar Data Found</h2>
                <p>Please extract your hangar data first.</p>
                <p>Go to your RSI Hangar page and click "Extract Hangar Data"</p>
            </div>
        `;
        return;
    }
    
    // Calculate stats
    const totalItems = items.length;
    const totalMelt = items.reduce((sum, item) => sum + (item.meltValue || 0), 0);
    const meltableItems = items.filter(item => item.meltValue > 0).length;
    
    // Build Concierge section if applicable
    let conciergeHtml = '';
    if (conciergeLevel) {
        conciergeHtml = `
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
    
    // Build HTML
    let html = conciergeHtml + `
        <div class="stats-bar">
            <div class="stat-card">
                <div class="stat-label">Total Items</div>
                <div class="stat-value">${totalItems}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Melt Value</div>
                <div class="stat-value">$${totalMelt.toFixed(0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Meltable Items</div>
                <div class="stat-value">${meltableItems}</div>
            </div>
        </div>
        
        <div class="controls">
            <input type="text" class="search-box" id="searchBox" placeholder="🔍 Search items...">
            <select class="sort-select" id="sortSelect">
                <option value="name">Sort by Name</option>
                <option value="melt-high">Melt Value (High to Low)</option>
                <option value="melt-low">Melt Value (Low to High)</option>
                <option value="date-new">Date (Newest First)</option>
                <option value="date-old">Date (Oldest First)</option>
            </select>
        </div>
        
        <div class="items-grid" id="itemsGrid"></div>
    `;
    
    document.getElementById('content').innerHTML = html;
    
    // Render items
    renderItems(items);
    
    // Add event listeners
    document.getElementById('searchBox').addEventListener('input', () => filterAndSort(items));
    document.getElementById('sortSelect').addEventListener('change', () => filterAndSort(items));
});

function renderItems(items) {
    const grid = document.getElementById('itemsGrid');
    if (!grid) return;
    
    grid.innerHTML = items.map(item => {
        // Generate clean filename from ship name for custom backgrounds
        // Example: "L-21 Wolf" -> "l-21-wolf.jpg"
        const shipNameForImage = item.name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
        
        // Try to load custom background image (jpg or png)
        const backgroundStyle = `background: linear-gradient(135deg, rgba(26, 32, 44, 0.75) 0%, rgba(45, 55, 72, 0.75) 100%), url('ship-backgrounds/${shipNameForImage}.jpg') center/cover, url('ship-backgrounds/${shipNameForImage}.png') center/cover;`;
        
        return `
        <div class="item-card" style="${backgroundStyle}">
            <div class="item-header">
                <div class="item-name">${item.name}</div>
                <div class="item-melt">$${item.meltValue || 0}</div>
            </div>
            <div class="item-details">
                <div class="item-detail">
                    <span class="detail-label">Type</span>
                    <span class="detail-value">${item.type || 'Item'}</span>
                </div>
                <div class="item-detail">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">${item.status || 'N/A'}</span>
                </div>
                <div class="item-detail">
                    <span class="detail-label">${item.date && item.date.startsWith('From:') ? 'Upgraded From' : 'Date'}</span>
                    <span class="detail-value">${item.date ? item.date.replace('From: ', '') : 'N/A'}</span>
                </div>
                <div class="item-detail">
                    <span class="detail-label">Insurance</span>
                    <span class="detail-value">${item.insurance || 'N/A'}</span>
                </div>
            </div>
            ${item.meltValue > 0 ? '<span class="tag">✓ Meltable</span>' : ''}
        </div>
    `;
    }).join('');
}

function filterAndSort(allItems) {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const sortBy = document.getElementById('sortSelect').value;
    
    // Filter
    let filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    
    // Sort
    filtered.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'melt-high':
                return (b.meltValue || 0) - (a.meltValue || 0);
            case 'melt-low':
                return (a.meltValue || 0) - (b.meltValue || 0);
            case 'date-new':
                return new Date(b.date) - new Date(a.date);
            case 'date-old':
                return new Date(a.date) - new Date(b.date);
            default:
                return 0;
        }
    });
    
    renderItems(filtered);
}
