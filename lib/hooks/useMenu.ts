"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Menu {
  menu_id: number;
  menu_name: string;
  description: string | null;
  price: number;
  recipe: string | null;
  is_available: boolean;
  menu_image_url: string | null;
  create_datetime: string;
  update_datetime: string;
}

export function useMenu() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const supabase = createClient();
        
        const { data, error: dbError } = await supabase
          .from("menu")
          .select("*")
          .order("create_datetime", { ascending: false });

        if (dbError) {
          console.log("Database error:", dbError);
          throw dbError;
        }
        
        setMenus(data || []);
      } catch (err) {
        console.log("Error in useMenu:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch menus");
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("menu")
        .select("*")
        .order("create_datetime", { ascending: false });

      if (dbError) {
        console.log("Database error:", dbError);
        throw dbError;
      }
      
      setMenus(data || []);
    } catch (err) {
      console.log("Error in refetch:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch menus");
    } finally {
      setLoading(false);
    }
  };

  return { menus, loading, error, refetch };
}
