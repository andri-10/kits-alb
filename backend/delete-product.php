<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";
$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
$productId = isset($_POST['productId']) ? $_POST['productId'] : (isset($_GET['productId']) ? $_GET['productId'] : '');
if (empty($productId)) {
    echo json_encode(["error" => "Product ID is required."]);
    exit;
}
$query = "SELECT * FROM products WHERE id = ?";
$stmtCheck = $conn->prepare($query);
$stmtCheck->bind_param("s", $productId);$stmtCheck->execute();
$resultCheck = $stmtCheck->get_result();

if ($resultCheck->num_rows > 0) {
    $product = $resultCheck->fetch_assoc();
    $imagePath = $product['image'];
    $sql = "DELETE FROM products WHERE id = ?";
    $stmtDelete = $conn->prepare($sql);
    $stmtDelete->bind_param("s", $productId);

    if ($stmtDelete->execute()) {
        if (!empty($imagePath) && file_exists($_SERVER['DOCUMENT_ROOT'] . $imagePath)) {
            unlink($_SERVER['DOCUMENT_ROOT'] . $imagePath);        }

        echo json_encode(["success" => true, "message" => "Product deleted successfully"]);
    } else {
        echo json_encode(["error" => "Failed to delete product: " . $stmtDelete->error]);
    }

} else {
    echo json_encode(["error" => "Product not found."]);
}
$stmtDelete->close();
$stmtCheck->close();
$conn->close();
?>
