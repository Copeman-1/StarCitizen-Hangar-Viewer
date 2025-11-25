let allShips = [];
let wishlist = [];

// Load wishlist from storage
chrome.storage.local.get(['wishlist'], (result) => {
    wishlist = result.wishlist || [];
    updateWishlistTotal();
    loadShips();
});

// Show tab
function showTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#allShipsTab, #wishlistTab').forEach(t => t.classList.remove('active'));
    
    if (tab === 'allShips') {
        document.querySelectorAll('.tab')[0].classList.add('active');
        document.getElementById('allShipsTab').classList.add('active');
        renderAllShips(allShips);
    } else {
        document.querySelectorAll('.tab')[1].classList.add('active');
        document.getElementById('wishlistTab').classList.add('active');
        renderWishlist();
    }
}

// Load ships from database
async function loadShips() {
    const content = document.getElementById('allShipsContent');
    content.innerHTML = '<div class="loading">Loading ships...</div>';
    
    // Use the ships database
    allShips = SHIPS_DATABASE || [];
    
    if (allShips.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <h2>Ships database not found</h2>
                <p>Make sure ships-database.js is loaded correctly.</p>
            </div>
        `;
        console.error('SHIPS_DATABASE is empty or undefined');
    } else {
        console.log(`✓ Loaded ${allShips.length} ships from database`);
        renderAllShips(allShips);
    }
}

// Render all ships
function renderAllShips(ships) {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const availabilityFilter = document.getElementById('availabilityFilter').value;
    
    let filtered = ships.filter(ship => 
        ship.name.toLowerCase().includes(searchTerm)
    );
    
    // Filter by availability
    if (availabilityFilter === 'available') {
        // Available means purchasable - typically Flight Ready or limited availability
        filtered = filtered.filter(ship => {
            const status = ship.status.toLowerCase();
            return !status.includes('unavailable') && 
                   !status.includes('sold out') && 
                   !status.includes('limited');
        });
    } else if (availabilityFilter === 'unavailable') {
        filtered = filtered.filter(ship => {
            const status = ship.status.toLowerCase();
            return status.includes('unavailable') || 
                   status.includes('sold out') || 
                   status.includes('limited');
        });
    }
    
    const content = document.getElementById('allShipsContent');
    
    if (filtered.length === 0) {
        content.innerHTML = '<div class="empty-state"><h2>No ships found</h2><p>Try adjusting your filters</p></div>';
        return;
    }
    
    content.innerHTML = `<div class="items-grid">${filtered.map(ship => renderShipCard(ship)).join('')}</div>`;
}

// Render wishlist
function renderWishlist() {
    const content = document.getElementById('wishlistContent');
    
    if (wishlist.length === 0) {
        content.innerHTML = '<div class="empty-state"><h2>Your wishlist is empty</h2><p>Add ships from the All Ships tab</p></div>';
        return;
    }
    
    content.innerHTML = `<div class="items-grid">${wishlist.map(ship => renderShipCard(ship, true)).join('')}</div>`;
}

// Render ship card
function renderShipCard(ship, isWishlistView = false) {
    const inWishlist = wishlist.some(s => s.name === ship.name);
    
    return `
        <div class="item-card ${inWishlist ? 'in-wishlist' : ''}" data-ship-name="${ship.name}">
            <div class="item-header">
                <div class="item-name">${ship.name}</div>
                <div class="item-price">$${ship.price}</div>
            </div>
            <div class="item-details">
                <div class="item-detail">
                    <span class="detail-label">Type</span>
                    <span class="detail-value">${ship.type}</span>
                </div>
                <div class="item-detail">
                    <span class="detail-label">Status</span>
                    <span class="detail-value">${ship.status}</span>
                </div>
            </div>
            <button class="wishlist-btn ${inWishlist ? 'remove' : 'add'}" data-ship='${JSON.stringify(ship)}'>
                ${inWishlist ? '✓ In Wishlist' : '+ Add to Wishlist'}
            </button>
        </div>
    `;
}

// Event delegation for wishlist buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('wishlist-btn')) {
        const shipData = e.target.getAttribute('data-ship');
        if (shipData) {
            const ship = JSON.parse(shipData);
            toggleWishlist(ship);
        }
    }
});

// Toggle wishlist
function toggleWishlist(ship) {
    const index = wishlist.findIndex(s => s.name === ship.name);
    
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(ship);
    }
    
    // Save to storage
    chrome.storage.local.set({ wishlist: wishlist }, () => {
        updateWishlistTotal();
        
        // Re-render current view
        const activeTab = document.querySelector('.tab.active');
        if (activeTab.textContent.includes('Wishlist')) {
            renderWishlist();
        } else {
            renderAllShips(allShips);
        }
    });
}

// Update wishlist total
function updateWishlistTotal() {
    const total = wishlist.reduce((sum, ship) => sum + ship.price, 0);
    document.getElementById('wishlistTotal').textContent = `$${total}`;
    document.getElementById('wishlistCount').textContent = `${wishlist.length} ship${wishlist.length !== 1 ? 's' : ''}`;
}

// Search functionality
document.getElementById('searchBox').addEventListener('input', () => {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab.textContent.includes('All Ships')) {
        renderAllShips(allShips);
    }
});

// Availability filter
document.getElementById('availabilityFilter').addEventListener('change', () => {
    renderAllShips(allShips);
});

// Tab navigation
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        if (tabName === 'hangar') {
            window.location.href = 'viewer.html';
        } else {
            showTab(tabName);
        }
    });
});

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    loadShips();
});
