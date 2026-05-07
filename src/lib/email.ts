import { Resend } from "resend";
import { format } from "date-fns";
import { SHOP_NAME } from "./constants";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? `${SHOP_NAME} <noreply@barbershop.com>`;
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

function baseTemplate(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #383838; }
    .header { background-color: #D4AF37; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: #0f0f0f; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
    .body { padding: 32px; color: #e3e3e3; }
    .body p { margin: 0 0 16px; font-size: 15px; line-height: 1.6; }
    .detail-box { background-color: #383838; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .detail-box .label { color: #818181; font-size: 12px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
    .detail-box .value { color: #fff; font-size: 16px; font-weight: 600; }
    .btn { display: inline-block; background-color: #D4AF37; color: #0f0f0f; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin-top: 8px; }
    .footer { padding: 20px 32px; border-top: 1px solid #383838; color: #666; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>✂ ${SHOP_NAME}</h1></div>
    <div class="body">${bodyHtml}</div>
    <div class="footer">You received this email because you have an account on the ${SHOP_NAME} Swap System.</div>
  </div>
</body>
</html>`;
}

export async function sendSwapRequestEmail({
  to,
  toName,
  requesterName,
  listedDate,
  listedTime,
  offeredDate,
  offeredTime,
  swapRequestId,
}: {
  to: string;
  toName: string;
  requesterName: string;
  listedDate: Date;
  listedTime: string;
  offeredDate: Date;
  offeredTime: string;
  swapRequestId: string;
}) {
  const formattedListedDate = format(listedDate, "EEEE, MMMM d, yyyy");
  const formattedOfferedDate = format(offeredDate, "EEEE, MMMM d, yyyy");

  const body = `
    <p>Hi <strong>${toName}</strong>,</p>
    <p><strong>${requesterName}</strong> wants to swap appointments with you.</p>
    <div class="detail-box">
      <div class="label">Your appointment (will be traded away)</div>
      <div class="value">${formattedListedDate} at ${listedTime}</div>
    </div>
    <div class="detail-box">
      <div class="label">Their appointment (you would receive)</div>
      <div class="value">${formattedOfferedDate} at ${offeredTime}</div>
    </div>
    <p>Log in to accept or reject this swap request.</p>
    <a class="btn" href="${BASE_URL}/notifications">View Swap Request</a>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Swap Request from ${requesterName} — ${SHOP_NAME}`,
    html: baseTemplate("Swap Request", body),
  });
}

export async function sendSwapAcceptedEmail({
  to,
  toName,
  newDate,
  newTime,
  oldDate,
  oldTime,
}: {
  to: string;
  toName: string;
  newDate: Date;
  newTime: string;
  oldDate: Date;
  oldTime: string;
}) {
  const formattedNew = format(newDate, "EEEE, MMMM d, yyyy");
  const formattedOld = format(oldDate, "EEEE, MMMM d, yyyy");

  const body = `
    <p>Hi <strong>${toName}</strong>,</p>
    <p>Your swap has been <strong>confirmed</strong>! Your appointment has been updated:</p>
    <div class="detail-box">
      <div class="label">Previous appointment</div>
      <div class="value" style="text-decoration:line-through;color:#818181">${formattedOld} at ${oldTime}</div>
    </div>
    <div class="detail-box">
      <div class="label">New appointment ✓</div>
      <div class="value">${formattedNew} at ${newTime}</div>
    </div>
    <p>Please update your appointment on the booking site to reflect this change.</p>
    <a class="btn" href="${BASE_URL}/appointments">View My Appointments</a>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Swap Confirmed — ${SHOP_NAME}`,
    html: baseTemplate("Swap Confirmed", body),
  });
}

export async function sendSwapRejectedEmail({
  to,
  toName,
  listingOwnerName,
  offeredDate,
  offeredTime,
}: {
  to: string;
  toName: string;
  listingOwnerName: string;
  offeredDate: Date;
  offeredTime: string;
}) {
  const formattedDate = format(offeredDate, "EEEE, MMMM d, yyyy");

  const body = `
    <p>Hi <strong>${toName}</strong>,</p>
    <p><strong>${listingOwnerName}</strong> has declined your swap request for the ${formattedDate} at ${offeredTime} slot.</p>
    <p>Your appointment remains unchanged. You can browse the swap board for other available swaps.</p>
    <a class="btn" href="${BASE_URL}/swap-board">Browse Swap Board</a>
  `;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Swap Request Declined — ${SHOP_NAME}`,
    html: baseTemplate("Swap Declined", body),
  });
}
