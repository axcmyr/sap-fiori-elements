namespace my.flight;

entity Flights {
  key ID : UUID;
  Name : String(100);
  FlightStart : DateTime;
  FlightEnd : DateTime;
  OriginAirport : String(3);
  DestinationAirport : String(3);
  PassengerCount : Integer;
  to_Bookings : Composition of many Bookings on to_Bookings.Flight = $self;
}

entity Bookings {
  key ID : UUID;
  PassengerName : String(100);
  SeatNumber : String(10);
  BookingDate : Date;
  Flight : Association to Flights;
}
