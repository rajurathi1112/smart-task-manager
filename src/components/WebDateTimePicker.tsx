import { Platform, createElement } from 'react-native';

/**
 * A cross-platform compatible Date & Time picker for Web.
 * 
 * On Web, it renders a standard HTML5 `<input type="datetime-local">` which provides 
 * an out-of-the-box browser-native calendar and time dropdown.
 * On Native (iOS/Android), it returns null as native apps use the community picker.
 *
 * @param {Object} props
 * @param {Date} props.value - The currently selected Date object.
 * @param {Function} props.onChange - Callback fired when a new date/time is selected.
 */
export const WebDateTimePicker = ({ value, onChange }) => {
  if (Platform.OS === 'web') {
    return createElement('input', {
      type: 'datetime-local',
      // Format Date object to YYYY-MM-DDTHH:mm string which HTML5 inputs require
      value: value ? new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      onChange: (e) => {
        if (e.target.value) {
          onChange(new Date(e.target.value));
        }
      },
      style: {
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '16px',
        width: '100%',
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        boxSizing: 'border-box',
        fontFamily: 'inherit'
      }
    });
  }
  return null;
};
