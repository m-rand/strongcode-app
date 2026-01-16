import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'

interface User {
  id: string
  email: string
  password: string
  role: 'admin' | 'client'
  name: string
  client_slug?: string
}

async function getUsers(): Promise<User[]> {
  const usersPath = path.join(process.cwd(), '..', 'data', 'users.json')
  const data = await fs.readFile(usersPath, 'utf-8')
  return JSON.parse(data)
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const users = await getUsers()
    const user = users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Return user without password
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      client_slug: user.client_slug,
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
