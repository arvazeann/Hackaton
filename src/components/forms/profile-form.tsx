"use client";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { profileSchema } from "@/schemas";
import type { z } from "zod";
import { FieldError } from "@/components/forms/field-error";
import { requestApi } from "@/components/forms/request-api";
import type { User } from "@/types";
import { useState } from "react";
type Values = z.infer<typeof profileSchema>;
export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user.name,
      phone: user.phone ?? "",
      city: user.city,
      bio: user.bio ?? "",
      avatarKey: user.avatarKey ?? null,
    },
  });
  const [uploadError, setUploadError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const avatarKey = useWatch({ control, name: "avatarKey" });
  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        setSaveMessage("");
        const result = await requestApi<User>("/api/profile", "PATCH", values);
        if (!result.success) {
          for (const [name, messages] of Object.entries(
            result.error.fieldErrors ?? {},
          ))
            setError(name as keyof Values, { message: messages?.[0] });
          setSaveMessage(result.error.message);
        } else {
          setSaveMessage("Profil tersimpan.");
          router.refresh();
        }
      })}
    >
      <h2 className="text-2xl font-bold">Profil saya</h2>
      <label className="grid gap-2 text-sm font-medium">
        Nama lengkap
        <input
          {...register("name")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.name?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Nomor telepon
        <input
          {...register("phone")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.phone?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Kota
        <input
          {...register("city")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.city?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Bio{" "}
        <textarea
          rows={3}
          maxLength={300}
          {...register("bio")}
          className="rounded-xl border px-4 py-3 font-normal"
        />
        <FieldError message={errors.bio?.message} />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Foto profil
        {avatarKey && (
          <Image
            src={`/uploads/${avatarKey}`}
            alt={`Foto profil ${user.name}`}
            width={80}
            height={80}
            unoptimized
            className="size-20 rounded-full object-cover"
          />
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            setUploadError("");
            setUploading(true);
            const body = new FormData();
            body.set("file", file);
            body.set("purpose", "AVATAR");
            try {
              const response = await fetch("/api/uploads", {
                method: "POST",
                body,
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.message);
              setValue("avatarKey", result.storageKey, { shouldDirty: true });
            } catch (error) {
              setUploadError(
                error instanceof Error
                  ? error.message
                  : "Avatar gagal diunggah.",
              );
            } finally {
              setUploading(false);
            }
          }}
        />
        <FieldError message={uploadError} />
      </label>
      <button
        disabled={isSubmitting || uploading}
        className="rounded-full bg-emerald-800 px-6 py-3 font-semibold text-white"
      >
        Simpan profil
      </button>
      {saveMessage && (
        <p role="status" className="text-sm text-emerald-800">
          {saveMessage}
        </p>
      )}
    </form>
  );
}
