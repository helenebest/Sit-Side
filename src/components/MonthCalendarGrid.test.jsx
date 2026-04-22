import React from 'react';
import { render, screen, within } from '@testing-library/react';
import MonthCalendarGrid from './MonthCalendarGrid';

describe('MonthCalendarGrid', () => {
  it('renders a standard 7x6 month grid shell', () => {
    render(
      <MonthCalendarGrid
        monthDate={new Date(2026, 3, 1)}
        renderDay={(cell) => <span>{cell.date.getDate()}</span>}
      />
    );

    const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdayLabels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    const grid = screen.getByRole('grid', { name: 'Month calendar' });
    const cells = within(grid).getAllByRole('gridcell');
    expect(cells).toHaveLength(42);
  });
});
