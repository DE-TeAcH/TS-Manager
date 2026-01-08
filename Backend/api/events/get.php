<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

// Get filter and sort parameters
$team_id = isset($_GET['team_id']) ? $_GET['team_id'] : null;
$sort_by = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'date'; // 'date' or 'title'
$sort_order = isset($_GET['sort_order']) ? $_GET['sort_order'] : 'asc'; // 'asc' or 'desc'

$query = "SELECT e.*, t.name as team_name 
          FROM events e 
          LEFT JOIN teams t ON e.team_id = t.id 
          WHERE 1=1";

if ($team_id) {
    $query .= " AND e.team_id = :team_id";
}

// Add sorting
if ($sort_by === 'title') {
    $query .= " ORDER BY e.title " . ($sort_order === 'desc' ? 'DESC' : 'ASC');
} else {
    // Default: sort by date
    $query .= " ORDER BY e.date " . ($sort_order === 'desc' ? 'DESC' : 'ASC') . ", e.start_time " . ($sort_order === 'desc' ? 'DESC' : 'ASC');
}

$stmt = $db->prepare($query);

if ($team_id) {
    $stmt->bindParam(":team_id", $team_id);
}

$stmt->execute();
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(true, "Events retrieved successfully.", $events);
?>
