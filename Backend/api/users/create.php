<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->username) || 
    !isset($data->password) || 
    !isset($data->name) || 
    !isset($data->email) || 
    !isset($data->role) || 
    !isset($data->bac_matricule) || 
    !isset($data->bac_year)
) {
    sendResponse(false, "Missing required fields.", null, 400);
}

// Check if username exists
$check_username = "SELECT id FROM users WHERE username = :username";
$stmt_username = $db->prepare($check_username);
$stmt_username->bindParam(":username", $data->username);
$stmt_username->execute();

if ($stmt_username->rowCount() > 0) {
    sendResponse(false, "Username already exists.", null, 409);
}

// Check if email exists
$check_email = "SELECT id FROM users WHERE email = :email";
$stmt_email = $db->prepare($check_email);
$stmt_email->bindParam(":email", $data->email);
$stmt_email->execute();

if ($stmt_email->rowCount() > 0) {
    sendResponse(false, "Email already exists.", null, 409);
}

// Check if department already has a head
if ($data->role === 'dept-head' && !empty($data->department_id)) {
    $dept_head_query = "SELECT id FROM users WHERE role = 'dept-head' AND department_id = :department_id";
    $dept_head_stmt = $db->prepare($dept_head_query);
    $dept_head_stmt->bindParam(":department_id", $data->department_id);
    $dept_head_stmt->execute();
    
    if ($dept_head_stmt->rowCount() > 0) {
        sendResponse(false, "This department already has a Department Head.", null, 409);
    }
}

$join_date = isset($data->join_date) && !empty($data->join_date) ? $data->join_date : date('Y-m-d');

$query = "INSERT INTO users (username, password, name, email, role, team_id, department_id, join_date, bac_matricule, bac_year) 
          VALUES (:username, :password, :name, :email, :role, :team_id, :department_id, :join_date, :bac_matricule, :bac_year)";

$stmt = $db->prepare($query);

$hashed_password = password_hash($data->password, PASSWORD_DEFAULT);

$stmt->bindParam(":username", $data->username);
$stmt->bindParam(":password", $hashed_password);
$stmt->bindParam(":name", $data->name);
$stmt->bindParam(":email", $data->email);
$stmt->bindParam(":role", $data->role);
$stmt->bindParam(":team_id", $data->team_id); // Can be null
$stmt->bindParam(":department_id", $data->department_id); // Can be null
$stmt->bindParam(":join_date", $join_date);
$stmt->bindParam(":bac_matricule", $data->bac_matricule);
$stmt->bindParam(":bac_year", $data->bac_year);

if ($stmt->execute()) {
    sendResponse(true, "User created successfully.", ["id" => $db->lastInsertId()], 201);
} else {
    sendResponse(false, "Unable to create user.", null, 503);
}
?>
