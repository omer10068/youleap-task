"use client"

import { useRef, useState } from "react"
import {
  checkoutFieldOrder,
  checkoutSchema,
  emptyCheckoutFormValues,
  type CheckoutFormValues,
} from "@/lib/checkout-schema"

type CheckoutFormProps = {
  onSuccess: (values: CheckoutFormValues) => void
}

type FieldErrors = Partial<Record<keyof CheckoutFormValues, string>>

const fieldLabels: Record<keyof CheckoutFormValues, string> = {
  fullName: "Full name",
  email: "Email",
  phone: "Phone",
  address: "Street address",
  city: "City",
  postalCode: "Postal code",
}

const fieldOptional: Record<keyof CheckoutFormValues, boolean> = {
  fullName: false,
  email: false,
  phone: true,
  address: false,
  city: false,
  postalCode: false,
}

const fieldInputTypes: Record<keyof CheckoutFormValues, string> = {
  fullName: "text",
  email: "email",
  phone: "tel",
  address: "text",
  city: "text",
  postalCode: "text",
}

// This is the form CartDrawer's footer submit button targets via
// `form="checkout-form"` — the button lives outside this component so it
// can stay anchored in the drawer footer, but submission still runs
// entirely through this form's own onSubmit below.
export const CHECKOUT_FORM_ID = "checkout-form"

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const [values, setValues] = useState<CheckoutFormValues>(emptyCheckoutFormValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const fieldRefs = useRef<Partial<Record<keyof CheckoutFormValues, HTMLInputElement>>>({})

  function setFieldRef(name: keyof CheckoutFormValues) {
    return (el: HTMLInputElement | null) => {
      fieldRefs.current[name] = el ?? undefined
    }
  }

  function handleChange(name: keyof CheckoutFormValues, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <form
      id={CHECKOUT_FORM_ID}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()

        const result = checkoutSchema.safeParse(values)

        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors
          const nextErrors: FieldErrors = {}
          for (const field of checkoutFieldOrder) {
            const message = fieldErrors[field]?.[0]
            if (message) nextErrors[field] = message
          }
          setErrors(nextErrors)

          const firstInvalidField = checkoutFieldOrder.find((field) => nextErrors[field])
          if (firstInvalidField) {
            fieldRefs.current[firstInvalidField]?.focus()
          }
          return
        }

        setErrors({})
        onSuccess(result.data)
      }}
      className="space-y-4"
    >
      {checkoutFieldOrder.map((field) => {
        const inputId = `checkout-${field}`
        const errorId = `checkout-${field}-error`
        const error = errors[field]

        return (
          <div key={field}>
            <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-stone-900">
              {fieldLabels[field]}
              {fieldOptional[field] && (
                <span className="ml-1 font-normal text-stone-400">(optional)</span>
              )}
            </label>
            <input
              id={inputId}
              ref={setFieldRef(field)}
              type={fieldInputTypes[field]}
              value={values[field]}
              onChange={(event) => handleChange(field, event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className={`w-full rounded-xl border bg-[oklch(0.985_0.006_83)] px-3.5 py-2.5 text-sm text-stone-900 shadow-sm transition-colors outline-none placeholder:text-stone-400 focus:ring-2 focus:ring-offset-2 focus:ring-offset-[oklch(0.998_0.004_83)] ${
                error
                  ? "border-red-400 focus:ring-red-500"
                  : "border-[oklch(0.9_0.01_75)] hover:border-[oklch(0.22_0.012_60)]/30 focus:ring-[oklch(0.62_0.11_45)]"
              }`}
            />
            {error && (
              <p id={errorId} className="mt-1.5 text-xs font-medium text-red-600">
                {error}
              </p>
            )}
          </div>
        )
      })}
    </form>
  )
}
