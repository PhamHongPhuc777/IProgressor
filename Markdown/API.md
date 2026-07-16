# Đặc tả Endpoint API — Ứng dụng Web Quản lý Dự án

> Bản dịch tiếng Việt của `API_Endpoints.md`. **Method, path (đường dẫn), và tên trường schema được giữ nguyên bằng tiếng Anh** — đây là phần code/hợp đồng API thực tế, không nên dịch. Phần mô tả và ghi chú được dịch sang tiếng Việt.
>
> Cột vai trò: **S**taff (Nhân viên), **P**M (Trưởng phòng), **L**eader (Giám đốc), **A**dmin. `1` = được phép, `0` = không được phép, có ghi chú phạm vi (scoping) khi cần thiết.

---

## `auth` / phiên đăng nhập (dùng chung)

Zitadel xử lý việc đăng nhập thực tế (luồng redirect OIDC) — đây là các endpoint do chính app sở hữu.

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/me` | Hồ sơ user hiện tại + quyền hạn đã xác định | 1 | 1 | 1 | 1 |
| PATCH | `/me/avatar` | Tải lên/đổi ảnh đại diện | 1 | 1 | 1 | 1 |
| GET | `/me/stats` | Thống kê task/tiến độ cá nhân | 1 | 0 | 0 | 0 |
| POST | `/webhooks/zitadel/user-events` | Nội bộ — đồng bộ `USER.status` khi có sự kiện khóa/mở khóa | — | — | — | — |
| POST | `/webhooks/netbird/connection-events` | Nội bộ — đồng bộ trạng thái kết nối (`USER.netbird_connected`/`netbird_last_seen`) | — | — | — | — |

Đổi mật khẩu dùng trang self-service của chính Zitadel (ngoài phạm vi app) — chuyển hướng ra ngoài, không proxy qua app.

---

## `workspace` — yêu cầu truy cập & onboarding

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| POST | `/access-requests` | Gửi yêu cầu (chưa cần đăng nhập) — `full_name`, `email`, `department_id` | — | — | — | — |
| GET | `/access-requests?department_id=&status=` | Danh sách yêu cầu — Admin chỉ thấy phòng ban mình quản trị (theo ranh giới RBAC trong ERD) | 0 | 0 | 0 | 1 |
| GET | `/access-requests/{id}` | Chi tiết yêu cầu | 0 | 0 | 0 | 1 |
| POST | `/access-requests/{id}/approve` | Cấp định danh Zitadel + tạo dòng `USER` | 0 | 0 | 0 | 1 |
| POST | `/access-requests/{id}/reject` | Đóng yêu cầu, không có tác động tiếp theo | 0 | 0 | 0 | 1 |

---

## `workspace` — người dùng & phòng ban

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/departments` | Danh sách phòng ban — Staff/PM chỉ thấy phòng ban mình; Leader/Admin thấy tất cả | 1 | 1 | 1 | 1 |
| GET | `/departments/{id}/members` | Thành viên trong một workspace | 1 | 1 | 1 | 1 |
| GET | `/users?department_id=` | Danh sách thành viên toàn công ty (không giới hạn phòng ban) | 0 | 0 | 1 | 1 |
| GET | `/users/{id}` | Chi tiết hồ sơ | 1 | 1 | 1 | 1 |
| PATCH | `/users/{id}/role` | Thăng/giáng chức — yêu cầu `confirm: true` trong body, ghi `AUDIT_LOG`. **Quy tắc đã chốt:** một Admin không thể đổi vai trò của Admin khác (bảo vệ ngang hàng, đã xác nhận qua tài liệu UI mapping); tự giáng chức bản thân được cho phép như một ngoại lệ, **trừ khi** Admin đó là Admin cuối cùng còn lại (bị chặn, để tránh hệ thống mất hết Admin) | 0 | 0 | 0 | 1 |
| POST | `/users/{id}/lock` | Body: `reason` (→ `USER.locked_reason`), kích hoạt khóa ở Zitadel, ghi `AUDIT_LOG` | 0 | 0 | 0 | 1 |
| POST | `/users/{id}/unlock` | Ghi `AUDIT_LOG` | 0 | 0 | 0 | 1 |
| GET | `/users/{id}/netbird-status` | Trạng thái kết nối đã cache (`USER.netbird_connected`/`netbird_last_seen`) | 0 | 0 | 0 | 1 |
| GET | `/departments/{id}/resource-allocation` | Xem workload (PRD 5.3, gắn nhãn **S** — cần xác nhận vẫn nằm trong phạm vi) | 0 | 1 | 0 | 0 |
| GET | `/departments/{id}/performance-risk` | Tổng hợp hiệu suất/rủi ro (SRS FR-4) | 0 | 0 | 1 | 0 |
| PATCH | `/departments/{id}/settings` | ⚠️ `DEPARTMENT` hiện chưa có trường/bảng lưu cài đặt | 0 | 0 | 0 | 1 |

