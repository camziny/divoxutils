import { NextResponse } from "next/server";

export function hasValidCronAuthorization(
  authorizationHeader: string | null,
  cronSecret: string | undefined
) {
  if (!authorizationHeader || !cronSecret) {
    return false;
  }
  return authorizationHeader === `Bearer ${cronSecret}`;
}

export function unauthorizedCronResponse() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

export function postMethodNotAllowedResponse(method: string) {
  const response = new NextResponse(`Method ${method} Not Allowed`, {
    status: 405,
  });
  response.headers.set("Allow", "POST");
  return response;
}
