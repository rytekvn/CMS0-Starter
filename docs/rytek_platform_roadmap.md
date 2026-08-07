# Rytek Platform Roadmap

> Tài liệu nền tảng cho hệ sinh thái phát triển ứng dụng Rytek  
> Trạng thái: Draft 1.0  
> Phạm vi: CMS, CRM, booking, hotel, SaaS và các hệ thống quản trị nội bộ

---

## 1. Mục đích tài liệu

Tài liệu này định nghĩa tầm nhìn, kiến trúc, quy ước kỹ thuật và lộ trình xây dựng **Rytek Platform**. Đây là nguồn tham chiếu chung cho con người, AI coding agent, CLI và các repository thuộc hệ sinh thái Rytek.

Mục tiêu của tài liệu:

- Thống nhất cách một dự án Rytek được khởi tạo, phát triển, kiểm thử và triển khai.
- Tách phần nền tảng dùng chung khỏi logic nghiệp vụ của từng sản phẩm.
- Chuẩn hóa dashboard, backend, phân quyền, queue, cache và vận hành.
- Đưa Spec-Driven Development thành quy trình mặc định.
- Giúp AI tạo code nhất quán, dễ review và không over-engineering.
- Rút ngắn thời gian khởi tạo sản phẩm nhưng vẫn giữ chất lượng production-ready.

---

## 2. Tầm nhìn

Rytek không chỉ là một bộ template. Rytek là một **development platform** giúp chuyển ý tưởng sản phẩm thành hệ thống có thể vận hành theo một quy trình chuẩn:

```text
Idea
  ↓
AI Architect / Product Discovery
  ↓
Reviewed Specification
  ↓
Rytek Starter
  ↓
AI-assisted Implementation
  ↓
Automated Verification
  ↓
Review
  ↓
Deploy
```

Khi nền tảng hoàn thiện, phần lớn công việc lặp lại như authentication, RBAC, dashboard layout, CRUD, validation, cache, queue, audit và observability đã có sẵn. Đội ngũ chỉ tập trung vào:

- Quy tắc nghiệp vụ.
- Mô hình dữ liệu đặc thù.
- Workflow của sản phẩm.
- Trải nghiệm riêng của người dùng.
- Tích hợp bên ngoài.

### 2.1. Nguyên tắc chiến lược

1. **Platform trước, generator sau**: xây starter và convention ổn định trước khi tự động hóa bằng CLI hoặc AI.
2. **Spec trước, code sau**: không bắt đầu triển khai khi yêu cầu, dữ liệu, quyền và acceptance criteria chưa rõ.
3. **Modular monolith mặc định**: đủ đơn giản để phát triển nhanh, đủ cấu trúc để mở rộng; chỉ tách microservice khi có nhu cầu thực tế.
4. **Reuse by default**: tái sử dụng design token, component, page pattern và backend capability.
5. **Production-ready, không over-engineering**: có các guardrail cần thiết nhưng không đưa Kafka, Event Sourcing hoặc CQRS toàn hệ thống vào starter.
6. **AI có ràng buộc**: AI phải tuân theo `CLAUDE.md`, `spec/`, design system và convention; không tự tạo kiến trúc mới cho từng module.
7. **Evolvable contracts**: API, database, event và UI contract phải có khả năng thay đổi có kiểm soát.

### 2.2. Mục tiêu thành công

- Tạo được dự án mới có thể chạy trong vài phút.
- Tạo module CRUD chuẩn từ một spec đã duyệt.
- Một module mới tự động có permission, validation, API docs, trạng thái UI và test cơ bản.
- Các sản phẩm có nhận diện riêng nhưng dùng chung design language và behavior.
- Nâng cấp starter hoặc package dùng chung không phá vỡ dự án đang vận hành.

---

## 3. Kiến trúc tổng thể

```text
                         Rytek Platform

┌──────────────────────────────────────────────────────────────┐
│                       Product Layer                          │
│       CMS / CRM / Booking / Hotel / SaaS / Internal App      │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                       Experience Layer                       │
│ Next.js + Dashboard Layout + Rytek UI + Design System        │
│ TanStack Query / Table + React Hook Form + Zod               │
└──────────────────────────────┬───────────────────────────────┘
                               │ REST / OpenAPI
┌──────────────────────────────▼───────────────────────────────┐
│                       Application Layer                      │
│ NestJS Modules / Auth / RBAC / Validation / Audit            │
│ Transactions / Idempotency / Rate Limiting                   │
└───────────────┬──────────────────────────────┬───────────────┘
                │                              │
┌───────────────▼──────────────┐  ┌────────────▼──────────────┐
│          Data Layer          │  │     Async & Cache Layer   │
│ Prisma + PostgreSQL          │  │ Redis + BullMQ + Worker   │
└──────────────────────────────┘  └───────────────────────────┘
                │                              │
┌───────────────▼──────────────────────────────▼───────────────┐
│                    Operations Layer                          │
│ Logs / Metrics / Traces / Health / Request ID / Alerting     │
└──────────────────────────────────────────────────────────────┘
```

### 3.1. Kiến trúc triển khai mặc định

- **Admin Web**: ứng dụng Next.js cho giao diện quản trị.
- **API**: NestJS modular monolith cung cấp REST API và OpenAPI.
- **Worker**: tiến trình NestJS/BullMQ xử lý job nền.
- **PostgreSQL**: nguồn dữ liệu chính.
- **Redis**: cache, rate limit, distributed coordination và backend cho BullMQ.
- **Object Storage**: bổ sung theo dự án khi có upload/tệp.
- **Docker**: môi trường phát triển và đóng gói triển khai thống nhất.

### 3.2. Những gì không có mặc định

Các thành phần sau chỉ được thêm khi có ADR và nhu cầu đo lường được:

- Microservices.
- Kafka hoặc RabbitMQ.
- Event Sourcing.
- CQRS toàn hệ thống.
- Kubernetes.
- GraphQL.
- Nhiều database cho cùng một service.

---

## 4. Hệ thống repository

Rytek được chia thành năm repository có trách nhiệm rõ ràng.

