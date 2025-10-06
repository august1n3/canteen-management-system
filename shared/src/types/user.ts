export enum UserRole {
  STUDENT = 'student',
  CANTEEN_STAFF = 'canteen_staff',
  ADMIN = 'admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  studentId?: string; // Only for students
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentProfile extends User {
  role: UserRole.STUDENT;
  studentId: string;
  yearOfStudy?: number;
  department?: string;
}

export interface StaffProfile extends User {
  role: UserRole.CANTEEN_STAFF | UserRole.ADMIN;
  staffId: string;
  department: string;
  permissions: string[];
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  studentId?: string;
  phoneNumber?: string;
}