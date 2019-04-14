--DROP TABLE accounts; -- Uncomment to reset db

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    email VARCHAR(255),
    profile_picture_url VARCHAR(255),
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    created_at DATE,
    user_role VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  author INT REFERENCES users(id),
  title VARCHAR(128),
  content VARCHAR(4000),
  created_at DATE,
  modified_at DATE
);