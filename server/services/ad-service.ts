import { Client } from 'ldapts';

// Mock user data for development mode
const MOCK_USERS: Record<string, string> = {
  'john.doe': 'John Doe',
  'jane.smith': 'Jane Smith',
  'admin': 'Administrator',
  'test.user': 'Test User',
  'bob.johnson': 'Bob Johnson',
  'alice.williams': 'Alice Williams',
};

interface ADConfig {
  url: string;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
}

class ActiveDirectoryService {
  private config: ADConfig | null = null;
  private useMockMode: boolean;

  constructor() {
    // Use mock mode by default, can be overridden by AD_ENABLED env var
    this.useMockMode = process.env.AD_ENABLED !== 'true';
    
    if (!this.useMockMode) {
      this.config = {
        url: process.env.AD_URL || '',
        baseDN: process.env.AD_BASE_DN || '',
        bindDN: process.env.AD_BIND_DN || '',
        bindPassword: process.env.AD_BIND_PASSWORD || '',
      };

      if (!this.config.url || !this.config.baseDN || !this.config.bindDN || !this.config.bindPassword) {
        console.warn('Active Directory configuration incomplete. Falling back to mock mode.');
        this.useMockMode = true;
      } else {
        console.log('Active Directory integration enabled');
      }
    } else {
      console.log('Active Directory mock mode enabled (development)');
    }
  }

  /**
   * Create a fresh LDAP client for a single operation
   * This prevents concurrency issues with parallel requests
   */
  private createClient(): Client {
    if (!this.config) {
      throw new Error('AD configuration not available');
    }
    return new Client({
      url: this.config.url,
      timeout: 5000,
      connectTimeout: 5000,
    });
  }

  /**
   * Get user's full name from Active Directory by their login
   * @param login - User's login/username
   * @returns Full name of the user or the login if not found
   */
  async getUserFullName(login: string): Promise<string> {
    if (!login) {
      return '';
    }

    // Use mock data in development mode
    if (this.useMockMode) {
      return MOCK_USERS[login] || login;
    }

    if (!this.config) {
      return login;
    }

    // Create a fresh client for this operation to avoid concurrency issues
    const client = this.createClient();

    try {
      // Bind to AD server
      await client.bind(this.config.bindDN, this.config.bindPassword);

      // Search for user by sAMAccountName (login)
      const searchOptions = {
        filter: `(sAMAccountName=${login})`,
        scope: 'sub' as const,
        attributes: ['cn'], // cn = Common Name (full name)
      };

      const { searchEntries } = await client.search(this.config.baseDN, searchOptions);

      if (searchEntries.length > 0) {
        const cn = searchEntries[0].cn;
        // cn can be a string, Buffer, or array - handle all cases
        if (Array.isArray(cn)) {
          const first = cn[0];
          return Buffer.isBuffer(first) ? first.toString() : first;
        }
        return Buffer.isBuffer(cn) ? cn.toString() : cn;
      }

      // If user not found, return the login
      return login;
    } catch (error) {
      console.error(`Error fetching user from Active Directory (${login}):`, error);
      return login;
    } finally {
      // Always unbind the client to clean up the connection
      try {
        await client.unbind();
      } catch (unbindError) {
        // Ignore unbind errors
      }
    }
  }

  /**
   * Get full names for multiple users in parallel
   * @param logins - Array of user logins
   * @returns Object mapping logins to full names
   */
  async getUsersFullNames(logins: string[]): Promise<Record<string, string>> {
    const uniqueLogins = Array.from(new Set(logins.filter(login => login)));
    
    const results = await Promise.all(
      uniqueLogins.map(async (login) => ({
        login,
        fullName: await this.getUserFullName(login),
      }))
    );

    return results.reduce((acc, { login, fullName }) => {
      acc[login] = fullName;
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Add a mock user for development/testing
   * Only works in mock mode
   */
  addMockUser(login: string, fullName: string): void {
    if (this.useMockMode) {
      MOCK_USERS[login] = fullName;
    }
  }

  /**
   * Check if the service is running in mock mode
   */
  isMockMode(): boolean {
    return this.useMockMode;
  }
}

// Export singleton instance
export const adService = new ActiveDirectoryService();
