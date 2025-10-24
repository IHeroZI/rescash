import Header from "@/components/common/Header";

export default function AddMenuPage() {
  return (
    
    <><Header
              title="เพิ่มเมนู"
              backHref="/menu"  
              showNotificationIcon={true} /><div className="flex items-center justify-center h-screen">
          <div className="text-gray-400">หน้าสำหรับเพิ่มเมนู (กำลังพัฒนา)</div>
      </div></>
  );
}