-- =====================================================
-- SEED DATA SCRIPT FOR TS_MANAGER DATABASE
-- =====================================================
-- This script populates the database with sample data:
-- - 5 Teams: Codin, Phi, Zenix, Qabas, Phenix
-- - ~25 members per team (125 total users)
-- - 4-5 departments per team
-- - Multiple events (past and upcoming) with tasks
-- =====================================================

-- Clear existing data (KEEP ADMIN - save it first)
CREATE TEMPORARY TABLE temp_admin AS SELECT * FROM users WHERE role = 'admin';

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE task_assignments;
TRUNCATE TABLE tasks;
TRUNCATE TABLE events;
TRUNCATE TABLE departments;
TRUNCATE TABLE users;
TRUNCATE TABLE teams;

SET FOREIGN_KEY_CHECKS = 1;

-- Restore admin user
INSERT INTO users SELECT * FROM temp_admin;
DROP TEMPORARY TABLE temp_admin;

-- =====================================================
-- INSERT TEAMS
-- =====================================================
INSERT INTO teams (name, description, created_at) VALUES
('Codin', 'Technology and Software Development Team', NOW()),
('Phi', 'Science and Research Team', NOW()),
('Zenix', 'Arts and Creative Team', NOW()),
('Qabas', 'Sports and Athletics Team', NOW()),
('Phenix', 'Community Service and Outreach Team', NOW());

-- =====================================================
-- INSERT DEPARTMENTS FOR EACH TEAM
-- =====================================================

-- Codin Departments (Tech team)
INSERT INTO departments (name, team_id, created_at) VALUES
('Web Development', 1, NOW()),
('Mobile Apps', 1, NOW()),
('AI & Machine Learning', 1, NOW()),
('Cybersecurity', 1, NOW()),
('DevOps', 1, NOW());

-- Phi Departments (Science team)
INSERT INTO departments (name, team_id, created_at) VALUES
('Physics Research', 2, NOW()),
('Chemistry Lab', 2, NOW()),
('Biology Studies', 2, NOW()),
('Mathematics', 2, NOW());

-- Zenix Departments (Arts team)
INSERT INTO departments (name, team_id, created_at) VALUES
('Digital Design', 3, NOW()),
('Photography', 3, NOW()),
('Music Production', 3, NOW()),
('Creative Writing', 3, NOW()),
('Video Editing', 3, NOW());

-- Qabas Departments (Sports team)
INSERT INTO departments (name, team_id, created_at) VALUES
('Football', 4, NOW()),
('Basketball', 4, NOW()),
('Athletics', 4, NOW()),
('Swimming', 4, NOW());

-- Phenix Departments (Community team)
INSERT INTO departments (name, team_id, created_at) VALUES
('Event Planning', 5, NOW()),
('Volunteer Coordination', 5, NOW()),
('Social Media', 5, NOW()),
('Fundraising', 5, NOW()),
('Community Outreach', 5, NOW());

-- =====================================================
-- INSERT USERS (25 per team = 125 total)
-- =====================================================

-- CODIN TEAM (Team ID: 1)
INSERT INTO users (username, password, name, email, bac_matricule, bac_year, role, team_id, department_id, created_at) VALUES
-- Team Leader
('sarah.johnson', '$2y$10$abcdefghijklmnopqrstuv', 'Sarah Johnson', 'sarah.j@codin.com', '12345678', '2020', 'team-leader', 1, NULL, NOW()),
-- Dept Heads (5)
('alex.web', '$2y$10$abcdefghijklmnopqrstuv', 'Alex Thompson', 'alex.t@codin.com', '23456789', '2019', 'dept-head', 1, 1, NOW()),
('maya.mobile', '$2y$10$abcdefghijklmnopqrstuv', 'Maya Patel', 'maya.p@codin.com', '34567890', '2019', 'dept-head', 1, 2, NOW()),
('james.ai', '$2y$10$abcdefghijklmnopqrstuv', 'James Wilson', 'james.w@codin.com', '45678901', '2020', 'dept-head', 1, 3, NOW()),
('lisa.cyber', '$2y$10$abcdefghijklmnopqrstuv', 'Lisa Anderson', 'lisa.a@codin.com', '56789012', '2019', 'dept-head', 1, 4, NOW()),
('ryan.devops', '$2y$10$abcdefghijklmnopqrstuv', 'Ryan Garcia', 'ryan.g@codin.com', '67890123', '2020', 'dept-head', 1, 5, NOW()),
-- Members (19)
('tom.dev1', '$2y$10$abcdefghijklmnopqrstuv', 'Tom Harris', 'tom.h@codin.com', '78901234', '2021', 'member', 1, 1, NOW()),
('anna.dev2', '$2y$10$abcdefghijklmnopqrstuv', 'Anna Lee', 'anna.l@codin.com', '89012345', '2021', 'member', 1, 1, NOW()),
('chris.dev3', '$2y$10$abcdefghijklmnopqrstuv', 'Chris Martin', 'chris.m@codin.com', '90123456', '2022', 'member', 1, 1, NOW()),
('nina.dev4', '$2y$10$abcdefghijklmnopqrstuv', 'Nina Rodriguez', 'nina.r@codin.com', '01234567', '2022', 'member', 1, 1, NOW()),
('jake.mobile1', '$2y$10$abcdefghijklmnopqrstuv', 'Jake Taylor', 'jake.t@codin.com', '11234568', '2021', 'member', 1, 2, NOW()),
('sophia.mobile2', '$2y$10$abcdefghijklmnopqrstuv', 'Sophia White', 'sophia.w@codin.com', '21234569', '2021', 'member', 1, 2, NOW()),
('lucas.mobile3', '$2y$10$abcdefghijklmnopqrstuv', 'Lucas Brown', 'lucas.b@codin.com', '31234570', '2022', 'member', 1, 2, NOW()),
('emma.ai1', '$2y$10$abcdefghijklmnopqrstuv', 'Emma Davis', 'emma.d@codin.com', '41234571', '2021', 'member', 1, 3, NOW()),
('noah.ai2', '$2y$10$abcdefghijklmnopqrstuv', 'Noah Miller', 'noah.m@codin.com', '51234572', '2022', 'member', 1, 3, NOW()),
('olivia.ai3', '$2y$10$abcdefghijklmnopqrstuv', 'Olivia Wilson', 'olivia.w@codin.com', '61234573', '2022', 'member', 1, 3, NOW()),
('liam.cyber1', '$2y$10$abcdefghijklmnopqrstuv', 'Liam Moore', 'liam.m@codin.com', '71234574', '2021', 'member', 1, 4, NOW()),
('ava.cyber2', '$2y$10$abcdefghijklmnopqrstuv', 'Ava Taylor', 'ava.t@codin.com', '81234575', '2022', 'member', 1, 4, NOW()),
('ethan.cyber3', '$2y$10$abcdefghijklmnopqrstuv', 'Ethan Anderson', 'ethan.a@codin.com', '91234576', '2022', 'member', 1, 4, NOW()),
('mia.devops1', '$2y$10$abcdefghijklmnopqrstuv', 'Mia Thomas', 'mia.t@codin.com', '02345678', '2021', 'member', 1, 5, NOW()),
('william.devops2', '$2y$10$abcdefghijklmnopqrstuv', 'William Jackson', 'william.j@codin.com', '12345679', '2021', 'member', 1, 5, NOW()),
('isabella.devops3', '$2y$10$abcdefghijklmnopqrstuv', 'Isabella White', 'isabella.w@codin.com', '22345680', '2022', 'member', 1, 5, NOW()),
('james.dev5', '$2y$10$abcdefghijklmnopqrstuv', 'James Martinez', 'james.mart@codin.com', '32345681', '2022', 'member', 1, 1, NOW()),
('charlotte.dev6', '$2y$10$abcdefghijklmnopqrstuv', 'Charlotte Garcia', 'charlotte.g@codin.com', '42345682', '2022', 'member', 1, 2, NOW()),
('benjamin.ai4', '$2y$10$abcdefghijklmnopqrstuv', 'Benjamin Lopez', 'benjamin.l@codin.com', '52345683', '2022', 'member', 1, 3, NOW());

