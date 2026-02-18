import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { db } from '@/db'
import { inviteTokens, clients } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const { clientSlug, email, name } = await request.json()

    if (!clientSlug || !email) {
      return NextResponse.json(
        { error: 'Client slug and email are required' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hours

    // Remove any existing tokens for this client
    await db.delete(inviteTokens).where(eq(inviteTokens.clientSlug, clientSlug))

    // Save new token
    await db.insert(inviteTokens).values({
      token,
      clientSlug,
      email,
      used: false,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })

    // Build registration URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const registerUrl = `${baseUrl}/register?token=${token}`

    // Send email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'info@strong-code.com'

      const result = await resend.emails.send({
        from: `StrongCode <${fromEmail}>`,
        to: email,
        subject: 'Welcome to StrongCode - Complete Your Registration',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e40af;">Welcome to StrongCode</h1>
            <p>Hi ${name || 'there'},</p>
            <p>You've been invited to join StrongCode. Click the button below to create your password and complete your registration.</p>
            <p style="margin: 30px 0;">
              <a href="${registerUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Complete Registration
              </a>
            </p>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 48 hours.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't expect this email, you can safely ignore it.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="color: #9ca3af; font-size: 12px;">StrongCode - Strength Training Programs</p>
          </div>
        `
      })

      if (result.error) {
        console.error('Failed to send invite email:', result.error)
        return NextResponse.json({
          success: false,
          error: result.error.message || 'Failed to send email',
          registerUrl
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Invitation sent successfully',
        emailSent: true
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Invitation created',
        emailSent: false,
        registerUrl
      })
    }
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}

// Validate token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenValue = searchParams.get('token')

    if (!tokenValue) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const [invite] = await db
      .select()
      .from(inviteTokens)
      .where(eq(inviteTokens.token, tokenValue))
      .limit(1)

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid token', valid: false },
        { status: 404 }
      )
    }

    if (invite.used) {
      return NextResponse.json(
        { error: 'Token already used', valid: false },
        { status: 400 }
      )
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Token expired', valid: false },
        { status: 400 }
      )
    }

    // Get client name
    const [client] = await db
      .select({ name: clients.name })
      .from(clients)
      .where(eq(clients.slug, invite.clientSlug))
      .limit(1)

    return NextResponse.json({
      valid: true,
      email: invite.email,
      clientSlug: invite.clientSlug,
      clientName: client?.name || ''
    })
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    )
  }
}
