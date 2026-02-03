namespace my.flight;

entity Flights {
  key ID : UUID;
  Name : String(100);
  FlightStart : DateTime;
  FlightEnd : DateTime;
  OriginAirport : Association to Airports;
  DestinationAirport : Association to Airports;
  PassengerCount : Integer;
  to_Bookings : Composition of many Bookings on to_Bookings.Flight = $self;
}

entity Airports {
  key Code : String(3);
  Name : String(100);
  City : String(100);
  Country : String(100);
}

entity Bookings {
  key ID : UUID;
  PassengerName : String(100);
  SeatNumber : String(10);
  BookingDate : Date;
  Flight : Association to Flights;
}
