<?php
session_start();
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';
require 'PHPMailer/src/Exception.php';

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$error = '';
$success = '';
$step = 1;

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

        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );

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

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['step']) && $_POST['step'] == 1) {
        $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = "Invalid email format.";
        } else {
            $stmt = $conn->prepare("SELECT email FROM Users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $token = rand(100000, 999999);
                $_SESSION['reset_email'] = $email;
                $_SESSION['reset_token'] = $token;
                $_SESSION['token_time'] = time();

                if (sendTokenEmail($email, $token)) {
                    $step = 2;
                } else {
                    $error = "Failed to send token email.";
                }
            } else {
                // Updated error message with Register link
                $error = "This email is not registered. <a class = 'register-link' href='registration.php'>Register Here</a>";
            }
        }
    } elseif (isset($_POST['step']) && $_POST['step'] == 2) {
        $entered_token = $_POST['token'];

        if ($_SESSION['reset_token'] == $entered_token && (time() - $_SESSION['token_time']) <= 60) {
            $step = 3;
        } else {
            $error = "Invalid or expired token. Please try again.";
        }
    } elseif (isset($_POST['step']) && $_POST['step'] == 3) {
        $new_password = $_POST['new_password'];
        $confirm_password = $_POST['confirm_password'];

        if ($new_password !== $confirm_password) {
            $error = "Passwords do not match.";
        } elseif (!preg_match("/^(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/", $new_password)) {
            $error = "Password must be at least 8 characters long and include a number and a special character.";
        } else {
            $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
            $email = $_SESSION['reset_email'];

            $stmt = $conn->prepare("UPDATE Users SET password = ? WHERE email = ?");
            $stmt->bind_param("ss", $hashed_password, $email);

            if ($stmt->execute()) {
                $success = "Password reset successful.";
                session_destroy();
            } else {
                $error = "Something went wrong. Please try again.";
            }
        }
    }
}

$conn->close();
?>



<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles/pages/passwordreset.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/shared/kits-footer.css">
    <title>Reset Password</title>
</head>
<body>
    <header class="kits-header">
        <section class="left-section">
            <a href="index.php" class="header-link">
                <img class="kits-logo" src="images/kits-logo-white.png" alt="Kits Alb Logo">
                <img class="kits-mobile-logo" src="images/kits-mobile-logo-white.png" alt="Kits Alb Mobile Logo">
            </a>
        </section>
    </header>

    <div class="new_home_web">
        <div class="responsive-container-block big-container">
            <div class="responsive-container-block textContainer">
                <div class="topHead">
                    <p class="text-blk heading">
                        Reset your
                        <span class="yellowText">
                            Password
                        </span>
                    </p>
                    <div class="yellowLine" id="w-c-s-bgc_p-2-dm-id"></div>
                </div>

                
            </div>

            <?php if ($step == 1): ?>
                <div class="responsive-container-block container">
                    <form class="form-box" method="POST" id="step1Form">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <input class="input" type="email" name="email" id="email" placeholder="Enter your email" required>
                                <button type="submit" class="send">Send Confirmation Code</button>
                                <div class="error" id="error-message">
                                    <?php if (!empty($error)): ?>
                                        <p><?php echo $error; ?></p>
                                    <?php endif; ?>
                                </div>

                                <input type="hidden" name="step" value="1">
                            </div>
                        </div>
                    </form>
                </div>

            <?php elseif ($step == 2): ?>
                <div class="responsive-container-block container">
                    <form class="form-box" method="POST" id="step2Form">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <input class="input" type="text" name="token" id="token" placeholder="Enter the code" required>

                                    <p class= "code-sent">Please check your email.</span></p>
                                <button type="submit" class="send">Verify </button>

                                <button type="button" class="send resend">Resend Code in <span id="timer">60s</span></button>
                                    
                                <input type="hidden" name="step" value="2">
                                
                                
                            </div>
                        </div>
                    </form>
                </div>
            
            <?php elseif ($step == 3): ?>
                <div class="responsive-container-block container">
                    <form class="form-box" method="POST" id="step3Form">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <input class="input" type="password" name="new_password" id="new_password" placeholder="Enter new password" required>
                                <input class="input" type="password" name="confirm_password" id="confirm_password" placeholder="Confirm new password" required>
                                <label for="toggle-password">
                                    <input type="checkbox" id="toggle-password"> Show Password
                                </label>
                                <button type="submit" class="send">Reset Password</button>
                                <input type="hidden" name="step" value="3">
                            </div>
                        </div>
                    </form> 
                </div>
            <?php endif; ?>   

            <div class="error" id="error-message"></div>

            <?php if ($success): ?>
                <div class="success"><?php echo $success; ?></div>
            <?php endif; ?>
        </div>
    </div>

    <footer class="kits-footer">
      <p>&copy; 2024 Kits Alb. All rights reserved. <br> Follow us on 
        <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
      </p>
    </footer>

    <script src="./scripts/pages/passwordreset.js"></script>
</body>
</html>

