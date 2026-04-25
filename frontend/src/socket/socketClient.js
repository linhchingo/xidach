import { io } from 'socket.io-client';

// Khởi tạo socket singleton instance
// autoConnect: false để ta có thể tự điều khiển lúc connect (truyền auth role)
const socket = io('/', {
  path: '/socket.io/',
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export default socket;
