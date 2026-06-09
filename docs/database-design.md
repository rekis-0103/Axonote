# Database Design

MySQL 8.x. All tables InnoDB, `utf8mb4`. Timestamps in UTC.

## ERD

```
users ──1:N── materials ──1:1── summaries
                  │
                  ├──1:N── jobs
                  │
                  └──1:1── question_sets ──1:N── questions
                                  │
                                  └──1:N── quiz_attempts ──1:N── attempt_answers
                                                (per user)
```

## Tables

### users
| column         | type             | notes                          |
| -------------- | ---------------- | ------------------------------ |
| id             | BIGINT PK AI     |                                |
| email          | VARCHAR(255)     | UNIQUE, not null               |
| password_hash  | VARCHAR(255)     | Argon2/bcrypt                  |
| display_name   | VARCHAR(120)     |                                |
| role           | ENUM('user','admin') | default 'user'             |
| created_at     | DATETIME         |                                |
| updated_at     | DATETIME         |                                |

### refresh_tokens
| column      | type         | notes                                |
| ----------- | ------------ | ------------------------------------ |
| id          | BIGINT PK AI |                                      |
| user_id     | BIGINT FK    | → users.id                           |
| token_hash  | VARCHAR(255) | hashed; never store raw token        |
| expires_at  | DATETIME     |                                      |
| revoked_at  | DATETIME     | nullable; set on logout/rotation     |
| created_at  | DATETIME     |                                      |

### materials
| column         | type             | notes                                           |
| -------------- | ---------------- | ----------------------------------------------- |
| id             | BIGINT PK AI     |                                                 |
| user_id        | BIGINT FK        | → users.id                                      |
| title          | VARCHAR(255)     | user-provided or derived from filename          |
| original_name  | VARCHAR(255)     | sanitized, display only                         |
| stored_name    | VARCHAR(255)     | random UUID filename on disk                    |
| mime_type      | VARCHAR(127)     | validated                                       |
| size_bytes     | BIGINT           |                                                 |
| status         | ENUM             | pending, processing, ready, failed              |
| error_message  | TEXT             | nullable                                        |
| created_at     | DATETIME         |                                                 |
| updated_at     | DATETIME         |                                                 |

### jobs
| column        | type         | notes                                  |
| ------------- | ------------ | -------------------------------------- |
| id            | BIGINT PK AI |                                        |
| material_id   | BIGINT FK    | → materials.id                         |
| type          | VARCHAR(40)  | 'analyze'                              |
| status        | ENUM         | queued, running, done, failed          |
| attempts      | INT          | retry counter, default 0               |
| error_message | TEXT         | nullable                               |
| started_at    | DATETIME     | nullable                               |
| finished_at   | DATETIME     | nullable                               |
| created_at    | DATETIME     |                                        |
| updated_at    | DATETIME     |                                        |

### summaries
| column      | type         | notes                            |
| ----------- | ------------ | -------------------------------- |
| id          | BIGINT PK AI |                                  |
| material_id | BIGINT FK    | → materials.id (UNIQUE, 1:1)     |
| content     | MEDIUMTEXT   | extractive summary text          |
| keywords    | JSON         | array of keyword strings         |
| meta        | JSON         | sentence count, ratios, timings  |
| created_at  | DATETIME     |                                  |

### question_sets
| column      | type         | notes                        |
| ----------- | ------------ | ---------------------------- |
| id          | BIGINT PK AI |                              |
| material_id | BIGINT FK    | → materials.id (UNIQUE, 1:1) |
| created_at  | DATETIME     |                              |

### questions
| column         | type         | notes                                       |
| -------------- | ------------ | ------------------------------------------- |
| id             | BIGINT PK AI |                                             |
| question_set_id| BIGINT FK    | → question_sets.id                          |
| type           | VARCHAR(20)  | 'mcq' (extensible)                          |
| stem           | TEXT         | question text (cloze sentence)              |
| options        | JSON         | array of option strings                     |
| correct_index  | INT          | index into options                          |
| explanation    | TEXT         | nullable, basic rationale                   |
| source_ref     | JSON         | nullable, e.g. source sentence index        |

> `correct_index` is never sent to the client before submission (see API contract).

### quiz_attempts
| column          | type         | notes                              |
| --------------- | ------------ | ---------------------------------- |
| id              | BIGINT PK AI |                                    |
| question_set_id | BIGINT FK    | → question_sets.id                 |
| user_id         | BIGINT FK    | → users.id                         |
| score           | INT          | number correct                     |
| total           | INT          | number of questions                |
| started_at      | DATETIME     |                                    |
| finished_at     | DATETIME     | nullable                           |

### attempt_answers
| column         | type         | notes                          |
| -------------- | ------------ | ------------------------------ |
| id             | BIGINT PK AI |                                |
| attempt_id     | BIGINT FK    | → quiz_attempts.id             |
| question_id    | BIGINT FK    | → questions.id                 |
| chosen_index   | INT          |                                |
| is_correct     | BOOLEAN      |                                |

## Indexes

- `users.email` UNIQUE
- `materials(user_id, status)` — dashboard listing
- `jobs(status, created_at)` — worker claim query
- `summaries.material_id` UNIQUE, `question_sets.material_id` UNIQUE
- `quiz_attempts(user_id, started_at)` — history

## Ownership

Every read/write of materials, summaries, question_sets, quiz_attempts is scoped by `user_id` and enforced in the API layer (admins excepted for monitoring).
