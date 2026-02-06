-- Mock Data for Student Management System
-- Run this script to populate the database with sample data

-- Insert Admin and Teacher Users
INSERT INTO users (username, email, password_hash, role, created_at) VALUES 
('admin', 'admin@school.com', 'password', 'admin', NOW()),
('teacher1', 'teacher1@school.com', 'password', 'teacher', NOW()),
('teacher2', 'teacher2@school.com', 'password', 'teacher', NOW());

-- Insert Sample Students
INSERT INTO students (full_name, date_of_birth, class, level, year, status, sports_house, cca, cca_optional, quran_teacher, gender, created_at) VALUES 
('Ahmad bin Abdullah', '2010-03-15', '1A', '1', 'Year 1', 'active', 'Red', 'Football', 'Basketball', 'Ustaz Hassan', 'male', NOW()),
('Aisha binti Muhammad', '2010-07-22', '1A', '1', 'Year 1', 'active', 'Blue', 'Netball', 'Music', 'Ustazah Sarah', 'female', NOW()),
('Muhammad bin Ali', '2009-11-08', '1B', '1', 'Year 2', 'active', 'Green', 'Badminton', 'Art', 'Ustaz Hassan', 'male', NOW()),
('Fatimah binti Omar', '2009-05-30', '1B', '1', 'Year 2', 'active', 'Yellow', 'Netball', 'Drama', 'Ustazah Sarah', 'female', NOW()),
('Abdul Rahman bin Sulaiman', '2008-09-12', '1C', '1', 'Year 3', 'active', 'Red', 'Swimming', 'Chess', 'Ustaz Kamal', 'male', NOW()),
('Nurul Huda binti Ismail', '2008-02-28', '1C', '1', 'Year 3', 'active', 'Blue', 'Volleyball', 'Cooking', 'Ustazah Aminah', 'female', NOW()),
('Zainal bin Abidin', '2007-04-18', '10A', '2', 'Year 4', 'active', 'Green', 'Football', 'Photography', 'Ustaz Kamal', 'male', NOW()),
('Siti Khadijah binti Rahman', '2007-12-05', '10A', '2', 'Year 4', 'active', 'Yellow', 'Netball', 'Debate', 'Ustazah Fatimah', 'female', NOW()),
('Ibrahim bin Zakaria', '2006-08-22', '10B', '2', 'Year 5', 'active', 'Red', 'Basketball', 'Robotics', 'Ustaz Hassan', 'male', NOW()),
('Maryam binti Yusuf', '2006-01-14', '10B', '2', 'Year 5', 'active', 'Blue', 'Badminton', 'Music', 'Ustazah Sarah', 'female', NOW()),
('Umar bin Khattab', '2005-06-30', '10C', '2', 'Year 6', 'active', 'Green', 'Swimming', 'Art', 'Ustaz Kamal', 'male', NOW()),
('Khadijah binti Khuwaylid', '2005-10-25', '10C', '2', 'Year 6', 'active', 'Yellow', 'Volleyball', 'Drama', 'Ustazah Aminah', 'female', NOW()),
('Ali bin Abu Talib', '2004-03-08', '11A', '3', 'Year 7', 'active', 'Red', 'Football', 'Chess', 'Ustaz Hassan', 'male', NOW()),
('Aminah binti Wahb', '2004-07-16', '11A', '3', 'Year 7', 'active', 'Blue', 'Netball', 'Cooking', 'Ustazah Fatimah', 'female', NOW()),
('Bilal bin Rabah', '2003-11-29', '11B', '3', 'Year 8', 'active', 'Green', 'Badminton', 'Photography', 'Ustaz Kamal', 'male', NOW()),
('Safiyyah binti Huyayy', '2003-05-11', '11B', '3', 'Year 8', 'active', 'Yellow', 'Basketball', 'Debate', 'Ustazah Sarah', 'female', NOW()),
('Uthman bin Affan', '2002-09-24', '11C', '3', 'Year 9', 'active', 'Red', 'Swimming', 'Music', 'Ustaz Hassan', 'male', NOW()),
('Zainab binti Jahsh', '2002-02-06', '11C', '3', 'Year 9', 'active', 'Blue', 'Volleyball', 'Art', 'Ustazah Aminah', 'female', NOW()),
('Abu Bakr as-Siddiq', '2001-04-19', '11D', '3', 'Year 10', 'active', 'Green', 'Football', 'Robotics', 'Ustaz Kamal', 'male', NOW()),
('Hafsah binti Umar', '2001-12-03', '11D', '3', 'Year 10', 'active', 'Yellow', 'Netball', 'Drama', 'Ustazah Fatimah', 'female', NOW()),
('Talhah bin Ubaydullah', '2000-08-15', '11E', '3', 'Year 11F', 'active', 'Red', 'Basketball', 'Chess', 'Ustaz Hassan', 'male', NOW()),
('Sawdah binti Zamah', '2000-01-27', '11E', '3', 'Year 11F', 'active', 'Blue', 'Badminton', 'Cooking', 'Ustazah Sarah', 'female', NOW()),
('Saad bin Abi Waqqas', '1999-06-10', '11F', '3', 'Year 11J', 'active', 'Green', 'Swimming', 'Photography', 'Ustaz Kamal', 'male', NOW()),
('Umm Salamah binti Abi Umayyah', '1999-10-22', '11F', '3', 'Year 11J', 'active', 'Yellow', 'Volleyball', 'Debate', 'Ustazah Aminah', 'female', NOW());