-- PHI TEAM (Team ID: 2) - 25 users
INSERT INTO users (username, password, name, email, bac_matricule, bac_year, role, team_id, department_id, created_at) VALUES
('michael.chen', '$2y$10$abcdefghijklmnopqrstuv', 'Michael Chen', 'michael.c@phi.com', '62345684', '2019', 'team-leader', 2, NULL, NOW()),
('dr.physics', '$2y$10$abcdefghijklmnopqrstuv', 'Dr. Robert Smith', 'robert.s@phi.com', '72345685', '2018', 'dept-head', 2, 6, NOW()),
('dr.chemistry', '$2y$10$abcdefghijklmnopqrstuv', 'Dr. Jennifer Lee', 'jennifer.l@phi.com', '82345686', '2018', 'dept-head', 2, 7, NOW()),
('dr.biology', '$2y$10$abcdefghijklmnopqrstuv', 'Dr. David Kim', 'david.k@phi.com', '92345687', '2019', 'dept-head', 2, 8, NOW()),
('dr.math', '$2y$10$abcdefghijklmnopqrstuv', 'Dr. Sarah Ahmed', 'sarah.a@phi.com', '03456789', '2018', 'dept-head', 2, 9, NOW()),
('alice.physics1', '$2y$10$abcdefghijklmnopqrstuv', 'Alice Johnson', 'alice.j@phi.com', '13456790', '2021', 'member', 2, 6, NOW()),
('bob.physics2', '$2y$10$abcdefghijklmnopqrstuv', 'Bob Williams', 'bob.w@phi.com', '23456791', '2021', 'member', 2, 6, NOW()),
('carol.physics3', '$2y$10$abcdefghijklmnopqrstuv', 'Carol Brown', 'carol.b@phi.com', '33456792', '2022', 'member', 2, 6, NOW()),
('daniel.physics4', '$2y$10$abcdefghijklmnopqrstuv', 'Daniel Jones', 'daniel.j@phi.com', '43456793', '2022', 'member', 2, 6, NOW()),
('emily.chem1', '$2y$10$abcdefghijklmnopqrstuv', 'Emily Garcia', 'emily.g@phi.com', '53456794', '2021', 'member', 2, 7, NOW()),
('frank.chem2', '$2y$10$abcdefghijklmnopqrstuv', 'Frank Miller', 'frank.m@phi.com', '63456795', '2021', 'member', 2, 7, NOW()),
('grace.chem3', '$2y$10$abcdefghijklmnopqrstuv', 'Grace Davis', 'grace.d@phi.com', '73456796', '2022', 'member', 2, 7, NOW()),
('henry.chem4', '$2y$10$abcdefghijklmnopqrstuv', 'Henry Rodriguez', 'henry.r@phi.com', '83456797', '2022', 'member', 2, 7, NOW()),
('iris.bio1', '$2y$10$abcdefghijklmnopqrstuv', 'Iris Martinez', 'iris.m@phi.com', '93456798', '2021', 'member', 2, 8, NOW()),
('jack.bio2', '$2y$10$abcdefghijklmnopqrstuv', 'Jack Hernandez', 'jack.h@phi.com', '04567890', '2021', 'member', 2, 8, NOW()),
('kate.bio3', '$2y$10$abcdefghijklmnopqrstuv', 'Kate Lopez', 'kate.l@phi.com', '14567891', '2022', 'member', 2, 8, NOW()),
('leo.bio4', '$2y$10$abcdefghijklmnopqrstuv', 'Leo Gonzalez', 'leo.g@phi.com', '24567892', '2022', 'member', 2, 8, NOW()),
('mary.math1', '$2y$10$abcdefghijklmnopqrstuv', 'Mary Wilson', 'mary.w@phi.com', '34567893', '2021', 'member', 2, 9, NOW()),
('nick.math2', '$2y$10$abcdefghijklmnopqrstuv', 'Nick Anderson', 'nick.a@phi.com', '44567894', '2021', 'member', 2, 9, NOW()),
('olivia.math3', '$2y$10$abcdefghijklmnopqrstuv', 'Olivia Thomas', 'olivia.t@phi.com', '54567895', '2022', 'member', 2, 9, NOW()),
('paul.math4', '$2y$10$abcdefghijklmnopqrstuv', 'Paul Taylor', 'paul.t@phi.com', '64567896', '2022', 'member', 2, 9, NOW()),
('quinn.physics5', '$2y$10$abcdefghijklmnopqrstuv', 'Quinn Moore', 'quinn.m@phi.com', '74567897', '2022', 'member', 2, 6, NOW()),
('rachel.chem5', '$2y$10$abcdefghijklmnopqrstuv', 'Rachel Jackson', 'rachel.j@phi.com', '84567898', '2022', 'member', 2, 7, NOW()),
('sam.bio5', '$2y$10$abcdefghijklmnopqrstuv', 'Sam Martin', 'sam.m@phi.com', '94567899', '2022', 'member', 2, 8, NOW()),
('tina.math5', '$2y$10$abcdefghijklmnopqrstuv', 'Tina Lee', 'tina.l@phi.com', '05678901', '2022', 'member', 2, 9, NOW());

