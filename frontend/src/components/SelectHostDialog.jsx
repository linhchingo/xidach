import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, RadioGroup, FormControlLabel, Radio, Typography, Box, Avatar
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

export default function SelectHostDialog({ open, onClose, players, onSelectHost, currentHostId }) {
  const [selectedHost, setSelectedHost] = useState(String(currentHostId || ''));

  React.useEffect(() => {
    if (open) {
      setSelectedHost(String(currentHostId || ''));
    }
  }, [open, currentHostId]);

  const handleConfirm = () => {
    if (selectedHost) {
      onSelectHost(parseInt(selectedHost));
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableRestoreFocus>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StarIcon sx={{ color: '#ffab40' }} />
        Chọn Host
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chọn người chơi làm host cho ván này
        </Typography>
        <RadioGroup value={selectedHost} onChange={(e) => setSelectedHost(e.target.value)}>
          {players.filter(p => p.is_active !== 0).map((player) => (
            <FormControlLabel
              key={player.id}
              value={String(player.id)}
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={`https://i.pravatar.cc/150?u=${player.name}-${player.id}`}
                    sx={{ 
                      mr: 2, 
                      width: 40, 
                      height: 40,
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography>{player.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({player.total_points > 0 ? '+' : ''}{player.total_points} điểm)
                  </Typography>
                </Box>
              }
              sx={{
                mb: 0.5,
                borderRadius: 2,
                px: 1,
                '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.08)' }
              }}
            />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Huỷ</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!selectedHost}>
          Xác nhận
        </Button>
      </DialogActions>
    </Dialog>
  );
}
