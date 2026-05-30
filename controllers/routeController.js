const axios = require('axios');

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

        // Generate main route (direct path through busy area)
        const mainPath = generateWaypoints(fromCoords, toCoords, 3);

        // Generate alternative route (slightly longer, through safer area)
        const midLat = (fromCoords.lat + toCoords.lat) / 2 + 0.015;
        const midLng = (fromCoords.lng + toCoords.lng) / 2 - 0.015;
        const altMid = { lat: midLat, lng: midLng };
        const altPath = [
            [fromCoords.lat, fromCoords.lng],
            ...generateWaypoints(fromCoords, altMid, 1).slice(1, -1),
            [altMid.lat, altMid.lng],
            ...generateWaypoints(altMid, toCoords, 1).slice(1, -1),
            [toCoords.lat, toCoords.lng]
        ];

        // Calculate dynamic main risk score based on ML confidence + environmental modifiers
        let baseScore = 40;
        const confidence = mainRisk.confidence_score || 0.5;
        if (mainRisk.risk_level === 'Fatal injury') {
            baseScore = 80 + confidence * 15;
        } else if (mainRisk.risk_level === 'Serious Injury') {
            baseScore = 55 + confidence * 15;
        } else {
            baseScore = 25 + confidence * 20;
        }

        // Modifiers based on weather, road condition, and driver profile
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

        const mainScore = Math.max(10, Math.min(99, Math.round(baseScore + modifier)));

        // Calculate dynamic alternative route risk score (always safer)
        let altBaseScore = 30;
        const altConfidence = altRisk.confidence_score || 0.4;
        if (altRisk.risk_level === 'Fatal injury') {
            altBaseScore = 70 + altConfidence * 15;
        } else if (altRisk.risk_level === 'Serious Injury') {
            altBaseScore = 45 + altConfidence * 15;
        } else {
            altBaseScore = 20 + altConfidence * 15;
        }
        let altModifier = modifier - 10;
        const altScore = Math.max(10, Math.min(mainScore - 5, Math.round(altBaseScore + altModifier)));

        res.json({
            from: { name: fromName, ...fromCoords },
            to: { name: toName, ...toCoords },
            environment: {
                weather: mockWeather,
                road: mockRoad,
                traffic: trafficLevels[mockTrafficArea] || 'Low'
            },
            mainRoute: {
                path: mainPath,
                riskScore: mainScore,
                riskLevel: mainRisk.risk_level,
                confidence: mainRisk.confidence_score,
                color: mainScore > 40 ? '#ef4444' : '#22c55e' // Red if risky traffic, green if safe
            },
            alternativeRoute: {
                path: altPath,
                riskScore: altScore,
                riskLevel: altRisk.risk_level,
                confidence: altRisk.confidence_score,
                color: '#22c55e' // Always safe
            }
        });
    } catch (error) {
        console.error('Route calculation error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
