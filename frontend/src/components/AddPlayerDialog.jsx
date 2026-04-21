import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useDispatch } from 'react-redux';
import { addPlayer } from '../store/gamesSlice';
import { toast } from 'react-toastify';
import useVisualViewport from '../hooks/useVisualViewport';

export default function AddPlayerDialog({ open, onClose, gameId }) {
  const dispatch = useDispatch();
  const { height: vpHeight, offsetTop: vpOffset, lockScroll, unlockScroll } = useVisualViewport();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Lock/unlock body scroll when dialog opens/closes
  useEffect(() => {
    if (open) {
      lockScroll();
    } else {
      unlockScroll();
    }
    // Ensure unlock on unmount
    return () => unlockScroll();
  }, [open, lockScroll, unlockScroll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tên người chơi không được để trống');
      return;
    }

    setLoading(true);
    try {
      await dispatch(addPlayer({ gameId, name: name.trim() })).unwrap();
      toast.success(`Đã thêm người chơi "${name.trim()}"`);
      setName('');
      onClose();
    } catch (err) {
      toast.error(err.error || 'Lỗi thêm người chơi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
      sx={{
        '&.MuiModal-root': {
          top: `${vpOffset}px`,
          height: `${vpHeight}px`,
          bottom: 'auto',
          transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '& .MuiDialog-paper': {
          maxHeight: `calc(${vpHeight}px - 64px)`,
          transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon color="secondary" />
          Thêm Người Chơi
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Tên người chơi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
              required
              placeholder="Nhập tên người chơi"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" color="inherit">Huỷ</Button>
          <Button type="submit" variant="contained" color="secondary" disabled={loading}>
            {loading ? 'Đang thêm...' : 'Thêm'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
