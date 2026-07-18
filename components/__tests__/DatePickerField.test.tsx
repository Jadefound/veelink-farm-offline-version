import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DatePickerField from "../DatePickerField";

describe("DatePickerField", () => {
  it("renders the selected date", () => {
    render(
      <DatePickerField
        label="Birth Date"
        value="2024-06-15"
        onChange={() => {}}
        placeholder="Select a date"
      />
    );

    expect(screen.getByText("Birth Date")).toBeTruthy();
    expect(screen.getByDisplayValue("2024-06-15")).toBeTruthy();
  });

  it("renders placeholder when no date is selected", () => {
    render(
      <DatePickerField
        label="Birth Date"
        value=""
        onChange={() => {}}
        placeholder="Select a date"
      />
    );

    const input = screen.getByPlaceholderText("Select a date");
    expect(input).toBeTruthy();
  });

  it("calls onChange when date is changed", () => {
    const onChange = jest.fn();
    render(
      <DatePickerField
        label="Birth Date"
        value=""
        onChange={onChange}
        placeholder="Select a date"
      />
    );

    const input = screen.getByPlaceholderText("Select a date");
    fireEvent.change(input, { target: { value: "2024-07-18" } });

    expect(onChange).toHaveBeenCalledWith("2024-07-18");
  });
});
