import { render, screen } from "@testing-library/react";

import { App } from "./react/App";

test("renders the talent name", () => {
  render(<App />);
  const itMe = screen.getByText(/Jonathan Tsang/i);
  expect(itMe).toBeInTheDocument();
});
