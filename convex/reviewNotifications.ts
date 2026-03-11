import { Resend } from "@convex-dev/resend";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";

const resend = new Resend(components.resend, { testMode: false });

const FIXED_REVIEW_RECIPIENTS = ["cameronziny@gmail.com"];

export function getAdminReviewRecipients() {
  return FIXED_REVIEW_RECIPIENTS;
}

function getDraftReviewUrl(shortId: string) {
  const baseUrl = process.env.APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!baseUrl) {
    return `/admin/drafts?draft=${encodeURIComponent(shortId)}`;
  }
  return `${baseUrl.replace(/\/$/, "")}/admin/drafts?draft=${encodeURIComponent(shortId)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildDraftReviewEmail(input: {
  shortId: string;
  winnerTeam: 1 | 2;
  discordGuildName?: string;
  discordGuildId: string;
  createdByDisplayName?: string;
  createdBy: string;
  setScore?: string;
}) {
  const draftUrl = getDraftReviewUrl(input.shortId);
  const guildLabel = input.discordGuildName
    ? `${input.discordGuildName} (${input.discordGuildId})`
    : input.discordGuildId;
  const creatorLabel = input.createdByDisplayName
    ? `${input.createdByDisplayName} (${input.createdBy})`
    : input.createdBy;
  const scoreLabel = input.setScore ?? "N/A";
  const subject = `Draft ${input.shortId} is ready for admin review`;
  const text = [
    `Draft ${input.shortId} is ready for admin review.`,
    `Guild: ${guildLabel}`,
    `Creator: ${creatorLabel}`,
    `Set score: ${scoreLabel}`,
    `Winner: Team ${input.winnerTeam}`,
    `Review: ${draftUrl}`,
  ].join("\n");
  const html = [
    `<p>Draft <strong>${escapeHtml(input.shortId)}</strong> is ready for admin review.</p>`,
    `<p><strong>Guild:</strong> ${escapeHtml(guildLabel)}<br />`,
    `<strong>Creator:</strong> ${escapeHtml(creatorLabel)}<br />`,
    `<strong>Set score:</strong> ${escapeHtml(scoreLabel)}<br />`,
    `<strong>Winner:</strong> Team ${input.winnerTeam}</p>`,
    `<p><a href="${draftUrl}">Open moderation page</a></p>`,
  ].join("");
  return { subject, text, html };
}

export const getDraftReviewNotificationData = internalQuery({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, { draftId }) => {
    const draft = await ctx.db.get(draftId);
    if (!draft) {
      return null;
    }
    return {
      _id: draft._id,
      shortId: draft.shortId,
      winnerTeam: draft.winnerTeam,
      resultStatus: draft.resultStatus,
      reviewNotificationSentAt: draft.reviewNotificationSentAt,
      discordGuildName: draft.discordGuildName,
      discordGuildId: draft.discordGuildId,
      setScore: draft.setScore,
      createdByDisplayName: draft.createdByDisplayName,
      createdBy: draft.createdBy,
    };
  },
});

export const markDraftReviewNotificationSent = internalMutation({
  args: {
    draftId: v.id("drafts"),
    sentAt: v.number(),
  },
  handler: async (ctx, { draftId, sentAt }) => {
    const draft = await ctx.db.get(draftId);
    if (!draft || draft.reviewNotificationSentAt) {
      return;
    }
    await ctx.db.patch(draftId, {
      reviewNotificationSentAt: sentAt,
    });
  },
});

export const sendDraftReviewNotification = internalAction({
  args: { draftId: v.id("drafts") },
  handler: async (ctx, { draftId }) => {
    const draft = await ctx.runQuery(internal.reviewNotifications.getDraftReviewNotificationData, {
      draftId,
    });
    if (!draft) {
      return { sent: false, reason: "draft_not_found" as const };
    }
    if (draft.winnerTeam === undefined || draft.resultStatus !== "unverified") {
      return { sent: false, reason: "draft_not_pending_review" as const };
    }
    if (draft.reviewNotificationSentAt) {
      return { sent: false, reason: "already_sent" as const };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    if (!fromEmail) {
      throw new Error("Missing RESEND_FROM_EMAIL");
    }

    const recipients = getAdminReviewRecipients();
    if (recipients.length === 0) {
      return { sent: false, reason: "no_admin_recipients" as const };
    }

    const { subject, text, html } = buildDraftReviewEmail({
      shortId: draft.shortId,
      winnerTeam: draft.winnerTeam,
      discordGuildName: draft.discordGuildName,
      discordGuildId: draft.discordGuildId,
      createdByDisplayName: draft.createdByDisplayName,
      createdBy: draft.createdBy,
      setScore: draft.setScore,
    });

    await resend.sendEmail(ctx, {
      from: fromEmail,
      to: recipients,
      subject,
      text,
      html,
    });

    await ctx.runMutation(internal.reviewNotifications.markDraftReviewNotificationSent, {
      draftId,
      sentAt: Date.now(),
    });

    return { sent: true as const };
  },
});