```text
rytek-design-system
        ↓
rytek-ui
        ↓
rytek-dashboard-layout
        ↓
rytek-cms-starter ────── rytek-backend-starter
        ↓
Product Projects
```

### 4.1. `rytek-design-system`

Nguồn quy chuẩn thiết kế, không chứa logic nghiệp vụ và không phụ thuộc sản phẩm cụ thể.

```text
rytek-design-system/
├── README.md
├── foundations/
│   ├── colors.md
│   ├── typography.md
│   ├── spacing.md
│   ├── radius.md
│   ├── elevation.md
│   ├── motion.md
│   └── iconography.md
├── components/
│   ├── button.md
│   ├── form.md
│   ├── table.md
│   ├── dialog.md
│   └── feedback.md
├── patterns/
│   ├── list-page.md
│   ├── detail-page.md
│   ├── form-page.md
│   ├── dashboard-page.md
│   └── settings-page.md
├── accessibility/
│   └── guidelines.md
└── ai/
    └── ui-generation-rules.md
```

Trách nhiệm:

- Định nghĩa design token và semantic token.
- Định nghĩa trạng thái, interaction và accessibility.
- Định nghĩa page pattern và quy tắc responsive.
- Là tiêu chuẩn để review mọi thay đổi UI.

Không chịu trách nhiệm:

- Component React thực thi.
- Theme riêng của một khách hàng.
- Business page cụ thể.

### 4.2. `rytek-ui`

Component library dùng chung, được xây trên Tailwind CSS, shadcn/ui và Radix UI.

```text
rytek-ui/
├── packages/
│   ├── ui/
│   │   ├── button/
│   │   ├── input/
│   │   ├── dialog/
│   │   ├── card/
│   │   ├── badge/
│   │   └── feedback/
│   ├── data-table/
│   ├── form/
│   ├── theme/
│   └── icons/
├── apps/
│   └── storybook/
├── tests/
└── CLAUDE.md
```

Component cốt lõi:

- Button, IconButton, Input, Textarea, Select, Combobox.
- Checkbox, Radio, Switch, DatePicker.
- Badge, Avatar, Tooltip, Popover, DropdownMenu.
- Dialog, Drawer, Tabs, Card, Alert, Toast.
- DataTable, Pagination, FilterBar, SearchInput.
- Skeleton, LoadingState, EmptyState, ErrorState, PermissionDenied.
- PageHeader, ConfirmDialog, KpiCard, StatCard.

Quy tắc:

- Không tạo `Button2`, `PrimaryButton`, `BlueButton` hoặc biến thể theo tên dự án.
- Dùng API thống nhất, ví dụ `<Button variant="primary" />`.
- Mọi component phải có keyboard behavior, focus state và accessible label phù hợp.
- Public API phải được version và có migration note khi breaking change.

### 4.3. `rytek-dashboard-layout`

Cung cấp application shell và các pattern bố cục dashboard.

```text
rytek-dashboard-layout/
├── src/
│   ├── application-shell/
│   ├── sidebar/
│   ├── topbar/
│   ├── breadcrumb/
│   ├── content/
│   ├── footer/
│   ├── mobile-navigation/
│   └── layouts/
│       ├── list-layout.tsx
│       ├── detail-layout.tsx
│       ├── form-layout.tsx
│       └── settings-layout.tsx
├── demo/
└── CLAUDE.md
```

Trách nhiệm:

- Navigation, sidebar, header, breadcrumb và content area.
- Responsive behavior và mobile drawer.
- Layout state như collapsed sidebar.
- Slot cho project branding và feature navigation.

### 4.4. `rytek-backend-starter`

Backend chuẩn cho các dự án mới.

```text
rytek-backend-starter/
├── src/
│   ├── common/
│   │   ├── decorators/
│   │   ├── exceptions/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── validation/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── permissions/
│   │   ├── audit/
│   │   ├── health/
│   │   └── example/
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── cache/
│   │   ├── queue/
│   │   ├── idempotency/
│   │   ├── rate-limit/
│   │   └── observability/
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
├── docs/
├── docker/
└── CLAUDE.md
```

Mỗi module nghiệp vụ giữ cấu trúc vừa đủ:

```text
modules/organizations/
├── dto/
├── organizations.controller.ts
├── organizations.service.ts
├── organizations.repository.ts
├── organizations.permissions.ts
├── organizations.module.ts
└── organizations.spec.ts
```

Không tách thêm `usecase`, `mapper`, `factory` hoặc layer trừ khi độ phức tạp thực sự yêu cầu.

### 4.5. `rytek-cms-starter`

Starter tích hợp dùng để tạo sản phẩm hoàn chỉnh.

```text
rytek-cms-starter/
├── apps/
│   ├── admin-web/
│   ├── api/
│   └── worker/
├── packages/
│   ├── ui/
│   ├── sdk/
│   ├── shared/
│   ├── config/
│   └── testing/
├── prisma/
├── spec/
├── docs/
├── docker/
├── scripts/
├── CLAUDE.md
├── package.json
└── pnpm-workspace.yaml
```

Starter phải chạy được ngay, có module mẫu và thể hiện đầy đủ happy path từ UI đến database và worker.

---

## 5. Tech stack chuẩn

| Lớp | Công nghệ | Vai trò |
|---|---|---|
| Frontend framework | Next.js + React + TypeScript | Dashboard và ứng dụng web |
| Styling | Tailwind CSS | Styling theo token và utility |
| Component base | shadcn/ui | Source component dễ sở hữu và tùy biến |
| Headless primitives | Radix UI | Accessibility và interaction primitives |
| Data table | TanStack Table | Sort, filter, pagination, selection, visibility |
| Data fetching | TanStack Query | Server state, cache, mutation và invalidation |
| Form | React Hook Form + Zod | Form state và validation có kiểu |
| Chart | Tremor hoặc Recharts | Dashboard analytics |
| Icon | Lucide React | Bộ icon nhất quán |
| Backend framework | NestJS + TypeScript | API, module system và dependency injection |
| ORM | Prisma | Data access, schema và migration |
| Database | PostgreSQL | Nguồn dữ liệu giao dịch chính |
| Cache | Redis | Cache, rate limit và coordination |
| Queue | BullMQ | Job nền, retry và scheduling |
| API contract | REST + OpenAPI | Contract rõ ràng và sinh SDK |
| Logging | Pino | Structured logging |
| Observability | OpenTelemetry khi cần | Tracing và metrics |
| Packaging | Docker | Môi trường nhất quán |
| Workspace | pnpm | Monorepo dependency management |

