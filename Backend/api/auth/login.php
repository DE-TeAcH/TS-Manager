<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    sendResponse(false, "Username and password are required.", null, 400);
}

$username = $data->username;
$password = $data->password;

$query = "SELECT 
            u.id, u.username, u.password, u.name, u.email, u.role, u.team_id, u.department_id, u.avatar, u.join_date,
            t.name as team_name,
            d.name as department_name
          FROM users u
          LEFT JOIN teams t ON u.team_id = t.id
          LEFT JOIN departments d ON u.department_id = d.id
          WHERE u.username = :username 
          LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(":username", $username);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Verify password
    if (password_verify($password, $row['password'])) {
        // Remove password from response
        unset($row['password']);
        
        // Start session (optional, but good for simple auth)
        // session_start();
        // $_SESSION['user_id'] = $row['id'];
        
        sendResponse(true, "Login successful.", $row);
    } else {
        sendResponse(false, "Invalid password.", null, 401);
    }
} else {
    sendResponse(false, "User not found.", null, 404);
}
?>
