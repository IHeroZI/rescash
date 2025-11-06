# RESCASH - Restaurant Cashier System

ระบบจัดการร้านอาหารที่รองรับ 3 บทบาท: Customer, Staff, และ Admin

## ✨ Features ที่สร้างเสร็จแล้ว

### 🔐 Authentication System
- ✅ Login/Register ด้วย Supabase Auth
- ✅ Role-based Middleware (customer, staff, admin)
- ✅ Email validation (สามารถปิด email confirmation ได้)
- ✅ Phone validation (10 หลัก, ตัวเลขเท่านั้น)

### 👤 User Profile Management
- ✅ แสดงโปรไฟล์ผู้ใช้ (รูป, ชื่อ, email, เบอร์โทร, role)
- ✅ แก้ไขโปรไฟล์
- ✅ อัพโหลดรูปโปรไฟล์ไปยัง Supabase Storage
- ✅ เปลี่ยนรหัสผ่าน

### 🍽️ Menu System

#### Customer
- ✅ ดูรายการเมนูที่พร้อมจำหน่าย
- ✅ ค้นหาเมนู
- ✅ ดูรายละเอียดเมนู
- ✅ เพิ่ม/ลด จำนวนสินค้า
- ✅ เพิ่มลงตะกร้า (Zustand state management)
- ✅ แสดงจำนวนสินค้าในตะกร้า
- ✅ จัดการตะกร้าสินค้า
- ✅ สั่งอาหาร (create order)

#### Staff
- ✅ ดูรายการเมนูทั้งหมด
- ✅ ดูสูตรอาหาร (recipe)
- ✅ ดูส่วนผสม

#### Admin
- ✅ ดูรายการเมนูทั้งหมด
- ✅ แสดงจำนวนเมนู
- ✅ ปุ่มเพิ่มเมนู (route to add page)
- ✅ ปุ่มแก้ไขเมนู (route to edit page)
- ✅ ปุ่มระงับ/เปิดใช้งานเมนู

### 📦 Order System
- ✅ แสดงรายการคำสั่งซื้อ
- ✅ Customer เห็นเฉพาะ order ของตัวเอง
- ✅ Staff/Admin เห็น order ทั้งหมด
- ✅ สร้าง order พร้อม MenuOrder

### 🧭 Navigation
- ✅ NavBar ที่เปลี่ยนสีเมื่อ active
- ✅ แสดง NavBar เฉพาะในหน้า protected
- ✅ Role-based menu (แสดงเมนูต่างกันตาม role)

### 🎨 UI/UX
- ✅ Toast notifications (react-hot-toast)
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Thai language support (Noto Sans Thai font)

## 📁 โครงสร้างโปรเจค

```
app/
├── (protected)/          # Protected routes
│   ├── menu/
│   │   ├── [id]/        # Menu detail page
│   │   └── recipe/[id]/ # Recipe page (staff)
│   ├── cart/            # Cart page
│   ├── order/           # Orders page
│   ├── profile/
│   │   ├── edit/        # Edit profile
│   │   └── change-password/
│   └── more/            # Settings page
├── auth/                # Auth pages
│   ├── login/
│   ├── sign-up/
│   └── actions.ts       # Auth server actions
└── layout.tsx

components/
├── common/
│   ├── Header.tsx
│   ├── NavBar.tsx
│   ├── ProfileCard.tsx
│   ├── TextField.tsx
│   └── PasswordTextField.tsx
├── menu/
│   └── MenuCard.tsx
└── more/
    └── MenuList.tsx

lib/
├── hooks/
│   ├── useUser.ts       # User data hook
│   └── useMenu.ts       # Menu data hook
├── store/
│   └── cartStore.ts     # Zustand cart store
└── supabase/
    ├── client.ts
    ├── server.ts
    └── middleware.ts    # Role-based middleware
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(20),
    password VARCHAR(255),
    profile_image_url VARCHAR(255),
    create_datetime TIMESTAMP DEFAULT now(),
    update_datetime TIMESTAMP DEFAULT now()
);
```

### Menu Table
```sql
CREATE TABLE IF NOT EXISTS Menu (
    menu_id SERIAL PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    recipe TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    menu_image_url VARCHAR(255),
    create_datetime TIMESTAMP DEFAULT now(),
    update_datetime TIMESTAMP DEFAULT now()
);
```

### Order Table
```sql
CREATE TABLE IF NOT EXISTS "Order" (
    order_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id),
    total_amount DECIMAL(10,2),
    order_status VARCHAR(50),
    create_datetime TIMESTAMP DEFAULT now(),
    update_datetime TIMESTAMP DEFAULT now(),
    notes TEXT,
    appointment_time TIMESTAMP,
    public_order_id VARCHAR(50),
    qr_url VARCHAR(255),
    slip_url VARCHAR(255)
);
```

### MenuOrder Table
```sql
CREATE TABLE IF NOT EXISTS MenuOrder (
    menu_id INT REFERENCES Menu(menu_id),
    order_id INT REFERENCES "Order"(order_id),
    quantity INT NOT NULL,
    price_at_order_time DECIMAL(10,2),
    PRIMARY KEY(menu_id, order_id)
);
```

## 🚀 การติดตั้ง

1. Clone repository
```bash
git clone <repository-url>
cd rescash
```

2. ติดตั้ง dependencies
```bash
npm install
```

3. ตั้งค่า environment variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_anon_key
```

4. สร้าง Storage Bucket
- ดูคำแนะนำใน `STORAGE_SETUP.md`

5. รัน development server
```bash
npm run dev
```

## 📝 TODO (สิ่งที่ยังต้องทำต่อ)

### Admin Features
- [ ] หน้าเพิ่มเมนูใหม่
- [ ] หน้าแก้ไขเมนู
- [ ] อัพโหลดรูปเมนู
- [ ] จัดการส่วนผสม (Ingredient)
- [ ] Dashboard
- [ ] จัดการพนักงาน
- [ ] จัดการสมาชิก

### Staff Features
- [ ] อัพเดทสถานะออเดอร์
- [ ] จัดการวัตถุดิบ

### General
- [ ] Payment integration (QR code, slip upload)
- [ ] Notification system
- [ ] Order history
- [ ] Print receipt

## 🔧 Technologies Used

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React Icons
- **Notifications**: React Hot Toast
- **Language**: TypeScript
- **Font**: Noto Sans Thai

## 📱 Roles & Permissions

### Customer
- ดูเมนู (เฉพาะที่พร้อมจำหน่าย)
- สั่งอาหาร
- ดูประวัติคำสั่งซื้อของตนเอง
- จัดการโปรไฟล์

### Staff
- ดูเมนูทั้งหมด
- ดูสูตรอาหาร
- ดูคำสั่งซื้อทั้งหมด
- จัดการโปรไฟล์

### Admin
- ทำได้ทุกอย่างที่ Staff ทำได้
- จัดการเมนู (เพิ่ม, แก้ไข, ระงับ)
- จัดการพนักงาน
- ดู Dashboard

## 👨‍💻 Developer Notes

- ใช้ `"use client"` สำหรับ components ที่ต้องใช้ hooks หรือ state
- ใช้ Server Components สำหรับหน้าที่ต้องการ SEO
- Middleware ตรวจสอบ role และ redirect อัตโนมัติ
- Cart data เก็บใน localStorage ผ่าน Zustand persist
- รูปภาพใช้ Next.js Image component เพื่อ optimization

## 🐛 Known Issues

- ยังไม่มี real-time updates สำหรับ orders
- ยังไม่มี pagination สำหรับ menu list
- ยังไม่มี image optimization สำหรับ uploaded images

## 📄 License

MIT
