<?php
session_start();
include("backend/security-config.php");

require __DIR__ . '/backend/utils.php';

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
if (isset($_GET['from']) && $_GET['from'] === 'account' && isset($_SESSION['email']) && !isset($_POST['step'])) {
    $email = $_SESSION['email'];
    $step = 2;
    $token = rand(100000, 999999);
    $_SESSION['reset_token'] = $token;
    $_SESSION['token_time'] = time();
    $_SESSION['reset_email'] = $email;
    if (!sendTokenEmail($email, $token)) {
        $error = "Failed to send token email.";
        header("Location: account.php");
        exit;
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
                $error = "This email is not registered. <a class='register-link' href='registration.php'>Register Here</a>";
            }
        }
    } elseif (isset($_POST['step']) && $_POST['step'] == 2) {
        $entered_token = $_POST['token'];

        if ($_SESSION['reset_token'] == $entered_token && (time() - $_SESSION['token_time']) <= 60) {
            $step = 3;
        } else {
            $error = "Invalid or expired token. Please try again.";
            $step = 2;
        }
    } elseif (isset($_POST['step']) && $_POST['step'] == 3) {
        $new_password = $_POST['new_password'];
        $confirm_password = $_POST['confirm_password'];

        if ($new_password !== $confirm_password) {
            $error = "Passwords do not match.";
            $step = 3;
        } elseif (!preg_match("/^(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/", $new_password)) {
            $error = "Password must be at least 8 characters long and include a number and a special character.";
            $step = 3;
        } else {
            $email = $_SESSION['reset_email'];
            $stmt = $conn->prepare("SELECT password FROM users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows === 1) {
                $row = $result->fetch_assoc();
                $current_hashed_password = $row['password'];
                if (password_verify($new_password, $current_hashed_password)) {
                    $error = "Error changing password.";
                    $step = 3;
                } else {
                    $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

                    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE email = ?");
                    $stmt->bind_param("ss", $hashed_password, $email);

                    if ($stmt->execute()) {
                        $success = "Password reset successful.";
                        session_destroy();
                    } else {
                        $error = "Something went wrong. Please try again.";
                        $step = 3;
                    }
                }
            } else {
                $error = "User not found. Please restart the process.";
                $step = 3;
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
                                <input type="hidden" name="step" value="1">
                            </div>
                        </div>
                    </form>
                    <?php if (!empty($error)): ?>
                        <p style="text-align:center"><?php echo $error; ?></p>
                    <?php endif; ?>

                    <?php if ($success): ?>
                        <p style="text-align:center" class="success"><?php echo $success; ?></p>
                    <?php endif; ?>

                    <p class ="return">Return to <a class ="link" href = "login.php">Sign In</a></p>
                </div>

            <?php elseif ($step == 2): ?>
                <div class="responsive-container-block container">
                    <form class="form-box" method="POST" id="step2Form">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <input class="input" type="text" name="token" id="token" placeholder="Enter the code" required autocomplete='off'>

                                    <p class= "code-sent">Please check your email.</span></p>
                                <button type="submit" class="send">Verify </button>

                                <button type="button" id="resend-btn" class="send resend" disabled>
                                Resend Code in <span id="timer">10s</span>
                                </button>
                                <input type="hidden" name="step" value="2">
                            </div>
                        </div>
                    </form>
                    
                    <?php if (!empty($error)): ?>
                        <p class = "error" id="phpError2" ><?php echo $error; ?></p>
                    <?php endif; ?>
                </div>
            
                <?php elseif ($step == 3): ?>
                    <div class="responsive-container-block container">
                        <form class="form-box" method="POST" id="step3Form">
                            <div class="container-block form-wrapper">
                                <div class="responsive-container-block">
                                    <input class="input" type="password" name="new_password" id="new_password" placeholder="Enter new password" required>
                                    <input class="input" type="password" name="confirm_password" id="confirm_password" placeholder="Confirm new password" required>
                                    <label for="toggle-password">
                                        <input class="input" type="checkbox" id="toggle-password"> Show Password
                                    </label>
                                    <button type="submit" class="send">Reset Password</button>
                                    <input type="hidden" name="step" value="3">
                                </div>
                            </div>
                        </form>
                        <?php if (!empty($error)): ?>
                            <p class = "error" ><?php echo $error; ?></p>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>

            <div class="error" id="error-message"></div>
        </div>
    </div>

    <footer class="kits-footer">
      <p>&copy; 2024 Kits Alb. All rights reserved. <br> Follow us on 
        <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
      </p>
    </footer>

    <script src="scripts/pages/passwordreset.js"></script>
</body>
</html>