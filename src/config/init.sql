-- Create database (run separately if needed)
-- CREATE DATABASE vehicle_rental;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(150)        NOT NULL UNIQUE,
  password   VARCHAR(255)        NOT NULL,
  phone      VARCHAR(20)         NOT NULL,
  role       VARCHAR(10)         NOT NULL DEFAULT 'customer'
               CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id                  SERIAL PRIMARY KEY,
  vehicle_name        VARCHAR(100)  NOT NULL,
  type                VARCHAR(10)   NOT NULL
                        CHECK (type IN ('car', 'bike', 'van', 'SUV')),
  registration_number VARCHAR(50)   NOT NULL UNIQUE,
  daily_rent_price    NUMERIC(10,2) NOT NULL CHECK (daily_rent_price > 0),
  availability_status VARCHAR(10)   NOT NULL DEFAULT 'available'
                        CHECK (availability_status IN ('available', 'booked')),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id              SERIAL PRIMARY KEY,
  customer_id     INT           NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
  vehicle_id      INT           NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  rent_start_date DATE          NOT NULL,
  rent_end_date   DATE          NOT NULL,
  total_price     NUMERIC(10,2) NOT NULL CHECK (total_price > 0),
  status          VARCHAR(10)   NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'cancelled', 'returned')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_dates CHECK (rent_end_date > rent_start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle  ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);