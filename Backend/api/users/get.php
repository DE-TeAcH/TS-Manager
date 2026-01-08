<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$role = isset($_GET['role']) ? $_GET['role'] : null;
$dept_id = isset($_GET['department_id']) ? $_GET['department_id'] : null;
$team_id = isset($_GET['team_id']) ? $_GET['team_id'] : null;

$query = "SELECT u.id, u.username, u.name, u.email, u.role, u.team_id, u.department_id, u.avatar, u.join_date, 
                 t.name as team_name, d.name as department_name , 
                 u.bac_matricule as bac_matricule, u.bac_year as bac_year 
          FROM users u 
          LEFT JOIN teams t ON u.team_id = t.id 
          LEFT JOIN departments d ON u.department_id = d.id 
          WHERE 1=1 AND u.role <> 'admin'";

if ($role) {
    $query .= " AND u.role = :role";
}
if ($dept_id) {
    $query .= " AND u.department_id = :dept_id";
}
if ($team_id) {
    $query .= " AND u.team_id = :team_id";  // FIX: Add this line!
}

$stmt = $db->prepare($query);  // FIX: You were missing this line too!

if ($role) {
    $stmt->bindParam(":role", $role);
}
if ($dept_id) {
    $stmt->bindParam(":dept_id", $dept_id);
}
if ($team_id) {
    $stmt->bindParam(":team_id", $team_id);
}

$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(true, "Users retrieved successfully.", $users);
?>