# Tối Ưu Hoá Hiệu Suất Chọn Kết Quả (Redis-First)

Mục tiêu: Loại bỏ hoàn toàn tình trạng giật lag, delay khi người chơi (hoặc manager) click chọn kết quả (Thắng, Thua, Đền...) trong ván đấu đang diễn ra.

## Phân Tích Nguyên Nhân (Root Cause)
Hiện tại, mỗi khi một người chơi chọn kết quả, backend thực hiện các bước sau:
1. Ghi vào SQLite (`INSERT` / `UPDATE` vào bảng `round_results`).
2. Gọi hàm `refresh_game_cache(game_id)`. Hàm này gọi `build_game_state` để query **toàn bộ lịch sử game** từ SQLite (bảng games, players, rounds, và loop qua N rounds để lấy round_results). Gây ra hơn 20+ queries mỗi lần click.
3. Ghi đè lại toàn bộ JSON object khổng lồ vào Redis.
4. Emit Socket.IO.

Việc này khiến mỗi lượt chọn kết quả phải tốn hàng trăm milliseconds và có thể gây lock SQLite nếu nhiều người bấm cùng lúc.

## Đánh Giá Impact & Xung Đột (Theo yêu cầu)
- **Impact (Tác động tích cực):** Thay đổi này sẽ khiến API `submit_result` nhanh hơn hàng chục lần (chỉ tốn ~1-2ms) vì hoàn toàn thao tác trên RAM (Redis) thay vì ổ cứng (SQLite). Giảm thiểu nguy cơ SQLite "database is locked".
- **Xung Đột (Risks):** Nếu server hoặc Redis bị crash bất ngờ *trong lúc ván đấu đang diễn ra*, kết quả tạm thời của ván đó sẽ bị mất. Tuy nhiên, rủi ro này hoàn toàn chấp nhận được vì các ván đã kết thúc đều được lưu an toàn trong SQLite.
- **Cần thay đổi cách query:** Những hàm như `get_rounds` hoặc `build_game_state` (khi load lại trang) cần phải biết đọc kết quả từ Redis nếu ván đó đang `active`.

## User Review Required

> [!IMPORTANT]
> Thay đổi này chuyển dịch "Source of Truth" của một ván đấu **đang diễn ra** từ SQLite sang Redis. SQLite chỉ được dùng để lưu trữ lịch sử sau khi ván đấu đã **kết thúc**. Bạn có đồng ý với rủi ro rất nhỏ là kết quả đang chọn dở sẽ bị mất nếu server sập giữa chừng không?

## Proposed Changes

### 1. File `backend/routes/rounds.py`
Thay đổi logic xử lý kết quả:
- `submit_result`:
  - Không ghi vào SQLite (`round_results`).
  - Sử dụng Redis Hash: `HSET round:{round_id}:results {player_id} {result}`.
  - Xoá key nếu user bỏ chọn (`result` is null).
  - Lấy `cached_game_state` hiện tại, cập nhật trực tiếp `active_round.results` trong memory và lưu lại vào Redis bằng `cache_game_state` (Incremental Update - tránh gọi `refresh_game_cache`).
- `end_round`:
  - Đọc kết quả từ Redis (`HGETALL round:{round_id}:results`).
  - Tính điểm như bình thường.
  - Thực hiện Batch Insert/Update tất cả kết quả vào SQLite `round_results` và `players` trong 1 transaction duy nhất.
  - Xoá key Redis `round:{round_id}:results`.
  - Gọi `refresh_game_cache` (chỉ gọi 1 lần khi chốt ván).
- `cancel_round` & `change_host`:
  - Xoá key Redis `round:{round_id}:results`.
- `get_rounds`:
  - Kiểm tra nếu `rnd['status'] == 'active'`, fetch results từ Redis thay vì query SQLite.

### 2. File `backend/socket_events.py`
Thay đổi hàm `build_game_state` (dùng khi user reconnect hoặc mới vào trang):
- Khi query danh sách rounds, nếu `rnd['status'] == 'active'`, sẽ bỏ qua query DB mà lấy `results` trực tiếp từ Redis Hash để ráp vào state trả về.

## Verification Plan

### Automated Tests
- Khởi động lại Redis và App Server.
- Khởi tạo game và ván chơi mới.
- Click chọn nhiều kết quả liên tục, theo dõi Log server xem có xuất hiện các câu SQL query dài dòng không (kỳ vọng là KHÔNG CÓ sql query nào được in ra trong lúc chọn).

### Manual Verification
- Spectator và Manager đều thấy kết quả cập nhật realtime.
- Khi chốt ván (Kết thúc), kiểm tra xem SQLite có lưu đúng số điểm và kết quả vào lịch sử hay không.
- F5 trang web giữa lúc ván đang diễn ra, kết quả (Thắng/Thua) đã chọn vẫn phải được giữ nguyên.
