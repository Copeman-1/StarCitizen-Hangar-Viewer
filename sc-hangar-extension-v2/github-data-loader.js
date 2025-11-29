// GitHub Data Loader
// Fetches ships database and loaner matrix from GitHub repository

const DATA_REPO_BASE = 'https://raw.githubusercontent.com/Copeman-1/StarCitizen-Hangar-Data/refs/heads/main';
window.DATA_REPO_BASE = DATA_REPO_BASE; // Make it globally accessible

const DATA_VERSION_KEY = 'githubDataVersion';
const SHIPS_CACHE_KEY = 'shipsDatabase';
const LOANERS_CACHE_KEY = 'loanersMatrix';
const GROUND_VEHICLES_CACHE_KEY = 'groundVehiclesList';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Load ships database from GitHub or cache
async function loadShipsDatabase() {
    try {
        // Check if we have cached data
        const cachedData = localStorage.getItem(SHIPS_CACHE_KEY);
        const cachedVersion = localStorage.getItem(DATA_VERSION_KEY);
        const cacheTime = localStorage.getItem(`${SHIPS_CACHE_KEY}_time`);
        
        // Use cache if valid (less than 24 hours old)
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
            console.log('Using cached ships database');
            window.SHIPS_DATABASE = JSON.parse(cachedData);
            return window.SHIPS_DATABASE;
        }
        
        // Fetch fresh data from GitHub
        console.log('Fetching ships database from GitHub...');
        const response = await fetch(`${DATA_REPO_BASE}/ships/database.json`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ships database: ${response.status}`);
        }
        
        const data = await response.json();
        window.SHIPS_DATABASE = data.ships;
        
        // Cache the data
        localStorage.setItem(SHIPS_CACHE_KEY, JSON.stringify(data.ships));
        localStorage.setItem(DATA_VERSION_KEY, data.version);
        localStorage.setItem(`${SHIPS_CACHE_KEY}_time`, Date.now().toString());
        
        console.log(`Loaded ${data.ships.length} ships from GitHub (version ${data.version})`);
        return window.SHIPS_DATABASE;
        
    } catch (error) {
        console.error('Error loading ships database from GitHub:', error);
        
        // Fall back to cached data if available
        const cachedData = localStorage.getItem(SHIPS_CACHE_KEY);
        if (cachedData) {
            console.log('Using expired cache as fallback');
            window.SHIPS_DATABASE = JSON.parse(cachedData);
            return window.SHIPS_DATABASE;
        }
        
        // Fall back to empty array
        console.warn('No ships database available');
        window.SHIPS_DATABASE = [];
        return [];
    }
}

// Load loaner matrix from GitHub or cache
async function loadLoanerMatrix() {
    try {
        // Check if we have cached data
        const cachedData = localStorage.getItem(LOANERS_CACHE_KEY);
        const cacheTime = localStorage.getItem(`${LOANERS_CACHE_KEY}_time`);
        
        // Use cache if valid (less than 24 hours old)
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
            console.log('Using cached loaner matrix');
            window.LOANER_MATRIX = JSON.parse(cachedData);
            setupLoanerHelpers();
            return window.LOANER_MATRIX;
        }
        
        // Fetch fresh data from GitHub
        console.log('Fetching loaner matrix from GitHub...');
        const response = await fetch(`${DATA_REPO_BASE}/loaners/matrix.json`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch loaner matrix: ${response.status}`);
        }
        
        const data = await response.json();
        window.LOANER_MATRIX = data.matrix;
        
        // Cache the data
        localStorage.setItem(LOANERS_CACHE_KEY, JSON.stringify(data.matrix));
        localStorage.setItem(`${LOANERS_CACHE_KEY}_time`, Date.now().toString());
        
        console.log(`Loaded ${Object.keys(data.matrix).length} loaner mappings from GitHub (version ${data.version})`);
        
        // Setup helper functions
        setupLoanerHelpers();
        
        return window.LOANER_MATRIX;
        
    } catch (error) {
        console.error('Error loading loaner matrix from GitHub:', error);
        
        // Fall back to cached data if available
        const cachedData = localStorage.getItem(LOANERS_CACHE_KEY);
        if (cachedData) {
            console.log('Using expired cache as fallback');
            window.LOANER_MATRIX = JSON.parse(cachedData);
            setupLoanerHelpers();
            return window.LOANER_MATRIX;
        }
        
        // Fall back to empty object
        console.warn('No loaner matrix available');
        window.LOANER_MATRIX = {};
        setupLoanerHelpers();
        return {};
    }
}

