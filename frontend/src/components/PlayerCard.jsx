import React from 'react';
import {
  Card, CardContent, Typography, Box, Chip, Button, Tooltip, IconButton
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BoltIcon from '@mui/icons-material/Bolt';
import PlayerAvatar from './PlayerAvatar';

const resultConfig = {
  win: { label: 'Thắng', color: 'success', icon: <EmojiEventsIcon fontSize="small" /> },
  win_big: { label: 'Thắng x2', color: 'warning', icon: <BoltIcon fontSize="small" /> },
  draw: { label: 'Hoà', color: 'default', icon: <HandshakeIcon fontSize="small" /> },
  lose: { label: 'Thua', color: 'error', icon: <ThumbDownIcon fontSize="small" /> },
  lose_big: { label: 'Thua x2', color: 'error', icon: <BoltIcon fontSize="small" /> },
  pay: { label: 'Đền', color: 'info', icon: <PaymentIcon fontSize="small" /> },
};

// Bảng màu cho badge kết quả hiện tại
const resultBadgeStyle = {
  win_big: { bgcolor: 'rgba(255,171,64,0.15)', color: '#ffab40', border: '1px solid rgba(255,171,64,0.4)' },
  lose_big: { bgcolor: 'rgba(255,82,82,0.15)', color: '#ff5252', border: '1px solid rgba(255,82,82,0.4)' },
};

// Thứ tự hiển thị các nút cho non-host: 2 hàng, mỗi hàng 3 nút
const NON_HOST_BUTTONS = ['win', 'win_big', 'draw', 'lose', 'lose_big', 'pay'];

export default function PlayerCard({
  player, isHost, roundActive, currentResult, onSelectResult,
  moneyPerPoint, roundsPlayed, onRemove, onRestore, onHostBigWin, hasPay,
  onShowHistory
}) {
  const points = player.total_points;
  const money = Math.abs(points) * (moneyPerPoint || 0);
  const isActive = player.is_active !== 0;

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
        '@media (hover: hover)': {
          '&:hover': isActive ? {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          } : {}
        }
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

      {/* Remove / Restore button */}
      {isActive ? (
        !isHost && (
          <Tooltip title="Loại người chơi">
            <IconButton
              size="small"
              onClick={() => onRemove(player.id)}
              sx={{
                position: 'absolute', top: -10, right: -10, zIndex: 3,
                bgcolor: 'rgba(255,82,82,0.1)', color: '#ff5252',
                border: '1px solid rgba(255,82,82,0.2)',
                '&:hover': { bgcolor: '#ff5252', color: 'white' }
              }}
            >
              <PersonRemoveIcon sx={{ fontSize: '0.8rem' }} />
            </IconButton>
          </Tooltip>
        )
      ) : (
        <Tooltip title="Thêm lại người chơi">
          <IconButton
            size="small"
            onClick={() => onRestore && onRestore(player.name)}
            sx={{
              position: 'absolute', top: -10, right: -10, zIndex: 3,
              bgcolor: 'rgba(0,230,118,0.1)',
              border: '1px solid rgba(0,230,118,0.2)',
              '&:hover': { bgcolor: '#00e676', color: 'white' }
            }}
          >
            <PersonAddIcon sx={{ fontSize: '0.8rem' }} />
          </IconButton>
        </Tooltip>
      )}

      <CardContent sx={{
        p: { xs: 1, sm: 0.75, md: 1 },
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: { xs: 1, sm: 0.5, md: 1 },
        position: 'relative',
        zIndex: 2,
        minHeight: { xs: 76, sm: 72 },
        '&:last-child': {
          pb: { xs: 1, sm: 0.75, md: 1 }
        }
      }}>
        {/* 1. Left side: Avatar + Name */}
        <Box
          onClick={() => onShowHistory && onShowHistory(player)}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 0.5,
            position: 'relative',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.8 },
            flex: 1,
            minWidth: 0
          }}
        >
          <Box sx={{ position: 'relative', display: 'inline-block' }}>
            {isHost && isActive && (
              <WorkspacePremiumIcon sx={{
                position: 'absolute', top: -10, left: -10,
                color: '#FFD700', fontSize: { xs: '1.2rem', sm: '1rem' },
                filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.6))',
                zIndex: 2, transform: 'rotate(-10deg)'
              }} />
            )}
            <PlayerAvatar
              name={player.name}
              sx={{
                width: { xs: 36, sm: 28, md: 36 }, height: { xs: 36, sm: 28, md: 36 },
                border: isHost && isActive ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0
              }}
            />
          </Box>
          <Box sx={{ minWidth: 0, width: '100%' }}>
            <Typography
              variant="subtitle2" fontWeight={700} noWrap
              sx={{
                lineHeight: 1.5, fontSize: { xs: '0.85rem', sm: '0.7rem', md: '0.85rem' },
                textDecoration: isActive ? 'none' : 'line-through'
              }}
            >
              {player.name}{!isActive && ' (Rời)'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: { xs: '0.65rem', sm: '0.55rem' }, display: 'block', lineHeight: 1.1 }}>
              Số ván: {roundsPlayed || 0}
            </Typography>
          </Box>
        </Box>

        {/* 2. Center side: Action Buttons */}
        <Box sx={{ display: 'flex', flexShrink: 0, justifyContent: 'center' }}>
          {roundActive && isActive && !isHost && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
              {/* Row 1 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                {['win', 'win_big', 'draw'].map((result) => (
                  <ActionButton
                    key={result} result={result} currentResult={currentResult}
                    onSelect={() => onSelectResult(player.id, result)}
                  />
                ))}
              </Box>
              {/* Row 2 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                {['lose', 'lose_big', 'pay'].map((result) => (
                  <ActionButton
                    key={result} result={result} currentResult={currentResult}
                    onSelect={() => onSelectResult(player.id, result)}
                  />
                ))}
              </Box>
            </Box>
          )}

          {roundActive && isActive && isHost && (
            <Tooltip title={hasPay ? 'Có người đền — không thể dùng Thắng x2' : 'Chọn người thua x2'}>
              <Box sx={{ width: '100%' }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  disabled={hasPay}
                  onClick={onHostBigWin}
                  startIcon={<BoltIcon />}
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.6rem', md: '0.7rem' },
                    py: { xs: 1, sm: 0.5 },
                    height: { xs: 36, sm: 28, md: 32 },
                    minWidth: { xs: 140, sm: 100 },
                    background: hasPay
                      ? undefined
                      : 'linear-gradient(135deg, #ff6d00 0%, #ffab40 100%)',
                    fontWeight: 700,
                    boxShadow: hasPay ? 'none' : '0 4px 12px rgba(255,109,0,0.35)',
                    '&:hover': { opacity: 0.9 }
                  }}
                >
                  Thắng x2
                </Button>
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* 3. Right side: Points */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.65rem', md: '0.75rem' }, fontWeight: 600, display: 'block', lineHeight: 1.2 }}>
            Điểm: {points > 0 ? '+' : ''}{points}đ
          </Typography>
          {points !== 0 && (
            <Typography variant="caption" fontWeight={700} noWrap
              sx={{ color: points > 0 ? '#00e676' : '#ff5252', fontSize: { xs: '0.7rem', sm: '0.6rem', md: '0.7rem' }, display: 'block', lineHeight: 1.2, mt: 0.5 }}
            >
              {points > 0 ? '+' : '-'}{money.toLocaleString('vi-VN')} VNĐ
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// Helper inline component for action buttons
function ActionButton({ result, currentResult, onSelect }) {
  const cfg = resultConfig[result];
  const isSelected = currentResult === result;
  const glowMap = {
    win: 'rgba(0,230,118,0.35)', win_big: 'rgba(255,171,64,0.4)',
    lose: 'rgba(255,82,82,0.35)', lose_big: 'rgba(255,82,82,0.5)',
    pay: 'rgba(3,155,229,0.35)',
    draw: 'rgba(255,255,255,0.2)',
  };
  return (
    <Button
      fullWidth
      variant={isSelected ? 'contained' : 'outlined'}
      color={cfg.color === 'default' ? 'inherit' : cfg.color}
      onClick={onSelect}
      size="small"
      startIcon={React.cloneElement(cfg.icon, { sx: { fontSize: { xs: '0.75rem !important', sm: '0.55rem !important', md: '0.65rem !important' } } })}
      sx={{
        fontSize: { xs: '0.55rem', sm: '0.45rem', md: '0.5rem' },
        px: { xs: 0.2, sm: 0.1, md: 0.3 }, py: 0.2,
        minWidth: 0, height: { xs: 32, sm: 24, md: 28 },
        whiteSpace: 'nowrap',
        lineHeight: 1.1,
        letterSpacing: { xs: '-0.02em', sm: 'normal' },
        '& .MuiButton-startIcon': {
          marginRight: { xs: 0.3, sm: 0.2 },
          marginLeft: { xs: -0.2, sm: -0.2 },
        },
        ...(isSelected && { 
          boxShadow: `0 0 8px ${glowMap[result] || 'transparent'}`,
          border: '1px solid transparent' 
        }),
      }}
    >
      {cfg.label}
    </Button>
  );
}
