import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { ERROR_MESSAGE } from "../constants/erroMessages";
import { STATUS_CODE } from "../constants/statusCode";

const secret = process.env.JWT_SECRET ?? "default_secret";

interface IPayload {
  idUser: string;
}

export const genToken = (payload: IPayload, expiresIn: string = "1h"): string => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

export const verifyToken = (token: string): IPayload => {
  try {
    return jwt.verify(token, secret) as IPayload;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new AppError("Token expirado", STATUS_CODE.UNAUTHORIZED);
    }
    if (error instanceof JsonWebTokenError) {
      throw new AppError(ERROR_MESSAGE.INVALID_TOKEN, STATUS_CODE.UNAUTHORIZED);
    }
    throw new AppError(ERROR_MESSAGE.INVALID_TOKEN, STATUS_CODE.UNAUTHORIZED);
  }
};
