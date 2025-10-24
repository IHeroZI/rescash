"use client";

import Link from "next/link";
import { User, Mail, Phone } from "lucide-react";
import { useState } from "react";
import Header from "@/components/common/Header";
import TextField from "@/components/common/TextField";
import PasswordTextField from "@/components/common/PasswordTextField";
import { signUp } from "../actions";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const phone = formData.get("phone") as string;

    // Validate phone number: must be 10 digits and all numeric
    if (!/^\d{10}$/.test(phone)) {
      setError("กรุณากรอกเบอร์โทรให้ถูกต้อง (10 หลักและเป็นตัวเลขเท่านั้น)");
      return;
    }

    setLoading(true);
    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      
      <Header 
        title="สร้างบัญชี" 
        backHref="/auth/login" 
        showNotificationIcon={false} 
      />
      
      {/* Main content container with flex-col and justify-between */}
      <div className="relative flex flex-1 flex-col justify-between p-6 pt-8">
        
        {/* Form content (top part) */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">สร้างบัญชี</h2>
            <p className="text-sm text-gray-500 text-center">สร้างบัญชีผู้ใช้ของคุณ</p>
          </div>
          
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            <TextField
              type="email"
              name="email"
              placeholder="อีเมล"
              icon={<Mail size={20} />}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                type="text"
                name="firstName"
                placeholder="ชื่อจริง"
                icon={<User size={20} />}
                required
              />
              <TextField
                type="text"
                name="lastName"
                placeholder="นามสกุล"
                icon={<User size={20} />}
                required
              />
            </div>
            <TextField
              type="tel"
              name="phone"
              placeholder="เบอร์โทร"
              icon={<Phone size={20} />}
              required
            />
            <PasswordTextField
              name="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <PasswordTextField
              name="confirmPassword"
              placeholder="ยืนยันรหัสผ่าน"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        
          {/* Buttons and links (bottom part) */}
          <div className="w-full mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-black py-3 text-white font-medium transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
            </button>
            
            <div className="mt-6 text-center text-sm text-gray-600">
              มีบัญชีอยู่แล้ว?{" "}
              <Link href="/auth/login" className="font-medium text-black hover:underline">
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </form>
        
      </div>
    </div>
  );
}