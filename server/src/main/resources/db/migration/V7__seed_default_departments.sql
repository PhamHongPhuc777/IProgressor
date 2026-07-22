-- Default department set for a fresh enterprise instance (see Markdown discussion on
-- ENDPOINT.md / access-request UX). Idempotent -- V3's admin-bootstrap department is inserted
-- the same way and won't collide since names differ.

INSERT INTO department (name)
VALUES ('IT'), ('Marketing'), ('HR'), ('Accounting')
ON CONFLICT (name) DO NOTHING;
