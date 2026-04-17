# Supabase Setup Guide

Hệ thống lưu trữ dữ liệu của Smart Investor được xây dựng trên **Supabase** (PostgreSQL).

## Bước 1: Tạo Project Supabase

1. Truy cập [Supabase](https://supabase.com/) và đăng nhập.
2. Tạo một project mới.
3. Đợi vài phút để database được khởi tạo xong.

## Bước 2: Chạy Migration

Ứng dụng cần 8 bảng cơ bản để lưu trữ thông tin công ty, lịch sử giá, báo cáo tài chính và các collection.

1. Vào phần **SQL Editor** ở sidebar bên trái của Supabase Dashboard.
2. Tạo một query mới.
3. Mở file `supabase/migration.sql` trong dự án này, copy toàn bộ nội dung và dán vào SQL Editor.
4. Bấm **Run** để tạo các bảng và thiết lập policies.

## Bước 3: Cập nhật Environment Variables

1. TRong thư mục của dự án, copy file config mẫu:
   ```bash
   cp .env.example .env
   ```
2. Vào phần **Project Settings > API** trên Supabase Dashboard.
3. Lấy `URL` và `service_role` (quan trọng: backend cần quyền ghi) điền vào file `.env`:

   ```env
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_KEY=<your-service-role-key>
   ```

*(File `.env` đã được thêm vào `.gitignore` để tránh bị commit lên repo).*

## Bước 4: Chạy Server Đồng Bộ Data

Trong project, bạn có thể chạy server backend kèm với frontend:

```bash
npm run dev:all
```

API sẽ chạy tại `http://localhost:3001` và tự động lên lịch đồng bộ vào weekdays (9h-16h).
Dữ liệu giá mặc định sẽ lấy **từ năm 2024 đến hiện tại** theo yêu cầu của bạn.
