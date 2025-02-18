const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const readline = require("readline")

const isCodespace = process.env.CODESPACES === "true"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function runCommand(command) {
  try {
    execSync(command, { stdio: "inherit" })
  } catch (error) {
    console.error(`Failed to execute command: ${command}`)
    console.error(error)
    process.exit(1)
  }
}

function checkDependency(dependency) {
  try {
    execSync(`which ${dependency}`, { stdio: "ignore" })
    return true
  } catch (error) {
    return false
  }
}

function updateEnvFile(blockfrostId) {
  const envPath = path.join(__dirname, ".env")
  let envContent = fs.readFileSync(envPath, "utf8")
  envContent = envContent.replace(/BLOCKFROST_PROJECT_ID=.*/, `BLOCKFROST_PROJECT_ID=${blockfrostId}`)
  fs.writeFileSync(envPath, envContent)
}

async function promptForInput(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

const nginxConfig = `
server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`

const githubWorkflow = `
name: CI/CD

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build frontend
        run: cd frontend && npm install && npm run build
      - name: Build backend
        run: cd backend && npm install && npm run build
      - name: Build docker images
        run: docker-compose build
      - name: Deploy to production
        run: docker-compose -f docker-compose.prod.yml up -d --build
`

const prometheusConfig = `
global:
  scrape_interval:     15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
`

const logstashConfig = `
input {
  beats {
    port => 5044
  }
}

filter {
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{DATA:level} %{GREEDYDATA:message}" }
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "cardano-dashboard-%{+YYYY.MM.dd}"
  }
}
`

const dbRecoverScript = `
#!/bin/bash

# Stop the database container
docker-compose stop db

# Remove the existing database volume
docker volume rm cardano_dashboard_db

# Recreate the database volume
docker volume create cardano_dashboard_db

# Start the database container
docker-compose up -d db

# Run database migrations
docker-compose exec backend npx sequelize-cli db:migrate
`

async function setup() {
  console.log("Starting setup...")

  // Check dependencies
  const dependencies = ["docker", "docker-compose", "npm"]
  for (const dep of dependencies) {
    if (!checkDependency(dep)) {
      console.error(`Error: ${dep} is not installed. Please install ${dep} and try again.`)
      process.exit(1)
    }
  }

  // Create .env file if it doesn't exist
  const envPath = path.join(__dirname, ".env")
  if (!fs.existsSync(envPath)) {
    console.log("Creating .env file...")
    const envContent = `
BLOCKFROST_PROJECT_ID=your_blockfrost_project_id_here
DATABASE_URL=postgresql://user:password@db:5432/cardano_dashboard
NEXT_PUBLIC_API_URL=http://localhost:5000
JWT_SECRET=${require("crypto").randomBytes(32).toString("hex")}
    `.trim()
    fs.writeFileSync(envPath, envContent)
  }

  // Check if running in GitHub Codespaces
  if (isCodespace) {
    console.log("Running in GitHub Codespaces environment")

    // Use Codespaces-specific environment variables
    const envContent = `
BLOCKFROST_PROJECT_ID=${process.env.BLOCKFROST_PROJECT_ID || "your_blockfrost_project_id_here"}
NEXT_PUBLIC_API_URL=https://${process.env.CODESPACE_NAME}-5000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@db:5432/cardano_dashboard
JWT_SECRET=${require("crypto").randomBytes(32).toString("hex")}
    `.trim()

    fs.writeFileSync(path.join(__dirname, ".env"), envContent)

    // Skip interactive prompts in Codespaces
    console.log("Environment variables configured for Codespaces")
  } else {
    // Regular setup process for local development
    const blockfrostId = await promptForInput("Enter your Blockfrost project ID: ")
    const apiUrl =
      (await promptForInput("Enter the API URL (default: http://localhost:5000): ")) || "http://localhost:5000"
    const port = (await promptForInput("Enter the port for the frontend (default: 3000): ")) || "3000"
    const dbUrl = await promptForInput("Enter the database URL: ")
    const jwtSecret = await promptForInput("Enter the JWT secret: ")

    const envContent = `
BLOCKFROST_PROJECT_ID=${blockfrostId}
NEXT_PUBLIC_API_URL=${apiUrl}
PORT=${port}
DATABASE_URL=${dbUrl}
JWT_SECRET=${jwtSecret}
    `.trim()

    fs.writeFileSync(path.join(__dirname, ".env"), envContent)
  }

  // Install dependencies
  console.log("Installing dependencies...")
  runCommand("npm install")

  // Build and start Docker containers
  console.log("Building and starting Docker containers...")
  runCommand("docker-compose up --build -d")

  // Wait for database to be ready
  console.log("Waiting for database to be ready...")
  let dbReady = false
  while (!dbReady) {
    try {
      runCommand("docker-compose exec -T db pg_isready -h localhost -p 5432")
      dbReady = true
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // Run database migrations
  console.log("Running database migrations...")
  runCommand("docker-compose exec -T backend npx sequelize-cli db:migrate")

  // Create default admin user
  const defaultAdminPassword = isCodespace ? "admin123" : await promptForInput("Enter the admin password: ")

  console.log("Creating default admin user...")
  runCommand(`
    docker-compose exec -T backend node -e "
      const { User } = require('./models');
      const bcrypt = require('bcryptjs');

      async function createAdminUser() {
        try {
          const adminUser = await User.findOne({ where: { username: 'admin' } });
          if (!adminUser) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('${defaultAdminPassword}', salt);
            await User.create({ username: 'admin', password: hashedPassword });
            console.log('Admin user created successfully.');
          } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('${defaultAdminPassword}', salt);
            await adminUser.update({ password: hashedPassword });
            console.log('Admin user password updated successfully.');
          }
        } catch (error) {
          console.error('Error creating/updating admin user:', error);
        }
      }

      createAdminUser();
    "
  `)

  console.log("\nSetting up production environment...")

  // Copy production Dockerfiles
  fs.copyFileSync("frontend/Dockerfile.prod", "frontend/Dockerfile")
  fs.copyFileSync("backend/Dockerfile.prod", "backend/Dockerfile")

  // Create Nginx configuration
  fs.writeFileSync("nginx.conf", nginxConfig)

  // Create GitHub Actions workflow
  if (!fs.existsSync(".github")) {
    fs.mkdirSync(".github")
  }
  if (!fs.existsSync(".github/workflows")) {
    fs.mkdirSync(".github/workflows")
  }
  fs.writeFileSync(".github/workflows/main.yml", githubWorkflow)

  // Create Prometheus configuration
  fs.writeFileSync("prometheus.yml", prometheusConfig)

  // Create Logstash configuration
  fs.writeFileSync("logstash.conf", logstashConfig)

  // Create database recovery script
  fs.writeFileSync("db-recover.sh", dbRecoverScript)
  runCommand("chmod +x db-recover.sh")

  console.log("\n=== Setup Complete ===")
  console.log("Your Cardano Ecosystem Dashboard is now running.")

  if (isCodespace) {
    console.log(
      `Frontend: https://${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`,
    )
    console.log(
      `Backend: https://${process.env.CODESPACE_NAME}-5000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`,
    )
  } else {
    console.log("Frontend: http://localhost:3000")
    console.log("Backend: http://localhost:5000")
  }

  console.log("\nDefault admin credentials:")
  console.log("Username: admin")
  console.log(`Password: ${isCodespace ? "admin123" : defaultAdminPassword}`)

  if (isCodespace) {
    console.log("\nNote: You're running in GitHub Codespaces.")
    console.log("The ports have been automatically forwarded and are accessible via HTTPS.")
  }

  rl.close()
}

setup()

