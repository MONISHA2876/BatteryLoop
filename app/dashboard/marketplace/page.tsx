"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EmptyState, Field, PageHeader, PrimaryButton, StatusChip } from "@/components/ui/primitives";
import { useWallet } from "@/components/wallet/WalletProvider";
import { api } from "@/lib/client/api";
import { CONDITIONS } from "@/lib/validation/battery";

type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  priceUsd: number | null;
  location: string | null;
  status: string;
  sellerAddress: string;
  batteryId: string | null;
};

function MarketplaceInner() {
  const params = useSearchParams();
  const { session } = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load(search: URLSearchParams) {
    const data = await api<{ listings: Listing[] }>(`/api/marketplace?${search.toString()}`);
    setListings(data.listings);
  }

  useEffect(() => {
    void load(params).catch((e) => setError(e.message));
  }, [params]);

  async function createListing(formData: FormData) {
    setError(null);
    try {
      await api("/api/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(formData.get("title")),
          description: String(formData.get("description")),
          category: String(formData.get("category")),
          condition: String(formData.get("condition")),
          priceUsd: formData.get("priceUsd") ? Number(formData.get("priceUsd")) : null,
          location: String(formData.get("location") || "") || null,
          batteryId: String(formData.get("batteryId") || "") || null,
          valuationId: params.get("valuation"),
          status: "OPEN",
        }),
      });
      setMessage("Listing saved as an off-chain application record. There is no on-chain escrow.");
      await load(new URLSearchParams());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create listing");
    }
  }

  async function enquire(listingId: string, text: string) {
    await api("/api/marketplace/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, message: text }),
    });
    setMessage("Request stored off-chain. This is not a payment.");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Circular market"
        title="Reuse and recycling marketplace"
        description="Listings and buyer requests are application records. The deployed contracts do not provide escrow, checkout, or payment. Nothing is marked paid."
      />
      <form
        className="filter-row"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const q = new URLSearchParams();
          for (const [k, v] of fd.entries()) if (String(v)) q.set(k, String(v));
          void load(q);
        }}
      >
        <input name="q" placeholder="Search" />
        <input name="category" placeholder="Category" />
        <input name="location" placeholder="Location" />
        <input name="minPrice" type="number" placeholder="Min USD" />
        <input name="maxPrice" type="number" placeholder="Max USD" />
        <PrimaryButton type="submit">Filter</PrimaryButton>
      </form>
      {session.user ? (
        <form
          className="app-panel form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            void createListing(new FormData(e.currentTarget));
          }}
        >
          <h3>Create listing</h3>
          <Field label="Title">
            <input name="title" required defaultValue={params.get("title") || ""} />
          </Field>
          <Field label="Description">
            <textarea name="description" required rows={3} />
          </Field>
          <Field label="Category">
            <input name="category" required defaultValue="battery" />
          </Field>
          <Field label="Condition">
            <select name="condition">{CONDITIONS.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="Price USD (optional)">
            <input name="priceUsd" type="number" step="0.01" />
          </Field>
          <Field label="Location">
            <input name="location" />
          </Field>
          <Field label="Battery ID (optional)">
            <input name="batteryId" />
          </Field>
          <PrimaryButton type="submit">Publish listing</PrimaryButton>
        </form>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="form-ok">{message}</p> : null}
      {listings.length === 0 ? (
        <EmptyState title="No listings" body="Open listings will appear here from the database." />
      ) : (
        <div className="card-grid">
          {listings.map((listing) => (
            <article key={listing.id} className="app-panel">
              <h3>{listing.title}</h3>
              <p>{listing.description}</p>
              <p>
                {listing.category} · {listing.condition} · {listing.location || "Location n/a"}
              </p>
              <p>{listing.priceUsd === null ? "Price on request" : `$${listing.priceUsd}`}</p>
              <StatusChip status={listing.status} />
              {listing.batteryId ? (
                <Link href={`/passport/${listing.batteryId}`}>Linked passport</Link>
              ) : null}
              {session.user && session.user.address !== listing.sellerAddress ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = String(new FormData(e.currentTarget).get("message") || "");
                    void enquire(listing.id, text);
                  }}
                >
                  <textarea name="message" required placeholder="Recovery or purchase enquiry" />
                  <PrimaryButton type="submit">Send request</PrimaryButton>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<p>Loading marketplace…</p>}>
      <MarketplaceInner />
    </Suspense>
  );
}
