# Xì Dách Score Tracker

Ứng dụng quản lý và theo dõi điểm số cho trò chơi Xì Dách (Blackjack kiểu Việt Nam). Hệ thống bao gồm Frontend viết bằng React, Backend API bằng Flask và được đóng gói toàn diện bằng Docker + Nginx.

## 🚀 Các Công Nghệ Sử Dụng

- **Frontend**: React (Vite), Material-UI (MUI), Redux Toolkit, Axios, React Router, React Toastify.
- **Backend**: Python, Flask, SQLite, Socket.IO.
- **Infrastructure**: Docker, Docker Compose, Nginx (Reverse Proxy), Redis.
- **Quản lý Phiên bản**: Git (Monorepo chứa cả `frontend` và `backend`).

## 📁 Cấu Trúc Dự Án

```text
xidach/
├── backend/            # Mã nguồn API & Database (Flask)
├── frontend/           # Mã nguồn Giao diện (React/Vite)
├── nginx/              # Cấu hình Nginx Proxy
├── docker-compose.yml  # File triển khai các containers
└── README.md           # Tài liệu dự án
```

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Prerequisite (Yêu cầu môi trường)
Để chạy dự án nhanh chóng nhất thiết phải cài đặt **[Docker](https://www.docker.com/products/docker-desktop/)**.

### 2. Triển Khai Gói Bằng Docker Compose (Khuyên Dùng)

Với môi trường Production hoặc chạy thử nghiệm hệ thống hoàn chỉnh:

```bash
# 1. Clone repository về máy
cd xidach

# 2. Build và khởi động các container (chạy ngầm)
docker-compose up -d --build
```
- Mở trình duyệt và truy cập: **[http://localhost](http://localhost)** 
- Nginx sẽ đóng vai trò Reverse Proxy: Định tuyến `/` cho Frontend và (nếu cấu hình) các luồng khác tới API Backend. Container backend và frontend chạy port ẩn bên trong không thể truy cập trực tiếp từ bên ngoài.

### 3. Khởi Chạy Local Để Phát Triển (Development)

Trong trường hợp bạn muốn chỉnh sửa code và xem thay đổi ngay không qua Docker, **bạn vẫn cần chạy Redis** để hệ thống thời gian thực (Socket.IO) hoạt động:

**Khởi Động Redis Local (Bắt buộc - Port 6380):**
Vì backend local được cấu hình kết nối tới `redis://localhost:6380`, bạn cần khởi chạy một instance Redis trên port này. Chạy bằng Docker là cách nhanh nhất:
```bash
docker run -d --name xidach-redis-local -p 6380:6379 redis:7-alpine
```

**Khởi Động Backend (Port mặc định thường là 5000):**
```bash
cd backend
python -m venv venv
# Kích hoạt venv (Windows): venv\Scripts\activate
# Kích hoạt venv (Mac/Linux): source venv/bin/activate
pip install -r requirements.txt
python app.py
```

**Khởi Động Frontend (Mặc định thường vào port 3000):**
```bash
cd frontend
npm install
npm run dev
```

## 🌟 Tính Năng Chính
- **Đồng bộ Thời Gian Thực**: Cập nhật dữ liệu điểm số, trạng thái ván đấu tức thời (Real-time) qua Socket.IO và Redis, loại bỏ tình trạng giật lag giao diện.
- **Quản lý ván đấu**: Thêm bàn chơi, bắt đầu ghi nhận điểm số từng ván. Tự động bắt đầu vòng đấu và xử lý các kết quả còn thiếu.
- **Quản lý người chơi**: Thêm/sửa người chơi tham gia vào các bàn đánh Xì Dách. Hỗ trợ thay đổi nhà cái (Host) giữa ván đấu.
- **Tính toán kết quả**: Tự động tổng hợp điểm cho từng ván dựa trên kết quả Thắng/Thua và hệ số nhân điểm (như x2).
- **Phân quyền truy cập (RBAC)**: Phân biệt vai trò Quản lý (Manager) có bảo mật bằng mã PIN và Người xem (Spectator) với giao diện theo dõi diễn biến trận đấu thời gian thực (Read-only).
- **Giao diện hiện đại & Tối ưu Di động (Mobile-friendly)**: 
  - UI hỗ trợ Sticky Action Bar giúp thao tác nhanh.
  - Thẻ người chơi (Player Cards) được thiết kế tối ưu không gian dọc với viền màu động và các huy hiệu ComicText bắt mắt.
  - Hỗ trợ tốt trên trình duyệt di động, ngăn chặn lỗi bàn phím ảo che lấp giao diện.
- **Kiến trúc ổn định, bảo mật**: Database được cấu hình Docker volume persist để lưu trữ an toàn. Kiến trúc Monorepo frontend-backend dễ dàng vận hành với Nginx reverse proxy.
