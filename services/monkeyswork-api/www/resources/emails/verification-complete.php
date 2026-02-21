<?php /** @var string $userName @var string $entityType @var string $entityTitle @var string $dashboardUrl */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    <?= htmlspecialchars(ucfirst($entityType ?? 'Profile'))?> Verified ✅
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Your
    <?= htmlspecialchars($entityType ?? 'profile')?>
    <?php if (!empty($entityTitle)): ?>
    <strong>&ldquo;
        <?= htmlspecialchars($entityTitle)?>&rdquo;
    </strong>
    <?php
endif; ?>
    has been reviewed and verified. You now have a verified badge!
</p>

<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">
        🛡️ <strong>Verified accounts</strong> get higher visibility in search results and more trust from clients and
        freelancers.
    </p>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($dashboardUrl ?? 'https://monkeysworks.com/dashboard')?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                Go to Dashboard
            </a>
        </td>
    </tr>
</table>