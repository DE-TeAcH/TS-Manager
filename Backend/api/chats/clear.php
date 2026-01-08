<?php
/**
 * Clear all messages from a chat but keep the chat itself
 * Used for manual "delete" action - preserves the conversation structure
 */
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->chat_id)) {
    sendResponse(false, "Chat ID is required.", null, 400);
}

$chatId = $data->chat_id;
$userId = isset($data->user_id) ? $data->user_id : null;

// Verify user is a participant of this chat (if provided)
if ($userId) {
    $checkQuery = "SELECT id FROM chat_participants WHERE chat_id = :chat_id AND user_id = :user_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":chat_id", $chatId);
    $checkStmt->bindParam(":user_id", $userId);
    $checkStmt->execute();
    
    if (!$checkStmt->fetch()) {
        sendResponse(false, "User is not a participant of this chat.", null, 403);
    }
}

try {
    // Delete all messages from this chat
    $deleteQuery = "DELETE FROM messages WHERE chat_id = :chat_id";
    $stmt = $db->prepare($deleteQuery);
    $stmt->bindParam(":chat_id", $chatId);
    $stmt->execute();
    
    $deletedCount = $stmt->rowCount();
    
    sendResponse(true, "Chat cleared successfully.", ['messages_deleted' => $deletedCount]);
    
} catch (Exception $e) {
    error_log("Clear chat error: " . $e->getMessage());
    sendResponse(false, "Unable to clear chat.", null, 503);
}
?>
