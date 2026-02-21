<?php /** @var string $userName @var string $jobTitle @var string $status @var string $proposalUrl */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Proposal
    <?= $status === 'accepted' ? 'Accepted! 🎉' : 'Update 📋'?>
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<?php if ($status === 'accepted'): ?>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Great news! Your proposal for <strong>&ldquo;
        <?= htmlspecialchars($jobTitle ?? '')?>&rdquo;
    </strong> has been accepted.
    A contract will be created shortly.
</p>

<div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:0 0 20px;">
    <p style="margin:0;font-size:14px;color:#166534;line-height:1.6;">
        🚀 Get ready! Once the contract is set up, you can start working on the project.
    </p>
</div>
<?php
elseif ($status === 'rejected'): ?>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Your proposal for <strong>&ldquo;
        <?= htmlspecialchars($jobTitle ?? '')?>&rdquo;
    </strong> was not selected this time.
    Don't give up — keep submitting proposals to find the right match!
</p>
<?php
else: ?>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Your proposal for <strong>&ldquo;
        <?= htmlspecialchars($jobTitle ?? '')?>&rdquo;
    </strong> has been updated to:
    <strong>
        <?= htmlspecialchars($status ?? '')?>
    </strong>.
</p>
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