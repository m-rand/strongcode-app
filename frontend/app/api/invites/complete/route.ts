import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { inviteTokens, users, clients } from '@/db/schema'
import { eq } from 'drizzle-orm'

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
    const [invite] = await db
      .select()
      .from(inviteTokens)
      .where(eq(inviteTokens.token, token))
      .limit(1)

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

    // Get client name
    const [client] = await db
      .select({ name: clients.name })
      .from(clients)
      .where(eq(clients.slug, invite.clientSlug))
      .limit(1)

    const clientName = client?.name || invite.email

    // Check if user already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, invite.email))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10)

    await db.insert(users).values({
      email: invite.email,
      password: hashedPassword,
      role: 'client',
      name: clientName,
      clientSlug: invite.clientSlug,
      createdAt: new Date().toISOString(),
    })

    // Mark token as used
    await db.update(inviteTokens)
      .set({ used: true })
      .where(eq(inviteTokens.token, token))

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
