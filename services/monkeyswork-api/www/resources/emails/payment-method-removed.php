<?php /** @var string $userName @var string $methodType @var string $provider @var string $lastFour */ ?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Payment Method Removed 🗑️
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there') ?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    A payment method has been removed from your account.
</p>

<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;">
    <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;color:#374151;">
        <tr>
            <td style="font-weight:600;color:#9ca3af;">Type</td>
            <td align="right" style="font-weight:700;">
                <?= htmlspecialchars($methodType ?? 'Card') ?>
            </td>
        </tr>
        <tr>
            <td style="font-weight:600;color:#9ca3af;">Provider</td>
            <td align="right">
                <?= htmlspecialchars(ucfirst($provider ?? '—')) ?>
            </td>
        </tr>
        <tr>
            <td style="font-weight:600;color:#9ca3af;">Ending in</td>
            <td align="right">
                ••••
                <?= htmlspecialchars($lastFour ?? '••••') ?>
            </td>
        </tr>
        <tr>
            <td style="font-weight:600;color:#9ca3af;">Removed on</td>
            <td align="right">
                <?= date('M j, Y') ?>
            </td>
        </tr>
    </table>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="https://monkeysworks.com/dashboard/billing/payment-methods" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                Manage Payment Methods
            </a>
        </td>
    </tr>
</table>

<p style="font-size:12px;color:#9ca3af;margin-top:16px;">
    If you did not remove this payment method, please contact support immediately.
</p>