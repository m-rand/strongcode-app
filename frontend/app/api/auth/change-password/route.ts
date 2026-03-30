import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword, newEmail } = await request.json()

    if (!currentPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const normalizedEmail = typeof newEmail === 'string' ? newEmail.trim().toLowerCase() : ''
    const wantsEmailChange = normalizedEmail.length > 0 && normalizedEmail !== session.user.email.toLowerCase()
    const wantsPasswordChange = typeof newPassword === 'string' && newPassword.length > 0

    if (!wantsEmailChange && !wantsPasswordChange) {
      return NextResponse.json({ error: 'No changes requested' }, { status: 400 })
    }

    if (wantsPasswordChange && newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (wantsEmailChange) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
    }

    const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    if (wantsEmailChange) {
      const [existingUser] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1)
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'Email is already in use' }, { status: 400 })
      }
    }

    const updates: Partial<typeof users.$inferInsert> = {}

    if (wantsPasswordChange) {
      updates.password = await bcrypt.hash(newPassword, 10)
    }

    if (wantsEmailChange) {
      updates.email = normalizedEmail
    }

    await db.update(users).set(updates).where(eq(users.id, user.id))

    return NextResponse.json({
      success: true,
      emailChanged: wantsEmailChange,
      passwordChanged: wantsPasswordChange,
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
