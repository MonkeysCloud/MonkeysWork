<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>
        <?= htmlspecialchars($subject ?? 'MonkeysWork')?>
    </title>
</head>

<body
    style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
        <tr>
            <td align="center">

                <!-- Container -->
                <table width="600" cellpadding="0" cellspacing="0"
                    style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

                    <!-- Header -->
                    <tr>
                        <td
                            style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:28px 32px;text-align:center;">
                            <img src="https://monkeysworks.com/monkeyswork.png" alt="MonkeysWork" width="160"
                                style="display:inline-block;max-width:160px;height:auto;">
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:32px 32px 24px;">
                            <?= $content ?? ''?>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 32px 28px;border-top:1px solid #eee;">
                            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;text-align:center;">
                                You're receiving this email because you have an account on
                                <a href="https://monkeysworks.com"
                                    style="color:#f08a11;text-decoration:none;">MonkeysWork</a>.
                            </p>
                            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                                <a href="https://monkeysworks.com/dashboard/settings/notifications"
                                    style="color:#9ca3af;text-decoration:underline;">Email preferences</a>
                                &nbsp;·&nbsp;
                                <a href="https://monkeysworks.com"
                                    style="color:#9ca3af;text-decoration:underline;">MonkeysWork</a>
                            </p>
                            <p style="margin:12px 0 0;font-size:11px;color:#c0c0c0;text-align:center;">
                                ©
                                <?= date('Y')?> MonkeysCloud Inc. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- /Container -->

            </td>
        </tr>
    </table>
</body>

</html>