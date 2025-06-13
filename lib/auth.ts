import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  type User,
  updatePassword,
} from "firebase/auth"
import { auth, googleProvider } from "./firebase"
import {
  createUserProfile,
  getUserProfile,
  checkUsernameAvailability,
  generateUsernameSuggestions,
  findUserByUsername,
} from "./userService"

// Helper function to validate KIIT email
const isKiitEmail = (email: string) => {
  return email.toLowerCase().endsWith("@kiit.ac.in")
}

export { generateUsernameSuggestions, checkUsernameAvailability }

export const signUp = async (email: string, password: string, name: string, username: string) => {
  try {
    // Validate KIIT email
    if (!isKiitEmail(email)) {
      return {
        success: false,
        error: "Please use your official KIIT email address (@kiit.ac.in).",
      }
    }

    // Validate username
    if (!username || username.length < 3) {
      return {
        success: false,
        error: "Username must be at least 3 characters long.",
      }
    }

    // Check username availability
    const isUsernameAvailable = await checkUsernameAvailability(username)
    if (!isUsernameAvailable) {
      return {
        success: false,
        error: "This username is already taken. Please choose another one.",
      }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Update user profile with name
    await updateProfile(userCredential.user, {
      displayName: name,
    })

    // Create user profile in Firestore
    const profileCreated = await createUserProfile(userCredential.user, username)
    if (!profileCreated) {
      return {
        success: false,
        error: "Failed to create user profile. Please try again.",
      }
    }

    // Send verification email
    await sendEmailVerification(userCredential.user)

    return {
      success: true,
      user: userCredential.user,
      message: "Account created successfully! Please check your email for verification.",
    }
  } catch (error: any) {
    let errorMessage = "An error occurred during sign up."

    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "An account with this email already exists."
        break
      case "auth/weak-password":
        errorMessage = "Password should be at least 6 characters long."
        break
      case "auth/invalid-email":
        errorMessage = "Invalid email address."
        break
      default:
        errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export const signIn = async (identifier: string, password: string, rememberMe = false) => {
  try {
    let email = identifier

    // If identifier is not an email, try to find user by username
    if (!identifier.includes("@")) {
      const userProfile = await findUserByUsername(identifier)
      if (!userProfile) {
        return {
          success: false,
          error: "Username does not exists.",
        }
      }
      email = userProfile.email
    }

    // Validate KIIT email
    if (!isKiitEmail(email)) {
      return {
        success: false,
        error: "Please use your official KIIT email address (@kiit.ac.in).",
      }
    }

    // Set persistence based on remember me option
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
    await setPersistence(auth, persistence)

    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      return {
        success: false,
        error: "Please verify your email before signing in. Check your inbox for the verification link.",
      }
    }

    return {
      success: true,
      user: userCredential.user,
      message: "Signed in successfully!",
    }
  } catch (error: any) {
    let errorMessage = "An error occurred during sign in."

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "No account found with this username or email."
        break
      case "auth/wrong-password":
        errorMessage = "Incorrect password."
        break
      case "auth/invalid-email":
        errorMessage = "Invalid email address."
        break
      case "auth/user-disabled":
        errorMessage = "This account has been disabled."
        break
      case "auth/too-many-requests":
        errorMessage = "Too many failed attempts. Please try again later."
        break
      default:
        errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Check if the email domain is allowed (optional - for KIIT students only)
    if (!user.email?.endsWith("@kiit.ac.in")) {
      // Sign out the user if they don't have a KIIT email
      await auth.signOut()
      return {
        success: false,
        error: "Please use your KIIT email address (@kiit.ac.in) to sign up.",
      }
    }

    // Check if user profile exists
    const existingProfile = await getUserProfile(user.uid)

    return {
      success: true,
      user: user,
      needsUsername: !existingProfile, // Flag to indicate if username setup is needed
      message: existingProfile
        ? "Signed in with Google successfully!"
        : "Account created! Please choose a username to complete setup.",
    }
  } catch (error: any) {
    let errorMessage = "An error occurred during Google sign in."

    switch (error.code) {
      case "auth/popup-closed-by-user":
        errorMessage = "Sign in was cancelled."
        break
      case "auth/popup-blocked":
        errorMessage = "Popup was blocked by your browser. Please allow popups and try again."
        break
      case "auth/account-exists-with-different-credential":
        errorMessage = "An account already exists with this email using a different sign-in method."
        break
      default:
        errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export const resetPassword = async (email: string) => {
  try {
    // Validate KIIT email
    if (!isKiitEmail(email)) {
      return {
        success: false,
        error: "Please use your official KIIT email address (@kiit.ac.in).",
      }
    }

    await sendPasswordResetEmail(auth, email)
    return {
      success: true,
      message: "Password reset email sent! Check your inbox.",
    }
  } catch (error: any) {
    let errorMessage = "An error occurred while sending reset email."

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "No account found with this email address."
        break
      case "auth/invalid-email":
        errorMessage = "Invalid email address."
        break
      default:
        errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export const resendVerificationEmail = async (user: User) => {
  try {
    await sendEmailVerification(user)
    return {
      success: true,
      message: "Verification email sent! Check your inbox.",
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

export const setUserPassword = async (password: string) => {
  try {
    const user = auth.currentUser
    if (!user) {
      return {
        success: false,
        error: "No user found. Please try signing in again.",
      }
    }

    await updatePassword(user, password)
    return {
      success: true,
      message: "Password set successfully!",
    }
  } catch (error: any) {
    let errorMessage = "An error occurred while setting password."

    switch (error.code) {
      case "auth/weak-password":
        errorMessage = "Password should be at least 6 characters long."
        break
      case "auth/requires-recent-login":
        errorMessage = "Please sign in again to set your password."
        break
      default:
        errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
