import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, ButtonBase
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import useVisualViewport from '../hooks/useVisualViewport';

/**
 * Dialog to select role (Manager or Spectator) when entering a game.
 *
 * Props:
 *  - open, onClose
 *  - game: { id, name }
 *  - onSelectRole: (role: 'manager' | 'view') => void
 */
export default function RoleSelectDialog({ open, onClose, game, onSelectRole }) {
  const { height: vpHeight, offsetTop: vpOffset } = useVisualViewport();

  const roles = [
    {
      key: 'manager',
      icon: <AdminPanelSettingsIcon sx={{ fontSize: 40 }} />,
      title: 'Quản lý',
      desc: 'Toàn quyền điều khiển cuộc chơi',
      gradient: 'linear-gradient(135deg, rgba(124, 77, 255, 0.15), rgba(124, 77, 255, 0.05))',
      border: 'rgba(124, 77, 255, 0.3)',
      iconColor: '#b47cff',
    },
    {
      key: 'view',
      icon: <VisibilityIcon sx={{ fontSize: 40 }} />,
      title: 'Xem',
      desc: 'Chỉ xem, không can thiệp',
      gradient: 'linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(0, 229, 255, 0.04))',
      border: 'rgba(0, 229, 255, 0.3)',
      iconColor: '#00e5ff',
    },
  ];

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
        },
        '& .MuiDialog-paper': {
          maxHeight: `calc(${vpHeight}px - 64px)`,
          borderRadius: 3,
          bgcolor: 'background.paper',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1, pt: 2.5 }} component="div">
        <Typography variant="h6" fontWeight={700} noWrap>
          {game?.name || 'Cuộc chơi'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Chọn vai trò để truy cập
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mt: 1
        }}>
          {roles.map((role) => (
            <ButtonBase
              key={role.key}
              onClick={() => onSelectRole(role.key)}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                background: role.gradient,
                border: `1px solid ${role.border}`,
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 8px 24px ${role.border}`,
                  borderColor: role.iconColor,
                },
              }}
            >
              <Box sx={{ color: role.iconColor }}>{role.icon}</Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {role.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {role.desc}
              </Typography>
            </ButtonBase>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
