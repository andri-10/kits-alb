<?php

include("backend/session-timeout.php");
include("backend/security-config.php");

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
                <img id="currentImg" src="<?php echo htmlspecialchars($user['profile_photo']); ?>".slice(2) alt="Profile Picture">
            <?php } else { ?>
                <img id="currentImg" src="images/default-profile.png" alt="Default Profile Picture">
            <?php } ?>

        <div class='name-and-email'>
        <p class="profile-name"><?php echo htmlspecialchars($user['name']); ?></p>
        <p class="profile-email"><?php echo htmlspecialchars($user['email']); ?></p>   
        </div>
        <div class='profile-buttons'>
                <div class='two-main-buttons'>
                    <button class="edit-profile-btn">Edit profile</button>
                    <a href = passwordreset.php?from=account><button class="reset-password-btn">Reset password</button></a>
                </div>
            </div>
        </div>
    </div>
</div>

<footer class="kits-footer">
    <p>&copy; 2024 Football Kits Albania. All rights reserved.<br>
        Follow us on
        <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
    </p>
</footer>
<script src="scripts/components/shared/KitsFooter.js"></script>
</body>
</html>
