<?php /** @var string $userName @var string $jobTitle @var string $freelancerName @var string $proposalUrl */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    New Proposal Received 📩
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    <strong>
        <?= htmlspecialchars($freelancerName ?? 'A freelancer')?>
    </strong> submitted a proposal for your job
    <strong>&ldquo;
        <?= htmlspecialchars($jobTitle ?? '')?>&rdquo;
    </strong>.
</p>

<?php if (!empty($coverLetter)): ?>
<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;">Cover Letter
        Preview</p>
    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
        &ldquo;
        <?= htmlspecialchars(mb_substr($coverLetter, 0, 200))?>
        <?= mb_strlen($coverLetter) > 200 ? '…' : ''?>&rdquo;
    </p>
</div>
<?php
endif; ?>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($proposalUrl ?? 'https://monkeysworks.com/dashboard/proposals')?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                View Proposal
            </a>
        </td>
    </tr>
</table>