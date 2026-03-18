# Pirisa HRM Backend Documentation

## Overview

The Pirisa HRM backend is a comprehensive Spring Boot application built with Java 11 that provides RESTful APIs for human resource management functionalities. The system includes employee management, attendance tracking, payroll processing, leave management, and company administration features.

## Technology Stack

- **Framework**: Spring Boot 2.7.17
- **Java Version**: 11
- **Database**: MySQL/MariaDB
- **ORM**: Spring Data JPA
- **Security**: Spring Security with JWT Authentication
- **Build Tool**: Maven
- **Packaging**: WAR

## Project Structure

```
HRM-main/
├── src/main/java/com/knoweb/HRM/
│   ├── HrmApplication.java          # Main application entry point
│   ├── ServletInitializer.java      # Servlet configuration
│   ├── config/                      # Configuration classes
│   ├── controller/                  # REST API controllers
│   ├── dto/                         # Data Transfer Objects
│   ├── model/                       # Entity models
│   ├── repository/                  # JPA repositories
│   ├── service/                     # Business logic services
│   ├── util/                        # Utility classes
│   └── utility/                     # Additional utilities
└── src/main/resources/              # Application resources
```

## Core Features & Modules

### 1. Authentication & Security
- **JWT-based authentication** with token generation and validation
- **Password encoding** using BCrypt
- **CORS configuration** for frontend integration
- **Role-based access control**

**Key Controllers:**
- `LoginController` - User authentication and login
- `UserController` - User management operations
- `PasswordController` - Password reset functionality

### 2. Employee Management
- Complete employee lifecycle management
- Employee registration, updates, and profile management
- Employee document management
- Profile image handling

**Key Controllers:**
- `EmployeeController` - Comprehensive employee operations
- `DocumentController` - Employee document management
- `ProfileImageController` - Profile image handling

### 3. Attendance Management
- Attendance tracking and marking
- Additional attendance management
- Attendance reports and analytics

**Key Controllers:**
- `AttendanceController` - Primary attendance operations
- `Additional_attendanceController` - Additional attendance tracking

### 4. Payroll Management
- Salary calculation and processing
- Allowance and bonus management
- Payroll reports and payslips
- Tax calculations

**Key Controllers:**
- `PayroleController` - Payroll processing
- `AllowanceController` - Allowance management
- `BonusController` - Bonus management

### 5. Leave Management
- Leave request processing
- Company leave policy management
- Leave balance tracking

**Key Controllers:**
- `CompanyLeaveController` - Leave policy management
- `EmployeeLeaveRequestController` - Leave request processing

### 6. Company Administration
- Company profile management
- Department and designation management
- Company logo handling
- Company settings and configurations

**Key Controllers:**
- `CompanyController` - Company operations
- `DepartmentController` - Department management
- `DesignationController` - Designation management
- `CompanyLogoController` - Logo management

### 7. Payment Integration
- Stripe payment integration
- Webhook handling for payment events
- Subscription management

**Key Controllers:**
- `StripeWebhookController` - Stripe webhook processing
- `CompanyRegistrationController` - Payment-based registration

## Database Schema

### Core Entities

#### User Management
- **User** - System users with authentication details
- **UserRole** - User role definitions

#### Company Structure
- **Company** - Company information and settings
- **Department** - Organizational departments
- **Designation** - Job designations/titles

#### Employee Data
- **Employee** - Employee master data
- **Documents** - Employee document storage
- **CompanyLogoes** - Company logo storage

#### Attendance & Time
- **Attendance** - Daily attendance records
- **Additional_attendance** - Additional attendance data
- **CompanyOTDetails** - Overtime configuration

#### Payroll
- **Payrole** - Payroll records
- **Allowance** - Allowance configurations
- **Bonus** - Bonus configurations

#### Leave Management
- **EmployeeLeave** - Leave requests
- **CompanyLeave** - Leave policies

#### Performance
- **Questions** - Performance evaluation questions

## API Endpoints

### Authentication Endpoints
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/forgot-password` - Password reset request

### Employee Endpoints
- `GET /api/employee/all` - Get all employees
- `POST /api/employee/create` - Create new employee
- `PUT /api/employee/update/{id}` - Update employee
- `DELETE /api/employee/delete/{id}` - Delete employee

### Attendance Endpoints
- `GET /api/attendance/all` - Get attendance records
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/employee/{id}` - Get employee attendance

