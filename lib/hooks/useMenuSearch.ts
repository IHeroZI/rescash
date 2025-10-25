import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

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
        const supabase = createClient();

        let query = supabase
          .from("menu")
          .select("*")
          .order("menu_id", { ascending: true });

        // ถ้ามีคำค้นหา ให้กรองตามชื่อเมนู
        if (searchQuery.trim()) {
          query = query.ilike("menu_name", `%${searchQuery}%`);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setMenus(data || []);
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
