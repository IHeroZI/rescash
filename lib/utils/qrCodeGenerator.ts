/**
 * Generate PromptPay QR Code
 * 
 * @description
 * ใช้ library promptpay-qr ที่รองรับมาตรฐาน PromptPay อย่างถูกต้อง
 * - สร้าง QR ตามมาตรฐาน EMVCo สำหรับ PromptPay
 * - รองรับทั้งเบอร์โทรศัพท์และเลขประจำตัวผู้เสียภาษี
 * - คำนวณ CRC16-CCITT ตามมาตรฐาน
 * 
 * @library promptpay-qr - Generate PromptPay payload
 * @library qrcode - Generate QR code image
 * 
 * @param amount - ยอดเงินที่ต้องการชำระ (THB)
 * @param mobileNumber - เบอร์โทรศัพท์ PromptPay (รูปแบบ 0812345678 หรือ 66812345678)
 * @returns Data URL ของ QR code image
 */
export async function generatePromptPayQR(amount: number, mobileNumber: string): Promise<string> {
  const generatePayload = (await import("promptpay-qr")).default;
  const QRCode = (await import("qrcode")).default;
  
  // Generate PromptPay payload ตามมาตรฐาน EMVCo
  // promptpay-qr จะจัดการ format เบอร์โทร, amount, และ CRC16 ให้อัตโนมัติ
  const payload = generatePayload(mobileNumber, { amount });
  
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: 400,
    margin: 1,
  });
  
  return qrDataUrl;
}
