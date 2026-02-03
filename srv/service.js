const cds = require('@sap/cds');
const axios = require('axios');

module.exports = cds.service.impl(async function () {
    const { Flights } = this.entities;

    this.on('READ', Flights, async (req) => {
        const requestedID = req.data.ID;

        // If specific ID is requested and it matches our "Real Data" range (500+)
        if (requestedID && requestedID >= 500) {
            try {
                console.log(`Fetching live flight details for ID ${requestedID}...`);
                const response = await axios.get('https://opensky-network.org/api/states/all', {
                    params: { lamin: 49.9, lomin: 8.4, lamax: 50.2, lomax: 8.8 }
                });
                const states = response.data.states || [];

                // Re-map to find the specific flight
                // Note: Since 'index' changes, this is unstable, but sufficient for a prototype.
                const targetIndex = requestedID - 500;
                const state = states[targetIndex];

                if (state) {
                    // Single Read Handler
                    const callsign = state[1]?.trim() || `FLT${targetIndex}`;
                    const extractedAirline = callsign.replace(/[0-9]/g, '').trim();

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
                        Airline: extractedAirline || state[2] || 'Unknown',
                        FlightNumber: callsign,
                        AircraftType: 'Unknown Type',
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
            console.log('Fetching live flight data from OpenSky Network...');
            const response = await axios.get('https://opensky-network.org/api/states/all', {
                params: { lamin: 49.9, lomin: 8.4, lamax: 50.2, lomax: 8.8 }
            });

            const states = response.data.states || [];
            console.log(`OpenSky returned ${states.length} flights around FRA.`);

            const realFlights = states.slice(0, 10).map((state, index) => {
                const callsign = state[1]?.trim() || `FLT${index}`;
                const extractedAirline = callsign.replace(/[0-9]/g, '').trim();
                return {
                    ID: 500 + index,
                    Name: callsign + ' (Live)',
                    FlightStart: new Date().toISOString().split('.')[0] + 'Z',
                    FlightEnd: new Date(Date.now() + 3600 * 1000).toISOString().split('.')[0] + 'Z',
                    OriginAirport_Code: 'FRA',
                    DestinationAirport_Code: 'ANY',
                    Airline: extractedAirline || state[2] || 'Unknown',
                    FlightNumber: callsign,
                    AircraftType: 'Unknown Type',
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
