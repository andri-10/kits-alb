<?php
// Database connection (inline)
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";

// Create connection
$conn = mysqli_connect($servername, $username, $password, $dbname);

// Check connection
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Get productId from POST or GET request
$productId = isset($_POST['productId']) ? $_POST['productId'] : (isset($_GET['productId']) ? $_GET['productId'] : '');

// Validate if productId is provided
if (empty($productId)) {
    echo json_encode(["error" => "Product ID is required."]);
    exit;
}

// Check if the product exists in the database
$query = "SELECT * FROM products WHERE id = ?";
$stmtCheck = $conn->prepare($query);
$stmtCheck->bind_param("s", $productId); // Bind the productId parameter
$stmtCheck->execute();
$resultCheck = $stmtCheck->get_result();

if ($resultCheck->num_rows > 0) {
    // Product exists, fetch the image path
    $product = $resultCheck->fetch_assoc();
    $imagePath = $product['image'];

    // Delete product from the database
    $sql = "DELETE FROM products WHERE id = ?";
    $stmtDelete = $conn->prepare($sql);
    $stmtDelete->bind_param("s", $productId);

    if ($stmtDelete->execute()) {
        // Optionally, delete the image file from the server
        if (!empty($imagePath) && file_exists($_SERVER['DOCUMENT_ROOT'] . $imagePath)) {
            unlink($_SERVER['DOCUMENT_ROOT'] . $imagePath);  // Deletes the image from the server
        }

        echo json_encode(["success" => true, "message" => "Product deleted successfully"]);
    } else {
        echo json_encode(["error" => "Failed to delete product: " . $stmtDelete->error]);
    }

} else {
    // Product not found
    echo json_encode(["error" => "Product not found."]);
}

// Close statement and connection
$stmtDelete->close();
$stmtCheck->close();
$conn->close();
?>
