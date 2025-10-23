"use client";

// import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default function HomePage() {
  // const supabase =  createClient();
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-end py-18"
      style={{
        backgroundImage: "url('/images/bg-rescash.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

      {/* เพิ่มส่วนของปุ่ม */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <Link href="auth/login"
          className="w-full py-3 bg-white/3 text-white rounded-2xl text-center font-medium backdrop-blur-md border border-white/30 transition-colors duration-200 hover:bg-white/30"
        >
          เข้าสู่ระบบ
        </Link>
        <Link href="auth/sign-up"
          className="w-full py-3 pb-16 text-white rounded-lg text-center font-medium transition-colors duration-200"
        >
          สร้างบัญชี
        </Link>
      </div>
    </div>
  );
}