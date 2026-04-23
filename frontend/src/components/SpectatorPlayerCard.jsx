import React from 'react';
import {
  Card, CardContent, Typography, Box, Avatar, Chip
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ComicText from './ComicText';

/**
 * Comic text config for each result type.
 * - label: text displayed in comic style
 * - color: main fill color of the comic text
 * - dotColor: halftone dot overlay color
 * - rotate: CSS rotation for "street" feel
 * - opacity: how visible the text is (x2 results are more prominent)
 */
const comicResultConfig = {
  win: { label: 'Win!', color: '#4CAF50', dotColor: '#2E7D32', rotate: '-8deg', opacity: 0.7 },
  win_big: { label: 'Win x2!', color: '#FACC15', dotColor: '#EF4444', rotate: '-8deg', opacity: 1 },
  draw: { label: 'Draw', color: '#9E9E9E', dotColor: '#616161', rotate: '-8deg', opacity: 0.5 },
  lose: { label: 'Lose!', color: '#ff5252', dotColor: '#B71C1C', rotate: '-8deg', opacity: 0.7 },
  lose_big: { label: 'Lose x2!', color: '#ff1744', dotColor: '#880E4F', rotate: '-8deg', opacity: 1 },
  pay: { label: 'Pay!', color: '#CE93D8', dotColor: '#7B1FA2', rotate: '-8deg', opacity: 1 },
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

  const comicCfg = currentResult ? comicResultConfig[currentResult] : null;

  return (
    <Card
      sx={{
        height: '100%', width: '100%', minWidth: 0,
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'visible',
        bgcolor: isActive
          ? (currentResult
            ? (currentResult === 'win' || currentResult === 'win_big' ? 'rgba(76, 175, 80, 0.04)' :
              currentResult === 'lose' || currentResult === 'lose_big' ? 'rgba(255, 82, 82, 0.04)' :
                currentResult === 'pay' ? 'rgba(208, 33, 243, 0.04)' : 'background.paper')
            : (isHost ? 'rgba(255,171,64,0.05)' : 'background.paper'))
          : 'rgba(0,0,0,0.1)',
        border: currentResult
          ? (currentResult === 'win' ? '1px solid rgba(76, 175, 80, 0.5)' :
            currentResult === 'win_big' ? '1px solid rgba(255, 171, 64, 0.7)' :
              currentResult === 'draw' ? '1px solid rgba(158, 158, 158, 0.4)' :
                currentResult === 'lose' ? '1px solid rgba(255, 82, 82, 0.5)' :
                  currentResult === 'lose_big' ? '1px solid rgba(255, 82, 82, 0.8)' :
                    currentResult === 'pay' ? '1px solid rgba(208, 33, 243, 0.5)' : '1px solid rgba(255,255,255,0.06)')
          : (isHost
            ? '1px solid rgba(255,171,64,0.3)'
            : '1px solid rgba(255,255,255,0.06)'),
        boxShadow: currentResult ? (
          currentResult.includes('win') ? '0 0 10px rgba(76, 175, 80, 0.15)' :
            currentResult.includes('lose') ? '0 0 10px rgba(255, 82, 82, 0.15)' : 'none'
        ) : 'none',
        transition: 'all 0.3s ease',
        opacity: isActive ? 1 : 0.6,
        filter: isActive ? 'none' : 'grayscale(0.5)',
        '&:hover': isActive ? {
          transform: 'translateY(-4px)',
          boxShadow: currentResult ? (
            currentResult.includes('win') ? '0 8px 25px rgba(76, 175, 80, 0.25)' :
              currentResult.includes('lose') ? '0 8px 25px rgba(255, 82, 82, 0.25)' : '0 8px 25px rgba(0,0,0,0.2)'
          ) : '0 8px 25px rgba(0,0,0,0.2)',
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

      {/* Comic text result overlay — centered in card, behind content z-index */}
      {comicCfg && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${comicCfg.rotate})`,
            zIndex: 1,
            pointerEvents: 'none',
            opacity: comicCfg.opacity,
            transition: 'opacity 0.3s ease',
          }}
        >
          <ComicText
            fontSize={3}
            color={comicCfg.color}
            dotColor={comicCfg.dotColor}
            sx={{
              whiteSpace: 'nowrap',
            }}
          >
            {comicCfg.label}
          </ComicText>
        </Box>
      )}

      <CardContent sx={{
        p: { xs: 1, sm: 1.5 },
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        position: 'relative',
        zIndex: 2,
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

        {/* Right side: Points only (badge replaced by comic text overlay) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right', flexShrink: 0 }}>
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
      </CardContent>
    </Card>
  );
}
