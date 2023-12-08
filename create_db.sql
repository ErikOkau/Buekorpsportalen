-- Creating tables for Buekorpsportalen database

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member'
);



CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    address TEXT,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE, 
    peleton_id INTEGER,
    FOREIGN KEY(peleton_id) REFERENCES peleton(id)
);



CREATE TABLE IF NOT EXISTS peleton (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    companies_id INTEGER,
    FOREIGN KEY(companies_id) REFERENCES companies(id)
);



CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    logo BLOB,
    address TEXT,
    city TEXT,
    user_id INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
);



CREATE TABLE IF NOT EXISTS parents (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);



CREATE TABLE IF NOT EXISTS member_parent (
    id INTEGER PRIMARY KEY,
    member_id INTEGER NOT NULL,
    parent_id INTEGER NOT NULL,
    FOREIGN KEY(member_id) REFERENCES members(id),
    FOREIGN KEY(parent_id) REFERENCES parents(id)
);

DELETE FROM users WHERE id = 5;