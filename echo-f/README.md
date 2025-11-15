# EchoF - AI-Powered Code Generation Platform

EchoF is a comprehensive AI-powered code generation platform that enables users to create full-stack web applications, native apps, and deploy them instantly. Built with modern technologies and powered by advanced AI models.

## 🚀 Features

### Core Features
- **AI-Powered Code Generation**: Generate complete applications using GPT-4 and Gemini AI
- **Multi-Stack Support**: React, Vue, Angular, Node.js, Python, React Native, Electron
- **Instant Preview**: Live preview of generated applications
- **One-Click Deployment**: Deploy to AWS, Azure, GCP, Vercel, and more
- **Real-time Collaboration**: Work together with team members in real-time
- **Security Scanning**: Automated security vulnerability detection
- **Code Validation**: Multi-file validation and error checking

### Advanced Features
- **Project Templates**: Pre-built templates for common use cases
- **Version Control**: Git integration with automatic commits
- **Analytics Dashboard**: Track usage, performance, and insights
- **API Management**: RESTful APIs with automatic documentation
- **Database Integration**: MongoDB with automated schema generation
- **File Management**: Upload, organize, and manage project files
- **Collaboration Tools**: Comments, reviews, and team management

## 🛠️ Technology Stack

### Backend
- **Node.js** with **Express.js** and **TypeScript**
- **MongoDB** with **Mongoose** ODM
- **Socket.io** for real-time features
- **JWT** for authentication
- **Docker** for containerization

### AI Integration
- **OpenAI GPT-4** for code generation
- **Google Gemini** as fallback AI provider
- **Custom validation** and **security scanning**

### Deployment
- **Docker** containers
- **AWS**, **Azure**, **GCP** integration
- **Vercel** and **Netlify** support
- **Automated CI/CD** pipelines

## 📋 Prerequisites

- Node.js 18+
- MongoDB 5+
- Docker (optional, for deployment)
- OpenAI API key or Gemini API key

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/echo-f.git
   cd echo-f
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest

   # Or install MongoDB locally
   ```

5. **Build and run the application**
   ```bash
   npm run build
   npm start
   ```

6. **For development**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/echo-f` |
| `JWT_SECRET` | JWT signing secret | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Optional |

See `.env.example` for all available options.

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Generation Endpoints

```http
POST /api/generation      # Generate code
GET  /api/generation      # Get user generations
GET  /api/generation/:id  # Get specific generation
```

### Project Endpoints

```http
GET    /api/projects          # Get user projects
POST   /api/projects          # Create project
GET    /api/projects/:id      # Get project details
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
POST   /api/projects/:id/share # Share project
```

## 🔌 Real-time Features

EchoF uses Socket.io for real-time collaboration:

```javascript
// Join a project room
socket.emit('join-project', projectId);

// Listen for code changes
socket.on('code-updated', (data) => {
  // Update editor with changes
});

// Send code changes
socket.emit('code-change', {
  projectId,
  fileId,
  content,
  cursorPosition
});
```

## 🐳 Docker Deployment

### Build Docker Image
```bash
docker build -t echo-f .
```

### Run Container
```bash
docker run -p 3001:3001 --env-file .env echo-f
```

### Docker Compose
```yaml
version: '3.8'
services:
  echo-f:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📊 Monitoring & Analytics

EchoF includes built-in analytics:

- **User Activity**: Track user interactions and feature usage
- **Generation Metrics**: Monitor AI usage and success rates
- **Performance Monitoring**: Response times and error rates
- **Security Events**: Log security-related events

## 🔒 Security

- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: API rate limiting to prevent abuse
- **Authentication**: JWT-based authentication with refresh tokens
- **Authorization**: Role-based access control
- **Security Scanning**: Automated vulnerability detection
- **Data Encryption**: Sensitive data is encrypted at rest

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API
- **Google** for Gemini AI
- **MongoDB** for database
- **Express.js** community
- **Socket.io** for real-time features

## 📞 Support

- **Documentation**: [docs.echo-f.com](https://docs.echo-f.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/echo-f/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/echo-f/discussions)

---

**Built with ❤️ by Mlungisi Mahlangu**
