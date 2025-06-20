import { App } from "./App";
import { render } from "@testing-library/react";

test("logs 'React connected' to the console", () => {
  const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  render(<App />);
  expect(logSpy).toHaveBeenCalledWith("React connected");
  logSpy.mockRestore();
});
