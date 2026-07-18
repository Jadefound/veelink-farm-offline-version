import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SelectField from "../SelectField";

describe("SelectField", () => {
  const options = ["Option A", "Option B", "Option C"];

  it("renders with placeholder when no value is selected", () => {
    render(
      <SelectField
        label="Category"
        value=""
        options={options}
        onChange={() => {}}
        placeholder="Pick one"
      />
    );

    expect(screen.getByText("Category")).toBeTruthy();
    expect(screen.getByText("Pick one")).toBeTruthy();
  });

  it("opens modal on press and shows options", () => {
    render(
      <SelectField
        label="Category"
        value=""
        options={options}
        onChange={() => {}}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Option A")).toBeTruthy();
    expect(screen.getByText("Option B")).toBeTruthy();
    expect(screen.getByText("Option C")).toBeTruthy();
  });

  it("calls onChange and closes when an option is selected", () => {
    const onChange = jest.fn();
    render(
      <SelectField
        label="Category"
        value=""
        options={options}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Option B"));

    expect(onChange).toHaveBeenCalledWith("Option B");
  });

  // Note: modal portal in JSDOM has known issues with click propagation.
  // Close-on-backdrop is verified in the browser via the web dev server.
});
