// Loaner Ship Matrix - Maps concept/in-production ships to their loaners
// Updated: November 2025
const LOANER_MATRIX = {
    // Format: "Original Ship": ["Loaner Ship 1", "Loaner Ship 2"]
    "400i": ["325a"],
    "600i Touring": ["325a"],
    "600i Explorer": ["325a", "Cyclone"],
    "600i Executive": ["325a", "Cyclone"],
    "890 Jump": ["325a", "85x"],
    "Arrastra": ["Prospector", "Mole"],
    "Arrow": [],  // Flight ready
    "Carrack": ["C8 Pisces", "URSA Rover"],
    "Carrack Expedition": ["C8 Pisces", "URSA Rover"],
    "Carrack w/ C8X": ["C8X Pisces Expedition", "URSA Rover"],
    "Carrack Expedition w/C8X": ["C8X Pisces Expedition", "URSA Rover"],
    "Caterpillar": ["Buccaneer"],
    "Centurion": ["Aurora MR"],
    "Constellation Andromeda": ["P-52 Merlin"],
    "Constellation Aquila": ["P-52 Merlin", "URSA Rover"],
    "Constellation Phoenix": ["P-72 Archimedes", "Lynx Rover"],
    "Constellation Phoenix Emerald": ["P-72 Archimedes", "Lynx Rover"],
    "Corsair": ["Buccaneer"],
    "Crucible": ["Constellation Andromeda"],
    "CSV-SM": ["Aurora MR"],
    "Cyclone": ["Aurora MR"],
    "Dragonfly": ["Aurora MR"],
    "E1 Spirit": ["A1 Spirit"],
    "Endeavor": ["Starfarer", "Cutlass Red"],
    "Expanse": ["Prospector", "Reliant Kore"],
    "Fury": ["Aurora MR"],
    "G12": ["Lynx"],
    "G12a": ["Lynx"],
    "G12r": ["Lynx"],
    "Galaxy": ["Carrack"],
    "Genesis Starliner": ["Hercules C2"],
    "Hull A": ["Arrow"],
    "Hull B": ["Hull A", "Arrow"],
    "Hull C": ["Arrow"],
    "Hull D": ["Hull C", "Hercules C2", "Arrow"],
    "Hull E": ["Hull C", "Hercules C2", "Arrow"],
    "Idris-M": ["F7C-M Super Hornet", "MPUV Passenger"],
    "Idris-P": ["F7C-M Super Hornet", "MPUV Passenger"],
    "Ironclad": ["Caterpillar"],
    "Ironclad Assault": ["Caterpillar"],
    "Javelin": ["Idris-P", "MPUV Cargo"],
    "Kraken": ["Polaris", "Hercules C2", "Caterpillar", "Buccaneer"],
    "Kraken Privateer": ["Polaris", "Hercules C2", "Caterpillar", "Buccaneer"],
    "Liberator": ["Hercules M2", "F7C-M Super Hornet"],
    "Legionnaire": ["Vanguard Hoplite"],
    "Lynx": ["Aurora MR"],
    "Mantis": ["Aurora LN"],
    "Merchantman": ["Hull C", "Defender", "Hercules C2"],
    "Mole": ["Prospector"],
    "MPUV-Tractor": ["Aurora MR"],
    "MTC": ["Aurora MR"],
    "Mule": ["Aurora MR"],
    "Nautilus": ["Polaris", "Avenger Titan"],
    "Nova": ["Aurora MR"],
    "Nox": ["Aurora MR"],
    "Odyssey": ["Carrack", "Reliant Kore"],
    "Orion": ["Prospector", "Mole"],
    "Pioneer": ["Caterpillar", "Nomad"],
    "Polaris": ["F7C-M Super Hornet"],
    "Pulse": ["Aurora MR"],
    "Pulse LX": ["Aurora MR"],
    "Railen": ["Constellation Taurus", "Syulen"],
    "RAFT": ["F7C Hornet"],
    "Ranger CV": ["Cyclone"],
    "Ranger RC": ["Cyclone RC"],
    "Ranger TR": ["Cyclone TR"],
    "Redeemer": ["Arrow"],
    "Retaliator": ["Gladiator"],
    "SRV": ["Aurora LN"],
    "Storm": ["Aurora MR"],
    "STV": ["Aurora MR"],
    "Terrapin": ["F7C-M Super Hornet"],
    "Terrapin Medic": ["F7C-M Super Hornet"],
    "Valkyrie": ["F7C-M Super Hornet"],
    "Vulcan": ["Starfarer"],
    "Vulture": ["Buccaneer"],
    "X1": ["Aurora MR"],
    "X1 Velocity": ["Aurora MR"],
    "X1 Force": ["Aurora MR"],
    "Zeus Mk II MR": ["Zeus Mk II ES"],
    "Zeus Mk II ES": []  // Flight ready
};

// Function to check if a ship has loaners
function getLoaner(shipName) {
    // Clean the ship name for matching
    const cleanName = shipName.trim();
    
    // Check direct match
    if (LOANER_MATRIX[cleanName]) {
        return LOANER_MATRIX[cleanName];
    }
    
    // Check for partial matches (e.g., "Carrack" matches "Carrack Expedition")
    for (const [key, loaners] of Object.entries(LOANER_MATRIX)) {
        if (cleanName.includes(key) || key.includes(cleanName)) {
            return loaners;
        }
    }
    
    return null;
}

// Function to find which ship a loaner is for (reverse lookup)
function findOriginalShip(loanerName) {
    for (const [originalShip, loaners] of Object.entries(LOANER_MATRIX)) {
        if (loaners.some(loaner => 
            loanerName.toLowerCase().includes(loaner.toLowerCase()) ||
            loaner.toLowerCase().includes(loanerName.toLowerCase())
        )) {
            return originalShip;
        }
    }
    return null;
}
