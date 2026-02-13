# 🏃‍♂️ FitTrack

**A comprehensive fitness tracking application for managing workouts, diet, and health analytics.** Built with React and Node.js, featuring dual database support (MongoDB & MySQL) and integration with external fitness APIs.

> **Note:** The entire interface is in Polish.

<table>
  <td><img src="https://github.com/user-attachments/assets/c5a4204a-c404-4aee-9ee2-e0cdf78a51fd"/></td>
</table>

## ✨ Features

### 💪 Workout Management
- Create personalized workout plans
- Organize exercises by day of the week
- Search exercises via **ExerciseDB API** or add custom ones
- Detailed exercise tracking: sets, reps, weight, and rest time
- Visual exercise demonstrations with images

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/97f45ae0-1ac0-4a0c-9cb9-2722cff3d7e0" /></td>
    <td><img src="https://github.com/user-attachments/assets/ed0f9b93-a9ae-4290-bb0f-4a7c632702c7" /></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/6f9cc8a0-1b6d-4039-8ace-fdbf67279395" /></td>
    <td><img src="https://github.com/user-attachments/assets/28f47f86-1d56-46f9-bee5-4bb19556b32a" /></td>
  </tr>
</table>

### 🥗 Diet Planning
- Create customized meal plans
- Organize meals by day
- Search recipes via **Spoonacular API** or add custom meals
- Detailed macronutrient tracking: proteins, carbs, fats, and calories
- Complete nutritional information for each meal

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/5c0a4d97-0db7-4046-a0ab-8f127eb634f1" /></td>
    <td><img src="https://github.com/user-attachments/assets/7a93cdb7-3204-425b-9b49-884091cc2a3b" /></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/5e317ab9-77e6-4133-8fc2-190316b05d01" /></td>
    <td><img src="https://github.com/user-attachments/assets/f8e47066-c60b-4c97-986c-507d11cac889" /></td>
  </tr>
</table>

### 📊 Progress Tracking
- Track body weight over time
- Monitor workout duration
- Visualize progress with interactive charts
- Dashboard with key fitness metrics
- Historical data analysis

<table>
  <tr>
  <td><img src="https://github.com/user-attachments/assets/ebf549ac-1d0c-471f-a8fc-02db2d9ea257"/></td>
  <td><img src="https://github.com/user-attachments/assets/42b19371-fc61-4798-a456-08054764c3a9"/></td>
  </tr>
</table>


### 🔬 Health Analytics
- Integrate data from **WHO** and **World Bank** APIs
- Analyze correlations between health and socioeconomic indicators
- Interactive visualizations with country and time period selection
- **Analysis types:**
  - Obesity vs healthcare expenditure
  - GDP per capita vs physical activity
  - Mortality probability vs urbanization
  - Diabetes vs income inequality

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/6e8fc5c1-b2c7-4048-8e35-c5f7a77bf387" /></td>
    <td><img src="https://github.com/user-attachments/assets/b47b1bf5-0554-4826-bb99-de12901389ea" /></td>
  </tr>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/f43749ee-f6aa-47a2-a6fd-ce06a7af4a47" /></td>
    <td><img src="https://github.com/user-attachments/assets/439245a2-5772-494f-a653-5ef7a81b5b65" /></td>
  </tr>
</table>

### 👤 User Management
- Secure authentication system
- Profile management
- Password change functionality
- Account deletion with data cleanup

<table>
  <td><img src="https://github.com/user-attachments/assets/4a94bb6f-8379-4555-a2a4-afb22d3df41a"/></td>
</table>

### 💾 Import/Export
- Support for **JSON**, **XML**, and **YAML** formats
- Export workout and diet plans
- Import/export health analytics
- Data portability and backup

## 🛠️ Technologies

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Bootstrap** - Styling

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Databases
- **MongoDB** - NoSQL database for flexible data
- **MySQL** - Relational database for structured data
- **Dual database support** - Use one or both simultaneously

### External APIs
- **ExerciseDB** (RapidAPI) - Exercise database
- **Spoonacular** (RapidAPI) - Recipe and nutrition data
- **WHO API** - Health indicators
- **World Bank API** - Economic indicators

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 🚀 Getting Started

### Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- 4GB RAM (recommended)
- Disk space: ~5GB (with both databases) or ~3.8GB (single database)

