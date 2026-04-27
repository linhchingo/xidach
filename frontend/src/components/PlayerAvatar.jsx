import React from 'react';
import { Avatar } from '@mui/material';
import { getAvatarFileName, getInitials } from '../utils/avatarHelper';

// Bảng màu sắc mềm mại cho fallback initials
const avatarColors = [
  '#7c4dff', // Purple
  '#00e5ff', // Cyan
  '#ffab40', // Orange
  '#ff5252', // Red
  '#00e676', // Green
  '#448aff', // Blue
  '#f06292', // Pink
  '#ba68c8', // Light Purple
  '#4db6ac', // Teal
  '#dce775', // Lime
];

const getAvatarColor = (name) => {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

/**
 * Component PlayerAvatar:
 * - Ưu tiên hiển thị ảnh từ src/assets/avatars/ nếu khớp tên.
 * - Fallback về chữ cái đầu (Initials) với màu nền ngẫu nhiên theo tên.
 */
export default function PlayerAvatar({ name, sx = {}, ...props }) {
  const fileName = getAvatarFileName(name);
  const initials = getInitials(name);
  
  // Giải quyết đường dẫn ảnh từ assets bằng Vite URL API
  // Lưu ý: Tên tệp phải khớp chính xác bao gồm cả phần mở rộng (ví dụ: .png, .jpg)
  const avatarUrl = fileName 
    ? new URL(`../assets/avatars/${fileName}`, import.meta.url).href
    : null;

  return (
    <Avatar
      src={avatarUrl}
      sx={{
        bgcolor: avatarUrl ? 'transparent' : getAvatarColor(name),
        fontWeight: 700,
        fontSize: '0.9rem',
        textShadow: avatarUrl ? 'none' : '0 1px 2px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.1)',
        ...sx
      }}
      {...props}
    >
      {!avatarUrl && initials}
    </Avatar>
  );
}
