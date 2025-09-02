# Lucid Assignment - Email Analytics Dashboard
## Description
The Lucid Assignment is a comprehensive email analytics and monitoring application that automatically fetches, analyzes, and visualizes email data. 
The system connects to Gmail via IMAP to monitor incoming emails with specific subjects, analyzes their metadata including Email Service Provider (ESP) information and routing chains, and presents this data through an intuitive web dashboard. The application provides real-time email monitoring, detailed analytics, and comprehensive email management capabilities.

## Flow
### Server-Side Flow:
1.  **IMAP Connection**: Establishes secure connection to Gmail using IMAP protocol
2.  **Email Monitoring**: Continuously monitors inbox for unread emails with subject "EMAIL_ANALYSIS_TEST" using scheduled cron jobs (every 30 seconds)
- **Email Processing**: When new emails are detected:
    - Parses email headers and metadata using mailparser
    - Extracts receiving chain information from email headers
    - Identifies ESP (Email Service Provider) from sender domain
    - Stores processed data in MongoDB database
3. **Data Management**: Maintains email records with detailed metadata including timestamps, routing information, and ESP analytics

### Client-Side Flow:
1. **Dashboard Landing** Users are greeted with a comprehensive dashboard showing email statistics and recent activity
2. **Real-time Updates**: Frontend polls the server every 30 seconds for new email data
3. **Navigation**: Users can switch between four main views:
4. **Dashboard**: Overview with statistics cards, recent emails, and ESP analytics charts
5. **Email List**: Detailed list of all processed emails with selection capability
6. **Email Details**: In-depth view of individual email metadata and routing information
7. **Analytics**: Visual charts and graphs showing ESP distribution and email trends
8. **Settings**: Configuration options for the application
9. **Interactive Components**: Users can click on emails to view detailed information, analyze routing chains, and explore ESP analytics

### Tech Stack

#### Server
- **Framework**: NestJS - A progressive Node.js framework for scalable server-side applications
- **Language**: TypeScript - Type-safe JavaScript development
- **Database**: MongoDB with Mongoose ODM for flexible document storage
- **Email Processing**:
    - IMAP library for Gmail connection and email fetching
    - Mailparser for parsing email content and headers
- **Scheduling**: @nestjs/schedule for automated cron jobs
- **Environment Management**: Dotenv for configuration management
- **Testing**: Jest framework for unit and e2e testing
- **Code Quality**: ESLint and Prettier for code formatting and linting

#### Client
- **Framework**: React 19 - Modern JavaScript library for building user interfaces
- **Language**: TypeScript - Enhanced JavaScript with static typing
- **Build Tool**: Vite - Fast build tool and development server
- **Styling**: Tailwind CSS 4.1 - Utility-first CSS framework for rapid UI development
- **State Management**: React hooks (useState, useEffect) for local component state