### 5.1. Tiêu chí lựa chọn công nghệ

- Hệ sinh thái ổn định, cộng đồng lớn.
- AI coding agent hiểu tốt và sinh code chính xác.
- Có thể tự sở hữu code và giảm lock-in.
- Hỗ trợ testing, type safety và production operation.
- Có đường nâng cấp rõ ràng.

---

## 6. Dashboard Design System

### 6.1. Nguyên tắc thiết kế

1. **Consistency**: cùng hành động phải có cùng cách hiển thị và hành vi.
2. **Clarity**: ưu tiên rõ ràng hơn trang trí.
3. **Predictability**: người dùng đoán được kết quả của thao tác.
4. **Progressive disclosure**: chỉ hiện tùy chọn nâng cao khi cần.
5. **Minimal navigation depth**: menu lồng tối đa hai cấp.
6. **Safe actions**: thao tác phá hủy hoặc ghi đè phải được xác nhận.
7. **Reusable patterns**: không thiết kế lại CRUD cho từng module.
8. **Accessible by default**: keyboard, focus và semantic state là yêu cầu nền tảng.

### 6.2. Design token

Chỉ dùng semantic token trong component và product code:

```text
--background
--foreground
--surface
--surface-muted
--border
--primary
--primary-foreground
--success
--warning
--danger
--info
```

Scale mặc định:

- Spacing: `4, 8, 12, 16, 20, 24, 32, 40, 48px`.
- Radius: small `6px`, medium `10px`, large `14px`, full `999px`.
- Shadow: small cho phân tách nhẹ, medium cho dropdown/popover, large cho modal/drawer.
- Typography: giới hạn số cấp chữ; ưu tiên Inter hoặc system sans-serif.

Mỗi dự án được phép thay đổi:

- Tên sản phẩm, logo và favicon.
- Primary/accent color.
- Light/dark mode.
- Một số tùy chọn sidebar đã được hệ thống hỗ trợ.

Mỗi dự án không được tự ý thay đổi:

- Spacing scale, behavior của form/table.
- Page pattern, validation pattern.
- Loading/error/empty behavior.
- Accessibility baseline.

### 6.3. Application shell

```text
┌──────────────┬──────────────────────────────────┐
│ Sidebar      │ Topbar                           │
│              ├──────────────────────────────────┤
│              │ Breadcrumb / Page Header         │
│              │                                  │
│              │ Main Content                     │
│              │                                  │
└──────────────┴──────────────────────────────────┘
```

Gợi ý mặc định:

- Sidebar expanded: `240px`.
- Sidebar collapsed: `72px`.
- Header: `56px`.
- Content padding desktop: `24px`.
- Content padding tablet: `16px`.
- Trên mobile, sidebar chuyển thành drawer.

### 6.4. Page patterns

**List Page**

```text
PageHeader
FilterBar
DataTable
Pagination
```

**Detail Page**

```text
PageHeader
Summary Card
Tabs
Related Data
Activity Log
```

**Create/Edit Page**

```text
PageHeader
Form Sections
Sticky Action Footer
Unsaved Changes Guard
```

**Dashboard Home**

```text
KPI Cards
Charts
Recent Activity
Quick Actions
Alerts
```

**Settings Page**

```text
Settings Navigation
Form Content
Save Action
```

### 6.5. Data table chuẩn

`DataTable` dùng TanStack Table và hỗ trợ theo cấu hình:

- Server-side hoặc client-side search.
- Filter, sort và pagination.
- Column visibility, resize và density.
- Row selection, bulk action và row action.
- Export khi permission cho phép.
- Loading, empty, no-result và error state.
- Virtualization khi dữ liệu hiển thị lớn.

Table trên mobile có thể cuộn ngang hoặc chuyển sang card list; không ép toàn bộ cột desktop vào màn hình nhỏ.

### 6.6. Form chuẩn

- Form ngắn dùng một cột; form vừa có thể dùng hai cột.
- Form dài chia section; form phức tạp dùng tabs hoặc stepper.
- Label nằm trên input; lỗi hiển thị cạnh field liên quan.
- Validation client và server phải nhất quán.
- Không mất dữ liệu khi validation thất bại.
- Cảnh báo khi rời trang có thay đổi chưa lưu.
- Action footer sticky cho form dài.

### 6.7. Trạng thái bắt buộc

Mọi page hoặc data-bound component phải xử lý:

- Loading.
- Empty.
- No result.
- Error.
- Success feedback.
- Permission denied.
- Offline hoặc degraded state khi phù hợp.

### 6.8. Quy tắc AI khi tạo UI

1. Đọc design system và page pattern liên quan trước khi code.
2. Tái sử dụng component hiện có.
3. Không hard-code màu, spacing hoặc radius.
4. Không tạo component mới nếu component chung đã đáp ứng.
5. Mọi page có loading, empty, error và permission-denied state phù hợp.
6. Mọi form có validation và server-error mapping.
7. Mọi dangerous action có confirm dialog.
8. Không tạo design language riêng cho module.

---

## 7. Backend capabilities

### 7.1. REST API và OpenAPI

- REST làm contract mặc định.
- Endpoint dùng resource naming nhất quán và version khi cần.
- DTO tách request/response; validate mọi input ở boundary.
- Error response có schema thống nhất: `code`, `message`, `details`, `requestId`.
- Swagger/OpenAPI được sinh từ code và kiểm tra trong CI.
- SDK frontend được sinh hoặc bọc có kiểu từ OpenAPI.

### 7.2. Authentication

- JWT access token thời hạn ngắn.
- Refresh token có rotation và khả năng revoke.
- Password được hash bằng thuật toán phù hợp.
- Session/device management nếu sản phẩm cần.
- Có hook mở rộng cho OAuth/SSO và MFA, không bật mặc định nếu chưa cần.
- Không log token, password hoặc secret.

