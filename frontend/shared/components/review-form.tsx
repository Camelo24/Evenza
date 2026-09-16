"use client";

import { submitReview } from "@backend/reviews/actions";
import type { ActionState } from "@backend/auth/actions";
import { LoaderCircle, Star } from "lucide-react";
import { useActionState, useState } from "react";

const initialActionState: ActionState = { ok: false, message: "" };

export function ReviewForm({ bookingId, serviceProviderName }: { bookingId: string; serviceProviderName: string }) {
  const [state, action, pending] = useActionState(submitReview, initialActionState);
  const [rating, setRating] = useState(5);
  if (state.ok) return <p className="rounded-xl bg-mint px-4 py-3 text-sm text-forest">{state.message}</p>;
  return (
    <form action={action} className="rounded-2xl bg-paper p-4">
      <input type="hidden" name="bookingId" value={bookingId}/>
      <input type="hidden" name="rating" value={rating}/>
      <p className="text-xs font-bold">Share your experience with {serviceProviderName}</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} star${value > 1 ? "s" : ""}`}>
            <Star size={22} className={value <= rating ? "fill-marigold text-marigold" : "text-ink/25"} />
          </button>
        ))}
      </div>
      <textarea className="textarea-field mt-3 !min-h-20" name="comment" placeholder="What went well, what stood out?" required/>
      {state.message && <p className="mt-3 rounded-xl bg-berry/10 px-3 py-2 text-xs text-berry">{state.message}</p>}
      <button className="btn-ink mt-3 w-full" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" size={14}/> Publishing</> : "Publish review"}</button>
    </form>
  );
}
