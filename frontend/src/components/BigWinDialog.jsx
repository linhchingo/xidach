import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Avatar, Checkbox, FormControlLabel, Divider, Chip
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';

export default function BigWinDialog({ open, onClose, onConfirm, eligiblePlayers }) {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (open) setSelectedIds([]);
  }, [open]);

  const togglePlayer = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedIds);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableRestoreFocus>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BoltIcon sx={{ color: '#ff6d00' }} />
        Chọn người Thua x2
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chọn những người chơi bị thua x2 (-2 điểm mỗi người). Chỉ hiển thị người chưa chọn kết quả.
        </Typography>

        {eligiblePlayers.length === 0 ? (
          <Box sx={{
            textAlign: 'center', py: 3,
            bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2
          }}>
            <Typography color="text.secondary" variant="body2">
              Tất cả người chơi đã có kết quả
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {eligiblePlayers.map((player) => {
              const checked = selectedIds.includes(player.id);
              return (
                <Box
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 1.5, py: 1, borderRadius: 2, cursor: 'pointer',
                    bgcolor: checked ? 'rgba(255,109,0,0.12)' : 'rgba(255,255,255,0.03)',
                    border: checked ? '1px solid rgba(255,109,0,0.4)' : '1px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: checked ? 'rgba(255,109,0,0.18)' : 'rgba(255,255,255,0.06)' }
                  }}
                >
                  <Checkbox
                    checked={checked}
                    onChange={() => togglePlayer(player.id)}
                    size="small"
                    color="warning"
                    onClick={(e) => e.stopPropagation()}
                    sx={{ p: 0 }}
                  />
                  <Avatar
                    src={`https://i.pravatar.cc/150?u=${player.name}-${player.id}`}
                    sx={{ width: 32, height: 32, border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                    {player.name}
                  </Typography>
                  {checked && (
                    <Chip
                      icon={<BoltIcon sx={{ fontSize: '0.8rem !important' }} />}
                      label="Thua x2"
                      size="small"
                      color="error"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {selectedIds.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{
              p: 1.5, borderRadius: 2,
              bgcolor: 'rgba(255,109,0,0.08)',
              border: '1px solid rgba(255,109,0,0.2)'
            }}>
              <Typography variant="caption" color="warning.light" fontWeight={700}>
                <BoltIcon sx={{ fontSize: '0.8rem', verticalAlign: 'middle' }} />{' '}
                Host: +{selectedIds.length * 2} điểm &nbsp;|&nbsp;
                {selectedIds.length} người: -2 điểm mỗi người
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Hủy</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={selectedIds.length === 0 || eligiblePlayers.length === 0}
          startIcon={<BoltIcon />}
        >
          Xác nhận ({selectedIds.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
