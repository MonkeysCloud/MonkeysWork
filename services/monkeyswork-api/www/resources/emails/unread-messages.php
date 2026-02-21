<?php /** @var string $userName @var string $senderName @var string $messagePreview @var string $unreadCount @var string $messagesUrl */?>

<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a2e;">
    You Have Unread Messages 💬
</h1>

<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
    Hi
    <?= htmlspecialchars($userName ?? 'there')?>,
</p>

<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
    You have <strong>
        <?= htmlspecialchars($unreadCount ?? '1')?> unread message
        <?=($unreadCount ?? 1) > 1 ? 's' : ''?>
    </strong>.
    <?php if (!empty($senderName)): ?>
    The latest is from <strong>
        <?= htmlspecialchars($senderName)?>
    </strong>.
    <?php
endif; ?>
</p>

<?php if (!empty($messagePreview)): ?>
<div style="background:#f9fafb;border-radius:8px;padding:16px;margin:0 0 20px;border:1px solid #e5e7eb;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;">Message Preview</p>
    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
        &ldquo;
        <?= htmlspecialchars(mb_substr($messagePreview, 0, 200))?>
        <?= mb_strlen($messagePreview) > 200 ? '…' : ''?>&rdquo;
    </p>
</div>
<?php
endif; ?>

<table width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td align="center" style="padding:8px 0 16px;">
            <a href="<?= htmlspecialchars($messagesUrl ?? 'https://monkeysworks.com/dashboard/messages')?>" style="display:inline-block;background-color:#f08a11;color:#ffffff;font-size:15px;font-weight:700;
              padding:14px 36px;border-radius:8px;text-decoration:none;
              box-shadow:0 4px 12px rgba(240,138,17,0.3);">
                Read Messages
            </a>
        </td>
    </tr>
</table>