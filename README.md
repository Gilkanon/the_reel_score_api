# 🍿 The Reel Score

"The Reel Score" is a full-stack web application designed for browsing, rating, and reviewing movies and TV shows. This repository contains the complete **backend** for the application, built with NestJS.

This project is being developed as a comprehensive learning exercise to master full-stack development, focusing on modern technologies, clean architecture, and best practices like the BFF (Backend for Frontend) pattern.

## ✨ Core Features

- **JWT Authentication:** Secure user registration and login using JWT (Access & Refresh tokens) with `passport.js`.
- **Role-Based Access Control:** Differentiates between regular `USER` and `ADMIN` roles, with secure authorization checks at the service layer.
- **BFF (Backend for Frontend) Endpoints:** A set of optimized endpoints designed to match specific UI views, aggregating data from multiple services into a single request.
- **TMDb API Integration:** A dedicated service module to safely interact with The Movie Database (TMDb) API, acting as a secure proxy to protect the API key.
- **Review Management:** Full CRUD functionality for user reviews (`create`, `update`, `delete`).
- **Advanced Authorization:** Update/Delete logic is secured with an efficient check that validates either review ownership or admin privileges.
- **Error Handling:** Implemented a robust, centralized error-handling strategy using global filters and service-level wrappers to handle `HttpException` and `Prisma` errors gracefully.

## 🛠 Tech Stack

- **Framework:** [NestJS](https://nestjs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Authentication:** [Passport.js](http://www.passportjs.org/) (with `passport-jwt`)
- **Validation:** [class-validator](https://github.com/typestack/class-validator) & [class-transformer](https://github.com/typestack/class-transformer)

## 🚀 API Endpoints

This API is built using a hybrid BFF and RESTful approach.

### 🔐 Auth (`/auth`)

| Method | Endpoint    | Description                                      |
| :----- | :---------- | :----------------------------------------------- |
| `POST` | `/register` | Registers a new user.                            |
| `POST` | `/login`    | Logs in a user and returns JWT tokens.           |
| `POST` | `/logout`   | (Implementation TBD) Invalidates refresh token.  |
| `POST` | `/refresh`  | Issues a new access token using a refresh token. |

### 👤 Users (`/users`)

| Method   | Endpoint     | Description                                             |
| :------- | :----------- | :------------------------------------------------------ |
| `GET`    | `/:username` | **(BFF)** Gets a user's profile info and their reviews. |
| `PATCH`  | `/me`        | Updates the authenticated user's own profile.           |
| `DELETE` | `/me`        | Deletes the authenticated user's own profile.           |
| `PATCH`  | `/:username` | Updates the user's profile by administrator.            |
| `DELETE` | `/:username` | Deletes the user's profile by administrator.            |

### ✍️ Reviews (`/reviews`)

| Method   | Endpoint | Description                                       |
| :------- | :------- | :------------------------------------------------ |
| `POST`   | `/`      | Creates a new review for a movie or TV show.      |
| `PATCH`  | `/:id`   | Updates an existing review (owner or admin only). |
| `DELETE` | `/:id`   | Deletes an existing review (owner or admin only). |

### 🎬 Media & View Endpoints

| Method | Endpoint          | Description                                                                    |
| :----- | :---------------- | :----------------------------------------------------------------------------- |
| `GET`  | `/media/trending` | **(BFF)** Gets trending movies and TV shows for the home page.                 |
| `GET`  | `/media/search`   | **(BFF)** Searches for movies and TV shows simultaneously.                     |
| `GET`  | `/movies/:id`     | **(BFF)** Gets full movie details (from TMDb) and its reviews (from our DB).   |
| `GET`  | `/tv/:id`         | **(BFF)** Gets full TV show details (from TMDb) and its reviews (from our DB). |

### ⚙️ Tmdb (`/tmdb`)

| Method | Endpoint             | Description                         |
| :----- | :------------------- | :---------------------------------- |
| `GET`  | `/movie/:id/credits` | Gets movie credits from TMDb api.   |
| `GET`  | `/tv/:id/credits`    | Gets TV show credits from TMDb api. |

## 📦 Getting Started

### 1. Prerequisites

- Node.js (v18 or higher recommended)
- Yarn
- A running docker on your PC
- A TMDb API Key (get one [here](https://www.themoviedb.org/documentation/api))

### 2. Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Gilkanon/the_reel_score_api.git
    cd the-reel-score
    ```

2.  **Install dependencies:**

    ```bash
    yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables:

    ```env
    # Environment
    NODE_ENV=development or production
    
    # Database
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
    POSGRES_USER="your username to log in postgres"
    POSTGRES_DB="db name"
    POSTGRES_PASSWORD="your password to log in postgres"

    # JWT
    JWT_SECRET="your-strong-access-secret"

    # TMDb API
    API_ACCESS_TOKEN="your-tmdb-v4-access-token"
    TMDB_BASE_URL="[https://api.themoviedb.org/3](https://api.themoviedb.org/3)"

    # Bcrypt
    SALT="salt-rounds"

    # Caching
    REDIS_HOST="your redis container name"
    REDIS_PORT="your redis port as default 6379"

    # pgAdmin
    PGADMIN_EMAIL="your email to log in pgAdmin"
    PGADMIN_PASSWORD="your password to log in pgAdmin"
    ```

4.  **Run docker-compose**
    This will create a network and containers for your project via docker

    ```bash
    docker-compose up --build
    ```

    After building and starting all images, the Prisma schema migration to the PostgreSQL database will be automatically executed. Subsequently, the application will launch     in development mode, and end-to-end (e2e) tests will run; upon completion, the test results report will open automatically.

    The server will be running on `http://localhost:3000`.

## 🧪 Testing

This project follows a rigorous testing strategy to ensure reliability and correctness. We use **Jest** for unit testing and **Playwright** for End-to-End (E2E) integration testing.
P.S. Mostly e2e tests were done with AI (cursor)

### Tools

- **Jest**: Used for unit tests to verify individual services and business logic in isolation.
- **Playwright**: Used for E2E tests to verify full API workflows, database interactions, and HTTP responses.

### Running Unit Tests

To execute the unit tests suite:

```bash
yarn test
```

### Running E2E Tests

End-to-End tests interact with the actual database. To ensure a clean and consistent testing environment, we have created a unified command that handles the database lifecycle automatically.

To run E2E tests:

```bash
yarn test:e2e
```

### How it works

The `test:e2e` command performs the following steps strictly in order:

1. Seed (`prisma db seed`): Populates the database with necessary initial data required for the tests to pass.

2. Test (`playwright test`): Executes the Playwright test scenarios against the running application.

3. Cleanup (`prisma migrate reset`): Forcefully resets the database schema and wipes all data. This ensures that the database is left clean and no test artifacts remain after execution.

4. Report (playwright show-report): Automatically launches the interactive HTML report in your browser to inspect detailed test results, logs, and traces.

Note: Please ensure your database container or service is running before executing the tests.

## 📈 Future Plans

- [x] **Testing:** Implement a robust testing strategy with:
  - **Unit Tests (Jest)** for critical business logic (services).
  - **E2E Tests (Playwright)** for API endpoints.
- [ ] **CI/CD:** Set up a GitHub Actions workflow to run tests and builds automatically.
- [ ] **Frontend Development:** Build the client-side application using **Next.js**, **TypeScript**, and **Tailwind CSS**.
