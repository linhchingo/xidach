import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, InputAdornment, Box
} from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import PinInput from './PinInput';
import { useDispatch } from 'react-redux';
import { createGame } from '../store/gamesSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import useVisualViewport from '../hooks/useVisualViewport';

export default function CreateGameDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { height: vpHeight, offsetTop: vpOffset, lockScroll, unlockScroll } = useVisualViewport();
  const [name, setName] = useState('');
  const [gameDate, setGameDate] = useState(new Date().toISOString().split('T')[0]);
  const [moneyPerPoint, setMoneyPerPoint] = useState('1000');
  const [managerPin, setManagerPin] = useState('');
  const [pinError, setPinError] = useState(false);
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
      toast.error('Tên cuộc chơi không được để trống');
      return;
    }
    if (!gameDate) {
      toast.error('Vui lòng chọn ngày');
      return;
    }
    if (!moneyPerPoint || parseInt(moneyPerPoint) <= 0) {
      toast.error('Số tiền mỗi điểm phải lớn hơn 0');
      return;
    }
    if (managerPin.length !== 6) {
      setPinError(true);
      toast.error('Mật khẩu quản lý phải đúng 6 chữ số');
      return;
    }
    setPinError(false);

    setLoading(true);
    try {
      const result = await dispatch(createGame({
        name: name.trim(),
        game_date: gameDate,
        money_per_point: parseInt(moneyPerPoint),
        manager_pin: managerPin,
      })).unwrap();
      // Save PIN to localStorage so creator is auto-authenticated as Manager
      localStorage.setItem(`game_pin_${result.id}`, managerPin);
      toast.success(`Đã tạo cuộc chơi "${result.name}"`);
      onClose();
      setName('');
      setMoneyPerPoint('1000');
      setManagerPin('');
      navigate(`/game/${result.id}`);
    } catch (err) {
      toast.error(err.error || 'Lỗi tạo cuộc chơi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          <SportsEsportsIcon color="primary" />
          Tạo Cuộc Chơi Mới
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label="Tên cuộc chơi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
              required
              placeholder="VD: Xì dách cuối tuần"
            />
            <TextField
              label="Ngày chơi"
              type="date"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              fullWidth
              required
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
            <TextField
              label="Số tiền mỗi điểm"
              type="number"
              value={moneyPerPoint}
              onChange={(e) => setMoneyPerPoint(e.target.value)}
              fullWidth
              required
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">VNĐ</InputAdornment>,
                },
                htmlInput: { min: 1 },
              }}
            />
            <PinInput
              label="Mật khẩu quản lý (6 số) *"
              value={managerPin}
              onChange={setManagerPin}
              error={pinError}
              errorText={pinError ? 'Vui lòng nhập đủ 6 chữ số' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="outlined" color="inherit">Huỷ</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo cuộc chơi'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
