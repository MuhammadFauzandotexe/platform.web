'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Sparkles,
} from 'lucide-react'
import { AuthApiError, registerAccount, type RegistrationResponse } from '../../lib/auth'

type FormErrors = {
  email?: string
  password?: string
}

type RegistrationState = 'form' | 'success'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRequirements = [
  { key: 'length', label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'lowercase', label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { key: 'number', label: 'One number', test: (value: string) => /\d/.test(value) },
  { key: 'special', label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
] as const

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [apiError, setApiError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationState, setRegistrationState] = useState<RegistrationState>('form')
  const [registrationResponse, setRegistrationResponse] = useState<RegistrationResponse>({})

  const passwordChecks = passwordRequirements.map((requirement) => ({
    ...requirement,
    complete: requirement.test(password),
  }))
  const passwordIsValid = passwordChecks.every((requirement) => requirement.complete)

  const validate = () => {
    const nextErrors: FormErrors = {}
    const normalizedEmail = email.trim()

    if (!normalizedEmail) nextErrors.email = 'Email is required.'
    else if (!emailPattern.test(normalizedEmail)) nextErrors.email = 'Please enter a valid email address.'
    if (!password) nextErrors.password = 'Password is required.'
    else if (!passwordIsValid) nextErrors.password = 'Password does not meet the requirements.'

    setErrors(nextErrors)
    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isRegistering) return

    setApiError('')
    if (Object.keys(validate()).length) return

    setIsRegistering(true)
    try {
      const response = await registerAccount({ email: email.trim(), password })
      setRegistrationResponse(response)
      setPassword('')
      setRegistrationState('success')
    } catch (error) {
      if (error instanceof AuthApiError && error.code === 'duplicate-email') {
        setApiError('An account with this email already exists.')
      } else {
        setApiError('Something went wrong while creating your account. Please try again.')
      }
    } finally {
      setIsRegistering(false)
    }
  }

  if (registrationState === 'success') {
    return (
      <main className="auth-shell">
        <section className="success-card" aria-labelledby="success-title">
          <div className="brand-mark"><Sparkles size={18} /><span>Luma</span></div>
          <div className="success-icon"><Check size={26} /></div>
          <h1 id="success-title">Account created successfully</h1>
          <p>{registrationResponse.message || 'Your account was created successfully. Verification is required before your account becomes fully verified.'}</p>
          {(registrationResponse.accountStatus || registrationResponse.accountPlan) && (
            <div className="registration-meta">
              {registrationResponse.accountStatus && <span>Status: <strong>{registrationResponse.accountStatus}</strong></span>}
              {registrationResponse.accountPlan && <span>Plan: <strong>{registrationResponse.accountPlan}</strong></span>}
            </div>
          )}
          <Link className="primary-button" href="/login">Back to login <ArrowRight size={17} /></Link>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="page-title">
        <header className="auth-header">
          <div className="brand-mark"><Sparkles size={18} /><span>Luma</span></div>
          <h1 id="page-title">Create your account</h1>
          <p>Start connecting your WhatsApp and AI customer service workspace.</p>
        </header>

        {apiError && <div className="form-alert" role="alert"><AlertCircle size={17} /><span>{apiError}</span></div>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="register-email">Email address</label>
            <div className={`input-wrap ${errors.email ? 'has-error' : ''}`}>
              <Mail size={18} aria-hidden="true" />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setApiError('') }}
                onBlur={validate}
                disabled={isRegistering}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'register-email-error' : undefined}
              />
            </div>
            {errors.email && <p className="field-error" id="register-email-error">{errors.email}</p>}
          </div>

          <div className="field-group">
            <label htmlFor="register-password">Password</label>
            <div className={`input-wrap ${errors.password ? 'has-error' : ''}`}>
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => { setPassword(event.target.value); setApiError(''); setErrors((current) => ({ ...current, password: undefined })) }}
                onBlur={validate}
                disabled={isRegistering}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={`password-hint${errors.password ? ' register-password-error' : ''}`}
              />
              <button className="visibility-button" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} disabled={isRegistering}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="field-error" id="register-password-error">{errors.password}</p>}
            <div className="password-requirements" id="password-hint" aria-label="Password requirements">
              <span className="field-hint">Password requirements:</span>
              <ul>
                {passwordChecks.map((requirement) => (
                  <li className={requirement.complete ? 'complete' : ''} key={requirement.key}>
                    <span aria-hidden="true">{requirement.complete ? '✓' : '○'}</span>
                    {requirement.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button className="primary-button submit-button" type="submit" disabled={!email.trim() || !password || isRegistering}>
            {isRegistering ? <><LoaderCircle className="spin" size={17} /> Creating account...</> : <>Create account <ArrowRight size={17} /></>}
          </button>
        </form>

        <p className="login-prompt">Already have an account? <Link href="/login">Sign in</Link></p>
      </section>
    </main>
  )
}
