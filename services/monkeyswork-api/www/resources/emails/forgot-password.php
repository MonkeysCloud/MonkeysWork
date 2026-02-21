<?php /** @var string $userName @var string $resetUrl */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Reset Your Password 🔐
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    We received a request to reset your password. Click the button below to choose a new one.
</p>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 24px;">
            <a href="<?= htmlspecialchars($resetUrl ?? '#')?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                Reset Password
            </a>
        </td>
    </tr>
</table>

<p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.5;">
    Or copy and paste this link into your browser:
</p>
<p style="margin:0 0 20px;font-size:12px;color:#9ca3af;word-break:break-all;">
    <?= htmlspecialchars($resetUrl ?? '')?>
</p>

<div style="background:#fef3c7;border-radius:8px;padding:14px 16px;margin:0 0 16px;">
    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
        📬 <strong>Can't find this email?</strong> Check your spam or junk folder.
    </p>
</div>

<p style="margin:0;font-size:13px;color:#9ca3af;">
    This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
</p>