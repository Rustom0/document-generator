import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function LoginPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

    if (session) {
        redirect("/");
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-white px-6">
            <div className="w-full max-w-md space-y-6 text-center">
                <h1 className="text-3xl font-bold text-gray-900">
                    Document Generator
                </h1>

                <p className="text-gray-600">
                    Sign in with Google to create personalized
                    Google Docs.
                </p>

                <a
                    href="/api/auth/google"
                    className="inline-block rounded-lg bg-black px-6 py-3 font-medium text-white"
                >
                    Continue with Google
                </a>
            </div>
        </main>
    );
}