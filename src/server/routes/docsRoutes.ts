import { Router, Request, Response } from 'express';

const router = Router();

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Assignment & Submission Management System API',
    version: '1.0.0',
    description: 'RESTful API for Role-Based Assignment & Submission Management System with Admin, Teacher, and Student roles.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate User and Receive JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@school.edu' },
                  password: { type: 'string', example: 'Admin123!' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'JWT Token & User Details' }, 401: { description: 'Invalid Credentials' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get Current Authenticated User Profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Current User Object' } },
      },
    },
    '/users': {
      get: { summary: 'List Users (Admin)', security: [{ bearerAuth: [] }] },
      post: { summary: 'Create New User (Admin)', security: [{ bearerAuth: [] }] },
    },
    '/classes': {
      get: { summary: 'List Classes', security: [{ bearerAuth: [] }] },
      post: { summary: 'Create Class (Admin)', security: [{ bearerAuth: [] }] },
    },
    '/subjects': {
      get: { summary: 'List Subjects', security: [{ bearerAuth: [] }] },
      post: { summary: 'Create Subject (Admin)', security: [{ bearerAuth: [] }] },
    },
    '/assignments': {
      get: { summary: 'List Assignments (Role Filtered)', security: [{ bearerAuth: [] }] },
      post: { summary: 'Create Assignment (Teacher/Admin)', security: [{ bearerAuth: [] }] },
    },
    '/assignments/{id}': {
      get: { summary: 'Get Assignment Details by ID', security: [{ bearerAuth: [] }] },
      put: { summary: 'Update Assignment Details (Teacher Owner/Admin)', security: [{ bearerAuth: [] }] },
      delete: { summary: 'Delete Assignment (Teacher Owner/Admin)', security: [{ bearerAuth: [] }] },
    },
    '/assignments/{id}/status': {
      patch: { summary: 'Update Assignment Status (Draft, Published, Closed)', security: [{ bearerAuth: [] }] },
    },
    '/submissions': {
      get: { summary: 'List Submissions (Role Filtered)', security: [{ bearerAuth: [] }] },
      post: { summary: 'Submit Assignment Answer (Student)', security: [{ bearerAuth: [] }] },
    },
    '/submissions/{id}/grade': {
      put: { summary: 'Grade & Feedback Submission (Teacher/Admin)', security: [{ bearerAuth: [] }] },
    },
  },
};

router.get('/openapi.json', (req: Request, res: Response) => {
  res.json(openApiSpec);
});

export default router;
