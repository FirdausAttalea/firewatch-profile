"use client"

import type React from "react"
import logoBadak from "@/assets/logobadak.png"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, Phone, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import Swal from "sweetalert2"
import { supabase } from "@/lib/supabaseClient"

interface FormData {
  email: string
  password: string
  confirmPassword?: string
  fullName?: string
  phone?: string
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  fullName?: string
  phone?: string
}

interface PasswordStrength {
  score: number
  label: string
  color: string
  bgColor: string
  checks: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  // Regex yang lebih fleksibel untuk nomor internasional
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

const checkEmailAvailability = async (email: string): Promise<{ isValid: boolean; message: string }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  if (!validateEmail(email)) {
    return { isValid: false, message: "Please enter a valid email format" }
  }

  const { data: existingUser, error } = await supabase.from("profiles").select("id").eq("email", email.toLowerCase())

  if (error) {
    console.error("Error checking email:", error)
    return { isValid: false, message: "Error checking email. Please try again." }
  }

  if (existingUser && existingUser.length > 0) {
    return { isValid: false, message: "This email is already registered" }
  }

  return { isValid: true, message: "Email is available" }
}

const checkPhoneAvailability = async (phone: string): Promise<{ isValid: boolean; message: string }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  if (!phone) {
    return { isValid: true, message: "" } // Phone is optional
  }

  if (!validatePhone(phone)) {
    return { isValid: false, message: "Please enter a valid phone number" }
  }

  const cleanPhone = phone.replace(/\s/g, "")
  const { data: existingUser, error } = await supabase.from("profiles").select("id").eq("phone", cleanPhone)

  if (error) {
    console.error("Error checking phone:", error)
    return { isValid: false, message: "Error checking phone. Please try again." }
  }

  if (existingUser && existingUser.length > 0) {
    return { isValid: false, message: "This phone number is already registered" }
  }

  return { isValid: true, message: "Phone number is available" }
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState<"google" | "facebook" | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [emailValidation, setEmailValidation] = useState<{
    isChecking: boolean
    isValid: boolean | null
    message: string
  }>({
    isChecking: false,
    isValid: null,
    message: "",
  })

  const [phoneValidation, setPhoneValidation] = useState<{
    isChecking: boolean
    isValid: boolean | null
    message: string
  }>({
    isChecking: false,
    isValid: null,
    message: "",
  })

  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  const navigate = useNavigate()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      // This event is fired when the page is loaded and a session is found.
      // We do nothing here to prevent the automatic login.
      if (event === "INITIAL_SESSION") {
        return
      }

      if (event === "SIGNED_IN") {
        const hash = window.location.hash
        // Check if it's a sign-in from an email verification link
        if (hash.includes("type=signup")) {
          // Clean the hash from the URL to prevent re-triggering on refresh
          window.history.replaceState(null, "", window.location.pathname + window.location.search)

          // As requested, force the user to sign in again after verification.
          await supabase.auth.signOut()

          Swal.fire({
            icon: "success",
            title: "Akun terverifikasi",
            text: "Silakan sign in dengan akun Anda yang sudah terdaftar.",
            confirmButtonColor: "#dc2626",
          }).then(() => {
            // Ensure the form is in login mode.
            setIsLogin(true)
          })
        } else if (session?.user?.app_metadata?.provider !== "email") {
          // This handles social logins (Google, Facebook, etc.)
          // The manual email/password login is handled in `handleSubmit`.
          Swal.fire({
            icon: "success",
            title: "Login berhasil!",
            text: "Anda akan diarahkan ke halaman utama dalam 2 detik.",
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            confirmButtonColor: "#dc2626",
          }).then(() => {
            // Redirect to home page after login
            navigate("/")
          })
        }
      }
    })
    return () => authListener.subscription.unsubscribe()
  }, [navigate])

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const score = Object.values(checks).filter(Boolean).length

    let label = ""
    let color = ""
    let bgColor = ""

    switch (score) {
      case 0:
      case 1:
        label = "Very Weak"
        color = "text-red-600"
        bgColor = "bg-red-500"
        break
      case 2:
        label = "Weak"
        color = "text-orange-600"
        bgColor = "bg-orange-500"
        break
      case 3:
        label = "Fair"
        color = "text-yellow-600"
        bgColor = "bg-yellow-500"
        break
      case 4:
        label = "Good"
        color = "text-blue-600"
        bgColor = "bg-blue-500"
        break
      case 5:
        label = "Strong"
        color = "text-green-600"
        bgColor = "bg-green-500"
        break
      default:
        label = "Very Weak"
        color = "text-red-600"
        bgColor = "bg-red-500"
    }

    return { score, label, color, bgColor, checks }
  }

  const passwordStrength = calculatePasswordStrength(formData.password)

  const validatePassword = (password: string): boolean => {
    const { checks } = calculatePasswordStrength(password)
    return (
      checks.length &&
      checks.uppercase &&
      checks.lowercase &&
      checks.number &&
      checks.special
    )
  }

  const handleSocialAuth = async (provider: "google" | "facebook") => {
    setIsSocialLoading(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin, // Redirect back to your app after auth
        },
      })

      if (error) {
        console.error(`${provider} auth error:`, error)
        await Swal.fire({
          icon: "error",
          title: `${provider === "google" ? "Google" : "Facebook"} Authentication Failed`,
          text: "There was an error connecting to your account. Please try again.",
          confirmButtonColor: "#dc2626",
        })
      }
    } finally {
      setIsSocialLoading(null)
    }
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
    })
    setErrors({})
    setTouchedFields({})
    setEmailValidation({ isChecking: false, isValid: null, message: "" })
    setPhoneValidation({ isChecking: false, isValid: null, message: "" })
  }

  const handleInputChange = async (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    // Mark field as touched when user starts typing
    if (!touchedFields[field]) {
      setTouchedFields((prev) => ({ ...prev, [field]: true }))
    }

    // Real-time email validation for registration
    if (field === "email" && !isLogin && value.length > 0) {
      setEmailValidation({ isChecking: true, isValid: null, message: "Checking availability..." })

      try {
        const result = await checkEmailAvailability(value)
        setEmailValidation({
          isChecking: false,
          isValid: result.isValid,
          message: result.message,
        })
      } catch (error) {
        setEmailValidation({
          isChecking: false,
          isValid: false,
          message: "Error checking email availability",
        })
      }
    }

    // Real-time phone validation for registration
    if (field === "phone" && !isLogin && value.length > 0) {
      setPhoneValidation({ isChecking: true, isValid: null, message: "Checking availability..." })

      try {
        const result = await checkPhoneAvailability(value)
        setPhoneValidation({
          isChecking: false,
          isValid: result.isValid,
          message: result.message,
        })
      } catch (error) {
        setPhoneValidation({
          isChecking: false,
          isValid: false,
          message: "Error checking phone availability",
        })
      }
    }

    // Clear validation when switching to login or clearing fields
    if (isLogin || value.length === 0) {
      if (field === "email") {
        setEmailValidation({ isChecking: false, isValid: null, message: "" })
      }
      if (field === "phone") {
        setPhoneValidation({ isChecking: false, isValid: null, message: "" })
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    } else if (!isLogin && emailValidation.isValid === false) {
      newErrors.email = emailValidation.message
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (!isLogin && !validatePassword(formData.password)) {
      newErrors.password = "Password must meet all requirements"
    }

    // Register-specific validations
    if (!isLogin) {
      if (!formData.fullName) {
        newErrors.fullName = "Full name is required"
      } else if (formData.fullName.length < 2) {
        newErrors.fullName = "Full name must be at least 2 characters"
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
      }

      if (formData.phone) {
        if (!validatePhone(formData.phone)) {
          newErrors.phone = "Please enter a valid phone number"
        } else if (phoneValidation.isValid === false) {
          newErrors.phone = phoneValidation.message
        }
      }

      // Check if validations are still in progress
      if (emailValidation.isChecking) {
        newErrors.email = "Please wait while we check email availability"
      }

      if (phoneValidation.isChecking) {
        newErrors.phone = "Please wait while we check phone availability"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fix the errors in the form",
        confirmButtonColor: "#dc2626",
      })
      return
    }

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (isLogin) {
      // Login logic
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        if (error.message === "Email not confirmed") {
          const { value: didRequestResend } = await Swal.fire({
            icon: "warning",
            title: "Email Not Confirmed",
            text: "Your account exists but you need to verify your email address before logging in.",
            showCancelButton: true,
            confirmButtonText: "Resend Verification Email",
            cancelButtonText: "OK",
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
          })

          if (didRequestResend) {
            const { error: resendError } = await supabase.auth.resend({
              type: "signup",
              email: formData.email,
            })

            if (resendError) {
              await Swal.fire({
                icon: "error",
                title: "Resend Failed",
                text: resendError.message,
                confirmButtonColor: "#dc2626",
              })
            } else {
              await Swal.fire({
                icon: "success",
                title: "Verification Email Sent!",
                text: "A new verification link has been sent to your email address. Please check your inbox.",
                confirmButtonColor: "#dc2626",
              })
            }
          }
        } else {
          await Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: error.message || "Invalid email or password. Please try again.",
            confirmButtonColor: "#dc2626",
          })
        }
      } else {
        // Successful manual login
        Swal.fire({
          icon: "success",
          title: "Login berhasil!",
          text: "Anda akan diarahkan ke halaman utama dalam 2 detik.",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => {
          resetForm()
          navigate("/")
        })
      }
    } else {
      // Register logic
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
          // Redirect to sign-in page after email verification
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      })

      if (error) {
        await Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: error.message,
          confirmButtonColor: "#dc2626",
        })
      } else {
        // Successful registration
        await Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Please check your email to verify your account.",
          confirmButtonColor: "#dc2626",
          timer: 2000,
          timerProgressBar: true,
        })
        setIsLogin(true)
        resetForm()
      }
    }

    setIsLoading(false)
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  const formVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  const strengthBarVariants = {
    hidden: { width: 0 },
    visible: { width: `${(passwordStrength.score / 5) * 100}%` },
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Orange-Red Gradient (30%) */}
      <div className="hidden lg:block lg:w-[30%] bg-gradient-to-br from-orange-500 via-red-500 to-red-600 relative overflow-hidden">
        {/* Subtle geometric patterns for visual interest */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-16 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
          <div className="absolute bottom-32 left-20 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 right-10 w-28 h-28 bg-white/5 rounded-full blur-xl"></div>
        </div>
      </div>

      {/* Right Side - Form (70%) */}
      <div className="w-full lg:w-[70%] flex items-center justify-center p-6 bg-gray-50 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            {/* Logo and Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4 gap-2">
                <img src={logoBadak} alt="BadakLNG Logo" className="h-10 w-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{isLogin ? "Welcome Back" : "Create Account"}</h2>
              <p className="text-gray-600 text-sm">
                {isLogin ? "Sign in to access your HSE training dashboard" : "Join our HSE training community"}
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialAuth("google")}
                disabled={isSocialLoading !== null || isLoading}
                className="w-full h-10 border-gray-300 hover:bg-gray-50 transition-all duration-200 text-sm"
              >
                {isSocialLoading === "google" ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Connecting to Google...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </div>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleSocialAuth("facebook")}
                disabled={isSocialLoading !== null || isLoading}
                className="w-full h-10 border-gray-300 hover:bg-gray-50 transition-all duration-200 text-sm"
              >
                {isSocialLoading === "facebook" ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Connecting to Facebook...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Continue with Facebook
                  </div>
                )}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative mb-4">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-3 text-xs text-gray-500">or continue with email</span>
              </div>
            </div>

            {/* Toggle Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button
                onClick={() => !isLoading && !isSocialLoading && setIsLogin(true)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  isLogin ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => !isLoading && !isSocialLoading && setIsLogin(false)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  !isLogin ? "bg-white text-orange-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.form
                key={isLogin ? "login" : "register"}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Register-only fields */}
                {!isLogin && (
                  <>
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                        Full Name {touchedFields.fullName && errors.fullName && <span className="text-red-500">*</span>}
                      </Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="fullName"
                          type="text"
                          value={formData.fullName || ""}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          onBlur={() => setTouchedFields((prev) => ({ ...prev, fullName: true }))}
                          className={`pl-9 h-10 text-sm ${errors.fullName ? "border-red-500" : ""}`}
                          placeholder="Enter your full name"
                        />
                      </div>
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone || ""}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          onBlur={() => setTouchedFields((prev) => ({ ...prev, phone: true }))}
                          className={`pl-9 pr-9 h-10 text-sm ${
                            errors.phone
                              ? "border-red-500"
                              : phoneValidation.isValid === true
                                ? "border-green-500"
                                : phoneValidation.isValid === false
                                  ? "border-red-500"
                                  : ""
                          }`}
                          placeholder="Enter your phone number"
                        />
                        {/* Validation Status Icon */}
                        {formData.phone && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {phoneValidation.isChecking ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            ) : phoneValidation.isValid === true ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : phoneValidation.isValid === false ? (
                              <X className="w-4 h-4 text-red-500" />
                            ) : null}
                          </div>
                        )}
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      {!errors.phone && phoneValidation.message && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`text-xs mt-1 ${
                            phoneValidation.isValid === true
                              ? "text-green-600"
                              : phoneValidation.isValid === false
                                ? "text-red-500"
                                : "text-blue-600"
                          }`}
                        >
                          {phoneValidation.message}
                        </motion.p>
                      )}
                    </div>
                  </>
                )}

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address {touchedFields.email && errors.email && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      onBlur={() => setTouchedFields((prev) => ({ ...prev, email: true }))}
                      className={`pl-9 pr-9 h-10 text-sm ${
                        errors.email
                          ? "border-red-500"
                          : !isLogin && emailValidation.isValid === true
                            ? "border-green-500"
                            : !isLogin && emailValidation.isValid === false
                              ? "border-red-500"
                              : ""
                      }`}
                      placeholder="Enter your email"
                    />
                    {/* Validation Status Icon */}
                    {!isLogin && formData.email && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {emailValidation.isChecking ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        ) : emailValidation.isValid === true ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : emailValidation.isValid === false ? (
                          <X className="w-4 h-4 text-red-500" />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  {!isLogin && !errors.email && emailValidation.message && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-xs mt-1 ${
                        emailValidation.isValid === true
                          ? "text-green-600"
                          : emailValidation.isValid === false
                            ? "text-red-500"
                            : "text-blue-600"
                      }`}
                    >
                      {emailValidation.message}
                    </motion.p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password {touchedFields.password && errors.password && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      onBlur={() => setTouchedFields((prev) => ({ ...prev, password: true }))}
                      className={`pl-9 pr-9 h-10 text-sm ${errors.password ? "border-red-500" : ""}`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

                  {/* Password Strength Indicator - Only show during registration */}
                  {!isLogin && formData.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 space-y-2"
                    >
                      {/* Strength Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Password Strength</span>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <motion.div
                            variants={strengthBarVariants}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.3 }}
                            className={`h-1.5 rounded-full ${passwordStrength.bgColor} transition-all duration-300`}
                          />
                        </div>
                      </div>

                      {/* Requirements Checklist */}
                      <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                        <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                        <div className="grid grid-cols-1 gap-1">
                          <div className="flex items-center space-x-2">
                            {passwordStrength.checks.length ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span
                              className={`text-xs ${
                                passwordStrength.checks.length ? "text-green-700" : "text-red-600"
                              }`}
                            >
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {passwordStrength.checks.uppercase ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span
                              className={`text-xs ${
                                passwordStrength.checks.uppercase ? "text-green-700" : "text-red-600"
                              }`}
                            >
                              One uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {passwordStrength.checks.lowercase ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span
                              className={`text-xs ${
                                passwordStrength.checks.lowercase ? "text-green-700" : "text-red-600"
                              }`}
                            >
                              One lowercase letter
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {passwordStrength.checks.number ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span
                              className={`text-xs ${
                                passwordStrength.checks.number ? "text-green-700" : "text-red-600"
                              }`}
                            >
                              One number
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {passwordStrength.checks.special ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span
                              className={`text-xs ${
                                passwordStrength.checks.special ? "text-green-700" : "text-red-600"
                              }`}
                            >
                              One special character
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password (Register only) */}
                {!isLogin && (
                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirm Password{" "}
                      {touchedFields.confirmPassword && errors.confirmPassword && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword || ""}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        onBlur={() => setTouchedFields((prev) => ({ ...prev, confirmPassword: true }))}
                        className={`pl-9 pr-9 h-10 text-sm ${errors.confirmPassword ? "border-red-500" : ""}`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Remember Me / Terms */}
                <div className="flex items-center justify-between">
                  {isLogin ? (
                    <div className="flex items-center">
                      <Checkbox id="remember" checked={rememberMe} onCheckedChange={setRememberMe} />
                      <Label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                        Remember me
                      </Label>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Checkbox id="terms" required />
                      <Label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                        I agree to the{" "}
                        <a href="#" className="text-orange-600 hover:text-orange-700">
                          Terms & Conditions
                        </a>
                      </Label>
                    </div>
                  )}

                  {isLogin && (
                    <a href="#" className="text-sm text-orange-600 hover:text-orange-700">
                      Forgot password?
                    </a>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || isSocialLoading !== null}
                  className="w-full h-10 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isLogin ? "Signing In..." : "Creating Account..."}
                    </div>
                  ) : (
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  )}
                </Button>
              </motion.form>
            </AnimatePresence>

            {/* Footer */}
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={toggleMode}
                  disabled={isLoading || isSocialLoading !== null}
                  className="text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
