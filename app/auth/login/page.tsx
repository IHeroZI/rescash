"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import TextField from "@/components/common/TextField";
import PasswordTextField from "@/components/common/PasswordTextField";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <div className="absolute inset-x-0 top-0 h-2/3 bg-cover bg-center" style={{ backgroundImage: "url('/images/bg-rescash.png')" }}></div>
      {/* <div className="absolute inset-x-0 top-0 h-2/3 bg-black opacity-40"></div> */}
      
      {/* <div className="relative z-20">
        <Header 
          title="เข้าสู่ระบบ" 
          backHref="/" 
          showNotificationIcon={true} 
        />
      </div> */}
      
      <div className="relative flex flex-1 flex-col items-center justify-end">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-1 pt-6">ยินดีต้อนรับกลับมา</h2>
          <p className="text-lg text-gray-500 text-center mb-6 pb-8">ล็อกอินเข้าสู่บัญชีของคุณ</p>
          
          <div className="space-y-6">
            <TextField
              type="email"
              placeholder="อีเมล"
              icon={<Mail size={20} />}
            />
            <PasswordTextField
              placeholder="รหัสผ่าน"
            />
            
            <div className="flex items-center pb-10 px-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-black text-white focus:ring-black"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-900 pb-">
                จดจำฉัน
              </label>
            </div>
            
            <button
              type="submit"
              className="w-full rounded-3xl bg-black py-3 text-white transition-colors duration-200 hover:bg-gray-800"
            >
              เข้าสู่ระบบ
            </button>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            ไม่มีบัญชี?{" "}
            <Link href="/auth/sign-up" className="font-medium text-black hover:underline">
              สร้างบัญชี
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}