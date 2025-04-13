# EverStory

<div align="center">
  <h3>A modern social media platform with microservice architecture</h3>
  <p>Full-stack implementation with React + TypeScript frontend and Python FastAPI microservices backend</p>
</div>

## 🌟 Overview

EverStory is a feature-rich social media application built using modern web development practices. The platform enables users to share stories, connect with friends, and engage through posts with robust privacy controls. The architecture follows a scalable microservices approach with a responsive, feature-based frontend.

### 🖼️ Screenshots

<div align="center">
  <img src="https://media-hosting.imagekit.io/b5695cd5e9dc4508/Main.png?Expires=1839194140&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=gtZTi4igKasNk2SmiIJInAjaJFKWpGuo4O6sBFVf4Q7f5ONUa6V3sZc6BUQKW8s2Mmtc4HHokVHnpVj6I7Jgk1RuLtMtE0rjEAU1HhlPhe6zpLbJu0BzIrfgWDg8SU9TzhlzxYrGJBxELeJ1HqLwL0gf4ULCuDT8sjS7CRIkAjQlSDgybgeiSJqhE7uKBUQpNiIyBfruH9qS-S0oKEVzPnDKullLmw4KrGtwxKIvXFPWOpen9JMZ39HSwN9VQRjqttM8W2PIlpdCr8bhe~TMBkf-Fc-kdNGNe4CaTVjWUgm-LktHLg5qMUfT4hNxAIny9bawZDTpRWW8W~DAmiBldA__" alt="EverStory"  />
</div>

### 🎬 Video Walkthrough

For a detailed explanation and demonstration of EverStory's features, check out our [video walkthrough](https://drive.google.com/file/d/1zcrM6xqLuqDPmOMtd2MUOInYqqo7-PkZ/view?usp=sharing).

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

### 🔧 Backend Architecture

EverStory uses FastAPI microservices (Auth, Image, Friendship, WebSocket) with dedicated PostgreSQL databases for each service. Kong API Gateway handles routing and authentication between services. Everything is containerized with Docker for consistent deployment and isolated scaling.

## 🗃️ Database Choice

EverStory uses PostgreSQL for each microservice with dedicated isolated databases. PostgreSQL was selected for its ACID compliance, robust JSON support essential for social content, and strong performance with complex relational data like friendship networks. This approach enables independent scaling while maintaining data consistency across services.

## ✨ Features

### Authentication & User Management
- **JWT-based authentication** with secure cookie handling for stateless authentication
- **User registration** with email, username and password validation
- **Protected routes** with role-based access control using React Router guards
- **Profile management** with image uploads and personal information updates

### Posts & Content
- **Post Management**: Create, view, edit, and delete posts with real-time updates
- **Advanced Image Processing**: 
  - Client-side compression before upload to reduce bandwidth
  - Server-side Cloudinary integration for automated image optimization
  - Format conversion for optimal browser support (WebP, AVIF where supported)
  - Progressive loading for improved perceived performance
- **Privacy Control**: Toggle between private (friends-only) and public post visibility
- **Infinite Scrolling**: Virtualized lists optimized for performance with React's Intersection Observer
- **Responsive Images**: Multiple resolution variants served based on device screen size and network conditions
- **Real-time Updates**: WebSocket integration notifies users of new posts, comments, and likes instantaneously

### Social Features
- **Friendship System**: Complete friend request workflow (send, accept, reject) with proper state management
- **Friend List Management**: View, search, and filter friends with pagination
- **Privacy-Aware Content**: Content visibility restrictions based on relationship status
- **Interactive Engagement**: Like and comment on posts with optimistic UI updates for immediate feedback
- **Notification System**: Real-time notifications for friend requests and post interactions

### Advanced UI/UX Features
- **Responsive Design**: Fully responsive layout adapting to all screen sizes from mobile to desktop
- **Dark Mode**: Comprehensive theme support with persistent user preferences stored locally
- **Optimistic UI Updates**: Immediate interface updates before server confirmation for perceived performance
- **Debounced Search**: Implementation of 300ms search input debouncing to prevent excessive API calls while typing
  ```typescript
  // Debounced search implementation
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // The debouncedTerm is used for API calls after typing stops
  ```
