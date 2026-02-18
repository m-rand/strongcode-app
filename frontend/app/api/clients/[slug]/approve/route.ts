import { NextResponse } from 'next/server'
import { db } from '@/db'
import { clients } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const [client] = await db.select().from(clients).where(eq(clients.slug, slug)).limit(1)

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    if (client.status === 'active') {
      return NextResponse.json(
        { error: 'Client is already active' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    await db.update(clients)
      .set({
        status: 'active',
        lastModified: now,
      })
      .where(eq(clients.slug, slug))

    return NextResponse.json({
      success: true,
      message: 'Client approved successfully'
    })
  } catch (error) {
    console.error('Error approving client:', error)
    return NextResponse.json(
      { error: 'Failed to approve client' },
      { status: 500 }
    )
  }
}
