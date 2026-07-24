import { Resend } from "resend";

// resend.dev's shared sender works without domain verification — fine for
// a portfolio-scale app. Swap in a verified domain address once you have one.
const FROM_ADDRESS = "Ta <onboarding@resend.dev>";

export async function sendNudgeEmail(params: {
  to: string;
  participantName: string;
  organizerName: string;
  submitUrl: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — skipping nudge email");
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: `${params.organizerName}'s trip is waiting on you`,
      html: `
        <p>Hi ${params.participantName},</p>
        <p>The group is waiting on your trip preferences for ${params.organizerName}'s trip.</p>
        <p><a href="${params.submitUrl}">Submit your preferences</a></p>
      `,
    });

    if (error) {
      console.error("Failed to send nudge email", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to send nudge email", err);
    return false;
  }
}
