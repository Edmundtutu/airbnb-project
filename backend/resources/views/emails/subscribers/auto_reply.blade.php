<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CavaYo</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;900&display=swap');
    </style>
</head>
<body style="margin:0; padding:0; background-color:#F7FFF7; font-family:'Nunito Sans', Arial, sans-serif; color:#556270;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7FFF7; padding:40px 20px;">
        <tr>
            <td align="center" valign="top">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; box-shadow:0 4px 20px rgba(85, 98, 112, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color:#F7FFF7; padding:40px 20px 30px 20px; border-radius:12px 12px 0 0;">
                            <div style="color:#FF6B6B; font-size:10px; font-weight:600; letter-spacing:2px; margin-bottom:8px; text-align:center;">
                                WELCOME TO
                            </div>
                            <h1 style="margin:0; font-size:40px; font-weight:900; line-height:1.2; text-align:center;">
                                <span style="color:#556270;">Cava</span>
                                <span style="color:#FF6B6B;">Yo</span>
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding:40px 30px; line-height:1.6;">
                            <p style="margin:0 0 20px 0; color:#556270; font-size:16px;">
                                Hi <strong style="color:#FF6B6B;">{{ $name }}</strong>,
                            </p>
                            
                            <p style="margin:0 0 20px 0; color:#556270; font-size:16px;">
                                Thank you for subscribing to CavaYo. We appreciate your interest in being among the first to know when we launch.
                            </p>
                            
                            <p style="margin:0 0 20px 0; color:#556270; font-size:16px;">
                                You'll receive updates about exclusive residences for mini stays across ALL Uganda.
                            </p>
                            
                            <p style="margin:0 0 10px 0; color:#556270; font-size:16px;">
                                Warm regards,
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#F7FFF7; padding:30px 30px 25px 30px; border-radius:0 0 12px 12px; border-top:1px solid rgba(85, 98, 112, 0.1);">
                            <table width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin:0 0 12px 0; color:#556270; font-size:14px; font-weight:600; text-align:center;">
                                            For any inquiries, email us on
                                        </p>
                                        <p style="margin:0 0 20px 0; text-align:center;">
                                            <a href="mailto:info@yocava.com" style="color:#FF6B6B; text-decoration:none; font-weight:600; font-size:15px;">info@yocava.com</a>
                                        </p>
                                        <p style="margin:0; color:#556270; font-size:12px; opacity:0.7; text-align:center;">
                                            &copy; {{ date('Y') }} CavaYo. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>