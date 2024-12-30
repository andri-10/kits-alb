<?php
include("backend/session-timeout.php");

// Check if the user is logged in
$isLoggedIn = isset($_SESSION['user_id']);
?>

<?php
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

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $new_password = $_POST['new_password'];
    $confirm_password = $_POST['confirm_password'];

    if ($new_password !== $confirm_password) {
        $error = "Passwords do not match.";
    } else {
        $hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

        $stmt = $conn->prepare("SELECT * FROM Users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $stmt = $conn->prepare("UPDATE Users SET password = ? WHERE email = ?");
            $stmt->bind_param("ss", $hashed_password, $email);

            if ($stmt->execute()) {
                $success = "Password reset successful. You can now log in.";
            } else {
                $error = "Something went wrong. Please try again.";
            }
        } else {
            $error = "No account found with this email.";
        }
        $stmt->close();
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
                <div class="responsive-container-block container">
                    <div class="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-7 wk-ipadp-10 line" id="i69b">
                        <form class="form-box" action="" method="POST">
                            <div class="container-block form-wrapper">
                                <div class="responsive-container-block">
                                    <div class="left4">
                                        <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                                            <input class="input" id="email" name="email" placeholder="Enter your email" required type="email">
                                        </div>
                                        <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                                            <input class="input" id="new_password" name="new_password" placeholder="Enter a new password" required type="password">
                                        </div>
                                        <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                                            <input class="input" id="confirm_password" name="confirm_password" placeholder="Confirm your password" required type="password">
                                        </div>
                                    </div>
                                </div>
                                <input type="submit" name="submit" class="send" id="w-c-s-bgc_p-1-dm-id">
                                <p  class = "return"><a class = "link" href = "login.php">Return to Sign In</a></p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

    <footer class="kits-footer">
      <p>&copy; 2024 Kits Alb. All rights reserved. <br> Follow us on 
        <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
      </p>
    </footer>
    <!-- Session Timeout Script - Only add if user is logged in -->
 <?php if ($isLoggedIn): ?>
    <script src="scripts/session-manager.js"></script>
<?php endif; ?>
</body>
 
</html>
