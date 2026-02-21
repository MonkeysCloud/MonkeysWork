<?php /** @var string $userName @var array $jobs @var string $jobsUrl */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    Jobs Recommended For You 🎯
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    Here are today&rsquo;s top job matches based on your skills and preferences:
</p>

<?php foreach (($jobs ?? []) as $i => $job): ?>
<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 12px;border:1px solid #e5e7eb;">
    <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a2e;">
        <?= htmlspecialchars($job['title'] ?? '')?>
    </p>
    <?php if (!empty($job['budget'])): ?>
    <p style="margin:0 0 4px;font-size:13px;color:#f08a11;font-weight:600;">
        💰
        <?= htmlspecialchars($job['budget'])?>
    </p>
    <?php
    endif; ?>
    <?php if (!empty($job['description'])): ?>
    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
        <?= htmlspecialchars(mb_substr($job['description'], 0, 150))?>
        <?= mb_strlen($job['description']) > 150 ? '…' : ''?>
    </p>
    <?php
    endif; ?>
    <p style="margin:8px 0 0;">
        <a href="<?= htmlspecialchars($job['url'] ?? '#')?>"
            style="font-size:13px;font-weight:600;color:#f08a11;text-decoration:none;">
            View Job →
        </a>
    </p>
</div>
<?php if ($i >= 4)
        break; ?>
<?php
endforeach; ?>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:16px 0;">
            <a href="<?= htmlspecialchars($jobsUrl ?? 'https://monkeysworks.com/jobs')?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                Browse All Jobs
            </a>
        </td>
    </tr>
</table>