-- ZENIX TEAM (Team ID: 3) - 25 users
INSERT INTO users (username, password, name, email, bac_matricule, bac_year, role, team_id, department_id, created_at) VALUES
('emma.williams', '$2y$10$abcdefghijklmnopqrstuv', 'Emma Williams', 'emma.w@zenix.com', '15678902', '2019', 'team-leader', 3, NULL, NOW()),
('head.design', '$2y$10$abcdefghijklmnopqrstuv', 'Sophie Turner', 'sophie.t@zenix.com', '25678903', '2019', 'dept-head', 3, 10, NOW()),
('head.photo', '$2y$10$abcdefghijklmnopqrstuv', 'Marcus Brown', 'marcus.b@zenix.com', '35678904', '2019', 'dept-head', 3, 11, NOW()),
('head.music', '$2y$10$abcdefghijklmnopqrstuv', 'Aria Chen', 'aria.c@zenix.com', '45678905', '2020', 'dept-head', 3, 12, NOW()),
('head.writing', '$2y$10$abcdefghijklmnopqrstuv', 'Oliver Green', 'oliver.g@zenix.com', '55678906', '2019', 'dept-head', 3, 13, NOW()),
('head.video', '$2y$10$abcdefghijklmnopqrstuv', 'Luna Martinez', 'luna.m@zenix.com', '65678907', '2020', 'dept-head', 3, 14, NOW()),
('alex.design1', '$2y$10$abcdefghijklmnopqrstuv', 'Alex Rivera', 'alex.r@zenix.com', '75678908', '2021', 'member', 3, 10, NOW()),
('bella.design2', '$2y$10$abcdefghijklmnopqrstuv', 'Bella Santos', 'bella.s@zenix.com', '85678909', '2021', 'member', 3, 10, NOW()),
('carlos.design3', '$2y$10$abcdefghijklmnopqrstuv', 'Carlos Diaz', 'carlos.d@zenix.com', '95678910', '2022', 'member', 3, 10, NOW()),
('diana.photo1', '$2y$10$abcdefghijklmnopqrstuv', 'Diana Foster', 'diana.f@zenix.com', '06789012', '2021', 'member', 3, 11, NOW()),
('eric.photo2', '$2y$10$abcdefghijklmnopqrstuv', 'Eric Hayes', 'eric.h@zenix.com', '16789013', '2021', 'member', 3, 11, NOW()),
('fiona.photo3', '$2y$10$abcdefghijklmnopqrstuv', 'Fiona Irwin', 'fiona.i@zenix.com', '26789014', '2022', 'member', 3, 11, NOW()),
('george.music1', '$2y$10$abcdefghijklmnopqrstuv', 'George Kelly', 'george.k@zenix.com', '36789015', '2021', 'member', 3, 12, NOW()),
('hannah.music2', '$2y$10$abcdefghijklmnopqrstuv', 'Hannah Lewis', 'hannah.l@zenix.com', '46789016', '2021', 'member', 3, 12, NOW()),
('ivan.music3', '$2y$10$abcdefghijklmnopqrstuv', 'Ivan Murphy', 'ivan.m@zenix.com', '56789017', '2022', 'member', 3, 12, NOW()),
('julia.writing1', '$2y$10$abcdefghijklmnopqrstuv', 'Julia Nelson', 'julia.n@zenix.com', '66789018', '2021', 'member', 3, 13, NOW()),
('kevin.writing2', '$2y$10$abcdefghijklmnopqrstuv', 'Kevin Owen', 'kevin.o@zenix.com', '76789019', '2021', 'member', 3, 13, NOW()),
('laura.writing3', '$2y$10$abcdefghijklmnopqrstuv', 'Laura Parker', 'laura.p@zenix.com', '86789020', '2022', 'member', 3, 13, NOW()),
('mike.video1', '$2y$10$abcdefghijklmnopqrstuv', 'Mike Quinn', 'mike.q@zenix.com', '96789021', '2021', 'member', 3, 14, NOW()),
('nancy.video2', '$2y$10$abcdefghijklmnopqrstuv', 'Nancy Ross', 'nancy.r@zenix.com', '07890123', '2021', 'member', 3, 14, NOW()),
('oscar.video3', '$2y$10$abcdefghijklmnopqrstuv', 'Oscar Stone', 'oscar.s@zenix.com', '17890124', '2022', 'member', 3, 14, NOW()),
('petra.design4', '$2y$10$abcdefghijklmnopqrstuv', 'Petra Torres', 'petra.t@zenix.com', '27890125', '2022', 'member', 3, 10, NOW()),
('quinn.photo4', '$2y$10$abcdefghijklmnopqrstuv', 'Quinn Upton', 'quinn.u@zenix.com', '37890126', '2022', 'member', 3, 11, NOW()),
('rosa.music4', '$2y$10$abcdefghijklmnopqrstuv', 'Rosa Vega', 'rosa.v@zenix.com', '47890127', '2022', 'member', 3, 12, NOW()),
('steve.writing4', '$2y$10$abcdefghijklmnopqrstuv', 'Steve Walsh', 'steve.w@zenix.com', '57890128', '2022', 'member', 3, 13, NOW());

