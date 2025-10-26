export function generatePublicOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

export function getOrderStatusInfo(status: string) {
  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    awaiting_payment: {
      label: "รอชำระเงิน",
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      icon: "Clock",
    },
    awaiting_admin_review: {
      label: "รอการตรวจสอบสลิป",
      color: "bg-orange-100 text-orange-800 border-orange-300",
      icon: "FileSearch",
    },
    order_recived: {
      label: "รับออร์เดอร์แล้ว",
      color: "bg-blue-100 text-blue-800 border-blue-300",
      icon: "CheckCircle",
    },
    preparing: {
      label: "กำลังเตรียมอาหาร",
      color: "bg-purple-100 text-purple-800 border-purple-300",
      icon: "ChefHat",
    },
    ready_for_pickup: {
      label: "อาหารพร้อมรับ",
      color: "bg-green-100 text-green-800 border-green-300",
      icon: "ShoppingBag",
    },
    completed: {
      label: "คำสั่งซื้อเสร็จสมบูรณ์",
      color: "bg-gray-100 text-gray-800 border-gray-300",
      icon: "CheckCheck",
    },
    cancelled: {
      label: "คำสั่งซื้อถูกยกเลิก",
      color: "bg-red-100 text-red-800 border-red-300",
      icon: "XCircle",
    },
  };

  return statusMap[status] || statusMap.awaiting_payment;
}

export function getOrderStatusTimeline(currentStatus: string) {
  const timeline = [
    { status: "awaiting_payment", label: "รอชำระเงิน" },
    { status: "awaiting_admin_review", label: "รอตรวจสอบ" },
    { status: "order_recived", label: "รับออร์เดอร์" },
    { status: "preparing", label: "กำลังเตรียม" },
    { status: "ready_for_pickup", label: "พร้อมรับ" },
    { status: "completed", label: "เสร็จสมบูรณ์" },
  ];

  const currentIndex = timeline.findIndex((t) => t.status === currentStatus);
  
  if (currentStatus === "cancelled") {
    return [{ status: "cancelled", label: "ยกเลิก", active: true }];
  }

  return timeline.map((item, index) => ({
    ...item,
    active: index <= currentIndex,
    current: index === currentIndex,
  }));
}

export function getNextStatus(currentStatus: string): string | null {
  const statusFlow: Record<string, string> = {
    awaiting_payment: "awaiting_admin_review",
    awaiting_admin_review: "order_recived",
    order_recived: "preparing",
    preparing: "ready_for_pickup",
    ready_for_pickup: "completed",
  };

  return statusFlow[currentStatus] || null;
}

export function canChangeStatus(currentStatus: string, nextStatus: string, role: string): boolean {
  // Admin can change from awaiting_admin_review to order_recived
  if (currentStatus === "awaiting_admin_review" && nextStatus === "order_recived") {
    return role === "admin";
  }

  // Staff cannot change from awaiting_admin_review
  if (currentStatus === "awaiting_admin_review" && role === "staff") {
    return false;
  }

  return true;
}
