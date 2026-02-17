export const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export function requireBotAuth(
  request: Request,
  expectedKey: string | undefined
): Response | null {
  const key = request.headers.get("x-bot-api-key");
  if (!key || !expectedKey || key !== expectedKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }
  return null;
}
