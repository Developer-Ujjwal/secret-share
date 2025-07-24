# SecretShare - Secure One-Time Secret Sharing

A full-stack web application for sharing secrets securely with end-to-end encryption, one-time viewing, and self-destruct functionality.

## Features

- 🔐 **Client-side AES-256 encryption** using WebCrypto API
- 🔗 **One-time share links** with encryption key in URL fragment
- ⏰ **Self-destruct timer** (30 seconds after viewing)
- 📁 **File upload support** for any file type (text, images, videos, documents)
- 🐳 **Docker containerization** with Docker Compose
- 🎨 **Modern UI** with Next.js 14, Tailwind CSS, and shadcn/ui

## Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI with Python
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Containerization**: Docker & Docker Compose

## Security Features

- Client-side encryption ensures server never sees unencrypted data
- AES-256-GCM encryption with random IVs
- Encryption keys stored in URL fragments (never sent to server)
- One-time viewing with automatic data destruction

## Quick Start

1. **Clone and setup**:
   \`\`\`bash
   git clone <repository>
   cd secret-sharing-app
   cp .env.example .env
   \`\`\`

2. **Start with Docker Compose**:
   \`\`\`bash
   docker-compose up --build
   \`\`\`

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   
## Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Environment Variables

Copy `.env.example` to `.env` and configure:

\`\`\`env
# Database
POSTGRES_DB=secretdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
DATABASE_URL=postgresql://postgres:password@localhost:5432/secretdb


# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
\`\`\`

### Local Development

1. **Start infrastructure**:
   ```bash
   docker-compose up postgres
   ```\`\`\`

2. **Backend development**:
   \`\`\`bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   \`\`\`

3. **Frontend development**:
   \`\`\`bash
   cd frontend
   npm install
   npm run dev
   \`\`\`

## How It Works

### 1. Upload & Encrypt
- User enters message or uploads file
- Client generates random AES-256 key using WebCrypto API
- Data is encrypted client-side with random IV
- Encrypted payload sent to FastAPI backend
- Backend stores encrypted blob in PostgreSQL
- AES key included in share URL fragment

### 2. Share Link Generation
\`\`\`
https://myapp.com/view/[message_id]#[aes_key]
\`\`\`

### 3. Decrypt & View
- Recipient opens link
- Frontend fetches encrypted payload by ID
- Client decrypts using key from URL fragment
- Content displayed with 30-second self-destruct timer
- Backend marks as viewed and deletes data

### 4. One-Time Security
- After viewing, encrypted data is permanently deleted
- Subsequent access attempts return "Secret not found"
- Timer ensures content is destroyed after 30 seconds

## API Endpoints

- `POST /api/secrets` - Create encrypted secret
- `GET /api/secrets/{id}` - Retrieve and delete secret (one-time)

## Security Considerations

- All encryption happens client-side
- Server never has access to unencrypted data
- Encryption keys never stored in database
- One-time viewing prevents replay attacks
- Self-destruct timer limits exposure window

## File Support

Supports any file type:
- Text messages
- Images (JPEG, PNG, GIF, etc.)
- Videos (MP4, AVI, etc.)
- Documents (PDF, DOCX, etc.)
- Archives (ZIP, RAR, etc.)

## Production Deployment

1. Update environment variables for production
2. Use proper SSL/TLS certificates
4. Set up database backups
5. Monitor logs and metrics
6. Implement rate limiting

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file for details