-- Insert Student Academic Records
INSERT INTO student_terms (student_id, term_number, academic_year, attendance, academic_score, remarks, created_at) VALUES 
-- Ahmad bin Abdullah - Year 1
(1, 1, '2024/2025', 95, 88, 'Excellent performance, very attentive', NOW()),
(1, 2, '2024/2025', 92, 85, 'Good progress in mathematics', NOW()),
(1, 3, '2024/2025', 94, 90, 'Outstanding improvement in reading', NOW()),

-- Aisha binti Muhammad - Year 1
(2, 1, '2024/2025', 98, 92, 'Exceptional student, very polite', NOW()),
(2, 2, '2024/2025', 96, 94, 'Excellent in all subjects', NOW()),
(2, 3, '2024/2025', 97, 93, 'Leadership qualities emerging', NOW()),

-- Muhammad bin Ali - Year 2
(3, 1, '2024/2025', 90, 82, 'Good effort, needs more focus', NOW()),
(3, 2, '2024/2025', 88, 80, 'Improving in science', NOW()),
(3, 3, '2024/2025', 91, 84, 'Better participation in class', NOW()),

-- Fatimah binti Omar - Year 2
(4, 1, '2024/2025', 93, 86, 'Creative and artistic', NOW()),
(4, 2, '2024/2025', 94, 88, 'Excellent in languages', NOW()),
(4, 3, '2024/2025', 95, 89, 'Very helpful to classmates', NOW()),

-- Abdul Rahman bin Sulaiman - Year 3
(5, 1, '2024/2025', 89, 78, 'Needs improvement in mathematics', NOW()),
(5, 2, '2024/2025', 91, 81, 'Better performance this term', NOW()),
(5, 3, '2024/2025', 93, 85, 'Significant improvement noted', NOW()),

-- Zainal bin Abidin - Year 4
(7, 1, '2024/2025', 87, 75, 'Struggling with some concepts', NOW()),
(7, 2, '2024/2025', 89, 78, 'Extra tutoring helping', NOW()),
(7, 3, '2024/2025', 90, 80, 'Steady progress', NOW()),

-- Siti Khadijah binti Rahman - Year 4
(8, 1, '2024/2025', 95, 89, 'Top performer in class', NOW()),
(8, 2, '2024/2025', 96, 91, 'Consistently excellent', NOW()),
(8, 3, '2024/2025', 97, 93, 'Outstanding achievement', NOW()),

-- Ibrahim bin Zakaria - Year 5
(9, 1, '2024/2025', 92, 84, 'Good in practical subjects', NOW()),
(9, 2, '2024/2025', 90, 82, 'Needs more study time', NOW()),
(9, 3, '2024/2025', 93, 86, 'Improved focus', NOW()),

-- Maryam binti Yusuf - Year 5
(10, 1, '2024/2025', 94, 87, 'Very diligent student', NOW()),
(10, 2, '2024/2025', 95, 89, 'Excellent progress', NOW()),
(10, 3, '2024/2025', 96, 90, 'Maintains high standards', NOW()),

-- Umar bin Khattab - Year 6
(11, 1, '2024/2025', 88, 76, 'Needs motivation', NOW()),
(11, 2, '2024/2025', 90, 79, 'Showing improvement', NOW()),
(11, 3, '2024/2025', 91, 81, 'Better attitude towards learning', NOW()),

-- Khadijah binti Khuwaylid - Year 6
(12, 1, '2024/2025', 96, 90, 'Exceptional student', NOW()),
(12, 2, '2024/2025', 97, 92, 'Leadership qualities', NOW()),
(12, 3, '2024/2025', 98, 94, 'Outstanding performance', NOW()),

-- Ali bin Abu Talib - Year 7
(13, 1, '2024/2025', 85, 72, 'Adjusting to higher level', NOW()),
(13, 2, '2024/2025', 87, 75, 'Getting used to new subjects', NOW()),
(13, 3, '2024/2025', 89, 78, 'Good improvement', NOW()),

-- Aminah binti Wahb - Year 7
(14, 1, '2024/2025', 93, 86, 'Very capable student', NOW()),
(14, 2, '2024/2025', 94, 88, 'Consistent performer', NOW()),
(14, 3, '2024/2025', 95, 89, 'Excellent work ethic', NOW()),

