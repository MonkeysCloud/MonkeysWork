<?php /** @var string $userName @var string $milestoneTitle @var string $contractTitle @var string $freelancerName @var string $amount @var string $milestoneUrl @var string|null $message */ ?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Milestone Submitted for Review 📤
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there') ?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    <strong>
        <?= htmlspecialchars($freelancerName ?? 'Your freelancer') ?>
    </strong> has submitted work for milestone
    &ldquo;<strong>
        <?= htmlspecialchars($milestoneTitle ?? '') ?>
    </strong>&rdquo;
    on contract &ldquo;
    <?= htmlspecialchars($contractTitle ?? '') ?>&rdquo;.
</p>

<?php if (!empty($message)): ?>
    <div style="background:#f8fafc;border-left:4px solid #6366f1;border-radius:8px;padding:16px;margin:0 0 20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;">Freelancer's
            Message</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            <?= nl2br(htmlspecialchars($message)) ?>
        </p>
    </div>
<?php endif; ?>

<div style="background:#eff6ff;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">
        💰 <strong>
            <?= htmlspecialchars($amount ?? '') ?>
        </strong> is held in escrow. You have <strong>14 days</strong> to review and either accept or request revisions.
    </p>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($milestoneUrl ?? 'https://monkeysworks.com/dashboard/milestones') ?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                Review Submission
            </a>
        </td>
    </tr>
</table>