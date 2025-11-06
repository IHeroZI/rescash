"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useState } from "react";
import TextField from "@/components/common/TextField";
import PasswordTextField from "@/components/common/PasswordTextField";
import ErrorLabel from "@/components/common/ErrorLabel";
import { signIn } from "../actions";
import { validateLogin } from "@/lib/validation/validationSchemas";

export default function LoginPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const validation = validateLogin({ email, password });
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn(formData);

    if (result?.errors) {
      setErrors(result.errors);
      setLoading(false);
    }
  }

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
        <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-1 pt-6">ยินดีต้อนรับกลับมา</h2>
          <p className="text-lg text-gray-500 text-center mb-6 pb-8">ล็อกอินเข้าสู่บัญชีของคุณ</p>
          
          <div className="space-y-4">
            <div>
              <TextField
                type="email"
                name="email"
                placeholder="อีเมล"
                icon={<Mail size={20} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
              />
              <ErrorLabel message={errors.email} />
            </div>
            
            <div>
              <PasswordTextField
                name="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
              />
              <ErrorLabel message={errors.password} />
            </div>
            
            <div className="pb-12 px-2" /> 
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-black py-3 text-white transition-colors duration-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            ไม่มีบัญชี?{" "}
            <Link href="/auth/sign-up" className="font-medium text-black hover:underline">
              สร้างบัญชี
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}