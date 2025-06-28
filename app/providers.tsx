"use client"

import { HeroUIProvider } from "@heroui/system"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ImageKitProvider } from "imagekitio-next"
import { ProviderProps } from "@/types/UiTypes"
import { ToastProvider } from "@heroui/react"
import { useRouter } from "next/navigation"
import { createContext } from "react"

const authenticator = async () => {
    try {
        const response = await fetch("/api/imagekit-auth")
        const data = await response.json()
        return data
    } catch (error) {
        console.error("Authentication Error: ", error)
        throw error
    }
}

declare module "@react-types/shared" {
    interface RouterConfig {
        routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>["push"]>[1]>
    }
}

export const ImageKitAuthContext = createContext<{
  authenticate: () => Promise<{
    signature: string;
    token: string;
    expire: number;
  }>;
}>({
  authenticate: async () => ({ signature: "", token: "", expire: 0 }),
});

export function Providers({ children, themeProps } : ProviderProps) {
    return (
        <HeroUIProvider>
            <ImageKitProvider
                authenticator={authenticator}
                publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || ''}
                urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                >
                <ImageKitAuthContext.Provider value={{ authenticate: authenticator }}>
                    <ToastProvider placement="top-right" />
                    <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
                </ImageKitAuthContext.Provider>
            </ImageKitProvider>
        </HeroUIProvider>
    )
}