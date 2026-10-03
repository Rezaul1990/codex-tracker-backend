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
          archivedAt: { type: "string", nullable: true, format: "date-time" },
          createdBy: { $ref: "#/components/schemas/AuthUser" },
          dueDate: { type: "string", nullable: true, format: "date-time" },
          projectName: { type: "string", example: "Website redesign" },
          description: { type: "string", example: "Update landing page and tracker UI" },
          members: {
            type: "array",
            items: { $ref: "#/components/schemas/AuthUser" },
          },
          startDate: { type: "string", nullable: true, format: "date-time" },
          status: {
            type: "string",
            enum: ["pending", "in-progress", "completed"],
            example: "pending",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Task: {
        type: "object",
        properties: {
          _id: { type: "string" },
          archivedAt: { type: "string", nullable: true, format: "date-time" },
          assignee: { $ref: "#/components/schemas/AuthUser" },
          createdBy: { $ref: "#/components/schemas/AuthUser" },
          description: { type: "string", example: "Prepare dashboard UI" },
          dueDate: { type: "string", nullable: true, format: "date-time" },
          priority: { type: "string", enum: ["low", "medium", "high"], example: "medium" },
          project: { $ref: "#/components/schemas/Project" },
          startDate: { type: "string", nullable: true, format: "date-time" },
          status: { type: "string", enum: ["todo", "in-progress", "completed"], example: "todo" },
          title: { type: "string", example: "Prepare dashboard UI" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          author: { $ref: "#/components/schemas/AuthUser" },
          message: { type: "string", example: "Looks good." },
          task: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Attachment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          entityType: { type: "string", enum: ["project", "task"] },
          entityId: { type: "string" },
          fileName: { type: "string" },
          mimeType: { type: "string" },
          size: { type: "number" },
          uploadedBy: { $ref: "#/components/schemas/AuthUser" },
          url: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Activity: {
        type: "object",
        properties: {
          _id: { type: "string" },
          actor: { $ref: "#/components/schemas/AuthUser" },
          action: { type: "string", example: "task_created" },
          metadata: { type: "object" },
          task: { $ref: "#/components/schemas/Task" },
          createdAt: { type: "string", format: "date-time" },
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
    "/api/auth/users": {
      get: {
        tags: ["Auth"],
        summary: "List users for member selection",
        description:
          "Admin can list all users. Manager can list members. Password hashes and other sensitive fields are never returned.",
        security: [{ cookieAuth: [] }],
        responses: {
          200: {
            description: "Safe user list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AuthUser" },
                    },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden" },
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
        summary: "List accessible active projects",
        description:
          "Returns only projects the authenticated user can access. Archived projects are hidden unless archived=true is passed.",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "archived",
            in: "query",
            required: false,
            schema: { type: "boolean" },
          },
        ],
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
                  startDate: { type: "string", format: "date", example: "2026-10-05" },
                  dueDate: { type: "string", format: "date", example: "2026-10-30" },
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
    "/api/projects/{id}": {
      get: {
        tags: ["Projects"],
        summary: "Get project details",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Project details",
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
          403: { description: "Forbidden" },
          404: { description: "Project not found" },
        },
      },
      patch: {
        tags: ["Projects"],
        summary: "Update project",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  projectName: { type: "string", example: "Website redesign" },
                  description: { type: "string", example: "Update tracker dashboard" },
                  startDate: { type: "string", format: "date", example: "2026-10-05" },
                  dueDate: { type: "string", format: "date", example: "2026-10-30" },
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
          200: { description: "Project updated" },
          403: { description: "Forbidden" },
          404: { description: "Project not found" },
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
    "/api/projects/{id}/members": {
      post: {
        tags: ["Projects"],
        summary: "Add project member",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "member@example.com" },
                  userId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Project member added" },
          403: { description: "Forbidden" },
          404: { description: "User or project not found" },
          409: { description: "Duplicate member" },
        },
      },
    },
    "/api/projects/{id}/members/{userId}": {
      delete: {
        tags: ["Projects"],
        summary: "Remove project member",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "userId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Project member removed" },
          400: { description: "Creator cannot be removed" },
          403: { description: "Forbidden" },
          404: { description: "Project member not found" },
        },
      },
    },
    "/api/projects/{id}/archive": {
      patch: {
        tags: ["Projects"],
        summary: "Archive or restore project",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  archived: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Project archive state updated" },
          403: { description: "Forbidden" },
          404: { description: "Project not found" },
        },
      },
    },
    "/api/projects/{projectId}/tasks": {
      get: {
        tags: ["Projects"],
        summary: "List project tasks",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
          { name: "archived", in: "query", required: false, schema: { type: "boolean" } },
        ],
        responses: {
          200: {
            description: "Task list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Task" },
                    },
                  },
                },
              },
            },
          },
          403: { description: "Forbidden" },
        },
      },
      post: {
        tags: ["Projects"],
        summary: "Create project task",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", example: "Prepare dashboard UI" },
                  description: { type: "string" },
                  status: { type: "string", enum: ["todo", "in-progress", "completed"] },
                  priority: { type: "string", enum: ["low", "medium", "high"] },
                  assignee: { type: "string", description: "Project member user id" },
                  startDate: { type: "string", format: "date" },
                  dueDate: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Task created" },
          400: { description: "Invalid task payload or assignee" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/projects/{projectId}/attachments": {
      get: {
        tags: ["Projects"],
        summary: "List project attachments",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Project attachment list" } },
      },
      post: {
        tags: ["Projects"],
        summary: "Upload project attachment",
        description: "Multipart upload with a file field named file.",
        security: [{ cookieAuth: [] }],
        responses: { 201: { description: "Attachment uploaded" } },
      },
    },
    "/api/projects/{projectId}/activities": {
      get: {
        tags: ["Projects"],
        summary: "List project activity",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Project activity list" } },
      },
    },
    "/api/tasks/{id}": {
      get: {
        tags: ["Projects"],
        summary: "Get task details",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Task details" },
          403: { description: "Forbidden" },
          404: { description: "Task not found" },
        },
      },
      patch: {
        tags: ["Projects"],
        summary: "Update task",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Task updated" },
          400: { description: "Invalid task payload" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/tasks/{taskId}/comments": {
      get: {
        tags: ["Projects"],
        summary: "List task comments",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Task comments" } },
      },
      post: {
        tags: ["Projects"],
        summary: "Add task comment",
        security: [{ cookieAuth: [] }],
        responses: { 201: { description: "Comment added" } },
      },
    },
    "/api/tasks/{taskId}/attachments": {
      get: {
        tags: ["Projects"],
        summary: "List task attachments",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Task attachment list" } },
      },
      post: {
        tags: ["Projects"],
        summary: "Upload task attachment",
        description: "Multipart upload with a file field named file.",
        security: [{ cookieAuth: [] }],
        responses: { 201: { description: "Attachment uploaded" } },
      },
    },
    "/api/attachments/{id}": {
      delete: {
        tags: ["Projects"],
        summary: "Remove attachment",
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: "Attachment removed" } },
      },
    },
    "/api/tasks/{id}/status": {
      patch: {
        tags: ["Projects"],
        summary: "Update task status",
        description:
          "Admin/Manager can update managed project tasks. Assigned members can update their own task status.",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: { type: "string", enum: ["todo", "in-progress", "completed"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Task status updated" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/tasks/{id}/assignee": {
      patch: {
        tags: ["Projects"],
        summary: "Update task assignee",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Task assignee updated" },
          400: { description: "Assignee must be a project member" },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/tasks/{id}/archive": {
      patch: {
        tags: ["Projects"],
        summary: "Archive or restore task",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Task archive state updated" },
          403: { description: "Forbidden" },
        },
      },
    },
  },
};

module.exports = openApiSpec;
