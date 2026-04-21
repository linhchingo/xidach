import React from 'react';
import {
  Card, CardContent, Typography, Box, Avatar, Chip, Button, Tooltip, IconButton
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BoltIcon from '@mui/icons-material/Bolt';

const resultConfig = {
  win:      { label: 'Thắng',     color: 'success', icon: <EmojiEventsIcon fontSize="small" /> },
  win_big:  { label: 'Thắng x2',    color: 'warning', icon: <BoltIcon fontSize="small" /> },
  draw:     { label: 'Hoà',       color: 'default',  icon: <HandshakeIcon fontSize="small" /> },
  lose:     { label: 'Thua',      color: 'error',   icon: <ThumbDownIcon fontSize="small" /> },
  lose_big: { label: 'Thua x2',     color: 'error',   icon: <BoltIcon fontSize="small" /> },
  pay:      { label: 'Đền',       color: 'info',    icon: <PaymentIcon fontSize="small" /> },
};

// Bảng màu cho badge kết quả hiện tại
const resultBadgeStyle = {
  win_big:  { bgcolor: 'rgba(255,171,64,0.15)', color: '#ffab40', border: '1px solid rgba(255,171,64,0.4)' },
  lose_big: { bgcolor: 'rgba(255,82,82,0.15)',  color: '#ff5252', border: '1px solid rgba(255,82,82,0.4)' },
};

// Thứ tự hiển thị các nút cho non-host: 3 cột hàng 1, 2+1 hàng 2
const NON_HOST_BUTTONS = ['win', 'win_big', 'draw', 'lose', 'pay'];

export default function PlayerCard({
  player, isHost, roundActive, currentResult, onSelectResult,
  moneyPerPoint, roundsPlayed, onRemove, onRestore, onHostBigWin, hasPay,
  onShowHistory
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
      <Box sx={{ mt: 'auto', mb: roundActive && !isHost && isActive ? 1 : 0 }}>
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
      </Box>
    );
  };

  return (
    <Card
      sx={{
        height: '100%', width: '100%',
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
          sx={{ position: 'absolute', top: -10, right: 15, fontWeight: 800, fontSize: '0.6rem', height: 18, zIndex: 3 }}
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

      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Avatar + Name */}
        <Box 
          onClick={() => onShowHistory && onShowHistory(player)}
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 1.5 }, 
            mb: 1, 
            position: 'relative',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.8 }
          }}
        >
          {isHost && isActive && (
            <WorkspacePremiumIcon sx={{
              position: 'absolute', top: -18, left: -2,
              color: '#FFD700', fontSize: { xs: '1.2rem', sm: '1.6rem' },
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
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2" fontWeight={700} noWrap
              sx={{ lineHeight: 1.2, fontSize: { xs: '0.85rem', sm: '1rem' },
                    textDecoration: isActive ? 'none' : 'line-through' }}
            >
              {player.name}{!isActive && ' (Rời đi)'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block' }}>
              Số ván: {roundsPlayed || 0}
            </Typography>
          </Box>
        </Box>

        {/* Points */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            Điểm: {points > 0 ? '+' : ''}{points}đ
          </Typography>
          {points !== 0 && (
            <Typography variant="caption" fontWeight={700}
              sx={{ color: points > 0 ? '#00e676' : '#ff5252', fontSize: '0.7rem', display: 'block' }}
            >
              {points > 0 ? '+' : '-'}{money.toLocaleString('vi-VN')} VNĐ
            </Typography>
          )}
        </Box>

        {/* Current result badge */}
        {renderBadge()}

        {/* ── NON-HOST action buttons ── */}
        {roundActive && !isHost && isActive && (
          <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {/* Row 1: Thắng | Thắng đậm | Hoà (ô giữa rộng hơn để chứa chữ dài) */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr 1.3fr 1fr', sm: '1fr 1fr 1fr' }, 
              gap: 0.5 
            }}>
              {['win', 'win_big', 'draw'].map((result) => (
                <ActionButton
                  key={result} result={result} currentResult={currentResult}
                  onSelect={() => onSelectResult(player.id, result)}
                />
              ))}
            </Box>
            {/* Row 2: Thua | Đền (full width) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
              {['lose', 'pay'].map((result) => (
                <ActionButton
                  key={result} result={result} currentResult={currentResult}
                  onSelect={() => onSelectResult(player.id, result)}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* ── HOST action buttons ── */}
        {roundActive && isHost && isActive && (
          <Box sx={{ mt: 'auto' }}>
            <Tooltip title={hasPay ? 'Có người đền — không thể dùng Thắng x2' : 'Chọn người thua x2'}>
              <span>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  disabled={hasPay}
                  onClick={onHostBigWin}
                  startIcon={<BoltIcon />}
                  sx={{
                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    py: 0.75,
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
              </span>
            </Tooltip>
          </Box>
        )}
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
    lose: 'rgba(255,82,82,0.35)', pay: 'rgba(3,155,229,0.35)',
    draw: 'rgba(255,255,255,0.2)',
  };
  return (
    <Button
      variant={isSelected ? 'contained' : 'outlined'}
      color={cfg.color === 'default' ? 'inherit' : cfg.color}
      onClick={onSelect}
      size="small"
      startIcon={React.cloneElement(cfg.icon, { sx: { fontSize: { xs: '0.65rem !important', sm: '0.75rem !important' } } })}
      sx={{
        fontSize: { xs: '0.48rem', sm: '0.65rem' },
        px: { xs: 0.1, sm: 0.4 }, py: 0.5,
        minWidth: 0, height: 32,
        whiteSpace: 'nowrap',
        letterSpacing: { xs: '-0.02em', sm: 'normal' },
        '& .MuiButton-startIcon': { 
          marginRight: { xs: 0.1, sm: 0.3 }, 
          marginLeft: { xs: -0.6, sm: -0.2 } 
        },
        ...(isSelected && { boxShadow: `0 0 8px ${glowMap[result] || 'transparent'}` }),
      }}
    >
      {cfg.label}
    </Button>
  );
}
