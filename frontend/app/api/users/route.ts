import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

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

    // Check if user exists
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    const plainPassword = providedPassword || generatePassword()
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    const [newUser] = await db.insert(users).values({
      email,
      password: hashedPassword,
      role: role || 'client',
      name,
      clientSlug: client_slug || null,
      createdAt: new Date().toISOString(),
    }).returning()

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        client_slug: newUser.clientSlug,
      },
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

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clientSlug, clientSlug))
      .limit(1)

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        client_slug: user.clientSlug,
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

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 403 }
      )
    }

    await db.delete(users).where(eq(users.id, parseInt(userId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
