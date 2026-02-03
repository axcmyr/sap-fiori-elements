const cds = require('@sap/cds');
const axios = require('axios');

module.exports = cds.service.impl(async function () {
    const { Flights } = this.entities;

    this.on('READ', Flights, async (req) => {
        // If specific ID is requested, defer to default SQLite handler
        if (req.data.ID) {
            return await cds.run(req.query);
        }

        try {
            console.log('Fetching live flight data from OpenSky Network...');
            // OpenSky API: Bounding Box for Frankfurt (EDDF)
            // lamin=49.9, lomin=8.4, lamax=50.2, lomax=8.8
            const response = await axios.get('https://opensky-network.org/api/states/all', {
                params: {
                    lamin: 49.9,
                    lomin: 8.4,
                    lamax: 50.2,
                    lomax: 8.8
                }
            });

            const states = response.data.states || [];
            console.log(`OpenSky returned ${states.length} flights around FRA.`);

            // Map OpenSky data to our Schema
            // OpenSky State Vector: [icao24, callsign, origin_country, time_position, last_contact, longitude, latitude, baro_altitude, on_ground, velocity, true_track, vertical_rate, sensors, geo_altitude, squawk, spi, position_source]
            // We limit to 10 flights to prevent UI overload
            const realFlights = states.slice(0, 10).map((state, index) => {
                const callsign = state[1]?.trim() || `FLT${index}`;
                return {
                    ID: 500 + index, // Use a distinct ID range for real-time data
                    Name: callsign + ' (Live)',
                    FlightStart: new Date().toISOString(), // Current time for live flights
                    FlightEnd: new Date(Date.now() + 3600 * 1000).toISOString(), // +1 hour
                    OriginAirport_Code: 'FRA', // Assumed based on Bbox, simplified
                    DestinationAirport_Code: 'ANY', // OpenSky free API doesn't give destination
                    Airline: state[2] || 'Unknown Airline',
                    FlightNumber: callsign,
                    AircraftType: 'Live Traffic',
                    Status: 'In Air',
                    PassengerCount: 0 // Unknown for live traffic
                };
            });

            // If we have real flights, return them. 
            // Optional: Merge with DB flights or return only real flights.
            // For this feature, we replace the list with real data if available.
            if (realFlights.length > 0) {
                // We need to support $count and other OData features if possible, 
                // but for a simple list report, returning the array works.
                // To allow standard filtering alongside, we might want to append.
                // Let's return ONLY real data to prove the feature works as requested ("echte flüge").
                return realFlights;
            } else {
                console.log('No live flights found, falling back to database.');
                return await cds.run(req.query);
            }

        } catch (error) {
            console.error('Error fetching OpenSky data:', error.message);
            // Fallback to local database if API fails
            return await cds.run(req.query);
        }
    });
});
