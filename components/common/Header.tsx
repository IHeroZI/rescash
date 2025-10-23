"use client";

import { ChevronLeft, Bell } from "lucide-react";
import Link from "next/link";
import { type FC } from "react";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backHref?: string;
  showNotificationIcon?: boolean;
}

const Header: FC<HeaderProps> = ({
  title,
  showBackButton = true,
  backHref = "/",
  showNotificationIcon = true,
}) => {
  return (
    <div className="relative flex w-full items-center justify-center p-4">
      {/* Back Button on the far left */}
      {showBackButton && (
        <div className="absolute left-4">
          <Link href={backHref} className="p-2">
            <ChevronLeft size={24} className="text-gray-800" />
          </Link>
        </div>
      )}

      {/* Title in the center */}
      <div className="flex-1 text-center">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Notification Icon on the far right */}
      {showNotificationIcon && (
        <div className="absolute right-4">
          <button className="p-2">
            <Bell size={24} className="text-gray-800" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;