import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useDispatch } from 'react-redux';
import { addPlayer } from '../store/gamesSlice';
import { toast } from 'react-toastify';

export default function AddPlayerDialog({ open, onClose, gameId }) {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

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
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableRestoreFocus>
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
