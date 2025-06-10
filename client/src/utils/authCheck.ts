// Simple authentication check utility that bypasses React Query
export async function checkUserAuthentication(): Promise<{ authenticated: boolean; user?: any }> {
  try {
    const response = await fetch('/api/user', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

    if (response.ok) {
      const userData = await response.json();
      if (userData && userData.id) {
        return { authenticated: true, user: userData };
      }
    }
    
    return { authenticated: false };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return { authenticated: false };
  }
}

export async function navigateToSponsorshipOrAuth(navigate: (path: string) => void): Promise<void> {
  const { authenticated } = await checkUserAuthentication();
  
  if (authenticated) {
    navigate('/sponsorship-application');
  } else {
    navigate('/auth');
  }
}