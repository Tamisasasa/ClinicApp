-- 1. Create Enums
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE user_role AS ENUM ('USER', 'STAFF', 'ADMIN');

-- 2. Users / Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Clinics Table
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    area TEXT NOT NULL, -- e.g. "Sukhumvit", "Ladprao"
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    phone TEXT NOT NULL,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Clinic Operating Hours Table
CREATE TABLE operating_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE
);

-- 5. Clinic Services Table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Rabies Vaccine", "General Checkup"
    category TEXT NOT NULL, -- "Vaccination", "Surgery", "Grooming"
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Pets Table
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    species TEXT NOT NULL, -- "Dog", "Cat", etc.
    breed TEXT,
    age_months INT,
    weight_kg DECIMAL(5,2),
    medical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Favorites Table
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, clinic_id)
);

-- 8. Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    status booking_status DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Promotions & News Tables
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    discount_percentage INT,
    valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED MOCK DATA
INSERT INTO clinics (id, name, address, area, lat, lng, phone, description) VALUES
('c0111111-1111-1111-1111-111111111111', 'Thonglor Pet Hospital', '77 Sukhumvit 55, Bangkok', 'Sukhumvit', 13.7335, 100.5820, '02-712-6301', '24/7 Full Service Emergency & Vaccine Clinic'),
('c0222222-2222-2222-2222-222222222222', 'Ari Animal Care', '12 Phahonyothin Rd, Bangkok', 'Ari', 13.7800, 100.5430, '02-279-8888', 'Specialized Vaccination & Wellness Center');

INSERT INTO services (clinic_id, name, category, price) VALUES
('c0111111-1111-1111-1111-111111111111', 'Rabies Vaccination', 'Vaccination', 350.00),
('c0111111-1111-1111-1111-111111111111', 'DHPP Core Vaccine (Dogs)', 'Vaccination', 650.00),
('c0222222-2222-2222-2222-222222222222', 'Feline Leukemia Vaccine', 'Vaccination', 550.00);