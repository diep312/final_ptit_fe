# Conferdent — Hệ thống quản lý hội nghị (Frontend)

Đây là phần frontend của dự án Conferdent — một hệ thống quản lý sự kiện/hội nghị gồm giao diện cho người tổ chức và người tham dự.

Tài liệu này sẽ hướng dẫn nhanh cách chạy dự án, cấu trúc thư mục, các biến môi trường quan trọng, tuyến API chính và những lưu ý khi phát triển.

## Tổng quan project

- Frontend: `FinalPTIT_FE` — React + Vite + TypeScript, dùng Tailwind CSS và thành phần UI từ hệ thống shadcn.

## Tác giả 
- Nguyễn Hoàng Điệp (diepnh0312002@gmail.com)

## Yêu cầu

- Node.js (>=16) và npm hoặc pnpm
- PostgreSQL (hoặc môi trường Docker nếu repository kèm docker-compose)
- Biến môi trường cho backend và frontend (xem phần sau)

## Cấu trúc thư mục (chỉ mục chính)

- `FinalPTIT_FE/` — mã frontend (ứng dụng React/TS)
	- `src/` — mã nguồn ứng dụng
	- `package.json`, `vite.config.*`, `tailwind.config.*`


## Thiết lập môi trường và chạy nhanh (frontend)

1. Vào thư mục frontend và cài dependencies:

```powershell
npm install
```

2. Thiết lập biến môi trường (ví dụ tạo file `.env` hoặc cấu hình trong IDE):

- `VITE_API_BASE_URL` — URL gốc của API backend (ví dụ `http://localhost:3456/api` hoặc `http://localhost:3456` nếu proxy đã được cấu hình). Mặc định frontend dùng `import.meta.env.VITE_API_BASE_URL ?? '/api'`.

3. Chạy frontend trong chế độ dev:

```powershell
npm run dev
```

Ứng dụng sẽ mở ở `http://localhost:5173` (hoặc cổng do Vite in ra).


## Các biến môi trường quan trọng (gợi ý)

- Frontend:
	- `VITE_API_BASE_URL` — URL đến backend API

- Backend (ví dụ):
	- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
	- `JWT_SECRET` hoặc `AUTH_SECRET`
	- `PORT` — cổng backend (ví dụ 3456)

Xem `be` để biết thêm chi tiết.

## Các tuyến API liên quan đến check-in (tổng quan)

- Organizer tạo check-in cho người đăng ký (dùng bởi màn hình scanner):
	- POST /organizer/checkins
		- Payload: { event_id, registration_id }
		- Trả về: bản ghi checkin (201) hoặc lỗi (400/401/403/404)

- Session registrations (đăng ký/check-in theo phiên):
	- POST /registrations/session-registrations/check-in — check-in authenticated registration tới một session cụ thể (yêu cầu authentication cho registrant)

Frontend đã có trang check-in (QR scanner) tại route:
	- `/conference/:id/check-in`

Trang này sử dụng thư viện `html5-qrcode` để quét QR, tách ra `registration_id` từ nội dung QR và gọi `POST /organizer/checkins` (yêu cầu organizer auth) để ghi nhận check-in.

## Ghi chú phát triển (Developer notes)

- Authentication
	- Frontend gửi token từ `localStorage.auth_token` (ApiClient xử lý header Authorization tự động nếu token tồn tại và hợp lệ).
	- Các route dành cho organizer yêu cầu organizer token; route dành cho registrant/participant dùng registration token (middleware khác nhau).

- Response shapes
	- Một số endpoint trả dữ liệu theo nhiều dạng (mảng trực tiếp hoặc object { data: [...] } hoặc nested). Frontend có những chỗ parse defensive để hỗ trợ các dạng trả về này.

- Xóa session
	- Backend có logic xóa quan hệ (session_speaker) trước khi xóa session để tránh lỗi ràng buộc FK.

## Thử nghiệm nhanh tính năng check-in (QR)

1. Bật backend và frontend.
2. Đăng nhập (với tài khoản organizer) trong frontend để có token.
3. Mở `http://localhost:5173/conference/<event-id>/check-in` và cho phép trình duyệt truy cập camera.
4. Quét QR chứa `registration_id` (có thể là UUID, ObjectId 24 hex hoặc URL có id ở cuối).
5. Sau khi quét, frontend sẽ gọi `POST /organizer/checkins` với payload `{ event_id, registration_id }`.

## Các lỗi thường gặp và cách debug

- Lỗi 401/403 khi gọi `/organizer/checkins`: kiểm tra token organizer đã login và token được lưu đúng vào `localStorage.auth_token`.
- Không tìm thấy `registration_id` trong QR: đảm bảo QR chứa id - frontend cố gắng hỗ trợ UUID, ObjectId, hoặc last URL segment.
- Lỗi 500 khi xóa session: backend đã thêm bước xóa các bản ghi liên quan trước khi xóa session để tránh vi phạm FK; nếu vẫn gặp lỗi hãy kiểm tra migration và ràng buộc DB.


## Tài nguyên hữu ích

- Frontend: `FinalPTIT_FE/src` — các trang chính: `ConferenceDetail.tsx`, `CheckIn.tsx`, `DashboardCalendar.tsx`, `SessionSchedule.tsx`.

---

