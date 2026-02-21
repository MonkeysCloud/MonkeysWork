<?php /** @var string $userName @var string $contractTitle @var string $otherPartyName @var string $contractUrl */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Contract Accepted! 🎉
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Your contract <strong>&ldquo;
        <?= htmlspecialchars($contractTitle ?? '')?>&rdquo;
    </strong>
    with <strong>
        <?= htmlspecialchars($otherPartyName ?? '')?>
    </strong> has been accepted and is now active.
</p>

<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">
        ✅ You can now start working on milestones, track time, and communicate through the platform.
    </p>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($contractUrl ?? 'https://monkeysworks.com/dashboard/contracts')?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                View Contract
            </a>
        </td>
    </tr>
</table>