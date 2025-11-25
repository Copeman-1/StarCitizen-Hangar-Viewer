// Load buyback data from storage
chrome.storage.local.get(['buybackData'], (result) => {
    const items = result.buybackData || [];
    
    if (items.length === 0) {
        return; // Show empty state
    }
    
    renderItems(items);
    updateStats(items);
});

// Tab navigation
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        if (tabName === 'hangar') {
            window.location.href = 'viewer.html';
        } else if (tabName === 'wishlist') {
            window.location.href = 'wishlist.html';
        }
    });
});

// Update statistics
function updateStats(items) {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.meltValue || 0), 0);
    const creditItems = items.filter(item => item.canUseCredit).length;
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalValue').textContent = `$${totalValue}`;
    document.getElementById('creditItems').textContent = creditItems;
}

// Render items
function renderItems(allItems) {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // Filter
    let filtered = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || item.type === typeFilter;
        return matchesSearch && matchesType;
    });
    
    // Sort
    filtered.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortBy === 'value') {
            return (b.meltValue || 0) - (a.meltValue || 0);
        }
        return 0;
    });
    
    const content = document.getElementById('content');
    
    if (filtered.length === 0) {
        content.innerHTML = '<div class="empty-state"><h2>No items found</h2><p>Try adjusting your filters</p></div>';
        return;
    }
    
    // Generate clean filename from ship name for custom backgrounds
    const getBackgroundStyle = (itemName) => {
        const shipNameForImage = itemName.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `background: linear-gradient(135deg, rgba(26, 32, 44, 0.75) 0%, rgba(45, 55, 72, 0.75) 100%), url('ship-backgrounds/${shipNameForImage}.jpg') center/cover, url('ship-backgrounds/${shipNameForImage}.png') center/cover;`;
    };
    
    content.innerHTML = `<div class="items-grid">${filtered.map(item => `
        <div class="item-card" style="${getBackgroundStyle(item.name)}">
            <div class="item-header">
                <div class="item-name">${item.name}</div>
                <div class="item-price">$${item.meltValue || 0}</div>
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
                    <span class="detail-label">Insurance</span>
                    <span class="detail-value">${item.insurance || 'N/A'}</span>
                </div>
                <div class="item-detail">
                    <span class="detail-label">Melted On</span>
                    <span class="detail-value">${item.meltedDate || 'N/A'}</span>
                </div>
            </div>
            ${item.canUseCredit ? '<span class="tag">✓ Store Credit</span>' : '<span class="tag" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;">⚠ Fresh Money</span>'}
        </div>
    `).join('')}</div>`;
}

// Search and filter handlers
document.getElementById('searchBox').addEventListener('input', () => {
    chrome.storage.local.get(['buybackData'], (result) => {
        renderItems(result.buybackData || []);
    });
});

document.getElementById('typeFilter').addEventListener('change', () => {
    chrome.storage.local.get(['buybackData'], (result) => {
        renderItems(result.buybackData || []);
    });
});

document.getElementById('sortBy').addEventListener('change', () => {
    chrome.storage.local.get(['buybackData'], (result) => {
        renderItems(result.buybackData || []);
    });
});
