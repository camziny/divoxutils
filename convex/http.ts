import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { corsHeaders, requireBotAuth } from "./httpAuth";

const http = httpRouter();
const internalErrorBody = JSON.stringify({ error: "Internal server error" });

function safeHttpAction(
  endpoint: string,
  handler: Parameters<typeof httpAction>[0]
) {
  return httpAction(async (ctx, request) => {
    try {
      return await handler(ctx, request);
    } catch (error) {
      console.error(`[convex-http] ${endpoint} failed`, error);
      return new Response(internalErrorBody, {
        status: 500,
        headers: corsHeaders,
      });
    }
  });
}

http.route({
  path: "/createDraft",
  method: "POST",
  handler: safeHttpAction("/createDraft", async (ctx, request) => {
    const authError = requireBotAuth(request, process.env.BOT_API_KEY);
    if (authError) return authError;

    const body = await request.json();
    const {
      guildId,
      guildName,
      channelId,
      textChannelId,
      createdBy,
      createdByDisplayName,
      createdByAvatarUrl,
      players,
    } = body;

    if (
      !guildId ||
      !channelId ||
      !createdBy ||
      !players ||
      !Array.isArray(players)
    ) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await ctx.runMutation(api.drafts.createDraft, {
      discordGuildId: guildId,
      discordGuildName: guildName,
      discordChannelId: channelId,
      discordTextChannelId: textChannelId,
      createdBy,
      createdByDisplayName,
      createdByAvatarUrl,
      players: players.map((p: { discordUserId: string; displayName: string; avatarUrl?: string }) => ({
        discordUserId: p.discordUserId,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
      })),
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/getDraftStatus",
  method: "GET",
  handler: safeHttpAction("/getDraftStatus", async (ctx, request) => {
    const authError = requireBotAuth(request, process.env.BOT_API_KEY);
    if (authError) return authError;

    const url = new URL(request.url);
    const shortId = url.searchParams.get("shortId");

    if (!shortId) {
      return new Response(JSON.stringify({ error: "Missing shortId" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const draft = await ctx.runQuery(api.drafts.getDraftStatus, { shortId });

    if (!draft) {
      return new Response(JSON.stringify({ error: "Draft not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({
        status: draft.status,
        gameStarted: draft.gameStarted,
        winnerTeam: draft.winnerTeam,
        pendingWinnerTeam: draft.pendingWinnerTeam,
        setFinalizedAt: draft.setFinalizedAt,
        setFinalizedBy: draft.setFinalizedBy,
        discordGuildId: draft.discordGuildId,
        discordGuildName: draft.discordGuildName,
        createdBy: draft.createdBy,
        createdByDisplayName: draft.createdByDisplayName,
        createdByAvatarUrl: draft.createdByAvatarUrl,
        discordTextChannelId: draft.discordTextChannelId,
        team1CaptainId: draft.team1CaptainId,
        team2CaptainId: draft.team2CaptainId,
        botPostedLink: draft.botPostedLink,
        botNotifiedCaptains: draft.botNotifiedCaptains,
        players: draft.players.map((p) => ({
          discordUserId: p.discordUserId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          team: p.team,
        })),
      }),
      { status: 200, headers: corsHeaders }
    );
  }),
});

http.route({
  path: "/guildSettings",
  method: "POST",
  handler: safeHttpAction("/guildSettings:POST", async (ctx, request) => {
    const authError = requireBotAuth(request, process.env.BOT_API_KEY);
    if (authError) return authError;

    const body = await request.json();
    const { guildId, team1ChannelId, team2ChannelId, lobbyChannelId } = body;

    if (!guildId || !team1ChannelId || !team2ChannelId || !lobbyChannelId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const id = await ctx.runMutation(api.drafts.upsertGuildSettings, {
      discordGuildId: guildId,
      team1ChannelId,
      team2ChannelId,
      lobbyChannelId,
    });

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/guildSettings",
  method: "GET",
  handler: safeHttpAction("/guildSettings:GET", async (ctx, request) => {
    const authError = requireBotAuth(request, process.env.BOT_API_KEY);
    if (authError) return authError;

    const url = new URL(request.url);
    const guildId = url.searchParams.get("guildId");

    if (!guildId) {
      return new Response(JSON.stringify({ error: "Missing guildId" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const settings = await ctx.runQuery(api.drafts.getGuildSettings, {
      discordGuildId: guildId,
    });

    if (!settings) {
      return new Response(JSON.stringify({ error: "No settings found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/activeDrafts",
  method: "GET",
  handler: safeHttpAction("/activeDrafts", async (ctx, request) => {
    const authError = requireBotAuth(request, process.env.BOT_API_KEY);
    if (authError) return authError;

    const drafts = await ctx.runQuery(api.drafts.getActiveDrafts, {});
    return new Response(JSON.stringify(drafts), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/getDraftTokens",
  method: "GET",
  handler: safeHttpAction("/getDraftTokens", async (ctx, request) => {
    const authError = requireBotAuth(request, process.env.BOT_API_KEY);
    if (authError) return authError;

    const url = new URL(request.url);
    const shortId = url.searchParams.get("shortId");

    if (!shortId) {
      return new Response(JSON.stringify({ error: "Missing shortId" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const tokens = await ctx.runQuery(internal.drafts.getActiveDraftTokens, { shortId });

    if (!tokens) {
      return new Response(JSON.stringify({ error: "Draft not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(tokens), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/markBotPostedLink",
  method: "POST",
  handler: safeHttpAction("/markBotPostedLink", async (ctx, request) => {
    const authError = requireBotAuth(request, process.env.BOT_API_KEY);
    if (authError) return authError;

    const { shortId } = await request.json();
    await ctx.runMutation(api.drafts.markBotPostedLink, { shortId });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

http.route({
  path: "/markBotNotifiedCaptains",
  method: "POST",
  handler: safeHttpAction("/markBotNotifiedCaptains", async (ctx, request) => {
    const authError = requireBotAuth(request, process.env.BOT_API_KEY);
    if (authError) return authError;

    const { shortId } = await request.json();
    await ctx.runMutation(api.drafts.markBotNotifiedCaptains, { shortId });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  }),
});

export default http;
