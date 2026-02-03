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
                // ideally we would map ICAO24 to ID.
                const targetIndex = requestedID - 500;
                const state = states[targetIndex];

                if (state) {
                    const callsign = state[1]?.trim() || `FLT${targetIndex}`;
                    return {
                        ID: requestedID,
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
