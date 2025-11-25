// Popup script
const extractBtn = document.getElementById('extractBtn');
const viewBtn = document.getElementById('viewBtn');
const buybackBtn = document.getElementById('buybackBtn');
const wishlistBtn = document.getElementById('wishlistBtn');
const refreshBtn = document.getElementById('refreshBtn');
const clearBtn = document.getElementById('clearBtn');
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
        
        if (!tab.url.includes('/account/pledges') && !tab.url.includes('/account/buy-back-pledges')) {
            showStatus('Please go to: Account > My Hangar or Account > Buy Back Pledges', 'error');
            return;
        }
        
        const isBuyback = tab.url.includes('/account/buy-back-pledges');
        
        extractBtn.disabled = true;
        showStatus(isBuyback ? 'Extracting buyback data...' : 'Extracting data... Please wait.', 'loading');
        
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
    chrome.tabs.create({ url: chrome.runtime.getURL('app.html') });
});

// Buyback button
buybackBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('buyback.html') });
});

// Wishlist button
wishlistBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('wishlist.html') });
});

// Refresh button
refreshBtn.addEventListener('click', () => {
    loadStats();
    showStatus('Stats refreshed!', 'success');
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 2000);
});

// Clear button
clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all hangar data? This will delete all extracted ships and you\'ll need to extract again from all pages.')) {
        chrome.storage.local.set({ hangarData: [], conciergeLevel: null }, () => {
            loadStats();
            showStatus('Data cleared! Extract from page 1 to start fresh.', 'success');
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 3000);
        });
    }
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
    
    // Detect if this is buyback page
    const isBuybackPage = window.location.href.includes('/account/buy-back-pledges');
    console.log('Is buyback page:', isBuybackPage);
    
    // Expand all items and extract
    function expandAndExtract() {
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
    
    if (isBuybackPage) {
        // BUYBACK PAGE EXTRACTION
        console.log('Extracting from buyback page...');
        const pledgeArticles = document.querySelectorAll('article.pledge');
        
        console.log(`Found ${pledgeArticles.length} buyback items`);
        
        if (pledgeArticles.length === 0) {
            alert('No buyback items found. Make sure you are on the buyback page and it has fully loaded.');
            return;
        }
        
        pledgeArticles.forEach((article, index) => {
            try {
                // Get name from h1
                const nameElement = article.querySelector('h1');
                const name = nameElement ? nameElement.textContent.trim().replace(/^Paints\s*-\s*/i, '') : 'Unknown';
                
                // Get value
                const infoDiv = article.querySelector('.information');
                let meltValue = 0;
                if (infoDiv) {
                    const figureElement = infoDiv.querySelector('figure');
                    if (figureElement) {
                        const valueText = figureElement.textContent;
                        const valueMatch = valueText.match(/\$\s*([\d,]+)/);
                        if (valueMatch) {
                            meltValue = parseFloat(valueMatch[1].replace(/,/g, ''));
                        }
                    }
                }
                
                // Check if unavailable (can't use store credit)
                const isUnavailable = article.classList.contains('unavailable');
                const canUseCredit = !isUnavailable;
                
                // Determine type
                const nameLower = name.toLowerCase();
                let type = 'Item';
                if (nameLower.includes('paint')) type = 'Paint';
                else if (nameLower.includes('package')) type = 'Package';
                else if (nameLower.includes('ship')) type = 'Ship';
                else if (nameLower.includes('rover') || nameLower.includes('cyclone')) type = 'Ground Vehicle';
                
                // Get pledge ID from link
                const linkElement = article.querySelector('a.holosmallbtn');
                let pledgeId = `buyback-${index}`;
                if (linkElement) {
                    const href = linkElement.getAttribute('href');
                    const idMatch = href ? href.match(/\/(\d+)$/) : null;
                    if (idMatch) pledgeId = `buyback-${idMatch[1]}`;
                }
                
                items.push({
                    id: index + 1,
                    name: name,
                    originalName: name,
                    meltValue: meltValue,
                    insurance: 'N/A',
                    status: 'N/A',
                    type: type,
                    pledgeId: pledgeId,
                    canUseCredit: canUseCredit,
                    meltedDate: 'N/A'
                });
                
                console.log(`✓ ${name} - $${meltValue} (Credit: ${canUseCredit})`);
            } catch (err) {
                console.error(`Error processing buyback item ${index}:`, err);
            }
        });
    } else {
    // HANGAR PAGE EXTRACTION
    console.log('Extracting from hangar page...');
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
                
                // Remove common prefixes (including Add-Ons)
                cleaned = cleaned.replace(/^Add-Ons?\s*-\s*/i, '');
                cleaned = cleaned.replace(/^Standalone Ships\s*-\s*/i, '');
                cleaned = cleaned.replace(/^Paints\s*-\s*/i, '');
                cleaned = cleaned.replace(/^Gear\s*-\s*/i, '');
                
                // Remove Patch Bundle from end
                cleaned = cleaned.replace(/\s*-?\s*Patch Bundle$/i, '');
                
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
            
            // Check if this item was upgraded by looking for span.upgraded
            const upgradedSpan = pledge.querySelector('span.upgraded');
            
            let displayName = originalName;
            let displayDate = 'N/A'; // Default to N/A for non-upgraded items
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
                    // Show cleaned original ship in the Upgraded From field
                    displayDate = cleanedOriginalName;
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
            
            // Check for specific types first (most specific to least specific)
            if (nameToCheck.includes('weapons kit') || nameToCheck.includes('weapon kit')) type = 'Weapons Kit';
            else if (nameToCheck.includes('bundle')) type = 'Bundle';
            else if (nameToCheck.includes('gift card')) type = 'Gift Card';
            else if (nameToCheck.includes('paint')) type = 'Paint';
            else if (nameToCheck.includes('flair')) type = 'Flair';
            else if (nameToCheck.includes('package')) type = 'Package';
            else if (nameToCheck.includes('upgrade')) type = 'Upgrade';
            // Check for ground vehicles (not ships like Wolf/Alpha Wolf)
            else if (nameToCheck.includes('rover') || nameToCheck.includes('cyclone') || nameToCheck.includes('ptv') || 
                     nameToCheck.includes('ballista') || nameToCheck.includes('mule') || nameToCheck.includes('ursa') ||
                     nameToCheck.includes('nova tank') || nameToCheck.includes('spartan') || nameToCheck.includes('ranger')) {
                type = 'Ground Vehicle';
            }
            // Ships - check for ship keywords or specific ship names like Wolf (but not weapons kit)
            else if (nameToCheck.includes('ship') || 
                     (nameToCheck.includes('wolf') && !nameToCheck.includes('weapons kit') && !nameToCheck.includes('ballistic')) ||
                     nameToCheck.includes('alpha wolf') || nameToCheck.includes('l-21') || nameToCheck.includes('l-22')) {
                type = 'Ship';
            }
            else if (nameToCheck.includes('vehicle')) type = 'Ground Vehicle';
            
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
            
            // Determine status - check if ship is In Concept
            const inConceptShips = ['ironclad', 'kraken', 'pioneer', 'hull e', 'hull d', 'hull b', 
                'nautilus', 'odyssey', 'merchantman', 'orion', 'arrastra', 'genesis', 'galaxy', 
                'endeavor', 'crucible', 'railen', 'vulcan', 'zeus mk ii', 'spirit e1', 'legionnaire',
                'g12', 'ranger', 'nova', 'spartan', 'x1', 'apollo', 'perseus', 'polaris'];
            
            let status = 'Flight Ready';
            
            // Check if it's an add-on, paint, or patch bundle - set status to N/A
            const originalNameLower = originalName.toLowerCase();
            const isAddonOrPaint = originalNameLower.includes('add-on') || 
                                   originalNameLower.includes('patch bundle') ||
                                   originalNameLower.includes('paint') ||
                                   type === 'Paint';
            
            if (isAddonOrPaint) {
                status = 'N/A';
            } else {
                // Check if ship name contains any In Concept ship names (use current ship name if upgraded)
                const shipNameLower = displayName.toLowerCase();
                const isInConcept = inConceptShips.some(conceptShip => 
                    shipNameLower.includes(conceptShip)
                );
                if (isInConcept) {
                    status = 'In Concept';
                }
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
    } // end else (hangar extraction)
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total extracted: ${items.length} items`);
    console.log('All items:', items);
    
    // Check if there are more pages
    const pagination = document.querySelector('.pagination');
    const hasMorePages = pagination && pagination.querySelector('.next:not(.disabled)');
    
    if (hasMorePages) {
        console.log('⚠️ Multiple pages detected! You may have more items on other pages.');
    }
    
    // Determine Concierge level (only for hangar, not buyback)
    let conciergeLevel = null;
    if (!isBuybackPage) {
        const conciergeItems = {
            'VIP High Admiral': 'High Admiral',
            'VIP Grand Admiral': 'Grand Admiral',
            'VIP Space Marshal': 'Space Marshal',
            'VIP Wing Commander': 'Wing Commander',
            'VIP Praetorian': 'Praetorian',
            'VIP Legatus Navium': 'Legatus Navium'
        };
        
        const levelOrder = ['High Admiral', 'Grand Admiral', 'Space Marshal', 'Wing Commander', 'Praetorian', 'Legatus Navium'];
        
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
    } // end if (!isBuybackPage) - concierge detection
    
    if (items.length === 0) {
        alert('Extraction found elements but could not parse data. Check console (F12) for details.');
        return;
    }
    
    // Load existing data from storage and merge
    const storageKey = isBuybackPage ? 'buybackData' : 'hangarData';
    const storageKeys = isBuybackPage ? [storageKey] : [storageKey, 'conciergeLevel'];
    
    chrome.storage.local.get(storageKeys, (existingResult) => {
        const existingItems = existingResult[storageKey] || [];
        const existingConcierge = existingResult.conciergeLevel || null;
        
        // Merge items, preventing duplicates based on pledgeId
        const mergedItems = [...existingItems];
        let newItemsCount = 0;
        
        items.forEach(newItem => {
            // Check if item already exists (by pledgeId)
            const exists = mergedItems.some(existing => 
                existing.pledgeId === newItem.pledgeId
            );
            
            if (!exists) {
                mergedItems.push(newItem);
                newItemsCount++;
            }
        });
        
        console.log(`Added ${newItemsCount} new items (${items.length - newItemsCount} duplicates skipped)`);
        console.log(`Total items in hangar: ${mergedItems.length}`);
        
        // Use highest concierge level found
        const finalConciergeLevel = !existingConcierge ? conciergeLevel : 
            (!conciergeLevel ? existingConcierge : 
            (levelOrder.indexOf(conciergeLevel) > levelOrder.indexOf(existingConcierge) ? conciergeLevel : existingConcierge));
        
        // Determine what to save based on page type
        const dataToSave = isBuybackPage ? { [storageKey]: mergedItems } : { [storageKey]: mergedItems, conciergeLevel: finalConciergeLevel };
        
        // Save merged data to storage
        chrome.storage.local.set(dataToSave, () => {
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
            max-width: 300px;
        `;
        
        let notificationText = `✓ Added ${newItemsCount} new items!<br>Total: ${mergedItems.length} items`;
        if (newItemsCount === 0 && items.length > 0) {
            notificationText = `✓ No new items found<br>Total: ${mergedItems.length} items`;
        }
        if (hasMorePages) {
            notificationText += '<br><br>💡 Go to next page and extract again to add more items!';
        }
        
        notification.innerHTML = notificationText;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), hasMorePages ? 6000 : 3000);
        }); // end chrome.storage.local.set
    }); // end chrome.storage.local.get
    } // end continueExtraction
    } // end expandAndExtract
    
    // Start extraction immediately
    expandAndExtract();
} // end extractHangarData
