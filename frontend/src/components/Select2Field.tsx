'use client';

import { useEffect, useRef } from 'react';
import $ from 'jquery';
import initializeSelect2 from 'select2';

type Select2FieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
};

export default function Select2Field({
  id,
  value,
  onChange,
  children,
  className = '',
  disabled = false,
  ariaLabel,
}: Select2FieldProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!selectRef.current) return;
    if (typeof $.fn.select2 !== 'function') initializeSelect2(window, $);
    const select = $(selectRef.current);
    select.select2({ width: '100%' });
    const handleChange = () => {
      const selected = select.val();
      onChangeRef.current(typeof selected === 'string' ? selected : '');
    };
    select.on('change.select2-react', handleChange);

    return () => {
      select.off('.select2-react');
      if (select.hasClass('select2-hidden-accessible')) select.select2('destroy');
    };
  }, []);

  useEffect(() => {
    if (selectRef.current) {
      $(selectRef.current).val(value).trigger('change.select2');
    }
  }, [value]);

  return (
    <select
      ref={selectRef}
      id={id}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`form-control ${className}`}
      onChange={(event) => onChangeRef.current(event.target.value)}
    >
      {children}
    </select>
  );
}
