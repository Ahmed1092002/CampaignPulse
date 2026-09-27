'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from './Button';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, isSameDay, differenceInDays, subDays } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  maxDate?: Date;
  label?: string;
  selecting?: 'from' | 'to';
  setSelecting?: (selecting: 'from' | 'to') => void;
}

export function DateRangePicker({ range, onChange, maxDate, label, selecting, setSelecting }: DateRangePickerProps) {
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [selectingMode, setSelectingMode] = useState<'from' | 'to'>('from');

  const handleDayClick = (date: Date) => {
    if (maxDate && date > maxDate) return;
    
    if (selecting === 'from') {
      onChange({ ...range, from: startOfDay(date) });
      setSelecting('to');
    } else {
      const newTo = date < range.from ? range.from : endOfDay(date);
      onChange({ ...range, to: newTo });
      setSelecting('from');
    }
  };

  const monthsToShow = 2;
  const currentMonth = range.from;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">{label || 'Select Date Range'}</h4>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: monthsToShow }).map((_, i) => {
          const monthDate = new Date(currentMonth);
          monthDate.setMonth(monthDate.getMonth() + i);
          return <MonthCalendar month={monthDate} range={range} hoveredDate={hoveredDate} onDayClick={handleDayClick} onHover={setHoveredDate} selecting={selectingMode} maxDate={maxDate} />;
        })}
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{range.from ? format(range.from, 'MMM d, yyyy') : 'Start'}</span>
          <span>→</span>
          <span>{range.to ? format(range.to, 'MMM d, yyyy') : 'End'}</span>
        </div>
      </div>
    </div>
  );
}

function MonthCalendar({ month, range, hoveredDate, onDayClick, onHover, selecting, maxDate }: any) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const firstDayOfWeek = monthStart.getDay();
  const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

  return (
    <div>
      <div className="text-center font-medium mb-2">{format(month, 'MMMM yyyy')}</div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-muted-foreground py-1 text-xs">{d}</div>)}
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={i} className="h-8" />)}
        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const date = new Date(monthStart);
          date.setDate(i + 1);
          const isToday = isSameDay(date, new Date());
          const isSelected = (range.from && isSameDay(date, range.from)) || (range.to && isSameDay(date, range.to));
          const isInRange = range.from && range.to && date > range.from && date < range.to;
          const isHovered = hoveredDate && isSameDay(date, hoveredDate);
          const isDisabled = maxDate && date > maxDate;

          return (
            <button
              key={i}
              type="button"
              onClick={() => !isDisabled && onDayClick(date)}
              onMouseEnter={() => !isDisabled && onHover(date)}
              className={cn(
                'h-8 w-full rounded transition-colors',
                isSelected && 'bg-primary text-primary-foreground font-medium',
                isInRange && 'bg-primary/10',
                isHovered && !isSelected && !isInRange && 'bg-muted',
                isToday && 'ring-2 ring-primary',
                isDisabled && 'text-muted-foreground/50 cursor-not-allowed',
              )}
              disabled={isDisabled}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}