---

## `workspace` — vai trò & ma trận phân quyền

Hướng đã chốt: **Phương án B** (ma trận chỉnh sửa được bởi admin) — khớp với mockup "Ma trận phân quyền" đã xây dựng, với dòng Admin bị khóa/không thể chỉnh sửa cả ở client lẫn server.

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/roles` | Danh sách 4 vai trò cố định | 0 | 0 | 0 | 1 |
| GET | `/permissions` | Danh mục quyền (~25 dòng, khởi tạo từ bảng FR) | 0 | 0 | 0 | 1 |
| GET | `/roles/{id}/permissions` | Xem dòng ma trận của một vai trò | 0 | 0 | 0 | 1 |
| PUT | `/roles/{id}/permissions` | Chỉnh ma trận cho Leader/PM/Staff, ghi `AUDIT_LOG`. **Dòng Admin là bất biến** — trả về lỗi 403 nếu `role_id` là Admin, được khởi tạo với đầy đủ quyền ngay từ đầu. Đây là phần bảo vệ ở server, bổ sung cho việc khóa ở giao diện — vì chỉ disable ở client không ngăn được người gọi thẳng API | 0 | 0 | 0 | 1 |

---

## `project` (dự án)

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/projects?department_id=&status=` | Danh sách — Staff/PM chỉ phòng ban mình; Leader/Admin lọc được tất cả | 1 | 1 | 1 | 1 |
| GET | `/projects/{id}` | Chi tiết | 1 | 1 | 1 | 1 |
| POST | `/projects` | Tạo mới | 0 | 1 | 0 | 1 |
| PATCH | `/projects/{id}` | Chỉnh sửa | 0 | 1 | 0 | 1 |
| DELETE | `/projects/{id}` | Lưu trữ (xóa mềm) | 0 | 1 | 0 | 1 |
| GET | `/projects/{id}/tasks?include=milestones,tags,assignees` | Toàn bộ task của project — Kanban, List, Gantt, Calendar đều render từ cùng một dữ liệu này; việc chia 4 view là quyết định ở tầng giao diện, không phải 4 endpoint riêng ở backend | 1 | 1 | 1 | 1 |

**Ghi chú:** Gantt là view duy nhất thực sự cần thêm gì đó ở backend — cần `TASK.start_date` (đã thêm vào `ERD.md`) cùng với `due_date` để vẽ độ rộng thanh. Kanban/List/Calendar không cần thêm schema nào ngoài những gì đã có.

---

## `milestone` (cột mốc)

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/projects/{id}/milestones` | Danh sách | 1 | 1 | 1 | 1 |
| POST | `/projects/{id}/milestones` | Tạo mới | 0 | 1 | 0 | 1 |
| PATCH | `/milestones/{id}` | Chỉnh sửa | 0 | 1 | 0 | 1 |
| DELETE | `/milestones/{id}` | Xóa | 0 | 1 | 0 | 1 |

---

## `task` (công việc)

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/projects/{id}/tasks` | Danh sách task (và subtask qua `parent_task_id`) | 1 | 1 | 1 | 1 |
| GET | `/tasks/{id}` | Chi tiết | 1 | 1 | 1 | 1 |
| POST | `/projects/{id}/tasks` | Tạo task hoặc subtask (`parent_task_id` tùy chọn) | 0 | 1 | 0 | 1 |
| PATCH | `/tasks/{id}` | Chỉnh sửa toàn bộ: title, description, priority, deadline, người phụ trách | 0 | 1 | 0 | 1 |
| PATCH | `/tasks/{id}/status` | Chỉ cập nhật trạng thái — Staff giới hạn ở task/subtask được giao cho mình | 1 | 1 | 0 | 1 |
| DELETE | `/tasks/{id}` | Xóa task hoặc subtask | 0 | 1 | 0 | 1 |
| POST | `/tasks/{id}/tags` | Gắn thẻ | 0 | 1 | 0 | 1 |
| DELETE | `/tasks/{id}/tags/{tagId}` | Gỡ thẻ | 0 | 1 | 0 | 1 |

