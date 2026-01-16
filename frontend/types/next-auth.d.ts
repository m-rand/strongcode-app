import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'admin' | 'client'
      client_slug?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'admin' | 'client'
    client_slug?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    client_slug?: string
  }
}