### 7.3. RBAC và permission

Permission đặt theo convention:

```text
<resource>.<action>

organization.read
organization.create
organization.update
organization.delete
organization.export
organization.verify
```

Luồng kiểm tra:

```text
Authenticated User
  ↓
Role Assignment
  ↓
Resolved Permissions
  ↓
Guard / Policy
  ↓
Controller Action
```

- Backend là nguồn quyết định cuối cùng.
- Frontend dùng permission để ẩn hoặc khóa action, không thay thế backend guard.
- Seed có role hệ thống tối thiểu; project tự định nghĩa role nghiệp vụ.
- Thay đổi role/permission quan trọng phải được audit.

### 7.4. Transactions

Dùng database transaction khi một use case có nhiều thao tác phải thành công hoặc thất bại cùng nhau, ví dụ:

- Tạo invoice và cập nhật balance.
- Xác nhận booking và giữ inventory.
- Ghi domain state và outbox record.

Transaction phải ngắn, có boundary rõ ràng và không bao quanh network call chậm.

### 7.5. Concurrency

Chọn chiến lược theo use case:

- Unique constraint cho invariant có thể biểu diễn bằng database.
- Optimistic concurrency/version field cho edit cạnh tranh.
- Atomic update cho counter hoặc state transition đơn giản.
- Row lock chỉ cho critical section cần serialization.
- Distributed lock chỉ khi tài nguyên trải qua nhiều process và không giải quyết được bằng database constraint.

Mọi concurrency-sensitive flow phải có test chạy đồng thời.

### 7.6. Cache

- Cache-aside là pattern mặc định.
- Cache key có namespace và version.
- TTL là bắt buộc, trừ trường hợp có lý do được ghi rõ.
- Mutation phải invalidate hoặc cập nhật cache liên quan.
- Không dùng cache làm nguồn sự thật cho dữ liệu nghiệp vụ.
- Theo dõi hit rate, miss rate và lỗi Redis.

### 7.7. Queue và worker

BullMQ dùng cho:

- Gửi email/thông báo.
- Import/export.
- Xử lý ảnh/tệp.
- Đồng bộ tích hợp bên ngoài.
- Verification hoặc tác vụ dài.
- Scheduled/retryable jobs.

Mọi job phải định nghĩa:

- Payload schema và version.
- Idempotency strategy.
- Retry policy và exponential backoff.
- Timeout.
- Concurrency.
- Failure handling/dead-letter convention.
- Logging với job ID và correlation ID.

### 7.8. Idempotency

Idempotency là bắt buộc cho payment, webhook, import, create request có khả năng retry và job nền có side effect.

```text
Client / Provider
  ↓ Idempotency-Key
Idempotency Store
  ├── Completed → trả lại kết quả trước
  ├── In progress → từ chối hoặc chờ theo policy
  └── New → thực thi và lưu kết quả
```

Key phải gắn với caller, operation và payload fingerprint khi cần. Bản ghi có TTL và không được che giấu conflict giữa hai payload khác nhau.

### 7.9. Rate limiting

- Có global baseline để bảo vệ hệ thống.
- Có policy riêng cho login, password reset, OTP, public API và webhook.
- Xác định identity theo user/API key/IP tùy endpoint.
- Phản hồi chuẩn với `429` và retry metadata phù hợp.
- Tránh chặn nhầm traffic nội bộ hoặc proxy do cấu hình IP sai.

### 7.10. Observability

Baseline production:

- Structured logs bằng Pino.
- Request ID/correlation ID xuyên qua API, database log và queue.
- Health/liveness/readiness endpoints.
- Error reporting có context nhưng đã loại dữ liệu nhạy cảm.
- Metrics cho request latency, error rate, database, Redis và queue.
- Audit log cho hành động quan trọng.
- OpenTelemetry traces khi hệ thống hoặc tích hợp đủ phức tạp.

Không dùng log text rời rạc làm audit trail.

---

## 8. Spec-Driven Development

### 8.1. Nguyên tắc

Spec là contract được review giữa product, engineering, QA và AI. AI không tự suy đoán yêu cầu quan trọng từ một câu mô tả ngắn.

```text
Idea
  ↓
Product Spec
  ↓
Domain & Data Spec
  ↓
Permission & Workflow Spec
  ↓
API & UI Spec
  ↓
Review / Approve
  ↓
Implementation
  ↓
Verification
```

### 8.2. Cấu trúc `spec/`

```text
spec/
├── README.md
├── product/
│   ├── vision.md
│   └── glossary.md
├── entities/
│   ├── organization.yaml
│   └── user.yaml
├── features/
│   └── organization-management.md
├── workflows/
│   └── organization-verification.md
├── permissions/
│   └── organization.yaml
├── api/
│   └── organization.md
├── ui/
│   └── organization.md
├── non-functional/
│   ├── security.md
│   ├── performance.md
│   └── observability.md
├── decisions/
│   └── ADR-0001-example.md
└── acceptance/
    └── organization.feature.md
```

### 8.3. Spec entity mẫu

```yaml
entity: Organization
description: Organization managed by an administrator

fields:
  id:
    type: uuid
    generated: true
  name:
    type: string
    required: true
    maxLength: 160
  website:
    type: url
    required: false
  phone:
    type: string
    required: false
  status:
    type: enum
    values: [pending, verified, rejected]
    default: pending

indexes:
  - fields: [status]

permissions:
  - organization.read
  - organization.create
  - organization.update
  - organization.delete
  - organization.verify

audit:
  events:
    - organization.created
    - organization.updated
    - organization.status_changed
```

### 8.4. Definition of Ready

Một feature chỉ sẵn sàng triển khai khi có:

- Mục tiêu và phạm vi.
- Actor/persona.
- Entity, field, validation và invariant.
- Permission matrix.
- Workflow và state transition.
- UI states và page pattern.
- API behavior và error cases.
- Transaction/concurrency/idempotency requirement nếu có.
- Acceptance criteria có thể kiểm thử.
- Out-of-scope rõ ràng.
- Spec đã được con người phê duyệt.

### 8.5. Definition of Done

