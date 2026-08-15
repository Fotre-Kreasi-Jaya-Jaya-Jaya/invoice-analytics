import { NextResponse } from "next/server";
import { z } from "zod";
import { loginUser, createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    const user = await loginUser(parsed.data.email.toLowerCase(), parsed.data.password);
    await createSession(user);
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal masuk" }, { status: 401 });
  }
}
