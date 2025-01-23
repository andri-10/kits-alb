<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();


$servername = "localhost";
$username = "root"; 
$password = "";
$dbname = "web"; 


$conn = new mysqli($servername, $username, $password, $dbname);


if ($conn->connect_error) {
    echo json_encode(['status' => 'error', 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit;
}


$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

if ($user_id === null) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}


$sql = "
    SELECT 
        c.id AS cart_id,         
        c.user_id, 
        c.product_id,
        p.name AS product_name,
        p.priceCents AS product_pricecents,
        p.image AS product_image,
        c.size AS cart_size,
        c.delivery_option AS delivery_option,
        c.created_at
    FROM shopping_cart c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
";


$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();


$result = $stmt->get_result();

if ($result->num_rows > 0) {
    
    $products = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'data' => $products]);
} else {
    echo json_encode(['success' => true, 'data' => []]); 
}


$stmt->close();
$conn->close();
?>
