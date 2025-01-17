<?php
require __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer/src/SMTP.php';
require __DIR__ . '/../PHPMailer/src/Exception.php';

function sendTokenEmail($email, $token) {
    $mail = new PHPMailer\PHPMailer\PHPMailer();
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'electroman784@gmail.com';
        $mail->Password = 'phwz nqal qeoq czbq';
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->SMTPOptions = [
          'ssl' => [
              'verify_peer' => false,
              'verify_peer_name' => false,
              'allow_self_signed' => true,
          ],
      ];

        $mail->setFrom('electroman784@gmail.com', 'Football Kits Albania');
        $mail->addAddress($email);
        $mail->Subject = 'Password Reset';
        $mail->Body = 'Your password reset confirmation code is: ' . $token;

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function sendEmail($recipient, $subject, $body) {
    $mail = new PHPMailer\PHPMailer\PHPMailer();
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'electroman784@gmail.com';
        $mail->Password = 'phwz nqal qeoq czbq';
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true,
            ],
        ];

        $mail->setFrom('electroman784@gmail.com', 'Football Kits Albania');
        $mail->addAddress($recipient);
        $mail->Subject = $subject;
        $mail->Body = $body;

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}


function sendRegistrationTokenEmail($email, $token) {
    $mail = new PHPMailer\PHPMailer\PHPMailer();
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'electroman784@gmail.com';
        $mail->Password = 'phwz nqal qeoq czbq';
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->SMTPOptions = [
          'ssl' => [
              'verify_peer' => false,
              'verify_peer_name' => false,
              'allow_self_signed' => true,
          ],
      ];

        $mail->setFrom('electroman784@gmail.com', 'Football Kits Albania');
        $mail->addAddress($email);
        $mail->Subject = 'Email verification';
        $mail->Body = 'Your email verification code is: ' . $token;

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}


function sendRoleUpdateEmail($email, $newRole) {
    $subject = "Important - Football Kits Albania";
    $body = "Dear User,

We would like to inform you that your role has been updated by our administrator. 
You have been " . ($newRole === 'admin' ? 'promoted to an Admin' : 'demoted to a User without admin privileges') . ".

We value your contributions to Football Kits Albania.

Sincerely,
Football Kits Albania";

    if (mail($email, $subject, $body, "From: no-reply@footballkitsalbania.com")) {
        return true;
    } else {
        return false;
    }
}

