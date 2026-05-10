import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend("re_Yf3wMc2b_AH9MUuSr4Y2b7KoZPvupop1M ");

export async function POST(req: NextRequest) {
  try {
    const to = process.env.CONTACT_TO;
    if (!to) {
      return NextResponse.json(
        { error: "CONTACT_TO not set in .env.local" },
        { status: 500 }
      );
    }

    const { email, subject, message, name } = await req.json();

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: email, subject, message" },
        { status: 400 }
      );
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>New Contact Message</h2>
        <p><strong>From:</strong> ${name ? `${name} &lt;${email}&gt;` : email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr/>
        <pre style="white-space: pre-wrap; font-family: inherit;">${String(message)}</pre>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: process.env.CONTACT_FROM || "SmartChef <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo: email,
    } as any);

    if (error) {
      return NextResponse.json(
        { error: "Failed to send email", details: error },
        { status: (error as any)?.statusCode || 502 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    return NextResponse.json(
      { error: "Unexpected error", details: `${e}` },
      { status: 500 }
    );
  }
}

