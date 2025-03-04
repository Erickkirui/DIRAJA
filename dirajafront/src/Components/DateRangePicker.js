import React, { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { FaCalendarAlt } from "react-icons/fa";
import { format } from "date-fns";

export default function DateRangePicker({ dateRange, setDateRange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempRange, setTempRange] = useState({ startDate: null, endDate: null });

  const handleSelect = (selectedRange) => {
    if (!selectedRange) return;

    if (selectedRange.from && !selectedRange.to) {
      setTempRange({ startDate: selectedRange.from, endDate: null });
    } else if (selectedRange.from && selectedRange.to) {
      setTempRange({ startDate: selectedRange.from, endDate: selectedRange.to });
    }
  };

  const confirmSelection = () => {
    if (tempRange.startDate && tempRange.endDate) {
      setDateRange(tempRange);
      setShowPicker(false); // Close only after selecting both start and end dates
    }
  };

  return (
    <div className="date-range-picker">
      <button className="select-period-btn" onClick={() => setShowPicker(!showPicker)}>
        Chooose Period <FaCalendarAlt />
      </button>

      {showPicker && (
        <div className="date-picker-container">
          <DayPicker
            mode="range"
            selected={{ from: tempRange.startDate, to: tempRange.endDate }}
            onSelect={handleSelect}
            defaultMonth={tempRange.startDate || new Date()}
            numberOfMonths={1} // Show only one month
          />
          <button className="confirm-btn-date" onClick={confirmSelection} disabled={!tempRange.startDate || !tempRange.endDate}>
            Confirm Selection
          </button>
        </div>
      )}

     
    </div>
  );
}
