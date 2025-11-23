// Popup script
const extractBtn = document.getElementById('extractBtn');
const viewBtn = document.getElementById('viewBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusMessage = document.getElementById('statusMessage');
const itemCount = document.getElementById('itemCount');
const meltValue = document.getElementById('meltValue');
const hangarLink = document.getElementById('hangarLink');

// Load saved data on popup open
loadStats();

// Extract button
extractBtn.addEventListener('click', async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Check if on RSI site
        if (!tab.url || !tab.url.includes('robertsspaceindustries.com')) {
            showStatus('Please navigate to your RSI Hangar page first!', 'error');
            return;
        }
        
        if (!tab.url.includes('/account/pledges')) {
            showStatus('Please go to: Account > My Hangar', 'error');
            return;
        }
        
        extractBtn.disabled = true;
        showStatus('Extracting data... Please wait.', 'loading');
        
        // Inject the extraction script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractHangarData
        });
        
        // Wait a moment for extraction to complete
        setTimeout(() => {
            loadStats();
            showStatus('Extraction complete! Click "View My Hangar"', 'success');
            extractBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error:', error);
        showStatus('Error: ' + error.message, 'error');
        extractBtn.disabled = false;
    }
});

// View button
viewBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('viewer.html') });
});

// Refresh button
refreshBtn.addEventListener('click', () => {
    loadStats();
    showStatus('Stats refreshed!', 'success');
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 2000);
});

// Hangar link
hangarLink.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://robertsspaceindustries.com/account/pledges' });
});

// Load statistics
function loadStats() {
    chrome.storage.local.get(['hangarData'], (result) => {
        if (result.hangarData && result.hangarData.length > 0) {
            const data = result.hangarData;
            itemCount.textContent = data.length;
            
            const totalMelt = data.reduce((sum, item) => sum + (item.meltValue || 0), 0);
            meltValue.textContent = `$${totalMelt.toFixed(0)}`;
        } else {
            itemCount.textContent = '-';
            meltValue.textContent = '$0';
        }
    });
}

// Show status
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;
    statusMessage.style.display = 'block';
}

