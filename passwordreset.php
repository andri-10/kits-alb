<?php
include("backend/session-timeout.php");

// Check if the user is logged in
$isLoggedIn = isset($_SESSION['user_id']);

// Include PHPMailer files
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
$tokenSent = false;
$tokenValid = false;


function generateToken() {
    return str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
}

// Function to send the token via email
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

        $mail->setFrom('kits.albania@gmail.com', 'Kits Alb');
        $mail->addAddress($email);

        $mail->Subject = 'Your Password Reset Token';
        $mail->Body = 'Your password reset token is: ' . $token;

        //In case of errors uncomment below
        //$mail->SMTPDebug = 3;

        $mail->SMTPOptions = array(
            'ssl' => array(
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            )
        );
        $mail->send();
        return true;
    } catch (Exception $e) {
        return 'Mailer Error: ' . $mail->ErrorInfo;
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['email']) && isset($_POST['new_password']) && isset($_POST['confirm_password'])) {
        $email = $_POST['email'];
        $new_password = $_POST['new_password'];
        $confirm_password = $_POST['confirm_password'];

        if ($new_password !== $confirm_password) {
            $error = "Passwords do not match.";
        } else {
            // Check if the user exists
            $stmt = $conn->prepare("SELECT * FROM Users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                // Generate token
                $token = generateToken();

                // Store the token in session
                $_SESSION['reset_token'] = $token;
                $_SESSION['reset_email'] = $email;

                // Send token email
                $sendEmailResult = sendTokenEmail($email, $token);
                if ($sendEmailResult === true) {
                    $tokenSent = true;
                } else {
                    $error = "Failed to send token email: " . $sendEmailResult;
                }
            } else {
                $error = "No account found with this email.";
            }
            $stmt->close();
        }
    } elseif (isset($_POST['token']) && isset($_POST['new_password'])) {
        // Verify token and reset password
        $entered_token = $_POST['token'];
        $new_password = $_POST['new_password'];
        $confirm_password = $_POST['confirm_password'];

        if ($_SESSION['reset_token'] === $entered_token) {
            if ($new_password === $confirm_password) {
                $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

                $stmt = $conn->prepare("UPDATE Users SET password = ? WHERE email = ?");
                $stmt->bind_param("ss", $hashed_password, $_SESSION['reset_email']);

                if ($stmt->execute()) {
                    $success = "Password reset successful.";
                } else {
                    $error = "Something went wrong. Please try again.";
                }
                $stmt->close();
            } else {
                $error = "Passwords do not match.";
            }
        } else {
            $error = "Invalid token.";
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
                <p class="text-blk subHeading">
                    Enter your email and reset your password.
                </p>
            </div>

            <?php if ($tokenSent): ?>
                <div class="responsive-container-block container">
                    <p class="text-blk">
                        A 6-digit code has been sent to your email. <br>
                        Please write the code below.
                    </p>
                    <form class="form-box" action="" method="POST">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <input class="input" id="token" name="token" placeholder="Enter the token" required type="text" maxlength="6">
                                <input class="input" id="new_password" name="new_password" placeholder="Enter a new password" required type="password">
                                <input class="input" id="confirm_password" name="confirm_password" placeholder="Confirm your password" required type="password">
                            </div>
                            <input type="submit" name="submit" class="send" id="w-c-s-bgc_p-1-dm-id">
                        </div>
                    </form>
                </div>
            <?php elseif ($success): ?>
                <div class="responsive-container-block container">
                    <p class="text-blk"><?php echo $success; ?></p>
                </div>
            <?php else: ?>
                <div class="responsive-container-block container">
                    <form class="form-box" action="" method="POST">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <div class="left4">
                                    <input class="input" id="email" name="email" placeholder="Enter your email" required type="email">
                                    <input class="input" id="new_password" name="new_password" placeholder="Enter a new password" required type="password">
                                    <input class="input" id="confirm_password" name="confirm_password" placeholder="Confirm your password" required type="password">
                                </div>
                            </div>
                            <input type="submit" name="submit" class="send" id="w-c-s-bgc_p-1-dm-id">
                        </div>
                    </form>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <footer class="kits-footer">
      <p>&copy; 2024 Kits Alb. All rights reserved. <br> Follow us on 
        <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
      </p>
    </footer>
</body>
</html>
