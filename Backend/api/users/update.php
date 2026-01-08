<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    sendResponse(false, "User ID is required.", null, 400);
}

// Build dynamic update query
$fields = [];
$params = [":id" => $data->id];

if (isset($data->username)) {
    $fields[] = "username = :username";
    $params[":username"] = $data->username;
}
if (isset($data->name)) {
    $fields[] = "name = :name";
    $params[":name"] = $data->name;
}
if (isset($data->email)) {
    $fields[] = "email = :email";
    $params[":email"] = $data->email;
}
if (isset($data->role)) {
    $fields[] = "role = :role";
    $params[":role"] = $data->role;
}
if (isset($data->team_id)) {
    $fields[] = "team_id = :team_id";
    $params[":team_id"] = $data->team_id;
}
if (isset($data->department_id)) {
    $fields[] = "department_id = :department_id";
    $params[":department_id"] = $data->department_id;
}
if (isset($data->password)) {
    $fields[] = "password = :password";
    $params[":password"] = password_hash($data->password, PASSWORD_DEFAULT);
}
if (property_exists($data, 'bac_matricule')) {
    $fields[] = "bac_matricule = :bac_matricule";
    $params[":bac_matricule"] = $data->bac_matricule;
}
if (property_exists($data, 'bac_year')) {
    $fields[] = "bac_year = :bac_year";
    $params[":bac_year"] = $data->bac_year;
}

if (empty($fields)) {
    sendResponse(false, "No fields to update.", null, 400);
}

$query = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = :id";
$stmt = $db->prepare($query);

if ($stmt->execute($params)) {
    sendResponse(true, "User updated successfully.");
} else {
    sendResponse(false, "Unable to update user.", null, 503);
}
?>