-- QABAS TEAM (Team ID: 4) - 25 users
INSERT INTO users (username, password, name, email, bac_matricule, bac_year, role, team_id, department_id, created_at) VALUES
('david.martinez', '$2y$10$abcdefghijklmnopqrstuv', 'David Martinez', 'david.m@qabas.com', '67890129', '2019', 'team-leader', 4, NULL, NOW()),
('coach.football', '$2y$10$abcdefghijklmnopqrstuv', 'Coach Ryan Smith', 'ryan.s@qabas.com', '77890130', '2018', 'dept-head', 4, 15, NOW()),
('coach.basketball', '$2y$10$abcdefghijklmnopqrstuv', 'Coach Lisa Johnson', 'lisa.j@qabas.com', '87890131', '2018', 'dept-head', 4, 16, NOW()),
('coach.athletics', '$2y$10$abcdefghijklmnopqrstuv', 'Coach Mark Davis', 'mark.d@qabas.com', '97890132', '2019', 'dept-head', 4, 17, NOW()),
('coach.swimming', '$2y$10$abcdefghijklmnopqrstuv', 'Coach Amy Wilson', 'amy.w@qabas.com', '08901234', '2018', 'dept-head', 4, 18, NOW()),
('player.fb1', '$2y$10$abcdefghijklmnopqrstuv', 'Jake Anderson', 'jake.a@qabas.com', '18901235', '2021', 'member', 4, 15, NOW()),
('player.fb2', '$2y$10$abcdefghijklmnopqrstuv', 'Tyler Brown', 'tyler.b@qabas.com', '28901236', '2021', 'member', 4, 15, NOW()),
('player.fb3', '$2y$10$abcdefghijklmnopqrstuv', 'Brandon Clark', 'brandon.c@qabas.com', '38901237', '2022', 'member', 4, 15, NOW()),
('player.fb4', '$2y$10$abcdefghijklmnopqrstuv', 'Connor Davis', 'connor.d@qabas.com', '48901238', '2022', 'member', 4, 15, NOW()),
('player.fb5', '$2y$10$abcdefghijklmnopqrstuv', 'Dylan Evans', 'dylan.e@qabas.com', '58901239', '2022', 'member', 4, 15, NOW()),
('player.bb1', '$2y$10$abcdefghijklmnopqrstuv', 'Marcus Foster', 'marcus.f@qabas.com', '68901240', '2021', 'member', 4, 16, NOW()),
('player.bb2', '$2y$10$abcdefghijklmnopqrstuv', 'Jordan Green', 'jordan.g@qabas.com', '78901241', '2021', 'member', 4, 16, NOW()),
('player.bb3', '$2y$10$abcdefghijklmnopqrstuv', 'Kobe Harris', 'kobe.h@qabas.com', '88901242', '2022', 'member', 4, 16, NOW()),
('player.bb4', '$2y$10$abcdefghijklmnopqrstuv', 'LeBron Irving', 'lebron.i@qabas.com', '98901243', '2022', 'member', 4, 16, NOW()),
('player.bb5', '$2y$10$abcdefghijklmnopqrstuv', 'Stephen Jackson', 'stephen.j@qabas.com', '09012345', '2022', 'member', 4, 16, NOW()),
('athlete.track1', '$2y$10$abcdefghijklmnopqrstuv', 'Usain Kelly', 'usain.k@qabas.com', '19012346', '2021', 'member', 4, 17, NOW()),
('athlete.track2', '$2y$10$abcdefghijklmnopqrstuv', 'Florence Lewis', 'florence.l@qabas.com', '29012347', '2021', 'member', 4, 17, NOW()),
('athlete.track3', '$2y$10$abcdefghijklmnopqrstuv', 'Carl Miller', 'carl.m@qabas.com', '39012348', '2022', 'member', 4, 17, NOW()),
('athlete.track4', '$2y$10$abcdefghijklmnopqrstuv', 'Allyson Nelson', 'allyson.n@qabas.com', '49012349', '2022', 'member', 4, 17, NOW()),
('swimmer.pool1', '$2y$10$abcdefghijklmnopqrstuv', 'Michael Owen', 'michael.o@qabas.com', '59012350', '2021', 'member', 4, 18, NOW()),
('swimmer.pool2', '$2y$10$abcdefghijklmnopqrstuv', 'Katie Parker', 'katie.p@qabas.com', '69012351', '2021', 'member', 4, 18, NOW()),
('swimmer.pool3', '$2y$10$abcdefghijklmnopqrstuv', 'Ryan Quinn', 'ryan.q@qabas.com', '79012352', '2022', 'member', 4, 18, NOW()),
('swimmer.pool4', '$2y$10$abcdefghijklmnopqrstuv', 'Sarah Ross', 'sarah.r@qabas.com', '89012353', '2022', 'member', 4, 18, NOW()),
('player.fb6', '$2y$10$abcdefghijklmnopqrstuv', 'Ethan Stone', 'ethan.s@qabas.com', '99012354', '2022', 'member', 4, 15, NOW()),
('player.bb6', '$2y$10$abcdefghijklmnopqrstuv', 'Chris Turner', 'chris.t@qabas.com', '00123456', '2022', 'member', 4, 16, NOW());

