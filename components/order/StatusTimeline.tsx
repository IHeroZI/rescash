import { getOrderStatusTimeline } from "@/lib/utils/orderUtils";

interface StatusTimelineProps {
  currentStatus: string;
}

export default function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  const timeline = getOrderStatusTimeline(currentStatus);

  if (currentStatus === "cancelled") {
    return (
      <div className="bg-red-50 p-4 rounded-lg border-2 border-red-400">
        <p className="text-center text-red-700 font-semibold">❌ คำสั่งซื้อถูกยกเลิก</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">สถานะคำสั่งซื้อ</h3>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-gray-200" />
        
        <div className="space-y-4">
          {timeline.map((item) => (
            <div key={item.status} className="relative flex items-center gap-3">
              {/* Status dot */}
              <div
                className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  item.active
                    ? "bg-green-500 border-green-500"
                    : "bg-white border-gray-300"
                }`}
              >
                {item.active && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              
              {/* Status label */}
              <div className="flex-1">
                <p
                  className={`text-sm ${
                    item.active ? "font-semibold text-gray-900" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </p>
              </div>
              
              {/* Current indicator */}
              {'current' in item && item.current && (
                <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium border-2 border-green-400">
                  ปัจจุบัน
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
