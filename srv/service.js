const cds = require('@sap/cds');
const axios = require('axios');

// Basic Airline Code to Name Mapping
const airlineMap = {
    'DLH': 'Lufthansa',
    'BAW': 'British Airways',
    'AFR': 'Air France',
    'KLM': 'KLM Royal Dutch Airlines',
    'UAL': 'United Airlines',
    'DAL': 'Delta Air Lines',
    'AAL': 'American Airlines',
    'UAE': 'Emirates',
    'QFA': 'Qantas',
    'SIA': 'Singapore Airlines',
    'THY': 'Turkish Airlines',
    'HAL': 'Hawaiian Airlines',
    'JAL': 'Japan Airlines',
    'ANA': 'All Nippon Airways',
    'SAS': 'SAS',
    'SWR': 'Swiss International Air Lines',
    'EZY': 'easyJet',
    'RYR': 'Ryanair',
    'WZZ': 'Wizz Air',
    'VLG': 'Vueling',
    'TAP': 'TAP Air Portugal',
    'IBE': 'Iberia',
    'EIN': 'Aer Lingus',
    'AZA': 'Alitalia',
    'FIN': 'Finnair',
    'NGB': 'Norwegian Air Shuttle',
    'NAX': 'Norwegian Air International',
    'ICE': 'Icelandair',
    'VIR': 'Virgin Atlantic',
    'AIC': 'Air India',
    'THA': 'Thai Airways',
    'HVN': 'Vietnam Airlines',
    'EVA': 'EVA Air',
    'KAL': 'Korean Air',
    'CSN': 'China Southern',
    'CCA': 'Air China',
    'AAR': 'Asiana Airlines',
    'ETH': 'Ethiopian Airlines',
    'QTR': 'Qatar Airways',
    'ETD': 'Etihad Airways'
};

function getAirlineName(callsign) {
    if (!callsign) return 'Unknown Airline';
    // ICAO Callsign: 3 letters + ID (e.g. DLH410)
    const code = callsign.substring(0, 3).toUpperCase();
    return airlineMap[code] || code; // Return Name if found, otherwise valid ICAO code
}

// In-memory cache to map Artificial IDs (500+) to ICAO24 addresses
// This ensures that clicking "ID 500" always returns the same plane, even if the order changes.
const idToIcaoMap = new Map();
// Global Snapshot Cache to freeze data until manual refresh
let cachedFlights = [];

