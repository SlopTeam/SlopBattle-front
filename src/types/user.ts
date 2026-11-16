export interface User {
  id: number
  email: string
  /** Null until the user picks one: the back-end does not ask for it at registration */
  username: string | null
  avatarUrl: string | null
  coins: number
  /** ISO date */
  createdAt: string
}
