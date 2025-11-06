"use client";

import Link from "next/link";
import { User, Mail, Phone } from "lucide-react";
import { useState } from "react";
import Header from "@/components/common/Header";
import TextField from "@/components/common/TextField";
import PasswordTextField from "@/components/common/PasswordTextField";
import ErrorLabel from "@/components/common/ErrorLabel";
import { signUp } from "../actions";
import { validateSignUp } from "@/lib/validation/validationSchemas";

export default function RegisterPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const validation = validateSignUp(formData);
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    setLoading(true);
    const formDataObj = new FormData(e.currentTarget);
    const result = await signUp(formDataObj);

    if (result?.error) {
      setErrors({ general: result.error });
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
          
          {errors.general && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}
          
          <div className="space-y-5">
            <div>
              <TextField
                type="email"
                name="email"
                placeholder="อีเมล"
                icon={<Mail size={20} />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!errors.email}
              />
              <ErrorLabel message={errors.email} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <TextField
                  type="text"
                  name="firstName"
                  placeholder="ชื่อจริง"
                  icon={<User size={20} />}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  error={!!errors.firstName}
                />
                <ErrorLabel message={errors.firstName} />
              </div>
              <div>
                <TextField
                  type="text"
                  name="lastName"
                  placeholder="นามสกุล"
                  icon={<User size={20} />}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  error={!!errors.lastName}
                />
                <ErrorLabel message={errors.lastName} />
              </div>
            </div>
            <div>
              <TextField
                type="tel"
                name="phone"
                placeholder="เบอร์โทร"
                icon={<Phone size={20} />}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={!!errors.phone}
              />
              <ErrorLabel message={errors.phone} />
            </div>
            <div>
              <PasswordTextField
                name="password"
                placeholder="รหัสผ่าน"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={!!errors.password}
              />
              <ErrorLabel message={errors.password} />
            </div>
            <div>
              <PasswordTextField
                name="confirmPassword"
                placeholder="ยืนยันรหัสผ่าน"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={!!errors.confirmPassword}
              />
              <ErrorLabel message={errors.confirmPassword} />
            </div>
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