- Implementation khớp spec đã duyệt.
- Migration có thể chạy và rollback/forward-fix theo policy.
- Permission được kiểm tra ở backend và phản ánh ở frontend.
- Có unit/integration/e2e test tương ứng với rủi ro.
- OpenAPI và SDK được cập nhật.
- Loading, empty, error và permission states hoàn chỉnh.
- Logs, audit và metrics cần thiết đã có.
- Không có secret hoặc dữ liệu nhạy cảm trong log.
- Documentation và changelog được cập nhật.
- CI pass và reviewer phê duyệt.

---

## 9. AI workflow: `CLAUDE.md` + Ponytail + `spec/`

### 9.1. Vai trò của từng phần

| Thành phần | Vai trò |
|---|---|
| `CLAUDE.md` | Luật làm việc, kiến trúc, command, convention và giới hạn của repository |
| Ponytail | Guardrail giữ giải pháp gọn, tập trung, tránh over-engineering và code sinh thừa |
| `spec/` | Nguồn yêu cầu nghiệp vụ và acceptance criteria đã được review |
| Design System | Luật UI, token, component và page pattern |
| Backend Conventions | Luật API, module, transaction, permission và infrastructure |
| Prompt Library | Các yêu cầu lặp lại đã được chuẩn hóa cho AI |

### 9.2. Thứ tự AI phải đọc

```text
Task
  ↓
Repository CLAUDE.md
  ↓
Relevant spec/*
  ↓
Design System / Backend Conventions
  ↓
Existing nearest module and tests
  ↓
Implementation plan
  ↓
Code + Migration + Tests + Docs
  ↓
Verification report
```

### 9.3. Nội dung tối thiểu của `CLAUDE.md`

```markdown
# Project Context
- Product purpose
- Architecture overview

# Required Reading
- Relevant spec paths
- Design system paths
- API/backend conventions

# Commands
- Install
- Dev
- Lint
- Typecheck
- Test
- Build
- Migration

# Architecture Rules
- Module boundaries
- Dependency direction
- Data-access rules
- Error and logging conventions

# UI Rules
- Reuse shared components
- Use semantic tokens
- Required page states

# Backend Rules
- Validation
- Permissions
- Transactions
- Idempotency
- Queue conventions

# AI Guardrails
- Do not modify approved specs silently
- Do not add dependencies without justification
- Do not introduce new abstractions without repeated need
- Stop and report conflicts between spec and implementation

# Definition of Done
- Verification checklist
```

### 9.4. Quy trình thực thi một module bằng AI

Ví dụ yêu cầu:

> Triển khai module Organization theo spec đã duyệt.

AI thực hiện:

1. Đọc `CLAUDE.md` và spec Organization.
2. Đọc component/page pattern và module backend gần nhất.
3. Báo các điểm mơ hồ hoặc conflict có ảnh hưởng lớn.
4. Lập mapping từ acceptance criteria sang code và test.
5. Tạo Prisma model/migration nếu cần.
6. Tạo controller, service, repository, DTO và permission.
7. Tạo list/detail/create/edit UI từ component dùng chung.
8. Tạo OpenAPI update, SDK và tests.
9. Chạy lint, typecheck, test và build.
10. Báo file thay đổi, quyết định, giới hạn và kết quả xác minh.

### 9.5. Guardrail chống over-engineering

- Chỉ thêm abstraction khi có ít nhất một use case rõ ràng hoặc pattern đã lặp lại.
- Không tạo interface cho mọi class theo thói quen.
- Không chia module thành nhiều layer nếu controller/service/repository đã đủ.
- Không tạo component wrapper chỉ để đổi tên.
- Không thêm dependency khi platform hiện tại đã giải quyết được.
- Không thay đổi spec để hợp với code; phải báo conflict.
- Mọi code sinh ra phải dễ xóa, dễ đọc và có owner rõ ràng.

---

## 10. Vòng đời tạo dự án mới

### 10.1. Khởi tạo bằng CLI

Mục tiêu trải nghiệm:

```bash
rytek create trustpage
```

CLI thu thập cấu hình:

```text
Project Name: TrustPage
Frontend: Next.js
Backend: NestJS
Database: PostgreSQL
ORM: Prisma
Authentication: JWT + Refresh Token
Queue: BullMQ
Cache: Redis
Deploy: Docker
UI: Rytek Dashboard
Theme: Blue
Multi-tenant: No
Audit: Yes
Public API: No
```

CLI thực hiện:

1. Kiểm tra môi trường.
2. Lấy phiên bản starter tương thích.
3. Tạo workspace và application names.
4. Sinh `.env.example`, không sinh secret production.
5. Áp dụng theme và branding.
6. Khởi tạo database schema/migration.
7. Cài dependency và sinh lockfile.
8. Chạy smoke test.
9. Tạo baseline spec và onboarding guide.
10. In các bước tiếp theo.

### 10.2. Cấu trúc dự án đầu ra

```text
trustpage/
├── apps/
│   ├── admin-web/
│   │   ├── app/
│   │   ├── features/
│   │   ├── components/
│   │   └── lib/
│   ├── api/
│   │   └── src/
│   │       ├── common/
│   │       ├── modules/
│   │       └── infrastructure/
│   └── worker/
│       └── src/
├── packages/
│   ├── ui/
│   ├── sdk/
│   ├── shared/
│   ├── config/
│   └── testing/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── spec/
│   ├── entities/
│   ├── features/
│   ├── workflows/
│   ├── permissions/
│   ├── ui/
│   └── acceptance/
├── docs/
│   ├── architecture.md
│   ├── api-conventions.md
│   ├── design-system.md
│   └── operations.md
├── docker/
├── scripts/
├── .env.example
├── CLAUDE.md
├── package.json
└── pnpm-workspace.yaml
```

### 10.3. Từ project rỗng đến feature đầu tiên

```text
rytek create
  ↓
Configure project
  ↓
Run baseline locally
  ↓
Write product/domain specs
  ↓
Review and approve specs
  ↓
Ask AI to implement one vertical slice
  ↓
Verify DB → API → UI → Audit/Test
  ↓
Deploy staging
  ↓
Expand module by module
```

Nên chọn một vertical slice đại diện cho module đầu tiên, ví dụ Organization List → Create → Detail → Update Status. Không sinh toàn bộ hệ thống trong một prompt lớn.

