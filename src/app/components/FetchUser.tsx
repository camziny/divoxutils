"use client";
import { useState, useEffect } from "react";

interface User {
  id: number;
  clerkUserId: string;
  name: string;
}

const useFetchUser = (clerkUserId: string) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!clerkUserId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/users/${clerkUserId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error("Fetch user error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clerkUserId]);

  return { userData, isLoading };
};

export default useFetchUser;
