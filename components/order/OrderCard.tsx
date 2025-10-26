import { Clock, FileSearch, CheckCircle, ChefHat, ShoppingBag, CheckCheck, XCircle } from "lucide-react";
import { getOrderStatusInfo } from "@/lib/utils/orderUtils";
import { Order } from "@/lib/hooks/useOrders";

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

const iconMap = {
  Clock,
  FileSearch,
  CheckCircle,
  ChefHat,
  ShoppingBag,
  CheckCheck,
  XCircle,
};

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const statusInfo = getOrderStatusInfo(order.order_status);
  const IconComponent = iconMap[statusInfo.icon as keyof typeof iconMap] || Clock;

  const user = Array.isArray(order.user) ? order.user[0] : order.user;

  return (
    <div
      onClick={onClick}
      className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${statusInfo.color}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <IconComponent size={40} className="opacity-80" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <p className="font-bold text-sm">ORDER : {order.public_order_id}</p>
              <p className="text-xs mt-0.5">
                {new Date(order.update_datetime).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className="font-bold text-lg whitespace-nowrap">
              ฿{order.total_amount.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs mt-2">
            <span className="font-medium">📍 ResCash</span>
            <span>•</span>
            <span>{user?.name || "ไม่ระบุชื่อ"}</span>
          </div>

          <div className="mt-2 text-right">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white/50">
              {statusInfo.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
