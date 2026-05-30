const axios = require('axios');
const Alert = require('../models/Alert');

// Bhopal landmarks with coordinates
const BHOPAL_LOCATIONS = {
    'MP Nagar': { lat: 23.2332, lng: 77.4341 },
    'Arera Colony': { lat: 23.2156, lng: 77.4340 },
    'New Market': { lat: 23.2352, lng: 77.4227 },
    'Habibganj': { lat: 23.2295, lng: 77.4388 },
    'BHEL': { lat: 23.2576, lng: 77.4689 },
    'Kolar Road': { lat: 23.1735, lng: 77.4169 },
    'Hoshangabad Road': { lat: 23.2070, lng: 77.4544 },
    'Bairagarh': { lat: 23.2789, lng: 77.3847 },
    'TT Nagar': { lat: 23.2411, lng: 77.4125 },
    'Shahpura': { lat: 23.1915, lng: 77.4344 },
    'Misrod': { lat: 23.1610, lng: 77.4580 },
    'Awadhpuri': { lat: 23.2682, lng: 77.4453 }
};

// Jabalpur landmarks with coordinates
const JABALPUR_LOCATIONS = {
    'Mundi Bazar': { lat: 23.1815, lng: 79.9864 },
    'Rani Durgavati Square': { lat: 23.1831, lng: 79.9813 },
    'Lal Bungalow': { lat: 23.1742, lng: 79.9897 },
    'Civil Lines': { lat: 23.1625, lng: 79.9634 },
    'Adhartal': { lat: 23.1975, lng: 79.9458 },
    'Nahar Nagar': { lat: 23.1690, lng: 79.9738 },
    'Tilwara Ghat': { lat: 23.1092, lng: 79.8742 },
    'Jabalpur Junction': { lat: 23.1647, lng: 79.9511 },
    'Residency Road': { lat: 23.1850, lng: 79.9725 },
    'Sadar Bazar': { lat: 23.1500, lng: 79.9500 },
    'Dongargarh': { lat: 23.2031, lng: 79.9656 },
    'Scheme No 78': { lat: 23.1520, lng: 79.9889 }
};

// Combine all locations
const ALL_LOCATIONS = { ...BHOPAL_LOCATIONS, ...JABALPUR_LOCATIONS };

// Haversine formula helper to calculate distance between two coordinates in kilometers
function distanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
}

// Check how many active database hazards are near a given path (within thresholdKm)
function getHazardsNearPath(path, alerts, thresholdKm = 0.5) {
    return alerts.filter(alert => {
        if (!alert.location || !alert.location.latitude || !alert.location.longitude) return false;
        return path.some(pt => {
            const dist = distanceInKm(pt[0], pt[1], alert.location.latitude, alert.location.longitude);
            return dist <= thresholdKm;
        });
    });
}

// Generate intermediate waypoints between two points
function generateWaypoints(from, to, count = 3) {
    const points = [];
    for (let i = 0; i <= count + 1; i++) {
        const t = i / (count + 1);
        points.push([
            from.lat + (to.lat - from.lat) * t + (Math.random() - 0.5) * 0.008,
            from.lng + (to.lng - from.lng) * t + (Math.random() - 0.5) * 0.008
        ]);
    }
    // Fix start and end to exact coords
    points[0] = [from.lat, from.lng];
    points[points.length - 1] = [to.lat, to.lng];
    return points;
}

exports.getLocations = (req, res) => {
    const bhopal = Object.entries(BHOPAL_LOCATIONS).map(([name, coords]) => ({
        name,
        city: 'Bhopal',
        lat: coords.lat,
        lng: coords.lng
    }));
    const jabalpur = Object.entries(JABALPUR_LOCATIONS).map(([name, coords]) => ({
        name,
        city: 'Jabalpur',
        lat: coords.lat,
        lng: coords.lng
    }));
    res.json([...bhopal, ...jabalpur]);
};

