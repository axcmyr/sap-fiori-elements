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
            // OpenSky State Vector: [0:icao24, 1:callsign, 2:origin_country, 3:time_position, 4:last_contact, 5:longitude, 6:latitude, 7:baro_altitude, 8:on_ground, 9:velocity, 10:true_track, 11:vertical_rate, 12:sensors, 13:geo_altitude, 14:squawk, 15:spi, 16:position_source]
            const realFlights = states.slice(0, 10).map((state, index) => {
                const callsign = state[1]?.trim() || `FLT${index}`;
                return {
                    ID: 500 + index,
                    Name: callsign + ' (Live)',
                    FlightStart: new Date().toISOString(),
                    FlightEnd: new Date(Date.now() + 3600 * 1000).toISOString(),
                    OriginAirport_Code: 'FRA',
                    DestinationAirport_Code: 'ANY',
                    Airline: state[2] || 'Unknown Airline',
                    FlightNumber: callsign,
                    AircraftType: 'Live Traffic',
                    Status: state[8] ? 'On Ground' : 'In Air',
                    PassengerCount: 0,
                    // OpenSky Technical Fields
                    ICAO24: state[0],
                    Callsign: callsign,
                    OriginCountry: state[2],
                    Longitude: state[5],
                    Latitude: state[6],
                    Altitude: state[7], // baro_altitude
                    Velocity: state[9],
                    TrueTrack: state[10],
                    VerticalRate: state[11],
                    OnGround: state[8]
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
