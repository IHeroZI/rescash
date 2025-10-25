# 🔧 แก้ปัญหา "ไม่พบข้อมูลผู้ใช้"

## ปัญหา: หน้าแสดง "ไม่พบข้อมูลผู้ใช้"

### ขั้นตอนการแก้ไข:

## 1. ตรวจสอบ Environment Variables

สร้างไฟล์ `.env.local` ใน root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**หา values เหล่านี้ได้จาก:**
- Supabase Dashboard > Settings > API
- Copy `Project URL` และ `anon public` key

**หลังจากสร้างไฟล์แล้ว ต้อง restart dev server:**
```bash
# กด Ctrl+C ใน terminal แล้วรันใหม่
npm run dev
```

## 2. ตรวจสอบ Users Table

เมื่อสมัครสมาชิกใหม่ ระบบจะ:
1. สร้าง Auth User ใน Supabase Auth
2. **ต้องสร้างข้อมูลใน Users table ด้วย**

### ตรวจสอบว่ามีข้อมูลใน Users table หรือไม่:

ไปที่ Supabase Dashboard > Table Editor > Users

ถ้ายังไม่มีข้อมูล ให้ insert ด้วยตนเอง:

```sql
INSERT INTO "Users" (email, name, phone, role)
VALUES ('your@email.com', 'Your Name', '0812345678', 'customer');
```

## 3. ตรวจสอบว่า Auth User และ Users table match กัน

Email ใน Auth ต้องตรงกับ email ใน Users table

**ตรวจสอบใน Supabase:**
1. Authentication > Users > ดู email ที่ login
2. Table Editor > Users > ต้องมี record ที่ email ตรงกัน

## 4. ตรวจสอบ RLS Policies

ตรวจสอบว่า Users table มี RLS policies ที่อนุญาตให้อ่านข้อมูลได้:

```sql
-- อนุญาตให้ authenticated users อ่านข้อมูลตัวเองได้
CREATE POLICY "Users can read own data"
ON "Users"
FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');
```

หรือถ้าต้องการให้ทุกคนอ่านได้ (ไม่แนะนำใน production):

```sql
CREATE POLICY "Enable read access for all users"
ON "Users"
FOR SELECT
TO public
USING (true);
```

## 5. ตรวจสอบ Console Errors

เปิด Browser DevTools (F12) > Console และดู errors:

- ถ้าเห็น "Missing Supabase environment variables" → กลับไปทำข้อ 1
- ถ้าเห็น "Database error" → ตรวจสอบ RLS policies (ข้อ 4)
- ถ้าเห็น "PGRST116" → ไม่มีข้อมูลใน table (ข้อ 2)

## 6. แก้ปัญหา Sign Up ไม่สร้างข้อมูลใน Users table

ตรวจสอบไฟล์ `app/auth/actions.ts`:

```typescript
export async function signUp(formData: FormData) {
  // ... code ...
  
  if (authData.user) {
    // ❗ ส่วนนี้ต้องทำงาน
    const { error: dbError } = await supabase.from("Users").insert({
      email,
      name: `${firstName} ${lastName}`,
      phone,
      role: "customer",
      password: null,
    });

    if (dbError) {
      console.log("Error inserting user data:", dbError);
      return { error: "Failed to create user profile" };
    }
  }
}
```

## 7. Test การเชื่อมต่อ Supabase

สร้างไฟล์ test:

```typescript
// app/test-supabase/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function test() {
      const supabase = createClient();
      const { data, error } = await supabase.from("Users").select("*");
      setResult({ data, error });
    }
    test();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
```

เข้า `http://localhost:3000/test-supabase` แล้วดูผลลัพธ์

## 8. Quick Fix - สร้างข้อมูล User ด้วยตนเอง

ถ้าเร่งด่วน สามารถไปที่ Supabase Dashboard และ insert ข้อมูลด้วยตนเอง:

1. Table Editor > Users > Insert row
2. กรอกข้อมูล:
   - email: email ที่ใช้ sign up
   - name: ชื่อของคุณ
   - phone: เบอร์โทร
   - role: customer (หรือ staff/admin)
3. Save

จากนั้น refresh หน้าเว็บ

## สรุป Checklist:

- [ ] สร้างไฟล์ `.env.local` และใส่ Supabase credentials
- [ ] Restart dev server
- [ ] ตรวจสอบว่ามีข้อมูลใน Users table
- [ ] ตรวจสอบ RLS policies
- [ ] เช็ค Console errors
- [ ] Test การเชื่อมต่อ

ถ้ายังแก้ไม่ได้ ให้ส่ง error message จาก Console มา