### 10.4. Tầm nhìn AI Project Generator

Ở giai đoạn trưởng thành, người dùng có thể mô tả:

```text
Tạo SaaS quản lý khách sạn gồm Hotel, Room, Booking,
Customer và Invoice.
```

AI Architect hỏi các câu có ảnh hưởng đến kiến trúc:

- Có multi-tenant không?
- Có public API không?
- Có mobile app không?
- Có audit bắt buộc không?
- Tác vụ nào chạy nền?
- Payment provider và yêu cầu idempotency là gì?
- Inventory/booking xử lý cạnh tranh thế nào?

AI sinh `spec/` để con người review. Chỉ sau khi approve, Rytek mới tạo project và AI coding agent mới triển khai.

---

## 11. Chiến lược kiểm thử và chất lượng

### 11.1. Test pyramid thực dụng

- **Unit test**: domain rule, validation, permission resolver, helper.
- **Integration test**: repository, transaction, Redis, queue producer/consumer.
- **API test**: authentication, authorization, validation, error contract.
- **E2E test**: các critical user journey.
- **Concurrency test**: booking, payment, state transition hoặc invariant nhạy cảm.
- **Visual/accessibility test**: component và page pattern quan trọng.

### 11.2. Quality gates trong CI

Mỗi pull request phải chạy tối thiểu:

```text
Install with locked dependencies
  ↓
Lint
  ↓
Typecheck
  ↓
Unit & Integration Tests
  ↓
OpenAPI Compatibility Check
  ↓
Build
  ↓
Migration / Smoke Test
```

Release package dùng chung cần thêm:

- Changeset/changelog.
- API compatibility review.
- Storybook hoặc component verification.
- Upgrade/migration instruction khi có breaking change.

---

## 12. Versioning và quản trị thay đổi

- Các package dùng Semantic Versioning.
- Starter có release tag và compatibility matrix.
- Project mới pin vào phiên bản starter/package đã xác định.
- Breaking change phải có migration guide.
- Quyết định kiến trúc quan trọng được lưu thành ADR.
- Spec thay đổi sau approve phải có version hoặc changelog.
- Không sửa migration đã chạy ở production; tạo migration mới.

Ví dụ compatibility matrix:

| CMS Starter | UI | Dashboard Layout | Backend Starter | Node |
|---|---|---|---|---|
| 0.3.x | 0.2.x | 0.2.x | 0.3.x | LTS |
| 1.0.x | 1.x | 1.x | 1.x | LTS |

---

## 13. Roadmap v0.1–v1.0

### v0.1 — Foundations

Mục tiêu: chốt convention và chạy được skeleton end-to-end.

- [ ] Tạo năm repository và ownership.
- [ ] Chốt monorepo structure, lint, format, TypeScript config.
- [ ] Viết design foundation: color, typography, spacing, radius, accessibility.
- [ ] Tạo Next.js application shell ban đầu.
- [ ] Tạo NestJS API, Prisma và PostgreSQL baseline.
- [ ] Docker Compose cho PostgreSQL và Redis.
- [ ] Health endpoint, structured log và request ID.
- [ ] `CLAUDE.md` mẫu và cấu trúc `spec/` mẫu.
- [ ] CI lint, typecheck, test và build.

**Exit criteria:** clone repository, cấu hình env và chạy được web/API/database bằng một quy trình được tài liệu hóa.

### v0.2 — UI & Dashboard Core

Mục tiêu: có ngôn ngữ thiết kế và component đủ để dựng CRUD chuẩn.

- [ ] Semantic design tokens và light/dark theme.
- [ ] Core form/input/dialog/feedback components.
- [ ] ApplicationShell, Sidebar, Topbar và Breadcrumb.
- [ ] PageHeader, FilterBar, ConfirmDialog.
- [ ] DataTable trên TanStack Table.
- [ ] List/detail/create/edit/settings patterns.
- [ ] Storybook/demo và accessibility baseline.
- [ ] Quy tắc AI sinh UI.

**Exit criteria:** dựng module demo chỉ bằng component và pattern dùng chung, không hard-code design language mới.

### v0.3 — Backend Starter

Mục tiêu: backend có đủ capability cho CMS/SaaS phổ biến.

- [ ] JWT, refresh token rotation và revoke.
- [ ] User, role, permission và backend guards.
- [ ] Validation, error contract, filter và interceptor.
- [ ] Prisma repository convention và migrations.
- [ ] Swagger/OpenAPI và typed SDK workflow.
- [ ] Redis cache và rate limiting.
- [ ] BullMQ producer, worker, retry và job observability.
- [ ] Audit log.
- [ ] Idempotency middleware/service.

**Exit criteria:** module demo có API, permission, cache/queue tùy chọn, docs và integration test.

### v0.4 — Integrated CMS Starter

Mục tiêu: ghép frontend và backend thành một starter dùng được thực tế.

- [ ] Admin web, API và worker trong workspace.
- [ ] Login, logout, refresh và session UX.
- [ ] Permission-aware navigation và action.
- [ ] Module mẫu end-to-end.
- [ ] Theme/branding configuration.
- [ ] Seed, sample data và local onboarding.
- [ ] Docker packaging và staging deployment guide.
- [ ] Smoke/e2e tests cho critical path.

**Exit criteria:** có thể tạo một CMS mới bằng cách fork/copy starter và đổi cấu hình mà không sửa nền tảng cốt lõi.

### v0.5 — Spec-Driven Workflow

Mục tiêu: biến spec thành đầu vào chuẩn cho con người và AI.

- [ ] Schema/template cho entity, feature, workflow và permission.
- [ ] Definition of Ready/Done tự động kiểm tra một phần.
- [ ] Prompt library cho CRUD, queue flow, payment flow và integration.
- [ ] `CLAUDE.md` chuẩn cho từng repository.
- [ ] Mapping acceptance criteria → tests.
- [ ] AI workflow có plan, review checkpoint và verification report.
- [ ] Ponytail guardrails chống over-engineering.

**Exit criteria:** AI triển khai module mẫu từ spec với output nhất quán qua nhiều lần chạy.