**OR** (for non-Docker setup):

- Node.js 18.x+
- MongoDB 4.4+ and/or MySQL 8.0+
- npm 8.x+

### 🐳 Running with Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/r1ckshot/FitTrack.git
   cd FitTrack
   ```

2. **Configure database selection**
   
   Edit `backend/.env`:
   ```env
   # Options: mongo, mysql, both
   DATABASE_TYPE=both
   ```

3. **Build and run with Docker Compose**
   
   ```bash
   # With both databases
   docker-compose --profile all build
   docker-compose --profile all up -d
   
   # With MongoDB only
   docker-compose --profile mongo build
   docker-compose --profile mongo up -d
   
   # With MySQL only
   docker-compose --profile mysql build
   docker-compose --profile mysql up -d
   ```

4. **Access the application**
   - Frontend: `http://localhost:3000`
   - API: `http://localhost:8080`
   - API Documentation: `http://localhost:8080/public/api-docs.html`

### ⚙️ Running without Docker

#### Backend Setup

1. **Navigate to backend**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   
   Edit `backend/.env`:
   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/fittrack
   
   # MySQL
   MYSQL_HOST=localhost
   MYSQL_DATABASE=fittrack
   MYSQL_USER=fituser
   MYSQL_PASSWORD=fitpassword
   
   # Database selection
   DATABASE_TYPE=both
   ```

3. **Set up MySQL** (if using)
   ```sql
   CREATE DATABASE fittrack;
   CREATE USER 'fituser'@'localhost' IDENTIFIED BY 'fitpassword';
   GRANT ALL PRIVILEGES ON fittrack.* TO 'fituser'@'localhost';
   ```

4. **Start backend**
   ```bash
   npm start
   ```

#### Frontend Setup

1. **Navigate to frontend**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure API keys** (see section below)

3. **Start frontend**
   ```bash
   npm start
   ```

## 🔑 API Keys Configuration

To use all features, you need API keys from RapidAPI:

1. Register at [RapidAPI](https://rapidapi.com/)

### ExerciseDB API (for workout plans)

2. Subscribe to [ExerciseDB](https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb)
3. Edit `frontend/.env`:

   ```env
   REACT_APP_EXERCISEDB_API_KEY=your_api_key
   REACT_APP_EXERCISEDB_HOST=exercisedb.p.rapidapi.com
   ```

### Spoonacular API (for diet plans)

4. Subscribe to [Spoonacular](https://rapidapi.com/spoonacular/api/recipe-food-nutrition)
5. Edit `frontend/.env`:

   ```env
   REACT_APP_SPOONACULAR_API_KEY=your_api_key
   REACT_APP_SPOONACULAR_HOST=spoonacular-recipe-food-nutrition-v1.p.rapidapi.com
   ```

## 📚 What I Learned

This project represents the culmination of my full-stack development learning:

### Frontend Development
- React hooks and state management
- Component architecture and reusability
- API integration and error handling
- Data visualization with charts
- Responsive design principles
- User experience optimization

### Backend Development
- RESTful API design
- Authentication and authorization with JWT
- Database integration (both SQL and NoSQL)
- Multi-database architecture patterns
- API security best practices
- File parsing (JSON, XML, YAML)

### Database Management
- MongoDB schema design
- MySQL relational database design
- Dual database synchronization
- Data migration strategies
- Query optimization

### DevOps & Deployment
- Docker containerization
- Docker Compose orchestration
- Multi-stage builds
- Environment variable management
- Container networking

### External API Integration
- Third-party API consumption
- API key management
- Rate limiting handling
- Data transformation and mapping
- Error recovery strategies

## 📊 API Documentation

Complete API documentation with all 34 endpoints is available at:
```
http://localhost:8080/public/api-docs.html
```

<table>
  <td><img src="https://github.com/user-attachments/assets/2c36048e-47fe-442d-a060-1ac31e90d6e7"/></td>
</table>

The documentation includes:
- Detailed endpoint descriptions
- HTTP methods (GET, POST, PUT, DELETE)
- Organized by functional modules

## 👨‍💻 Author

**Mykhailo Kapustianyk**
- GitHub: [@r1ckshot](https://github.com/r1ckshot)
- Year: 2025
