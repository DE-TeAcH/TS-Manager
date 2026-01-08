<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->name) || !isset($data->team_id)) {
    sendResponse(false, "Department name and team ID are required.");
    exit();
}

// Check if department name already exists in this team
$checkQuery = "SELECT id FROM departments WHERE name = :name AND team_id = :team_id";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(":name", $data->name);
$checkStmt->bindParam(":team_id", $data->team_id);
$checkStmt->execute();

if ($checkStmt->rowCount() > 0) {
    sendResponse(false, "A department with this name already exists in this team.");
    exit();
}

// If dept_head_id is provided, verify the user exists and has the correct role
if (isset($data->dept_head_id) && $data->dept_head_id) {
    $userQuery = "SELECT id, role FROM users WHERE id = :user_id";
    $userStmt = $db->prepare($userQuery);
    $userStmt->bindParam(":user_id", $data->dept_head_id);
    $userStmt->execute();
    
    if ($userStmt->rowCount() === 0) {
        sendResponse(false, "Simple member user not found.");
        exit();
    }
    
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    if ($user['role'] !== 'member') {
        sendResponse(false, "Selected user must have the 'member' role.");
        exit();
    }
}

// Insert the new department
$query = "INSERT INTO departments (name, team_id, dept_head_id) VALUES (:name, :team_id, :dept_head_id)";
$stmt = $db->prepare($query);

$stmt->bindParam(":name", $data->name);
$stmt->bindParam(":team_id", $data->team_id);

$dept_head_id = isset($data->dept_head_id) ? $data->dept_head_id : null;
$stmt->bindParam(":dept_head_id", $dept_head_id);

if ($stmt->execute()) {
    $newDeptId = $db->lastInsertId();
    
    // If a dept_head_id was provided, update the user's department_id
    if ($dept_head_id) {
        $updateUserQuery = "UPDATE users SET role = 'dept-head', department_id = :dept_id WHERE id = :user_id";
        $updateUserStmt = $db->prepare($updateUserQuery);
        $updateUserStmt->bindParam(":dept_id", $newDeptId);
        $updateUserStmt->bindParam(":user_id", $dept_head_id);
        $updateUserStmt->execute();
    }
    
    sendResponse(true, "Department created successfully.", ["id" => $newDeptId]);
} else {
    sendResponse(false, "Failed to create department.");
}
?>
