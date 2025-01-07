<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "web";
$conn = mysqli_connect($servername, $username, $password, $dbname);
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
$productId = isset($_POST['productId']) ? $_POST['productId'] : '';
$productName = isset($_POST['productName']) ? $_POST['productName'] : '';
$stars = isset($_POST['rating']) ? floatval($_POST['rating']) : 0;
$ratingCount = isset($_POST['count']) ? intval($_POST['count']) : 0;
$priceCents = isset($_POST['price']) ? intval($_POST['price']) : 0;
$keywords = isset($_POST['keywords']) ? $_POST['keywords'] : '';
$imagePath = '';if (empty($productId)) {
    echo json_encode(["error" => "Product ID is required."]);
    exit;
}
if (!empty($keywords)) {
    $keywordsArray = array_map('trim', explode(',', $keywords)); 
    $keywordsJson = json_encode($keywordsArray);
    if ($keywordsJson === false) {
        echo json_encode(["error" => "Failed to encode keywords to JSON."]);
        exit;
    }
} else {
    $keywordsJson = null;}
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $imageTmpName = $_FILES['image']['tmp_name'];
    $imageName = $_FILES['image']['name'];
    $imageExtension = strtolower(pathinfo($imageName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    if (!in_array($imageExtension, $allowedExtensions)) {
        echo json_encode(["error" => "Invalid image type. Only jpg, jpeg, png, and gif are allowed."]);
        exit;
    }
    $targetDir = "C:/xampp/htdocs/kits-alb/images/products/";
    $relativeImagePath = "./images/products/" . $imageName;
    if (!move_uploaded_file($imageTmpName, $targetDir . $imageName)) {
        echo json_encode(["error" => "Failed to upload the image."]);
        exit;
    }
} else {
    $relativeImagePath = '';
}
$query = "SELECT * FROM products WHERE id = ?";
$stmtCheck = $conn->prepare($query);
$stmtCheck->bind_param("s", $productId);$stmtCheck->execute();
$resultCheck = $stmtCheck->get_result();

if ($resultCheck->num_rows > 0) {
    $sql = "UPDATE products SET 
                name = ?, 
                stars = ?, 
                rating_count = ?, 
                priceCents = ?, 
                image = ?, 
                keywords = ? 
            WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sdiisss", $productName, $stars, $ratingCount, $priceCents, $relativeImagePath, $keywordsJson, $productId);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Product updated successfully"]);
    } else {
        echo json_encode(["error" => "Failed to update product: " . $stmt->error]);
    }
} else {
    $sql = "INSERT INTO products (id, name, stars, rating_count, priceCents, image, keywords) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssdiiss", $productId, $productName, $stars, $ratingCount, $priceCents, $relativeImagePath, $keywordsJson);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Product created successfully"]);
    } else {
        echo json_encode(["error" => "Failed to create product: " . $stmt->error]);
    }
}
$stmt->close();
$stmtCheck->close();
$conn->close();
?>
