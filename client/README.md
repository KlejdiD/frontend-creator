// README.md

# Frontend SEO Analyzer

AI-powered frontend SEO code analyzer built with React and Node.js.

## Features

- **Code Analysis**: Analyze HTML, CSS, and JavaScript for SEO optimization
- **AI-Powered Suggestions**: Get intelligent recommendations from OpenAI GPT
- **Auto-Fix**: Automatically fix common SEO issues
- **Lighthouse Integration**: Run performance and SEO audits
- **Framework Support**: Special analysis for React, Vue, and Angular

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Environment Configuration

Copy the `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key

### 3. Run the Application

```bash
# Development mode (runs both server and client)
npm run dev

# Or run separately:
npm run server  # Backend on port 5000
npm run client  # Frontend on port 5173
```

### 4. Build for Production

```bash
npm run build
npm start
```

## API Endpoints

- `POST /api/analyze` - Analyze code for SEO
- `POST /api/analyze/fix` - Auto-fix code issues
- `POST /api/analyze/recommendations` - Get recommendations
- `POST /api/lighthouse/analyze` - Run Lighthouse analysis
- `POST /api/lighthouse/seo` - Get SEO-specific Lighthouse results

## Project Structure

```
frontend-seo-analyzer/
├── server/              # Backend Express server
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   └── app.js          # Main server file
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API services
│   │   └── App.jsx     # Main App component
│   └── package.json
├── .env                # Environment variables
└── package.json        # Root package.json
```

## Technologies Used

- **Frontend**: React, Vite, CodeMirror, Lucide React
- **Backend**: Node.js, Express, OpenAI API
- **Analysis**: Lighthouse, JSDOM
- **Styling**: CSS3 with custom components

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

// .gitignore

# Dependencies

node_modules/
client/node_modules/

# Environment variables

.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs

client/dist/
client/build/
dist/
build/

# Logs

npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log\*

# OS generated files

.DS*Store
.DS_Store?
.*\*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE

.vscode/
.idea/
_.swp
_.swo

# Temporary files

_.tmp
_.temp

# Cache

.eslintcache
.cache/