-- PHENIX TEAM (Team ID: 5) - 25 users
INSERT INTO users (username, password, name, email, bac_matricule, bac_year, role, team_id, department_id, created_at) VALUES
('olivia.brown', '$2y$10$abcdefghijklmnopqrstuv', 'Olivia Brown', 'olivia.b@phenix.com', '10123457', '2019', 'team-leader', 5, NULL, NOW()),
('head.events', '$2y$10$abcdefghijklmnopqrstuv', 'Amanda Cooper', 'amanda.c@phenix.com', '20123458', '2019', 'dept-head', 5, 19, NOW()),
('head.volunteer', '$2y$10$abcdefghijklmnopqrstuv', 'Brian Edwards', 'brian.e@phenix.com', '30123459', '2019', 'dept-head', 5, 20, NOW()),
('head.social', '$2y$10$abcdefghijklmnopqrstuv', 'Chloe Fisher', 'chloe.f@phenix.com', '40123460', '2020', 'dept-head', 5, 21, NOW()),
('head.fundraising', '$2y$10$abcdefghijklmnopqrstuv', 'Derek Grant', 'derek.g@phenix.com', '50123461', '2019', 'dept-head', 5, 22, NOW()),
('head.outreach', '$2y$10$abcdefghijklmnopqrstuv', 'Elena Hughes', 'elena.h@phenix.com', '60123462', '2020', 'dept-head', 5, 23, NOW()),
('volunteer.ev1', '$2y$10$abcdefghijklmnopqrstuv', 'Felix Ingram', 'felix.i@phenix.com', '70123463', '2021', 'member', 5, 19, NOW()),
('volunteer.ev2', '$2y$10$abcdefghijklmnopqrstuv', 'Gina Jackson', 'gina.j@phenix.com', '80123464', '2021', 'member', 5, 19, NOW()),
('volunteer.ev3', '$2y$10$abcdefghijklmnopqrstuv', 'Harry King', 'harry.k@phenix.com', '90123465', '2022', 'member', 5, 19, NOW()),
('volunteer.vol1', '$2y$10$abcdefghijklmnopqrstuv', 'Iris Lopez', 'iris.l@phenix.com', '01234568', '2021', 'member', 5, 20, NOW()),
('volunteer.vol2', '$2y$10$abcdefghijklmnopqrstuv', 'Jason Moore', 'jason.m@phenix.com', '11234569', '2021', 'member', 5, 20, NOW()),
('volunteer.vol3', '$2y$10$abcdefghijklmnopqrstuv', 'Kelly Nelson', 'kelly.n@phenix.com', '21234570', '2022', 'member', 5, 20, NOW()),
('social.media1', '$2y$10$abcdefghijklmnopqrstuv', 'Liam Owen', 'liam.o@phenix.com', '31234571', '2021', 'member', 5, 21, NOW()),
('social.media2', '$2y$10$abcdefghijklmnopqrstuv', 'Maya Parker', 'maya.p@phenix.com', '41234572', '2021', 'member', 5, 21, NOW()),
('social.media3', '$2y$10$abcdefghijklmnopqrstuv', 'Nathan Quinn', 'nathan.q@phenix.com', '51234573', '2022', 'member', 5, 21, NOW()),
('fundraiser.fr1', '$2y$10$abcdefghijklmnopqrstuv', 'Olivia Ross', 'olivia.r@phenix.com', '61234574', '2021', 'member', 5, 22, NOW()),
('fundraiser.fr2', '$2y$10$abcdefghijklmnopqrstuv', 'Peter Stone', 'peter.s@phenix.com', '71234575', '2021', 'member', 5, 22, NOW()),
('fundraiser.fr3', '$2y$10$abcdefghijklmnopqrstuv', 'Quinn Taylor', 'quinn.t@phenix.com', '81234576', '2022', 'member', 5, 22, NOW()),
('outreach.out1', '$2y$10$abcdefghijklmnopqrstuv', 'Rachel Upton', 'rachel.u@phenix.com', '91234577', '2021', 'member', 5, 23, NOW()),
('outreach.out2', '$2y$10$abcdefghijklmnopqrstuv', 'Sam Vega', 'sam.v@phenix.com', '02345679', '2021', 'member', 5, 23, NOW()),
('outreach.out3', '$2y$10$abcdefghijklmnopqrstuv', 'Tara Walsh', 'tara.w@phenix.com', '12345680', '2022', 'member', 5, 23, NOW()),
('volunteer.ev4', '$2y$10$abcdefghijklmnopqrstuv', 'Uma Xavier', 'uma.x@phenix.com', '22345681', '2022', 'member', 5, 19, NOW()),
('volunteer.vol4', '$2y$10$abcdefghijklmnopqrstuv', 'Victor Young', 'victor.y@phenix.com', '32345682', '2022', 'member', 5, 20, NOW()),
('social.media4', '$2y$10$abcdefghijklmnopqrstuv', 'Wendy Zhang', 'wendy.z@phenix.com', '42345683', '2022', 'member', 5, 21, NOW()),
('fundraiser.fr4', '$2y$10$abcdefghijklmnopqrstuv', 'Xavier Adams', 'xavier.a@phenix.com', '52345684', '2022', 'member', 5, 22, NOW());

