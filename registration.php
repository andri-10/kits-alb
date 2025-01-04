<?php
include("backend/session-timeout.php");
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
$step = 1;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['step']) && $_POST['step'] == 1) {
        $username = $_POST['username'];
        $email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL); // Sanitize email
        $password = $_POST['password'];
        $confirm_password = $_POST['confirm_password'];

        // Validate sanitized email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = "Invalid email format.";
        } else {
            // Check if email already exists
            $stmt = $conn->prepare("SELECT * FROM Users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $error = "An account with this email already exists.";
                $email = ''; // Reset email to clear it in the form
            } elseif ($password !== $confirm_password) {
                $error = "Passwords do not match.";
            } elseif (strlen($password) < 8 || !preg_match("/[A-Z]/", $password) || !preg_match("/[^a-zA-Z0-9]/", $password)) {
                // Check for password conditions
                $error = "Password must be at least 8 characters long, must contain at least 1 uppercase letter, and at least 1 special character.";
            } else {
                // Hash the password before inserting into the database
                $hashed_password = password_hash($password, PASSWORD_BCRYPT);

                // Insert user into database with email_verified set to 0
                $stmt = $conn->prepare("INSERT INTO Users (name, email, password, role, email_verified) VALUES (?, ?, ?, 'user', 0)");
                $stmt->bind_param("sss", $username, $email, $hashed_password);

                if ($stmt->execute()) {
                    $success = "Account created successfully! Please verify your email.";
                    $token = rand(100000, 999999);
                    $_SESSION['reset_email'] = $email;
                    $_SESSION['reset_token'] = $token;
                    $_SESSION['token_time'] = time();

                    if (sendRegistrationTokenEmail($email, $token)) {
                        $step = 2;
                    } else {
                        $error = "Failed to send token email.";
                    }
                } else {
                    $error = "Something went wrong. Please try again.";
                }
            }
            $stmt->close();
        }
    }elseif (isset($_POST['step']) && $_POST['step'] == 2) {
        $entered_token = $_POST['token'];
    
        if ($_SESSION['reset_token'] == $entered_token && (time() - $_SESSION['token_time']) <= 600) { // 10 minutes
            // Update the email_verified field to 1
            $email = $_SESSION['reset_email'];
            $stmt = $conn->prepare("UPDATE Users SET email_verified = 1 WHERE email = ?");
            $stmt->bind_param("s", $email);
    
            if ($stmt->execute()) {
                $_SESSION['email_verified'] = true; // Mark as verified in the session
                $success = "Email verified successfully! Redirecting to login.";
                echo '<script>
                        setTimeout(function() {
                            window.location.href = "login.php";
                        }, 3000);
                      </script>';
                exit; // Prevent further script execution
            } else {
                $error = "Failed to update email verification status. Please try again.";
                $step=2;
            }
        } else {
            $error = "Invalid or expired token. Please try again.";
            $step=2;
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
                        Create an
                        <span class="yellowText">Account</span>
                    </p>
                    <div class="yellowLine" id="w-c-s-bgc_p-2-dm-id"></div>
                </div>

                <!-- Step 1: Account Creation -->
                <?php if ($step == 1): ?>
                <p class="text-blk subHeading">
                    Join us and start your journey with Kits Alb!
                </p>
                <div class="responsive-container-block container">
                    <div class="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-7 wk-ipadp-10 line">
                        <form class="form-box" action="" method="POST">
                            <div class="container-block form-wrapper">
                                <div class="responsive-container-block">
                                    <div class="left4">
                                        <div class="responsive-cell-block">
                                            <input class="input" id="username" name="username" placeholder="Username" value="<?= htmlspecialchars($username); ?>" required>
                                        </div>
                                        <div class="responsive-cell-block">
                                            <input class="input" id="email" name="email" placeholder="Email" value="<?= htmlspecialchars($email); ?>" required type="email">
                                        </div>
                                        <div class="responsive-cell-block">
                                            <input class="input password" id="password" name="password" placeholder="Password" required type="password">
                                        </div>
                                        <div class="responsive-cell-block">
                                            <input class="input password" id="confirm-password" name="confirm_password" placeholder="Confirm Password" required type="password">
                                        </div>
                                        <div class="checkbox-container">
                                            <input type="checkbox" id="show-password" onclick="togglePassword()">
                                            <label for="show-password">Show Password</label>
                                        </div>
                                    </div>
                                </div>
                                <input type="submit" name="submit" class="send" value="Create Account">
                                <input type="hidden" name="step" value="1">
                                <p class="return"> Already have an account? <a class="link" href="login.php">Sign In</a></p>
                            </div>

                            <!-- Error/Success Messages -->
                            <?php if ($error != ''): ?>
                                <p class="error-message"><?= $error; ?></p>
                            <?php endif; ?>
                            <?php if ($success != ''): ?>
                                <p class="success-message"><?= $success; ?></p>
                            <?php endif; ?>
                        </form>
                    </div>
                </div>

                <!-- Step 2: Token Verification -->
                <?php elseif ($step == 2): ?>
                <div class="responsive-container-block container">
                    <form class="form-box" method="POST" id="step2Form">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <input class="input" type="text" name="token" id="token" placeholder="Enter the code" required autocomplete="off">
                                <p class="code-sent">Please check your email.</p>
                                <button type="submit" class="send">Verify</button>
                                <button type="button" id="resend-btn" class="send resend" disabled>
                                    Resend Code in <span id="timer">20s</span>
                                </button>
                                <input type="hidden" name="step" value="2">
                            </div>
                        </div>
                    </form>
                    <?php if (!empty($error)): ?>
                        <p class = "error" id="phpError2" ><?php echo $error; ?></p>
                    <?php endif; ?>
                    <!-- Error/Success Messages -->
                    <?php if ($error != ''): ?>
                        <p class="error-message"><?= $error; ?></p>
                    <?php endif; ?>
                    <?php if ($success != ''): ?>
                        <p class="success-message"><?= $success; ?></p>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <footer class="kits-footer">
        <p>&copy; 2024 Football Kits Albania. All rights reserved. <br> Follow us on 
            <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
        </p>
    </footer>

    <script>
        function togglePassword() {
            const passwords = document.querySelectorAll(".password");
            passwords.forEach((password) => {
                password.type = password.type === "password" ? "text" : "password";
            });
        }
    </script>
    <script src="scripts/pages/emailVerify.js"></script>
    
        
    
    <!-- Session Timeout Script - Only add if user is logged in -->
    <?php if ($isLoggedIn): ?>
        <script src="scripts/session-manager.js"></script>
    <?php endif; ?>
</body>
</html>
