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

module.exports = cds.service.impl(async function () {
    const { Flights } = this.entities;

    this.on('READ', Flights, async (req) => {
        const requestedID = req.data.ID;

        // If specific ID is requested and it matches our "Real Data" range (500+)
        if (requestedID && requestedID >= 500) {
            try {
                const response = await axios.get('https://opensky-network.org/api/states/all', {
                    params: { lamin: 49.9, lomin: 8.4, lamax: 50.2, lomax: 8.8 }
                });
                const states = response.data.states || [];

                // Stability Fix: Lookup ICAO from Cache
                let targetState = null;
                const cachedIcao = idToIcaoMap.get(requestedID);

                if (cachedIcao) {
                    targetState = states.find(s => s[0] === cachedIcao);
                }

                // Fallback: If not in cache or plane left the area, try index (less stable)
                if (!targetState) {
                    const targetIndex = requestedID - 500;
                    if (states[targetIndex]) {
                        targetState = states[targetIndex];
                    }
                }

                if (targetState) {
                    // Single Read Handler
                    const state = targetState;
                    const callsign = state[1]?.trim() || `FLT${requestedID}`; // Use requestedID to keep UI consistent
                    const displayAirline = getAirlineName(callsign);

                    // Default Weather (Empty)
                    let weather = { temp: null, wind: null, code: null };

                    try {
                        // Fetch Weather for this location
                        const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
                            params: {
                                latitude: state[6],
                                longitude: state[5],
                                current_weather: true
                            }
                        });
                        if (weatherRes.data && weatherRes.data.current_weather) {
                            weather.temp = weatherRes.data.current_weather.temperature;
                            weather.wind = weatherRes.data.current_weather.windspeed;
                            weather.code = weatherRes.data.current_weather.weathercode;
                        }
                    } catch (wErr) {
                        console.error('Weather fetch failed:', wErr.message);
                    }

                    return {
                        ID: requestedID,
                        Name: callsign + ' (Live)',
                        FlightStart: new Date().toISOString().split('.')[0] + 'Z',
                        FlightEnd: new Date(Date.now() + 3600 * 1000).toISOString().split('.')[0] + 'Z',
                        OriginAirport_Code: 'FRA',
                        DestinationAirport_Code: 'ANY',
                        Airline: displayAirline,
                        FlightNumber: callsign,
                        AircraftType: 'Unknown Type', // OpenSky free API does not provide Type
                        Status: state[8] ? 'On Ground' : 'In Air',
                        PassengerCount: 0,
                        ICAO24: state[0],
                        Callsign: callsign,
                        OriginCountry: state[2],
                        Longitude: state[5],
                        Latitude: state[6],
                        Altitude: state[7],
                        Velocity: state[9],
                        TrueTrack: state[10],
                        VerticalRate: state[11],
                        OnGround: state[8],
                        // Weather Mapping
                        Weather_Temp: weather.temp,
                        Weather_WindSpeed: weather.wind,
                        Weather_Code: weather.code
                    };
                } else {
                    req.error(404, `Flight ${requestedID} not found in current live data.`);
                    return;
                }
            } catch (error) {
                console.error('Error fetching details:', error.message);
                req.error(500, 'Unable to fetch external data');
                return;
            }
        }

        // If specific ID is requested but NOT in 500+ range, use DB
        if (requestedID) {
            return await cds.run(req.query);
        }

        try {
            console.log('Fetching live flight data from Top 10 Global Airports...');

            // Top 10 Airports Bounding Boxes
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

            // Fetch concurrently (limit to top 3 per airport)
            const flightPromises = airports.map(async (airport) => {
                try {
                    const response = await axios.get('https://opensky-network.org/api/states/all', {
                        params: {
                            lamin: airport.lat - 0.2,
                            lomin: airport.lon - 0.2,
                            lamax: airport.lat + 0.2,
                            lomax: airport.lon + 0.2
                        },
                        timeout: 3000 // Short timeout
                    });
                    const states = response.data.states || [];
                    // Return states tagged with their origin airport code
                    return states.slice(0, 3).map(s => ({ state: s, origin: airport.code }));
                } catch (err) {
                    console.log(`Failed to fetch ${airport.code}: ${err.message}`);
                    return [];
                }
            });

            const results = await Promise.all(flightPromises);
            const allStates = results.flat(); // Flatten array of arrays
            console.log(`OpenSky returned ${allStates.length} live flights across top airports.`);

            // Clear cache on list refresh
            idToIcaoMap.clear();

            const realFlights = allStates.map((item, index) => {
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

            if (realFlights.length > 0) {
                return realFlights;
            } else {
                console.log('No live flights found, falling back to database.');
                return await cds.run(req.query);
            }

        } catch (error) {
            console.error('Error fetching OpenSky data:', error.message);
            return await cds.run(req.query);
        }
    });
});
