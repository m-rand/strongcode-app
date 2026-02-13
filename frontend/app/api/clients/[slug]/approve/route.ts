import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const clientPath = path.join(process.cwd(), '..', 'data', 'clients', slug)
    const profilePath = path.join(clientPath, 'profile.json')

    // Check if client exists
    try {
      await fs.access(profilePath)
    } catch {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Read and update profile
    const profileContent = await fs.readFile(profilePath, 'utf-8')
    const profile = JSON.parse(profileContent)

    if (profile.status === 'active') {
      return NextResponse.json(
        { error: 'Client is already active' },
        { status: 400 }
      )
    }

    // Update status
    profile.status = 'active'
    profile._meta = {
      ...profile._meta,
      approved_at: new Date().toISOString(),
      last_modified: new Date().toISOString()
    }

    await fs.writeFile(profilePath, JSON.stringify(profile, null, 2))

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
