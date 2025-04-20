import { render, screen } from '@testing-library/react';
import App from '../App';
import React from 'react';
import '@testing-library/jest-dom';

test('renders heading', () => {
  render(<App />);
  expect(screen.getByText(/Log Entry Manager/i)).toBeInTheDocument();
});
