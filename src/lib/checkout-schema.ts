import { z } from "zod"

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional(),
  address: z.string().trim().min(3, "Enter your street address"),
  city: z.string().trim().min(1, "Enter your city"),
  postalCode: z.string().trim().min(1, "Enter your postal code"),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>

export const checkoutFieldOrder: (keyof CheckoutFormValues)[] = [
  "fullName",
  "email",
  "phone",
  "address",
  "city",
  "postalCode",
]

export const emptyCheckoutFormValues: CheckoutFormValues = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
}
