# Cron Job Setup - Order Payment Timeout

## ✅ Environment Variables (เสร็จแล้ว)

เพิ่มใน `.env.local` แล้ว:

```bash
CRON_SECRET=1234
```

**สำหรับ Production (Vercel):**
1. ไป Vercel Dashboard
2. เลือก Project → Settings → Environment Variables
3. เพิ่ม:
   - Key: `CRON_SECRET`
   - Value: `1234`
   - Environment: Production, Preview, Development (เลือกทั้งหมด)
4. Save

## ✅ Vercel Cron Configuration (เสร็จแล้ว)

ไฟล์ `vercel.json` ได้ถูกสร้างแล้ว:

```json
{
  "crons": [
    {
      "path": "/api/cron/payment-timeout",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule**: `0 * * * *` = ทุกชั่วโมงตรง (00 นาที)

## 🚀 การทำงาน

1. Vercel จะเรียก `/api/cron/payment-timeout` ทุกชั่วโมง
2. API จะตรวจสอบ Authorization Header: `Bearer 1234`
3. ถ้าถูกต้อง จะเรียก `checkPaymentTimeouts()` 
4. ระบบจะยกเลิก order ที่ไม่ชำระภายใน 12 ชม.ก่อนเวลารับอาหาร

## 🧪 ทดสอบ Manual

**Local (Development):**
```bash
curl -X GET http://localhost:3000/api/cron/payment-timeout -H "Authorization: Bearer 1234"
```

**Production (Vercel):**
```bash
curl -X GET https://your-domain.vercel.app/api/cron/payment-timeout -H "Authorization: Bearer 1234"
```

## 📊 Response Format

Success:
```json
{
  "success": true,
  "cancelled": 2
}
```

Error (Unauthorized):
```json
{
  "error": "Unauthorized"
}
```

## 📝 สรุป

- ✅ Environment variable `CRON_SECRET=1234` ถูกเพิ่มใน `.env.local`
- ✅ Vercel cron config ถูกสร้างใน `vercel.json`
- ✅ Cron จะทำงานอัตโนมัติหลัง deploy ไป Vercel
- ⚠️ ใน development ต้อง run manual หรือใช้ tools อย่าง `node-cron`

## 🔐 Security Note

Secret key `1234` เป็นค่าง่ายๆ สำหรับ development/testing  
**แนะนำ:** ใน Production ควรใช้ key ที่ซับซ้อนกว่า เช่น random string 32 characters
