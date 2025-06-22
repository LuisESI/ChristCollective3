import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export interface CreatorStatus {
  isCreator: boolean;
  creatorProfile?: {
    id: number;
    name: string;
    content: string;
    audience?: string;
    bio?: string;
    isSponsored: boolean;
    platforms: any[];
    profileImage?: string;
  };
}

export function useCreatorStatus() {
  const { user } = useAuth();

  return useQuery<CreatorStatus>({
    queryKey: ['/api/user/creator-status'],
    queryFn: async () => {
      if (!user) {
        return { isCreator: false };
      }
      
      const response = await fetch('/api/user/creator-status');
      if (!response.ok) {
        if (response.status === 404) {
          return { isCreator: false };
        }
        throw new Error('Failed to fetch creator status');
      }
      return response.json();
    },
    enabled: !!user,
  });
}