import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input, Button, Card, CardBody, CardHeader } from "@heroui/react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
    const { login, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    if (isAuthenticated) {
        navigate("/app", { replace: true });
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = await login(email, password);
            if (user.role !== "freelancer") {
                logout();
                setError("The desktop app is available for freelancers only. Please use the web dashboard at monkeyswork.com.");
                return;
            }
            navigate("/app", { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#363747] via-[#2a2b3d] to-[#1a1b2e] pt-8">
            {/* Drag region for window movement */}
            <div data-tauri-drag-region className="absolute top-0 left-0 right-0 h-8 z-50" />

            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#f08a11]/10 rounded-full blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#f08a11]/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-md px-6">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img
                        src="/monkeyswork-dark.svg"
                        alt="MonkeysWorks"
                        className="h-14 mx-auto mb-3"
                    />
                    <p className="text-white/50 text-sm">Sign in to your account</p>
                </div>

                <Card className="bg-white/[0.07] backdrop-blur-xl border border-white/10 shadow-2xl">
                    <CardHeader className="pb-0 pt-6 px-6">
                        <h1 className="text-xl font-bold text-white">Welcome back</h1>
                    </CardHeader>
                    <CardBody className="px-6 pb-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onValueChange={setEmail}
                                variant="bordered"
                                isRequired
                                classNames={{
                                    input: "text-white",
                                    label: "text-white/60",
                                    inputWrapper: "border-white/20 hover:border-white/40 group-data-[focus=true]:border-[#f08a11]",
                                }}
                            />

                            <Input
                                label="Password"
                                type="password"
                                value={password}
                                onValueChange={setPassword}
                                variant="bordered"
                                isRequired
                                classNames={{
                                    input: "text-white",
                                    label: "text-white/60",
                                    inputWrapper: "border-white/20 hover:border-white/40 group-data-[focus=true]:border-[#f08a11]",
                                }}
                            />

                            <Button
                                type="submit"
                                isLoading={loading}
                                className="w-full bg-[#f08a11] hover:bg-[#e07a00] text-white font-semibold text-sm h-12 rounded-xl transition-colors"
                            >
                                {loading ? "Signing in…" : "Sign In"}
                            </Button>
                        </form>
                    </CardBody>
                </Card>

                <p className="text-center text-white/30 text-xs mt-6">
                    MonkeysWorks Desktop · v0.1.0
                </p>
            </div>
        </div>
    );
}
