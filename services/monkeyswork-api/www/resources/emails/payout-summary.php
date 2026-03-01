<?php
/**
 * Weekly payout summary email for freelancers.
 *
 * @var string $userName
 * @var string $netAmount       e.g. "$891.00"
 * @var string $fee             e.g. "9.00" (processing fee)
 * @var string $methodLabel     e.g. "Bank Transfer", "PayPal"
 * @var array  $contracts       [{title, gross, commission, rate, earned}]
 * @var string $payoutsUrl
 */
?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Payout Sent! 🎉
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi <?= htmlspecialchars($userName ?? 'there') ?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    We've sent <strong><?= htmlspecialchars($netAmount ?? '$0.00') ?></strong>
    to your <strong><?= htmlspecialchars($methodLabel ?? 'account') ?></strong>.
    <?php if (($methodLabel ?? '') === 'PayPal'): ?>
        It should arrive within a few minutes.
    <?php else: ?>
        It should arrive in 1–3 business days.
    <?php endif; ?>
</p>

<!-- Per-contract breakdown with commission -->
<?php if (!empty($contracts)): ?>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;">
        <p
            style="margin:0 0 10px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">
            Earnings breakdown
        </p>
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px;color:#374151;">
            <thead>
                <tr style="border-bottom:2px solid #e5e7eb;">
                    <th align="left" style="font-weight:600;color:#6b7280;padding-bottom:8px;">Contract</th>
                    <th align="right" style="font-weight:600;color:#6b7280;padding-bottom:8px;">Gross</th>
                    <th align="right" style="font-weight:600;color:#6b7280;padding-bottom:8px;">Commission</th>
                    <th align="right" style="font-weight:600;color:#6b7280;padding-bottom:8px;">Net</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($contracts as $contract): ?>
                    <tr style="border-bottom:1px solid #f3f4f6;">
                        <td style="padding:8px 0;"><?= htmlspecialchars($contract['title'] ?? '—') ?></td>
                        <td align="right" style="padding:8px 0;"><?= htmlspecialchars($contract['gross'] ?? '$0.00') ?></td>
                        <td align="right" style="padding:8px 0;color:#9ca3af;">
                            <?= htmlspecialchars($contract['commission'] ?? '$0.00') ?>
                            <span style="font-size:12px;">(<?= htmlspecialchars($contract['rate'] ?? '0%') ?>)</span>
                        </td>
                        <td align="right" style="font-weight:600;padding:8px 0;">
                            <?= htmlspecialchars($contract['earned'] ?? '$0.00') ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
<?php endif; ?>

<!-- Totals -->
<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #bbf7d0;">
    <table width="100%" cellpadding="4" cellspacing="0" style="font-size:14px;color:#374151;">
        <?php if (($fee ?? '0.00') !== '0.00'): ?>
            <tr>
                <td style="color:#6b7280;">Processing fee (<?= htmlspecialchars($methodLabel ?? '') ?>)</td>
                <td align="right" style="color:#9ca3af;">−$<?= htmlspecialchars($fee ?? '0.00') ?></td>
            </tr>
        <?php endif; ?>
        <tr>
            <td style="font-weight:700;font-size:16px;color:#059669;">You receive</td>
            <td align="right" style="font-weight:700;font-size:16px;color:#059669;">
                <?= htmlspecialchars($netAmount ?? '$0.00') ?>
            </td>
        </tr>
        <tr>
            <td style="color:#9ca3af;font-size:13px;">via <?= htmlspecialchars($methodLabel ?? 'Bank Transfer') ?></td>
            <td align="right" style="color:#9ca3af;font-size:13px;"><?= date('M j, Y') ?></td>
        </tr>
    </table>
</div>

<p style="margin:0 0 20px;font-size:13px;color:#9ca3af;line-height:1.5;">
    Commission rates: 10% on the first $10,000 billed per client, 5% thereafter.
</p>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($payoutsUrl ?? 'https://monkeysworks.com/dashboard/billing/payouts') ?>"
                style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                View Payout History
            </a>
        </td>
    </tr>
</table>