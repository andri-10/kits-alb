<?php
session_start();
require __DIR__ . '/backend/utils.php';
include("backend/security-config.php");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$error = '';
$email = '';
$password = '';
$step = 1;
$max_failed_attempts = 7;
$block_duration = 1800;

function logLoginAttempt($conn, $email, $status) {
    $stmt = $conn->prepare("INSERT INTO login_logs (email, status, timestamp) VALUES (?, ?, NOW())");
    $stmt->bind_param("ss", $email, $status);
    $stmt->execute();
    $stmt->close();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Check if the email has failed attempts logged
    $stmt = $conn->prepare("SELECT failed_attempts, last_failed_attempt FROM failed_login_attempts WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $failed_data = $result->fetch_assoc();
    $stmt->close();

    $failed_attempts = $failed_data['failed_attempts'] ?? 0;
    $last_failed_attempt = strtotime($failed_data['last_failed_attempt'] ?? '1970-01-01 00:00:00');

    if ($failed_attempts >= $max_failed_attempts) {
        $current_time = time();
        $time_diff = $current_time - $last_failed_attempt;
        
        if ($time_diff < $block_duration) {
            
            $error = "Too many failed attempts. Please try again later";
        } else {
            
            $stmt = $conn->prepare("UPDATE failed_login_attempts SET failed_attempts = 0 WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $stmt->close();
            $failed_attempts = 0;
        }
    }

    if (empty($error)) {
        $stmt = $conn->prepare("SELECT id, email, password, role, email_verified, profile_photo, name FROM Users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();

            if (password_verify($password, $user['password'])) {
                // Successful login
                $stmt = $conn->prepare("DELETE FROM failed_login_attempts WHERE email = ?");
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $stmt->close();

                logLoginAttempt($conn, $email, 'success');
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_role'] = $user['role'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['profile_photo'] = $user['profile_photo'];

                if (isset($_POST['keep-signed-in'])) {
                    $remember_token = bin2hex(random_bytes(32));
                    setcookie("remember_me_token", $remember_token, time() + (30 * 24 * 60 * 60), "/");

                    $stmt = $conn->prepare("UPDATE Users SET remember_me_token = ? WHERE id = ?");
                    $stmt->bind_param("si", $remember_token, $user['id']);
                    $stmt->execute();
                }

                if ($user['role'] === 'admin') {
                    header("Location: admin.php");
                } else {
                    header("Location: index.php");
                }
                exit;
            }
        }

        // Generic error for incorrect email or password
        if ($failed_attempts === 0) {
            $stmt = $conn->prepare("INSERT INTO failed_login_attempts (email, failed_attempts, last_failed_attempt) VALUES (?, 1, NOW())");
            $stmt->bind_param("s", $email);
        } else {
            $stmt = $conn->prepare("UPDATE failed_login_attempts SET failed_attempts = failed_attempts + 1, last_failed_attempt = NOW() WHERE email = ?");
            $stmt->bind_param("s", $email);
        }
        $stmt->execute();
        $stmt->close();

        logLoginAttempt($conn, $email, 'failed');
        $error = "Invalid email or password.";
    }
}

$conn->close();
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="styles/pages/login.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/shared/kits-footer.css">
    <title>Login</title>
</head>
<body>
    <header class="kits-header">
        <section class="kits-header-left-section">
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
                        Welcome back to 
                        <span class="yellowText">
                            Kits Alb
                        </span>
                    </p>
                    <div class="yellowLine"></div>
                </div>
                <p class="text-blk subHeading">
                    Please sign in to continue
                </p>
            </div>

            <div class="responsive-container-block container">
                <div class="responsive-cell-block wk-tab-12 wk-mobile-12 wk-desk-7 wk-ipadp-10 line">
                    <form class="form-box" action="" method="POST">
                        <div class="container-block form-wrapper">
                            <div class="responsive-container-block">
                                <div class="left4">
                                    <div class="responsive-cell-block wk-ipadp-6 wk-tab-12 wk-mobile-12 wk-desk-6">
                                        <input class="input" id="email" name="email" placeholder="Email Address" required value="<?php echo htmlspecialchars($email); ?>">
                                    </div>
                                    <div class="responsive-cell-block wk-desk-6 wk-ipadp-6 wk-tab-12 wk-mobile-12">
                                        <input class="input" id="password" name="password" placeholder="Password" type="password" required>
                                    </div>
                                </div>
                            </div>
                            <div class="checkbox-container">
                                <input type="checkbox" id="show-password" onclick="togglePassword()">
                                <label for="show-password">Show Password</label>
                            </div>
                            <div class="checkbox-container">
                                <input type="checkbox" id="keep-signed-in" name="keep-signed-in">
                                <label for="keep-signed-in">Keep me signed in</label>
                            </div>
                            <input type="submit" name="submit" value = "Sign in" class="send">
                            <?php if ($error): ?>
                        <div class="error-message">
                            <?php echo $error; ?>
                        </div>
                    <?php endif; ?>
                        </div>
                    </form>
                    <div class="links">
                        <a class = "link" href="passwordreset.php">Forgot your password?</a>
                        <p>New to Kits Alb? <a class = "link" href="registration.php">Create your account.</a></p>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>

    <footer class="kits-footer">
      <p>&copy; 2024 Football Kits Albania. All rights reserved. <br> Follow us on 
        <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
      </p>
    </footer>
    <script src="scripts/components/shared/KitsFooter.js"></script>
    <script>
        function togglePassword() {
            var password = document.getElementById("password");
            password.type = password.type === "password" ? "text" : "password";
        }
    </script>
     
</body>
</html>