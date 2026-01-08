<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$chat_id = isset($_GET['chat_id']) ? $_GET['chat_id'] : null;
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$mark_read = isset($_GET['mark_read']) && $_GET['mark_read'] === 'true';

if (!$chat_id) {
    sendResponse(false, "Chat ID is required.", null, 400);
}

// Verify the user is a participant of this chat (if user_id provided)
if ($user_id) {
    $checkQuery = "SELECT id FROM chat_participants WHERE chat_id = :chat_id AND user_id = :user_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":chat_id", $chat_id);
    $checkStmt->bindParam(":user_id", $user_id);
    $checkStmt->execute();
    
    if (!$checkStmt->fetch()) {
        sendResponse(false, "User is not a participant of this chat.", null, 403);
    }
}

// Get messages for the chat
$query = "SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, u.role as sender_role
          FROM messages m 
          LEFT JOIN users u ON m.sender_id = u.id 
          WHERE m.chat_id = :chat_id
          ORDER BY m.created_at ASC";

$stmt = $db->prepare($query);
$stmt->bindParam(":chat_id", $chat_id);
$stmt->execute();
$messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Mark messages as read if requested (mark all messages from others as read)
if ($mark_read && $user_id) {
    $updateQuery = "UPDATE messages SET is_read = 1 WHERE chat_id = :chat_id AND sender_id != :user_id AND is_read = 0";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(":chat_id", $chat_id);
    $updateStmt->bindParam(":user_id", $user_id);
    $updateStmt->execute();
}

sendResponse(true, "Messages retrieved successfully.", $messages);
?>
