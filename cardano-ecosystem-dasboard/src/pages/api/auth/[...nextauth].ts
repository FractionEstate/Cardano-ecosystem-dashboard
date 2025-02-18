import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // In a real application, you would check the credentials against your database
        if (credentials?.username === "admin" && credentials?.password === "password") {
          return { id: "1", name: "Admin" }
        } else {
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/admin/login",
  },
})