-- Update department heads
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'alex.web') WHERE id = 1;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'maya.mobile') WHERE id = 2;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'james.ai') WHERE id = 3;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'lisa.cyber') WHERE id = 4;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'ryan.devops') WHERE id = 5;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'dr.physics') WHERE id = 6;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'dr.chemistry') WHERE id = 7;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'dr.biology') WHERE id = 8;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'dr.math') WHERE id = 9;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.design') WHERE id = 10;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.photo') WHERE id = 11;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.music') WHERE id = 12;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.writing') WHERE id = 13;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.video') WHERE id = 14;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'coach.football') WHERE id = 15;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'coach.basketball') WHERE id = 16;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'coach.athletics') WHERE id = 17;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'coach.swimming') WHERE id = 18;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.events') WHERE id = 19;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.volunteer') WHERE id = 20;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.social') WHERE id = 21;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.fundraising') WHERE id = 22;
UPDATE departments SET dept_head_id = (SELECT id FROM users WHERE username = 'head.outreach') WHERE id = 23;

-- =====================================================
-- INSERT EVENTS (Past and Upcoming)
-- Note: Using default times since start_time and end_time are required
-- =====================================================

-- CODIN TEAM EVENTS
INSERT INTO events (title, description, date, start_time, end_time, team_id, location, created_at) VALUES
('Hackathon 2024', 'Annual 48-hour coding marathon', '2024-11-15', '09:00:00', '18:00:00', 1, 'Amphi A', '2024-11-01 10:00:00'),
('AI Workshop Series', 'Introduction to Machine Learning and Neural Networks', '2024-12-01', '10:00:00', '16:00:00', 1, 'Lab 201', '2024-11-20 09:00:00'),
('Mobile Dev Conference', 'Latest trends in mobile application development', '2025-01-20', '09:00:00', '17:00:00', 1, 'Conference Hall', NOW()),
('Cybersecurity Summit', 'Network security and ethical hacking workshop', '2025-02-10', '10:00:00', '16:00:00', 1, 'Amphi B', NOW()),
('DevOps Bootcamp', 'CI/CD pipelines and cloud deployment strategies', '2025-03-05', '09:00:00', '18:00:00', 1, 'Lab 305', NOW());

-- PHI TEAM EVENTS
INSERT INTO events (title, description, date, start_time, end_time, team_id, location, created_at) VALUES
('Science Fair 2024', 'Annual student research presentations', '2024-11-20', '08:00:00', '17:00:00', 2, 'Main Hall', '2024-11-05 08:00:00'),
('Physics Symposium', 'Quantum mechanics and particle physics discussions', '2025-01-15', '10:00:00', '16:00:00', 2, 'Lecture Hall 1', NOW()),
('Chemistry Lab Day', 'Hands-on experiments and demonstrations', '2025-02-25', '09:00:00', '15:00:00', 2, 'Chemistry Lab', NOW()),
('Math Competition', 'Inter-university mathematics challenge', '2025-03-18', '09:00:00', '17:00:00', 2, 'Amphi C', NOW());

-- ZENIX TEAM EVENTS
INSERT INTO events (title, description, date, start_time, end_time, team_id, location, created_at) VALUES
('Art Exhibition 2024', 'Student artwork showcase', '2024-11-10', '11:00:00', '19:00:00', 3, 'Gallery Space', '2024-10-25 11:00:00'),
('Music Festival', 'Live performances and music production workshops', '2024-12-05', '14:00:00', '22:00:00', 3, 'Auditorium', '2024-11-22 10:00:00'),
('Digital Design Workshop', 'UI/UX and graphic design masterclass', '2025-01-25', '10:00:00', '17:00:00', 3, 'Design Studio', NOW()),
('Photography Exhibition', 'Student photography showcase', '2025-02-14', '10:00:00', '18:00:00', 3, 'Art Gallery', NOW()),
('Creative Writing Seminar', 'Storytelling and narrative techniques', '2025-03-10', '13:00:00', '17:00:00', 3, 'Library Hall', NOW()),
('Film Screening Event', 'Student short films premiere', '2025-04-05', '18:00:00', '22:00:00', 3, 'Cinema Hall', NOW());

-- QABAS TEAM EVENTS
INSERT INTO events (title, description, date, start_time, end_time, team_id, location, created_at) VALUES
('Football Tournament', 'Inter-team football championship', '2024-11-25', '07:00:00', '18:00:00', 4, 'Sports Field', '2024-11-10 07:00:00'),
('Basketball League', 'Season opening basketball games', '2025-01-30', '08:00:00', '17:00:00', 4, 'Sports Complex', NOW()),
('Athletics Meet', 'Track and field competitions', '2025-03-15', '07:00:00', '16:00:00', 4, 'Stadium', NOW()),
('Swimming Championship', 'University swimming competition', '2025-04-20', '08:00:00', '15:00:00', 4, 'Olympic Pool', NOW());

