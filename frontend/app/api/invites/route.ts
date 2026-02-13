import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
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

const TOKENS_PATH = path.join(process.cwd(), '..', 'data', 'invite-tokens.json')

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

    // Save token
    const tokens = await getTokens()

    // Remove any existing tokens for this client
    const filteredTokens = tokens.filter(t => t.clientSlug !== clientSlug)

    filteredTokens.push({
      token,
      clientSlug,
      email,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      used: false
    })

    await saveTokens(filteredTokens)

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
          registerUrl // Fallback - provide URL anyway
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Invitation sent successfully',
        emailSent: true
      })
    } else {
      // No email configured, return the link for manual sharing
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
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const tokens = await getTokens()
    const invite = tokens.find(t => t.token === token)

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

    // Get client info
    const clientPath = path.join(process.cwd(), '..', 'data', 'clients', invite.clientSlug, 'profile.json')
    let clientName = ''
    try {
      const profileContent = await fs.readFile(clientPath, 'utf-8')
      const profile = JSON.parse(profileContent)
      clientName = profile.name
    } catch {
      // Client not found
    }

    return NextResponse.json({
      valid: true,
      email: invite.email,
      clientSlug: invite.clientSlug,
      clientName
    })
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    )
  }
}
