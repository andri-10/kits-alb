<?php
include("backend/session-timeout.php");

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

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];

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
        
    } elseif (strlen($password) < 8 || !preg_match("/[A-Z]/", $password) || !preg_match("/[^a-zA-Z0-9]/", $password) ) {
        // Check for password conditions
        $error = "Password must be at least 8 characters long, must contain at least 1 uppercase letter, and at least 1 special character.";
    } else {
        // Hash the password before inserting into the database
        $hashed_password = password_hash($password, PASSWORD_BCRYPT);

        // Insert user into database
        $stmt = $conn->prepare("INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, 'user')");
        $stmt->bind_param("sss", $username, $email, $hashed_password);

        if ($stmt->execute()) {
            $success = "Registration successful. Redirecting to login...";
            echo '<script>
                    setTimeout(function() {
                        window.location.href = "login.php";
                    }, 1200); 
                  </script>';
            $username = '';
            $email = '';
        } else {
            $error = "Something went wrong. Please try again.";
        }
    }
    $stmt->close();
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
                <p class="text-blk subHeading">
                    Join us and start your journey with Kits Alb!
                </p>
            </div>
            <div class="responsive-container-block container">
                <div class="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-7 wk-ipadp-10 line" id="i69b">
                    <form class="form-box" action="" method="POST">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <div class="left4">
                                    <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                                        <input class="input" id="username" name="username" placeholder="Username" value="<?= htmlspecialchars($username); ?>" required>
                                    </div>
                                    <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                                        <input class="input" id="email" name="email" placeholder="Email" value="<?= htmlspecialchars($email); ?>" required type="email">
                                    </div>
                                    <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                                        <input class="input" id="password" name="password" placeholder="Password" required type="password">
                                    </div>
                                    <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                                        <input class="input" id="confirm_password" name="confirm_password" placeholder="Confirm Password" required type="password">
                                    </div>
                                </div>
                            </div>
                            <input type="submit" name="submit" class="send" value="Create Account" id="w-c-s-bgc_p-1-dm-id">

                            <p class="return"> Already have an account? <a class="link" href="login.php">Sign In</a></p>

                            <!-- Displaying error messages -->
                            <?php if ($error != ''): ?>
                                <p class="error-message"><?= $error; ?></p>
                            <?php endif; ?>

                            <!-- Displaying success message -->
                            <?php if ($success != ''): ?>
                                <p class="success-message"><?= $success; ?></p>
                            <?php endif; ?>
                        </div>
                    </form>
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
</body>
</html>
