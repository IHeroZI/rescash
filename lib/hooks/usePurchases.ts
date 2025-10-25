import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Purchase {
  purchase_id: number;
  total_amount: number;
  notes: string | null;
  purchase_datetime: string;
  is_deleted: boolean;
  create_datetime: string;
  update_datetime: string;
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async () => {
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("purchase")
        .select("*")
        .order("purchase_datetime", { ascending: false });

      if (dbError) throw dbError;
      setPurchases(data || []);
    } catch (err) {
      console.log("Error fetching purchases:", err);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  return { purchases, loading, error, refetch: fetchPurchases };
}
