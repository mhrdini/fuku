'use client'

import { useState } from 'react'

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  register?: boolean
}

export function UserAuthForm({
  className,
  register,
  ...props
}: UserAuthFormProps) {
  const [isRegister, setIsRegister] = useState<boolean>(register || false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle user authentication logic here
  }

  return <div>{isRegister ? 'Register Form' : 'Login Form'}</div>
}
