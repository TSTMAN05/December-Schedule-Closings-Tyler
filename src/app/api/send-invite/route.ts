import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

interface InvitationData {
  id: string
  email: string
  token: string
  expires_at: string
  law_firms: {
    name: string
  } | null
  profiles: {
    full_name: string
  } | null
}

export async function POST(request: NextRequest) {
  try {
    const { invitationId } = await request.json()

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get invitation details with law firm info
    const { data: invitation, error: inviteError } = await supabase
      .from('attorney_invitations')
      .select(
        `
        id,
        email,
        token,
        expires_at,
        law_firms (
          name
        ),
        profiles:invited_by (
          full_name
        )
      `
      )
      .eq('id', invitationId)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    const invitationData = invitation as unknown as InvitationData

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/invite/attorney/${invitationData.token}`
    const firmName = invitationData.law_firms?.name || 'A law firm'
    const inviterName = invitationData.profiles?.full_name || 'The firm owner'
    const expiresAt = new Date(invitationData.expires_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Schedule Closings <noreply@scheduleclosings.com>',
      to: invitationData.email,
      subject: `You've been invited to join ${firmName} on Schedule Closings`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Schedule Closings</h1>
          </div>

          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1f2937; margin-top: 0;">You're Invited!</h2>

            <p style="color: #4b5563; font-size: 16px;">
              <strong>${inviterName}</strong> has invited you to join <strong>${firmName}</strong> as an attorney on Schedule Closings.
            </p>

            <p style="color: #4b5563; font-size: 16px;">
              Schedule Closings is a platform that helps law firms manage real estate closings efficiently. As an attorney, you'll be able to:
            </p>

            <ul style="color: #4b5563; font-size: 16px;">
              <li>View and manage assigned closing orders</li>
              <li>Track upcoming closings</li>
              <li>Update order status in real-time</li>
              <li>Access customer and property information</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Accept Invitation
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              This invitation expires on <strong>${expiresAt}</strong>.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

            <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>

            <p style="color: #9ca3af; font-size: 12px;">
              Button not working? Copy and paste this link into your browser:<br>
              <a href="${inviteLink}" style="color: #2563eb; word-break: break-all;">${inviteLink}</a>
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Schedule Closings. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error) {
    console.error('Send invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
