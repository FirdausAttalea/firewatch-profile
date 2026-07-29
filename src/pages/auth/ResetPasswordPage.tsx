"use client"

import type React from "react"
import logoBadak from "@/assets/logobadak.png"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Lock, Eye, EyeOff, Check, X, ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Swal from "sweetalert2"
import { supabase } from "@/lib/supabaseClient"

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

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecoverySession, setIsRecoverySession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})

  const navigate = useNavigate()

  // Listen for PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          // Supabase has recognized the recovery token from the URL hash
          setIsRecoverySession(true)
          setIsCheckingSession(false)
        }
      }
    )

    // Also check if there's already an active session (page refresh scenario)
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      // Check the URL hash for recovery type
      const hash = window.location.hash
      if (hash.includes("type=recovery") || (session && hash.includes("access_token"))) {
        setIsRecoverySession(true)
      }
      setIsCheckingSession(false)
    }

    // Give Supabase a moment to process the hash, then check
    const timer = setTimeout(checkExistingSession, 1500)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

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

  const passwordStrength = calculatePasswordStrength(newPassword)

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

  const handlePasswordChange = (value: string) => {
    setNewPassword(value)
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))

    // Real-time confirm password check
    if (confirmPassword && value !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
    } else if (confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (value !== newPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { password?: string; confirmPassword?: string } = {}

    if (!newPassword) {
      newErrors.password = "Password is required"
    } else if (!validatePassword(newPassword)) {
      newErrors.password = "Password must meet all requirements"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fix the errors in the form",
        confirmButtonColor: "#dc2626",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        console.error("Password update error:", error)
        await Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: error.message || "Failed to update password. Please try again.",
          confirmButtonColor: "#dc2626",
        })
      } else {
        // Sign out after password reset so user can log in fresh
        await supabase.auth.signOut()

        await Swal.fire({
          icon: "success",
          title: "Password Updated!",
          text: "Your password has been reset successfully. Please sign in with your new password.",
          confirmButtonColor: "#dc2626",
        })
        navigate("/auth")
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      await Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "An unexpected error occurred. Please try again.",
        confirmButtonColor: "#dc2626",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const strengthBarWidth = `${(passwordStrength.score / 5) * 100}%`

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Orange-Red Gradient (30%) */}
      <div className="hidden lg:block lg:w-[30%] bg-gradient-to-br from-orange-500 via-red-500 to-red-600 relative overflow-hidden">
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

              {isCheckingSession ? (
                /* Loading state while verifying the recovery token */
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h2>
                  <p className="text-gray-600 text-sm">
                    Please wait while we verify your reset link.
                  </p>
                  <div className="flex justify-center mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                </>
              ) : !isRecoverySession ? (
                /* Invalid / expired link */
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired or Invalid</h2>
                  <p className="text-gray-600 text-sm">
                    This password reset link is invalid or has expired. Please request a new one.
                  </p>
                  <div className="mt-6 space-y-3">
                    <Button
                      onClick={() => navigate("/auth/forgot")}
                      className="w-full h-10 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                    >
                      Request New Reset Link
                    </Button>
                    <div className="text-center">
                      <button
                        onClick={() => navigate("/auth")}
                        className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Valid recovery session — show reset form */
                <>
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
                  <p className="text-gray-600 text-sm">
                    Enter your new password below. Make sure it meets all the requirements.
                  </p>
                </>
              )}
            </div>

            {/* Password Reset Form — only show when recovery session is valid */}
            {!isCheckingSession && isRecoverySession && (
              <motion.form
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* New Password */}
                <div>
                  <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                    New Password {errors.password && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className={`pl-9 pr-9 h-10 text-sm ${errors.password ? "border-red-500" : ""}`}
                      placeholder="Enter new password"
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

                  {/* Password Strength Indicator */}
                  {newPassword && (
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
                            initial={{ width: 0 }}
                            animate={{ width: strengthBarWidth }}
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
                            <span className={`text-xs ${passwordStrength.checks.length ? "text-green-700" : "text-red-600"}`}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {passwordStrength.checks.uppercase ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`text-xs ${passwordStrength.checks.uppercase ? "text-green-700" : "text-red-600"}`}>
                              One uppercase letter
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {passwordStrength.checks.lowercase ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`text-xs ${passwordStrength.checks.lowercase ? "text-green-700" : "text-red-600"}`}>
                              One lowercase letter
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {passwordStrength.checks.number ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`text-xs ${passwordStrength.checks.number ? "text-green-700" : "text-red-600"}`}>
                              One number
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {passwordStrength.checks.special ? (
                              <Check className="w-3 h-3 text-green-500" />
                            ) : (
                              <X className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`text-xs ${passwordStrength.checks.special ? "text-green-700" : "text-red-600"}`}>
                              One special character
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirm-new-password" className="text-sm font-medium text-gray-700">
                    Confirm New Password {errors.confirmPassword && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="confirm-new-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      className={`pl-9 pr-9 h-10 text-sm ${errors.confirmPassword ? "border-red-500" : ""}`}
                      placeholder="Confirm new password"
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating Password...
                    </div>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </Button>

                {/* Back to Sign In */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Sign In
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