-- PHENIX TEAM EVENTS
INSERT INTO events (title, description, date, start_time, end_time, team_id, location, created_at) VALUES
('Community Cleanup', 'Environmental awareness and cleanup drive', '2024-11-18', '06:00:00', '12:00:00', 5, 'City Park', '2024-11-05 06:00:00'),
('Charity Fundraiser', 'Fundraising gala for local charities', '2024-12-10', '18:00:00', '23:00:00', 5, 'Grand Hall', '2024-11-28 09:00:00'),
('Volunteer Fair', 'Recruitment and orientation for new volunteers', '2025-01-28', '09:00:00', '16:00:00', 5, 'Student Center', NOW()),
('Social Media Campaign Launch', 'New awareness campaign kickoff', '2025-02-20', '10:00:00', '14:00:00', 5, 'Media Room', NOW()),
('Community Outreach Program', 'Educational workshops for local schools', '2025-03-25', '09:00:00', '17:00:00', 5, 'Various Locations', NOW());

-- =====================================================
-- INSERT TASKS FOR EVENTS
-- =====================================================

-- Tasks for Hackathon 2024 (Event ID: 1)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Setup Development Environment', 'Prepare workstations and install necessary software', 1, 1, 'completed', '2024-11-14 10:00:00'),
('Prepare Mobile Testing Devices', 'Configure Android and iOS devices for testing', 1, 2, 'completed', '2024-11-14 11:00:00'),
('Setup AI/ML Frameworks', 'Install TensorFlow and PyTorch environments', 1, 3, 'completed', '2024-11-14 12:00:00'),
('Network Security Configuration', 'Setup secure network for the event', 1, 4, 'completed', '2024-11-14 09:00:00');

-- Tasks for AI Workshop Series (Event ID: 2)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Prepare Workshop Materials', 'Create slides and code examples', 2, 3, 'completed', '2024-11-28 10:00:00'),
('Setup Lab Computers', 'Install Python and Jupyter notebooks', 2, 1, 'completed', '2024-11-29 09:00:00'),
('Prepare Datasets', 'Download and organize training datasets', 2, 3, 'completed', '2024-11-29 14:00:00');

-- Tasks for Mobile Dev Conference (Event ID: 3)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Book Conference Venue', 'Reserve conference hall and equipment', 3, 2, 'in_progress', NOW()),
('Invite Guest Speakers', 'Contact industry professionals', 3, 2, 'in_progress', NOW()),
('Prepare Demo Applications', 'Build sample mobile apps for demonstration', 3, 2, 'pending', NOW()),
('Setup Registration System', 'Create online registration portal', 3, 1, 'in_progress', NOW());

-- Tasks for Cybersecurity Summit (Event ID: 4)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Prepare Security Lab', 'Setup isolated network for hacking demos', 4, 4, 'pending', NOW()),
('Create Workshop Materials', 'Develop hands-on security exercises', 4, 4, 'pending', NOW()),
('Invite Security Experts', 'Contact cybersecurity professionals', 4, 4, 'in_progress', NOW());

-- Tasks for DevOps Bootcamp (Event ID: 5)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Setup Cloud Accounts', 'Create AWS/Azure accounts for participants', 5, 5, 'pending', NOW()),
('Prepare CI/CD Pipeline Demo', 'Build sample deployment pipeline', 5, 5, 'pending', NOW()),
('Create Docker Containers', 'Prepare containerized applications', 5, 5, 'in_progress', NOW());

-- Tasks for Science Fair 2024 (Event ID: 6)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Setup Exhibition Booths', 'Arrange tables and display boards', 6, 6, 'completed', '2024-11-19 08:00:00'),
('Prepare Lab Demonstrations', 'Setup chemistry experiments', 6, 7, 'completed', '2024-11-19 09:00:00'),
('Organize Judging Panel', 'Coordinate with faculty judges', 6, 8, 'completed', '2024-11-19 10:00:00');

-- Tasks for Physics Symposium (Event ID: 7)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Prepare Presentation Materials', 'Create slides on quantum mechanics', 7, 6, 'in_progress', NOW()),
('Setup Lab Equipment', 'Prepare physics demonstration equipment', 7, 6, 'pending', NOW()),
('Invite Guest Lecturers', 'Contact physics professors', 7, 6, 'in_progress', NOW());

-- Tasks for Chemistry Lab Day (Event ID: 8)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Prepare Chemical Reagents', 'Order and organize lab chemicals', 8, 7, 'pending', NOW()),
('Setup Safety Equipment', 'Check lab coats, goggles, and safety showers', 8, 7, 'in_progress', NOW()),
('Create Experiment Guides', 'Write step-by-step lab procedures', 8, 7, 'pending', NOW());

-- Tasks for Math Competition (Event ID: 9)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Prepare Problem Sets', 'Create challenging math problems', 9, 9, 'in_progress', NOW()),
('Organize Teams', 'Register and group participants', 9, 9, 'pending', NOW()),
('Setup Competition Venue', 'Arrange seating and materials', 9, 9, 'pending', NOW());

-- Tasks for Art Exhibition 2024 (Event ID: 10)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Curate Artwork', 'Select and organize student submissions', 10, 10, 'completed', '2024-11-09 10:00:00'),
('Setup Gallery Space', 'Arrange lighting and display stands', 10, 10, 'completed', '2024-11-09 14:00:00'),
('Create Exhibition Catalog', 'Design and print artwork catalog', 10, 13, 'completed', '2024-11-09 16:00:00');

-- Tasks for Music Festival (Event ID: 11)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Setup Sound System', 'Install speakers and mixing equipment', 11, 12, 'completed', '2024-12-04 08:00:00'),
('Coordinate Performers', 'Schedule band performances', 11, 12, 'completed', '2024-12-04 10:00:00'),
('Record Performances', 'Setup video recording equipment', 11, 14, 'completed', '2024-12-04 12:00:00');

