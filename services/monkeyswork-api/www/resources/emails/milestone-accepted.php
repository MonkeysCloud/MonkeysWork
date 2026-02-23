<?php /** @var string $userName @var string $milestoneTitle @var string $contractTitle @var string $clientName @var string $amount @var string $commission @var string $netAmount @var string $milestoneUrl */ ?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Milestone Accepted! 🎉
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there') ?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Great news! <strong>
        <?= htmlspecialchars($clientName ?? 'The client') ?>
    </strong> has accepted milestone
    &ldquo;<strong>
        <?= htmlspecialchars($milestoneTitle ?? '') ?>
    </strong>&rdquo;
    on contract &ldquo;
    <?= htmlspecialchars($contractTitle ?? '') ?>&rdquo;.
</p>

<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#374151;">
        <tr>
            <td style="padding:4px 0;color:#64748b;">Milestone Amount</td>
            <td align="right" style="padding:4px 0;font-weight:700;">
                <?= htmlspecialchars($amount ?? '') ?>
            </td>
        </tr>
        <tr>
            <td style="padding:4px 0;color:#64748b;">Platform Fee</td>
            <td align="right" style="padding:4px 0;color:#dc2626;">-
                <?= htmlspecialchars($commission ?? '') ?>
            </td>
        </tr>
        <tr>
            <td colspan="2" style="border-top:1px solid #dcfce7;padding-top:8px;margin-top:4px;"></td>
        </tr>
        <tr>
            <td style="padding:4px 0;font-weight:700;color:#166534;">You Receive</td>
            <td align="right" style="padding:4px 0;font-weight:700;color:#166534;font-size:16px;">
                <?= htmlspecialchars($netAmount ?? '') ?>
            </td>
        </tr>
    </table>
</div>

<p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6;">
    💰 Funds have been released from escrow and will be available in your account shortly.
</p>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($milestoneUrl ?? 'https://monkeysworks.com/dashboard/milestones') ?>" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(22,163,74,0.3);">
                View Details
            </a>
        </td>
    </tr>
</table>