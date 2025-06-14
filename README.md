# ReckoningAPI

A Node.js RESTful API for personal finance management, built with Express, Sequelize, PostgreSQL, Redis, and more.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Node.js & npm](#2-install-nodejs--npm)
  - [3. Install PostgreSQL](#3-install-postgresql)
  - [4. Install Redis](#4-install-redis)
  - [5. Configure Environment Variables](#5-configure-environment-variables)
  - [6. Install Dependencies](#6-install-dependencies)
  - [7. Run Database Migrations & Seeders](#7-run-database-migrations--seeders)
  - [8. Start the Server](#8-start-the-server)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Linting & Pre-commit](#linting--pre-commit)
- [Troubleshooting](#troubleshooting)

---

## Features

- User registration, login, and profile
- Pocket (financial goal) management
- JWT authentication
- Redis integration
- Swagger API docs
- TBD (To Be Developed)

---

## Requirements

- Node.js (v18+ recommended)
- npm (v8+ recommended)
- PostgreSQL (v13+ recommended)
- Redis (v6+ recommended)
- Git

---

## Installation

### 1. Clone the Repository

```sh
git clone https://github.com/ProjectReckoning/ReckoningAPI.git
cd ReckoningAPI
```

---

### 2. Install Node.js & npm

#### **Ubuntu/Linux**

```sh
sudo apt update
sudo apt install -y nodejs npm
# Or use nvm for latest Node.js:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
```

#### **macOS (Intel & Apple Silicon)**

- **Recommended:** Use [Homebrew](https://brew.sh/):

```sh
brew install node
```

- Or use nvm:

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
nvm install --lts
```

---

### 3. Install PostgreSQL

#### **Ubuntu/Linux**

```sh
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo service postgresql start
```

#### **macOS (Intel & Apple Silicon)**

```sh
brew install postgresql
brew services start postgresql
```

**Create a database and user:**

```sh
# Switch to the postgres user (Linux)
sudo -u postgres psql

# Or just use psql if on macOS with Homebrew
psql postgres

# In the psql shell:
CREATE DATABASE reckoningdb;
CREATE USER reckoninguser WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE reckoningdb TO reckoninguser;
\q
```

---

### 4. Install Redis

#### **Ubuntu/Linux**

```sh
sudo apt update
sudo apt install -y redis-server
sudo service redis-server start
```

#### **macOS (Intel & Apple Silicon)**

```sh
brew install redis
brew services start redis
```

---

### 5. Configure Environment Variables

Copy the example file and fill in your values:

```sh
cp .env.example .env
```

Edit `.env` and set:

```env
PORT=8080
TOKEN_SECRET=your_jwt_secret
DB_USER=reckoninguser
DB_PASSWORD=yourpassword
DB_NAME=reckoningdb
DB_HOST=localhost
SALT_ROUNDS=10
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
REDIS_DB=0
```

---

### 6. Install Dependencies

```sh
npm install
```

---

### 7. Run Database Migrations & Seeders

```sh
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

---

### 8. Start the Server

```sh
npm run dev
# or
npm start
```

The API will be available at [http://localhost:8080/api/v1](http://localhost:8080/api/v1)

---

## API Documentation

Swagger docs are available at:  
[http://localhost:8080/docs](http://localhost:8080/docs)

---

## Development

- **Nodemon** is used for auto-reloading in development:  
  ```sh
  npm run dev
  ```
- **Linting** is enforced with ESLint and runs automatically on commit via Husky and lint-staged.

---

## Linting & Pre-commit

- ESLint runs on staged files before every commit.
- To manually lint all files:
  ```sh
  npx eslint .
  ```

---

## Troubleshooting

- **Port already in use:**  
  Change the `PORT` in your `.env` file.

- **Database connection errors:**  
  Ensure PostgreSQL is running and credentials in `.env` are correct.

- **Redis connection errors:**  
  Ensure Redis is running and credentials in `.env` are correct.

- **Sequelize CLI not found:**  
  Install globally with `npm install -g sequelize-cli` or use `npx sequelize-cli`.

---

## License

MIT

---

## Contributors

- [#SahabatDalamTakua - Project Reckoning](https://github.com/ProjectReckoning)
