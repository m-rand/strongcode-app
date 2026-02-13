import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'

interface InviteToken {
  token: string
  clientSlug: string
  email: string
  createdAt: string
  expiresAt: string
  used: boolean
}

interface User {
  id: string
  email: string
  password: string
  role: 'admin' | 'client'
  name: string
  client_slug?: string
}

const TOKENS_PATH = path.join(process.cwd(), '..', 'data', 'invite-tokens.json')
const USERS_PATH = path.join(process.cwd(), '..', 'data', 'users.json')

async function getTokens(): Promise<InviteToken[]> {
  try {
    const data = await fs.readFile(TOKENS_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveTokens(tokens: InviteToken[]): Promise<void> {
  await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2))
}

async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2))
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Validate token
    const tokens = await getTokens()
    const invite = tokens.find(t => t.token === token)

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      )
    }

    if (invite.used) {
      return NextResponse.json(
        { error: 'Token already used' },
        { status: 400 }
      )
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 400 }
      )
    }

    // Get client info
    const clientPath = path.join(process.cwd(), '..', 'data', 'clients', invite.clientSlug, 'profile.json')
    let clientName = invite.email
    try {
      const profileContent = await fs.readFile(clientPath, 'utf-8')
      const profile = JSON.parse(profileContent)
      clientName = profile.name
    } catch {
      // Use email as fallback
    }

    // Check if user already exists
    const users = await getUsers()
    if (users.find(u => u.email.toLowerCase() === invite.email.toLowerCase())) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const maxId = users.reduce((max, u) => Math.max(max, parseInt(u.id) || 0), 0)
    const newUser: User = {
      id: (maxId + 1).toString(),
      email: invite.email,
      password: hashedPassword,
      role: 'client',
      name: clientName,
      client_slug: invite.clientSlug
    }

    users.push(newUser)
    await saveUsers(users)

    // Mark token as used
    invite.used = true
    await saveTokens(tokens)

    return NextResponse.json({
      success: true,
      message: 'Registration complete'
    })
  } catch (error) {
    console.error('Error completing registration:', error)
    return NextResponse.json(
      { error: 'Failed to complete registration' },
      { status: 500 }
    )
  }
}
