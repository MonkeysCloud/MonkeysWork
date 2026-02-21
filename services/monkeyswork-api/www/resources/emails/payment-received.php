<?php /** @var string $userName @var string $amount @var string $currency @var string $contractTitle @var string $paymentType @var string $billingUrl */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Payment
    <?=($paymentType ?? '') === 'received' ? 'Received' : 'Processed'?> 💰
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    <?php if (($paymentType ?? '') === 'received'): ?>
    You received a payment of <strong>
        <?= htmlspecialchars($currency ?? 'USD')?>
        <?= htmlspecialchars($amount ?? '0.00')?>
    </strong>
    for <strong>&ldquo;
        <?= htmlspecialchars($contractTitle ?? '')?>&rdquo;
    </strong>.
    <?php
else: ?>
    A payment of <strong>
        <?= htmlspecialchars($currency ?? 'USD')?>
        <?= htmlspecialchars($amount ?? '0.00')?>
    </strong>
    has been processed for <strong>&ldquo;
        <?= htmlspecialchars($contractTitle ?? '')?>&rdquo;
    </strong>.
    <?php
endif; ?>
</p>

<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;">
    <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;color:#374151;">
        <tr>
            <td style="font-weight:600;color:#9ca3af;">Amount</td>
            <td align="right" style="font-weight:700;">
                <?= htmlspecialchars($currency ?? 'USD')?>
                <?= htmlspecialchars($amount ?? '0.00')?>
            </td>
        </tr>
        <tr>
            <td style="font-weight:600;color:#9ca3af;">Contract</td>
            <td align="right">
                <?= htmlspecialchars($contractTitle ?? '—')?>
            </td>
        </tr>
        <tr>
            <td style="font-weight:600;color:#9ca3af;">Date</td>
            <td align="right">
                <?= date('M j, Y')?>
            </td>
        </tr>
    </table>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($billingUrl ?? 'https://monkeysworks.com/dashboard/billing')?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                View Billing
            </a>
        </td>
    </tr>
</table>