exports.getSafeRoute = async (req, res) => {
    try {
        const { from, to, settings } = req.body;

        let fromCoords, toCoords;
        let fromName = "Starting Point";
        let toName = "Destination";

        // Parse from
        if (from && typeof from === 'object' && from.lat && from.lng) {
            fromCoords = { lat: parseFloat(from.lat), lng: parseFloat(from.lng) };
            fromName = from.name || `${fromCoords.lat.toFixed(4)}, ${fromCoords.lng.toFixed(4)}`;
        } else if (typeof from === 'string' && ALL_LOCATIONS[from]) {
            fromCoords = ALL_LOCATIONS[from];
            fromName = from;
        }

        // Parse to
        if (to && typeof to === 'object' && to.lat && to.lng) {
            toCoords = { lat: parseFloat(to.lat), lng: parseFloat(to.lng) };
            toName = to.name || `${toCoords.lat.toFixed(4)}, ${toCoords.lng.toFixed(4)}`;
        } else if (typeof to === 'string' && ALL_LOCATIONS[to]) {
            toCoords = ALL_LOCATIONS[to];
            toName = to;
        }

        if (!fromCoords || !toCoords) {
            return res.status(400).json({ error: 'Invalid start or destination coordinates.' });
        }

        // Auto-generate environmental factors
        const weathers = ['Normal', 'Rainy', 'Cloudy', 'Fog or mist'];
        const mockWeather = weathers[Math.floor(Math.random() * weathers.length)];
        const mockRoad = (mockWeather === 'Rainy' || mockWeather === 'Fog or mist') ? 'Wet or damp' : 'Dry';
        const trafficAreas = ['Market areas', 'Office areas', 'Industrial areas'];
        const mockTrafficArea = trafficAreas[Math.floor(Math.random() * trafficAreas.length)];
        const lightConditions = new Date().getHours() >= 18 || new Date().getHours() < 6 ? 'Darkness - lights lit' : 'Daylight';

        const trafficLevels = {
            'Market areas': 'High',
            'Office areas': 'High',
            'Industrial areas': 'Moderate'
        };

        // Default simulation settings
        const simSettings = {
            age_band_of_driver: req.body.age || settings?.age_band || '18-30',
            driving_experience: req.body.experience || settings?.experience || '2-5yr',
            type_of_vehicle: settings?.vehicle || 'Automobile',
            location: mockTrafficArea,
            road_surface_conditions: mockRoad,
            light_conditions: lightConditions,
            weather_conditions: mockWeather
        };

        let mainRisk = { risk_level: 'Slight Injury', confidence_score: 0.5 };
        let altRisk = { risk_level: 'Slight Injury', confidence_score: 0.3 };

        try {
            const mlApiUrl = process.env.ML_API_URL || 'http://127.0.0.1:8000/predict';

            // Main route prediction (high traffic area)
            const mainPayload = { ...simSettings };
            const mainRes = await axios.post(mlApiUrl, mainPayload);
            mainRisk = mainRes.data;

            // Alternative route prediction (through safer areas)
            const altPayload = { ...simSettings, location: 'Residential areas' };
            const altRes = await axios.post(mlApiUrl, altPayload);
            altRisk = altRes.data;
        } catch (mlErr) {
            console.error('ML API error, using defaults:', mlErr.message);
        }

        let mainPath = [];
        let altPath = [];

        // 1. Calculate detour waypoint options
        const dLat = toCoords.lat - fromCoords.lat;
        const dLng = toCoords.lng - fromCoords.lng;
        const len = Math.sqrt(dLat * dLat + dLng * dLng) || 0.01;
        const perpLat = -dLng / len;
        const perpLng = dLat / len;

        // Midpoint coordinates
        const midLat = (fromCoords.lat + toCoords.lat) / 2;
        const midLng = (fromCoords.lng + toCoords.lng) / 2;

        // Left/Right detours shift midpoint by ~1.5 km (0.015 degrees)
        const detourOffset = 0.015;
        const detourLeft = {
            lat: midLat + perpLat * detourOffset,
            lng: midLng + perpLng * detourOffset
        };
        const detourRight = {
            lat: midLat - perpLat * detourOffset,
            lng: midLng - perpLng * detourOffset
        };

        let candidatePaths = {
            main: [],
            left: [],
            right: []
        };

        // Fetch direct and detour routes in parallel via OSRM to ensure real snapped roads
        try {
            const mainUrl = `http://router.project-osrm.org/route/v1/driving/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?overview=full&geometries=geojson`;
            const leftUrl = `http://router.project-osrm.org/route/v1/driving/${fromCoords.lng},${fromCoords.lat};${detourLeft.lng},${detourLeft.lat};${toCoords.lng},${toCoords.lat}?overview=full&geometries=geojson`;
            const rightUrl = `http://router.project-osrm.org/route/v1/driving/${fromCoords.lng},${fromCoords.lat};${detourRight.lng},${detourRight.lat};${toCoords.lng},${toCoords.lat}?overview=full&geometries=geojson`;

            const [mainRes, leftRes, rightRes] = await Promise.all([
                axios.get(mainUrl, { timeout: 3500 }).catch(() => null),
                axios.get(leftUrl, { timeout: 3500 }).catch(() => null),
                axios.get(rightUrl, { timeout: 3500 }).catch(() => null)
            ]);

            if (mainRes && mainRes.data && mainRes.data.routes && mainRes.data.routes[0]) {
                candidatePaths.main = mainRes.data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
            }
            if (leftRes && leftRes.data && leftRes.data.routes && leftRes.data.routes[0]) {
                candidatePaths.left = leftRes.data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
            }
            if (rightRes && rightRes.data && rightRes.data.routes && rightRes.data.routes[0]) {
                candidatePaths.right = rightRes.data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
            }
        } catch (osrmErr) {
            console.error("OSRM parallel routing query failed:", osrmErr.message);
        }

        // Apply fallbacks if OSRM failed for any path
        if (candidatePaths.main.length === 0) {
            candidatePaths.main = generateWaypoints(fromCoords, toCoords, 3);
        }

        // If left detour OSRM failed, use mathematical fallback
        if (candidatePaths.left.length === 0) {
            candidatePaths.left = candidatePaths.main.map((pt, idx) => {
                const t = idx / (candidatePaths.main.length - 1);
                const weight = Math.sin(t * Math.PI);
                return [
                    pt[0] + perpLat * 0.02 * weight,
                    pt[1] + perpLng * 0.02 * weight
                ];
            });
        }

        // If right detour OSRM failed, use mathematical fallback
        if (candidatePaths.right.length === 0) {
            candidatePaths.right = candidatePaths.main.map((pt, idx) => {
                const t = idx / (candidatePaths.main.length - 1);
                const weight = Math.sin(t * Math.PI);
                return [
                    pt[0] - perpLat * 0.02 * weight,
                    pt[1] - perpLng * 0.02 * weight
                ];
            });
        }

        // 2. Fetch active db hazards (alerts)
        let activeAlerts = [];
        try {
            activeAlerts = await Alert.find({});
        } catch (alertErr) {
            console.error("Failed to query alerts from MongoDB:", alertErr.message);
        }

        // 3. Scan hazards near all paths and compute dynamic penalties
        const mainHazards = getHazardsNearPath(candidatePaths.main, activeAlerts, 0.5);
        const leftHazards = getHazardsNearPath(candidatePaths.left, activeAlerts, 0.5);
        const rightHazards = getHazardsNearPath(candidatePaths.right, activeAlerts, 0.5);

        // Helper to count active hazard risk sum
        const getHazardPenalty = (hazardsList) => {
            let penalty = 0;
            hazardsList.forEach(h => {
                if (h.riskLevel === 'high') penalty += 25;
                else if (h.riskLevel === 'medium') penalty += 15;
                else penalty += 8;
            });
            return penalty;
        };

        const mainPenalty = getHazardPenalty(mainHazards);
        const leftPenalty = getHazardPenalty(leftHazards);
        const rightPenalty = getHazardPenalty(rightHazards);

        // 4. Calculate final risk scores based on model predictions + environment + active database alerts
        let baseScore = 30;
        const confidence = mainRisk.confidence_score || 0.5;
        if (mainRisk.risk_level === 'Fatal injury') {
            baseScore = 65 + confidence * 15;
        } else if (mainRisk.risk_level === 'Serious Injury') {
            baseScore = 45 + confidence * 15;
        } else {
            baseScore = 20 + confidence * 15;
        }

        let modifier = 0;
        if (mockWeather === 'Rainy' || mockWeather === 'Fog or mist') modifier += 8;
        if (mockRoad === 'Wet or damp') modifier += 7;
        
        const ageBand = req.body.age || settings?.age_band || '18-30';
        if (ageBand === 'Under 18') modifier += 10;
        else if (ageBand === 'Over 51') modifier += 4;

        const driverExp = req.body.experience || settings?.experience || '2-5yr';
        if (driverExp === 'Below 1yr') modifier += 12;
        else if (driverExp === '1-2yr') modifier += 6;
        else if (driverExp === 'Above 10yr') modifier -= 8;

        // Base risk score derived from AI model predictions
        const calculatedBaseRisk = Math.max(10, Math.min(85, Math.round(baseScore + modifier)));

        // Main Route: Add its hazards penalty
        const mainScore = Math.max(10, Math.min(99, calculatedBaseRisk + mainPenalty));

        // Candidate detour routes (they are residential or detour, so OSRM alternative risk might be lower)
        const leftScore = Math.max(10, Math.min(99, Math.round(calculatedBaseRisk * 0.95 - 5) + leftPenalty));
        const rightScore = Math.max(10, Math.min(99, Math.round(calculatedBaseRisk * 0.95 - 5) + rightPenalty));

        // 5. Select safest route option
        // The direct route is mainPath.
        // We pick the safest detour (left vs right) as the alternative path!
        let chosenAltPath = candidatePaths.left;
        let chosenAltScore = leftScore;
        let chosenAltHazards = leftHazards;

        if (rightScore < leftScore) {
            chosenAltPath = candidatePaths.right;
            chosenAltScore = rightScore;
            chosenAltHazards = rightHazards;
        }

        // If the safest alternative route somehow has high risk due to overlapping alerts, capped safely
        chosenAltScore = Math.min(chosenAltScore, Math.max(10, mainScore - 5));

        res.json({
            from: { name: fromName, ...fromCoords },
            to: { name: toName, ...toCoords },
            environment: {
                weather: mockWeather,
                road: mockRoad,
                traffic: trafficLevels[mockTrafficArea] || 'Low'
            },
            mainRoute: {
                path: candidatePaths.main,
                riskScore: mainScore,
                riskLevel: mainScore > 75 ? 'Fatal injury' : mainScore > 50 ? 'Serious Injury' : 'Slight Injury',
                confidence: confidence,
                color: mainScore > 50 ? '#ef4444' : '#22c55e',
                hazardsDetectedCount: mainHazards.length
            },
            alternativeRoute: {
                path: chosenAltPath,
                riskScore: chosenAltScore,
                riskLevel: chosenAltScore > 75 ? 'Fatal injury' : chosenAltScore > 50 ? 'Serious Injury' : 'Slight Injury',
                confidence: altRisk.confidence_score || 0.4,
                color: '#22c55e', // Alternative detour path is marked green (safe detour)
                hazardsDetectedCount: chosenAltHazards.length
            }
        });
    } catch (error) {
        console.error('Route calculation error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
