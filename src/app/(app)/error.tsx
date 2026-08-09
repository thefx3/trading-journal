"use client"; import { Button } from "@/components/ui/button";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { return <div className="grid min-h-[60vh] place-items-center text-center"><div><p className="text-sm font-medium text-red-400">Something went wrong</p><h1 className="mt-2 text-2xl font-semibold">Your data could not be loaded.</h1><p className="mt-2 max-w-md text-sm text-zinc-600">{error.message}</p><Button className="mt-5" onClick={reset}>Try again</Button></div></div>; }

