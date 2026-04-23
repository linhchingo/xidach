import React, { useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';

const PIN_LENGTH = 6;

/**
 * OTP-style 6-digit PIN input component.
 * Each digit gets its own square input box with numeric keyboard on mobile.
 *
 * Props:
 *  - value: string (up to 6 chars)
 *  - onChange: (pinString) => void
 *  - error: boolean
 *  - errorText: string (optional)
 *  - autoFocus: boolean
 *  - label: string (optional)
 */
export default function PinInput({ value = '', onChange, error = false, errorText, autoFocus = false, label }) {
  const inputsRef = useRef([]);

  const digits = value.split('').concat(Array(PIN_LENGTH).fill('')).slice(0, PIN_LENGTH);

  const focusInput = useCallback((index) => {
    if (index >= 0 && index < PIN_LENGTH && inputsRef.current[index]) {
      inputsRef.current[index].focus();
    }
  }, []);

  const updateValue = useCallback((newDigits) => {
    const pin = newDigits.join('').slice(0, PIN_LENGTH);
    onChange(pin);
  }, [onChange]);

  const handleChange = useCallback((index, e) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) return;

    const newDigits = [...digits];
    newDigits[index] = val.charAt(val.length - 1); // take last digit typed
    updateValue(newDigits);

    // Auto-advance to next input
    if (index < PIN_LENGTH - 1) {
      focusInput(index + 1);
    }
  }, [digits, focusInput, updateValue]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...digits];
      if (newDigits[index]) {
        newDigits[index] = '';
        updateValue(newDigits);
      } else if (index > 0) {
        newDigits[index - 1] = '';
        updateValue(newDigits);
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusInput(index + 1);
    }
  }, [digits, focusInput, updateValue]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    if (pasted) {
      const newDigits = pasted.split('').concat(Array(PIN_LENGTH).fill('')).slice(0, PIN_LENGTH);
      updateValue(newDigits);
      focusInput(Math.min(pasted.length, PIN_LENGTH - 1));
    }
  }, [focusInput, updateValue]);

  const handleFocus = useCallback((e) => {
    e.target.select();
  }, []);

  return (
    <Box>
      {label && (
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ mb: 1, display: 'block', color: error ? 'error.main' : 'text.secondary' }}
        >
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1 }, justifyContent: 'center' }}>
        {digits.map((digit, i) => (
          <Box
            key={i}
            component="input"
            ref={(el) => { inputsRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            autoFocus={autoFocus && i === 0}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={handleFocus}
            sx={{
              width: { xs: 44, sm: 52 },
              height: { xs: 52, sm: 60 },
              textAlign: 'center',
              fontSize: { xs: '1.4rem', sm: '1.6rem' },
              fontWeight: 700,
              fontFamily: '"Inter", "Roboto Mono", monospace',
              border: error
                ? '2px solid rgba(255, 82, 82, 0.7)'
                : digit
                  ? '2px solid rgba(124, 77, 255, 0.5)'
                  : '2px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              bgcolor: 'rgba(255, 255, 255, 0.04)',
              color: '#fff',
              outline: 'none',
              caretColor: '#7c4dff',
              transition: 'all 0.2s ease',
              '&:focus': {
                borderColor: error ? '#ff5252' : '#7c4dff',
                boxShadow: error
                  ? '0 0 0 3px rgba(255, 82, 82, 0.2)'
                  : '0 0 0 3px rgba(124, 77, 255, 0.25)',
                bgcolor: 'rgba(124, 77, 255, 0.06)',
              },
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.15)',
              },
            }}
          />
        ))}
      </Box>
      {error && errorText && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
          {errorText}
        </Typography>
      )}
    </Box>
  );
}
