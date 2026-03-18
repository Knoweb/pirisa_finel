export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  response: {
    resultCode: number;
    resultDesc: string;
  };
  details: {
    Role: string;
    CMPNY_Id: number;
    username: string;
    token: string;
  };
}
