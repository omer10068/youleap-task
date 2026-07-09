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
  phone: "Phone (optional)",
  address: "Street address",
  city: "City",
  postalCode: "Postal code",
}

const fieldInputTypes: Record<keyof CheckoutFormValues, string> = {
  fullName: "text",
  email: "email",
  phone: "tel",
  address: "text",
  city: "text",
  postalCode: "text",
}

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
      className="flex flex-1 flex-col gap-4 overflow-y-auto"
    >
      {checkoutFieldOrder.map((field) => {
        const inputId = `checkout-${field}`
        const errorId = `checkout-${field}-error`
        const error = errors[field]

        return (
          <div key={field}>
            <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
              {fieldLabels[field]}
            </label>
            <input
              id={inputId}
              ref={setFieldRef(field)}
              type={fieldInputTypes[field]}
              value={values[field]}
              onChange={(event) => handleChange(field, event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                error ? "border-red-500" : "border-gray-300"
              }`}
            />
            {error && (
              <p id={errorId} className="mt-1 text-xs text-red-600">
                {error}
              </p>
            )}
          </div>
        )
      })}

      <button
        type="submit"
        className="mt-2 w-full rounded-md bg-black py-2 text-sm text-white transition-colors hover:bg-gray-800"
      >
        Place Order
      </button>
    </form>
  )
}
