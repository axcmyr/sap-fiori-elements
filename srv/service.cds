using my.flight as my from '../db/schema';

service FlightService {
  @readonly entity Flights as projection on my.Flights {
    *,
    to_Bookings : redirected to Bookings
  };
  @readonly entity Bookings as projection on my.Bookings {
    *,
    Flight : redirected to Flights
  };
  @readonly entity Airports as projection on my.Airports;
}
