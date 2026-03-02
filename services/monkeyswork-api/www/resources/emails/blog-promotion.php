<?php
/**
 * Blog post promotion email.
 *
 * @var string $userName       Recipient display name
 * @var string $postTitle      Blog post title
 * @var string $postExcerpt    Short excerpt
 * @var string $coverImage     Cover image URL (optional)
 * @var string $postUrl        Full URL to the blog post
 */
?>

<?php if (!empty($coverImage)): ?>
    <div style="margin:0 0 20px;border-radius:12px;overflow:hidden;">
        <a href="<?= htmlspecialchars($postUrl ?? '#') ?>">
            <img src="<?= htmlspecialchars($coverImage) ?>" alt="<?= htmlspecialchars($postTitle ?? '') ?>"
                style="width:100%;max-height:240px;object-fit:cover;display:block;" />
        </a>
    </div>
<?php endif; ?>

<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a2e;line-height:1.3;">
    📝
    <?= htmlspecialchars($postTitle ?? 'New Blog Post') ?>
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there') ?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    We just published something we think you'll find interesting:
</p>

<div style="background:#f9fafb;border-radius:8px;padding:20px;margin:0 0 24px;border:1px solid #e5e7eb;">
    <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;font-style:italic;">
        "
        <?= htmlspecialchars($postExcerpt ?? 'Check out our latest article on the MonkeysWorks blog.') ?>"
    </p>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:0 0 20px;">
            <a href="<?= htmlspecialchars($postUrl ?? '#') ?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 40px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                Read the Full Article →
            </a>
        </td>
    </tr>
</table>

<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.5;">
    You're receiving this because you're a member of MonkeysWorks.
</p>