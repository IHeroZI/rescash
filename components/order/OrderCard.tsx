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
      <div className="flex items-center gap-4">
        <div className={`flex-shrink-0 p-2 rounded-lg ${statusInfo.color}`}>
          <IconComponent size={24} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <p className="font-bold text-base">{order.public_order_id}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{user?.name || "ไม่ระบุชื่อ"}</span>
            <span>•</span>
            <span>
              {new Date(order.update_datetime).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">
            ฿{order.total_amount.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
