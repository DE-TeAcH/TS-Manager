<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

$ids = [];

if (isset($data->ids) && is_array($data->ids)) {
    $ids = $data->ids;
} elseif (isset($data->id)) {
    $ids = [$data->id];
}

if (empty($ids)) {
    sendResponse(false, "No team IDs provided.", null, 400);
    exit;
}

try {
    $db->beginTransaction();

    // Create a placeholder string for IN clause (e.g., "?,?,?")
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    // 1. Unlink Department Heads (set dept_head_id to NULL)
    // We need to find departments belonging to these teams first.
    // Or we can simple update departments where team_id IN (...)
    
    // UPDATE departments SET dept_head_id = NULL WHERE team_id IN (...)
    $query1 = "UPDATE departments SET dept_head_id = NULL WHERE team_id IN ($placeholders)";
    $stmt1 = $db->prepare($query1);
    $stmt1->execute($ids);

    // 2. Delete Tasks
    // Tasks are linked to department_id OR event_id
    // We need to delete tasks where department_id is in (departments of these teams)
    // OR event_id is in (events of these teams)
    
    // It might be cleaner to just cascade if FKs were set, but assuming manual cleanup:
    
    // Delete tasks linked to events of these teams
    $queryTasksEvents = "DELETE t FROM tasks t 
                         INNER JOIN events e ON t.event_id = e.id 
                         WHERE e.team_id IN ($placeholders)";
    $stmtTasksEvents = $db->prepare($queryTasksEvents);
    $stmtTasksEvents->execute($ids);

    // Delete tasks linked to departments of these teams
    $queryTasksDepts = "DELETE t FROM tasks t 
                        INNER JOIN departments d ON t.department_id = d.id 
                        WHERE d.team_id IN ($placeholders)";
    $stmtTasksDepts = $db->prepare($queryTasksDepts);
    $stmtTasksDepts->execute($ids);

    // 3. Delete Events
    $queryEvents = "DELETE FROM events WHERE team_id IN ($placeholders)";
    $stmtEvents = $db->prepare($queryEvents);
    $stmtEvents->execute($ids);

    // 4. Delete Messages (associated with users of these teams)
    // Sender OR Receiver in the team?
    // Let's delete messages where sender_id or receiver_id is a user in these teams.
    $queryMessages = "DELETE m FROM messages m 
                      INNER JOIN users u1 ON m.sender_id = u1.id 
                      WHERE u1.team_id IN ($placeholders)";
    $stmtMessages = $db->prepare($queryMessages);
    $stmtMessages->execute($ids);
    
    // Note: We might want to keep messages if the other party is outside the team?
    // But currently users only chat within teams presumably, or if they are deleted, their messages usually go.
    // Also delete where receiver is in the team
    $queryMessagesRecv = "DELETE m FROM messages m 
                          INNER JOIN users u2 ON m.receiver_id = u2.id 
                          WHERE u2.team_id IN ($placeholders)";
    $stmtMessagesRecv = $db->prepare($queryMessagesRecv);
    $stmtMessagesRecv->execute($ids);

    // 5. Delete Users
    $queryUsers = "DELETE FROM users WHERE team_id IN ($placeholders)";
    $stmtUsers = $db->prepare($queryUsers);
    $stmtUsers->execute($ids);

    // 6. Delete Departments
    $queryDepts = "DELETE FROM departments WHERE team_id IN ($placeholders)";
    $stmtDepts = $db->prepare($queryDepts);
    $stmtDepts->execute($ids);

    // 7. Delete Teams
    $queryTeams = "DELETE FROM teams WHERE id IN ($placeholders)";
    $stmtTeams = $db->prepare($queryTeams);
    $stmtTeams->execute($ids);

    $db->commit();
    sendResponse(true, "Teams deleted successfully.");

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Delete Teams Error: " . $e->getMessage());
    sendResponse(false, "Failed to delete teams: " . $e->getMessage(), null, 503);
}
?>
