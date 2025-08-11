import { signOut } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in signOut route:", error);
    return NextResponse.json(
      { success: false, message: "Logout Failed" },
      { status: 500 }
    );
  }
}