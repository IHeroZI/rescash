import { useState, useEffect } from "react";

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
      const response = await fetch('/api/users?role=staff');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }

      // Transform data to match expected format
      const transformedData = result.data.map((user: {
        user_id: number;
        name: string;
        email: string;
        phone: string;
        profile_image_url: string | null;
        role: string;
        create_datetime: string;
        update_datetime: string;
      }) => ({
        user_id: user.user_id.toString(),
        name: user.name,
        email: user.email,
        phone_number: user.phone || '',
        profile_image_url: user.profile_image_url,
        role: user.role,
        create_datetime: user.create_datetime,
        update_datetime: user.update_datetime
      }));

      setStaff(transformedData);
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
