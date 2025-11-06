import { useState, useEffect } from "react";

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
      const response = await fetch('/api/ingredients');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }

      setIngredients(result.data || []);
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
