"use client";

import { usePathname, useRouter } from "next/navigation";
import { BookText, ClipboardList, MoreHorizontal } from "lucide-react";

type NavItem = {
  icon: (isActive: boolean) => React.ReactNode;
  path: string;
  label: string;
};

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems: NavItem[] = [
    {
      icon: (active) => <BookText size={24} className={active ? "text-white" : "text-gray-800"} />,
      path: "/menu",
      label: "Menu",
    },
    {
      icon: (active) => <ClipboardList size={24} className={active ? "text-white" : "text-gray-800"} />,
      path: "/order",
      label: "Order",
    },
    {
      icon: (active) => <MoreHorizontal size={24} className={active ? "text-white" : "text-gray-800"} />,
      path: "/more",
      label: "More",
    },
  ];

  const handleNavClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="absolute left-0 right-0 bottom-0 flex justify-center pb-6 px-2">
      <div className="flex justify-around items-center h-16 w-[90%] bg-white/10 rounded-full border border-gray-200 shadow-md">
        {navItems.map((item, index) => {
          const isActive = pathname.startsWith(item.path);

          return (
            <button
              key={index}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full"
            >
              <div
                className={`flex items-center justify-center w-12 h-12 ${isActive ? "bg-gray-800 rounded-full" : ""}`}
              >
                {item.icon(isActive)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
