// Simple authentication check utility that bypasses React Query
export async function checkUserAuthentication(): Promise<{ authenticated: boolean; user?: any }> {
  console.log('Starting authentication check...');
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

    console.log('Auth response status:', response.status);

    if (response.ok) {
      const userData = await response.json();
      console.log('Auth response data:', userData);
      if (userData && userData.id) {
        console.log('User authenticated successfully');
        return { authenticated: true, user: userData };
      }
    }
    
    console.log('User not authenticated');
    return { authenticated: false };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return { authenticated: false };
  }
}

export async function navigateToSponsorshipOrAuth(navigate: (path: string) => void): Promise<void> {
  console.log('Checking auth status for sponsorship navigation...');
  const { authenticated } = await checkUserAuthentication();
  
  if (authenticated) {
    console.log('Navigating to sponsorship application...');
    navigate('/sponsorship-application');
  } else {
    console.log('Navigating to auth page...');
    navigate('/auth');
  }
}