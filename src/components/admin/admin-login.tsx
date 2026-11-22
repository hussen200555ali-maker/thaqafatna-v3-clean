"use client";

/**
 * نافذة تسجيل دخول لوحة الإدارة
 * تُعرض عند فتح زر الإدارة من تطبيق اللاعب، قبل إظهار أي وظيفة إدارية.
 */

import { useState, type FormEvent } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };
      if (response.ok && data.ok) {
        setPassword("");
        onSuccess();
        return;
      }
      setError(
        data.message ??
          (data.error === "admin_not_configured"
            ? "لم تُضبط بيانات الدخول على الخادم بعد"
            : "تعذّر تسجيل الدخول — حاول لاحقاً"),
      );
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-w-sm" aria-describedby="admin-login-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-heritage-900">
            <KeyRound className="size-5 text-heritage-700" aria-hidden="true" />
            دخول لوحة الإدارة
          </DialogTitle>
          <DialogDescription id="admin-login-desc" className="text-xs">
            هذه المنطقة مخصصة لفريق ثقافتنا فقط — بيانات الدخول تُتحقق على الخادم.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-username">اسم المستخدم</Label>
            <Input
              id="admin-username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">كلمة المرور</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-flame-50 p-3 text-xs font-medium text-flame-700"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1 font-heading">
              {loading ? "جارٍ التحقق…" : "دخول"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
