
// This file is no longer needed as we're using server-side types from shared/schema.ts
// Keeping it for backward compatibility during migration
export interface User {
  id: number
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}
