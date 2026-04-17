import { SUPPORTER_TIER_PLANS } from "@/app/contribute/_lib/supporterTierPlans";

export const SUPPORT_PROMPT_TIER_PLANS = SUPPORTER_TIER_PLANS;

export type SupportPromptTierPlan = (typeof SUPPORTER_TIER_PLANS)[number];
