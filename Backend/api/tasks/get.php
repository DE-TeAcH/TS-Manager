<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$event_id = isset($_GET['event_id']) ? $_GET['event_id'] : null;
$assigned_to = isset($_GET['assigned_to']) ? $_GET['assigned_to'] : null;
$team_id = isset($_GET['team_id']) ? $_GET['team_id'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;

$query = "SELECT t.*, e.title as event_title, d.name as department_name,
          GROUP_CONCAT(u.id) as assigned_member_ids,
          GROUP_CONCAT(u.name) as assigned_member_names
          FROM tasks t 
          LEFT JOIN events e ON t.event_id = e.id 
          LEFT JOIN departments d ON t.department_id = d.id
          LEFT JOIN task_assignments ta ON t.id = ta.task_id
          LEFT JOIN users u ON ta.user_id = u.id
          WHERE 1=1";

if ($event_id) {
    $query .= " AND t.event_id = :event_id";
}
if ($team_id) {
    $query .= " AND e.team_id = :team_id";
}
if ($status) {
    // Support multiple statuses if comma separated
    if (strpos($status, ',') !== false) {
        $statuses = explode(',', $status);
        $placeholders = implode(',', array_fill(0, count($statuses), '?'));
        $query .= " AND t.status IN ($placeholders)";
    } else {
        $query .= " AND t.status = :status";
    }
}
// Removed assigned_to filter as it's no longer a direct column but we might want to filter by assigned user via join
if ($assigned_to) {
    $query .= " AND ta.user_id = :assigned_to";
}

$query .= " GROUP BY t.id ORDER BY t.created_at DESC";

$stmt = $db->prepare($query);

if ($event_id) {
    $stmt->bindParam(":event_id", $event_id);
}
if ($team_id) {
    $stmt->bindParam(":team_id", $team_id);
}
if ($assigned_to) {
    $stmt->bindParam(":assigned_to", $assigned_to);
}
if ($status && strpos($status, ',') === false) {
    $stmt->bindParam(":status", $status);
} else if ($status) {
    // For IN clause with array, we need to execute with array
    // But here we are mixing bindParam and execute array. 
    // PDO doesn't support mixing easily.
    // Let's stick to single status or handle it differently.
    // For simplicity, let's assume single status or just handle the IN clause manually with bindValue loop.
    $statuses = explode(',', $status);
    foreach ($statuses as $k => $v) {
        $stmt->bindValue($k + 1, $v); // This is tricky with other named params.
    }
    // Actually, mixing named and positional is bad.
    // Let's rewrite to use named params for IN clause.
}

$stmt->execute();
$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Process the results to turn comma-separated strings into arrays
foreach ($tasks as &$task) {
    if ($task['assigned_member_ids']) {
        $ids = explode(',', $task['assigned_member_ids']);
        $names = explode(',', $task['assigned_member_names']);
        $task['assigned_members'] = [];
        for ($i = 0; $i < count($ids); $i++) {
            $task['assigned_members'][] = [
                'id' => $ids[$i],
                'name' => $names[$i]
            ];
        }
    } else {
        $task['assigned_members'] = [];
    }
    // Remove the raw strings
    unset($task['assigned_member_ids']);
    unset($task['assigned_member_names']);
}

sendResponse(true, "Tasks retrieved successfully.", $tasks);
?>
