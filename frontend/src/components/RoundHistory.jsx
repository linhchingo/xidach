import React from 'react';
import {
  Box, Typography, Chip, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PaymentIcon from '@mui/icons-material/Payment';
import StarIcon from '@mui/icons-material/Star';
import BoltIcon from '@mui/icons-material/Bolt';

const resultIcons = {
  win: <EmojiEventsIcon fontSize="small" sx={{ color: '#00e676' }} />,
  win_big: <BoltIcon fontSize="small" sx={{ color: '#ffab40' }} />,
  draw: <HandshakeIcon fontSize="small" sx={{ color: '#ffab40' }} />,
  lose: <ThumbDownIcon fontSize="small" sx={{ color: '#ff5252' }} />,
  lose_big: <BoltIcon fontSize="small" sx={{ color: '#ff5252' }} />,
  pay: <PaymentIcon fontSize="small" sx={{ color: '#ab47bc' }} />,
  host: <StarIcon fontSize="small" sx={{ color: '#ffab40' }} />,
};

const resultLabels = {
  win: 'Thắng',
  win_big: 'Thắng x2',
  draw: 'Hoà',
  lose: 'Thua',
  lose_big: 'Thua x2',
  pay: 'Đền',
  host: 'Host',
};

const resultColors = {
  win: 'success',
  win_big: 'warning',
  draw: 'warning',
  lose: 'error',
  lose_big: 'error',
  pay: 'info',
  host: 'warning',
};

export default function RoundHistory({ rounds, onPlayerClick }) {
  if (!rounds || rounds.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">Chưa có ván nào được chơi</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {rounds.map((round) => (
        <Accordion
          key={round.id}
          sx={{
            mb: 1,
            bgcolor: 'background.paper',
            '&:before': { display: 'none' },
            border: round.status === 'cancelled'
              ? '1px solid rgba(255, 82, 82, 0.2)'
              : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, width: '100%', pr: { xs: 0, sm: 2 }, flexWrap: 'wrap' }}>
              <Typography fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>Ván {round.round_number}</Typography>
              <Chip
                icon={round.status === 'completed' ? <CheckCircleIcon sx={{ fontSize: '1rem !important' }} /> : <CancelIcon sx={{ fontSize: '1rem !important' }} />}
                label={round.status === 'completed' ? 'Xong' : 'Huỷ'}
                size="small"
                color={round.status === 'completed' ? 'success' : 'error'}
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Host: {round.host_name}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {round.results && round.results.length > 0 ? (
              <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.85rem' }, px: { xs: 1, sm: 2 } }}>Người chơi</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.85rem' }, px: { xs: 1, sm: 2 } }} align="center">Kết quả</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.75rem', sm: '0.85rem' }, px: { xs: 1, sm: 2 } }} align="right">Điểm</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {round.results.map((r) => (
                      <TableRow 
                        key={r.id} 
                        onClick={() => onPlayerClick && onPlayerClick(r.player_id, r.player_name)}
                        sx={{ 
                          '&:last-child td': { border: 0 },
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }
                        }}
                      >
                        <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {r.result === 'host' && <StarIcon sx={{ color: '#ffab40', fontSize: '0.9rem' }} />}
                            <Typography noWrap sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, maxWidth: { xs: 70, sm: 'none' } }}>
                              {r.player_name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ px: { xs: 1, sm: 2 } }}>
                          <Chip
                            icon={React.cloneElement(resultIcons[r.result], { sx: { ...resultIcons[r.result].props.sx, fontSize: '0.9rem !important' } })}
                            label={resultLabels[r.result]}
                            color={resultColors[r.result]}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ px: { xs: 1, sm: 2 } }}>
                          <Typography
                            fontWeight={600}
                            sx={{ 
                              fontSize: { xs: '0.85rem', sm: '1rem' },
                              color: r.points_change > 0 ? '#00e676' : r.points_change < 0 ? '#ff5252' : 'text.secondary'
                            }}
                          >
                            {r.points_change > 0 ? '+' : ''}{r.points_change}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" variant="body2">
                {round.status === 'cancelled' ? 'Ván bị huỷ - không có thay đổi điểm' : 'Không có kết quả'}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
