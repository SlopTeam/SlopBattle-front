// Mocked data until the back-end is available.
import type { User } from '@/types/user'

/** Password kept in clear text: mock only, a real back-end never sends it back */
export interface MockAccount extends User {
  password: string
}

// TODO : remove mockup data for "real" data
export const DEMO_ACCOUNT: MockAccount = {
  id: 1,
  username: 'Demo',
  email: 'demo@slopbattle.gg',
  password: 'demo1234',
}

export const mockAccounts: MockAccount[] = [DEMO_ACCOUNT]
