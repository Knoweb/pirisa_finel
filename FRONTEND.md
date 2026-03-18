# Pirisa HRM Frontend Documentation

## Overview

The Pirisa HRM frontend is a modern React-based web application built with TypeScript, Vite, and Tailwind CSS. It provides a comprehensive user interface for human resource management, including employee management, attendance tracking, payroll processing, leave management, and company administration features.

## Technology Stack

- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.0.5
- **Styling**: Tailwind CSS 4.0.0
- **Routing**: React Router DOM 7.1.3
- **State Management**: React Context API
- **HTTP Client**: Axios 1.7.9
- **UI Components**: Custom components with Lucide React icons
- **Charts**: Recharts 2.15.1
- **Forms**: React Select 5.10.1
- **Notifications**: React Toastify 11.0.5
- **Payment**: Stripe React 5.6.0
- **PDF Generation**: jsPDF 2.5.1 with AutoTable
- **Date Handling**: date-fns 4.1.0

## Project Structure

```
PirisaHR-main/
├── public/                     # Static assets
├── src/
│   ├── api/                    # API layer
│   │   ├── config/            # API configuration
│   │   ├── endpoints.ts       # API endpoints
│   │   ├── services/          # API services
│   │   └── types/             # API type definitions
│   ├── components/             # Reusable components
│   │   ├── Attendance/        # Attendance components
│   │   ├── CompanyProfile/    # Company profile components
│   │   ├── Leave/             # Leave management components
│   │   ├── PayRole/           # Payroll components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/            # Layout components
│   │   ├── table/             # Table components
│   │   └── ...
│   ├── context/               # React contexts
│   │   ├── LanguageProvider.tsx
│   │   └── ...
│   ├── pages/                  # Page components
│   │   ├── Attendance/        # Attendance pages
│   │   ├── Employee/          # Employee pages
│   │   ├── EmployeeManagement/ # Employee management pages
│   │   ├── PayRole/           # Payroll pages
│   │   ├── Leave/             # Leave pages
│   │   ├── PerformanceAppraisal/ # Performance pages
│   │   ├── Report/            # Report pages
│   │   ├── Login.tsx          # Login page
│   │   ├── RegisterPage.tsx   # Registration page
│   │   └── ...
│   ├── service/               # Business logic services
│   ├── utils/                 # Utility functions
│   ├── types.ts               # Global type definitions
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Application entry point
├── package.json               # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── tailwind.config.js        # Tailwind CSS configuration
```

## Core Features & Modules

### 1. Authentication & Authorization
- User login and registration
- JWT token-based authentication
- Protected routes with role-based access
- Password reset functionality
- Session management

**Key Components:**
- `Login.tsx` - Login page with form validation
- `RegisterPage.tsx` - User registration with company creation
- `ProtectedRoute.tsx` - Route protection wrapper

### 2. Dashboard & Analytics
- Company dashboard with key metrics
- Employee-specific dashboard
- Real-time statistics and charts
- Performance indicators
- Quick action panels

**Key Components:**
- `DashboardPage.tsx` - Main company dashboard
- `EmployeeDashboard.tsx` - Employee-specific dashboard
- `StatisticItem.tsx` - Reusable statistic display component

### 3. Employee Management
- Complete employee CRUD operations
- Employee profile management
- Document upload and management
- Profile image handling
- Employee search and filtering

**Key Components:**
- `AllEmployeePage.tsx` - Employee listing with search/filter
- `NewEmployeePage.tsx` - Employee creation form
- `EmployeeUpdate.tsx` - Employee update form
- `ProfileImageUpload.tsx` - Profile image management

### 4. Attendance Management
- Attendance marking and tracking
- Attendance history and reports
- Bulk attendance operations
- Attendance analytics
- Calendar view

**Key Components:**
- `AttendanceContent.tsx` - Attendance listing and management
- `AttendanceMark.tsx` - Attendance marking interface

### 5. Payroll Management
- Salary calculation and processing
- Payslip generation (PDF)
- Allowance and bonus management
- Payroll reports and analytics
- Tax calculations

