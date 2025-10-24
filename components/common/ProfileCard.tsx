"use client";

import { User, Edit2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { UserData } from "@/lib/hooks/useUser";

interface ProfileCardProps {
  userData: UserData;
}

export default function ProfileCard({ userData }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
      <div className="flex items-center gap-4">
        {/* Profile Image */}
        <div className="relative">
          {userData.profile_image_url ? (
            <Image
              src={userData.profile_image_url}
              alt={userData.name}
              width={90}
              height={90}
              className="w-25 h-25 aspect-square rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
              <User size={40} className="text-gray-500" />
            </div>
          )}
          
          {/* Edit Icon */}
          <Link
            href="/profile/edit"
            className="absolute bottom-0 right-0 w-7 h-7 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <Edit2 size={14} className="text-white" />
          </Link>
        </div>

        {/* User Info */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 uppercase">{userData.role}</p>
          <h3 className="text-md font-bold text-gray-900">{userData.name}</h3>
          <p className="text-sm text-gray-600">{userData.email}</p>
          <p className="text-sm text-gray-600">{userData.phone || "ไม่ระบุเบอร์โทร"}</p>
        </div>
      </div>
    </div>
  );
}