---

## `task` — bình luận & tệp đính kèm

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/tasks/{id}/comments` | Danh sách | 1 | 1 | 1 | 1 |
| POST | `/tasks/{id}/comments` | Tạo mới | 1 | 1 | 1 | 1 |
| GET | `/tasks/{id}/attachments` | Danh sách | 1 | 1 | 1 | 1 |
| POST | `/tasks/{id}/attachments` | Tải lên qua SharePoint/Graph API — có giới hạn tốc độ (cấu hình app, không phải schema) | 1 | 1 | 1 | 1 |
| DELETE | `/attachments/{id}` | Xóa — người tải lên hoặc PM/Admin | 1* | 1 | 0 | 1 |

*\*Staff chỉ xóa được tệp do chính mình tải lên.*

---

## `notification` (thông báo)

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/notifications` | Danh sách — Staff/PM/Leader chỉ trong workspace mình; Admin thấy **tất cả** workspace (đã xác nhận qua tài liệu UI mapping — hộp thông báo của Admin ghi rõ "mọi workplace") | 1 | 1 | 1 | 1 |
| PATCH | `/notifications/{id}/read` | Đánh dấu đã đọc | 1 | 1 | 1 | 1 |
| POST | `/notifications/broadcast` | Thông báo toàn hệ thống do Leader gửi (`BROADCAST_MESSAGE`, phân phối qua `NOTIFICATION`) | 0 | 0 | 1 | 0 |

---

