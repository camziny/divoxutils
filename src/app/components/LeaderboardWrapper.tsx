import React from 'react';
import LeaderboardList from './LeaderboardList';

interface LeaderboardItem {
  userId: number;
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
  irs: number;
  irsLastWeek: number;
  irsThisWeek: number;
  lastUpdated: Date;
}

interface LeaderboardWrapperProps {
  data: LeaderboardItem[];
}

export default function LeaderboardWrapper({ data }: LeaderboardWrapperProps) {
  const processedData = data.map((item) => ({
    ...item,
    lastUpdated: new Date(item.lastUpdated),
  }));

  return <LeaderboardList data={processedData} />;
} 