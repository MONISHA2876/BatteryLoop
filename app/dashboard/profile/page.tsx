"use client";

import { useEffect, useState } from "react";
import { Banner, Field, PageHeader, PrimaryButton } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/client/api";
import { ROLE_GUIDE } from "@/lib/blockchain/roles";

export default function ProfilePage() {
  const { session, account, chainId, config } = useWallet();
  const [user, setUser] = useState<{ displayName: string | null; email: string | null; location: string | null; bio: string | null; appRole: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session.user) {
      void api<{ user: typeof user }>("/api/profile").then((d) => setUser(d.user));
    }
  }, [session.user]);

  async function save(formData: FormData) {
    const data = await api<{ user: typeof user }>("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: String(formData.get("displayName") || ""),
        email: String(formData.get("email") || ""),
        location: String(formData.get("location") || ""),
        bio: String(formData.get("bio") || ""),
      }),
    });
    setUser(data.user);
    setMessage("Profile saved.");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Application roles live in the database and are not the same as OpenZeppelin contract roles. Private keys are never stored."
      />
      {!session.user ? (
        <Banner tone="info">Connect a wallet and sign in to manage your profile.</Banner>
      ) : (
        <form
          className="app-panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            void save(new FormData(e.currentTarget));
          }}
        >
          <p>Wallet: {account}</p>
          <p>Network: {chainId ?? "disconnected"} / expected {config?.chain.chainId}</p>
          <p>Application role: {user?.appRole || session.user.appRole}</p>
          <Field label="Display name">
            <input name="displayName" defaultValue={user?.displayName ?? ""} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" defaultValue={user?.email ?? ""} />
          </Field>
          <Field label="Location">
            <input name="location" defaultValue={user?.location ?? ""} />
          </Field>
          <Field label="Bio">
            <textarea name="bio" defaultValue={user?.bio ?? ""} />
          </Field>
          <PrimaryButton type="submit">Save</PrimaryButton>
          {message ? <p className="form-ok">{message}</p> : null}
        </form>
      )}
      <section className="app-panel">
        <h3>Detected on-chain roles</h3>
        <ul className="plain-list">
          <li><span>REGISTRAR_ROLE</span><strong>{String(session.chainRoles?.registrar)}</strong></li>
          <li><span>RECORDER_ROLE</span><strong>{String(session.chainRoles?.recorder)}</strong></li>
          <li><span>VERIFIER_ROLE</span><strong>{String(session.chainRoles?.verifier)}</strong></li>
        </ul>
      </section>
      <section className="app-panel">
        <h3>Role identifiers</h3>
        <ul>
          {ROLE_GUIDE.map((role) => (
            <li key={`${role.contract}-${role.roleName}`}>
              {role.contract} {role.roleName}: <code>{role.roleId}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
