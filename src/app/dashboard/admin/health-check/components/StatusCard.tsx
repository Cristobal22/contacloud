
import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface HealthCheckResult {
    name: string;
    status: 'ok' | 'missing' | 'partial';
    message: string;
    action?: React.ReactNode;
}

interface StatusCardProps {
    result: HealthCheckResult;
}

const statusIcons = {
    ok: <CheckCircle2 className="h-8 w-8 text-green-500" />,
    missing: <XCircle className="h-8 w-8 text-red-500" />,
    partial: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
};

export function StatusCard({ result }: StatusCardProps) {
    return (
        <Card className={`flex flex-col ${result.status === 'missing' ? 'border-red-500' : ''}`}>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg">{result.name}</CardTitle>
                    {statusIcons[result.status]}
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <CardDescription>{result.message}</CardDescription>
            </CardContent>
            {result.action && (
                <CardFooter>
                    {result.action}
                </CardFooter>
            )}
        </Card>
    );
}
