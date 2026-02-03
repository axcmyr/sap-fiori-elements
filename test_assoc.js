const cds = require('@sap/cds')

module.exports = async function () {
    const csn = await cds.load('*')
    // Connect to db and set as primary
    const db = await cds.connect.to('db', { model: csn })
    cds.db = db // Set primary db for global QL if needed, though we use db.run

    const { Flights, Bookings } = db.entities('my.flight')

    console.log('--- Checking Flights ---')
    const flight = await db.run(SELECT.one.from(Flights).where({ ID: 101 }))
    if (!flight) {
        console.error('Flight 101 not found!')
    } else {
        console.log('Flight 101 found:', flight.Name)
    }

    console.log('--- Checking Bookings directly ---')
    // Note: Association key is usually ID, but foreign key column is Flight_ID
    const bookings = await db.run(SELECT.from(Bookings).where({ Flight_ID: 101 }))
    console.log(`Found ${bookings.length} bookings for Flight 101 via FK check.`)

    if (bookings.length > 0) {
        console.log('first booking:', bookings[0])
    } else {
        // Try filtering by 'Flight' association object just in case
        console.log('Trying filter by assoc object...')
        try {
            const bookings2 = await db.run(SELECT.from(Bookings).where({ Flight: { ID: 101 } }))
            console.log(`Found ${bookings2.length} bookings via object filter.`)
        } catch (e) { console.log('Object filter failed', e.message) }
    }

    console.log('--- Checking Navigation ---')
    if (flight) {
        const flightWithNav = await db.run(SELECT.one.from(Flights, 101, f => {
            f.ID,
                f.to_Bookings(b => {
                    b.ID, b.PassengerName
                })
        }))

        if (flightWithNav && flightWithNav.to_Bookings && flightWithNav.to_Bookings.length > 0) {
            console.log(`Navigation successful! Found ${flightWithNav.to_Bookings.length} bookings.`)
        } else {
            console.error('Navigation returned empty or undefined.')
            console.log(JSON.stringify(flightWithNav, null, 2))
        }
    }
}

module.exports().catch(console.error)
