"use client";

import { useState } from "react";

export default function LogoutButton() {
    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        try {
            setLoggingOut(true);

            await fetch("/api/auth/logout", {
                method: "POST",
            });

            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
            setLoggingOut(false);
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
            {loggingOut ? "Logging out..." : "Logout"}
        </button>
    );
}