-- Tasks for Digital Design Workshop (Event ID: 12)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Prepare Design Software', 'Install Adobe Creative Suite', 12, 10, 'in_progress', NOW()),
('Create Workshop Materials', 'Develop UI/UX design exercises', 12, 10, 'pending', NOW()),
('Invite Industry Designers', 'Contact professional designers', 12, 10, 'in_progress', NOW());

-- Tasks for Photography Exhibition (Event ID: 13)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Select Photos', 'Curate best student photography', 13, 11, 'pending', NOW()),
('Print and Frame Photos', 'Professional printing and framing', 13, 11, 'pending', NOW()),
('Setup Gallery Lighting', 'Install proper exhibition lighting', 13, 11, 'in_progress', NOW());

-- Tasks for Creative Writing Seminar (Event ID: 14)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Invite Guest Authors', 'Contact published writers', 14, 13, 'in_progress', NOW()),
('Prepare Writing Prompts', 'Create creative writing exercises', 14, 13, 'pending', NOW()),
('Organize Reading Session', 'Setup venue for story sharing', 14, 13, 'pending', NOW());

-- Tasks for Film Screening Event (Event ID: 15)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Finalize Film Selection', 'Review and select student films', 15, 14, 'pending', NOW()),
('Setup Cinema Equipment', 'Test projector and sound system', 15, 14, 'pending', NOW()),
('Create Event Program', 'Design screening schedule', 15, 14, 'in_progress', NOW());

-- Tasks for Football Tournament (Event ID: 16)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Prepare Sports Field', 'Mark field lines and setup goals', 16, 15, 'completed', '2024-11-24 07:00:00'),
('Organize Team Rosters', 'Register teams and players', 16, 15, 'completed', '2024-11-24 08:00:00'),
('Arrange Medical Support', 'Coordinate with medical staff', 16, 15, 'completed', '2024-11-24 09:00:00');

-- Tasks for Basketball League (Event ID: 17)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Setup Basketball Courts', 'Prepare courts and equipment', 17, 16, 'in_progress', NOW()),
('Schedule Games', 'Create league schedule', 17, 16, 'pending', NOW()),
('Recruit Referees', 'Find and train game officials', 17, 16, 'in_progress', NOW());

-- Tasks for Athletics Meet (Event ID: 18)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Prepare Track and Field', 'Setup running tracks and field equipment', 18, 17, 'pending', NOW()),
('Register Athletes', 'Collect participant registrations', 18, 17, 'in_progress', NOW()),
('Organize Timing System', 'Setup electronic timing equipment', 18, 17, 'pending', NOW());

-- Tasks for Swimming Championship (Event ID: 19)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Prepare Pool Facilities', 'Clean and prepare swimming pool', 19, 18, 'pending', NOW()),
('Setup Timing System', 'Install electronic timing pads', 19, 18, 'pending', NOW()),
('Coordinate Lifeguards', 'Schedule lifeguard shifts', 19, 18, 'in_progress', NOW());

-- Tasks for Community Cleanup (Event ID: 20)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Organize Volunteers', 'Recruit and coordinate volunteers', 20, 20, 'completed', '2024-11-17 08:00:00'),
('Prepare Cleanup Supplies', 'Get trash bags and gloves', 20, 19, 'completed', '2024-11-17 09:00:00'),
('Document Event', 'Take photos and videos', 20, 21, 'completed', '2024-11-17 10:00:00');

-- Tasks for Charity Fundraiser (Event ID: 21)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Secure Venue', 'Book grand hall for gala', 21, 19, 'completed', '2024-12-09 08:00:00'),
('Organize Auction Items', 'Collect donated items for auction', 21, 22, 'completed', '2024-12-09 10:00:00'),
('Promote Event', 'Social media and poster campaign', 21, 21, 'completed', '2024-12-09 12:00:00');

-- Tasks for Volunteer Fair (Event ID: 22)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Setup Registration Booths', 'Prepare volunteer sign-up stations', 22, 20, 'in_progress', NOW()),
('Create Promotional Materials', 'Design flyers and banners', 22, 21, 'pending', NOW()),
('Coordinate with Organizations', 'Contact partner NGOs', 22, 23, 'in_progress', NOW());

-- Tasks for Social Media Campaign Launch (Event ID: 23)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Design Campaign Graphics', 'Create social media visuals', 23, 21, 'in_progress', NOW()),
('Write Campaign Copy', 'Develop messaging and captions', 23, 21, 'pending', NOW()),
('Schedule Posts', 'Plan content calendar', 23, 21, 'pending', NOW());

-- Tasks for Community Outreach Program (Event ID: 24)
INSERT INTO tasks (title, description, event_id, department_id, status, created_at) VALUES
('Develop Workshop Content', 'Create educational materials', 24, 23, 'pending', NOW()),
('Contact Local Schools', 'Arrange school visits', 24, 23, 'in_progress', NOW()),
('Recruit Volunteer Teachers', 'Find volunteers to lead workshops', 24, 20, 'in_progress', NOW()),
('Prepare Teaching Materials', 'Print handouts and supplies', 24, 19, 'pending', NOW());

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
SELECT 'Database seeded successfully!' AS Message,
       (SELECT COUNT(*) FROM teams) AS Teams,
       (SELECT COUNT(*) FROM users WHERE role != 'admin') AS Users,
       (SELECT COUNT(*) FROM departments) AS Departments,
       (SELECT COUNT(*) FROM events) AS Events,
       (SELECT COUNT(*) FROM tasks) AS Tasks;
