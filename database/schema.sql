CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  role VARCHAR(50) NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  refresh_token_hash VARCHAR(255),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email)
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100),
  street TEXT NOT NULL,
  district VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL DEFAULT 'Peru',
  zip_code VARCHAR(20),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dni VARCHAR(20),
  city VARCHAR(100),
  bio TEXT,
  coverage_areas TEXT[] DEFAULT '{}',
  specialization_categories TEXT[] DEFAULT '{}',
  referral_code VARCHAR(50) UNIQUE,
  referred_by UUID REFERENCES agents(id),
  commission_rate DECIMAL(5,2) NOT NULL DEFAULT 12.00,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_date TIMESTAMPTZ,
  total_sales INT NOT NULL DEFAULT 0,
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  dni VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  motivation TEXT,
  categories TEXT[] DEFAULT '{}',
  coverage_areas TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categories_tenant_slug_unique UNIQUE (tenant_id, slug)
);

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  price_usd DECIMAL(10,2) NOT NULL,
  price_ref_local DECIMAL(10,2),
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  demand_level VARCHAR(50) DEFAULT 'medium',
  margin_pct DECIMAL(5,2),
  stock_status VARCHAR(50) NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_tenant_slug_unique UNIQUE (tenant_id, slug)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES users(id),
  agent_id UUID REFERENCES agents(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  tevra_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  agent_commission DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  shipping_address JSONB,
  notes TEXT,
  product_link TEXT,
  estimated_delivery_date DATE,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  variant_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  transaction_id VARCHAR(255),
  receipt_url TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) UNIQUE,
  tracking_number VARCHAR(100) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  current_location VARCHAR(255),
  origin_hub VARCHAR(100) DEFAULT 'Miami, FL USA',
  destination VARCHAR(255),
  estimated_arrival DATE,
  actual_arrival TIMESTAMPTZ,
  carrier VARCHAR(100),
  weight_kg DECIMAL(6,2),
  is_insured BOOLEAN NOT NULL DEFAULT true,
  insurance_value DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  description TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  agent_id UUID REFERENCES agents(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  body TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  helpful_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audience_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  member_count INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  template_id UUID REFERENCES campaign_templates(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  message TEXT NOT NULL,
  subject VARCHAR(255),
  audience_type VARCHAR(50) NOT NULL DEFAULT 'all_customers',
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  open_count INT NOT NULL DEFAULT 0,
  click_count INT NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_segments (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES audience_segments(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, segment_id)
);

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  amount DECIMAL(10,2) NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  url TEXT NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wishlist_user_product_unique UNIQUE (user_id, product_id)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_agents_tenant_id ON agents(tenant_id);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_referral_code ON agents(referral_code);
CREATE INDEX idx_agent_applications_tenant_id ON agent_applications(tenant_id);
CREATE INDEX idx_agent_applications_status ON agent_applications(status);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_agent_id ON orders(agent_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipment_events_shipment_id ON shipment_events(shipment_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_agent_id ON reviews(agent_id);
CREATE INDEX idx_campaigns_tenant_id ON campaigns(tenant_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_commissions_agent_id ON commissions(agent_id);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_media_entity ON media(entity_type, entity_id);

-- ==========================================
-- SEED DATA
-- ==========================================

INSERT INTO tenants (id, name, slug, plan, settings) VALUES
  ('2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'TeVra LLC', 'tevra', 'enterprise', '{"currency":"USD","country":"PE","default_commission_rate":12,"shipping_origin":"Miami, FL USA"}')
ON CONFLICT (slug) DO NOTHING;

-- Password: Admin123! (bcrypt hash)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, whatsapp, role, is_active, is_verified) VALUES
  ('c049571a-f16b-43e5-ab38-f13a585623ac', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'admin@tevra.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Carlos', 'Rodriguez', '+1 305 555 0001', '+1 305 555 0001', 'super_admin', true, true),
  ('7e48a53b-82cb-4273-b452-4bb96b8f02a5', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'maria@tevra.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Maria', 'Garcia', '+51 999 111 001', '+51 999 111 001', 'agent', true, true),
  ('43f2bbd1-c0f2-45c3-b5b7-a08b405bc0ff', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'roberto@tevra.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Roberto', 'Ruiz', '+51 999 222 002', '+51 999 222 002', 'agent', true, true),
  ('a5c38e64-de59-426d-85a5-643f39f043e6', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'andrea@tevra.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Andrea', 'Luna', '+51 999 333 003', '+51 999 333 003', 'agent', true, true),
  ('58232eb6-7535-4146-984e-9df23d4f59b5', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'pedro@tevra.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Pedro', 'Lopez', '+51 999 444 004', '+51 999 444 004', 'agent', true, true),
  ('6589f27c-fcfb-4021-890f-cd3c1926db9c', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'carlos.m@example.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Carlos', 'Mendez', '+51 999 555 005', '+51 999 555 005', 'customer', true, true),
  ('42ece050-1507-46cd-b95b-028b5fad65f6', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'andrea.v@example.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Andrea', 'Valdivia', '+51 999 666 006', '+51 999 666 006', 'customer', true, true),
  ('20042656-8e75-442b-bda2-02441f929f5c', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'ricardo.p@example.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Ricardo', 'Perez', '+51 999 777 007', '+51 999 777 007', 'customer', true, true),
  ('4b17bd13-1a01-45a5-a9f2-8ccae1cccb65', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'luciana.v@example.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Luciana', 'Vargas', '+51 999 888 008', '+51 999 888 008', 'customer', true, true),
  ('3ff1d7de-261d-4e89-a69d-3432b89d5701', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'andres.m@example.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Andres', 'Morales', '+51 999 999 009', '+51 999 999 009', 'customer', true, true),
  ('709aa9c1-3948-4602-891e-0ecf34f82523', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'isabela.s@example.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Isabela', 'Suarez', '+34 666 111 001', '+34 666 111 001', 'agent', true, false),
  ('e9b24895-8a16-4cfa-b729-7024cc68b01a', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'marco.r@example.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Marco', 'Rossi', '+51 999 012 012', '+51 999 012 012', 'agent', true, true),
  ('ac784e01-92a8-4fe4-9d6b-03d6f9b42b4a', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'adrian@tevra.com', '$2a$10$XQxBGa1NPY1KQv1Eh8kRIuD0I0x8LzOpREjN1VMjqGHQ4OlPXKxKq', 'Adrian', 'TeVra', '+1 305 555 0013', '+1 305 555 0013', 'admin', true, true)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Addresses
INSERT INTO addresses (id, user_id, label, street, district, city, country, is_default) VALUES
  ('c3c6edea-8773-450e-bc6c-b9ecd89944ac', '6589f27c-fcfb-4021-890f-cd3c1926db9c', 'Casa', 'Av. Arequipa 1234', 'Miraflores', 'Lima', 'Peru', true),
  ('03824057-2918-4afe-84c3-6e7ce56ea7b5', '6589f27c-fcfb-4021-890f-cd3c1926db9c', 'Oficina', 'Jr. de la Union 456', 'Centro', 'Lima', 'Peru', false)
ON CONFLICT DO NOTHING;

-- Agents
INSERT INTO agents (id, tenant_id, user_id, dni, city, bio, coverage_areas, specialization_categories, referral_code, commission_rate, is_verified, total_sales, total_revenue, rating, rating_count, status) VALUES
  ('a6876626-88ca-4c2e-8a4a-77f51e2888ac', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '7e48a53b-82cb-4273-b452-4bb96b8f02a5', '71234567', 'Lima', 'Especialista en tecnología Apple y moda. Te ayudo a conseguir lo mejor de USA con confianza. Llevo más de 2 años conectando compradores peruanos con las mejores ofertas en Miami.', '{Lima,Miraflores,"San Miguel","San Isidro"}', '{Apple,Ropa,Gaming}', 'maria-garcia', 12.00, true, 23, 4500.00, 4.9, 124, 'active'),
  ('748ddc3c-39ba-4a03-bec4-b9d44014f36a', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '43f2bbd1-c0f2-45c3-b5b7-a08b405bc0ff', '72345678', 'Trujillo', 'Tu conexión directa con productos exclusivos de cuero y relojería internacional. Seguridad y confianza en cada envío.', '{Trujillo,Centro}', '{Calzado,Relojes}', 'roberto-ruiz', 12.00, true, 15, 2100.00, 4.8, 89, 'active'),
  ('2e9e63f8-4349-43a5-ad37-482b6e4f9e75', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'a5c38e64-de59-426d-85a5-643f39f043e6', '73456789', 'Lima', 'Apasionada por el diseño y el estilo. Importo las últimas tendencias de Sephora y Nordstrom a tu puerta.', '{Lima,Miraflores}', '{Belleza,Hogar,Moda}', 'andrea-luna', 12.00, true, 31, 3200.00, 5.0, 215, 'active'),
  ('98af4732-3750-45bb-ba93-54dbeb00244d', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '58232eb6-7535-4146-984e-9df23d4f59b5', '74567890', 'Trujillo', 'Agente activo con enfoque en tecnología y accesorios deportivos.', '{Trujillo,Centro}', '{Electronics,Fashion}', 'pedro-lopez', 12.00, true, 18, 2100.00, 4.7, 45, 'active'),
  ('5cf5dbd4-a373-4f03-bee2-79a2783b0369', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '709aa9c1-3948-4602-891e-0ecf34f82523', '90123456', 'Bogota', 'Nueva aplicante desde Colombia.', '{Bogota,COL}', '{Fashion}', 'isabela-suarez', 10.00, false, 0, 0.00, 0, 0, 'pending'),
  ('5747877f-88ce-4661-9db2-57b9cfcfc4d2', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'e9b24895-8a16-4cfa-b729-7024cc68b01a', '80123456', 'Lima', 'Agente estacional con experiencia en temporadas altas.', '{Lima,Surco}', '{Apple,Electronics}', 'marco-rossi', 12.00, true, 12, 1800.00, 4.2, 30, 'inactive')
ON CONFLICT DO NOTHING;

-- Agent Applications
INSERT INTO agent_applications (id, tenant_id, full_name, dni, email, whatsapp, city, motivation, categories, coverage_areas, status) VALUES
  ('3b3e855d-942e-41f6-93f2-c9680257abb6', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Isabela Suarez', '90123456', 'isabela.s@example.com', '+34 666 111 001', 'Bogota', 'Quiero expandir mi red de contactos y generar ingresos importando products de USA.', '{Fashion}', '{Bogota}', 'pending'),
  ('8137852e-568a-415f-a4bf-7e182013e026', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Roberto Cano', '91234567', 'roberto.cano@example.com', '+51 999 345 345', 'Lima', 'Tengo experiencia en e-commerce y quiero ser agente TeVra.', '{Electronics}', '{Lima}', 'pending'),
  ('dd1ae32b-6517-4eed-9b5b-4119e911b638', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Lucia Mendez', '92345678', 'lucia.m@example.com', '+51 999 456 456', 'Trujillo', 'Me apasiona la moda y belleza, quiero traer productos premium a mis clientas.', '{Beauty,Fashion}', '{Trujillo}', 'pending')
ON CONFLICT DO NOTHING;

-- Categories
INSERT INTO categories (id, tenant_id, name, slug, description, image_url, is_active, sort_order) VALUES
  ('942b1011-602e-4c93-84e5-a22d9bde1924', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Tecnología Apple', 'tecnologia-apple', 'iPhone, iPad, MacBook, AirPods y más productos Apple originales', '/images/categories/apple-ecosystem.jpg', true, 1),
  ('54c2f01f-cf4c-4726-8309-1875a072419f', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Celulares', 'celulares', 'Smartphones de todas las marcas', '/images/categories/smartphones.jpg', true, 2),
  ('8d7d8a16-41a3-40c9-ac72-eec8a8ab4a7f', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Zapatillas', 'zapatillas', 'Nike, Adidas, New Balance y más calzado deportivo', '/images/categories/sneakers.jpg', true, 3),
  ('5089c733-0e4f-4132-a1a1-61632ae7594f', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Relojes', 'relojes', 'Relojes de marca originales', '/images/categories/watches.jpg', true, 4),
  ('a93d8f84-ebbb-4d48-9f53-672a04efe9db', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Audio', 'audio', 'Audífonos, parlantes y sistemas de sonido', '/images/categories/audio.jpg', true, 5),
  ('367e9c7a-86cb-4000-98e9-157412ad9ec5', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Moda y Accesorios', 'moda-accesorios', 'Bolsos, carteras, ropa de marca y accesorios', '/images/categories/fashion.jpg', true, 6),
  ('0845b836-0789-4c1e-8dde-d23cf4b32df1', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Laptops', 'laptops', 'MacBook, Dell, HP y más laptops', '/images/categories/laptops.jpg', true, 7),
  ('8b614973-9a7b-481a-b15a-21d2b9285c97', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Hogar', 'hogar', 'Stanley, termos, accesorios para el hogar', '/images/categories/home.jpg', true, 8),
  ('611a6d43-1ca0-4b0b-b326-0ff627ea3ac3', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Lectores', 'lectores', 'Kindle y lectores electrónicos', '/images/categories/readers.jpg', true, 9),
  ('1fa6db30-779b-4837-b1b6-ef9cbba5dbfb', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Wearables', 'wearables', 'Smartwatches y dispositivos wearable', '/images/categories/wearables.jpg', true, 10)
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Brands
INSERT INTO brands (id, tenant_id, name, logo_url, is_active) VALUES
  ('59ee0d07-8f8e-4341-ab2e-ceead845c4cf', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Apple', '/images/brands/apple.png', true),
  ('e40ae375-52bb-49e3-b608-125e74151d88', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Nike', '/images/brands/nike.png', true),
  ('4a3ab41e-acd2-416a-87b7-d947330926b7', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Amazon', '/images/brands/amazon.png', true),
  ('ab39660e-3271-48bb-a1e2-59e28e202d05', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Coach', '/images/brands/coach.png', true),
  ('e76e4cdc-4c2e-4c68-ae85-21b3486199ca', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Stanley', '/images/brands/stanley.png', true),
  ('cd1af1b4-5185-449a-bf9f-1503ed5acd3d', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Dell', '/images/brands/dell.png', true),
  ('83ef2ef3-1d2a-4c22-b349-cfe15c6335b1', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Beats', '/images/brands/beats.png', true),
  ('e44525ce-8ad4-4d0c-99f7-4215f480f800', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Fossil', '/images/brands/fossil.png', true),
  ('f1632336-de75-477a-941f-5b2d4674b3db', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Adidas', '/images/brands/adidas.png', true),
  ('2990bdb2-ea1f-44a8-89f7-46268c88cd1a', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Sony', '/images/brands/sony.png', true)
ON CONFLICT DO NOTHING;

-- Products (matching designs)
INSERT INTO products (id, tenant_id, category_id, brand_id, name, slug, description, price_usd, price_ref_local, images, tags, is_active, is_featured, demand_level, margin_pct, stock_status) VALUES
  ('039912e2-0b55-4456-8917-1fc4d44c5497', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '942b1011-602e-4c93-84e5-a22d9bde1924', '59ee0d07-8f8e-4341-ab2e-ceead845c4cf', 'Apple iPad Air M4 128GB — Starlight', 'ipad-air-m4-128gb-starlight', 'El nuevo iPad Air con chip M4 ofrece un rendimiento excepcional en un diseño increíblemente fino. Disfruta de una pantalla Liquid Retina asombrosa y la versatilidad de Apple Pencil Pro.', 599.00, 3200.00, '{"/images/products/ipad-air-m4-front.jpg","/images/products/ipad-air-m4-back.jpg","/images/products/ipad-air-m4-side.jpg","/images/products/ipad-air-m4-pencil.jpg"}', '{Apple,iPad,M4,Tablet}', true, true, 'very_high', 40.00, 'available'),
  ('65f479b9-1042-4edc-9d97-1b4a591baa93', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '8d7d8a16-41a3-40c9-ac72-eec8a8ab4a7f', 'e40ae375-52bb-49e3-b608-125e74151d88', 'Nike Air Force 1 ''07', 'nike-air-force-1-07', 'Las icónicas Nike Air Force 1 con amortiguación Air visible. Diseño clásico en cuero premium.', 115.00, 350.00, '{"/images/products/nike-af1-white.jpg","/images/products/nike-af1-side.jpg"}', '{Nike,Zapatillas,Clásico}', true, true, 'high', 35.00, 'available'),
  ('284f3dea-7899-490c-bbc0-edcbb1641f8a', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'a93d8f84-ebbb-4d48-9f53-672a04efe9db', '59ee0d07-8f8e-4341-ab2e-ceead845c4cf', 'AirPods Pro 3rd Gen', 'airpods-pro-3rd-gen', 'AirPods Pro con cancelación activa de ruido, audio espacial personalizado y resistencia al agua.', 249.00, 750.00, '{"/images/products/airpods-pro-3.jpg","/images/products/airpods-pro-3-case.jpg"}', '{Apple,AirPods,Audio}', true, true, 'very_high', 38.00, 'available'),
  ('5cb5c277-d40c-4863-98cc-92ae251f6d05', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '54c2f01f-cf4c-4726-8309-1875a072419f', '59ee0d07-8f8e-4341-ab2e-ceead845c4cf', 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 'El iPhone más potente con chip A17 Pro, cámara de 48MP, titanio y USB-C.', 999.00, 4200.00, '{"/images/products/iphone-15-pro-max.jpg","/images/products/iphone-15-pro-max-back.jpg"}', '{Apple,iPhone,Smartphone}', true, true, 'very_high', 40.00, 'available'),
  ('15947154-0fdf-44c8-9970-558c71b7652c', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '611a6d43-1ca0-4b0b-b326-0ff627ea3ac3', '4a3ab41e-acd2-416a-87b7-d947330926b7', 'Kindle Paperwhite', 'kindle-paperwhite', 'Kindle Paperwhite con pantalla de 6.8", resistente al agua y 8 semanas de batería.', 139.00, 580.00, '{"/images/products/kindle-paperwhite.jpg"}', '{Amazon,Kindle,Lectura}', true, false, 'medium', 30.00, 'available'),
  ('e41d2460-a7d1-413d-b949-fd696b798005', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '367e9c7a-86cb-4000-98e9-157412ad9ec5', 'ab39660e-3271-48bb-a1e2-59e28e202d05', 'Coach Tabby Shoulder Bag', 'coach-tabby-shoulder-bag', 'Bolso Coach Tabby en cuero premium con cierre signature. Elegancia atemporal.', 450.00, 1890.00, '{"/images/products/coach-tabby.jpg","/images/products/coach-tabby-detail.jpg"}', '{Coach,Bolso,Lujo}', true, false, 'high', 35.00, 'available'),
  ('b39c98d1-d742-46e7-bd83-4f40c33645fc', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '8b614973-9a7b-481a-b15a-21d2b9285c97', 'e76e4cdc-4c2e-4c68-ae85-21b3486199ca', 'Stanley Quencher H2.0 40oz', 'stanley-quencher-h2-40oz', 'Termo Stanley Quencher de 40oz con aislamiento de doble pared y asa ergonómica.', 45.00, 195.00, '{"/images/products/stanley-quencher.jpg"}', '{Stanley,Termo,Hogar}', true, false, 'high', 25.00, 'available'),
  ('68a3dbf7-f933-49cd-b83a-7276d7f6371c', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '0845b836-0789-4c1e-8dde-d23cf4b32df1', '59ee0d07-8f8e-4341-ab2e-ceead845c4cf', 'MacBook Air M3 13" 256GB', 'macbook-air-m3-13-256gb', 'MacBook Air ultraligero con chip M3, pantalla Liquid Retina de 13.6" y batería de hasta 18 horas.', 1099.00, 5200.00, '{"/images/products/macbook-air-m3.jpg","/images/products/macbook-air-m3-side.jpg"}', '{Apple,MacBook,Laptop}', true, true, 'high', 38.00, 'available'),
  ('38af50f8-eb62-40f5-b36c-bf2c304e74c0', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'a93d8f84-ebbb-4d48-9f53-672a04efe9db', '83ef2ef3-1d2a-4c22-b349-cfe15c6335b1', 'Beats Studio Pro Wireless', 'beats-studio-pro-wireless', 'Audífonos Beats Studio Pro con cancelación activa de ruido, audio espacial y hasta 40 horas de batería.', 349.00, 1200.00, '{"/images/products/beats-studio-pro.jpg"}', '{Beats,Audio,Premium}', true, false, 'medium', 30.00, 'available'),
  ('8fdbfdc3-c0e3-4802-9e89-9e7dffd428ee', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '1fa6db30-779b-4837-b1b6-ef9cbba5dbfb', '59ee0d07-8f8e-4341-ab2e-ceead845c4cf', 'Apple Watch Series 9 GPS', 'apple-watch-series-9-gps', 'Apple Watch Series 9 con chip S9, pantalla siempre activa y funciones avanzadas de salud.', 399.00, 1800.00, '{"/images/products/apple-watch-9.jpg","/images/products/apple-watch-9-band.jpg"}', '{Apple,Watch,Wearable}', true, true, 'high', 35.00, 'available'),
  ('67f1c027-a317-4dc7-ac79-4de5d6d3ac00', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '8d7d8a16-41a3-40c9-ac72-eec8a8ab4a7f', 'e40ae375-52bb-49e3-b608-125e74151d88', 'Nike Air Max Dragon Red', 'nike-air-max-dragon-red', 'Nike Air Max con diseño Dragon Red exclusivo. Amortiguación Air Max visible.', 160.00, 450.00, '{"/images/products/nike-airmax-dragon.jpg"}', '{Nike,Zapatillas,Edición limitada}', true, false, 'high', 35.00, 'available'),
  ('b7c1b5c0-217a-4c63-be00-777d0aecd7b4', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '942b1011-602e-4c93-84e5-a22d9bde1924', '59ee0d07-8f8e-4341-ab2e-ceead845c4cf', 'iPad Pro M2 11"', 'ipad-pro-m2-11', 'iPad Pro con chip M2, pantalla ProMotion y compatibilidad con Apple Pencil hover.', 799.00, 3800.00, '{"/images/products/ipad-pro-m2.jpg"}', '{Apple,iPad,Pro}', true, false, 'high', 38.00, 'available'),
  ('a8d6b9dd-7450-47de-88a0-5b2142862487', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '0845b836-0789-4c1e-8dde-d23cf4b32df1', 'cd1af1b4-5185-449a-bf9f-1503ed5acd3d', 'Dell XPS 13 2024', 'dell-xps-13-2024', 'Dell XPS 13 con procesador Intel Core Ultra, pantalla InfinityEdge 13.4" y diseño ultracompacto.', 1199.00, 5500.00, '{"/images/products/dell-xps-13.jpg"}', '{Dell,Laptop,Ultra}', true, false, 'medium', 32.00, 'available'),
  ('90a28ef9-de9b-4982-a882-3f503796220e', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '5089c733-0e4f-4132-a1a1-61632ae7594f', 'e44525ce-8ad4-4d0c-99f7-4215f480f800', 'Fossil Watch Classic', 'fossil-watch-classic', 'Reloj Fossil clásico con correa de cuero genuino y movimiento de cuarzo.', 149.00, 450.00, '{"/images/products/fossil-watch.jpg"}', '{Fossil,Reloj,Clásico}', true, false, 'medium', 30.00, 'available')
ON CONFLICT (tenant_id, slug) DO NOTHING;

-- Orders (matching tracking page and designs)
INSERT INTO orders (id, tenant_id, order_number, customer_id, agent_id, status, subtotal, shipping_cost, tevra_commission, agent_commission, total, shipping_address, notes, estimated_delivery_date) VALUES
  ('1d2fcb76-b9d6-4664-ab17-0b8c243fd042', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'TV-20260329-001', '6589f27c-fcfb-4021-890f-cd3c1926db9c', 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', 'in_customs', 599.00, 15.00, 73.68, 73.68, 687.68, '{"street":"Av. Arequipa 1234","district":"Miraflores","city":"Lima","country":"Peru"}', null, '2026-04-05'),
  ('be7a8dc2-2cb5-48f6-9e46-58c0facd372f', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'TV-20260325-002', '20042656-8e75-442b-bda2-02441f929f5c', 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', 'delivered', 115.00, 10.00, 15.00, 15.00, 140.00, '{"street":"Jr. Cusco 567","district":"Breña","city":"Lima","country":"Peru"}', null, '2026-03-30'),
  ('d9cc15e1-0f64-4ca6-81bf-d6201b57c375', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'TV-20260401-003', '4b17bd13-1a01-45a5-a9f2-8ccae1cccb65', '748ddc3c-39ba-4a03-bec4-b9d44014f36a', 'in_transit', 450.00, 15.00, 55.80, 55.80, 521.80, '{"street":"Av. España 890","city":"Trujillo","country":"Peru"}', null, '2026-04-10'),
  ('561ba195-5b69-4e20-adcf-e2fcf41861a9', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'TV-84920', '3ff1d7de-261d-4e89-a69d-3432b89d5701', 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', 'in_transit', 840.00, 15.00, 102.60, 102.60, 957.60, '{"city":"Lima","country":"Peru"}', null, '2026-04-12'),
  ('cf61b7c9-8784-435d-b2b0-a2600b9bea98', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'TV-84918', '4b17bd13-1a01-45a5-a9f2-8ccae1cccb65', '2e9e63f8-4349-43a5-ad37-482b6e4f9e75', 'in_customs', 1250.00, 20.00, 152.40, 152.40, 1422.40, '{"city":"Lima","country":"Peru"}', null, '2026-04-08'),
  ('f26e3937-0770-4345-9012-48917f500a85', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'TV-84915', '42ece050-1507-46cd-b95b-028b5fad65f6', '2e9e63f8-4349-43a5-ad37-482b6e4f9e75', 'confirmed', 460.00, 12.00, 56.64, 56.64, 528.64, '{"city":"Lima","country":"Peru"}', null, '2026-04-15'),
  ('86f591f2-202a-408a-9526-fcdc0cfce950', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'TV-84912', '6589f27c-fcfb-4021-890f-cd3c1926db9c', 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', 'in_transit', 2100.00, 25.00, 255.00, 255.00, 2380.00, '{"city":"Lima","country":"Peru"}', null, '2026-04-14')
ON CONFLICT (order_number) DO NOTHING;

-- Order Items
INSERT INTO order_items (id, order_id, product_id, product_name, product_image, quantity, unit_price, total_price) VALUES
  ('cbec8fc5-ec2e-47c9-9893-dc33a591090b', '1d2fcb76-b9d6-4664-ab17-0b8c243fd042', '039912e2-0b55-4456-8917-1fc4d44c5497', 'iPad Air M4', '/images/products/ipad-air-m4-front.jpg', 1, 599.00, 599.00),
  ('e451e7ab-ef2d-49b1-bdbb-0ef1f088d60c', 'be7a8dc2-2cb5-48f6-9e46-58c0facd372f', '65f479b9-1042-4edc-9d97-1b4a591baa93', 'Nike Air Force 1 07', '/images/products/nike-af1-white.jpg', 1, 115.00, 115.00),
  ('eb8e0752-2498-4676-b74b-77c0a1d1fc62', 'd9cc15e1-0f64-4ca6-81bf-d6201b57c375', 'e41d2460-a7d1-413d-b949-fd696b798005', 'Coach Tabby Shoulder Bag', '/images/products/coach-tabby.jpg', 1, 450.00, 450.00),
  ('44ac151e-a04b-400e-87e3-e1c0fb74940e', '561ba195-5b69-4e20-adcf-e2fcf41861a9', '039912e2-0b55-4456-8917-1fc4d44c5497', 'iPad Air M4', '/images/products/ipad-air-m4-front.jpg', 1, 599.00, 599.00),
  ('d7cc6e01-92ff-4ace-9ac0-18bae53fde5e', '561ba195-5b69-4e20-adcf-e2fcf41861a9', '284f3dea-7899-490c-bbc0-edcbb1641f8a', 'AirPods Pro 3rd Gen', '/images/products/airpods-pro-3.jpg', 1, 249.00, 249.00)
ON CONFLICT DO NOTHING;

-- Payments
INSERT INTO payments (id, tenant_id, order_id, amount, method, status, paid_at) VALUES
  ('28468b3f-cb37-4924-a440-29812d6fac9d', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '1d2fcb76-b9d6-4664-ab17-0b8c243fd042', 687.68, 'yape', 'completed', '2026-03-25 15:45:00+00'),
  ('77eac7b6-6e51-4f28-a22d-1916dfec3ee2', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'be7a8dc2-2cb5-48f6-9e46-58c0facd372f', 140.00, 'bank_transfer', 'completed', '2026-03-25 10:00:00+00'),
  ('932b409f-d34b-4138-bcc9-b5c358758b25', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'd9cc15e1-0f64-4ca6-81bf-d6201b57c375', 521.80, 'yape', 'completed', '2026-04-01 09:30:00+00')
ON CONFLICT DO NOTHING;

-- Shipments (matching tracking page)
INSERT INTO shipments (id, tenant_id, order_id, tracking_number, status, current_location, destination, estimated_arrival, carrier) VALUES
  ('fbb718c4-bb40-48ca-b903-2bf2b766ffa1', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '1d2fcb76-b9d6-4664-ab17-0b8c243fd042', 'TH-9920-X1', 'in_customs', 'Aduana Lima', 'Lima, Peru', '2026-04-05', 'TeVra Logistics'),
  ('4dc3def5-ac98-4fbf-b852-009916c47f4f', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'be7a8dc2-2cb5-48f6-9e46-58c0facd372f', 'TH-9918-X2', 'delivered', 'Lima, Peru', 'Lima, Peru', '2026-03-30', 'TeVra Logistics'),
  ('82ef4efd-59c3-469f-a658-1de5ac685106', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'd9cc15e1-0f64-4ca6-81bf-d6201b57c375', 'TH-9921-X3', 'in_transit', 'Miami Hub', 'Trujillo, Peru', '2026-04-10', 'TeVra Logistics')
ON CONFLICT DO NOTHING;

-- Shipment Events (matching tracking timeline)
INSERT INTO shipment_events (id, shipment_id, status, location, description, occurred_at) VALUES
  ('940605aa-54fd-4531-ad33-54f66ad37a5b', 'fbb718c4-bb40-48ca-b903-2bf2b766ffa1', 'pending', 'Lima, Peru', 'Tu pago fue recibido.', '2026-03-25 15:45:00+00'),
  ('b202b3ac-604b-49a3-98ba-794c9e7550a8', 'fbb718c4-bb40-48ca-b903-2bf2b766ffa1', 'purchased', 'Miami, FL USA', '¡Compramos tu iPad Air M4 en Miami!', '2026-03-26 11:20:00+00'),
  ('41150acd-9195-4cac-91be-deee8c055472', 'fbb718c4-bb40-48ca-b903-2bf2b766ffa1', 'in_transit', 'Miami, FL USA', 'Tu producto salió de Miami.', '2026-03-27 08:00:00+00'),
  ('3e9631cd-60d1-4120-8691-87e63f76977a', 'fbb718c4-bb40-48ca-b903-2bf2b766ffa1', 'in_customs', 'Lima, Peru', 'Llegó a Lima, en proceso de liberación.', '2026-03-28 14:00:00+00')
ON CONFLICT DO NOTHING;

-- Reviews (matching product detail page)
INSERT INTO reviews (id, tenant_id, order_id, product_id, agent_id, reviewer_id, rating, title, body, is_verified_purchase) VALUES
  ('f6fe0e7a-afb3-4b33-9406-971bdb02cad9', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'be7a8dc2-2cb5-48f6-9e46-58c0facd372f', '039912e2-0b55-4456-8917-1fc4d44c5497', 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', '20042656-8e75-442b-bda2-02441f929f5c', 5, 'Increíble rapidez', 'Llegó a Lima en solo 7 días. La comunicación con María fue excelente, siempre me mantuvo al tanto del estado de mi iPad.', true),
  ('8fa9b551-9585-4c38-b055-dd35c1876a30', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', null, '039912e2-0b55-4456-8917-1fc4d44c5497', 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', '4b17bd13-1a01-45a5-a9f2-8ccae1cccb65', 5, 'Original y sellado', 'Tenía miedo de que no fuera original pero viene con toda la garantía de Apple. Ahorré muchísimo dinero comparado con tiendas locales.', true),
  ('0881f504-dd20-46a8-b936-53958616c90e', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', null, '039912e2-0b55-4456-8917-1fc4d44c5497', 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', '3ff1d7de-261d-4e89-a69d-3432b89d5701', 5, 'Excelente atención', 'El proceso de WhatsApp es muy sencillo. Me ayudaron a elegir el modelo correcto para mi trabajo de diseño gráfico.', true),
  ('e3296c20-a13c-4dc3-830a-13645f7e9c36', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', null, null, 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', '6589f27c-fcfb-4021-890f-cd3c1926db9c', 5, 'Increíble servicio', 'María consiguió mis zapatillas que estaban agotadas en todo el país y llegaron en perfecto estado.', true),
  ('be2efa75-de80-4056-8c45-6f9f480aa817', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', null, null, 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', '4b17bd13-1a01-45a5-a9f2-8ccae1cccb65', 5, 'Muy profesional', 'Muy profesional y atenta. Me mantuvo informada de cada paso del envío. Definitivamente volveré a comprar con ella.', true),
  ('21a20f88-721d-41f2-a3cf-45ab70a693a3', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', null, null, 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', '3ff1d7de-261d-4e89-a69d-3432b89d5701', 5, 'iPad impecable', 'El iPad llegó impecable. María me ayudó a ahorrar casi 300 dólares comparado con el precio local. Muy recomendada.', true),
  ('114bff22-4649-439f-a95d-560df6f91452', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', null, null, null, '6589f27c-fcfb-4021-890f-cd3c1926db9c', 5, 'Producto original', 'Pedí una laptop que en Lima costaba el doble. Llegó en 10 días, perfectamente embalada y el agente me mantuvo al tanto por WhatsApp todo el tiempo.', true),
  ('c699030b-9d2c-4ecc-8eed-ff72db6fa9e7', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', null, null, null, '42ece050-1507-46cd-b95b-028b5fad65f6', 5, 'Agente excelente', 'Ser agente de TeVra me ha permitido generar ingresos extra manejando mis propios tiempos. La plataforma es súper intuitiva y el respaldo de la empresa da mucha seguridad.', true)
ON CONFLICT DO NOTHING;

-- Commissions
INSERT INTO commissions (id, tenant_id, agent_id, order_id, amount, rate, status) VALUES
  ('b00948fb-7a61-4bb4-bf5b-ad1d01b93100', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', '1d2fcb76-b9d6-4664-ab17-0b8c243fd042', 73.68, 12.00, 'pending'),
  ('0e67b377-5220-4ae7-aa1d-e9bf3050cb50', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'a6876626-88ca-4c2e-8a4a-77f51e2888ac', 'be7a8dc2-2cb5-48f6-9e46-58c0facd372f', 15.00, 12.00, 'paid'),
  ('b99256e7-5e78-4994-8499-76cf65e08c4f', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '748ddc3c-39ba-4a03-bec4-b9d44014f36a', 'd9cc15e1-0f64-4ca6-81bf-d6201b57c375', 55.80, 12.00, 'pending')
ON CONFLICT DO NOTHING;

-- Wishlist items (for Mi Cuenta page)
INSERT INTO wishlist_items (id, user_id, product_id) VALUES
  ('bdd11ed2-8a9d-482a-9c91-06cb272d49d4', '6589f27c-fcfb-4021-890f-cd3c1926db9c', '284f3dea-7899-490c-bbc0-edcbb1641f8a'),
  ('c1ce998f-2052-46b3-9e7a-b9c68bd41c83', '6589f27c-fcfb-4021-890f-cd3c1926db9c', '65f479b9-1042-4edc-9d97-1b4a591baa93'),
  ('42c4c0a9-d696-48e4-83e0-5b8218c1804f', '6589f27c-fcfb-4021-890f-cd3c1926db9c', 'e41d2460-a7d1-413d-b949-fd696b798005'),
  ('3b6c561f-6a00-4ae3-b918-858b55cf59e6', '6589f27c-fcfb-4021-890f-cd3c1926db9c', '90a28ef9-de9b-4982-a882-3f503796220e')
ON CONFLICT (user_id, product_id) DO NOTHING;

-- Campaign Templates
INSERT INTO campaign_templates (id, tenant_id, name, type, subject, body, is_active) VALUES
  ('df14589b-b70f-4be0-99e3-32faf3e70b2d', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'New Offer', 'whatsapp', 'Nueva oferta TeVra', '¡Hola {{name}}! Tenemos ofertas increíbles en {{category}}. ¡No te las pierdas!', true),
  ('3e757e89-63f3-4a7c-8ea0-766139e25849', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Welcome', 'whatsapp', 'Bienvenido a TeVra', '¡Bienvenido a TeVra, {{name}}! Tu puente directo a productos de USA.', true),
  ('daddf551-8684-4dbc-9d0f-7335d1534cfa', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Shipping Update', 'whatsapp', 'Actualización de envío', 'Hola {{name}}, tu pedido {{order_number}} está {{status}}. ¡Pronto lo tendrás!', true),
  ('80d7b4dc-9f56-4659-ae9c-ac0201f764d3', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Review Request', 'whatsapp', 'Cuéntanos tu experiencia', '¡Hola {{name}}! ¿Qué tal tu experiencia con tu {{product}}? Tu opinión nos ayuda a mejorar.', true)
ON CONFLICT DO NOTHING;

-- Audience Segments
INSERT INTO audience_segments (id, tenant_id, name, description, criteria, member_count) VALUES
  ('6cf5f942-cb54-448c-9f50-2865e1b097d5', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'High Value Customers', 'Clientes con más de $500 en compras', '{"min_total_spent": 500}', 2400),
  ('ee3d5671-74fb-4d7a-a87f-65729b66c23a', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'Inactive (30d+)', 'Clientes sin actividad en 30+ días', '{"days_inactive": 30}', 1100),
  ('ee388b43-4600-486b-b347-ac2479be5a03', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'New Leads (Austin)', 'Nuevos contactos de Austin, TX', '{"city": "Austin", "status": "lead"}', 432)
ON CONFLICT DO NOTHING;

-- Campaigns
INSERT INTO campaigns (id, tenant_id, created_by, template_id, name, type, status, message, audience_type, recipient_count, sent_count, open_count, click_count, sent_at) VALUES
  ('29c2a17c-f247-4e10-8529-0158fdf5cb71', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'c049571a-f16b-43e5-ab38-f13a585623ac', 'df14589b-b70f-4be0-99e3-32faf3e70b2d', 'Autumn Seasonal Offer 2023', 'whatsapp', 'sent', 'Ofertas de temporada de otoño en productos Apple y más.', 'all_customers', 5000, 5000, 4200, 1200, '2023-10-24 10:00:00+00'),
  ('8dc779d9-9b63-49e2-92ef-51f2e18bcbc7', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'c049571a-f16b-43e5-ab38-f13a585623ac', '3e757e89-63f3-4a7c-8ea0-766139e25849', 'New Agent Onboarding Series', 'whatsapp', 'draft', 'Serie de bienvenida para nuevos agentes de la red TeVra.', 'agents', 0, 0, 0, 0, null),
  ('92532f6c-355c-4de1-9cf8-af69ef7139ea', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'c049571a-f16b-43e5-ab38-f13a585623ac', 'daddf551-8684-4dbc-9d0f-7335d1534cfa', 'Flash Shipping Updates Notification', 'whatsapp', 'paused', 'Actualizaciones rápidas de envío para clientes con pedidos activos.', 'customers_by_city', 800, 496, 300, 0, '2023-10-15 14:00:00+00')
ON CONFLICT DO NOTHING;

-- Notifications
INSERT INTO notifications (id, tenant_id, user_id, type, title, body, data, is_read) VALUES
  ('25c25326-c67c-43de-bb31-9e1e94c05e5d', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '6589f27c-fcfb-4021-890f-cd3c1926db9c', 'order_update', 'Pedido en aduana', 'Tu pedido TV-20260329-001 ha llegado a Lima y está en proceso de desaduanaje.', '{"order_id":"1d2fcb76-b9d6-4664-ab17-0b8c243fd042"}', false),
  ('bf97a174-49be-47f6-9337-12bf10a7f56a', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', '7e48a53b-82cb-4273-b452-4bb96b8f02a5', 'new_order', 'Nuevo pedido recibido', 'Carlos Mendez ha realizado un nuevo pedido por $687.68', '{"order_id":"1d2fcb76-b9d6-4664-ab17-0b8c243fd042"}', false),
  ('e356e9e8-4de1-41b0-a55e-c97cabe6825d', '2cc9d9f5-ddb1-4401-ac72-94e3dc341a0b', 'c049571a-f16b-43e5-ab38-f13a585623ac', 'agent_application', 'Nueva solicitud de agente', 'Isabela Suarez de Bogota ha solicitado ser agente.', '{"application_id":"3b3e855d-942e-41f6-93f2-c9680257abb6"}', false)
ON CONFLICT DO NOTHING;
