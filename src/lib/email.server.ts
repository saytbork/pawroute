// Resend email delivery. Returns an honest status; never throws into the booking flow.

export type EmailStatus = "sent" | "failed" | "unconfigured";

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

export async function sendEmail(
  to: string,
  subject: string,
  lines: string[],
  link?: { href: string; label: string },
): Promise<EmailStatus> {
  const key = process.env["RESEND_API_KEY"];
  const from = process.env["FROM_EMAIL"];
  if (!key || !from) return "unconfigured";
  const html = `<div style="font-family:Arial,sans-serif;color:#1f2a24;line-height:1.5">${lines
    .map((l) => `<p>${esc(l)}</p>`)
    .join("")}${link ? `<p><a href="${esc(link.href)}">${esc(link.label)}</a></p>` : ""}</div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      console.error(`Resend failed [${res.status}]: ${await res.text()}`);
      return "failed";
    }
    return "sent";
  } catch (e) {
    console.error("Resend error", e);
    return "failed";
  }
}