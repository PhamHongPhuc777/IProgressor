# Software Requirements Specification (SRS)

**Tên dự án:** Hệ thống Quản lý Dự án Nội bộ
**Người soạn: Hồng Phúc**
**Ngày soạn:** 09/07/2026

> Converted from `Software Requirement Specification - Project Managment Web App.pdf` for repo review/reference. Content is unedited from the source PDF (only reformatted to Markdown).
>
> **Reviewer note:** the source document's table of contents lists a "NFR-4: Khả năng triển khai" section, but the PDF export shows `Error! Bookmark not defined.` and the section itself is missing from the body — the deployability NFR was never actually written. Flagged here as an open gap for the author to fill in, not something lost in conversion.

## Table of Contents

1. [Giới thiệu](#1-giới-thiệu)
   - [1.1 Mục đích](#11-mục-đích)
   - [1.2 Phạm vi](#12-phạm-vi)
   - [1.3 Đối tượng sử dụng](#13-đối-tượng-sử-dụng)
2. [Mô tả tổng quan](#2-mô-tả-tổng-quan)
   - [2.1 Bối cảnh sản phẩm](#21-bối-cảnh-sản-phẩm)
   - [2.2 Giả định và ràng buộc](#22-giả-định-và-ràng-buộc)
3. [Yêu cầu chức năng](#3-yêu-cầu-chức-năng)
   - [FR-1: Quản lý Workspace theo phòng ban](#fr-1-quản-lý-workspace-theo-phòng-ban)
   - [FR-2: Quản lý dự án](#fr-2-quản-lý-dự-án)
   - [FR-3: Phân rã công việc và phân bổ nguồn lực](#fr-3-phân-rã-công-việc-và-phân-bổ-nguồn-lực)
   - [FR-4: Theo dõi và báo cáo cho vai trò quản lý](#fr-4-theo-dõi-và-báo-cáo-cho-vai-trò-quản-lý)
   - [FR-5: Xác thực và phân quyền](#fr-5-xác-thực-và-phân-quyền)
   - [FR-6: Nhật ký audit](#fr-6-nhật-ký-audit)
4. [Yêu cầu phi chức năng](#4-yêu-cầu-phi-chức-năng)
   - [NFR-1: Bảo mật](#nfr-1-bảo-mật)
   - [NFR-2: Hiệu năng](#nfr-2-hiệu-năng)
   - [NFR-3: Khả năng bảo trì và mở rộng](#nfr-3-khả-năng-bảo-trì-và-mở-rộng)

---

## 1. Giới thiệu

### 1.1 Mục đích

Tài liệu này đặc tả yêu cầu chức năng và phi chức năng cho ứng dụng web quản lý dự án nội bộ doanh nghiệp, làm căn cứ thiết kế và phát triển cho đội kỹ thuật (Spring Boot backend, React.js frontend).

### 1.2 Phạm vi

Hệ thống cho phép các phòng ban tạo workspace riêng, quản lý dự án và các milestone/task liên quan, phân bổ nguồn lực nhân sự, theo dõi tiến độ, và cung cấp công cụ báo cáo cho vai trò quản lý. Hệ thống tích hợp với hệ thống nội bộ công ty.

### 1.3 Đối tượng sử dụng

- **Nhân viên (Staff):** xem/cập nhật task được giao.
- **Trưởng phòng (Project Manager):** tạo dự án, phân bổ nguồn lực, theo dõi tiến độ.
- **Giám đốc (Leader):** quản lý thành viên và quyền trong phạm vi phòng ban.
- **Quản trị hệ thống (Admin):** quản lý toàn hệ thống, tích hợp, bảo mật.

## 2. Mô tả tổng quan

### 2.1 Bối cảnh sản phẩm

Công cụ nội bộ (internal tool), không public ra ngoài internet công khai theo mặc định; ưu tiên kiểm soát dữ liệu và truy cập chặt chẽ hơn tốc độ triển khai.

### 2.2 Giả định và ràng buộc

- Đội phát triển có nền tảng Java (Spring Boot) và JavaScript/React.
- Giai đoạn MVP triển khai dạng modular monolith.
- Công ty có hạ tầng Microsoft 365/SharePoint hoặc SharePoint on-premises.

## 3. Yêu cầu chức năng

### FR-1: Quản lý Workspace theo phòng ban

- Mỗi phòng ban có workspace riêng biệt, cô lập dữ liệu với workspace khác.
- Workspace Admin quản lý thành viên và vai trò trong workspace của mình.
- Ánh xạ trực tiếp 1 phòng ban = 1 Zitadel Organization (mô hình multi-tenant sẵn có của Zitadel), thay vì tự mô phỏng bằng group/RBAC.

### FR-2: Quản lý dự án cho vai trò trưởng phòng

- Tạo, sửa, xóa (lưu trữ) dự án trong workspace.
- Lưu thông tin liên quan đến dự án (mô tả, phạm vi, thời gian, tài liệu).
- Liên kết dữ liệu dự án với hệ thống khác trong công ty qua Microsoft Graph API (SharePoint site/tài liệu) hoặc SharePoint REST API/CSOM nếu dùng bản on-premises.

### FR-3: Phân rã công việc và phân bổ nguồn lực cho vai trò trưởng phòng

- Chia dự án thành milestone và task.
- Gán task cho một hoặc nhiều nhân sự phụ trách.
- Cập nhật trạng thái task (ví dụ: chưa bắt đầu / đang làm / hoàn thành / trễ hạn) và tiến độ (%).
- Hiển thị dữ liệu theo nhiều dạng view: Kanban board, danh sách, Gantt chart, lịch.

### FR-4: Theo dõi và báo cáo cho vai trò giám đốc

- Dashboard tổng quan tiến độ dự án theo workspace/phòng ban.
- Báo cáo khối lượng công việc (workload) và hiệu suất theo từng nhân sự.
- Cảnh báo task/milestone trễ hạn.
- Phát hiện rủi ro

### FR-5: Xác thực và phân quyền

- Đăng nhập tập trung qua Zitadel self-host (OIDC/OAuth2); hỗ trợ identity brokering với Entra ID hoặc AD/LDAP on-prem nếu công ty có sẵn.
- Phân quyền RBAC theo workspace, kiểm tra bắt buộc ở tầng API (Spring Boot), không chỉ ẩn/hiện trên giao diện.
- NetBird (self-host, mạng riêng nội bộ) dùng chung Zitadel làm OIDC identity provider — thống nhất một hệ định danh cho cả truy cập ứng dụng lẫn truy cập mạng nội bộ (SSH, admin console, DB).

### FR-6: Nhật ký audit cho quản trị hệ thống

- Ghi log bất biến cho mọi thay đổi task, dự án, và quyền truy cập (ai, vai trò, làm gì, khi nào).
- Với các sự kiện auth/authorization (đăng nhập, cấp quyền, đổi vai trò), tận dụng event-sourcing sẵn có của Zitadel — mọi hành động được lưu thành event bất biến, phục vụ trực tiếp yêu cầu audit/compliance.

## 4. Yêu cầu phi chức năng

### NFR-1: Bảo mật

- TLS bắt buộc cho toàn bộ kết nối (kể cả nội bộ giữa các service, không chỉ tại edge).
- Mã hóa dữ liệu at-rest cho PostgreSQL.
- Không expose ra internet công khai: cổng quản trị Zitadel và PostgreSQL chỉ truy cập qua mạng riêng (NetBird), không mở public.
- Secrets (token, mật khẩu DB) lưu trong secret manager, không lưu trong .env/repo.
- Pentest và quét lỗ hổng dependency (SCA) bắt buộc trước go-live.
- Sử dụng Spring Security để xác thực bằng JWT

### NFR-2: Hiệu năng

- Đáp ứng tốt cho quy mô CRUD/dashboard nội bộ (không yêu cầu render real-time khối lượng cực lớn); React.js/Vite đáp ứng đủ.

### NFR-3: Khả năng bảo trì và mở rộng

- Kiến trúc modular monolith Spring Boot, tổ chức module theo domain (workspace, project, task, auth...).

---

*See also: [`PRD.md`](./PRD.md) for product context and feature scope, [`ERD.md`](./ERD.md) for the data model backing these requirements.*
