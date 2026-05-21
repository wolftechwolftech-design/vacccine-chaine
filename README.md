# Vaccine Management System

A comprehensive vaccine management application built with React, Vite, and Supabase for tracking vaccine inventory, temperature logs, and user management.

## Features

- **Authentication**: Secure login system using Supabase Auth
- **Vaccine Stock Management**: Complete CRUD operations for vaccine inventory
- **Temperature Monitoring**: Track and log temperature readings for vaccine storage
- **User Management**: Admin interface for managing system users
- **Responsive Design**: Modern, clean UI that works on all devices

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL database + Auth)
- **Styling**: CSS Modules
- **Routing**: React Router DOM

## Database Schema

The application uses three main tables in Supabase:

### `vaccins` (Vaccines)
- `id`: Primary key
- `name`: Vaccine name
- `manufacturer`: Manufacturer name
- `batch_number`: Batch/lot number
- `quantity`: Available quantity
- `expiry_date`: Expiration date
- `storage_temp`: Required storage temperature
- `created_at`: Timestamp

### `releves` (Temperature Logs)
- `id`: Primary key
- `temperature`: Recorded temperature
- `location`: Storage location
- `recorded_by`: Person who recorded the reading
- `notes`: Optional notes
- `created_at`: Timestamp

### `users` (User Management)
- `id`: Primary key
- `name`: Full name
- `email`: Email address
- `role`: User role (user/admin/manager)
- `department`: Department/section
- `created_at`: Timestamp

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vacccine-chaine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Update `src/supabaseClient.js` with your Supabase URL and anon key
   - Ensure the database tables are created with the schema above

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Usage

1. **Login**: Use your Supabase credentials to log in
2. **Vaccine Management**: Add, edit, and delete vaccine records
3. **Temperature Logs**: Record temperature readings for vaccine storage areas
4. **User Management**: Admin users can manage system users

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Security Notes

- All authentication is handled by Supabase Auth
- Row Level Security (RLS) should be enabled on database tables
- API keys are stored in environment variables (update for production)

## License

This project is licensed under the MIT License.