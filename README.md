# EduVision — Digital Classroom

A cute, student-friendly full-stack school learning platform.

## Features

### Student
- Student login
- Dashboard
- Subjects and chapters
- Notes, images, PDFs and video/resource links
- Subject/chapter quizzes
- Quiz explanations and score
- Progress overview
- Career Explorer
- Career interest helper
- Teacher-published content appears automatically

### Teacher
- Teacher login
- Dashboard
- Add subjects
- Add chapters
- Publish notes
- Add images/files/links
- Add videos
- Create quizzes and questions
- View student quiz results

### Backend
- Express REST API
- JWT authentication
- Role-based authorization
- Password hashing
- JSON data store for easy local development
- Multer file upload support

> For a production school deployment, replace the JSON store with PostgreSQL/MongoDB and use cloud storage for large media.

## Run

1. Install Node.js LTS.
2. Open a terminal in this folder.
3. Run:
   npm install
4. Copy `.env.example` to `.env`.
5. Run:
   npm start
6. Open:
   http://localhost:5000

## Demo accounts

Teacher:
- Email: teacher@eduvision.local
- Password: Teacher@123

Student:
- Email: student@eduvision.local
- Password: Student@123

These are demo credentials only. Change them before real use.

## Project structure

frontend/
  index.html
  app.js
  styles.css

data/
  db.json

uploads/
  (created automatically)

server.js

## Demo login
Teacher: teacher@eduvision.local / Teacher@123
Student: student@eduvision.local / Student@123

The local demo accounts are recognized directly by the server for testing.
