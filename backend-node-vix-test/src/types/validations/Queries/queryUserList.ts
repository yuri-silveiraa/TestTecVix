import { Prisma } from "@prisma/client";
import { z } from "zod";

const allowedOrderFields = Object.values(Prisma.UserScalarFieldEnum);

const orderBySchema = z.object({
  field: z.enum(allowedOrderFields as any, {
    message: `Campo inválido para ordenação. Permitidos: ${allowedOrderFields.join(", ")}`,
  }),
  direction: z.enum(["asc", "desc"], { message: "Direção deve ser 'asc' ou 'desc'" }),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  search: z.string().optional(),

  role: z.enum(["admin", "manager", "member"]).optional(),
  idBrandMaster: z.coerce.number().int().optional(),

  orderBy: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          throw new z.ZodError([{
            code: "custom",
            message: "orderBy deve ser um JSON válido",
            path: ["orderBy"],
          }]);
        }
      }
      return val;
    },
    z.array(orderBySchema).optional(),
  ),

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