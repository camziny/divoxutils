export function hasConnectedDiscordAccount(
  externalAccounts: Array<{ provider?: string; providerId?: string }> | undefined
): boolean {
  if (!externalAccounts?.length) return false;
  return externalAccounts.some((account) => {
    const provider = String(account.provider ?? account.providerId ?? "").toLowerCase();
    return provider.includes("discord");
  });
}
