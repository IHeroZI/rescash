import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Ingredient {
  ingredient_id: number;
  ingredient_name: string;
  unit_of_measure: string;
  is_available: boolean;
  create_datetime: string;
  update_datetime: string;
}

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIngredients = async () => {
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("ingredient")
        .select("*")
        .order("create_datetime", { ascending: false });

      if (dbError) throw dbError;
      setIngredients(data || []);
    } catch (err) {
      console.log("Error fetching ingredients:", err);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  return { ingredients, loading, error, refetch: fetchIngredients };
}
