const { env } = require("../config/env");

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Codex Tracker System API",
    version: "1.0.0",
    description:
      "Interactive API documentation for authentication, invitations, and project tracking.",
  },
  servers: [
    {
      url: env.apiUrl,
      description: "Configured backend URL",
    },
    {
      url: "http://localhost:5001",
      description: "Local backend",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Projects" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
        description:
          "Login first with /api/auth/login. The browser stores HttpOnly cookies automatically.",
      },
    },
    schemas: {
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Admin User" },
          email: { type: "string", example: "admin@example.com" },
          role: { type: "string", enum: ["admin", "manager", "member"] },
          emailVerified: { type: "boolean" },
        },
      },
      ApiMessage: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
      Invitation: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Manager One" },
          email: { type: "string", example: "manager@example.com" },
          role: { type: "string", enum: ["manager", "member"] },
          expiresAt: { type: "string", format: "date-time" },
          inviteUrl: {
            type: "string",
            example: "http://localhost:3000/auth/invite?token=secure-token",
          },
          token: {
            type: "string",
            example: "secure-token",
            description:
              "Raw invitation token. Use this value in /api/auth/invitations/accept.",
          },
        },
      },
      Project: {
        type: "object",
        properties: {
          _id: { type: "string" },
          projectName: { type: "string", example: "Website redesign" },
          description: { type: "string", example: "Update landing page and tracker UI" },
          status: {
            type: "string",
            enum: ["pending", "in-progress", "completed"],
            example: "pending",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "A valid email is required" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: {
          200: {
            description: "Backend health status",
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and set auth cookies",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "admin@example.com" },
                  password: { type: "string", example: "Admin12345" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Logged in",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AuthUser" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current logged-in user",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AuthUser" },
                  },
                },
              },
            },
          },
          401: { description: "Authentication required" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout current session",
        responses: {
          200: {
            description: "Logged out",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiMessage" },
              },
            },
          },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh auth cookies",
        responses: {
          200: { description: "Authentication refreshed" },
          401: { description: "Missing or invalid refresh token" },
        },
      },
    },
    "/api/auth/invitations": {
      post: {
        tags: ["Auth"],
        summary: "Create an invite link",
        description:
          "Admin can invite Manager or Member. Manager can invite Member only. Public admin creation is blocked.",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "role"],
                properties: {
                  name: { type: "string", example: "Manager One" },
                  email: { type: "string", example: "manager@example.com" },
                  role: { type: "string", enum: ["manager", "member"], example: "manager" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Invitation created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Invitation" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          403: { description: "Role not allowed" },
          409: { description: "User already exists" },
        },
      },
    },
    "/api/auth/invitations/accept": {
      post: {
        tags: ["Auth"],
        summary: "Accept invite and set password",
        description:
          "Uses the saved invitation name and role. Send the raw token returned by /api/auth/invitations, not the full invite URL.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: {
                    type: "string",
                    example: "secure-token",
                    description: "Use data.token from the invitation response.",
                  },
                  password: { type: "string", example: "User12345" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Account created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/AuthUser" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid or expired token" },
        },
      },
    },
    "/api/projects": {
      get: {
        tags: ["Projects"],
        summary: "List projects",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Project list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Project" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Projects"],
        summary: "Create project",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["projectName"],
                properties: {
                  projectName: { type: "string", example: "Website redesign" },
                  description: { type: "string", example: "Update tracker dashboard" },
                  status: {
                    type: "string",
                    enum: ["pending", "in-progress", "completed"],
                    example: "pending",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Project created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Project" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/projects/{id}/status": {
      patch: {
        tags: ["Projects"],
        summary: "Update project status",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["pending", "in-progress", "completed"],
                    example: "in-progress",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Project status updated",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/Project" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          400: { description: "Invalid project id or status" },
          404: { description: "Project not found" },
        },
      },
    },
  },
};

module.exports = openApiSpec;
