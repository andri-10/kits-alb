<?php
session_start();
include("backend/security-config.php");


$servername = "localhost"; 
$username = "root";        
$password = "";            
$dbname = "web";      


$conn = mysqli_connect($servername, $username, $password, $dbname);


if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

$queryTotalOrders = "SELECT COUNT(*) as total_orders FROM order_items WHERE id IS NOT NULL";
$resultTotalOrders = mysqli_query($conn, $queryTotalOrders);
$totalOrders = $resultTotalOrders ? mysqli_fetch_assoc($resultTotalOrders)['total_orders'] : 0;


$queryTotalEarnings = "SELECT SUM(amount) as total_earnings FROM payment_logs";
$resultTotalEarnings = mysqli_query($conn, $queryTotalEarnings);
$totalEarnings = $resultTotalEarnings ? mysqli_fetch_assoc($resultTotalEarnings)['total_earnings'] : 0;


$totalEarningsFormatted = number_format($totalEarnings / 100, 2);
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kits Alb - Admin Dashboard</title>
    <link rel="stylesheet" href="styles/shared/kits-header.css">
    <link rel="stylesheet" href="styles/shared/kits-footer.css">
    <link rel="stylesheet" href="styles/admin/admin.css">
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

    <main class="admin-dashboard">
    <section class="stats-section">
        <div class="stat-card">
            <h3>Total Earnings</h3>
            <p>$<?php echo $totalEarningsFormatted; ?></p>
        </div>
        <div class="stat-card">
            <h3>Total Sales</h3>
            <p><?php echo $totalOrders; ?></p>
        </div>
    </section>

    <section class="management-section">
        <div class="products-management">
            <h2>Manage Products</h2>
            <button id="create-product-btn">Create New Product</button>
            <div id="product-list">
                <details>
                    <summary>Product List</summary>
                    <table id="product-list-table">
                    </table>
                </details>
            </div>
        </div>
    </section>

    <div id="edit-product-container"></div>

    <section class="users-management">
        <h2>Manage Users</h2>
        <div id="user-list">
            <details>
                <summary>Users List</summary>
                <table id="user-list-table"></table>
            </details>
        </div>
    </section>

    <div id="edit-product-container"></div>
</main>

    <footer class="kits-footer">
        <p>&copy; 2024 Football Kits Albania. All rights reserved.<br>
            Follow us on
            <a href="https://instagram.com/kits.alb" target="_blank" class="footer-link">Instagram</a>
        </p>
    </footer>
    <script src="scripts/components/shared/KitsFooter.js"></script>
    
    <script type="module" src="scripts/pages/admin.js"></script>
</body>
</html>
