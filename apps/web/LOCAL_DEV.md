# 🚀 Local Development Setup

This guide will help you set up the Zepid project for local development.

## 📋 Prerequisites

Ensure you have the following tools installed on your system:

### Required Tools

- **[Bun](https://bun.sh/)** - JavaScript runtime and package manager
- **[Node.js](https://nodejs.org/)** - JavaScript runtime environment
- **[Git](https://git-scm.com/)** - Version control system
- **[PostgreSQL](https://www.postgresql.org/)** - Database system

### Platform-Specific Installation

#### Linux
```bash
curl -sL https://gist.github.com/tianzx/874662fb204d32390bc2f2e9e4d2df0a/raw -o ~/downloaded_script.sh && chmod +x ~/downloaded_script.sh && source ~/downloaded_script.sh
```

#### macOS
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install git
brew install oven-sh/bun/bun
brew install nvm
```

### Database Setup

You have two options for PostgreSQL:

1. **Vercel Postgres** (Recommended for quick setup)
2. **Local PostgreSQL server**

For either option, you'll need to configure the `POSTGRES_URL` environment variable in your `.env.local` file:

```bash
POSTGRES_URL="your_postgres_connection_string_here"
```

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nextify-limited/libra.git
cd libra
```

### 2. Install Dependencies

```bash
bun install
```

## ⚙️ Configuration

### 1. Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration values.

### 2. Database Migration

Initialize and migrate the database (ensure PostgreSQL is running and accessible):

```bash
# Navigate to the database package and run migrations
cd packages/db
bun run db:migrate
```

```bash
# Test D1 database connection and migrate auth database
cd ../../apps/web
bun wrangler d1 execute libra --local --command='SELECT 1'

cd ../../packages/auth
bun run db:migrate
```

### 3. Start Development Server

```bash
# Navigate to the web application and start development
cd ../../apps/web
bun run prebuild && bun dev
```

use for image upload & inspect (optional)
```bash
# Navigate to the web application and start development
cd ../cdn
bun dev
```
### 4. Integrate Stripe 

```bash
# Navigate to the web application and start development
stripe listen --forward-to localhost:3000/api/auth/stripe/webhook
```

add stripe projects in Dashboard

## 🎉 You're Ready

Your local development environment should now be running. The application will be available at the URL shown in your terminal (typically `http://localhost:3000`).

## 🔧 Troubleshooting

- **Database connection issues**: Verify your `POSTGRES_URL` is correctly configured
- **Port conflicts**: Check if the default ports are available or configure different ones
- **Permission errors**: Ensure you have proper permissions for the project directory

For additional help, please check the project documentation or open an issue on GitHub.