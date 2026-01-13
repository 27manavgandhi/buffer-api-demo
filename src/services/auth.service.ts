import { User, IUser, UserRole } from '../models/User.model';
import { ConflictError, UnauthorizedError } from '../utils/errors.util';
import { generateToken, JwtPayload } from '../utils/jwt.util';
import { logger } from '../utils/logger.util';

export interface RegisterDTO {
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
  };
  token: string;
}

export class AuthService {
  async register(data: RegisterDTO, requestId: string): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: data.email });

    if (existingUser) {
      logger.warn('Registration attempt with existing email', {
        requestId,
        email: data.email,
      });
      throw new ConflictError('Email already registered');
    }

    const user = await User.create({
      email: data.email,
      password: data.password,
      role: UserRole.USER,
    });

    const token = this.generateTokenForUser(user);

    logger.info('User registered successfully', {
      requestId,
      userId: user._id.toString(),
      email: user.email,
    });

    return this.buildAuthResponse(user, token);
  }

  async login(data: LoginDTO, requestId: string): Promise<AuthResponse> {
    const user = await User.findOne({ email: data.email }).select('+password');

    if (!user) {
      logger.warn('Login attempt with non-existent email', {
        requestId,
        email: data.email,
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(data.password);

    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', {
        requestId,
        userId: user._id.toString(),
      });
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = this.generateTokenForUser(user);

    logger.info('User logged in successfully', {
      requestId,
      userId: user._id.toString(),
      email: user.email,
    });

    return this.buildAuthResponse(user, token);
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  private generateTokenForUser(user: IUser): string {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return generateToken(payload);
  }

  private buildAuthResponse(user: IUser, token: string): AuthResponse {
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }
}

export const authService = new AuthService();