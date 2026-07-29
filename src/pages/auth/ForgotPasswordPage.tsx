"use client"

import type React from "react"
import logoBadak from "@/assets/logobadak.png"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Swal from "sweetalert2"
import { supabase } from "@/lib/supabaseClient"

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!email) {
      setError("Email is required")
      return
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        console.error("Reset password error:", resetError)
        await Swal.fire({
          icon: "error",
          title: "Request Failed",
          text: resetError.message || "Failed to send password reset email. Please try again.",
          confirmButtonColor: "#dc2626",
        })
      } else {
        setIsSent(true)
        await Swal.fire({
          icon: "success",
          title: "Email Sent!",
          text: "Please check your inbox for a password reset link. It may take a few minutes to arrive.",
          confirmButtonColor: "#dc2626",
        })
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      await Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: "An unexpected error occurred. Please try again later.",
        confirmButtonColor: "#dc2626",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsLoading(true)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        await Swal.fire({
          icon: "error",
          title: "Resend Failed",
          text: resetError.message,
          confirmButtonColor: "#dc2626",
        })
      } else {
        await Swal.fire({
          icon: "success",
          title: "Email Resent!",
          text: "A new password reset link has been sent to your email.",
          confirmButtonColor: "#dc2626",
        })
      }
    } finally {
      setIsLoading(false)
    }
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isSent ? "Check Your Email" : "Forgot Password"}
              </h2>
              <p className="text-gray-600 text-sm">
                {isSent
                  ? "We've sent a password reset link to your email address."
                  : "Enter your email address and we'll send you a link to reset your password."}
              </p>
            </div>

            {!isSent ? (
              /* Request Form */
              <motion.form
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Email */}
                <div>
                  <Label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                    Email Address {error && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError("")
                      }}
                      className={`pl-9 h-10 text-sm ${error ? "border-red-500" : ""}`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
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
                      Sending...
                    </div>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </Button>
              </motion.form>
            ) : (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Email confirmation display */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <Mail className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-700">
                    Reset link sent to: <br />
                    <span className="font-semibold text-gray-900">{email}</span>
                  </p>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Didn't receive the email? Check your spam folder or click below to resend.
                </p>

                {/* Resend Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={isLoading}
                  className="w-full h-10 border-gray-300 hover:bg-gray-50 transition-all duration-200 text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Resending...
                    </div>
                  ) : (
                    <span>Resend Reset Link</span>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Back to Sign In */}
            <div className="mt-4 text-center">
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
