import { z } from "zod";

export const loginSchema = z.object({
  firstName: z.string().min(1, "Imię nie może być puste"),
  lastName: z.string().min(1, "Nazwisko nie może być puste"),
  password: z.string().min(1, "Hasło nie może być puste"),
});

export const secretCodeSchema = z.object({
  secretCode: z.string().min(1, "Kod nie może być pusty"),
});

export const signUpSchema = z.object({
  firstName: z
    .string()
    .min(1, "Imię nie może być puste")
    .max(20, "Imię musi zawierać najwyżej 20 znaków"),
  lastName: z
    .string()
    .min(1, "Nazwisko nie może być puste")
    .max(20, "Nazwisko musi zawierać najwyżej 20 znaków"),
  password: z.string().min(4, "Hasło musi zawierać przynajmniej 4 znaki"),
});
