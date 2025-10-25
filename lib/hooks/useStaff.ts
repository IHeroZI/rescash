import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Staff {
  user_id: string;
  name: string;
  email: string;
  phone_number: string;
  profile_image_url: string | null;
  role: string;
  create_datetime: string;
  update_datetime: string;
}

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("role", "staff")
        .order("create_datetime", { ascending: false });

      if (dbError) throw dbError;
      setStaff(data || []);
    } catch (err) {
      console.log("Error fetching staff:", err);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return { staff, loading, error, refetch: fetchStaff };
}
