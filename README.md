# ParallelLives

An AI-powered "What If" life simulator that lets you explore different life paths and decisions through interactive branching narratives. Built with Next.js, Node.js, and Google's Gemini AI.

## 🌟 Features

- **Interactive Life Simulation**: Explore different career paths, locations, and life choices
- **AI-Generated Narratives**: Dynamic storytelling powered by Google Gemini AI
- **Branching Decision Trees**: Visual tree structure showing all your life path alternatives
- **Contextual Branching**: New scenarios build upon previous choices for meaningful progression
- **Metrics Tracking**: Monitor happiness, income, and quality of life across different paths
- **PDF Export**: Export your complete life simulation journey
- **Real-World Data Integration**: 
  - City data and quality of life metrics via Teleport API
  - Weather and climate data via Open-Meteo API
  - Career information via O*NET API
  - Visual content via Unsplash API

## 🏗️ Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives with custom styling
- **Visualization**: D3.js for interactive tree diagrams
- **State Management**: React Query for server state
- **Forms**: React Hook Form with Zod validation

### Backend (Node.js + Express)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Google Gemini AI for narrative generation
- **External APIs**: Teleport, Open-Meteo, O*NET, Unsplash
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston with structured logging

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- API keys for external services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd parallellives
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Copy the example environment file and configure your API keys:
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Required environment variables:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # API Keys
   GEMINI_API_KEY=your_gemini_api_key
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key
   ONET_API_USER=your_onet_username
   ONET_API_PASS=your_onet_password
   
   # Security
   JWT_SECRET=your_jwt_secret
   ```

4. **Start Development Servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔧 Development

### Backend Scripts
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm run start    # Start production server
npm run test     # Run tests
npm run lint     # Run ESLint
```

### Frontend Scripts
```bash
npm run dev        # Start Next.js development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run Next.js linter
npm run type-check # TypeScript type checking
```

## 📁 Project Structure

```
parallellives/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # External API integrations
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Application entry point
│   ├── logs/               # Application logs
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # React components
│   │   └── lib/            # Utility functions and configs
│   ├── public/             # Static assets
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Sessions
- `POST /api/sessions` - Create new simulation session
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Nodes (Life Scenarios)
- `POST /api/nodes` - Create new life scenario
- `GET /api/nodes/:id` - Get scenario details
- `PUT /api/nodes/:id` - Update scenario
- `DELETE /api/nodes/:id` - Delete scenario

### External Data
- `GET /api/cities/search` - Search cities
- `GET /api/occupations/search` - Search occupations
- `GET /api/images/search` - Search images

## 🎯 Key Features Explained

### Contextual Branching
New scenario branches inherit context from parent nodes:
- **Metrics Blending**: 70% new scenario + 30% parent influence
- **Narrative Continuity**: AI references previous life experiences
- **Progressive Storytelling**: Each branch builds upon previous choices

### Tree Visualization
Interactive D3.js tree showing:
- All life path alternatives
- Visual branching structure
- Node selection and navigation
- Zoom and pan capabilities

### AI Narrative Generation
Google Gemini AI creates:
- Contextual life stories
- Chapter-based progression
- Realistic scenario outcomes
- Personalized content based on choices

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configured for frontend domain
- **Input Validation**: Zod schemas for all inputs
- **Error Handling**: Comprehensive error responses
- **Logging**: Structured logging with Winston

## 🚀 Deployment

### Backend Deployment
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to your preferred platform (Heroku, Railway, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or similar platform
3. Configure environment variables for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**Frontend blank screen**: Check browser console for font loading errors or missing dependencies

**Backend API errors**: Verify all environment variables are set correctly

**Database connection issues**: Ensure MongoDB URI is correct and database is accessible

**External API failures**: Check API key validity and service availability

### Getting Help

- Check the logs in `backend/logs/` for detailed error information
- Verify all dependencies are installed correctly
- Ensure all required environment variables are configured

## 🔮 Future Enhancements

- User authentication and profiles
- Social sharing of life paths
- Advanced metrics and analytics
- Mobile app version
- Multi-language support
- Integration with more external data sources
