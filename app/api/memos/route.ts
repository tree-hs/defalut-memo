import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const memos = await prisma.memo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(memos);
  } catch (err) {
    console.error("[api/memos GET]", err);
    return NextResponse.json(
      { error: "Failed to load memos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const memo = await prisma.memo.create({
      data: { content },
    });
    return NextResponse.json(memo);
  } catch (err) {
    console.error("[api/memos POST]", err);
    return NextResponse.json(
      { error: "Failed to save memo" },
      { status: 500 }
    );
  }
}
