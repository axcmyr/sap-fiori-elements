using my.flight as my from '../db/schema';

service FlightService {
  entity Flights as projection on my.Flights actions {
    action loadFlightData();
  };
  entity Airports as projection on my.Airports;
}
