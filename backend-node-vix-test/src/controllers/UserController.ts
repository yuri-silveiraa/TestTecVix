import { Request, Response } from "express";
import { UserModel } from "../models/UserModel";
import { userCreatedSchema, TUserCreated } from "../types/validations/User/createUser";
import { userUpdatedSchema, TUserUpdated } from "../types/validations/User/updateUser";
import { userQuerySchema } from "../types/validations/Queries/queryUserList";
import bcrypt from "bcrypt";
import { STATUS_CODE } from "../constants/statusCode";
import { ERROR_MESSAGE } from "../constants/erroMessages";
import { genToken } from "../utils/jwt";

const userModel = new UserModel();
const SALT_ROUNDS = 10;

export class UserController {

//------------- POST /users - Cria um novo usuário

  async create(req: Request, res: Response) {
    const parsed = userCreatedSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        error: ERROR_MESSAGE.INVALID_DATA,
        details: parsed.error.errors,
      });
    }

    const validatedData: TUserCreated = parsed.data;

    const existingEmail = await userModel.getByEmail(validatedData.email);
    if (existingEmail) {
      return res.status(STATUS_CODE.CONFLICT).json({ error: ERROR_MESSAGE.USER_EMAIL_ALREADY_EXISTS });
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

    const newUser = await userModel.create({
      ...validatedData,
      password: hashedPassword,
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(STATUS_CODE.CREATED).json(userWithoutPassword);
  }


//-------------- GET /users - Lista usuários com filtros/paginação

  async list(req: Request, res: Response) {
    const parsed = userQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        error: ERROR_MESSAGE.INVALID_DATA,
        details: parsed.error.errors,
      });
    }

    const query = parsed.data;

    const { totalCount, result: users } = await userModel.listAll(query);

    const usersWithoutPassword = users.map((user) => {
      const { password, ...rest } = user as any;
      return rest;
    });

    return res.json({
      total: totalCount,
      page: query.page ?? 0,
      limit: query.limit,
      data: usersWithoutPassword,
    });
  }

//-------------- GET /users/:idUser - Busca por ID

  async getById(req: Request, res: Response) {
    const { idUser } = req.params;

    const user = await userModel.getById(idUser.toString());

    if (!user) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ error: ERROR_MESSAGE.USER_NOT_FOUND });
    }

    const { password: _, ...userWithoutPassword } = user as any;

    return res.json(userWithoutPassword);
  }


//---------------- PUT /users/:idUser - Atualiza usuário

  async update(req: Request, res: Response) {
    const { idUser } = req.params;

    const parsed = userUpdatedSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        error: ERROR_MESSAGE.INVALID_DATA,
        details: parsed.error.errors,
      });
    }

    const validatedData: TUserUpdated = parsed.data;

    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, SALT_ROUNDS);
    }

    const updatedUser = await userModel.update(idUser.toString(), validatedData);

    if (!updatedUser) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ error: ERROR_MESSAGE.USER_NOT_FOUND });
    }

    const { password: _, ...userWithoutPassword } = updatedUser as any;

    return res.json(userWithoutPassword);
  }


//----------------- DELETE /users/:idUser - Soft delete

  async delete(req: Request, res: Response) {
    const { idUser } = req.params;

    const deletedUser = await userModel.delete(idUser.toString());

    if (!deletedUser) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ error: ERROR_MESSAGE.USER_NOT_FOUND });
    }

    return res.status(STATUS_CODE.NO_CONTENT).send();
  }

// ----------------- LOGIN /users/login - Autenticação de usuário

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const user = await userModel.getByEmail(email);
    if (!user) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: ERROR_MESSAGE.INVALID_CREDENTIALS });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({ error: ERROR_MESSAGE.INVALID_CREDENTIALS });
    }

    const { password: _, ...userWithoutPassword } = user as any;

    const token = genToken({ idUser: user.idUser }, "1d");
    await userModel.updateLastLogin(user.idUser);
    return res.status(STATUS_CODE.OK).json({ user: userWithoutPassword, token });
  }

  async generateToken(req: Request, res: Response) {
    const { idUser } = req.params;

    const user = await userModel.getById(idUser as string);
    if (!user) {
      return res.status(STATUS_CODE.NOT_FOUND).json({ error: ERROR_MESSAGE.USER_NOT_FOUND });
    }

    const token = genToken({ idUser: user.idUser }, "5d");
    return res.status(STATUS_CODE.OK).json({ token });
  }
}