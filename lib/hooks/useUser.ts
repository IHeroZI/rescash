"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserData {
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "customer" | "staff" | "admin";
  profile_image_url: string | null;
  create_datetime: string;
  update_datetime: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient();
        
        // Get auth user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        
        if (!authUser) {
          setLoading(false);
          return;
        }

        setUser(authUser);

        // Get user data from users table
        const { data, error: dbError } = await supabase
          .from("users")
          .select("*")
          .eq("email", authUser.email)
          .maybeSingle();

        if (dbError) {
          console.log("Database error:", dbError);
          throw dbError;
        }
        
        if (data) {
          setUserData(data);
        }
      } catch (err) {
        console.log("Error in useUser:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        fetchUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserData(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      if (!authUser) {
        setLoading(false);
        return;
      }

      setUser(authUser);

      const { data, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email)
        .maybeSingle();

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }
      
      if (data) {
        setUserData(data);
      }
    } catch (err) {
      console.error("Error in refetch:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  return { user, userData, loading, error, refetch };
}
