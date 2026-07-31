import React, { useRef, useEffect } from 'react';

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  mask?: boolean;
  error?: boolean;
}

export default function PinInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  mask = true,
  error = false,
}: PinInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split current value into array of length
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputsRef.current[0] && !disabled) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, '');

    if (!cleanDigits) {
      // Cleared digit
      const nextArr = [...digits];
      nextArr[index] = '';
      const newPin = nextArr.join('');
      onChange(newPin);
      return;
    }

    if (cleanDigits.length > 1) {
      // Pasted string or rapid typing
      const pasted = cleanDigits.slice(0, length);
      onChange(pasted);
      const targetFocusIdx = Math.min(pasted.length, length - 1);
      inputsRef.current[targetFocusIdx]?.focus();

      if (pasted.length === length && onComplete) {
        onComplete(pasted);
      }
      return;
    }

    // Single digit input
    const singleDigit = cleanDigits[cleanDigits.length - 1];
    const nextArr = [...digits];
    nextArr[index] = singleDigit;
    const newPin = nextArr.join('');
    onChange(newPin);

    // Focus next box if available
    if (index < length - 1 && singleDigit) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto complete if final digit entered
    if (newPin.length === length && onComplete) {
      onComplete(newPin);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move to previous box and clear it
        const nextArr = [...digits];
        nextArr[index - 1] = '';
        const newPin = nextArr.join('');
        onChange(newPin);
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      {Array.from({ length }, (_, i) => {
        const isFilled = Boolean(digits[i]);
        return (
          <div key={i} className="relative">
            <input
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type={mask ? 'password' : 'tel'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digits[i]}
              disabled={disabled}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onFocus={handleFocus}
              className={`w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl font-black font-mono text-white rounded-2xl border-2 transition-all duration-200 focus:outline-none ${
                error
                  ? 'bg-rose-500/10 border-rose-500 text-rose-300 ring-2 ring-rose-500/20'
                  : isFilled
                  ? 'bg-slate-900 border-sky-500 text-white shadow-lg shadow-sky-500/10 ring-2 ring-sky-500/20'
                  : 'bg-slate-900/80 border-slate-700/80 text-slate-400 focus:border-sky-500 focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            />
            {/* Subtle glow dot when focused or filled */}
            {isFilled && !error && (
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
}
