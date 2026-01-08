<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->task_id) || 
    !isset($data->user_ids) || 
    !is_array($data->user_ids)
) {
    sendResponse(false, "Missing required fields (task_id, user_ids array).", null, 400);
}

try {
    $db->beginTransaction();

    // 1. Remove existing assignments for this task
    $deleteQuery = "DELETE FROM task_assignments WHERE task_id = :task_id";
    $deleteStmt = $db->prepare($deleteQuery);
    $deleteStmt->bindParam(":task_id", $data->task_id);
    $deleteStmt->execute();

    // 2. Insert new assignments
    if (!empty($data->user_ids)) {
        $insertQuery = "INSERT INTO task_assignments (task_id, user_id) VALUES (:task_id, :user_id)";
        $insertStmt = $db->prepare($insertQuery);

        foreach ($data->user_ids as $userId) {
            $insertStmt->bindParam(":task_id", $data->task_id);
            $insertStmt->bindParam(":user_id", $userId);
            $insertStmt->execute();
        }

        // 3. Create or update group chat for this task
        // Get task info including department head and event name
        $taskQuery = "SELECT t.*, t.title as task_title, t.department_id, d.dept_head_id, e.title as event_title
                      FROM tasks t 
                      LEFT JOIN departments d ON t.department_id = d.id 
                      LEFT JOIN events e ON t.event_id = e.id
                      WHERE t.id = :task_id";
        $taskStmt = $db->prepare($taskQuery);
        $taskStmt->bindParam(":task_id", $data->task_id);
        $taskStmt->execute();
        $task = $taskStmt->fetch(PDO::FETCH_ASSOC);

        if ($task) {
            // Check if a group chat already exists for this task
            $chatCheckQuery = "SELECT id FROM chats WHERE task_id = :task_id AND type = 'group'";
            $chatCheckStmt = $db->prepare($chatCheckQuery);
            $chatCheckStmt->bindParam(":task_id", $data->task_id);
            $chatCheckStmt->execute();
            $existingChat = $chatCheckStmt->fetch(PDO::FETCH_ASSOC);

            $chatId = null;

            if ($existingChat) {
                // Chat exists, we'll update participants
                $chatId = $existingChat['id'];
                
                // Remove all participants except dept head
                $removeParticipantsQuery = "DELETE FROM chat_participants WHERE chat_id = :chat_id";
                $removeStmt = $db->prepare($removeParticipantsQuery);
                $removeStmt->bindParam(":chat_id", $chatId);
                $removeStmt->execute();
            } else {
                // Create new chat with format: "Event Name - Task Name"
                $eventName = $task['event_title'] ?? 'Event';
                $taskName = $task['task_title'] ?? 'Task';
                $chatName = $eventName . ' - ' . $taskName;
                $createChatQuery = "INSERT INTO chats (type, name, task_id) VALUES ('group', :name, :task_id)";
                $chatStmt = $db->prepare($createChatQuery);
                $chatStmt->bindParam(":name", $chatName);
                $chatStmt->bindParam(":task_id", $data->task_id);
                $chatStmt->execute();
                $chatId = $db->lastInsertId();
            }

            // Add all assigned members to the chat
            $addParticipantQuery = "INSERT IGNORE INTO chat_participants (chat_id, user_id) VALUES (:chat_id, :user_id)";
            $addStmt = $db->prepare($addParticipantQuery);

            foreach ($data->user_ids as $userId) {
                $addStmt->bindParam(":chat_id", $chatId);
                $addStmt->bindParam(":user_id", $userId);
                $addStmt->execute();
            }

            // Also add the department head to the chat if exists
            if (!empty($task['dept_head_id'])) {
                $addStmt->bindParam(":chat_id", $chatId);
                $addStmt->bindParam(":user_id", $task['dept_head_id']);
                $addStmt->execute();
            }
        }
    }

    $db->commit();
    sendResponse(true, "Members assigned successfully.", null, 200);

} catch (Exception $e) {
    $db->rollBack();
    error_log("Assignment error: " . $e->getMessage());
    sendResponse(false, "Unable to assign members.", null, 503);
}
?>
