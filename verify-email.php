<?php
session_start();
require __DIR__ . '/backend/utils.php';
// Check if the user is logged in
$isLoggedIn = isset($_SESSION['user_id']);

$servername = "localhost";
$user_name = "root";
$password = "";
$dbname = "web";

$conn = new mysqli($servername, $user_name, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$error = '';
$success = '';
$username = '';
$email = '';


if ($_SERVER["REQUEST_METHOD"] === "POST") {
    if (!isset($_SESSION['reset_email']) || !isset($_SESSION['reset_token']) || !isset($_SESSION['token_time'])) {
        $error = "Email verification session expired. Please restart the process.";
    } else {
        $entered_token = trim($_POST['token']);
        if ($_SESSION['reset_token'] === $entered_token && (time() - $_SESSION['token_time']) <= 600) {
            $email = $_SESSION['reset_email'];
            $stmt = $conn->prepare("UPDATE Users SET email_verified = 1 WHERE email = ?");
            $stmt->bind_param("s", $email);

            if ($stmt->execute()) {
                $_SESSION['email_verified'] = true;
                
                $success = "Email verified successfully! Redirecting to login.";
                echo "<script>
    setTimeout(function() {
     
        
        window.location.href = 'login.php';  
    }, 2000); 
</script>";
                
                unset($_SESSION['reset_email'], $_SESSION['reset_token'], $_SESSION['token_time']);
            } else {
                $error = "Failed to update email verification status. Please try again.";
            }
        } else {
            $error = "Invalid or expired token. Please try again.";
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
    <link rel="stylesheet" href="styles/pages/registration.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/shared/kits-footer.css">
    <title>Register</title>
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
                        Verify your
                        <span class="yellowText">Email</span>
                    </p>
                    <div class="yellowLine" id="w-c-s-bgc_p-2-dm-id"></div>
                </div>

                
            
                <div class="responsive-container-block container">
                    <form class="form-box" method="POST" id="step2Form">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <input class="input" type="text" name="token" id="token" placeholder="Enter the code" required autocomplete="off">
                                <p class="code-sent">Please check your email.</p>
                                <button type="submit" class="send">Verify</button>
                                <button type="button" id="resend-btn" class="send resend" disabled>
                                    Resend Code in <span id="timer">10s</span>
                                </button>
                                <input type="hidden" name="step" value="2">
                            </div>
                        </div>
                    </form>

                    <!-- Error/Success Messages -->
                    <?php if (!empty($error)): ?>
                        <p class="error-message" id="phpError2"><?= $error; ?></p>
                    <?php endif; ?>
                    <?php if (!empty($success)): ?>
                        <p class="success-message" id="phpSuccess2"><?= $success; ?></p>
                    <?php endif; ?>
                </div>
               
            </div>
        </div>
    </div>

    <footer class="kits-footer">
        <p>&copy; 2024 Football Kits Albania. All rights reserved. <br> Follow us on 
            <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
        </p>
    </footer>
    
    <!-- Session Timeout Script - Only add if user is logged in -->
    <?php if ($isLoggedIn): ?>
        <script src="scripts/session-manager.js"></script>
    <?php endif; ?>

    <script src="scripts/pages/emailVerify.js"></script>
</body>
</html>
