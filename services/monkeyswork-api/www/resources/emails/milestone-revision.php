<?php /** @var string $userName @var string $milestoneTitle @var string $contractTitle @var string $clientName @var string|null $feedback @var int $revisionNumber @var string $milestoneUrl */ ?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Revision Requested 🔄
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there') ?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    <strong>
        <?= htmlspecialchars($clientName ?? 'The client') ?>
    </strong> has requested a revision (revision #
    <?= $revisionNumber ?? 1 ?>) for milestone
    &ldquo;<strong>
        <?= htmlspecialchars($milestoneTitle ?? '') ?>
    </strong>&rdquo;
    on contract &ldquo;
    <?= htmlspecialchars($contractTitle ?? '') ?>&rdquo;.
</p>

<?php if (!empty($feedback)): ?>
    <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin:0 0 20px;">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#d97706;text-transform:uppercase;">Client's Feedback
        </p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            <?= nl2br(htmlspecialchars($feedback)) ?>
        </p>
    </div>
<?php endif; ?>

<div style="background:#eff6ff;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">
        📋 Please review the feedback, make the necessary changes, and resubmit your work. You can attach updated files
        and include a message with your submission.
    </p>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($milestoneUrl ?? 'https://monkeysworks.com/dashboard/milestones') ?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                View & Resubmit
            </a>
        </td>
    </tr>
</table>