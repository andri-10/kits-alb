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

        //If it is not working uncomment this for debug
        //$mail->SMTPDebug = 3;

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}