- **Progressive Image Loading**: Blur-up technique for image loading with low-resolution placeholders
- **Form Validation**: Real-time validation feedback with helpful error messages
- **Skeleton Loading States**: Custom skeleton components during content loading for improved UX

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
  - User authentication state
  - Theme preferences
  - Friend relationship states
- **React Query** for server state (posts, comments)
  - Automatic caching and invalidation
  - Optimistic updates for immediate UI feedback
  - Pagination and infinite scrolling support
- **WebSockets** for real-time updates
  - Connection management and reconnection strategies
  - Event-based state updates without polling

#### Optimization Techniques
- **React Query Caching**:
  - Stale-while-revalidate pattern
  - Optimistic UI updates with rollback on error
  - Deduplication of identical requests
- **Image Optimization**:
  - Client-side compression before upload
  - Server-side processing for optimal delivery
  - Lazy loading with Intersection Observer
- **Virtualized Lists**:
  - Windowing technique for large datasets
  - Only rendering visible components for improved performance
- **Responsive Image Delivery**:
  - Multiple resolution variants via Cloudinary transformations
  - Proper srcset and sizes attributes for browser-based selection
  - Format negotiation (WebP/AVIF/JPEG) based on browser support

### Backend

#### Auth Service
- JWT token generation and validation with secure HttpOnly cookies
- User creation and management with email verification
- Password hashing with bcrypt and proper salt rounds
- Rate limiting for login attempts

#### Image Service
- Post creation with granular privacy settings
- Image upload pipeline with multi-stage optimization
- Comment threading and like functionality
- Search functionality with PostgreSQL text search capabilities

#### Friendship Service
- Friend request management with proper state transitions
- Privacy checking middleware for content visibility
- Friend recommendation system based on mutual connections
- Friendship status caching for performance

#### API Gateway
- Kong for intelligent routing between microservices
- Centralized authentication validation and token verification
- Rate limiting for API abuse prevention
- Response caching for frequently accessed endpoints
- CORS configuration for secure cross-origin requests

## 🏆 Completed Bonus Features

EverStory fully implements the bonus requirements with complete Dockerization of all services (Auth, Image, Friendship, WebSocket) using Docker Compose. Kong API Gateway manages service routing and authentication with automated setup scripts. Separate PostgreSQL databases are integrated for each microservice with proper isolation and connection management.

## 🖼️ Image Upload Process

When a user uploads an image to EverStory, our optimized workflow ensures high quality with minimal storage and bandwidth requirements:

1. **Client-side Validation**
   - File type checking (JPG, PNG, WebP, etc.)
   - Basic client-side size validation
   - Preview generation for immediate feedback

2. **Upload to Image Service**
   - The image is securely uploaded to our image-service microservice
   - Temporary server storage while processing

3. **Image Optimization and Processing**
   - **Cloudinary Integration**: Images are processed through our Cloudinary integration with:
     - Automatic quality optimization (`quality: "auto"`)
     - Format conversion to most efficient format based on browser support (`fetch_format: "auto"`)
     - Progressive loading for better user experience
     - Multiple resolution variants for responsive design:
       - Thumbnail: 200×200px crop
       - Medium: 600px width (scaled)
       - Large: 1200px width (limited, quality-optimized)
   - **Responsive Breakpoints**: System generates multiple sizes (200px to 1000px) for different devices
   - **Compression**: Smart compression without visible quality loss

4. **Fallback Processing**
   - Local optimization if Cloudinary is unavailable:
     - Resize to maximum width of 1920px
     - Convert to RGB color space
     - Apply 85% quality JPEG compression
     - Generate progressive JPEGs for better loading experience

5. **Storage and Reference**
   - Image URL and metadata stored in database
   - Original upload safely deleted after processing
   - Image public ID tracked for future management

6. **Delivery to Users**
   - Images served from CDN for global high-speed access
   - Appropriate image size automatically selected based on user's device
   - Lazy loading implementation for performance optimization

## 🤝 Friendship System

EverStory implements a straightforward friendship system using a relational database model. The platform tracks connections between users with explicit states (pending, accepted, rejected) and provides privacy controls based on friendship status. The current implementation focuses on direct user-to-user connections without complex scoring algorithms.

## 📝 Feedback

The microservices architecture challenge provided excellent hands-on experience with real-world patterns. The emphasis on proper service isolation and API gateway implementation helped solidify advanced concepts. Would appreciate more guidance on WebSocket integration with microservices in future iterations.
