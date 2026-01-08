<?php
include_once '../../config/database.php';
include_once '../../utils/cors.php';
include_once '../../utils/response.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->name) &&
    !empty($data->leader_name) &&
    !empty($data->leader_email) &&
    !empty($data->leader_username) && 
    !empty($data->leader_password) &&
    !empty($data->leader_bac_matricule) &&
    !empty($data->leader_bac_year) &&
    !empty($data->category)
) {
    try {
        $db->beginTransaction();

        // 1. Create Team
        $query = "INSERT INTO teams (name, description, category, created_at) VALUES (:name, :description, :category, NOW())";
        $stmt = $db->prepare($query);

        $description = !empty($data->description) ? $data->description : "";

        $stmt->bindParam(":name", $data->name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":category", $data->category);

        if (!$stmt->execute()) {
            throw new Exception("Unable to create team.");
        }

        $teamId = $db->lastInsertId();

        // 2. Create Team Leader User
        $queryUser = "INSERT INTO users (name, email, username, password, role, team_id, join_date, created_at, bac_matricule, bac_year) VALUES (:name, :email, :username, :password, 'team-leader', :team_id, CURDATE(), NOW(), :bac_matricule, :bac_year)";
        $stmtUser = $db->prepare($queryUser);

        $password_hash = password_hash($data->leader_password, PASSWORD_BCRYPT);

        $stmtUser->bindParam(":name", $data->leader_name);
        $stmtUser->bindParam(":email", $data->leader_email);
        $stmtUser->bindParam(":username", $data->leader_username);
        $stmtUser->bindParam(":password", $password_hash);
        $stmtUser->bindParam(":team_id", $teamId);
        $stmtUser->bindParam(":bac_matricule", $data->leader_bac_matricule);
        $stmtUser->bindParam(":bac_year", $data->leader_bac_year);

        if (!$stmtUser->execute()) {
            throw new Exception("Unable to create team leader.");
        }

        $db->commit();

        sendResponse(true, "Team and Team Leader created successfully.", ["team_id" => $teamId], 201);

    } catch (Exception $e) {
        $db->rollBack();
        sendResponse(false, "Failed to create team: " . $e->getMessage(), null, 503);
    }
} else {
    sendResponse(false, "Incomplete data. Name, leader details, and category are required.", null, 400);
}
?>
