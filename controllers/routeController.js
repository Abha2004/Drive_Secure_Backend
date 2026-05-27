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
    'Mundi Bazar': { lat: 23.1815, lng: 79.5864 },
    'Rani Durgavati Square': { lat: 23.1831, lng: 79.5813 },
    'Lal Bungalow': { lat: 23.1742, lng: 79.5897 },
    'Civil Lines': { lat: 23.1910, lng: 79.5954 },
    'Adhartal': { lat: 23.1922, lng: 79.6123 },
    'Nahar Nagar': { lat: 23.1690, lng: 79.5738 },
    'Tilwara Ghat': { lat: 23.1675, lng: 79.5621 },
    'Jabalpur Junction': { lat: 23.1769, lng: 79.5964 },
    'Residency Road': { lat: 23.1850, lng: 79.5725 },
    'Sadar Bazar': { lat: 23.1900, lng: 79.5811 },
    'Dongargarh': { lat: 23.2031, lng: 79.6156 },
    'Scheme No 78': { lat: 23.1520, lng: 79.5889 }
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
    const locations = Object.entries(ALL_LOCATIONS).map(([name, coords]) => ({
        name,
        lat: coords.lat,
        lng: coords.lng
    }));
    res.json(locations);
};

exports.getSafeRoute = async (req, res) => {
    try {
        const { from, to, settings } = req.body;

        if (!from || !to || !ALL_LOCATIONS[from] || !ALL_LOCATIONS[to]) {
            return res.status(400).json({ error: 'Invalid locations. Choose from available locations.' });
        }

        const fromCoords = ALL_LOCATIONS[from];
        const toCoords = ALL_LOCATIONS[to];

        // Default simulation settings
        const simSettings = {
            age_band_of_driver: settings?.age_band || '18-30',
            driving_experience: settings?.experience || '2-5yr',
            type_of_vehicle: settings?.vehicle || 'Automobile',
            location: 'Residential areas',
            road_surface_conditions: settings?.road_surface || 'Dry',
            light_conditions: settings?.light || 'Daylight',
            weather_conditions: settings?.weather || 'Normal'
        };

        let mainRisk = { risk_level: 'Slight Injury', confidence_score: 0.5 };
        let altRisk = { risk_level: 'Slight Injury', confidence_score: 0.3 };

        try {
            const mlApiUrl = process.env.ML_API_URL || 'http://127.0.0.1:8000/predict';

            // Main route prediction (user selected area)
            const mainPayload = { ...simSettings, location: settings?.area || 'Market areas' };
            const mainRes = await axios.post(mlApiUrl, mainPayload);
            mainRisk = mainRes.data;

            // Alternative route prediction (through safer areas)
            const altArea = (settings?.area === 'Residential areas') ? 'Recreational areas' : 'Residential areas';
            const altPayload = { ...simSettings, location: altArea };
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

        // Map risk levels to numeric scores
        const riskMap = { 'Fatal injury': 95, 'Serious Injury': 75, 'Slight Injury': 40 };
        const mainScore = riskMap[mainRisk.risk_level] || 50;
        const altScore = Math.max(15, (riskMap[altRisk.risk_level] || 30) - 20);

        res.json({
            from: { name: from, ...fromCoords },
            to: { name: to, ...toCoords },
            mainRoute: {
                path: mainPath,
                riskScore: mainScore,
                riskLevel: mainRisk.risk_level,
                confidence: mainRisk.confidence_score,
                color: mainScore > 70 ? '#ef4444' : mainScore > 40 ? '#ffc400' : '#22c55e'
            },
            alternativeRoute: {
                path: altPath,
                riskScore: altScore,
                riskLevel: altRisk.risk_level,
                confidence: altRisk.confidence_score,
                color: altScore > 70 ? '#ef4444' : altScore > 40 ? '#ffc400' : '#22c55e'
            }
        });
    } catch (error) {
        console.error('Route calculation error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
