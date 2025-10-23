"use client";

import Link from "next/link";
import { User, Mail, Phone } from "lucide-react";
import Header from "@/components/common/Header";
import TextField from "@/components/common/TextField";
import PasswordTextField from "@/components/common/PasswordTextField";

export default function RegisterPage() {
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
        <div className="w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-2">สร้างบัญชี</h2>
            <p className="text-sm text-gray-500 text-center">สร้างบัญชีผู้ใช้ของคุณ</p>
          </div>
          
          <div className="space-y-5">
            <TextField
              type="email"
              placeholder="อีเมล"
              icon={<Mail size={20} />}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                type="text"
                placeholder="ชื่อจริง"
                icon={<User size={20} />}
              />
              <TextField
                type="text"
                placeholder="นามสกุล"
                icon={<User size={20} />}
              />
            </div>
            <TextField
              type="tel"
              placeholder="เบอร์โทร"
              icon={<Phone size={20} />}
            />
            <PasswordTextField
              placeholder="รหัสผ่าน"
            />
            <PasswordTextField
              placeholder="ยืนยันรหัสผ่าน"
            />
          </div>
        </div>
        
        {/* Buttons and links (bottom part) */}
        <div className="w-full mt-8">
          <button
            type="submit"
            className="w-full rounded-3xl bg-black py-3 text-white font-medium transition-colors duration-200 hover:bg-gray-800"
          >
            สร้างบัญชี
          </button>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/auth/login" className="font-medium text-black hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}