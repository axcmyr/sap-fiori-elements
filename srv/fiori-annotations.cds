using FlightService from './service';

annotate FlightService.Flights with @(
  UI: {
    HeaderInfo: {
      TypeName: '{i18n>Flight}',
      TypeNamePlural: '{i18n>Flights}',
      Title: { Value: Name },
      Description: { Value: ID }
    },
    PresentationVariant: {
      SortOrder: [
        { Property: FlightStart, Descending: true }
      ],
      Visualizations: [ '@UI.LineItem' ]
    },
    SelectionFields: [ FlightStart, OriginAirport_Code, DestinationAirport_Code, ID, Name, Airline, Status ],
    LineItem: [
      { Value: ID, Label: '{i18n>ID}' },
      { Value: Airline, Label: '{i18n>Airline}' },
      { Value: OriginCountry, Label: '{i18n>OriginCountry}' },
      { Value: FlightNumber, Label: '{i18n>FlightNumber}' },
      { Value: Name, Label: '{i18n>Name}' },
      { Value: FlightStart, Label: '{i18n>FlightStart}' },
      { Value: FlightEnd, Label: '{i18n>FlightEnd}' },
      { Value: OriginAirport_Code, Label: '{i18n>OriginAirport}' },
      { Value: DestinationAirport_Code, Label: '{i18n>DestinationAirport}' },
      { Value: Status, Label: '{i18n>Status}' },
      { Value: PassengerCount, Label: '{i18n>PassengerCount}' }
    ],
    Facets: [
      {
        $Type: 'UI.ReferenceFacet',
        ID: 'GeneralInfoFacet',
        Label: '{i18n>GeneralInformation}',
        Target: '@UI.FieldGroup#GeneralInfo'
      },

      {
        $Type : 'UI.ReferenceFacet',
        ID : 'WeatherFacet',
        Label : '{i18n>CurrentWeather}',
        Target : '@UI.FieldGroup#Weather',
      },
      {
        $Type : 'UI.ReferenceFacet',
        ID : 'TechnicalDataFacet',
        Label : '{i18n>TechnicalData}',
        Target : '@UI.FieldGroup#TechnicalData',
      },
    ],
    
    FieldGroup #Weather : {
      $Type : 'UI.FieldGroupType',
      Data : [
        { $Type : 'UI.DataField', Value : Weather_Temp, Label : '{i18n>Temperature}' },
        { $Type : 'UI.DataField', Value : Weather_WindSpeed, Label : '{i18n>WindSpeed}' },
        // { $Type : 'UI.DataField', Value : Weather_Code, Label : '{i18n>WeatherCondition}' }
      ]
    },

    FieldGroup #TechnicalData : {
      $Type : 'UI.FieldGroupType',
      Data : [
        { $Type : 'UI.DataField', Value : ICAO24, Label : '{i18n>ICAO24}' },
        { $Type : 'UI.DataField', Value : Airline, Label : '{i18n>Airline}' },
        { $Type : 'UI.DataField', Value : OriginCountry, Label : '{i18n>OriginCountry}' },
        { $Type : 'UI.DataField', Value : OriginAirport_Code, Label : '{i18n>OriginAirport}' },
        { $Type : 'UI.DataField', Value : Velocity, Label : '{i18n>Velocity}' },
        { $Type : 'UI.DataField', Value : Altitude, Label : '{i18n>Altitude}' },
        { $Type : 'UI.DataField', Value : TrueTrack, Label : '{i18n>TrueTrack}' },
        { $Type : 'UI.DataField', Value : VerticalRate, Label : '{i18n>VerticalRate}' },
        { $Type : 'UI.DataField', Value : OnGround, Label : '{i18n>OnGround}' },
        { $Type : 'UI.DataField', Value : Longitude, Label : '{i18n>Longitude}' },
        { $Type : 'UI.DataField', Value : Latitude, Label : '{i18n>Latitude}' },
      ]
    },

    FieldGroup#GeneralInfo: {
      Data: [
        { Value: ID, Label: '{i18n>ID}' },
        { Value: Airline, Label: '{i18n>Airline}' },
        { Value: FlightNumber, Label: '{i18n>FlightNumber}' },
        { Value: Name, Label: '{i18n>Name}' },
        { Value: AircraftType, Label: '{i18n>AircraftType}' },
        { Value: FlightStart, Label: '{i18n>FlightStart}' },
        { Value: FlightEnd, Label: '{i18n>FlightEnd}' },
        { Value: OriginAirport_Code, Label: '{i18n>OriginAirport}' },
        { Value: DestinationAirport_Code, Label: '{i18n>DestinationAirport}' },
        { Value: Status, Label: '{i18n>Status}' },
        { Value: PassengerCount, Label: '{i18n>PassengerCount}' }
      ]
    }
  }
);

annotate FlightService.Bookings with @(
  UI: {
    HeaderInfo: {
      TypeName: '{i18n>Booking}',
      TypeNamePlural: '{i18n>Bookings}',
      Title: { Value: PassengerName },
      Description: { Value: ID }
    },
    SelectionFields: [ BookingStatus, Class ],
    LineItem: [
      { Value: ID, Label: '{i18n>BookingID}' },
      { Value: PassengerName, Label: '{i18n>PassengerName}' },
      { Value: SeatNumber, Label: '{i18n>SeatNumber}' },
      { Value: Class, Label: '{i18n>Class}' },
      { Value: TicketPrice, Label: '{i18n>TicketPrice}' },
      { Value: BookingDate, Label: '{i18n>BookingDate}' },
      { Value: BookingStatus, Label: '{i18n>BookingStatus}' }
    ],
    Facets: [
             {
               $Type: 'UI.ReferenceFacet',
               ID: 'BookingInfoFacet',
               Label: '{i18n>BookingInfo}',
               Target: '@UI.FieldGroup#BookingInfo'
             }
           ],
           FieldGroup#BookingInfo: {
             Data: [
               { Value: ID, Label: '{i18n>BookingID}' },
               { Value: PassengerName, Label: '{i18n>PassengerName}' },
               { Value: SeatNumber, Label: '{i18n>SeatNumber}' },
               { Value: Class, Label: '{i18n>Class}' },
               { Value: TicketPrice, Label: '{i18n>TicketPrice}' },
               { Value: BookingDate, Label: '{i18n>BookingDate}' },
               { Value: BookingStatus, Label: '{i18n>BookingStatus}' }
             ]
           }
  }
);


annotate FlightService.Flights with {
  OriginAirport @(
    Common: {
      Text: OriginAirport.Name,
      TextArrangement: #TextFirst,
      ValueList: {
        Label: '{i18n>Airports}',
        CollectionPath: 'Airports',
        Parameters: [
          { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: OriginAirport_Code, ValueListProperty: 'Code' },
          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'Name' },
          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'City' },
          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'Country' }
        ]
      }
    }
  );
  DestinationAirport @(
    Common: {
      Text: DestinationAirport.Name,
      TextArrangement: #TextFirst,
      ValueList: {
        Label: '{i18n>Airports}',
        CollectionPath: 'Airports',
        Parameters: [
          { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: DestinationAirport_Code, ValueListProperty: 'Code' },
          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'Name' },
          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'City' },
          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'Country' }
        ]
      }
    }
  );
};
