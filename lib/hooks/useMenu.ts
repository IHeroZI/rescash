"use client";

import { useEffect, useState } from "react";

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
        const response = await fetch('/api/menus');
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch menus');
        }
        
        setMenus(result.data || []);
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
      const response = await fetch('/api/menus');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch menus');
      }
      
      setMenus(result.data || []);
    } catch (err) {
      console.log("Error in refetch:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch menus");
    } finally {
      setLoading(false);
    }
  };

  return { menus, loading, error, refetch };
}
