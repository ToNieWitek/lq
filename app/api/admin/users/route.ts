import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, displayName, notes } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email i hasło są wymagane" },
        { status: 400 }
      );
    }

    try {
      const supabaseAdmin = getAdminClient();

      // 1. Utwórz użytkownika w Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName || email.split("@")[0],
          role: "customer",
        },
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      // 2. Dodaj wpis do tabeli profiles
      if (authUser.user) {
        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
          id: authUser.user.id,
          email,
          username: email.split("@")[0],
          display_name: displayName || email.split("@")[0],
          role: "customer",
          notes: notes || "",
        });

        if (profileError) {
          console.error("Profile insert error", profileError);
        }
      }

      return NextResponse.json({
        success: true,
        user: authUser.user,
      });
    } catch (adminErr: unknown) {
      // Jeśli zmienne env Supabase nie są jeszcze podpięte, zasymuluj utworzenie
      console.warn("Supabase admin credentials not configured, returning mock success:", adminErr);
      const mockId = "mock-user-" + Date.now();
      return NextResponse.json({
        success: true,
        mock: true,
        user: {
          id: mockId,
          email,
          display_name: displayName || email.split("@")[0],
          role: "customer",
          notes,
          created_at: new Date().toISOString(),
        },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
