"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface MonthPickerProps {
  currentDate: Date;
  onChange: (year: number, month: number) => void;
  className?: string;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ currentDate, onChange, className = "" }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  
  // Create a list of years (+/- 5 years from selected year)
  const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    onChange(newYear, newMonth);
    setShowPicker(false);
  };

  return (
    <div className={`month-picker-container ${className}`} ref={pickerRef}>
      <div className="date-selector" onClick={() => setShowPicker(!showPicker)}>
        <span>{year}년</span>
        <span>{monthNames[month]}</span>
        <ChevronDown size={16} className="picker-icon" />
        
        {showPicker && (
          <div className="picker-dropdown" onClick={e => e.stopPropagation()}>
            <div className="picker-grid">
              <div className="year-col">
                {years.map(y => (
                  <button 
                    key={y} 
                    className={y === year ? 'active' : ''} 
                    onClick={() => handleMonthChange(y, month)}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <div className="month-col">
                {monthNames.map((m, idx) => (
                  <button 
                    key={m} 
                    className={idx === month ? 'active' : ''} 
                    onClick={() => handleMonthChange(year, idx)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthPicker;
