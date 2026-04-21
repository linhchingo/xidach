import React from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Avatar
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RemoveIcon from '@mui/icons-material/Remove';

export default function GameStats({ statistics, moneyPerPoint, onPlayerClick }) {
  if (!statistics || statistics.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">Chưa có thống kê</Typography>
      </Box>
    );
  }

  // Sort by points descending
  const sorted = [...statistics].sort((a, b) => b.total_points - a.total_points);

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 3,
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' }, px: { xs: 1, sm: 2 } }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' }, px: { xs: 1, sm: 2 } }}>Người chơi</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' }, px: { xs: 1, sm: 2 } }} align="center">Điểm</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.9rem' }, px: { xs: 1, sm: 2 } }} align="right">Kết quả</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((stat, index) => {
            const points = stat.total_points;
            const isWin = points > 0;
            const isLose = points < 0;
            const money = Math.abs(points) * moneyPerPoint;

            return (
              <TableRow
                key={stat.player_id}
                onClick={() => onPlayerClick && onPlayerClick(stat.player_id)}
                sx={{
                  '&:last-child td': { border: 0 },
                  bgcolor: index === 0 && isWin ? 'rgba(0, 230, 118, 0.05)' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }
                }}
              >
                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                  {index === 0 && isWin ? (
                    <EmojiEventsIcon sx={{ color: '#ffd700', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  ) : (
                    <Typography color="text.secondary" variant="body2">{index + 1}</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                    <Avatar
                      src={`https://i.pravatar.cc/150?u=${stat.player_name}-${stat.player_id}`}
                      sx={{ 
                        width: { xs: 24, sm: 32 }, 
                        height: { xs: 24, sm: 32 }, 
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      {stat.player_name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography fontWeight={600} noWrap sx={{ fontSize: { xs: '0.85rem', sm: '1rem' }, maxWidth: { xs: 80, sm: 'none' } }}>
                      {stat.player_name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ px: { xs: 1, sm: 2 } }}>
                  <Typography
                    fontWeight={700}
                    fontSize={{ xs: '0.9rem', sm: '1.1rem' }}
                    color={isWin ? '#00e676' : isLose ? '#ff5252' : 'text.secondary'}
                  >
                    {points > 0 ? '+' : ''}{points}
                  </Typography>
                  {points !== 0 && (
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ 
                        color: isWin ? '#00e676' : isLose ? '#ff5252' : 'text.secondary', 
                        fontWeight: 600,
                        opacity: 0.9,
                        fontSize: { xs: '0.65rem', sm: '0.75rem' },
                        mt: -0.5
                      }}
                    >
                      {isWin ? '+' : '-'}{money.toLocaleString('vi-VN')}đ
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right" sx={{ px: { xs: 1, sm: 2 } }}>
                  <Chip
                    icon={isWin ? <TrendingUpIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} /> : isLose ? <TrendingDownIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} /> : <RemoveIcon />}
                    label={stat.result_text.split(' ')[0]} // Only show 'Thắng'/'Thua' on mobile if space is tight
                    color={isWin ? 'success' : isLose ? 'error' : 'default'}
                    variant={isWin || isLose ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ fontWeight: 700, fontSize: { xs: '0.7rem', sm: '0.85rem' } }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
