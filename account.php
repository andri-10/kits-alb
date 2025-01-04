<?php
include("backend/session-timeout.php");

$servername = "localhost";
$username = "root";
$password = "";
$database = "web";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (!isset($_SESSION['user_id'])) {
    die("User not authenticated. Please log in.");
}

$userId = $_SESSION['user_id'];

$sql = "SELECT name, email, email_verified, profile_photo FROM users WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    die("User data not found.");
}

$orderSql = "SELECT id, created_at, delivery_date, status, total_price FROM orders WHERE user_id = ?";
$orderStmt = $conn->prepare($orderSql);
$orderStmt->bind_param("i", $userId);
$orderStmt->execute();
$orderResult = $orderStmt->get_result();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Profile</title>
    <link rel="stylesheet" href="styles/pages/account.css">
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/shared/kits-footer.css">
    <script src="scripts/pages/account.js" defer></script>
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

<div class="account-container">
    <h1>User Profile</h1>
    <div class="profile-info">
        <div class="profile-image">
            <?php if ($user['profile_photo']) { ?>
                <img src="images/users-pfp/<?php echo htmlspecialchars($user['profile_photo']); ?>" alt="Profile Picture">
            <?php } else { ?>
                <img src="images/default-profile.png" alt="Default Profile Picture">
            <?php } ?>

        <div class='name-and-email'>
        <p class="profile-name"><?php echo htmlspecialchars($user['name']); ?></p>
        <p class="profile-email"><?php echo htmlspecialchars($user['email']); ?></p>   
        </div>
            <form action="backend/update-profile-image.php" method="POST" enctype="multipart/form-data">
                <label class="choose-image-btn">
                    Choose New Picture
                    <input type="file" name="profile_image" accept="image/*" required>
                </label>
                <button type="submit" class="change-picture-btn">Change Profile Picture</button>
            </form>
        </div>
    </div>
    

    <a href="#" id="reset-password-btn" class="reset-password-btn">Reset Password</a>

    <!-- Reset Password Form -->
    <div id="reset-password-form" class="reset-password-form">
        <form action="backend/reset-password.php" method="POST">
            <input type="password" name="new_password" id="new-password" placeholder="Enter new password" required>
            <input type="password" name="confirm_password" id="confirm-password" placeholder="Confirm password" required>
            <label>
                <input type="checkbox" id="show-password"> Show password
            </label>
            <span id="password-error" class="error-message"></span>
            <button type="submit">Reset Password</button>
        </form>
    </div>
</div>

<footer class="kits-footer">
    <p>&copy; 2024 Football Kits Albania. All rights reserved.<br>
        Follow us on
        <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
    </p>
</footer>

</body>
</html>
