# Thailand Timezone Fix Summary

## ปัญหา
เวลาในระบบไม่ตรงตามเวลาประเทศไทย โดยเฉพาะเวลาตอนสร้าง order ที่ไม่ตรงตามความเป็นจริง

## การแก้ไข

### 1. สร้าง Utility Functions สำหรับจัดการเวลาไทย
**ไฟล์ใหม่:** `lib/utils/dateUtils.ts`

สร้างฟังก์ชันช่วยเหลือสำหรับการจัดการเวลาในไทมโซนประเทศไทย (UTC+7):

- `getThailandDate()` - ดึงเวลาปัจจุบันในไทมโซนไทย
- `getThailandDateISO()` - ดึงเวลาปัจจุบันในรูปแบบ ISO string พร้อม timezone offset
- `toThailandISO(date)` - แปลง Date object เป็น ISO string ในไทมโซนไทย
- `getThailandStartOfDay()` - ดึงเวลาเริ่มต้นวัน (00:00:00)
- `getThailandEndOfDay()` - ดึงเวลาสิ้นสุดวัน (23:59:59.999)
- `parseThailandDate(dateString)` - แปลง string เป็น Date object ในไทมโซนไทย
- `formatThailandDate(date, options)` - จัดรูปแบบวันที่ในรูปแบบไทย

### 2. อัปเดตการสร้าง Order
**ไฟล์:** `lib/utils/createOrder.ts`

เปลี่ยนจาก:
```typescript
create_datetime: new Date().toISOString(),
update_datetime: new Date().toISOString(),
```

เป็น:
```typescript
const thailandNow = getThailandDateISO();
create_datetime: thailandNow,
update_datetime: thailandNow,
```

### 3. อัปเดตการสร้าง Order ID
**ไฟล์:** `lib/utils/orderUtils.ts`

เปลี่ยนจากการใช้ `new Date()` เป็นการใช้ฟังก์ชันที่จัดการไทมโซนไทยอย่างถูกต้อง:
- ใช้ `getThailandDate()` สำหรับดึงวันที่ปัจจุบัน
- ใช้ `getThailandStartOfDay()` และ `getThailandEndOfDay()` สำหรับกรองข้อมูลรายวัน
- ใช้ `toThailandISO()` สำหรับแปลงเป็น ISO string

### 4. อัปเดต Payment Timeout Cron Job
**ไฟล์:** `lib/cron/checkPaymentTimeouts.ts`

เปลี่ยนการใช้งาน:
- ใช้ `getThailandDate()` แทน `new Date()` สำหรับเช็ควันเวลาปัจจุบัน
- ใช้ `getThailandDateISO()` สำหรับ update_datetime
- ใช้ `parseThailandDate()` สำหรับแปลง appointment_time จากฐานข้อมูล

### 5. อัปเดต Validation Schemas
**ไฟล์:** `lib/validation/validationSchemas.ts`

เปลี่ยนการใช้ `new Date()` เป็น `parseThailandDate()` ใน:
- การตรวจสอบ `appointment_time` ใน Order validation
- การตรวจสอบ `purchase_datetime` ใน Purchase validation

### 6. อัปเดต Notification Utils
**ไฟล์:** `lib/utils/notificationUtils.ts`

เปลี่ยนการแสดงเวลานัดหมายให้ใช้:
- `parseThailandDate()` สำหรับแปลงวันที่
- `formatThailandDate()` สำหรับจัดรูปแบบการแสดงผล

### 7. อัปเดต Purchase Form Modal
**ไฟล์:** `components/purchase/PurchaseFormModal.tsx`

เปลี่ยนค่าเริ่มต้นของ purchase date จาก:
```typescript
new Date().toISOString()
```

เป็น:
```typescript
getThailandDateISO()
```

## ผลลัพธ์

✅ เวลาในการสร้าง Order จะตรงกับเวลาประเทศไทย (UTC+7)
✅ Order ID จะถูกสร้างตามวันที่ในไทมโซนไทย
✅ การเช็ค Payment Timeout จะใช้เวลาไทยในการคำนวณ
✅ การแสดงผลเวลาจะอยู่ในรูปแบบไทย
✅ การตรวจสอบวันที่จะใช้ไทมโซนไทยในการเปรียบเทียบ

## หมายเหตุ

- การแสดงผลวันที่ในส่วน UI ที่ใช้ `toLocaleDateString("th-TH")` จะทำงานได้ถูกต้องอยู่แล้ว เพราะจะแปลงเป็นเวลาท้องถิ่นโดยอัตโนมัติ
- Database columns ที่ใช้ `NOW()` ใน SQL จะต้องตรวจสอบการตั้งค่า timezone ของ PostgreSQL/Supabase ด้วย
- ระบบจะใช้เวลาไทย (Asia/Bangkok timezone) สำหรับการบันทึกและประมวลผลทุกอย่าง

## การทดสอบที่แนะนำ

1. สร้าง Order ใหม่และตรวจสอบ `create_datetime` ในฐานข้อมูล
2. ตรวจสอบว่า Order ID ถูกสร้างตามวันที่ไทยหรือไม่
3. ทดสอบการทำงานของ Payment Timeout Cron Job
4. ตรวจสอบการแสดงเวลาในหน้า Order และ Purchase

