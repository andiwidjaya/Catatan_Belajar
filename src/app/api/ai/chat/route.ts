import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendItemChatMessage } from "@/lib/actions/chat";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, contentId, message } = body;

    if (!conversationId || !contentId || !message) {
      return NextResponse.json(
        { error: "Missing required parameters: conversationId, contentId, or message" },
        { status: 400 }
      );
    }

    const result = await sendItemChatMessage(conversationId, contentId, message);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, userMessage: result.userMessage, assistantMessage: result.assistantMessage });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
