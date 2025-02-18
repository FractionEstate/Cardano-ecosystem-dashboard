import { cache } from "react"

// In a real-world scenario, this would be stored securely, not in code
const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "password123"

export const authenticate = cache(async (username: string, password: string): Promise<boolean> => {
  // Simulate a delay to mimic a real authentication process
  await new Promise((resolve) => setTimeout(resolve, 500))
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
})

