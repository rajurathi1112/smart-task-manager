import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

describe('App', () => {
  it('renders the application correctly', () => {
    const { getByText } = render(<App />);
    expect(getByText('Smart Tasks')).toBeTruthy();
    expect(getByText('Manage your day effectively')).toBeTruthy();
  });
});
