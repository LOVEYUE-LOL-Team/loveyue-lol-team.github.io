"use client";

import { FormEvent, useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dashboard, type TeamData } from "./dashboard";

type EncryptedPayload = {
  version: 1;
  algorithm: "AES-GCM";
  kdf: "PBKDF2-SHA-256";
  iterations: number;
  salt: string;
  iv: string;
  aad: string;
  ciphertext: string;
};

function decodeBase64(value: string) {
  const decoded = atob(value);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) bytes[index] = decoded.charCodeAt(index);
  return bytes;
}

async function decryptTeamData(payload: EncryptedPayload, password: string): Promise<TeamData> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: decodeBase64(payload.salt), iterations: payload.iterations },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(payload.iv), additionalData: encoder.encode(payload.aad) },
    key,
    decodeBase64(payload.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as TeamData;
}

export function SecureDashboard() {
  const [payload, setPayload] = useState<EncryptedPayload | null>(null);
  const [data, setData] = useState<TeamData | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "unlocking" | "error">("loading");

  useEffect(() => {
    fetch("/team-data.enc.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("encrypted payload unavailable");
        return response.json() as Promise<EncryptedPayload>;
      })
      .then((value) => { setPayload(value); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, []);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payload || !password) return;
    setStatus("unlocking");
    try {
      setData(await decryptTeamData(payload, password));
      setPassword("");
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  if (data) return <><button className="secure-lock-button" type="button" onClick={() => setData(null)}><LockKeyhole aria-hidden="true"/>锁定</button><Dashboard data={data}/></>;

  return <main className="secure-gate">
    <section className="secure-card" aria-labelledby="secure-title">
      <div className="secure-emblem"><ShieldCheck aria-hidden="true"/></div>
      <p className="eyebrow">LOVEYUE · PRIVATE DATA ROOM</p>
      <h1 id="secure-title">车队战绩数据舱</h1>
      <p className="secure-copy">输入车队共享密码后查看。对局数据以加密形式保存，密码只在当前浏览器中用于解锁。</p>
      <form onSubmit={unlock}>
        <label htmlFor="team-password">共享密码</label>
        <div className="secure-password-field">
          <Input id="team-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); if (status === "error") setStatus("ready"); }} autoComplete="current-password" placeholder="请输入共享密码" disabled={status === "loading" || status === "unlocking"}/>
          <button type="button" aria-label={showPassword ? "隐藏密码" : "显示密码"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff/> : <Eye/>}</button>
        </div>
        {status === "error" ? <p className="secure-error" role="alert">密码不正确，或加密数据暂时无法读取。</p> : <p className="secure-hint">刷新或关闭页面后需要重新输入密码。</p>}
        <Button type="submit" disabled={!payload || !password || status === "unlocking"}>{status === "loading" ? "正在载入加密数据…" : status === "unlocking" ? "正在解锁…" : "进入数据舱"}</Button>
      </form>
    </section>
  </main>;
}
