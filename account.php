<?php
session_start();

$servername = "localhost";
$username = "root";
$password = "";
$database = "web";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die("Lidhja me bazën e të dhënave dështoi: " . $conn->connect_error);
}

if (!isset($_SESSION['user_id'])) {
    die("Përdoruesi nuk është autentifikuar. Ju lutem hyni në sistem.");
}

$userId = $_SESSION['user_id'];

$sql = "SELECT name, email, email_verified, profile_photo FROM users WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if (!$user) {
    die("Të dhënat e përdoruesit nuk u gjetën.");
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
    <style>
        body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        header {
            padding: 20px;
            background-color: #131921;
            color: white;
            position: relative;
        }
        .kits-logo, .kits-mobile-logo {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 50px;
            height: auto;
        }
        .kits-mobile-logo {
            display: none;
        }
        @media (max-width: 768px) {
            .kits-logo {
                display: none;
            }
            .kits-mobile-logo {
                display: block;
            }
        }

        .account-container {
            padding: 20px;
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .account-container h1 {
            text-align: center;
            margin-bottom: 20px;
        }
        .profile-info {
            display: flex;
            gap: 20px;
            align-items: center;
        }
        .profile-image {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .profile-image img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
        }
        .profile-image form {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 10px;
        }
        .profile-image input[type="file"] {
            margin-bottom: 10px;
            padding: 10px;
            background-color: #FF9900;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .profile-image input[type="file"]:hover {
            background-color: #ff7f00;
        }
        .profile-image button {
            padding: 10px 15px;
            background-color: #FF9900;
            color: white;
            text-align: center;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        .profile-image button:hover {
            background-color: #ff7f00;
        }
        .user-details p {
            margin: 5px 0;
        }
        .order-history {
            margin-top: 30px;
        }
        .order-history h2 {
            text-align: center;
        }
        .order-history table {
            width: 100%;
            border-collapse: collapse;
        }
        .order-history th, .order-history td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }
        .reset-password-btn {
            display: block;
            margin: 20px auto;
            padding: 10px 15px;
            background-color: #FF9900;
            color: white;
            text-align: center;
            text-decoration: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .reset-password-btn:hover {
            background-color: #ff7f00;
        }
        footer {
            text-align: center;
            padding: 20px;
            background-color: #131921;
            color: white;
            margin-top: auto;
        }
    </style>
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
            <img src="uploads/<?php echo htmlspecialchars($user['profile_photo']); ?>" alt="Foto e Profilit">
            <form action="update_profile_image.php" method="POST" enctype="multipart/form-data">
                <input type="file" name="profile_image" accept="image/*" id="profileImageInput" required>
                <button type="submit">Change Profile Picture</button>
            </form>
        </div>
    </div>
    <div class="user-details">
        <p><strong>Name:</strong> <?php echo htmlspecialchars($user['name']); ?></p>
        <p><strong>Email:</strong> <?php echo htmlspecialchars($user['email']); ?></p>
        <p><strong>Email Verified:</strong> <?php echo $user['email_verified'] ? 'Yes' : 'No'; ?></p>
    </div>

    <a href="passwordreset.php" class="reset-password-btn">Reset Password</a>

    <div class="order-history">
        <h2>Order History</h2>
        <?php if ($orderResult->num_rows > 0): ?>
            <table>
                <tr>
                    <th>Order ID</th>
                    <th>Created At</th>
                    <th>Delivery Date</th>
                    <th>Status</th>
                    <th>Total Price</th>
                </tr>
                <?php while ($order = $orderResult->fetch_assoc()): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($order['id']); ?></td>
                        <td><?php echo htmlspecialchars($order['created_at']); ?></td>
                        <td><?php echo htmlspecialchars($order['delivery_date']); ?></td>
                        <td><?php echo htmlspecialchars($order['status']); ?></td>
                        <td><?php echo htmlspecialchars($order['total_price']); ?></td>
                    </tr>
                <?php endwhile; ?>
            </table>
        <?php else: ?>
            <p>No orders found.</p>
        <?php endif; ?>
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
