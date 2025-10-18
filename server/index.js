const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");

// Import route modules (we'll create these next)
const authRoutes = require("./routes/auth");
const syncRoutes = require("./routes/sync");
const sitesRoutes = require("./routes/sites");
const inspectionsRoutes = require("./routes/inspections");
const incidentsRoutes = require("./routes/incidents");
const toolboxTalksRoutes = require("./routes/toolbox-talks");
const attachmentsRoutes = require("./routes/attachments");
const reportsRoutes = require("./routes/reports");
const notificationsRoutes = require("./routes/notifications");
const usersRoutes = require("./routes/users");
const requestLogger = require("./middleware/requestLogger");

const prisma = new PrismaClient();
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(requestLogger);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Remote Jobsite Safety Compliance API",
      version: "1.0.0",
      description:
        "API for offline-first safety compliance app with sync capabilities",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3001}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }, { cookieAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Make prisma available to routes
app.set("prisma", prisma);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/sync", syncRoutes);
app.use("/api/v1/sites", sitesRoutes);
app.use("/api/v1/inspections", inspectionsRoutes);
app.use("/api/v1/incidents", incidentsRoutes);
app.use("/api/v1/toolbox-talks", toolboxTalksRoutes);
app.use("/api/v1/attachments", attachmentsRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/users", usersRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `API documentation available at http://localhost:${PORT}/api-docs`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

module.exports = app;