-- Bilal bin Rabah - Year 8
(15, 1, '2024/2025', 90, 82, 'Good in sports', NOW()),
(15, 2, '2024/2025', 91, 84, 'Balanced performance', NOW()),
(15, 3, '2024/2025', 92, 85, 'Steady progress', NOW()),

-- Safiyyah binti Huyayy - Year 8
(16, 1, '2024/2025', 94, 88, 'Excellent in arts', NOW()),
(16, 2, '2024/2025', 95, 90, 'Creative thinking', NOW()),
(16, 3, '2024/2025', 96, 91, 'Outstanding projects', NOW()),

-- Uthman bin Affan - Year 9
(17, 1, '2024/2025', 86, 74, 'Needs more practice', NOW()),
(17, 2, '2024/2025', 88, 77, 'Improving steadily', NOW()),
(17, 3, '2024/2025', 90, 80, 'Good effort this term', NOW()),

-- Zainab binti Jahsh - Year 9
(18, 1, '2024/2025', 95, 89, 'Very bright student', NOW()),
(18, 2, '2024/2025', 96, 91, 'Excellent work', NOW()),
(18, 3, '2024/2025', 97, 92, 'Top of the class', NOW()),

-- Abu Bakr as-Siddiq - Year 10
(19, 1, '2024/2025', 92, 84, 'Good leadership skills', NOW()),
(19, 2, '2024/2025', 93, 86, 'Responsible student', NOW()),
(19, 3, '2024/2025', 94, 88, 'Excellent progress', NOW()),

-- Hafsah binti Umar - Year 10
(20, 1, '2024/2025', 96, 90, 'Very diligent', NOW()),
(20, 2, '2024/2025', 97, 92, 'Outstanding achievement', NOW()),
(20, 3, '2024/2025', 98, 94, 'Exceptional performance', NOW()),

-- Talhah bin Ubaydullah - Year 11F
(21, 1, '2024/2025', 89, 81, 'Good effort', NOW()),
(21, 2, '2024/2025', 90, 83, 'Steady improvement', NOW()),
(21, 3, '2024/2025', 91, 85, 'Positive attitude', NOW()),

-- Sawdah binti Zamah - Year 11F
(22, 1, '2024/2025', 94, 88, 'Very capable', NOW()),
(22, 2, '2024/2025', 95, 90, 'Consistent work', NOW()),
(22, 3, '2024/2025', 96, 91, 'Excellent results', NOW()),

-- Saad bin Abi Waqqas - Year 11J
(23, 1, '2024/2025', 87, 79, 'Needs more focus', NOW()),
(23, 2, '2024/2025', 89, 82, 'Better concentration', NOW()),
(23, 3, '2024/2025', 90, 84, 'Good improvement', NOW()),

-- Umm Salamah binti Abi Umayyah - Year 11J
(24, 1, '2024/2025', 95, 89, 'Excellent student', NOW()),
(24, 2, '2024/2025', 96, 91, 'Very hardworking', NOW()),
(24, 3, '2024/2025', 97, 93, 'Outstanding performance', NOW());

-- Insert Sample Announcements
INSERT INTO announcements (title, content, priority, created_by, created_by_name, created_at) VALUES 
('Welcome Back to School', 'We are excited to welcome all students back for the new academic year. Please ensure you have all your books and uniforms ready.', 'normal', 1, 'admin', NOW()),
('Parent-Teacher Meeting', 'Parent-teacher meetings will be held next week. Please check your schedules and make appointments accordingly.', 'high', 1, 'admin', NOW()),
('School Sports Day', 'Annual sports day is coming up on the 15th of next month. Students are encouraged to participate in various events.', 'normal', 1, 'admin', NOW()),
('Exam Schedule Released', 'The final exam schedule has been released. Please check the notice board for your respective class timings.', 'high', 1, 'admin', NOW()),
('Holiday Announcement', 'School will be closed for mid-term break from 20th to 25th of this month. Classes will resume on the 26th.', 'normal', 1, 'admin', NOW());

-- Insert Sample Events
INSERT INTO events (title, description, event_date, location, priority, created_by, created_by_name, created_at) VALUES 
('Science Fair', 'Annual science fair exhibition showcasing student projects', '2024-03-15', 'School Hall', 'high', 1, 'admin', NOW()),
('Cultural Day', 'Celebration of diverse cultures with performances and food', '2024-04-20', 'School Ground', 'normal', 1, 'admin', NOW()),
('Graduation Ceremony', 'Graduation ceremony for final year students', '2024-05-30', 'Main Auditorium', 'high', 1, 'admin', NOW()),
('Open House', 'School open house for prospective parents and students', '2024-06-10', 'School Campus', 'normal', 1, 'admin', NOW()),
('Teacher Training Workshop', 'Professional development workshop for teaching staff', '2024-07-05', 'Conference Room', 'low', 1, 'admin', NOW());

COMMIT;
