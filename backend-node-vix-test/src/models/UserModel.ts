import { prisma } from "../database/client";
import { TUserCreated } from "../types/validations/User/createUser";
import { TUserUpdated } from "../types/validations/User/updateUser";   
import { TUserQuery } from "../types/validations/Queries/queryUserList";

export class UserModel {

// ----------- Busca usuário pelo ID (sem expor senha)

  async getById(idUser: string) {
    return prisma.user.findUnique({
      where: { idUser },
      select: {
        idUser: true,
        username: true,
        email: true,
        profileImgUrl: true,
        role: true,
        idBrandMaster: true,
        isActive: true,
        lastLoginDate: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        userPhoneNumber: true,
        field: true,
        department: true,
        contractDate: true,
        fullName: true,
        brandMaster: {
          select: {
            idBrandMaster: true,
            brandName: true,
            brandLogo: true,
            domain: true,
          },
        },
      },
    });
  }

// ----------- Busca usuário pelo email (com senha – só para login/validação)

  async getByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }


// ------------ Perfil do usuário logado

  async getMe(idUser: string) {
    return this.getById(idUser);
  }

// ------------- Contagem total com filtros

  async totalCount(query: TUserQuery, isIncludeDeleted?: boolean) {
    return prisma.user.count({
      where: {
        ...(!isIncludeDeleted && { deletedAt: null }),
        role: query.role,
        idBrandMaster: query.idBrandMaster,
        OR: query.search
          ? [
              { username: { contains: query.search } },
              { email: { contains: query.search } },
              { fullName: { contains: query.search } },
            ]
          : undefined,
      },
    });
  }

  
// ---------- Lista usuários com paginação, filtros e ordenação
  
  async listAll(query: TUserQuery, isIncludeDeleted?: boolean) {
    const limit = query.limit || 0;
    const skip = query.page ? query.page * limit : query.offset ?? 0;
    const orderBy =
      query.orderBy?.map(({ field, direction }) => ({
        [field]: direction,
      })) || [];

    const users = await prisma.user.findMany({
      where: {
        ...(!isIncludeDeleted && { deletedAt: null }),
        role: query.role,
        idBrandMaster: query.idBrandMaster,
        OR: query.search
          ? [
              { username: { contains: query.search } },
              { email: { contains: query.search } },
              { fullName: { contains: query.search } },
            ]
          : undefined,
      },
      select: {
        idUser: true,
        username: true,
        email: true,
        profileImgUrl: true,
        role: true,
        idBrandMaster: true,
        isActive: true,
        lastLoginDate: true,
        createdAt: true,
        updatedAt: true,
        userPhoneNumber: true,
        field: true,
        department: true,
        contractDate: true,
        fullName: true,
        brandMaster: {
          select: {
            brandName: true,
            domain: true,
          },
        },
      },
      take: limit || undefined,
      skip,
      ...(orderBy.length ? { orderBy } : { orderBy: [{ updatedAt: "desc" }] }),
    });

    const totalCount = await this.totalCount(query, isIncludeDeleted);
    return { totalCount, result: users };
  }

// -----------  Criar novo usuário

  async create(data: TUserCreated) {
    return prisma.user.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }


// ----------- Atualiza usuário 

  async update(idUser: string, data: TUserUpdated) {
    return prisma.user.update({
      where: { idUser },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        idUser: true,
        username: true,
        email: true,
        profileImgUrl: true,
        role: true,
        idBrandMaster: true,
        isActive: true,
        lastLoginDate: true,
        createdAt: true,
        updatedAt: true,
        userPhoneNumber: true,
        field: true,
        department: true,
        contractDate: true,
        fullName: true,
      },
    });
  }

// ----------- Atualiza apenas a data de último login

  async updateLastLogin(idUser: string) {
    return prisma.user.update({
      where: { idUser },
      data: {
        lastLoginDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }


// ----------- Soft delete

  async delete(idUser: string) {
    return prisma.user.update({
      where: { idUser },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}