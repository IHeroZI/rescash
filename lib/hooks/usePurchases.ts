import { useState, useEffect } from "react";

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
      const response = await fetch('/api/purchases');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }

      setPurchases(result.data || []);
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
