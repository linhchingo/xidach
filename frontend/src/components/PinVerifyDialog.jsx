import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, CircularProgress
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PinInput from './PinInput';
import api from '../api/axios';
import useVisualViewport from '../hooks/useVisualViewport';

const MASTER_PIN = '830638';

/**
 * Dialog to verify manager PIN before accessing a game in Manager mode.
 *
 * Props:
 *  - open, onClose
 *  - gameId: number
 *  - onVerified: () => void — called when PIN is correct
 */
export default function PinVerifyDialog({ open, onClose, gameId, onVerified }) {
  const { height: vpHeight, offsetTop: vpOffset } = useVisualViewport();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (pin.length !== 6) {
      setError(true);
      setErrorText('Vui lòng nhập đủ 6 chữ số');
      return;
    }

    // Check Master PIN client-side first
    if (pin === MASTER_PIN) {
      localStorage.setItem(`game_pin_${gameId}`, pin);
      setPin('');
      setError(false);
      onVerified();
      return;
    }

    // Verify against server
    setLoading(true);
    try {
      const res = await api.post(`/games/${gameId}/verify-pin`, { pin });
      if (res.data.valid) {
        localStorage.setItem(`game_pin_${gameId}`, pin);
        setPin('');
        setError(false);
        onVerified();
      } else {
        setError(true);
        setErrorText('Mã PIN không đúng. Vui lòng thử lại.');
      }
    } catch (err) {
      setError(true);
      setErrorText('Lỗi xác thực. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (newPin) => {
    setPin(newPin);
    if (error) {
      setError(false);
      setErrorText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && pin.length === 6) {
      handleVerify();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableRestoreFocus
      onKeyDown={handleKeyDown}
      sx={{
        '&.MuiModal-root': {
          top: `${vpOffset}px`,
          height: `${vpHeight}px`,
          bottom: 'auto',
        },
        '& .MuiDialog-paper': {
          maxHeight: `calc(${vpHeight}px - 64px)`,
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 0, pt: 3 }} component="div">
        <LockIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" fontWeight={700} sx={{ display: 'block' }}>
          Nhập mã PIN quản lý
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Nhập mã PIN 6 số để truy cập chế độ Quản lý
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <PinInput
            value={pin}
            onChange={handlePinChange}
            error={error}
            errorText={errorText}
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'center', gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ minWidth: 100 }}>
          Huỷ
        </Button>
        <Button
          onClick={handleVerify}
          variant="contained"
          disabled={loading || pin.length !== 6}
          sx={{ minWidth: 100 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : 'Xác nhận'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