## `audit` (nhật ký hoạt động)

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/audit-logs?date=&actor_id=&entity_type=` | Xem nhật ký một ngày. Mặc định là **hôm nay** nếu bỏ trống `date` — đây chính là "reset" mà tài liệu FR mô tả: chỉ là mặc định của giao diện, không phải xóa dữ liệu. Bất kỳ ngày nào trước đó vẫn truy vấn được như bình thường | 0 | 0 | 0 | 1 |
| GET | `/audit-logs/days` | Danh sách các ngày có dữ liệu, dùng cho bộ chọn ngày | 0 | 0 | 0 | 1 |
| GET | `/audit-logs/export?date=&format=csv` | Xuất nhật ký của một ngày được chọn — **chỉ CSV** (tài liệu UI mapping bỏ PDF) | 0 | 0 | 0 | 1 |

**Đã chốt:** không dòng nào bị xóa — `AUDIT_LOG` luôn là một nhật ký bất biến, phù hợp với tinh thần tuân thủ (compliance) của SRS FR-6/NFR-1, và khớp với cách diễn đạt "vẫn xem được" của tài liệu FR cho các ngày trước. "Reset mỗi ngày" chỉ đơn thuần là giao diện mặc định hiển thị các mục hôm nay, không phải lưu trữ vật lý riêng. Để giữ truy vấn nhanh khi bảng lớn dần theo năm: đánh index `created_at` (và `actor_id`/`entity_type`), và cân nhắc phân vùng bảng theo ngày (date-based partitioning) trong Postgres nếu khối lượng dữ liệu lớn — không phải mối lo ở giai đoạn MVP. Chính sách xóa/lưu trữ có thời hạn là một quyết định pháp lý/tuân thủ riêng, chỉ nên làm khi thực sự cần — không nên xây dựng trước.

---

## `dashboard` (endpoint tổng hợp)

| Method | Path | Mô tả | S | P | L | A |
|---|---|---|---|---|---|---|
| GET | `/dashboard/me` | Tổng quan theo vai trò — nội dung khác nhau tùy vai trò | 1 | 1 | 1 | 1 |
| GET | `/dashboard/enterprise` | Thống kê xuyên suốt các workspace | 0 | 0 | 1 | 1 |

---

## Các mục còn cần quyết định trước khi triển khai

**Đã giải quyết qua `ERD.md` v2:** thêm thực thể `MILESTONE`, trường `TASK.description`, trường `USER.avatar_url`, cơ chế cache trạng thái NetBird, thực thể `BROADCAST_MESSAGE`, và luồng yêu cầu lại sau khi bị khóa (`ACCESS_REQUEST.request_type = UNLOCK_REQUEST`).

**Đã giải quyết qua tài liệu UI mapping:** mâu thuẫn về phạm vi thông báo của Admin (đã xác nhận là toàn bộ workplace); ma trận phân quyền đã chốt hướng đi (Phương án B).

**Đã giải quyết ở vòng gần đây:** đa view (Kanban/List/Gantt/Calendar) chủ yếu là vấn đề client, gộp về một endpoint `GET /projects/{id}/tasks` dùng chung (ngoại lệ: Gantt cần thêm `TASK.start_date`); nhật ký audit không xóa dữ liệu, "reset" chỉ là mặc định giao diện; quy tắc đổi vai trò của Admin đã được làm rõ (không đụng vào Admin khác, tự giáng chức được trừ khi là Admin cuối cùng); xác nhận lỗi copy-paste ở tài liệu nguồn (tính năng 4 view của Admin, không cần sửa gì).

**Còn mở:**
- `DEPARTMENT.settings` — cần xác định trước "cài đặt workspace" thực sự gồm những gì rồi mới thêm trường/bảng tương ứng vào `ERD.md`.

---

## Phụ lục: Tóm tắt ngắn gọn

**Tài liệu này mô tả gì?** Toàn bộ endpoint API cho hệ thống, chia theo domain khớp với cấu trúc modular monolith: `auth`, `workspace` (phòng ban/người dùng/yêu cầu truy cập/ma trận phân quyền), `project`, `milestone`, `task` (kèm bình luận/tệp đính kèm), `notification`, `audit`, `dashboard`.

**Vai trò quyết định gì:**
- **Staff (Nhân viên):** chỉ xem và cập nhật trạng thái task được giao cho mình, xem workspace mình.
- **PM (Trưởng phòng):** toàn quyền CRUD project/milestone/task trong phòng ban mình, xem workload phòng ban.
- **Leader (Giám đốc):** chỉ xem (mọi phòng ban), xem hiệu suất/rủi ro, gửi thông báo toàn hệ thống — không CRUD.
- **Admin:** toàn quyền mọi thứ, cộng thêm: quản lý tài khoản (khóa/mở khóa/duyệt truy cập), chỉnh ma trận phân quyền, xem nhật ký audit.

**5 quy tắc nghiệp vụ đáng nhớ nhất:**

1. **4 kiểu view (Kanban/List/Gantt/Calendar) dùng chung một endpoint** — chỉ là cách hiển thị khác nhau ở client, không phải 4 endpoint backend riêng.
2. **Dòng Admin trong ma trận phân quyền bị khóa ở cả hai tầng** — client disable, server trả lỗi 403 nếu ai đó cố gọi thẳng API.
3. **Admin không thể đổi vai trò của Admin khác** — nhưng có thể tự giáng chức mình, trừ khi là Admin cuối cùng còn lại.
4. **Nhật ký audit không bao giờ bị xóa** — "reset mỗi ngày" chỉ là mặc định hiển thị hôm nay ở giao diện; xuất file chỉ hỗ trợ CSV.
5. **Thông báo của Admin bao trùm mọi workspace**, trong khi Staff/PM/Leader chỉ thấy thông báo trong workspace của mình.

**Còn mở, cần quyết định:** chỉ còn một mục — `DEPARTMENT.settings` (cài đặt workspace) chưa có chỗ lưu trong schema vì chưa xác định rõ nội dung cụ thể.

---

*Xem thêm: [`ERD_VI.md`](./ERD_VI.md), [`PRD.md`](./PRD.md), [`SRS.md`](./SRS.md).*