### v0.6 — Rytek CLI

Mục tiêu: tự động hóa việc tạo và kiểm tra dự án.

- [ ] `rytek create <project>`.
- [ ] Interactive/non-interactive config.
- [ ] Version compatibility validation.
- [ ] Theme, app name, database và capability selection.
- [ ] Environment template và secret guidance.
- [ ] Baseline spec generation.
- [ ] Smoke test sau khi tạo.
- [ ] `rytek doctor` kiểm tra môi trường.

**Exit criteria:** một kỹ sư mới tạo và chạy project mẫu trong thời gian mục tiêu mà không cần thao tác thủ công ngoài hướng dẫn.

### v0.7 — Production Hardening

Mục tiêu: chuẩn hóa bảo mật, reliability và operations.

- [ ] Security headers, CORS, secret handling và dependency scanning.
- [ ] Backup/restore và migration runbook.
- [ ] Metrics, dashboard, alerting và tracing integration.
- [ ] Queue failure/dead-letter/replay workflow.
- [ ] Load test và performance budgets.
- [ ] Concurrency/idempotency reference implementations.
- [ ] Deployment, rollback và incident runbooks.

**Exit criteria:** starter vượt qua production-readiness review theo checklist chung.

### v0.8 — Ecosystem & Reuse

Mục tiêu: tăng tốc độ tái sử dụng giữa các sản phẩm.

- [ ] Module catalog: users, files, notifications, audit, import/export.
- [ ] Package registry và release automation.
- [ ] Upgrade automation/codemods cho thay đổi phổ biến.
- [ ] Compatibility matrix và deprecation policy.
- [ ] Documentation portal và searchable examples.
- [ ] Telemetry nội bộ về thời gian tạo module và lỗi lặp lại.

**Exit criteria:** ít nhất hai sản phẩm thật dùng chung platform và nâng cấp thành công.

### v0.9 — AI Project Generator Beta

Mục tiêu: chuyển mô tả sản phẩm thành spec và project plan có thể review.

- [ ] Guided discovery questions.
- [ ] Product/domain/UI/API/permission spec generation.
- [ ] Architecture option và trade-off report.
- [ ] Human approval gates.
- [ ] Project generation từ spec đã duyệt.
- [ ] Incremental module generation, không dùng one-shot project generation.
- [ ] Traceability từ spec → code → tests.

**Exit criteria:** tạo được beta project từ idea đến staging với các checkpoint có kiểm soát.

### v1.0 — Stable Rytek Platform

Mục tiêu: platform ổn định, có version, tài liệu và quy trình hỗ trợ.

- [ ] Public stable contracts cho design system, UI và starters.
- [ ] Security và architecture review hoàn tất.
- [ ] End-to-end upgrade path được kiểm chứng.
- [ ] SLA/SLO nội bộ cho package và starter release.
- [ ] Golden path cho CMS, CRM và SaaS.
- [ ] Production runbooks và support ownership.
- [ ] Case study từ dự án thực tế.
- [ ] Governance cho contribution, ADR và breaking change.

**Exit criteria:** Rytek là nền tảng mặc định để bắt đầu dự án mới và đã được kiểm chứng trên nhiều production workload.

---

## 14. Checklist bắt đầu dự án mới

### 14.1. Product discovery

- [ ] Xác định vấn đề, người dùng và kết quả mong muốn.
- [ ] Xác định module/entity chính.
- [ ] Viết glossary cho thuật ngữ nghiệp vụ.
- [ ] Xác định in-scope và out-of-scope.
- [ ] Xác định multi-tenant, audit, public API, mobile và integration.
- [ ] Xác định dữ liệu nhạy cảm và yêu cầu tuân thủ.
- [ ] Chọn critical user journey đầu tiên.

### 14.2. Architecture setup

- [ ] Chọn phiên bản Rytek Starter.
- [ ] Chạy `rytek create <project>` hoặc quy trình scaffold tương đương.
- [ ] Chốt tên app, package namespace và repository ownership.
- [ ] Chọn môi trường local/staging/production.
- [ ] Cấu hình PostgreSQL, Redis và object storage nếu cần.
- [ ] Tạo secret bằng secret manager; chỉ commit `.env.example`.
- [ ] Viết ADR cho lựa chọn khác với golden path.

### 14.3. Design setup

- [ ] Chọn logo, favicon, primary/accent color.
- [ ] Kiểm tra light/dark theme.
- [ ] Cấu hình application shell và navigation.
- [ ] Mapping module sang page pattern có sẵn.
- [ ] Không sửa design token hệ thống nếu chỉ cần branding.
- [ ] Kiểm tra responsive và accessibility baseline.

### 14.4. Authentication và authorization

- [ ] Chọn login method và token/session policy.
- [ ] Định nghĩa role mặc định.
- [ ] Lập permission matrix theo resource/action.
- [ ] Xác định permission cho export, approval và destructive action.
- [ ] Seed admin an toàn.
- [ ] Kiểm tra backend guard và frontend visibility.
- [ ] Xác định audit event bắt buộc.

### 14.5. Spec readiness

- [ ] Tạo `spec/product`, `entities`, `features`, `workflows`, `permissions`.
- [ ] Định nghĩa fields, validation, indexes và invariant.
- [ ] Định nghĩa state transition.
- [ ] Định nghĩa API success/error behavior.
- [ ] Định nghĩa UI loading/empty/error/no-result states.
- [ ] Định nghĩa transaction, concurrency và idempotency requirement.
- [ ] Viết acceptance criteria.
- [ ] Review và approve spec trước khi code.

### 14.6. AI readiness

- [ ] `CLAUDE.md` phản ánh đúng project commands và architecture.
- [ ] AI biết đường dẫn spec và design system bắt buộc đọc.
- [ ] Có module tham chiếu chất lượng tốt.
- [ ] Ponytail guardrails được áp dụng.
- [ ] Prompt yêu cầu triển khai một vertical slice có giới hạn.
- [ ] AI không được tự sửa approved spec.
- [ ] Output bắt buộc gồm verification report.

### 14.7. Development và data

