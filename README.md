# Hệ Thống Quản Lý Cân Mẻ Công Nghiệp (Industrial Weigh Station & WIP Dashboard)

Hệ thống quản lý, giám sát và thu thập dữ liệu cân IoT thời gian thực cho dây chuyền chế biến công nghiệp (tiêu chuẩn nhà máy thủy sản / thực phẩm PMSL). Hệ thống theo dõi luồng bán thành phẩm (WIP - Work In Progress), tỷ lệ thu hồi (yield rate) và sản lượng hoàn thành qua từng công đoạn sản xuất.

---

## 1. Kiến Trúc Dự Án (Monorepo Turborepo)

Dự án được tổ chức theo mô hình Monorepo sử dụng **Turborepo** và **pnpm workspaces**:

```text
management_weigh/
├── apps/
│   ├── backend-core/         # NestJS Core API, WebSocket Gateway, MQTT Service
│   └── web-dashboard/        # Next.js 14 (App Router), Tailwind CSS, Recharts
├── packages/
│   ├── database/             # Prisma ORM, Schema PostgreSQL, Client kết nối DB
│   └── types/                # Types & DTOs TypeScript dùng chung cho Frontend & Backend
├── docker/
│   └── docker-compose.dev.yml# Cấu hình container PostgreSQL 16, Redis 7, EMQX Broker 5.8
├── PMSL.sql                  # Dữ liệu mẫu chuẩn cấu trúc hệ thống cân PMSL
├── requirements.txt          # Bảng kê khai phiên bản môi trường & thư viện
├── .env.example              # Mẫu biến môi trường
├── pnpm-workspace.yaml       # Cấu hình Turborepo / pnpm workspace
└── package.json              # Script điều khiển toàn bộ Monorepo
```

### Chi tiết các thành phần chính:
- **`apps/backend-core`** (Port: `4000`):
  - Xử lý nghiệp vụ cân mẻ, tính toán WIP, tỷ lệ đạt (Yield Rate), xác định điểm nghẽn (Bottleneck).
  - Cung cấp REST API quản lý công đoạn (chèn đầu/đuôi/giữa, đổi thứ tự, sửa/xóa node).
  - Quản lý trạm cân và sản phẩm đầu ra cho từng công đoạn.
  - Tích hợp Socket.IO Gateway phát sóng dữ liệu cân trực tiếp tới Dashboard.
  - Tích hợp MQTT Ingestion nhận telemetry từ các máy Hub xưởng (`HUB-XUONG-01`, `HUB-XUONG-02`).
- **`apps/web-dashboard`** (Port: `3000`):
  - Giao diện Dashboard Modern Industrial theo tone màu **Slate tối giản**, trực diện, không dùng màu sắc lòe loẹt.
  - **Trang Quản trị Hệ thống** (`/dashboardsuper`): Chuyển đổi giữa các công ty khách hàng, xem toàn cảnh nhà máy, cấu hình quy trình.
  - **Trang Chế độ Xưởng** (`/view-dashboard`): Tối ưu cho màn hình xưởng sản xuất theo từng đơn vị cụ thể.
  - **Bảng ma trận WIP Matrix**: Tra cứu chi tiết khối lượng Vào (IN), Ra (OUT), Đang xử lý (WIP), Tỷ lệ (%) và Trạng thái của từng công đoạn.
  - **Modal cấu hình quy trình**: Thêm công đoạn linh hoạt, gán/gỡ trạm cân, thêm/xóa nhiều quy cách sản phẩm đầu ra.
- **`packages/database`**:
  - Prisma Schema định nghĩa mô hình dữ liệu đa doanh nghiệp (SuperAdmin / Multi-tenant), Edge Hub, StationWeigh, MappingProcess.
- **`packages/types`**:
  - Đồng bộ chặt chẽ kiểu dữ liệu TypeScript giữa Backend NestJS và Frontend Next.js.

---

## 2. Yêu Cầu Môi Trường (Prerequisites)

Trước khi tiến hành cài đặt, máy tính cần cài sẵn các công cụ:

| Công cụ | Phiên bản yêu cầu | Mô tả |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.0.0` (Khuyên dùng v20.x hoặc v22.x LTS) | Runtime JavaScript/TypeScript |
| **pnpm** | `>= 9.0.0` | Quản lý gói thư viện monorepo (`npm i -g pnpm`) |
| **Docker & Docker Compose** | Docker `>= 24.0.0`, Compose `>= 2.20.0` | Khởi chạy PostgreSQL, Redis, EMQX Broker |
| **Git** | Bất kỳ | Quản lý mã nguồn |

---

## 3. Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start)

### Bước 1: Clone kho mã nguồn về máy
```bash
git clone <URL_REPO_CUA_BAN>
cd management_weigh
```

### Bước 2: Cài đặt toàn bộ thư viện phụ thuộc (Dependencies)
```bash
pnpm install
```

### Bước 3: Thiết lập biến môi trường
Sao chép tệp cấu hình mẫu `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Nội dung `.env` mặc định:
```env
PORT=4000
DATABASE_URL="postgresql://scale_admin:scale_secret_pass@localhost:5432/weighstation_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=hub_client
MQTT_PASSWORD=hub_secret_password
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Bước 4: Khởi động các dịch vụ hạ tầng với Docker
Chạy lệnh khởi động PostgreSQL, Redis và EMQX Broker:
```bash
docker compose -f docker/docker-compose.dev.yml up -d
```
Kiểm tra các container đã chạy ổn định:
```bash
docker compose -f docker/docker-compose.dev.yml ps
```

### Bước 5: Khởi tạo Cơ sở Dữ liệu với Prisma
Sinh mã client Prisma và đồng bộ cấu trúc bảng vào PostgreSQL:
```bash
pnpm db:generate
pnpm db:push
```

*(Tùy chọn)* Nếu muốn khôi phục cơ sở dữ liệu mẫu từ tệp `PMSL.sql`:
```bash
docker exec -i weighstation-postgres pg_restore -U scale_admin -d weighstation_db < PMSL.sql
```

### Bước 6: Khởi chạy dự án

#### Lựa chọn A: Chạy chế độ Phát triển (Development Mode)
Lệnh này sẽ khởi động đồng thời cả Backend NestJS và Web Dashboard với tính năng Hot-Reload:
```bash
pnpm dev
```

#### Lựa chọn B: Biên dịch và chạy chế độ Production
```bash
pnpm build
pnpm start
```

---

## 4. Các Cổng Dịch Vụ & Địa Chỉ Truy Cập (Ports & URLs)

| Dịch vụ | Địa chỉ URL / Port | Thông tin đăng nhập / Ghi chú |
| :--- | :--- | :--- |
| **Web Dashboard (SuperAdmin)** | `http://localhost:3000/dashboardsuper` | Trang quản trị mẻ cân & cấu hình quy trình |
| **Web Dashboard (Chế độ Xưởng)**| `http://localhost:3000/view-dashboard` | Màn hình giám sát sản xuất tại nhà máy |
| **Backend Core REST API** | `http://localhost:4000/api` | API endpoints quản lý mẻ cân & công đoạn |
| **WebSocket Gateway** | `ws://localhost:4000` | Kênh socket nhận sự kiện cân thời gian thực |
| **PostgreSQL 16** | `localhost:5432` | User: `scale_admin` / Pass: `scale_secret_pass` / DB: `weighstation_db` |
| **Redis 7** | `localhost:6379` | Cache bộ đệm và Pub/Sub sự kiện |
| **EMQX Broker (MQTT)** | `localhost:1883` | Cổng kết nối MQTT cho các máy Hub cân xưởng |
| **EMQX Web Dashboard** | `http://localhost:18083` | User: `admin` / Pass: `public_admin_emqx` |

---

## 5. Các Tính Năng Nổi Bật

1. **Quản lý mẻ cân thời gian thực (Real-time Weighing)**:
   - Theo dõi 4 chỉ số KPI cốt lõi: Khối lượng kế hoạch, Hoàn thành, Đang xử lý (WIP) và Còn lại.
   - Tích hợp nút **"Mô phỏng cân"** và **"Bật tự động"** để thử nghiệm luồng dữ liệu cân tự động mà không cần kết nối phần cứng vật lý.
2. **Tùy biến công đoạn linh hoạt (Dynamic Process Nodes)**:
   - Thêm bước công đoạn vào bất kỳ vị trí nào: Đầu quy trình, Cuối quy trình, hoặc Trước / Sau một bước chỉ định.
   - Di chuyển thứ tự các bước lên / xuống.
   - Đổi tên công đoạn, phân loại công đoạn thường hoặc công đoạn thành phẩm.
3. **Quản lý trạm cân đa điểm (Multi-station Management)**:
   - Mỗi công đoạn có thể gán 1 hoặc nhiều trạm cân trực thuộc (hỗ trợ các model như *DINI ARGEO*).
   - Thêm nhanh hoặc gỡ bỏ trạm cân trực tiếp trên giao diện quản lý.
4. **Cấu hình đa sản phẩm đầu ra (Multi-product Outputs)**:
   - Một công đoạn có thể cho ra nhiều chủng loại/quy cách sản phẩm (ví dụ công đoạn Phân cỡ có thể ra các cỡ: *10-15, 15-20, 20-25, 25-30, 30-40, Tôm dạt*).
   - Thêm chip sản phẩm nhanh bằng phím Enter và gỡ bỏ dễ dàng.
5. **Giao diện Modern Industrial tối giản**:
   - Tối ưu không gian hiển thị thông tin kỹ thuật, dữ liệu số rõ ràng, phông chữ mono chuẩn xác cho khối lượng cân.

---

## 6. Danh Sách Lệnh Thao Tác (Useful CLI Commands)

```bash
# Cài đặt thư viện
pnpm install

# Chạy dev toàn bộ monorepo (Backend + Web)
pnpm dev

# Chỉ chạy dev Backend Core
pnpm --filter @industrial-scale/backend-core dev

# Chỉ chạy dev Web Dashboard
pnpm --filter @industrial-scale/web-dashboard dev

# Build toàn bộ monorepo
pnpm build

# Kiểm tra cú pháp và kiểu dữ liệu (Type-check)
pnpm -r exec tsc --noEmit

# Mở giao diện trực quan Prisma Studio quản lý dữ liệu DB
pnpm db:studio

# Tắt và xóa dữ liệu các container Docker
docker compose -f docker/docker-compose.dev.yml down
```

---

## 7. Xử Lý Sự Cố Thường Gặp (Troubleshooting)

- **Lỗi không kết nối được PostgreSQL / Prisma**:
  - Đảm bảo container `weighstation-postgres` đang chạy: `docker compose -f docker/docker-compose.dev.yml ps`.
  - Nếu vừa cập nhật schema, chạy lại: `pnpm db:generate`.
- **Lỗi 404 tệp tĩnh CSS trên trình duyệt**:
  - Xóa cache build Next.js: `rm -rf apps/web-dashboard/.next` rồi chạy lại `pnpm dev` hoặc `pnpm build && pnpm start`.
- **Cổng 3000 hoặc 4000 bị chiếm dụng**:
  - Kiểm tra tiến trình đang chạy trên cổng: `lsof -i :3000` hoặc `lsof -i :4000`.
  - Giải phóng cổng: `kill -9 <PID>`.
