
CREATE TABLE IF NOT EXISTS t_p47280297_saburi_mall_project_.sellers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p47280297_saburi_mall_project_.products (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES t_p47280297_saburi_mall_project_.sellers(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  old_price NUMERIC(12, 2),
  image_url TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'Разное',
  sub_category VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p47280297_saburi_mall_project_.sessions (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES t_p47280297_saburi_mall_project_.sellers(id),
  token VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
