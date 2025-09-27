import { StackServerApp } from "@stackframe/stack"

export const stackServerApp = new StackServerApp({
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  tokenStore: "nextjs-cookie",
  urls: {
    signIn: "/handler/signin",
    signUp: "/handler/signup",
    emailVerification: "/handler/email-verification",
    passwordReset: "/handler/password-reset",
    home: "/",
  },
})