module.exports = cds.service.impl(async function () {
    const { Flights } = this.entities;

    // Helper: Shuffle Array (Fisher-Yates)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Helper: Fetch Fresh Data from 10 Airports
    async function fetchLiveFlights() {
        console.log('Fetching fresh live flight data from Top 10 Global Airports...');

        const airports = [
            { code: 'ATL', lat: 33.64, lon: -84.42 },
            { code: 'LHR', lat: 51.47, lon: -0.45 },
            { code: 'DXB', lat: 25.25, lon: 55.36 },
            { code: 'HND', lat: 35.54, lon: 139.77 },
            { code: 'ORD', lat: 41.97, lon: -87.90 },
            { code: 'LAX', lat: 33.94, lon: -118.40 },
            { code: 'CDG', lat: 49.00, lon: 2.55 },
            { code: 'DFW', lat: 32.89, lon: -97.04 },
            { code: 'DEN', lat: 39.85, lon: -104.67 },
            { code: 'IST', lat: 41.27, lon: 28.75 }
        ];

        // Fetch concurrently (limit to top 15 per airport to gather ~150 candidates)
        const flightPromises = airports.map(async (airport) => {
            try {
                const response = await axios.get('https://opensky-network.org/api/states/all', {
                    params: {
                        lamin: airport.lat - 0.2,
                        lomin: airport.lon - 0.2,
                        lamax: airport.lat + 0.2,
                        lomax: airport.lon + 0.2
                    },
                    timeout: 4000 // Slightly longer timeout
                });
                const states = response.data.states || [];
                // Return states tagged with their origin airport code
                return states.slice(0, 15).map(s => ({ state: s, origin: airport.code }));
            } catch (err) {
                console.log(`Failed to fetch ${airport.code}: ${err.message}`);
                return [];
            }
        });

        const results = await Promise.all(flightPromises);
        let allStates = results.flat();

        console.log(`OpenSky: Fetched ${allStates.length} candidates.`);

        // Randomize to pick 100 random flights from the candidates
        shuffleArray(allStates);

        // Limit to 100 flights (Snapshot)
        const snapshotStates = allStates.slice(0, 100);

        // Clear Maps
        idToIcaoMap.clear();

        // Map to CDS format
        const finalFlights = snapshotStates.map((item, index) => {
            const state = item.state;
            const originCode = item.origin;

            const artificialID = 500 + index;
            const icao24 = state[0];

            // Populate Cache
            idToIcaoMap.set(artificialID, icao24);

            const callsign = state[1]?.trim() || `FLT${index}`;
            const displayAirline = getAirlineName(callsign);

            return {
                ID: artificialID,
                Name: callsign + ' (Live)',
                FlightStart: new Date().toISOString().split('.')[0] + 'Z',
                FlightEnd: new Date(Date.now() + 3600 * 1000).toISOString().split('.')[0] + 'Z',
                OriginAirport_Code: originCode,
                DestinationAirport_Code: 'ANY',
                Airline: displayAirline,
                FlightNumber: callsign,
                AircraftType: 'Unknown Type',
                Status: state[8] ? 'On Ground' : 'In Air',
                PassengerCount: 0,
                // Make sure internal state is preserved if needed for logic, 
                // but for simple list, the above is enough.
                // However, we need to store the FULL object in cache for the Detail View logic to work efficiently?
                // Actually the Detail View uses 'idToIcaoMap' to look up, but better if we just cache the full flight entities.

                // OpenSky Technical Fields
                ICAO24: icao24,
                Callsign: callsign,
                OriginCountry: state[2],
                Longitude: state[5],
                Latitude: state[6],
                Altitude: state[7],
                Velocity: state[9],
                TrueTrack: state[10],
                VerticalRate: state[11],
                OnGround: state[8]
            };
        });

        console.log(`Snapshot created with ${finalFlights.length} flights.`);
        return finalFlights;
    }

    // Action: Load New Data (Manual Refresh)
    this.on('loadFlightData', async (req) => {
        try {
            cachedFlights = await fetchLiveFlights();
            // Notify user? 
            // In OData V4 actions usually return void or object. 
            // Fiori List Report refresh is handled by the UI after action.
            return;
        } catch (err) {
            req.error(500, 'Failed to load new data: ' + err.message);
        }
    });

    this.on('READ', Flights, async (req) => {
        const requestedID = req.data.ID;

        // --- Detail View (Specific ID) ---
        if (requestedID && requestedID >= 500) {
            // Check Global Cache First (Fastest & Stable)
            const cachedFlight = cachedFlights.find(f => f.ID === requestedID);

            if (cachedFlight) {
                // Enrich with Weather (do not cache weather permanently to keep it somewhat fresh?)
                // Or just fetch weather now.
                // Let's re-use the weather fetching logic.
                let weather = { temp: null, wind: null, code: null };
                try {
                    const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
                        params: {
                            latitude: cachedFlight.Latitude,
                            longitude: cachedFlight.Longitude,
                            current_weather: true
                        }
                    });
                    if (weatherRes.data && weatherRes.data.current_weather) {
                        weather.temp = weatherRes.data.current_weather.temperature;
                        weather.wind = weatherRes.data.current_weather.windspeed;
                        weather.code = weatherRes.data.current_weather.weathercode;
                    }
                } catch (e) { console.error('Weather error:', e.message); }

                return { ...cachedFlight, Weather_Temp: weather.temp, Weather_WindSpeed: weather.wind, Weather_Code: weather.code };
            }

            // Fallback: If for some reason not in cache (e.g. app restart but UI held ID), try looking up ICAO
            const icao = idToIcaoMap.get(requestedID);
            if (icao) {
                // Try to fetch specifically from OpenSky (legacy logic, keep as backup)
                // ... (simplified for brevity: if cache is empty, user should refresh list)
                req.error(404, 'Flight snapshot expired. Please refresh the list.');
                return;
            }

            req.error(404, 'Flight not found.');
            return;
        }

        // If specific ID is requested but NOT in 500+ range, use DB
        if (requestedID) {
            return await cds.run(req.query);
        }

        // --- List View ---
        // If Cache is empty, fetch initial data
        if (cachedFlights.length === 0) {
            try {
                cachedFlights = await fetchLiveFlights();
            } catch (err) {
                console.error('Initial fetch failed:', err.message);
                return await cds.run(req.query);
            }
        }

        // Return the Frozen Cache
        // Apply limit/skip from query if needed? 
        // CDS handles $top/$skip on the returned array automatically in simple cases, 
        // but for robustness we just return the full array and let CAP handle OData query options.
        return cachedFlights;
    });
});
