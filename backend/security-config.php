<?php

// Define routes and access rules
$routes = [
    'account.php' => ['logged'],
    'admin.php' => ['admin'],
    'catalog.php' => ['all'],
    'checkout.php' => ['logged'],
    'contact.php' => ['all'],
    'index.php' => ['all'],
    'login.php' => ['guest'],
    'orders.php' => ['logged'],
    'passwordreset.php' => ['all'],
    'registration.php' => ['guest'],
    'tracking.php' => ['logged'],
    'verify-email.php' => ['all'],
    'view-product.php' => ['all'],
];

// Define the current file
$currentFile = basename($_SERVER['PHP_SELF']);

// Check if the file is in the allowed routes
if (!array_key_exists($currentFile, $routes)) {
    header("Location: 404-not-found.php");
    exit;
}

// Access control logic
$access = $routes[$currentFile];

if (in_array('all', $access)) {
    // Everyone can access
    return;
}

if (in_array('guest', $access)) {
    if (isset($_SESSION['user_id'])) {
        header("Location: index.php");
        exit;
    }
}

if (in_array('logged', $access)) {
    if (!isset($_SESSION['user_id'])) {
        
        $redirectToLogin = ['tracking.php', 'checkout.php', 'orders.php'];
        if (in_array($currentFile, $redirectToLogin)) {
            header("Location: login.php");
        } else {
            header("Location: index.php");
        }
        exit;
    }
}

if (in_array('admin', $access)) {
    if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
        header("Location: 404-not-found.php");
        exit;
    }
}
?>
