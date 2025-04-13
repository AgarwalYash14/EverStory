# EverStory

<div align="center">
  <h3>A modern social media platform with microservice architecture</h3>
  <p>Full-stack implementation with React + TypeScript frontend and Python FastAPI microservices backend</p>
</div>

## 🌟 Overview

EverStory is a feature-rich social media application built using modern web development practices. The platform enables users to share stories, connect with friends, and engage through posts with robust privacy controls. The architecture follows a scalable microservices approach with a responsive, feature-based frontend.

### 🖼️ Screenshots

<div align="center">
  <img src="https://raw.githubusercontent.com/AgarwalYash14/EverStory/refs/heads/master/client/public/Main.png?token=GHSAT0AAAAAAC6LYJVR77DZM3JF4JMXNRUAZ74GTWQ" alt="EverStory" />
</div>

## 🏗️ Architecture

EverStory implements a comprehensive full-stack architecture:

```
┌─────────────────────────────────┐
│                                 │
│   React + TypeScript Frontend   │
│   (Vite, Redux, React Query)    │
│                                 │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│                                 │
│        Kong API Gateway         │
│                                 │
└───┬───────────┬───────────┬─────┘
    │           │           │
    ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│         │ │         │ │         │
│  Auth   │ │  Image  │ │ Friend- │
│ Service │ │ Service │ │  ship   │
│         │ │         │ │ Service │
│         │ │         │ │         │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Auth DB │ │ Image DB│ │Friend DB│
└─────────┘ └─────────┘ └─────────┘
```

### 🚀 Frontend Architecture

The frontend is built with:
- **React 19** with **TypeScript** for type safety
- **Vite** for lightning-fast builds and development
- **Redux** for global state management
- **React Query** for efficient server state management and caching
- **TailwindCSS** for responsive styling with dark mode support
- **Feature-based folder structure** for scalable maintenance

### 🔧 Backend Microservices

The backend utilizes:
- **FastAPI** Python microservices
- **Kong API Gateway** for routing and authentication
- **PostgreSQL** for persistent data storage
- **WebSockets** for real-time updates
- **JWT** for secure authentication
- **Docker & Docker Compose** for containerization

## ✨ Features

### Authentication & User Management
- JWT-based authentication with secure cookie handling
- User registration with validation
- Protected routes with role-based access control
- Profile management with image uploads

### Posts & Content
- Create, view, edit, and delete posts
- Image uploading with client & server-side optimization (Cloudinary integration)
- Private/public post visibility settings
- Infinite scrolling feed with virtualization for performance
- Responsive image loading with different sizes for various devices
- WebSocket real-time updates for new posts, comments, and likes

### Social Features
- Friend request system (send, accept, reject)
- Friend list management
- User profile viewing with privacy controls
- Like and comment on posts with optimistic updates

### UI/UX Features
- Responsive design for all screen sizes
- Dark mode support with persistent user preference
- Optimistic UI updates for improved perceived performance
- Client-side and server-side image optimization
- Debounced search for post filtering

## 🛠️ Setup & Installation

### Prerequisites

- Node.js v18+ and npm/yarn
- Docker and Docker Compose
- Python 3.10+

### Frontend Setup

```bash
# Navigate to client directory
cd EverStory/client

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Navigate to server directory
cd EverStory/server

# Start microservices with Docker Compose
docker-compose up -d

# The API will be available at http://localhost:8080
```

## 🔑 API Service Endpoints

### Auth Service
- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/auth/user` - Get current user data
- `/api/auth/logout` - User logout

### Image Service
- `/api/posts` - Create, get, update, delete posts
- `/api/posts/{id}/like` - Like/unlike post
- `/api/posts/{id}/comments` - Post comments
- `/api/posts/optimize-image` - Image optimization

### Friendship Service
- `/api/friendships` - Get user's friendships
- `/api/friendships/requests` - Get friend requests
- `/api/friendships/{id}` - Accept/reject friend requests

## 💻 Technical Implementation Details

### Frontend

#### State Management
- **Redux** for global state (auth, friends)
- **React Query** for server state (posts, comments)
- **WebSockets** for real-time updates

#### Optimization Techniques
- React Query caching with optimistic updates
- Image optimization and lazy loading
- Virtualized lists for performance
- Responsive image sizing using Cloudinary transformations

### Backend

#### Auth Service
- JWT token generation and validation
- User creation and management
- Password hashing with bcrypt

#### Image Service
- Post creation with privacy settings
- Image upload to Cloudinary with optimization
- Comment and like functionality

#### Friendship Service
- Friend request management
- Privacy checks for post visibility
- Friend list retrieval

#### API Gateway
- Kong for routing between microservices
- Centralized authentication validation
- Rate limiting and security
