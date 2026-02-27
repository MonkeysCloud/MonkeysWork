<?php /** @var string $userName @var string $verifyUrl */ ?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Welcome to MonkeysWork! 🎉
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there') ?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Thanks for signing up! Please verify your email address to activate your account and start using MonkeysWork.
</p>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 24px;">
            <a href="<?= htmlspecialchars($verifyUrl ?? '#') ?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                Verify My Email
            </a>
        </td>
    </tr>
</table>

<p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.5;">
    Or copy and paste this link into your browser:
</p>
<p style="margin:0 0 20px;font-size:12px;color:#9ca3af;word-break:break-all;">
    <?= htmlspecialchars($verifyUrl ?? '') ?>
</p>




<p style="margin:0;font-size:13px;color:#9ca3af;">
    This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
</p>