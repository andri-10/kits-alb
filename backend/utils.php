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
        $mail->Username = 'kits.albania@gmail.com';
        $mail->Password = 'wutt otga hnez fyfx';
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->SMTPOptions = [
          'ssl' => [
              'verify_peer' => false,
              'verify_peer_name' => false,
              'allow_self_signed' => true,
          ],
      ];

        $mail->setFrom('kits.albania@gmail.com', 'Kits Alb');
        $mail->addAddress($email);
        $mail->Subject = 'Your Password Reset Token';
        $mail->Body = 'Your password reset token is: ' . $token;



        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}
