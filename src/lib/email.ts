import { Resend } from 'resend';
import { getServiceSupabase } from './supabase';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'; // Resend test email default

export async function sendTeamInviteEmail(to: string, workspaceName: string, inviteUrl: string, workspaceId: string) {
  const resend = getResend();
  if (!resend) return false;

  try {
    const { error } = await resend.emails.send({
      from: `PassportKit <${FROM_EMAIL}>`,
      to,
      subject: `You've been invited to join ${workspaceName} on PassportKit`,
      html: `
        <p>You have been invited to collaborate on Product Passports in the <strong>${workspaceName}</strong> workspace.</p>
        <p><a href="${inviteUrl}">Click here to accept the invitation</a></p>
      `
    });
    
    if (error) throw error;
    
    const supabase = getServiceSupabase();
    await supabase.from('email_logs').insert({
      workspace_id: workspaceId,
      to_email: to,
      template: 'team_invite',
      status: 'sent',
      provider_id: 'resend'
    });
    
    return true;
  } catch (err: any) {
    const supabase = getServiceSupabase();
    await supabase.from('email_logs').insert({
      workspace_id: workspaceId,
      to_email: to,
      template: 'team_invite',
      status: 'failed',
      provider_id: 'resend',
      error: err.message
    });
    return false;
  }
}

export async function sendPassportPublishedEmail(to: string, productName: string, url: string, workspaceId: string, userId: string) {
  const resend = getResend();
  if (!resend) return false;

  try {
    const supabase = getServiceSupabase();
    // Check preferences
    const { data: prefs } = await supabase.from('email_preferences').select('send_passport_published_email').eq('workspace_id', workspaceId).single();
    if (prefs && prefs.send_passport_published_email === false) return false;

    const { error } = await resend.emails.send({
      from: `PassportKit <${FROM_EMAIL}>`,
      to,
      subject: `Your passport for ${productName} is live!`,
      html: `
        <p>Success! Your digital product passport for <strong>${productName}</strong> has been published.</p>
        <p><a href="${url}">View your public passport</a></p>
      `
    });
    
    if (error) throw error;
    
    await supabase.from('email_logs').insert({
      workspace_id: workspaceId,
      user_id: userId,
      to_email: to,
      template: 'passport_published',
      status: 'sent',
      provider_id: 'resend'
    });
    return true;
  } catch (err) {
    return false;
  }
}

export async function sendBillingIssueEmail(to: string, workspaceName: string, workspaceId: string) {
  const resend = getResend();
  if (!resend) return false;
  try {
    const supabase = getServiceSupabase();
    const { data: prefs } = await supabase.from('email_preferences').select('send_billing_issue_email').eq('workspace_id', workspaceId).single();
    if (prefs && prefs.send_billing_issue_email === false) return false;

    await resend.emails.send({
      from: `PassportKit <${FROM_EMAIL}>`,
      to,
      subject: `Action Required: Billing issue for ${workspaceName}`,
      html: `
        <p>We encountered an issue processing the subscription payment for <strong>${workspaceName}</strong>.</p>
        <p>Please log in to your dashboard to update your payment method in Stripe.</p>
      `
    });
    return true;
  } catch (err) {
    return false;
  }
}
