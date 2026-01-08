<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$team_id = isset($_GET['team_id']) ? $_GET['team_id'] : null;

$query = "SELECT d.id, d.name, d.team_id, d.dept_head_id, u.name as dept_head_name 
          FROM departments d 
          LEFT JOIN users u ON d.dept_head_id = u.id 
          WHERE 1=1";

if ($team_id) {
    $query .= " AND d.team_id = :team_id";
}

$query .= " ORDER BY d.name ASC";

$stmt = $db->prepare($query);

if ($team_id) {
    $stmt->bindParam(":team_id", $team_id);
}

$stmt->execute();
$departments = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(true, "Departments retrieved successfully.", $departments);
?>
