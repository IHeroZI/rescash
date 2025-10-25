"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  console.log("Sign-in error:", error);

  if (error) {
    return { error: "กรุณาตรวจสอบอีเมลหรือรหัสผ่านอีกครั้ง" };
  }

  // Get user info to redirect based on role
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("email", user.email)
      .single();

    if (userData?.role === "admin") {
      redirect("/menu");
    } else if (userData?.role === "staff") {
      redirect("/order");
    } else {
      redirect("/menu");
    }
  }

  redirect("/menu");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phone = formData.get("phone") as string;

  const supabase = await createClient();

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (authData.user) {
    // Insert user data into Users table
    const { error: dbError } = await supabase.from("users").insert({
      email,
      name: `${firstName} ${lastName}`,
      phone,
      role: "customer", // Default role
      password: null, // We don't store password in Users table when using Supabase Auth
    });

    if (dbError) {
      console.log("Error inserting user data:", dbError);
      return { error: "มี email นี้อยู่แล้ว" };
    }
  }


    redirect("/menu");
    
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
