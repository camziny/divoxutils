import React from 'react';
import LeaderboardList from './LeaderboardList';

interface LeaderboardItem {
  userId: number;
  clerkUserId: string;
  userName: string;
  totalRealmPoints: number;
  realmPointsLastWeek: number;
  realmPointsThisWeek: number;
  totalSoloKills: number;
  soloKillsLastWeek: number;
  soloKillsThisWeek: number;
  totalDeaths: number;
  deathsLastWeek: number;
  deathsThisWeek: number;
  totalDeathBlows: number;
  deathBlowsLastWeek: number;
  deathBlowsThisWeek: number;
  irs: number;
  irsLastWeek: number;
  irsThisWeek: number;
  lastUpdated: Date | null;
  supporterTier: number;
}

interface LeaderboardWrapperProps {
  data: LeaderboardItem[];
}

export default function LeaderboardWrapper({ data }: LeaderboardWrapperProps) {
  const processedData = data.map((item) => ({
    ...item,
    lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : null,
  }));

  return <LeaderboardList data={processedData} />;
} 