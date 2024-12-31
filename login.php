<?php
session_start();

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

// Max failed attempts and block duration for brute force protection
$max_failed_attempts = 7;
$block_duration = 1800; // 30 minutes in seconds

// Check if "Remember me" cookie is set and validate it
if (isset($_COOKIE['remember_me_token'])) {
    $token = $_COOKIE['remember_me_token'];
    $stmt = $conn->prepare("SELECT id, email, role FROM Users WHERE remember_me_token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // User found, log them in
        $user = $result->fetch_assoc();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];

        // Redirect to the appropriate page based on user role
        if ($user['role'] === 'admin') {
            header("Location: admin/dashboard.php");
        } else {
            header("Location: index.php");
        }
        exit;
    }
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST['email'];
    $password = $_POST['password'];

    // If the number of failed attempts exceeds max limit, block the login for a while
    if (isset($_SESSION['failed_attempts']) && $_SESSION['failed_attempts'] >= $max_failed_attempts) {
        $last_failed_attempt = $_SESSION['last_failed_attempt'];
        $current_time = time();
        $time_diff = $current_time - $last_failed_attempt;

        if ($time_diff < $block_duration) {
            $error = "Too many failed attempts. Please try again in 30 minutes.";
        } else {
            $_SESSION['failed_attempts'] = 0; // Reset failed attempts after block time has passed
        }
    }

    if (empty($error)) {
        $stmt = $conn->prepare("SELECT id, password, role FROM Users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();

            if (password_verify($password, $user['password'])) {
                $_SESSION['failed_attempts'] = 0; // Reset failed attempts

                // Create session for logged in user
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_role'] = $user['role'];

                // Handle "Remember Me" functionality
                if (isset($_POST['keep-signed-in'])) {
                    // Generate a unique token for "remember me"
                    $remember_token = bin2hex(random_bytes(32)); // 64-character token

                    // Set the "remember me" cookie for 30 days
                    setcookie("remember_me_token", $remember_token, time() + (30 * 24 * 60 * 60), "/");

                    // Save token to the database to associate with the user
                    $stmt = $conn->prepare("UPDATE Users SET remember_me_token = ? WHERE id = ?");
                    $stmt->bind_param("si", $remember_token, $user['id']);
                    $stmt->execute();
                }

                // Redirect based on the user role
                if ($user['role'] === 'admin') {
                    header("Location: admin.php");
                } else {
                    header("Location: index.php");
                }
                exit;
            } else {
                // Invalid password
                $_SESSION['failed_attempts'] += 1;
                $_SESSION['last_failed_attempt'] = time();
                $error = "Invalid password. Please try again.";
            }
        } else {
            // No account found
            $_SESSION['failed_attempts'] += 1;
            $_SESSION['last_failed_attempt'] = time();
            $error = "No account found with that email.";
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

    <script>
        function togglePassword() {
            var password = document.getElementById("password");
            password.type = password.type === "password" ? "text" : "password";
        }
    </script>
     
</body>
</html>
