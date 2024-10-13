
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"


const handler = NextAuth({
  providers: [
    // Add your providers here
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    
  ],
  secret:"chess.project",
  session:{
    strategy:'jwt'
  }
  
})

export { handler as GET, handler as POST }