<?php
/**
 * Weekly charge summary email for clients.
 *
 * @var string $userName
 * @var string $totalAmount    e.g. "$1,050.00"
 * @var string $totalFees      e.g. "$50.00"
 * @var string $subtotal       e.g. "$1,000.00"
 * @var array  $charges        [{contractTitle, subtotal, fee, amount, hours}]
 * @var string $billingUrl
 */
?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Weekly Billing Summary 💰
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi <?= htmlspecialchars($userName ?? 'there') ?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Here's a summary of your charges this week. A total of
    <strong><?= htmlspecialchars($totalAmount ?? '$0.00') ?></strong>
    has been processed across <?= count($charges ?? []) ?> contract<?= count($charges ?? []) !== 1 ? 's' : '' ?>.
</p>

<!-- Charges breakdown -->
<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;">
    <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#374151;">
        <thead>
            <tr style="border-bottom:2px solid #e5e7eb;">
                <th align="left" style="font-weight:600;color:#6b7280;padding-bottom:8px;">Contract</th>
                <th align="right" style="font-weight:600;color:#6b7280;padding-bottom:8px;">Hours</th>
                <th align="right" style="font-weight:600;color:#6b7280;padding-bottom:8px;">Subtotal</th>
                <th align="right" style="font-weight:600;color:#6b7280;padding-bottom:8px;">Fee (5%)</th>
                <th align="right" style="font-weight:600;color:#6b7280;padding-bottom:8px;">Charged</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach (($charges ?? []) as $charge): ?>
                <tr style="border-bottom:1px solid #f3f4f6;">
                    <td style="padding:8px 0;"><?= htmlspecialchars($charge['contractTitle'] ?? '—') ?></td>
                    <td align="right" style="padding:8px 0;"><?= htmlspecialchars($charge['hours'] ?? '—') ?></td>
                    <td align="right" style="padding:8px 0;"><?= htmlspecialchars($charge['subtotal'] ?? '$0.00') ?></td>
                    <td align="right" style="padding:8px 0;color:#9ca3af;">
                        <?= htmlspecialchars($charge['fee'] ?? '$0.00') ?></td>
                    <td align="right" style="font-weight:600;padding:8px 0;">
                        <?= htmlspecialchars($charge['amount'] ?? '$0.00') ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2" style="font-weight:700;padding-top:10px;border-top:2px solid #e5e7eb;">Total</td>
                <td align="right" style="padding-top:10px;border-top:2px solid #e5e7eb;">
                    <?= htmlspecialchars($subtotal ?? '$0.00') ?></td>
                <td align="right" style="padding-top:10px;border-top:2px solid #e5e7eb;color:#9ca3af;">
                    <?= htmlspecialchars($totalFees ?? '$0.00') ?></td>
                <td align="right" style="font-weight:700;padding-top:10px;border-top:2px solid #e5e7eb;color:#059669;">
                    <?= htmlspecialchars($totalAmount ?? '$0.00') ?>
                </td>
            </tr>
        </tfoot>
    </table>
</div>

<p style="margin:0 0 20px;font-size:13px;color:#9ca3af;line-height:1.5;">
    A 5% platform fee is applied to each contract. View your full billing history for detailed invoices.
</p>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($billingUrl ?? 'https://monkeysworks.com/dashboard/billing') ?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                View Billing Details
            </a>
        </td>
    </tr>
</table>