**Key Components:**
- `SalaryStatus.tsx` - Salary status overview
- `SalaryMakePage.tsx` - Salary creation interface
- `PayslipList.tsx` - Payslip management
- `PayroleList.tsx` - Employee payroll view

### 6. Leave Management
- Leave request submission
- Leave approval workflow
- Leave balance tracking
- Leave policy management
- Leave calendar and reports

**Key Components:**
- `expoLeaveRequest.tsx` - Leave request interface
- `EmployeeLeave.tsx` - Employee leave management

### 7. Performance Management
- Employee evaluation forms
- Performance appraisal system
- Question-based evaluations
- Performance reports
- Goal tracking

**Key Components:**
- `EmployeeEvaluationForm.tsx` - Evaluation form
- `NewEvaluationForm.tsx` - New evaluation creation

### 8. Company Administration
- Company profile management
- Department and designation management
- Company settings and configurations
- Logo and branding management
- System configurations

**Key Components:**
- `CompanyProfile.tsx` - Company profile management
- `CompanySettings.tsx` - System settings
- `DepartmentManager.tsx` - Department management

### 9. Reporting & Analytics
- Payroll reports
- Attendance reports
- Employee performance reports
- Export functionality (Excel, PDF)
- Custom report generation

**Key Components:**
- `PayroleReportPage.tsx` - Payroll reporting interface
- Various chart components using Recharts

## Architecture & Design Patterns

### Component Architecture
- **Atomic Design**: Components organized by complexity and reusability
- **Container-Presenter Pattern**: Separation of logic and presentation
- **Higher-Order Components**: For cross-cutting concerns like authentication
- **Custom Hooks**: For reusable stateful logic

### State Management
- **React Context**: For global state (language, authentication)
- **Local State**: useState and useReducer for component state
- **Server State**: Axios with custom hooks for API state management

### Routing Structure
```typescript
/                           -> Redirect to /dashboard
/login                      -> Login page
/register                   -> Registration page
/dashboard                  -> Company dashboard
/employee-dashboard         -> Employee dashboard
/employee/*                 -> Employee management routes
/attendance/*              -> Attendance management routes
/payrole/*                 -> Payroll management routes
/leave/*                   -> Leave management routes
/reports/*                 -> Reporting routes
/performance/*             -> Performance management routes
/companyProfile            -> Company profile
/company-settings          -> Company settings
```

## API Integration

### API Configuration
- **Base URL**: Configured in API config
- **Axios Interceptors**: For request/response handling
- **Error Handling**: Centralized error management
- **Token Management**: Automatic token injection

### API Endpoints Structure
```typescript
AUTH: {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/password/forgotPassword',
  REGISTER: '/api/company/register',
}
COMPANY: {
  GET_ALL: '/company/all',
  GET_BY_ID: '/company',
  UPDATE: '/company',
  DELETE: '/company',
}
EMPLOYEE: {
  GET_ALL: '/employee/all',
  GET_BY_ID: '/employee/emp',
  CREATE: '/employee/add_employee',
  UPDATE: '/employee',
  DELETE: '/employee',
  GET_BY_COMPANY: '/employee/company',
}
```

## UI/UX Features

### Design System
- **Tailwind CSS**: Utility-first CSS framework
- **Consistent Theming**: Centralized color and spacing system
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliance considerations

### Interactive Components
- **Search & Filter**: Real-time search with debouncing
- **Data Tables**: Sortable, paginated tables
- **Forms**: Multi-step forms with validation
- **Modals**: Reusable modal components
- **Tooltips**: Contextual help and information

### User Experience
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: User-friendly error messages
- **Success Notifications**: Toast notifications for actions
- **Progress Indicators**: For multi-step processes

## Key Components Deep Dive

### Layout System
- `MainLayout.tsx` - Main application layout with sidebar
- `Header.tsx` - Top navigation with user menu
- `Sidebar.tsx` - Navigation sidebar with role-based menu
- `Footer.tsx` - Application footer

