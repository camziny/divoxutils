import { useState, useEffect } from "react";

interface GroupData {
  name: string;
}

const useFetchGroupByClerkUserId = (clerkUserId: string) => {
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroup = async () => {
      if (!clerkUserId) return;
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/group/${clerkUserId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch group: ${response.statusText}`);
        }
        const data = await response.json();
        setGroupData(data);
      } catch (error) {
        console.error("Error fetching group by clerkUserId:", error);
        setError("Failed to load group information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroup();
  }, [clerkUserId]);

  return { groupData, isLoading, error };
};

export default useFetchGroupByClerkUserId;
