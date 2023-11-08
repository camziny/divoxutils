"use client";
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

interface UserContextType {
  user: any;
  setUser: (user: any) => void;
}

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

interface UserProviderProps {
  children: ReactNode;
  initialToken?: string;
}

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
  initialToken = "",
}) => {
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    async function fetchUserDetails() {
      try {
        const response = await fetch("/api/userDetails", {
          headers: {
            Authorization: `Bearer ${initialToken}`,
          },
        });
        const userData = await response.json();
        if (response.ok) {
          setUser(userData);
        } else {
          console.error("Failed to fetch user details:", userData.message);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }

    if (initialToken) {
      fetchUserDetails();
    }
  }, [initialToken]);

  console.log("UserProvider is rendering");

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  console.log("Context value:", context);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
