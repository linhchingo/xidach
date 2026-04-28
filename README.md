# 🃏 Xì Dách Score Tracker

> Ứng dụng quản lý và theo dõi điểm số **thời gian thực** cho trò chơi Xì Dách (Blackjack kiểu Việt Nam).  
> Hỗ trợ nhiều bàn chơi đồng thời, phân quyền quản lý / người xem, và đồng bộ tức thì qua WebSocket.

---

## 📑 Mục Lục

- [Tính Năng Chính](#-tính-năng-chính)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Cài Đặt & Chạy Ứng Dụng](#-cài-đặt--chạy-ứng-dụng)
- [Cơ Sở Dữ Liệu](#-cơ-sở-dữ-liệu)
- [API Endpoints](#-api-endpoints)
- [WebSocket Events](#-websocket-events)

---

## ✨ Tính Năng Chính

| Tính năng | Mô tả |
|---|---|
| **Đồng bộ Thời Gian Thực** | Cập nhật điểm số, trạng thái ván đấu tức thì qua Socket.IO + Redis Pub/Sub — không cần reload trang |
| **Quản lý Ván Đấu** | Tạo bàn chơi, bắt đầu vòng, tự động xử lý kết quả còn thiếu khi kết thúc ván |
| **Quản lý Người Chơi** | Thêm / sửa người chơi, thay đổi nhà cái (Host) giữa ván đấu |
| **Tính Điểm Tự Động** | Tổng hợp điểm dựa trên kết quả Thắng / Thua / Hòa và hệ số nhân (×2) |
| **Phân Quyền (RBAC)** | Vai trò **Manager** (bảo mật mã PIN) quản lý trận đấu — vai trò **Spectator** chỉ xem (read-only) |
| **Hiệu Ứng Streak** | Hiển thị 🔥 khi thắng liên tiếp, 💔 khi thua liên tiếp (tính trên 10 ván gần nhất) |
| **Mobile-Friendly** | UI tối ưu di động: Sticky Action Bar, Player Cards compact, ngăn bàn phím ảo che giao diện |
| **Triển Khai Đóng Gói** | Docker Compose + Nginx reverse proxy — một lệnh duy nhất để chạy toàn bộ hệ thống |

---

## 🛠 Công Nghệ Sử Dụng

### Frontend
| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| React + Vite | Vite 8 | Build tool & Dev server |
| MUI (Material UI) | v9 | Component library |
| Redux Toolkit | v2 | State management |
| Socket.IO Client | v4 | Kết nối WebSocket |
| React Router | v7 | Client-side routing |
| React Toastify | v11 | Thông báo toast |

### Backend
| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| Flask | 3.1 | Web framework |
| Flask-SocketIO | 5.5 | WebSocket server |
| Gevent | 25.4 | Async worker |
| Redis | 6.2 | Cache & Pub/Sub |
| SQLite | built-in | Cơ sở dữ liệu |

### Infrastructure
| Công cụ | Vai trò |
|---|---|
| Docker & Docker Compose | Container hóa & Orchestration |
| Nginx | Reverse proxy & Static file serving |
| Redis 7 Alpine | Message broker cho Socket.IO |

---

## 🏗 Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (Port 80)                     │
│                    Reverse Proxy                        │
├────────────┬──────────────────┬──────────────────────────┤
│   /        │   /api/*         │   /socket.io/*           │
│   ↓        │   ↓              │   ↓                      │
│ Frontend   │  Backend API     │  WebSocket               │
│ (Static)   │  (Flask:5000)    │  (Flask-SocketIO:5000)   │
└────────────┴────────┬─────────┴──────────┬───────────────┘
                      │                    │
                ┌─────┴─────┐       ┌──────┴──────┐
                │  SQLite   │       │    Redis    │
                │ (Storage) │       │ (Pub/Sub)   │
                └───────────┘       └─────────────┘
```

**Luồng hoạt động:**
1. Nginx nhận mọi request từ client trên port `80`
2. Route `/` → Frontend (React SPA, static files)
3. Route `/api/*` → Backend Flask (REST API, keepalive upstream)
4. Route `/socket.io/*` → WebSocket upgrade → Flask-SocketIO
5. Socket.IO sử dụng Redis làm message queue để đồng bộ trạng thái real-time giữa các client

---

## 📁 Cấu Trúc Dự Án

```
xidach/
├── backend/
│   ├── routes/
│   │   ├── games.py          # CRUD bàn chơi
│   │   ├── players.py        # CRUD người chơi
│   │   └── rounds.py         # Quản lý vòng đấu & kết quả
│   ├── app.py                # Entry point — Flask app init
│   ├── models.py             # Database schema & helper queries
│   ├── extensions.py         # SocketIO & Redis instances
│   ├── socket_events.py      # WebSocket event handlers
│   ├── redis_cache.py        # Redis caching layer
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Danh sách bàn chơi
│   │   │   ├── GamePage.jsx        # Trang quản lý ván (Manager)
│   │   │   ├── SpectatorPage.jsx   # Trang xem trận (Spectator)
│   │   │   ├── GameResultPage.jsx  # Tổng kết điểm
│   │   │   └── HistoryPage.jsx     # Lịch sử các ván
│   │   ├── components/             # 17 UI components (PlayerCard, Dialogs, ...)
│   │   ├── store/                  # Redux slices
│   │   ├── socket/                 # Socket.IO client config
│   │   ├── api/                    # Axios API layer
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── App.jsx                 # Root component & routing
│   │   └── theme.js                # MUI dark theme config
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── nginx/
│   └── default.conf          # Nginx reverse proxy config
├── docker-compose.yml        # Orchestration (4 services)
└── README.md
```

---

## 🚀 Cài Đặt & Chạy Ứng Dụng

### Yêu Cầu Hệ Thống

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (cho cả 2 cách chạy)
- Node.js ≥ 18 & Python ≥ 3.10 (chỉ cần khi chạy local dev)

---

### Cách 1 — Docker Compose (Production / Demo)

> **Khuyên dùng.** Một lệnh duy nhất khởi chạy toàn bộ 4 services.

```bash
# Clone & vào thư mục dự án
git clone <repo-url> && cd xidach

# Build & chạy tất cả (background)
docker compose up -d --build

# Kiểm tra trạng thái
docker compose ps
```

Truy cập ứng dụng tại: **http://localhost**

| Service | Container | Mô tả |
|---|---|---|
| `proxy` | xidach-proxy | Nginx — cổng vào duy nhất (port 80) |
| `frontend` | xidach-frontend | React SPA (port ẩn) |
| `backend` | xidach-backend | Flask API (port ẩn) |
| `redis` | xidach-redis | Message broker (port ẩn) |

> **Lưu ý:** Chỉ Nginx expose port `80` ra ngoài. Backend và Frontend **không thể** truy cập trực tiếp — mọi traffic đều đi qua reverse proxy.

---

### Cách 2 — Local Development (Hot Reload)

Dùng khi cần chỉnh sửa code và xem thay đổi ngay lập tức.

#### Bước 1: Khởi động Redis (Bắt buộc)

Backend cần Redis để Socket.IO hoạt động. Dùng Docker để chạy nhanh nhất:

```bash
docker run -d --name xidach-redis-local -p 6380:6379 redis:7-alpine
```

> Redis sẽ chạy trên `localhost:6380` — backend local đã được cấu hình sẵn để kết nối tới địa chỉ này.

#### Bước 2: Khởi động Backend

```bash
cd backend

# Tạo & kích hoạt virtual environment
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS / Linux

# Cài đặt dependencies & chạy server
pip install -r requirements.txt
python app.py                    # → http://localhost:5000
```

#### Bước 3: Khởi động Frontend

```bash
cd frontend

npm install
npm run dev                      # → http://localhost:3000
```

> Vite dev server đã cấu hình proxy `/api` và `/socket.io` tới backend port `5000` — không cần Nginx khi phát triển local.

---

## 💾 Cơ Sở Dữ Liệu

SQLite — zero-config, dữ liệu lưu trong file `.db`.

- **Development:** `backend/xidach_dev.db`
- **Production (Docker):** `backend/data/xidach_prod.db` (mounted volume, persist data)

### Schema

```
┌──────────────┐       ┌──────────────┐
│    games     │       │   players    │
├──────────────┤       ├──────────────┤
│ id (PK)      │──┐    │ id (PK)      │
│ name         │  │    │ game_id (FK) │──┐
│ game_date    │  │    │ name         │  │
│ money_per_pt │  │    │ total_points │  │
│ manager_pin  │  │    │ is_active    │  │
│ status       │  │    │ joined_at    │  │
│ created_at   │  │    └──────────────┘  │
└──────────────┘  │                      │
                  │    ┌──────────────┐   │
                  │    │    rounds    │   │
                  │    ├──────────────┤   │
                  ├───→│ game_id (FK) │   │
                  │    │ round_number │   │
                  │    │ host_player  │───┘
                  │    │ status       │
                  │    └──────┬───────┘
                  │           │
                  │    ┌──────┴───────┐
                  │    │round_results │
                  │    ├──────────────┤
                  │    │ round_id(FK) │
                  │    │ player_id(FK)│──┘
                  │    │ result       │
                  │    │ points_change│
                  │    └──────────────┘

Kết quả hợp lệ: win | draw | lose | pay | host | win_big | lose_big
```

---

## 🔌 API Endpoints

Base URL: `/api`

### Games

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/games` | Danh sách tất cả bàn chơi |
| `POST` | `/api/games` | Tạo bàn chơi mới |
| `GET` | `/api/games/:id` | Chi tiết một bàn chơi |
| `PUT` | `/api/games/:id` | Cập nhật bàn chơi |
| `DELETE` | `/api/games/:id` | Xóa bàn chơi |
| `POST` | `/api/games/:id/verify-pin` | Xác thực mã PIN Manager |

### Players

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/games/:id/players` | Danh sách người chơi trong bàn |
| `POST` | `/api/games/:id/players` | Thêm người chơi |
| `PUT` | `/api/players/:id` | Sửa thông tin người chơi |
| `DELETE` | `/api/players/:id` | Xóa người chơi |

### Rounds

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/games/:id/rounds` | Danh sách vòng đấu |
| `POST` | `/api/games/:id/rounds` | Tạo vòng mới |
| `POST` | `/api/rounds/:id/result` | Ghi nhận kết quả |
| `POST` | `/api/rounds/:id/complete` | Kết thúc vòng |
| `DELETE` | `/api/rounds/:id` | Hủy vòng |

### Health Check

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/health` | Kiểm tra trạng thái server |

---

## 📡 WebSocket Events

Kết nối: `socket.io` — namespace mặc định (`/`)

### Client → Server

| Event | Payload | Mô tả |
|---|---|---|
| `join_game` | `{ game_id }` | Tham gia room của bàn chơi |
| `leave_game` | `{ game_id }` | Rời room |
| `submit_results` | `{ round_id, results[] }` | Gửi kết quả hàng loạt (bulk) |

### Server → Client

| Event | Payload | Mô tả |
|---|---|---|
| `game_updated` | `{ game }` | Dữ liệu bàn chơi thay đổi |
| `round_started` | `{ round }` | Vòng mới bắt đầu |
| `round_completed` | `{ round }` | Vòng kết thúc |
| `result_submitted` | `{ result }` | Kết quả từng người chơi được ghi nhận |
| `players_updated` | `{ players[] }` | Danh sách người chơi thay đổi |

---

## 📜 License

Private project — All rights reserved.
