<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    sendResponse(false, "No data provided.", null, 400);
}

$type = isset($data->type) ? $data->type : null;
$participant_ids = isset($data->participant_ids) ? $data->participant_ids : [];
$task_id = isset($data->task_id) ? $data->task_id : null;
$name = isset($data->name) ? $data->name : null;

if (!$type || !in_array($type, ['private', 'group'])) {
    sendResponse(false, "Valid chat type (private/group) is required.", null, 400);
}

if (count($participant_ids) < 2) {
    sendResponse(false, "At least 2 participants are required.", null, 400);
}

// For private chats, check if one already exists between these two users
if ($type === 'private' && count($participant_ids) === 2) {
    $checkQuery = "SELECT c.id FROM chats c
                   INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = :user1
                   INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = :user2
                   WHERE c.type = 'private'
                   LIMIT 1";
    
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":user1", $participant_ids[0]);
    $checkStmt->bindParam(":user2", $participant_ids[1]);
    $checkStmt->execute();
    $existingChat = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingChat) {
        sendResponse(true, "Chat already exists.", ['id' => $existingChat['id'], 'existing' => true]);
        exit;
    }
}

// For group chats linked to tasks, check if one already exists
if ($type === 'group' && $task_id) {
    $checkQuery = "SELECT id FROM chats WHERE task_id = :task_id AND type = 'group' LIMIT 1";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":task_id", $task_id);
    $checkStmt->execute();
    $existingChat = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingChat) {
        // Add any new participants that might not be in the chat yet
        foreach ($participant_ids as $uid) {
            $insertParticipant = "INSERT IGNORE INTO chat_participants (chat_id, user_id) VALUES (:chat_id, :user_id)";
            $pStmt = $db->prepare($insertParticipant);
            $pStmt->bindParam(":chat_id", $existingChat['id']);
            $pStmt->bindParam(":user_id", $uid);
            $pStmt->execute();
        }
        sendResponse(true, "Chat already exists for this task.", ['id' => $existingChat['id'], 'existing' => true]);
        exit;
    }
}

try {
    $db->beginTransaction();
    
    // Create the chat
    $insertChat = "INSERT INTO chats (type, name, task_id) VALUES (:type, :name, :task_id)";
    $stmt = $db->prepare($insertChat);
    $stmt->bindParam(":type", $type);
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":task_id", $task_id);
    $stmt->execute();
    
    $chatId = $db->lastInsertId();
    
    // Add participants
    foreach ($participant_ids as $userId) {
        $insertParticipant = "INSERT INTO chat_participants (chat_id, user_id) VALUES (:chat_id, :user_id)";
        $pStmt = $db->prepare($insertParticipant);
        $pStmt->bindParam(":chat_id", $chatId);
        $pStmt->bindParam(":user_id", $userId);
        $pStmt->execute();
    }
    
    $db->commit();
    
    sendResponse(true, "Chat created successfully.", ['id' => $chatId, 'existing' => false]);
    
} catch (Exception $e) {
    $db->rollBack();
    sendResponse(false, "Failed to create chat: " . $e->getMessage(), null, 500);
}
?>
