CREATE TABLE IF NOT EXISTS people (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('father', 'mother', 'child')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
    id            SERIAL PRIMARY KEY,
    title         TEXT NOT NULL,
    salary_yen    INTEGER NOT NULL CHECK (salary_yen >= 0),
    description   TEXT,
    days_of_week  SMALLINT[] NOT NULL DEFAULT '{}',
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settlements (
    id           SERIAL PRIMARY KEY,
    person_id    INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    total_yen    INTEGER NOT NULL,
    settled_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS completions (
    id                   SERIAL PRIMARY KEY,
    person_id            INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    job_id               INTEGER NOT NULL REFERENCES jobs(id),
    job_title_snapshot   TEXT NOT NULL,
    salary_yen_snapshot  INTEGER NOT NULL,
    completed_on         DATE NOT NULL DEFAULT CURRENT_DATE,
    settlement_id        INTEGER REFERENCES settlements(id),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_completions_person ON completions(person_id);
CREATE INDEX IF NOT EXISTS idx_completions_settlement ON completions(settlement_id);
CREATE INDEX IF NOT EXISTS idx_completions_job ON completions(job_id);
