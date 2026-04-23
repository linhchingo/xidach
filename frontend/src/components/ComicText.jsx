import React from 'react';
import { Box } from '@mui/material';

/**
 * ComicText — Comic book style text component inspired by Magic UI.
 * Pure CSS implementation (no framer-motion dependency).
 *
 * Props:
 *  - children: string — text to display
 *  - fontSize: number — font size in rem (default 3)
 *  - color: string — base fill color (default '#FACC15')
 *  - dotColor: string — halftone dot color (default '#EF4444')
 *  - strokeColor: string — text outline color (default '#000')
 *  - sx: object — additional MUI sx styles
 *  - style: object — additional inline styles
 *  - className: string
 */
export default function ComicText({
  children,
  fontSize = 3,
  color = '#FACC15',
  dotColor = '#EF4444',
  strokeColor = '#000000',
  sx = {},
  style = {},
  className,
  ...rest
}) {
  return (
    <Box
      className={className}
      sx={{
        display: 'inline-block',
        textAlign: 'center',
        userSelect: 'none',
        fontSize: `${fontSize}rem`,
        fontFamily: "'Bangers', 'Comic Sans MS', 'Impact', sans-serif",
        fontWeight: 300,
        WebkitTextStroke: `${Math.max(fontSize * 0.3, 2)}px ${strokeColor}`,
        textTransform: 'uppercase',
        filter: `
          drop-shadow(2px 2px 0px ${strokeColor})
          drop-shadow(3px 3px 0px ${dotColor})
        `,
        backgroundColor: color,
        backgroundImage: `radial-gradient(circle at 1px 1px, ${dotColor} 1px, transparent 0)`,
        backgroundSize: '6px 6px',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        lineHeight: 1,
        letterSpacing: '0.03em',
        animation: 'comicTextPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both',
        '@keyframes comicTextPop': {
          '0%': { opacity: 0, transform: 'scale(0) rotate(-50deg)' },
          '100%': { opacity: 1, transform: 'scale(1) rotate(0deg)' },
        },
        ...sx,
      }}
      style={style}
      {...rest}
    >
      {children}
    </Box>
  );
}