// This function gets injected into the RSI page
function extractHangarData() {
    console.log('SC Hangar Viewer: Starting extraction...');
    
    // First, expand all items to load insurance info
    console.log('Expanding all items to load insurance data...');
    const expandArrows = document.querySelectorAll('.js-expand-arrow');
    let expandedCount = 0;
    
    expandArrows.forEach(arrow => {
        // Only click if not already expanded
        const parent = arrow.closest('.row');
        if (parent && !parent.classList.contains('active')) {
            arrow.click();
            expandedCount++;
        }
    });
    
    console.log(`Clicked ${expandedCount} arrows to expand items`);
    
    // Wait longer for AJAX content to load
    // Check every 500ms if content is loaded, up to 10 seconds
    let checkCount = 0;
    const maxChecks = 20; // 20 checks * 500ms = 10 seconds max
    
    const checkInterval = setInterval(() => {
        checkCount++;
        const jsMoreElements = document.querySelectorAll('.js-more');
        console.log(`Check ${checkCount}: Found ${jsMoreElements.length} .js-more elements`);
        
        if (jsMoreElements.length > 0 || checkCount >= maxChecks) {
            clearInterval(checkInterval);
            console.log('Starting extraction...');
            continueExtraction();
        }
    }, 500);
    
    function continueExtraction() {
    const items = [];
    const allItemsForConcierge = []; // Track ALL items for Concierge detection
    
    // Use the actual classes from RSI's page
    const pledgeScripts = document.querySelectorAll('.js-pledge-nameable-ships');
    
    console.log(`Found ${pledgeScripts.length} pledge elements`);
    
    if (pledgeScripts.length === 0) {
        alert('No pledges found. Make sure you are on the hangar page and it has fully loaded.');
        return;
    }
    
    pledgeScripts.forEach((script, index) => {
        try {
            // The inputs are in the parent element, not inside the script tag
            const pledge = script.parentElement;
            
            // Get the original name from js-pledge-name input
            const nameInput = pledge.querySelector('.js-pledge-name');
            const originalName = nameInput ? nameInput.value.trim() : 'Unknown';
            
            // Extract insurance from the name OR from the expanded section  
            function parseInsurance(name, pledgeElement) {
                // Need to traverse: pledge -> title-col -> wrapper-col -> basic-infos -> row
                const titleCol = pledgeElement.parentElement; // .title-col
                const wrapperCol = titleCol ? titleCol.parentElement : null; // .wrapper-col
                const basicInfos = wrapperCol ? wrapperCol.parentElement : null; // .basic-infos
                const row = basicInfos ? basicInfos.parentElement : null; // .row
                const itemsMore = row ? row.querySelector('.js-more') : null;
                
                console.log(`Checking insurance for: ${name}`);
                console.log('Row element:', row);
                console.log('Items more element:', itemsMore);
                
                if (itemsMore) {
                    const allItems = itemsMore.querySelectorAll('.item');
                    console.log('Found items in .js-more:', allItems.length);
                    
                    const insuranceItem = Array.from(allItems).find(item => {
                        const title = item.querySelector('.title');
                        if (title) {
                            console.log('Title text:', title.textContent);
                        }
                        return title && title.textContent.toLowerCase().includes('insurance');
                    });
                    
                    if (insuranceItem) {
                        const title = insuranceItem.querySelector('.title');
                        const insuranceText = title.textContent.trim();
                        console.log('✓ Found insurance text:', insuranceText);
                        
                        // Parse the insurance text
                        if (insuranceText.match(/Lifetime\s*Insurance/i)) return 'LTI';
                        
                        const monthMatch = insuranceText.match(/(\d+)\s*Month/i);
                        if (monthMatch) {
                            const months = parseInt(monthMatch[1]);
                            const years = Math.floor(months / 12);
                            const remainingMonths = months % 12;
                            if (remainingMonths === 0) {
                                return years === 1 ? '1 Year' : `${years} Years`;
                            } else {
                                return `${months} Months`;
                            }
                        }
                        
                        const yearMatch = insuranceText.match(/(\d+)\s*Year/i);
                        if (yearMatch) {
                            const years = parseInt(yearMatch[1]);
                            return years === 1 ? '1 Year' : `${years} Years`;
                        }
                    } else {
                        console.log('No insurance item found in .js-more');
                    }
                } else {
                    console.log('.js-more not found in row');
                }
                
                // Fallback: try to extract from the name itself
                if (name.match(/LTI|Lifetime\s*Insurance/i)) return 'LTI';
                
                const monthMatch = name.match(/(\d+)\s*Month/i);
                if (monthMatch) {
                    const months = parseInt(monthMatch[1]);
                    const years = Math.floor(months / 12);
                    const remainingMonths = months % 12;
                    if (remainingMonths === 0) {
                        return years === 1 ? '1 Year' : `${years} Years`;
                    } else {
                        return `${months} Months`;
                    }
                }
                
                const yearMatch = name.match(/(\d+)\s*Year/i);
                if (yearMatch) {
                    const years = parseInt(yearMatch[1]);
                    return years === 1 ? '1 Year' : `${years} Years`;
                }
                
                return 'N/A';
            }
            
            // Clean ship name by removing prefixes and insurance suffixes
            function cleanShipName(name) {
                let cleaned = name;
                
                // Remove common prefixes
                cleaned = cleaned.replace(/^Standalone Ships\s*-\s*/i, '');
                cleaned = cleaned.replace(/^Paints\s*-\s*/i, '');
                cleaned = cleaned.replace(/^Gear\s*-\s*/i, '');
                
                // Remove insurance suffixes like " - 10 Year", " - 120 Month", " - LTI", " - Lifetime Insurance"
                cleaned = cleaned.replace(/\s*-\s*\d+\s*(Month|Year)s?$/i, '');
                cleaned = cleaned.replace(/\s*-\s*LTI$/i, '');
                cleaned = cleaned.replace(/\s*-\s*Lifetime\s*Insurance$/i, '');
                
                // Remove "and X items" or "and X item" patterns
                cleaned = cleaned.replace(/\s+and\s+\d+\s+items?$/i, '');
                
                return cleaned.trim();
            }
            
            const insurance = parseInsurance(originalName, pledge);
            const cleanedOriginalName = cleanShipName(originalName);
            
            // Get date if available (declare early so we can use it later)
            const dateInput = pledge.querySelector('.js-pledge-date, .js-pledge-last-alpha');
            const date = dateInput ? dateInput.value : 'N/A';
            
            // Check if this item was upgraded by looking for span.upgraded
            const upgradedSpan = pledge.querySelector('span.upgraded');
            
            let displayName = originalName;
            let displayDate = date;
            let displayInsurance = insurance;
            let isUpgraded = false;
            let upgradedTo = '';
            
            if (upgradedSpan) {
                // This is an upgraded item, get the upgraded name from items-col
                const itemsCol = pledge.parentElement ? pledge.parentElement.querySelector('.items-col') : null;
                if (itemsCol) {
                    const labelText = itemsCol.textContent.trim();
                    // Remove "Contains:" prefix
                    upgradedTo = labelText.replace('Contains:', '').trim();
                    // Clean the upgraded name too (remove "and X items")
                    upgradedTo = upgradedTo.replace(/\s+and\s+\d+\s+items?$/i, '').trim();
                    isUpgraded = true;
                    // Show upgraded ship as the main name
                    displayName = upgradedTo;
                    // Show cleaned original ship in the date field
                    displayDate = `From: ${cleanedOriginalName}`;
                    console.log(`Found upgrade: ${originalName} → ${upgradedTo}`);
                }
            } else {
                // Not upgraded, use cleaned name
                displayName = cleanedOriginalName;
            }
            
            // Get melt value from js-pledge-value input
            const valueInput = pledge.querySelector('.js-pledge-value');
            let meltValue = 0;
            if (valueInput && valueInput.value) {
                // Remove $ and USD and parse
                const rawValue = valueInput.value;
                meltValue = parseFloat(rawValue.replace(/[$,\sUSD]/g, ''));
            }
            
            // Get pledge ID
            const idInput = pledge.querySelector('.js-pledge-id');
            const pledgeId = idInput ? idInput.value : '';
            
            // Get currency
            const currencyInput = pledge.querySelector('.js-pledge-currency');
            const currency = currencyInput ? currencyInput.value : 'USD';
            
            // Determine type based on current name (upgraded if applicable)
            let type = 'Item';
            const nameToCheck = (isUpgraded ? upgradedTo : originalName).toLowerCase();
            
            if (nameToCheck.includes('package')) type = 'Package';
            else if (nameToCheck.includes('ship')) type = 'Ship';
            else if (nameToCheck.includes('upgrade')) type = 'Upgrade';
            else if (nameToCheck.includes('gift card')) type = 'Gift Card';
            else if (nameToCheck.includes('paint')) type = 'Paint';
            else if (nameToCheck.includes('flair')) type = 'Flair';
            else if (nameToCheck.includes('rover') || nameToCheck.includes('wolf') || nameToCheck.includes('vehicle')) type = 'Vehicle';
            
            // Add to allItemsForConcierge BEFORE filtering (so we can detect VIP items even if $0)
            allItemsForConcierge.push({
                originalName: originalName,
                name: displayName
            });
            
            // Skip $0 items and gift cards for the display list
            if (meltValue === 0 || type === 'Gift Card') {
                console.log(`⊗ Skipped: ${displayName} - $${meltValue} (${type})`);
                return;
            }
            
            // Determine status
            let status = 'Hangar Ready';
            if (isUpgraded) {
                status = 'Upgraded';
            }
            
            items.push({
                id: index + 1,
                name: displayName,
                originalName: originalName,
                upgradedTo: upgradedTo,
                meltValue: meltValue,
                date: displayDate,
                insurance: displayInsurance,
                type: type,
                status: status,
                pledgeId: pledgeId,
                currency: currency,
                isUpgraded: isUpgraded
            });
            
            console.log(`✓ Extracted: ${displayName} - $${meltValue} ${isUpgraded ? '(UPGRADED)' : ''}`);
            
        } catch (err) {
            console.error('Error extracting item:', err);
        }
    });
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total extracted: ${items.length} items`);
    console.log('All items:', items);
    
    // Determine Concierge level based on items found
    const conciergeItems = {
        'VIP High Admiral': 'High Admiral',
        'VIP Grand Admiral': 'Grand Admiral',
        'VIP Space Marshal': 'Space Marshal',
        'VIP Wing Commander': 'Wing Commander',
        'VIP Praetorian': 'Praetorian',
        'VIP Legatus Navium': 'Legatus Navium'
    };
    
    const levelOrder = ['High Admiral', 'Grand Admiral', 'Space Marshal', 'Wing Commander', 'Praetorian', 'Legatus Navium'];
    
    let conciergeLevel = null;
    let highestLevelIndex = -1;
    
    // Check ALL items (including $0 ones) to find the highest concierge level
    allItemsForConcierge.forEach(item => {
        for (const [itemName, level] of Object.entries(conciergeItems)) {
            if (item.originalName.includes(itemName) || item.name.includes(itemName)) {
                const levelIndex = levelOrder.indexOf(level);
                console.log(`Found concierge item: ${itemName} -> ${level} (index ${levelIndex})`);
                if (levelIndex > highestLevelIndex) {
                    highestLevelIndex = levelIndex;
                    conciergeLevel = level;
                }
            }
        }
    });
    
    console.log('Concierge level detected:', conciergeLevel);
    
    if (items.length === 0) {
        alert('Extraction found elements but could not parse data. Check console (F12) for details.');
        return;
    }
    
    // Save to storage with concierge level
    chrome.storage.local.set({ 
        hangarData: items,
        conciergeLevel: conciergeLevel 
    }, () => {
        console.log('Data saved to storage!');
        
        // Show notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            font-weight: 600;
        `;
        notification.textContent = `✓ Extracted ${items.length} items!`;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    });
    } // end continueExtraction
} // end extractHangarData
