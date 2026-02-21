<?php /** @var string $userName @var string $reviewerName @var string $contractTitle @var float $rating @var string $comment @var string $reviewsUrl */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    You Received a New Review ⭐
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    <strong>
        <?= htmlspecialchars($reviewerName ?? 'Someone')?>
    </strong> left you a review for
    <strong>&ldquo;
        <?= htmlspecialchars($contractTitle ?? '')?>&rdquo;
    </strong>.
</p>

<div style="background:#fefce8;border-radius:8px;padding:16px;margin:0 0 20px;text-align:center;">
    <p style="margin:0 0 6px;font-size:28px;">
        <?php for ($i = 1; $i <= 5; $i++): ?>
        <span style="color:<?= $i <= round($rating ?? 0) ? '#f59e0b' : '#e5e7eb'?>">★</span>
        <?php
endfor; ?>
    </p>
    <p style="margin:0;font-size:18px;font-weight:700;color:#1a1a2e;">
        <?= number_format($rating ?? 0, 1)?> / 5.0
    </p>
</div>

<?php if (!empty($comment)): ?>
<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;">
    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">
        &ldquo;
        <?= htmlspecialchars($comment)?>&rdquo;
    </p>
</div>
<?php
endif; ?>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($reviewsUrl ?? 'https://monkeysworks.com/dashboard/reviews')?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                View & Respond
            </a>
        </td>
    </tr>
</table>