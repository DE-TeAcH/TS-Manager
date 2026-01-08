<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$chat_id = isset($_GET['chat_id']) ? $_GET['chat_id'] : null;

if (!$user_id && !$chat_id) {
    sendResponse(false, "User ID or Chat ID is required.", null, 400);
}

if ($chat_id) {
    // Get specific chat
    $query = "SELECT c.*, 
              GROUP_CONCAT(DISTINCT cp.user_id) as participant_ids,
              GROUP_CONCAT(DISTINCT u.name) as participant_names,
              t.title as task_title,
              t.id as linked_task_id
              FROM chats c
              LEFT JOIN chat_participants cp ON c.id = cp.chat_id
              LEFT JOIN users u ON cp.user_id = u.id
              LEFT JOIN tasks t ON c.task_id = t.id
              WHERE c.id = :chat_id
              GROUP BY c.id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":chat_id", $chat_id);
    $stmt->execute();
    $chat = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($chat) {
        // Process participants
        if ($chat['participant_ids']) {
            $ids = explode(',', $chat['participant_ids']);
            $names = explode(',', $chat['participant_names']);
            $chat['participants'] = [];
            for ($i = 0; $i < count($ids); $i++) {
                $chat['participants'][] = [
                    'id' => $ids[$i],
                    'name' => $names[$i]
                ];
            }
        } else {
            $chat['participants'] = [];
        }
        unset($chat['participant_ids']);
        unset($chat['participant_names']);
        
        sendResponse(true, "Chat retrieved successfully.", $chat);
    } else {
        sendResponse(false, "Chat not found.", null, 404);
    }
} else {
    // Get all chats for a user
    $query = "SELECT c.*, 
              GROUP_CONCAT(DISTINCT CONCAT(u2.id, ':{|}:', u2.name, ':{|}:', COALESCE(u2.role, '')) SEPARATOR ':{||}:') as participant_details,
              t.title as task_title,
              (SELECT m.content FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
              (SELECT m.created_at FROM messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
              (SELECT u3.name FROM messages m JOIN users u3 ON m.sender_id = u3.id WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_sender,
              (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id AND m.sender_id != :user_id2 AND m.is_read = 0) as unread_count
              FROM chats c
              INNER JOIN chat_participants cp ON c.id = cp.chat_id AND cp.user_id = :user_id
              LEFT JOIN chat_participants cp2 ON c.id = cp2.chat_id
              LEFT JOIN users u2 ON cp2.user_id = u2.id
              LEFT JOIN tasks t ON c.task_id = t.id
              GROUP BY c.id
              ORDER BY last_message_time DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_id);
    $stmt->bindParam(":user_id2", $user_id);
    $stmt->execute();
    $chats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process each chat
    foreach ($chats as &$chat) {
        $chat['participants'] = [];
        
        if ($chat['participant_details']) {
            $participants = explode(':{||}:', $chat['participant_details']);
            foreach ($participants as $p) {
                $details = explode(':{|}:', $p);
                if (count($details) >= 2) {
                    $chat['participants'][] = [
                        'id' => $details[0],
                        'name' => $details[1],
                        'role' => isset($details[2]) && $details[2] !== '' ? $details[2] : null
                    ];
                }
            }
        }
        unset($chat['participant_details']);
        
        // For private chats, set the name as the other participant's name
        if ($chat['type'] === 'private' && count($chat['participants']) > 0) {
            foreach ($chat['participants'] as $p) {
                if ($p['id'] != $user_id) {
                    $chat['display_name'] = $p['name'];
                    $chat['other_user_role'] = $p['role'];
                    break;
                }
            }
        } else {
            $chat['display_name'] = $chat['name'] ?: ($chat['task_title'] ? $chat['task_title'] . ' Chat' : 'Group Chat');
        }
    }
    
    sendResponse(true, "Chats retrieved successfully.", $chats);
}
?>
