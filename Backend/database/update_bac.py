import re

# Read the seed file
with open(r'c:\xampp\htdocs\PFE\Backend\database\seed_data.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Update QABAS team (Team ID: 4)
qabas_old = r"-- QABAS TEAM \(Team ID: 4\) - 25 users\nINSERT INTO users \(username, password, name, email, role, team_id, department_id, created_at\) VALUES"
qabas_new = "-- QABAS TEAM (Team ID: 4) - 25 users\nINSERT INTO users (username, password, name, email, bac_matricule, bac_year, role, team_id, department_id, created_at) VALUES"
content = re.sub(qabas_old, qabas_new, content)

# Add BAC details to each Qabas user
qabas_users = [
    ("'david.martinez'", "'67890129', '2019',"),
    ("'coach.football'", "'77890130', '2018',"),
    ("'coach.basketball'", "'87890131', '2018',"),
    ("'coach.athletics'", "'97890132', '2019',"),
    ("'coach.swimming'", "'08901234', '2018',"),
    ("'player.fb1'", "'18901235', '2021',"),
    ("'player.fb2'", "'28901236', '2021',"),
    ("'player.fb3'", "'38901237', '2022',"),
    ("'player.fb4'", "'48901238', '2022',"),
    ("'player.fb5'", "'58901239', '2022',"),
    ("'player.bb1'", "'68901240', '2021',"),
    ("'player.bb2'", "'78901241', '2021',"),
    ("'player.bb3'", "'88901242', '2022',"),
    ("'player.bb4'", "'98901243', '2022',"),
    ("'player.bb5'", "'09012345', '2022',"),
    ("'athlete.track1'", "'19012346', '2021',"),
    ("'athlete.track2'", "'29012347', '2021',"),
    ("'athlete.track3'", "'39012348', '2022',"),
    ("'athlete.track4'", "'49012349', '2022',"),
    ("'swimmer.pool1'", "'59012350', '2021',"),
    ("'swimmer.pool2'", "'69012351', '2021',"),
    ("'swimmer.pool3'", "'79012352', '2022',"),
    ("'swimmer.pool4'", "'89012353', '2022',"),
    ("'player.fb6'", "'99012354', '2022',"),
    ("'player.bb6'", "'00123456', '2022',"),
]

for username, bac_data in qabas_users:
    # Find pattern: (username, password, name, email, role,
    pattern = f"\\({username}, '\\$2y\\$10\\$abcdefghijklmnopqrstuv', '[^']+', '[^']+', "
    replacement = lambda m: m.group(0) + bac_data + " "
    content = re.sub(pattern, replacement, content)

# Update PHENIX team (Team ID: 5)
phenix_old = r"-- PHENIX TEAM \(Team ID: 5\) - 25 users\nINSERT INTO users \(username, password, name, email, role, team_id, department_id, created_at\) VALUES"
phenix_new = "-- PHENIX TEAM (Team ID: 5) - 25 users\nINSERT INTO users (username, password, name, email, bac_matricule, bac_year, role, team_id, department_id, created_at) VALUES"
content = re.sub(phenix_old, phenix_new, content)

# Add BAC details to each Phenix user
phenix_users = [
    ("'olivia.brown'", "'10123457', '2019',"),
    ("'head.events'", "'20123458', '2019',"),
    ("'head.volunteer'", "'30123459', '2019',"),
    ("'head.social'", "'40123460', '2020',"),
    ("'head.fundraising'", "'50123461', '2019',"),
    ("'head.outreach'", "'60123462', '2020',"),
    ("'volunteer.ev1'", "'70123463', '2021',"),
    ("'volunteer.ev2'", "'80123464', '2021',"),
    ("'volunteer.ev3'", "'90123465', '2022',"),
    ("'volunteer.vol1'", "'01234568', '2021',"),
    ("'volunteer.vol2'", "'11234569', '2021',"),
    ("'volunteer.vol3'", "'21234570', '2022',"),
    ("'social.media1'", "'31234571', '2021',"),
    ("'social.media2'", "'41234572', '2021',"),
    ("'social.media3'", "'51234573', '2022',"),
    ("'fundraiser.fr1'", "'61234574', '2021',"),
    ("'fundraiser.fr2'", "'71234575', '2021',"),
    ("'fundraiser.fr3'", "'81234576', '2022',"),
    ("'outreach.out1'", "'91234577', '2021',"),
    ("'outreach.out2'", "'02345679', '2021',"),
    ("'outreach.out3'", "'12345680', '2022',"),
    ("'volunteer.ev4'", "'22345681', '2022',"),
    ("'volunteer.vol4'", "'32345682', '2022',"),
    ("'social.media4'", "'42345683', '2022',"),
    ("'fundraiser.fr4'", "'52345684', '2022',"),
]

for username, bac_data in phenix_users:
    pattern = f"\\({username}, '\\$2y\\$10\\$abcdefghijklmnopqrstuv', '[^']+', '[^']+', "
    replacement = lambda m: m.group(0) + bac_data + " "
    content = re.sub(pattern, replacement, content)

# Write the updated content
with open(r'c:\xampp\htdocs\PFE\Backend\database\seed_data.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("BAC details added successfully!")
