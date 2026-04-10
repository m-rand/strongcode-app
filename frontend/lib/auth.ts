import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { users } from '@/db/schema'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const email = String(credentials.email).trim().toLowerCase()
          const password = String(credentials.password)

          const [user] = await db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${email}`)
            .limit(1)

          if (!user) {
            return null
          }

          const passwordMatch = await bcrypt.compare(password, user.password)
          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            client_slug: user.clientSlug,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.client_slug = user.client_slug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "client" | "admin"
        session.user.client_slug = token.client_slug as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
