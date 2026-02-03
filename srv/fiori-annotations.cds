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
        $Type: 'UI.ReferenceFacet',
        ID: 'BookingsFacet',
        Label: '{i18n>Bookings}',
        Target: 'to_Bookings/@UI.LineItem'
      }
    ],
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
