-- evolution-go attend deux bases ; l'image postgres n'en crée qu'une seule
-- (POSTGRES_DB). Rejoué uniquement au premier démarrage du volume.
CREATE DATABASE evogo_auth;
CREATE DATABASE evogo_users;
