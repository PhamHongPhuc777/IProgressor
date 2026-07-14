# Project Requirement Document (PRD)

**Tên dự án:** Hệ thống Quản lý Dự án Nội bộ
**Người soạn: Hồng Phúc**
**Ngày soạn:** 09/07/2026

> Converted from `Project Requirement Document - Project Managment Web App.pdf` for repo review/reference. Content is unedited from the source PDF (only reformatted to Markdown).

## Table of Contents

1. [Vấn đề](#1-vấn-đề)
2. [Mục tiêu](#2-mục-tiêu)
3. [Đối tượng người dùng](#3-đối-tượng-người-dùng)
4. [Công cụ tương đồng](#4-công-cụ-tương-đồng)
5. [Phạm vi tính năng](#5-phạm-vi-tính-năng)
   - [5.1 Workspace theo phòng ban](#51-workspace-theo-phòng-ban)
   - [5.2 Quản lý dự án và liên kết dữ liệu](#52-quản-lý-dự-án-và-liên-kết-dữ-liệu)
   - [5.3 Milestone, Task & phân bổ nguồn lực](#53-milestone-task--phân-bổ-nguồn-lực)
   - [5.4 Theo dõi tiến độ & Dashboard cho quản lý](#54-theo-dõi-tiến-độ--dashboard-cho-quản-lý)
   - [5.5 Tính năng thông minh (AI) — đề xuất khác biệt](#55-tính-năng-thông-minh-ai--đề-xuất-khác-biệt)
6. [User Stories tiêu biểu](#6-user-stories-tiêu-biểu)
7. [Đề xuất công nghệ](#7-đề-xuất-công-nghệ)
8. [Rủi ro và Giả định](#8-rủi-ro-và-giả-định)

---

## 1. Vấn đề

**Bối cảnh hiện tại:** Công ty đang quản lý nhiều dự án song song giữa các phòng ban, nhưng chưa có công cụ quản lý dự án nội bộ tập trung. Các phòng ban hiện dựa vào SharePoint và email để theo dõi tiến độ.

**Hệ quả:**

- Thiếu minh bạch: lãnh đạo chưa nhìn được tiến triển tổng thể về toàn công ty.
- Khó phối hợp liên phòng ban: thông tin dự án nằm rải rác ở nhiều nơi, nhiều định dạng.
- Không có nguồn dữ liệu duy nhất (single source of truth) cho trạng thái dự án, milestone, khối lượng công việc của từng nhân sự.
- Tốn thời gian tổng hợp báo cáo thủ công, dễ sai lệch.

**Người gặp vấn đề:** Trưởng phòng/PM (lập kế hoạch, giao việc), nhân viên (thực thi task), Ban lãnh đạo (theo dõi tiến độ & hiệu suất toàn công ty).

**Vì sao cần phải giải quyết:** Quy mô dự án tăng theo số phòng ban; càng trì hoãn, chi phí phối hợp và rủi ro trễ tiến độ càng lớn.

## 2. Mục tiêu

- Cung cấp workspace riêng cho từng phòng ban để quản lý dự án độc lập nhưng vẫn liên kết được với bức tranh chung.
- Cho phép tạo, quản lý dự án và liên kết dữ liệu từ các hệ thống nội bộ khác (SharePoint, email, ERP...).
- Chia nhỏ dự án thành milestone và task, phân bổ nguồn lực cho từng nhân sự, theo dõi trạng thái/tiến độ theo thời gian thực.
- Trang bị cho quản lý công cụ giám sát tiến độ dự án và hiệu suất nhân sự (dashboard, báo cáo).

## 3. Đối tượng người dùng

| Persona | Nhu cầu chính |
|---|---|
| Nhân viên / Staff | Xem task được giao, cập nhật trạng thái, trao đổi trong ngữ cảnh task |
| Trưởng phòng / PM | Lập kế hoạch dự án, chia milestone/task, phân bổ nguồn lực |
| Giám đốc / Leader | Xem tổng quan đa phòng ban, hiệu suất nhân sự, dự án có nguy cơ trễ, theo dõi rủi ro  |
| Quản trị hệ thống / Admin | Quản lý workspace, phân quyền, tích hợp hệ thống nội bộ, giàm sát được audit trail/logging |

## 4. Công cụ tương đồng

So sánh nhanh các công cụ quản lý dự án được dùng phổ biến nhất hiện nay để rút ra bài học thiết kế tính năng:

| Công cụ | Điểm mạnh nổi bật | Bài học áp dụng |
|---|---|---|
| Jira | Mạnh về Scrum/sprint, backlog, workflow cấu hình sâu — phù hợp đội kỹ thuật | Cho phép workflow trạng thái tùy biến theo từng phòng ban |
| Asana | Giao diện gọn, nhiều view (List/Board/Timeline dạng Gantt), cộng tác tốt | Cần Timeline/Gantt view cho PM lập kế hoạch milestone |
| Monday.com | Trực quan cao (board, status màu), automation đa bước dễ dùng | Dashboard trực quan, không cần setup phức tạp cho người dùng không kỹ thuật |
| ClickUp | Nhiều view, time-tracking & chat miễn phí ngay từ bản free, workspace tùy biến sâu | Gộp nhiều chức năng (task, doc, chat, dashboard) trong 1 workspace/phòng ban |
| Linear | Nhanh, gọn, thao tác bàn phím, tối ưu cho đội sản phẩm/kỹ thuật | Ưu tiên tốc độ thao tác và giao diện tối giản để tăng tỷ lệ dùng thực tế |

## 5. Phạm vi tính năng

Ký hiệu ưu tiên: **M** = Must-have (MVP) · **S** = Should-have (Phase 2) · **C** = Could-have (Phase 3)

### 5.1 Workspace theo phòng ban

- [ ] **[M]** Tạo workspace riêng cho mỗi phòng ban, phân quyền thành viên
- [ ] **[M]** Phân quyền theo vai trò (Admin / PM / Thành viên / Viewer)
- [ ] **[S]** Workspace-level dashboard riêng cho từng phòng ban

### 5.2 Quản lý dự án và liên kết dữ liệu

- [ ] **[M]** Tạo/sửa/lưu trữ dự án (tên, mô tả, thời hạn, chủ dự án, phòng ban liên quan)
- [ ] **[M]** Đính kèm tài liệu, liên kết file từ SharePoint
- [ ] **[S]** Kết nối email (Outlook/Graph API) để đồng bộ trao đổi liên quan đến dự án
- [ ] **[C]** Liên kết dữ liệu hai chiều với hệ thống ERP/CRM nội bộ khác qua API

### 5.3 Milestone, Task & phân bổ nguồn lực

- [ ] **[M]** Chia dự án thành milestone, milestone thành task/subtask
- [ ] **[M]** Gán người phụ trách, deadline, mức độ ưu tiên cho từng task
- [ ] **[M]** Cập nhật trạng thái task (chưa bắt đầu/đang làm/chờ review/hoàn thành/trễ)
- [ ] **[S]** Nhiều kiểu xem: List, Kanban board, Timeline/Gantt, Calendar
- [ ] **[S]** Theo dõi khối lượng công việc (workload) theo từng nhân sự để tránh quá tải
- [ ] **[C]** Tự động đề xuất phân bổ nguồn lực dựa trên workload hiện tại (AI)

### 5.4 Theo dõi tiến độ & Dashboard cho quản lý

- [ ] **[M]** Dashboard tổng quan: % hoàn thành theo dự án, phòng ban, số task trễ hạn
- [ ] **[M]** Báo cáo hiệu suất nhân sự cơ bản (số task hoàn thành/trễ theo thời gian)
- [ ] **[S]** Cảnh báo tự động khi dự án/task có nguy cơ trễ tiến độ
- [ ] **[C]** Dự đoán rủi ro trễ tiến độ bằng AI dựa trên dữ liệu lịch sử (predictive analytics)

### 5.5 Tính năng thông minh (AI) — đề xuất khác biệt

- [ ] **[S]** Tạo task bằng ngôn ngữ tự nhiên ("Tạo kế hoạch dự án X trong 8 tuần, có 3 milestone")
- [ ] **[S]** Tóm tắt tiến độ dự án tự động (AI digest hàng tuần gửi cho PM/quản lý)
- [ ] **[C]** Tìm kiếm ngữ nghĩa (semantic search) trên toàn bộ tài liệu/task đã lưu

## 6. User Stories tiêu biểu

- Là **nhân viên**, tôi muốn thấy danh sách task được giao trong ngày để biết cần ưu tiên làm gì.
- Là **trưởng phòng**, tôi muốn chia dự án thành milestone và task, gán người phụ trách để kiểm soát tiến độ.
- Là **giám đốc**, tôi muốn xem dashboard tổng hợp tiến độ tất cả phòng ban trên một màn hình để ra quyết định nhanh.
- Là **quản lý hệ thống**, tôi muốn phân quyền workspace theo phòng ban để đảm bảo bảo mật dữ liệu.

## 7. Đề xuất công nghệ

| Lớp | Công nghệ | Lý do / Ghi chú |
|---|---|---|
| Frontend | React.js (Vite) + TypeScript | SPA thuần, vì đây là tool nội bộ, có xác thực — Vite cho dev/build ổn định hơn tự dùng bundler của Bun |
| Form & State | React Hook Form + Zustand | Chuẩn phổ biến của hệ sinh thái React, tương thích hoàn toàn |
| Styling | SCSS | Vite hỗ trợ sẵn (chỉ cần cài sass), CSS Modules để scope style theo component, không cần thêm config |
| Runtime & tooling | Bun.js | Dùng làm package manager & chạy script (bun install, bun run) để tăng tốc phát triển UI |
| Backend | Spring Boot + Gradle | Modular monolith (tổ chức package theo domain: workspace, project, task, auth...) |
| ORM | MyBatis | Việc kết hợp Spring Boot, PostgreSQL và MyBatis thường xuất hiện trong các dự án có yêu cầu đặc biệt về hiệu năng, kiểm soát SQL hoặc khi làm việc với hệ thống cơ sở dữ liệu cũ |
| Bảo mật tầng API | Spring Security (OAuth2 Resource Server) | Xác thực JWT do Zitadel phát hành cho mọi request; enforce RBAC theo workspace ngay tại API, không chỉ ở giao diện |
| IAM / SSO | Zitadel (self-host) | Được xây dựng trên ngôn ngữ Go tốc độ nhanh, có mô hình multi-tenant gốc khớp trực tiếp với "workspace theo phòng ban" — mỗi phòng ban là 1 Organization; audit trail bất biến (event-sourcing) phục vụ compliance; OIDC chuẩn cho Spring Security |
| Database | PostgreSQL | Tự host, kiểm soát hoàn toàn dữ liệu trên pgAdmin |
| Mạng quản trị riêng | NetBird (self-host) | Bảo vệ các cổng nhạy cảm, kết nối DB trực tiếp — NetBird có policy/ACL theo nhóm (sync trực tiếp từ Zitadel qua OIDC) xuống tới từng host/service cụ thể |
| Tích hợp nội bộ | Microsoft Graph API | Chọn theo hạ tầng Microsoft 365 |

## 8. Rủi ro và Giả định

- **Giả định:** Các phòng ban sẵn sàng chuyển dữ liệu từ SharePoint/email sang hệ thống mới.
- **Rủi ro:** Kháng cự thay đổi thói quen làm việc → cần kế hoạch đào tạo/onboarding.
- **Rủi ro:** Tích hợp với hệ thống nội bộ cũ có thể phức tạp hơn dự kiến (API không đầy đủ, dữ liệu không chuẩn hóa).
- **Rủi ro bảo mật:** Dữ liệu dự án nhạy cảm cần phân quyền chặt chẽ theo phòng ban.

---

*See also: [`SRS.md`](./SRS.md) for functional/non-functional requirements, [`ERD.md`](./ERD.md) for the data model.*
