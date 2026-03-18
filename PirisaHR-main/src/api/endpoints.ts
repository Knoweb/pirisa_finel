export const ENDPOINTS = {
    AUTH: {
      LOGIN: '/login',
      FORGOT_PASSWORD: '/password/forgotPassword',
      REGISTER: '/api/company/register',
    },
    COMPANY: {
      GET_ALL: '/company/all',
      GET_BY_ID: '/company',
      UPDATE: '/company',
      DELETE: '/company',
    },
    EMPLOYEE: {
      GET_ALL: '/employee/all',
      GET_BY_ID: '/employee/emp',
      CREATE: '/employee/add_employee',
      UPDATE: '/employee',
      DELETE: '/employee',
      GET_BY_COMPANY: '/employee/company',
    },
    USER: {
      GET_PROFILE: '/user/profile',
      UPDATE_PROFILE: '/user/update',
    },
  } as const;
