declare module '@react-native-community/datetimepicker' {
  import { ComponentProps } from 'react';
  import { ViewProps } from 'react-native';

  export type AndroidMode = 'date' | 'time';
  export type IOSMode = 'date' | 'time' | 'datetime' | 'countdown';
  export type AndroidDisplay = 'default' | 'spinner' | 'calendar' | 'clock';
  export type IOSDisplay = 'default' | 'compact' | 'spinner' | 'inline';

  export type Event = {
    type: string;
    nativeEvent: {
      timestamp?: number;
      utcOffset?: number;
    };
  };

  export type BaseProps = {
    /**
     * The currently selected date.
     */
    value: Date;

    /**
     * Date change handler.
     *
     * This is called when the user changes the date or time in the UI.
     * The first argument is an Event, the second a selected Date.
     */
    onChange?: (event: Event, date?: Date) => void;

    /**
     * Maximum date.
     *
     * Restricts the range of possible date/time values.
     */
    maximumDate?: Date;

    /**
     * Minimum date.
     *
     * Restricts the range of possible date/time values.
     */
    minimumDate?: Date;

    /**
     * The display options.
     */
    display?: AndroidDisplay | IOSDisplay;

    /**
     * The date picker mode.
     */
    mode?: AndroidMode | IOSMode;

    /**
     * Timezone offset in minutes.
     *
     * By default, the date picker will use the device's timezone. With this
     * parameter, it is possible to force a certain timezone offset. For
     * instance, to show times in Pacific Standard Time, pass -7 * 60.
     */
    timeZoneOffsetInMinutes?: number;
  } & ViewProps;

  export type DateTimePickerProps = BaseProps;

  declare const DateTimePicker: React.FC<DateTimePickerProps>;

  export default DateTimePicker;
}