<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    sendResponse(false, "Department ID is required.", null, 400);
}

// Check if dept_head_id is being changed
$oldDeptHeadId = null;
$teamId = null;
if (property_exists($data, 'dept_head_id')) {
    // Get the current dept head before update
    $getCurrentQuery = "SELECT d.dept_head_id, d.team_id FROM departments d WHERE d.id = :id";
    $getCurrentStmt = $db->prepare($getCurrentQuery);
    $getCurrentStmt->bindParam(":id", $data->id);
    $getCurrentStmt->execute();
    $current = $getCurrentStmt->fetch(PDO::FETCH_ASSOC);
    if ($current) {
        $oldDeptHeadId = $current['dept_head_id'];
        $teamId = $current['team_id'];
    }
}

// Build dynamic update query
$fields = [];
$params = [":id" => $data->id];

if (isset($data->name)) {
    $fields[] = "name = :name";
    $params[":name"] = $data->name;
}

if (property_exists($data, 'dept_head_id')) {
    $fields[] = "dept_head_id = :dept_head_id";
    $params[":dept_head_id"] = $data->dept_head_id;
}

if (empty($fields)) {
    sendResponse(false, "No fields to update.", null, 400);
}

try {
    $db->beginTransaction();

    // Update the department
    $query = "UPDATE departments SET " . implode(", ", $fields) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->execute($params);

    // If dept head was changed, handle chat cleanup and creation
    if ($oldDeptHeadId && property_exists($data, 'dept_head_id') && $oldDeptHeadId != $data->dept_head_id) {
        
        // 1. Delete old dept head's private chats with the team leader
        // First get the team leader
        $getLeaderQuery = "SELECT id FROM users WHERE team_id = :team_id AND role = 'team-leader' LIMIT 1";
        $getLeaderStmt = $db->prepare($getLeaderQuery);
        $getLeaderStmt->bindParam(":team_id", $teamId);
        $getLeaderStmt->execute();
        $leader = $getLeaderStmt->fetch(PDO::FETCH_ASSOC);

        if ($leader) {
            // Find private chat between old dept head and leader
            $findChatQuery = "SELECT c.id FROM chats c
                              INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = :old_head_id
                              INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = :leader_id
                              WHERE c.type = 'private'";
            $findChatStmt = $db->prepare($findChatQuery);
            $findChatStmt->bindParam(":old_head_id", $oldDeptHeadId);
            $findChatStmt->bindParam(":leader_id", $leader['id']);
            $findChatStmt->execute();
            $oldChat = $findChatStmt->fetch(PDO::FETCH_ASSOC);

            if ($oldChat) {
                // Delete the old private chat
                $deleteChatQuery = "DELETE FROM chats WHERE id = :chat_id";
                $deleteChatStmt = $db->prepare($deleteChatQuery);
                $deleteChatStmt->bindParam(":chat_id", $oldChat['id']);
                $deleteChatStmt->execute();
            }

            // 2. Create new private chat between new dept head and leader
            if ($data->dept_head_id) {
                // Check if chat already exists
                $checkExistingQuery = "SELECT c.id FROM chats c
                                       INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = :new_head_id
                                       INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = :leader_id
                                       WHERE c.type = 'private' LIMIT 1";
                $checkStmt = $db->prepare($checkExistingQuery);
                $checkStmt->bindParam(":new_head_id", $data->dept_head_id);
                $checkStmt->bindParam(":leader_id", $leader['id']);
                $checkStmt->execute();
                $existingChat = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existingChat) {
                    // Create new chat
                    $createChatQuery = "INSERT INTO chats (type) VALUES ('private')";
                    $createChatStmt = $db->prepare($createChatQuery);
                    $createChatStmt->execute();
                    $newChatId = $db->lastInsertId();

                    // Add participants
                    $addParticipantQuery = "INSERT INTO chat_participants (chat_id, user_id) VALUES (:chat_id, :user_id)";
                    $addStmt = $db->prepare($addParticipantQuery);
                    
                    $addStmt->bindParam(":chat_id", $newChatId);
                    $addStmt->bindParam(":user_id", $leader['id']);
                    $addStmt->execute();
                    
                    $addStmt->bindParam(":chat_id", $newChatId);
                    $addStmt->bindParam(":user_id", $data->dept_head_id);
                    $addStmt->execute();
                }
            }
        }
    }

    $db->commit();
    sendResponse(true, "Department updated successfully.");

} catch (Exception $e) {
    $db->rollBack();
    error_log("Update department error: " . $e->getMessage());
    sendResponse(false, "Unable to update department.", null, 503);
}
?>
