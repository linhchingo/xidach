import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, Avatar, Chip, IconButton, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PaymentIcon from '@mui/icons-material/Payment';
import StarIcon from '@mui/icons-material/Star';
import BoltIcon from '@mui/icons-material/Bolt';

// Cấu hình hiển thị kết quả giống như trong RoundHistory
const resultConfig = {
  win: { label: 'Thắng', color: 'success', icon: <EmojiEventsIcon fontSize="small" /> },
  win_big: { label: 'Thắng x2', color: 'warning', icon: <BoltIcon fontSize="small" /> },
  draw: { label: 'Hoà', color: 'warning', icon: <HandshakeIcon fontSize="small" /> },
  lose: { label: 'Thua', color: 'error', icon: <ThumbDownIcon fontSize="small" /> },
  lose_big: { label: 'Thua x2', color: 'error', icon: <BoltIcon fontSize="small" /> },
  pay: { label: 'Đền', color: 'info', icon: <PaymentIcon fontSize="small" /> },
  host: { label: 'Host', color: 'warning', icon: <StarIcon fontSize="small" /> },
  not_joined: { label: 'Không tham gia', color: 'default', icon: <CloseIcon fontSize="small" /> },
};

export default function PlayerHistoryDialog({ open, onClose, player, rounds }) {
  if (!player) return null;

  // Lấy tất cả các ván đã xong để hiển thị đầy đủ dòng thời gian
  const playerHistory = (rounds || [])
    .filter(round => round.status === 'completed')
    .map(round => {
      const pId = String(player.id);
      const result = round.results?.find(r => String(r.player_id) === pId);
      
      return {
        id: round.id,
        round_number: round.round_number,
        result: result ? result.result : 'not_joined',
        points_change: result ? result.points_change : 0,
        host_name: round.host_name
      };
    })
    .sort((a, b) => b.round_number - a.round_number); // Ván mới nhất lên đầu

  const totalPoints = playerHistory.reduce((sum, h) => sum + h.points_change, 0);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      sx={{ 
        '& .MuiDialog-paper': { 
          borderRadius: 3, 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
        } 
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar 
            src={`https://i.pravatar.cc/150?u=${player.name}-${player.id}`}
            sx={{ border: '2px solid primary.main' }}
          >
            {player.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{player.name}</Typography>
            <Typography variant="caption" color="text.secondary">Lịch sử cuộc chơi</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 0, borderColor: 'rgba(255,255,255,0.08)' }}>
        {playerHistory.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Chưa tham gia ván nào</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Ván</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary' }}>Kết quả</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>Điểm</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {playerHistory.map((row) => {
                  const cfg = resultConfig[row.result];
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>Ván {row.round_number}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Host: {row.host_name}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={React.cloneElement(cfg.icon, { sx: { fontSize: '0.8rem !important' } })}
                          label={cfg.label}
                          color={cfg.color}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          fontWeight={700}
                          color={row.points_change > 0 ? 'success.main' : row.points_change < 0 ? 'error.main' : 'text.secondary'}
                        >
                          {row.points_change > 0 ? '+' : ''}{row.points_change}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between', bgcolor: 'rgba(0,0,0,0.1)' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">Tổng cộng</Typography>
          <Typography variant="h6" fontWeight={800} color={totalPoints >= 0 ? 'success.main' : 'error.main'}>
            {totalPoints > 0 ? '+' : ''}{totalPoints} điểm
          </Typography>
        </Box>
        <Button onClick={onClose} variant="outlined" size="small" sx={{ borderRadius: 2 }}>
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}
