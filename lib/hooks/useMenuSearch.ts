import { useState, useEffect } from "react";

export interface Menu {
  menu_id: number;
  menu_name: string;
  price: number;
  description: string | null;
  menu_image_url: string | null;
  is_available: boolean;
  recipe: string | null;
  create_datetime: string;
  update_datetime: string;
}

export function useMenuSearch(searchQuery: string) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchMenus = async () => {
      // ไม่ setLoading(true) ตอน search ซ้ำ เพื่อไม่ให้ re-render
      setError(null);

      try {
        // สร้าง URL สำหรับ API call
        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.append('search', searchQuery.trim());
        }

        const url = `/api/menus${params.toString() ? `?${params.toString()}` : ''}`;
        
        const response = await fetch(url);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
        }

        setMenus(result.data || []);
      } catch (err) {
        console.log("Error searching menus:", err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        // Set loading false เฉพาะครั้งแรก
        setLoading(false);
      }
    };

    // Debounce search (รอ 300ms หลังจากพิมพ์เสร็จ)
    const timeoutId = setTimeout(() => {
      searchMenus();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return { menus, loading, error };
}
