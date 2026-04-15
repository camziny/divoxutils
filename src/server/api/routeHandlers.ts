import { NextResponse } from "next/server";

export function jsonMethodNotAllowed(allow: string) {
  const response = NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
  response.headers.set("Allow", allow);
  return response;
}
