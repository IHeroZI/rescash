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
      className={`py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Column: public_order_id, ชื่อคนสั่ง, update_datetime */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-gray-900 mb-1">{order.public_order_id}</p>
          <p className="text-sm text-gray-700 mb-1">{user?.name || "ไม่ระบุชื่อ"}</p>
          <p className="text-xs text-gray-500">
            {new Date(order.update_datetime).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Right Column: order_status, total_amount */}
        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${statusInfo.color}`}>
            <IconComponent size={14} />
            {statusInfo.label}
          </span>
          <p className="font-bold text-lg text-gray-900">
            ฿{order.total_amount.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
