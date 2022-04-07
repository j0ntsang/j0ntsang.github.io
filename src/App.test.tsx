import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the talent name', () => {
  render(<App />);
  const linkElement = screen.getByText(/Jonathan Tsang/i);
  expect(linkElement).toBeInTheDocument();
});