// Setup helper functions for loaner matrix
function setupLoanerHelpers() {
    // Function to get loaners for a ship
    window.getLoaner = function(shipName) {
        if (!window.LOANER_MATRIX) return null;
        
        const cleanName = shipName.trim();
        
        // Check direct match
        if (window.LOANER_MATRIX[cleanName]) {
            return window.LOANER_MATRIX[cleanName];
        }
        
        // Check for partial matches
        for (const [key, loaners] of Object.entries(window.LOANER_MATRIX)) {
            if (cleanName.includes(key) || key.includes(cleanName)) {
                return loaners;
            }
        }
        
        return null;
    };
    
    // Function to find which ship a loaner is for (reverse lookup)
    window.findOriginalShip = function(loanerName) {
        if (!window.LOANER_MATRIX) return null;
        
        for (const [originalShip, loaners] of Object.entries(window.LOANER_MATRIX)) {
            if (loaners.some(loaner => 
                loanerName.toLowerCase().includes(loaner.toLowerCase()) ||
                loaner.toLowerCase().includes(loanerName.toLowerCase())
            )) {
                return originalShip;
            }
        }
        return null;
    };
}

// Get ship image URL (with fallback chain)
function getShipImageUrl(shipName) {
    const shipNameForImage = shipName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    // Return array of URLs to try (CSS will try them in order)
    return [
        `${DATA_REPO_BASE}/ships/images/${shipNameForImage}.jpg`,
        `${DATA_REPO_BASE}/ships/images/${shipNameForImage}.png`,
        `ship-backgrounds/${shipNameForImage}.jpg`,
        `ship-backgrounds/${shipNameForImage}.png`
    ];
}

// Load ground vehicles list from GitHub or cache
async function loadGroundVehiclesList() {
    try {
        // Check if we have cached data
        const cachedData = localStorage.getItem(GROUND_VEHICLES_CACHE_KEY);
        const cacheTime = localStorage.getItem(`${GROUND_VEHICLES_CACHE_KEY}_time`);
        
        // Use cache if valid (less than 24 hours old)
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_DURATION) {
            console.log('Using cached ground vehicles list');
            window.GROUND_VEHICLES = JSON.parse(cachedData);
            return window.GROUND_VEHICLES;
        }
        
        // Fetch fresh data from GitHub
        console.log('Fetching ground vehicles list from GitHub...');
        const response = await fetch(`${DATA_REPO_BASE}/vehicles/ground-vehicles.json`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ground vehicles list: ${response.status}`);
        }
        
        const data = await response.json();
        window.GROUND_VEHICLES = data.groundVehicles;
        
        // Cache the data
        localStorage.setItem(GROUND_VEHICLES_CACHE_KEY, JSON.stringify(data.groundVehicles));
        localStorage.setItem(`${GROUND_VEHICLES_CACHE_KEY}_time`, Date.now().toString());
        
        console.log(`Loaded ${data.groundVehicles.length} ground vehicles from GitHub`);
        return window.GROUND_VEHICLES;
        
    } catch (error) {
        console.error('Error loading ground vehicles list from GitHub:', error);
        
        // Fall back to cached data if available
        const cachedData = localStorage.getItem(GROUND_VEHICLES_CACHE_KEY);
        if (cachedData) {
            console.log('Using fallback cached ground vehicles list');
            window.GROUND_VEHICLES = JSON.parse(cachedData);
            return window.GROUND_VEHICLES;
        }
        
        // No cache available, return empty array
        console.warn('No ground vehicles data available');
        window.GROUND_VEHICLES = [];
        return [];
    }
}

// Clear cached data (for testing or manual refresh)
function clearDataCache() {
    localStorage.removeItem(SHIPS_CACHE_KEY);
    localStorage.removeItem(LOANERS_CACHE_KEY);
    localStorage.removeItem(GROUND_VEHICLES_CACHE_KEY);
    localStorage.removeItem(DATA_VERSION_KEY);
    localStorage.removeItem(`${SHIPS_CACHE_KEY}_time`);
    localStorage.removeItem(`${LOANERS_CACHE_KEY}_time`);
    localStorage.removeItem(`${GROUND_VEHICLES_CACHE_KEY}_time`);
    console.log('Data cache cleared');
}

// Export functions
window.loadShipsDatabase = loadShipsDatabase;
window.loadLoanerMatrix = loadLoanerMatrix;
window.loadGroundVehiclesList = loadGroundVehiclesList;
window.getShipImageUrl = getShipImageUrl;
window.clearDataCache = clearDataCache;
