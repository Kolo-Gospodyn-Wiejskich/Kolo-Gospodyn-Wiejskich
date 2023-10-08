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

export const competitionSchema = z.object({
  name: z
    .string()
    .min(1, "Nazwa nie może być pusta")
    .max(30, "Nazwa musi zawierać najwyżej 30 znaków"),
  imageUrl: z.string().url(),
  startsAt: z.date({
    required_error: "Początek przedziału czasu jest wymagany",
  }),
  endsAt: z.date({ required_error: "Koniec przedziału czasu jest wymagany" }),
});

export const entrySchema = z.object({
  title: z
    .string()
    .min(1, "Tytuł nie może być pusty")
    .max(50, "Tytuł musi zawierać najwyżej 50 znaków"),
  description: z
    .string()
    .max(255, "Opis musi zawierać najwyżej 255 znaków")
    .optional(),
  imageUrl: z.string().url(),
});

const MAX_POINTS_TASTE = 5;
const MAX_POINTS_APPEARANCE = 3;
const MAX_POINTS_NUTRITION = 2;

export const ratingSchema = z
  .object({
    entryId: z.string(),
    type: z.enum(["TASTE", "APPEARANCE", "NUTRITION"]),
    value: z.number().min(0),
  })
  .refine(
    ({ type, value }) =>
      (type === "TASTE" && value <= MAX_POINTS_TASTE) ||
      (type === "APPEARANCE" && value <= MAX_POINTS_APPEARANCE) ||
      (type === "NUTRITION" && value <= MAX_POINTS_NUTRITION),
  );