- [ ] Local stack khởi động thành công.
- [ ] Migration strategy được xác định.
- [ ] Seed/sample data không chứa dữ liệu thật nhạy cảm.
- [ ] API error contract và request ID hoạt động.
- [ ] Cache key/TTL/invalidation được ghi rõ nếu dùng cache.
- [ ] Queue retry/idempotency/failure policy được ghi rõ nếu dùng worker.
- [ ] Critical transaction và concurrency path có test.

### 14.8. Quality và release

- [ ] Lint, typecheck, tests và build pass.
- [ ] OpenAPI và SDK đồng bộ.
- [ ] E2E critical journey pass.
- [ ] Security review cơ bản hoàn tất.
- [ ] Logs không chứa token/secret/PII ngoài policy.
- [ ] Health check, metrics và alerting được cấu hình.
- [ ] Backup/restore đã được thử ở môi trường phù hợp.
- [ ] Staging smoke test pass.
- [ ] Có rollback hoặc forward-fix plan.
- [ ] Runbook và owner sau release đã rõ.

---

## 15. Checklist tạo một module mới

Ví dụ module `Organization`:

- [ ] Entity spec và migration plan.
- [ ] List/detail/create/edit/delete hoặc status workflow được xác định.
- [ ] Permission `organization.*` đầy đủ.
- [ ] DTO và validation.
- [ ] Controller/service/repository theo convention.
- [ ] Transaction/concurrency/idempotency nếu cần.
- [ ] OpenAPI và typed client.
- [ ] Navigation và route.
- [ ] PageHeader, FilterBar, DataTable từ thư viện chung.
- [ ] Form dùng React Hook Form + Zod.
- [ ] Loading, empty, no-result, error và permission-denied states.
- [ ] Confirm dialog cho delete/status nguy hiểm.
- [ ] Audit event.
- [ ] Unit/integration/API/E2E test theo mức rủi ro.
- [ ] Acceptance criteria đã được xác nhận.

---

## 16. Ví dụ workflow hoàn chỉnh

### Bài toán

Tạo module xác minh khách sạn.

### Spec tóm tắt

```text
Entity: Hotel
Actions: create, read, update, verify, reject, export
Statuses: pending → verified | rejected
Queue: verification enrichment
Audit: created, updated, verification_requested, verified, rejected
Concurrency: chỉ một quyết định cuối cùng được chấp nhận
Idempotency: request verify có thể retry an toàn
```

### Kết quả AI phải tạo

```text
Frontend
├── Hotel List
├── Hotel Detail
├── Hotel Create/Edit Form
├── Verification Action
├── Search / Filter / Export
└── Loading / Empty / Error / Permission states

Backend
├── Controller
├── Service
├── Repository
├── DTO / Validation
├── Permissions / Guards
├── Transaction / Concurrency control
├── Audit events
├── OpenAPI
└── Tests

Worker
├── Verification queue
├── Versioned payload
├── Retry / Backoff
├── Idempotency
└── Failure handling
```

### Prompt triển khai mẫu

```text
Đọc CLAUDE.md, toàn bộ spec liên quan đến Hotel, Rytek Design System
và module tham chiếu gần nhất.

Triển khai vertical slice Hotel Verification theo approved spec.

Bắt buộc:
- Dùng ApplicationShell, PageHeader, FilterBar và DataTable hiện có.
- Không hard-code design token và không tạo component trùng lặp.
- Enforce permission ở backend; frontend chỉ phản ánh quyền.
- Xử lý transaction, concurrency và idempotency như spec.
- Queue có retry, backoff, timeout và failure handling.
- Cập nhật migration, OpenAPI, SDK và tests.
- Chạy lint, typecheck, tests và build.
- Báo conflict với spec; không tự thay đổi spec.
- Kết thúc bằng verification report và các rủi ro còn lại.
```

---

## 17. Chỉ số theo dõi hiệu quả platform

Theo dõi theo quý hoặc theo release:

- Thời gian từ `rytek create` đến local app chạy được.
- Thời gian từ approved spec đến staging.
- Tỷ lệ code/component được tái sử dụng.
- Số component hoặc abstraction trùng lặp bị tạo mới.
- Tỷ lệ module pass quality gates lần đầu.
- Số lỗi production do permission, transaction, concurrency hoặc idempotency.
- Thời gian nâng cấp starter/package giữa các version.
- Tỷ lệ project còn bám golden path.
- Mức độ bao phủ critical journey và acceptance criteria.

Các con số 70–80% tiết kiệm thời gian chỉ nên được coi là giả thuyết ban đầu; cần đo bằng dữ liệu thực tế từ nhiều dự án.

---

## 18. Các quyết định nền tảng đã chốt

| Chủ đề | Quyết định mặc định |
|---|---|
| Kiến trúc backend | NestJS modular monolith |
| API | REST + OpenAPI |
| Data | Prisma + PostgreSQL |
| Cache/queue | Redis + BullMQ |
| Frontend | Next.js + TypeScript |
| UI | Tailwind + shadcn/ui + Radix UI |
| Table | TanStack Table |
| Development | Spec-Driven, AI-assisted |
| AI context | `CLAUDE.md` + Ponytail + `spec/` |
| Default approach | Starter + Spec trước, CLI sau, AI Generator cuối |
| Complexity policy | Không microservice/CQRS/Event Sourcing nếu chưa có nhu cầu thực |

---

## 19. Kết luận

Công thức cốt lõi của Rytek Platform:

```text
Design System
  +
Reusable UI & Dashboard Patterns
  +
Production-ready Backend Capabilities
  +
Reviewed Specifications
  +
Constrained AI Workflow
  =
Fast, Consistent and Maintainable Products
```

Thứ tự đầu tư đúng là:

1. Xây nền tảng và convention.
2. Hoàn thiện UI/backend starter.
3. Chứng minh trên module và sản phẩm thật.
4. Chuẩn hóa Spec-Driven workflow.
5. Tự động hóa bằng CLI.
6. Thêm AI Project Generator như một lớp phía trên.

Rytek thành công khi việc bắt đầu dự án mới không còn là lặp lại hạ tầng, mà là biến yêu cầu nghiệp vụ đã được hiểu rõ thành phần mềm nhất quán, an toàn và có thể vận hành.

