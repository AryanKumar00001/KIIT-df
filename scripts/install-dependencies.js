const { execSync } = require("child_process")

console.log("Installing dependencies for KIIT LinkUp project...")

try {
  // Run npm install
  execSync("npm install", {
    stdio: "inherit",
    cwd: process.cwd(),
  })

  console.log("✅ Dependencies installed successfully!")
  console.log("📦 Installed packages:")
  console.log("  - Next.js 15.2.4")
  console.log("  - React 19")
  console.log("  - Tailwind CSS 4")
  console.log("  - Radix UI components")
  console.log("  - Firebase")
  console.log("  - Geist fonts")
  console.log("  - Lucide React icons")
  console.log("  - TypeScript 5")
} catch (error) {
  console.error("❌ Error installing dependencies:", error.message)
  process.exit(1)
}
