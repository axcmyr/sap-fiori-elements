using my.flight as my from '../db/schema';

service FlightService {
  @readonly entity Flights as projection on my.Flights;
  @readonly entity Bookings as projection on my.Bookings;
  @readonly entity Airports as projection on my.Airports;
}
