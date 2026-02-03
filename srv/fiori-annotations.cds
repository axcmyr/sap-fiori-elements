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
    SelectionFields: [ FlightStart, OriginAirport, DestinationAirport, ID, Name ],
    LineItem: [
      { Value: ID, Label: '{i18n>ID}' },
      { Value: Name, Label: '{i18n>Name}' },
      { Value: FlightStart, Label: '{i18n>FlightStart}' },
      { Value: FlightEnd, Label: '{i18n>FlightEnd}' },
      { Value: OriginAirport, Label: '{i18n>OriginAirport}' },
      { Value: DestinationAirport, Label: '{i18n>DestinationAirport}' },
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
        { Value: Name, Label: '{i18n>Name}' },
        { Value: FlightStart, Label: '{i18n>FlightStart}' },
        { Value: FlightEnd, Label: '{i18n>FlightEnd}' },
        { Value: OriginAirport, Label: '{i18n>OriginAirport}' },
        { Value: DestinationAirport, Label: '{i18n>DestinationAirport}' },
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
    LineItem: [
      { Value: ID, Label: '{i18n>BookingID}' },
      { Value: PassengerName, Label: '{i18n>PassengerName}' },
      { Value: SeatNumber, Label: '{i18n>SeatNumber}' },
      { Value: BookingDate, Label: '{i18n>BookingDate}' }
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
               { Value: BookingDate, Label: '{i18n>BookingDate}' }
             ]
           }
  }
);