### Form Components
- `FormInput.tsx` - Reusable input with validation
- `FormSelect.tsx` - Select dropdown with search
- `FormDatePicker.tsx` - Date picker integration
- `FormFileUpload.tsx` - File upload with preview

### Table Components
- `DataTable.tsx` - Generic data table with sorting/pagination
- `TableActions.tsx` - Row action buttons
- `TableFilters.tsx` - Column filtering
- `TableExport.tsx` - Export functionality

### Chart Components
- `BarChart.tsx` - Bar chart wrapper
- `LineChart.tsx` - Line chart wrapper
- `PieChart.tsx` - Pie chart wrapper
- `MetricCard.tsx` - Metric display with trend

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd PirisaHR-main

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Scripts
```bash
npm run dev      # Start development server (port 5174)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Environment Configuration
Create `.env` file in root:
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## Build & Deployment

### Production Build
```bash
npm run build
```
Creates optimized build in `dist/` folder.

### Deployment Options
- **Static Hosting**: Deploy `dist/` to any static host
- **Docker**: Use nginx or similar web server
- **Cloud Platforms**: Vercel, Netlify, AWS S3

### Performance Optimizations
- **Code Splitting**: Automatic with Vite
- **Tree Shaking**: Dead code elimination
- **Asset Optimization**: Image and font optimization
- **Lazy Loading**: Component and route-based lazy loading

## Testing

### Testing Setup
- **Unit Testing**: Jest with React Testing Library
- **Integration Testing**: Component interaction testing
- **E2E Testing**: Cypress or Playwright setup

### Test Structure
```
src/
├── __tests__/           # Test files
├── components/          # Component tests
├── pages/              # Page tests
└── utils/              # Utility tests
```

## Internationalization

### Multi-language Support
- **Context Provider**: LanguageProvider for language state
- **Translation Files**: JSON-based translation files
- **Language Switcher**: Dynamic language switching
- **RTL Support**: Right-to-left language support

### Supported Languages
- English (default)
- Additional languages configured as needed

## Security Features

### Client-Side Security
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: Token-based protection
- **Secure Storage**: HttpOnly cookies for tokens
- **Content Security Policy**: CSP headers

### Authentication Security
- **JWT Token**: Secure token handling
- **Token Refresh**: Automatic token renewal
- **Logout Handling**: Secure token cleanup
- **Route Protection**: Authentication guards

## Performance Monitoring

### Performance Metrics
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Bundle Analysis**: Webpack Bundle Analyzer
- **Runtime Performance**: React DevTools Profiler
- **Network Performance**: API response time tracking

### Optimization Techniques
- **Memoization**: React.memo and useMemo
- **Virtual Scrolling**: For large data sets
- **Image Optimization**: Lazy loading and compression
- **Caching**: API response caching

## Troubleshooting

### Common Issues
1. **Build Errors**: Check TypeScript configuration
2. **API Connection**: Verify backend URL and CORS
3. **Routing Issues**: Check route definitions
4. **State Management**: Debug with React DevTools

### Debug Tools
- **React DevTools**: Component inspection
- **Network Tab**: API request debugging
- **Console Logging**: Strategic logging
- **Error Boundaries**: Graceful error handling

## Future Enhancements

### Planned Features
- **Progressive Web App (PWA)**: Offline support
- **Real-time Updates**: WebSocket integration
- **Advanced Analytics**: Custom dashboard builder
- **Mobile App**: React Native version
- **AI Integration**: Smart recommendations

### Technical Improvements
- **Micro-frontend Architecture**: Module federation
- **State Management**: Redux Toolkit or Zustand
- **Testing**: Comprehensive test coverage
- **Performance**: Advanced optimization techniques

## Best Practices

### Code Quality
- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### Development Workflow
- **Git Flow**: Feature branch workflow
- **Code Reviews**: Pull request process
- **CI/CD**: Automated testing and deployment
- **Documentation**: Comprehensive code documentation

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills
- **Core-js**: JavaScript polyfills
- **whatwg-fetch**: Fetch API polyfill
- **intersection-observer**: Intersection Observer polyfill