### Payroll Endpoints
- `GET /api/payrole/all` - Get payroll records
- `POST /api/payrole/create` - Create payroll
- `GET /api/payrole/employee/{id}` - Get employee payroll

## Security Configuration

### JWT Authentication
- Token-based authentication
- Token expiration handling
- Refresh token support

### CORS Configuration
- Configured for frontend integration
- Supports multiple origins (localhost:3000, 5173, 5174)
- Allowed methods: GET, POST, PUT, DELETE, OPTIONS

## Dependencies

### Core Spring Dependencies
- Spring Boot Starter Web
- Spring Boot Starter Data JPA
- Spring Boot Starter Security
- Spring Boot Starter Validation

### Database
- MySQL Connector/J
- MariaDB Java Client

### Additional Libraries
- Lombok for boilerplate code reduction
- JWT (jjwt) for token handling
- Spring Boot Starter Mail for email functionality
- Stripe Java SDK for payment processing
- Commons IO and Codec for file operations

## Configuration

### Application Properties
- Database connection settings
- JWT secret and expiration
- Email configuration
- Stripe API keys
- File upload configurations

### Security Configuration
- Password encoder bean
- JWT authentication filter
- CORS mapping configuration

## Development Setup

### Prerequisites
- Java 11 or higher
- Maven 3.6+
- MySQL/MariaDB database
- IDE (IntelliJ IDEA recommended)

### Database Setup
1. Create database `pirisahrm`
2. Update database credentials in `application.properties`
3. Run the application - tables will be auto-created

### Running the Application
```bash
# Using Maven Wrapper
./mvnw spring-boot:run

# Using Maven
mvn spring-boot:run

# Build WAR file
mvn clean package
```

### Default Configuration
- Server Port: 8080
- Context Path: /
- Database URL: jdbc:mysql://localhost:3306/pirisahrm

## API Testing

### Using Postman
1. Import API collection
2. Set base URL: `http://localhost:8080/api`
3. Authenticate first to get JWT token
4. Include token in Authorization header for protected endpoints

### Sample Requests
```bash
# Login
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get Employees (with token)
curl -X GET http://localhost:8080/api/employee/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

### Global Exception Handler
- Centralized error handling
- Consistent error response format
- Validation error handling
- Custom exception handling

### Common Error Codes
- 400: Bad Request (Validation errors)
- 401: Unauthorized (Authentication required)
- 403: Forbidden (Insufficient permissions)
- 404: Not Found (Resource not found)
- 500: Internal Server Error

## Logging & Monitoring

### Application Logging
- Logback configuration
- Different log levels for development/production
- Request/response logging for debugging

### Performance Monitoring
- Spring Boot Actuator endpoints
- Health checks
- Metrics collection

## Deployment

### Production Deployment
- WAR file deployment
- Environment-specific configurations
- Database migration scripts
- Security hardening

### Docker Support
- Dockerfile configuration
- Docker Compose setup
- Container orchestration

## Integration Points

### Frontend Integration
- RESTful API design
- JWT token-based authentication
- CORS configuration for cross-origin requests

### Third-party Integrations
- Stripe payment processing
- Email service integration
- File storage services

## Security Best Practices

1. **Password Security**: BCrypt encryption for passwords
2. **Token Security**: JWT tokens with expiration
3. **Input Validation**: Comprehensive validation on all inputs
4. **SQL Injection Prevention**: JPA parameterized queries
5. **CORS Configuration**: Restricted cross-origin access
6. **Sensitive Data**: Environment variables for secrets

## Troubleshooting

### Common Issues
1. **Database Connection**: Check database URL and credentials
2. **JWT Token Issues**: Verify token generation and validation
3. **CORS Errors**: Check frontend URL configuration
4. **File Upload Issues**: Verify file size and type restrictions

### Debug Mode
Enable debug logging in `application.properties`:
```properties
logging.level.com.knoweb.HRM=DEBUG
```

## Future Enhancements

### Planned Features
- Multi-tenant support
- Advanced reporting and analytics
- Mobile API optimization
- Enhanced security features
- Performance optimization

### Scalability Considerations
- Database optimization
- Caching strategies
- Load balancing
- Microservices architecture migration
