import React from 'react';
import {
  Card, CardContent, Typography, Box, Avatar, Chip
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PaymentIcon from '@mui/icons-material/Payment';
import BoltIcon from '@mui/icons-material/Bolt';

const resultConfig = {
  win: { label: 'Thắng', color: 'success', icon: <EmojiEventsIcon fontSize="small" /> },
  win_big: { label: 'Thắng x2', color: 'warning', icon: <BoltIcon fontSize="small" /> },
  draw: { label: 'Hoà', color: 'default', icon: <HandshakeIcon fontSize="small" /> },
  lose: { label: 'Thua', color: 'error', icon: <ThumbDownIcon fontSize="small" /> },
  lose_big: { label: 'Thua x2', color: 'error', icon: <BoltIcon fontSize="small" /> },
  pay: { label: 'Đền', color: 'info', icon: <PaymentIcon fontSize="small" /> },
};

const resultBadgeStyle = {
  win_big: { bgcolor: 'rgba(255,171,64,0.15)', color: '#ffab40', border: '1px solid rgba(255,171,64,0.4)' },
  lose_big: { bgcolor: 'rgba(255,82,82,0.15)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.4)' },
};

/**
 * Read-only player card for Spectator view.
 * Shows player info, stats, and current round result — but NO action buttons.
 *
 * Props:
 *  - player, isHost, roundActive, currentResult
 *  - moneyPerPoint, roundsPlayed, onShowHistory
 */
export default function SpectatorPlayerCard({
  player, isHost, roundActive, currentResult,
  moneyPerPoint, roundsPlayed, onShowHistory
}) {
  const points = player.total_points;
  const money = Math.abs(points) * (moneyPerPoint || 0);
  const isActive = player.is_active !== 0;

  const renderBadge = () => {
    if (!currentResult) return null;
    const cfg = resultConfig[currentResult];
    if (!cfg) return null;
    const extraStyle = resultBadgeStyle[currentResult] || {};
    return (
      <Chip
        icon={React.cloneElement(cfg.icon, { sx: { fontSize: '0.85rem !important' } })}
        label={cfg.label}
        size="small"
        sx={{
          fontWeight: 700, height: 22, fontSize: '0.7rem',
          ...extraStyle
        }}
        color={extraStyle.color ? undefined : cfg.color}
      />
    );
  };

  return (
    <Card
      sx={{
        height: '100%', width: '100%', minWidth: 0,
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'visible',
        bgcolor: isActive
          ? (isHost ? 'rgba(255,171,64,0.05)' : 'background.paper')
          : 'rgba(0,0,0,0.1)',
        border: isHost
          ? '1px solid rgba(255,171,64,0.3)'
          : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.3s ease',
        opacity: isActive ? 1 : 0.6,
        filter: isActive ? 'none' : 'grayscale(0.5)',
        '&:hover': isActive ? {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
        } : {}
      }}
    >
      {/* HOST badge */}
      {isHost && isActive && (
        <Chip
          label="HOST"
          size="small"
          color="warning"
          sx={{ position: 'absolute', top: -10, right: "50%", fontWeight: 800, fontSize: '0.6rem', height: 18, zIndex: 3, transform: "translateX(50%)" }}
        />
      )}

      <CardContent sx={{
        p: { xs: 1, sm: 1.5 },
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        '&:last-child': {
          pb: { xs: 1, sm: 1.5 }
        }
      }}>
        {/* Left side: Avatar + Name — clickable for history */}
        <Box
          onClick={() => onShowHistory && onShowHistory(player)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 1.5 },
            position: 'relative',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.8 },
            flex: 1,
            minWidth: 0
          }}
        >
          {isHost && isActive && (
            <WorkspacePremiumIcon sx={{
              position: 'absolute', top: -14, left: -4,
              color: '#FFD700', fontSize: { xs: '1.2rem', sm: '1.4rem' },
              filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.6))',
              zIndex: 2, transform: 'rotate(-10deg)'
            }} />
          )}
          <Avatar
            src={`https://i.pravatar.cc/150?u=${player.name}-${player.id}`}
            sx={{
              width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 },
              border: isHost && isActive ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {player.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2" fontWeight={700} noWrap
              sx={{
                lineHeight: 1.2, fontSize: { xs: '0.85rem', sm: '1rem' },
                textDecoration: isActive ? 'none' : 'line-through'
              }}
            >
              {player.name}{!isActive && ' (Rời đi)'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
              Số ván: {roundsPlayed || 0}
            </Typography>
          </Box>
        </Box>

        {/* Right side: Points + Badge */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', gap: 0.5, flexShrink: 0 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
              Điểm: {points > 0 ? '+' : ''}{points}đ
            </Typography>
            {points !== 0 && (
              <Typography variant="caption" fontWeight={700}
                sx={{ color: points > 0 ? '#00e676' : '#ff5252', fontSize: '0.7rem', display: 'block', lineHeight: 1.2 }}
              >
                {points > 0 ? '+' : '-'}{money.toLocaleString('vi-VN')} VNĐ
              </Typography>
            )}
          </Box>
          {renderBadge()}
        </Box>
      </CardContent>
    </Card>
  );
}
