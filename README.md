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
- **Database:** [MySQL](https://www.mysql.com/)
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
- npm or yarn
- A running MySQL database
- A TMDb API Key (get one [here](https://www.themoviedb.org/documentation/api))

### 2. Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/YOUR_USERNAME/the-reel-score.git](https://github.com/YOUR_USERNAME/the-reel-score.git)
    cd the-reel-score
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following variables:

    ```env
    # Database
    DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

    # JWT
    JWT_SECRET="your-strong-access-secret"

    # TMDb API
    API_ACCESS_TOKEN="your-tmdb-v4-access-token"
    TMDB_BASE_URL="[https://api.themoviedb.org/3](https://api.themoviedb.org/3)"

    # Bcrypt
    SALT="salt-rounds"
    ```

4.  **Run database migrations:**
    This will sync your Prisma schema with your MySQL database.

    ```bash
    npx prisma migrate dev
    ```

5.  **Start the development server:**
    ```bash
    npm run start:dev
    ```
    The server will be running on `http://localhost:3000`.

## 📈 Future Plans

- [ ] **Testing:** Implement a robust testing strategy with:
  - **Unit Tests (Jest)** for critical business logic (services).
  - **E2E Tests (Jest & Supertest)** for API endpoints.
- [ ] **CI/CD:** Set up a GitHub Actions workflow to run tests and builds automatically.
- [ ] **Frontend Development:** Build the client-side application using **Next.js**, **TypeScript**, and **Tailwind CSS**.
