namespace my.flight;

entity Flights {
  key ID : Integer;
  Name : String(100);
  FlightStart : DateTime;
  FlightEnd : DateTime;
  OriginAirport : Association to Airports;
  DestinationAirport : Association to Airports;
  Airline : String(100);
  FlightNumber : String(10);
  AircraftType : String(50);
  Status : String(20);
  PassengerCount : Integer;
  // OpenSky Technical Data
  ICAO24 : String(10);
  Callsign : String(20);
  OriginCountry : String(100);
  Longitude : Double;
  Latitude : Double;
  Altitude : Double;
  Velocity : Double;
  TrueTrack : Double;
  VerticalRate : Double;
  OnGround : Boolean;
  // Live Weather Data
  Weather_Temp : Double;
  Weather_WindSpeed : Double;
  Weather_Code : Integer;
  to_Bookings : Composition of many Bookings on to_Bookings.Flight = $self;
}

entity Airports {
  key Code : String(3);
  Name : String(100);
  City : String(100);
  Country : String(100);
}

entity Bookings {
  key ID : Integer;
  PassengerName : String(100);
  SeatNumber : String(10);
  BookingDate : Date;
  BookingStatus : String(20);
  Class : String(20);
  TicketPrice : Decimal(10,2);
  Flight : Association to Flights;
}
