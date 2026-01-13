import { z } from "zod";

const orderBySchema = z.array(
  z.object({
    field: z.string().min(1, "Campo de ordenação é obrigatório"),
    direction: z.enum(["asc", "desc"], {
      message: "Direção deve ser 'asc' ou 'desc'",
    }),
  })
).optional();

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  search: z.string().optional(),

  role: z.enum(["admin", "manager", "member"]).optional(),
  idBrandMaster: z.coerce.number().int().optional(),

  orderBy: orderBySchema,

  isActive: z.coerce.boolean().optional(),
}).refine((data) => {
  if (data.page !== undefined && data.offset !== undefined) {
    throw new Error("Não é permitido usar 'page' e 'offset' ao mesmo tempo");
  }
  return true;
}, {
  message: "Conflito entre page e offset",
});

export type TUserQuery = z.infer<typeof userQuerySchema>;