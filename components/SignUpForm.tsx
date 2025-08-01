/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useForm } from "react-hook-form"
import { useSignUp } from "@clerk/nextjs"
import { z } from "zod"
import { signUpSchema } from "@/schemas/signUpSchema"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { Card, CardBody, CardHeader, CardFooter, Divider, Input, Button } from "@heroui/react";
import { Mail, AlertCircle, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from "next/link"

export default function SignUpForm() {
    const router = useRouter()
    const { signUp, isLoaded, setActive } = useSignUp()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [verificationCode, setVerificationCode] = useState("")
    const [authError, setAuthError] = useState<string| null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [verificationError, setVerificationError] = useState<string| null>(null)
    const [ verifying, setVerifying ] = useState(false)
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            email: "",
            password: "",
            passwordConfirmation: ""
        }
    })
    const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
        if (!isLoaded) return
        setIsSubmitting(true)
        setAuthError(null)
        try {
            await signUp.create({
                emailAddress: data.email,
                password: data.password
            })
            await signUp.prepareEmailAddressVerification({
                strategy: 'email_code'
            })
            setVerifying(true)
        
        } catch (error: any) {
            console.log("Signup error", error)
            setAuthError(
                error.errors?.[0]?.message || "An error occured during the signup. Please try again"
            )
        } finally {
            setIsSubmitting(false)
        }
    }
    const handleVerificationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!isLoaded || !signUp) return
        setIsSubmitting(true)
        setAuthError(null)

        try {
            const result = await signUp.attemptEmailAddressVerification({
                code: verificationCode
            })
            console.log(result)
            if (result.status === "complete") {
                await setActive({session: result.createdSessionId})
                router.push("./dashboard")
            } else {
                console.error("Verification incomplete", result)
                setVerificationError("Verifications could not be completed!")
            }
        
        } catch (error: any) {
            console.error("Verification incomplete", error)
            setVerificationError(
                error.errors?.[0]?.message || "An error occured during the signup. Please try again"
            )
        }
        finally{
            setIsSubmitting(false)
        }
    }
    if (verifying) {
        return (
            <Card className="w-full max-w-md border border-default-200 bg-default-50 shadow-xl">
                <CardHeader className="flex flex-col gap-1 items-center pb-2">
                    <h1 className="text-2xl font-bold text-default-900">Verify your Email</h1>
                    <p className="text-default-500 text-center">We have sent a verification code to your email</p>
                </CardHeader>
                <Divider />
                <CardBody className="py-6">
                    {verificationError && (
                        <div className="bg-danger-50 text-danger-700 p-4 rounded-lg mb-6 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p>{verificationError}</p>
                        </div>
                    )}
                    <form onSubmit={handleVerificationSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="verificationCode" className="text-sm font-medium text-default-900">
                                Verification Code
                            </label>
                            <Input id="verificationCode" type="text" placeholder="Enter the 6-digit code" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="w-full" autoFocus />
                        </div>
                        
                        <Button type="submit" color="primary" className="w-full" isLoading={isSubmitting}>
                            {isSubmitting ? "Verifying..." : "Verify Email"}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-default-500">
                            Didn&apos;t receive a code?{" "}
                            <button onClick={async () => {
                                if (signUp) {
                                    await signUp.prepareEmailAddressVerification({
                                        strategy: "email_code"
                                    })
                                }
                            }}
                            className="text-primary hover:underline font-medium">
                                Resend code
                            </button>
                        </p>
                    </div>
                </CardBody>
            </Card>
        )
    }
    return (
        <Card className="w-full max-w-md border border-default-200 bg-default-50 shadow-xl">
            <CardHeader className="flex flex-col gap-1 items-center pb-2">
                <h1 className="text-2xl font-bold text-default-900">
                    Create Your Account
                </h1>
                <p className="text-default-500 text-center">
                    Sign up to start managing your images securely
                </p>
            </CardHeader>
            <Divider />
            <CardBody className="py-6">
                {authError && (
                    <div className="bg-danger-50 text-danger-700 p-4 rounded-lg mb-6 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p>{authError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-default-900">Email</label>
                        <Input id="email" type="email" placeholder="your.email@example.com" startContent={<Mail className="h-4 w-4 text-default-500"/>} isInvalid={!!errors.email} errorMessage={errors.email?. message} {...register("email")} className="w-full"></Input>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-default-900">Password</label>
                        <Input id="password" type="password" placeholder="••••••••" startContent={<Lock className="h-4 w-4 text-default-500"/>} endContent={<Button isIconOnly variant="light" size="sm" onPress={() => setShowPassword(!showPassword)} type="button">
                            {showPassword ? (<EyeOff className="h-4 w-4 text-default-500"/>) : (<Eye className="h-4 w-4 text-default-500"/>)}
                        </Button>}
                        isInvalid={!!errors.password}
                        errorMessage={errors.password?.message}
                        {...register("password")} className="w-full"></Input>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="passwordConfirmation" className="text-sm font-medium text-default-900">Confirm Password</label>
                        <Input id="passwordConfirmation" type="password" placeholder="••••••••" startContent={<Lock className="h-4 w-4 text-default-500"/>} endContent={<Button isIconOnly variant="light" size="sm" onPress={() => setShowConfirmPassword(!showConfirmPassword)} type="button">
                            {showConfirmPassword ? (<EyeOff className="h-4 w-4 text-default-500"/>) : (<Eye className="h-4 w-4 text-default-500"/>)}
                        </Button>}
                        isInvalid={!!errors.passwordConfirmation}
                        errorMessage={errors.passwordConfirmation?.message}
                        {...register("passwordConfirmation")} className="w-full"></Input>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                        <p className="text-sm text-default-600">
                            By signing up, you agree to our Terms of Service and Privacy
                            Policy
                        </p>
                        </div>
                    </div>
                    <Button type="submit" color="primary" isLoading={isSubmitting} className="w-full">
                        {isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                </form>
            </CardBody>

            <Divider />

            <CardFooter className="flex justify-center py-4">
                <p className="text-sm text-default-600">
                    Already have an account?{" "}
                    <Link
                        href="/sign-in"
                        className="text-primary hover:underline font-medium"
                    >
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </Card>
    )
}