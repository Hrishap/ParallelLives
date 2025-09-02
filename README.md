# ParallelLives 🌟

An AI-powered interactive life simulator that lets you explore alternate life paths through immersive storytelling and data-driven decision making. Experience "what if" scenarios with realistic outcomes, beautiful visualizations, and comprehensive analytics.

---

## 🖼️ App Showcase

<p align="center">
  <img src="frontend/public/screenshots/landing.png" alt="Landing Page" width="800"/>
  <br>
  <em>Landing Page: Instantly start exploring alternate life scenarios with AI-powered simulation.</em>
</p>

<p align="center">
  <img src="frontend/public/screenshots/treeview.png" alt="Tree View" width="800"/>
  <br>
  <em>Decision Tree: Visualize your life choices and their impacts with a D3-powered tree.</em>
</p>

<p align="center">
  <img src="frontend/public/screenshots/timeline.png" alt="Interactive Life Timeline" width="800"/>
  <br>
  <em>Interactive Life Timeline: Explore your alternate life year by year with live metrics.</em>
</p>

<p align="center">
  <img src="frontend/public/screenshots/comparison.png" alt="Scenario Comparison" width="800"/>
  <br>
  <em>Scenario Comparison: Overlay and compare multiple life paths and their happiness evolution.</em>
</p>

<p align="center">
  <img src="frontend/public/screenshots/metrics.png" alt="Life Metrics Analysis" width="800"/>
  <br>
  <em>Life Metrics Analysis: Dive deep into happiness, income, quality of life, and more with radar charts.</em>
</p>

<p align="center">
  <img src="frontend/public/screenshots/branch.png" alt="Branch New Scenario" width="800"/>
  <br>
  <em>Branch New Scenario: Explore new life paths by branching from any decision point.</em>
</p>

<p align="center">
  <img src="frontend/public/screenshots/story.png" alt="Life Story Chapters" width="800"/>
  <br>
  <em>Life Story Chapters: Read immersive, AI-generated narratives for each phase of your alternate life.</em>
</p>

---

## ✨ Key Features

### 🎭 **Interactive Life Simulation**
- **Multi-Path Exploration**: Create and explore unlimited alternate life scenarios
- **Contextual Decision Making**: Each choice builds upon your previous life experiences
- **Realistic Outcomes**: AI-generated scenarios based on real-world data and statistics
- **Progressive Storytelling**: Watch your life unfold through detailed chapter-based narratives

### 🤖 **Advanced AI Integration**
- **Google Gemini AI**: Powers intelligent narrative generation and scenario creation
- **Dynamic Storytelling**: Personalized stories that adapt to your unique choices
- **Contextual Awareness**: AI remembers your history and creates coherent life progressions
- **Multi-Chapter Narratives**: Rich, detailed stories spanning years of your alternate life

### 📊 **Comprehensive Analytics**
- **Life Metrics Tracking**: Monitor happiness, income, quality of life, health, and more
- **Interactive Timeline**: Scrub through 20 years of your alternate life with live metric updates
- **Scenario Comparison**: Overlay multiple life paths to see how different choices diverge
- **Real-Time Visualization**: Beautiful charts with gradients, animations, and interactive elements

### 🌍 **Real-World Data Integration**
- **Global City Database**: 1000+ cities with quality of life, cost of living, and climate data
- **Career Intelligence**: Comprehensive occupation data with salary ranges and satisfaction metrics
- **Weather & Climate**: Real climate data integration for location-based decisions
- **Visual Content**: High-quality imagery from Unsplash for immersive storytelling

### 🎨 **Premium User Experience**
- **Multiple View Modes**: Split view, tree visualization, story reader, metrics dashboard, timeline, and comparison
- **Interactive Tree Visualization**: Zoom, pan, and navigate through your decision tree with D3.js
- **PDF Export**: Generate beautiful PDFs of your complete life story with all chapters
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations and transitions

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

## 🎯 Advanced Features Deep Dive

### 🌳 **Interactive Decision Tree**
- **Visual Navigation**: D3.js-powered tree with zoom, pan, and reset controls
- **Node Intelligence**: Color-coded happiness levels, metric indicators, and status tracking
- **Smart Branching**: Each decision creates new paths while maintaining narrative coherence
- **Legend System**: Clear visual indicators for happiness levels, impact types, and life metrics

### ⏱️ **Interactive Timeline Experience**
- **20-Year Journey**: Scrub through your alternate life year by year
- **Live Metric Updates**: Watch happiness, income, and quality of life evolve in real-time
- **Dynamic Storytelling**: Unique narrative snippets for each year of your journey
- **Auto-Play Mode**: Sit back and watch your life unfold with smooth animations
- **Celebration Moments**: Special animations when reaching major life milestones

### 📈 **Advanced Scenario Comparison**
- **Multi-Path Overlay**: Compare up to multiple life scenarios simultaneously
- **Divergence Analysis**: See exactly where and how different choices lead to different outcomes
- **Color-Coded Paths**: Each scenario gets its own visual identity for easy tracking
- **Interactive Charts**: Hover, zoom, and explore detailed metric differences
- **Professional Visualizations**: Gradients, glow effects, and smooth animations

### 🎨 **Premium Visual Design**
- **Modern UI Components**: Clean, accessible design with Radix UI primitives
- **Smooth Animations**: Framer Motion powers seamless transitions and interactions
- **Responsive Layout**: Perfect experience across all device sizes
- **Dark/Light Themes**: Comfortable viewing in any lighting condition
- **Professional Charts**: SVG-based visualizations with advanced styling

### 📄 **Comprehensive PDF Export**
- **Full Story Export**: Complete narratives with all chapters and highlights
- **Professional Formatting**: Multi-page layout with proper typography
- **Metric Summaries**: Key life statistics and milestone timelines
- **Automatic Pagination**: Handles long stories across multiple pages
- **Custom Styling**: Branded PDF design with consistent formatting

### 🔄 **Contextual AI Intelligence**
- **Memory System**: AI remembers your entire decision history
- **Realistic Progression**: Outcomes based on real career and location data
- **Adaptive Storytelling**: Narratives that evolve based on your unique path
- **Consequence Modeling**: Decisions have realistic long-term impacts on your life metrics

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
