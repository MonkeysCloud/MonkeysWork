<?php /** @var string $userName @var string $role */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    You're All Set! 🚀
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Your email has been verified and your MonkeysWork account is now active. You're ready to go!
</p>

<?php if (($role ?? '') === 'freelancer'): ?>
<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#166534;">
        🎯 Get started as a freelancer:
    </p>
    <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#374151;line-height:1.8;">
        <li>Complete your profile with skills, bio, and hourly rate</li>
        <li>Browse available jobs that match your expertise</li>
        <li>Submit your first proposal</li>
    </ul>
</div>
<?php
else: ?>
<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#166534;">
        🎯 Get started as a client:
    </p>
    <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#374151;line-height:1.8;">
        <li>Post your first job listing</li>
        <li>Browse talented freelancers</li>
        <li>Review proposals and hire the best fit</li>
    </ul>
</div>
<?php
endif; ?>

<!-- CTA Button -->
<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="https://monkeysworks.com/dashboard" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                Go to Dashboard
            </a>
        </td>
    </tr>
</table>