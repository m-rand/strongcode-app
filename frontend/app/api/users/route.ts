import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

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
  try {
    const data = await fs.readFile(usersPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function saveUsers(users: User[]): Promise<void> {
  const usersPath = path.join(process.cwd(), '..', 'data', 'users.json')
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2))
}

// Generate a random password
function generatePassword(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, role, client_slug, password: providedPassword } = body

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    if (role === 'client' && !client_slug) {
      return NextResponse.json(
        { error: 'Client slug is required for client users' },
        { status: 400 }
      )
    }

    const users = await getUsers()

    // Check if user with this email already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Generate or use provided password
    const plainPassword = providedPassword || generatePassword()
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    // Generate unique ID
    const maxId = users.reduce((max, u) => Math.max(max, parseInt(u.id) || 0), 0)
    const newId = (maxId + 1).toString()

    const newUser: User = {
      id: newId,
      email,
      password: hashedPassword,
      role: role || 'client',
      name,
      ...(client_slug && { client_slug })
    }

    users.push(newUser)
    await saveUsers(users)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        client_slug: newUser.client_slug
      },
      // Return plain password only on creation (it's hashed in storage)
      temporaryPassword: plainPassword
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}

// Get user by client_slug
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientSlug = searchParams.get('client_slug')

    if (!clientSlug) {
      return NextResponse.json(
        { error: 'client_slug parameter is required' },
        { status: 400 }
      )
    }

    const users = await getUsers()
    const user = users.find(u => u.client_slug === clientSlug)

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        client_slug: user.client_slug
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// Delete user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const users = await getUsers()
    const userIndex = users.findIndex(u => u.id === userId)

    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Don't allow deleting admin users
    if (users[userIndex].role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      )
    }

    users.splice(userIndex, 1)
    await saveUsers(users)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
