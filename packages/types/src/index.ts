export type Role = "customer" | "provider" | "admin" | "fleet";
export interface Offer { id: string; provider: string; etaMin: number; price: number; rating?: number }
export type RequestKind = "breakdown" | "tyre" | "tow" | "delivery";
export type RequestStatus = "open" | "accepted" | "completed";
export interface ServiceRequest { id: string; kind: RequestKind; title: string; pickup?: string; dropoff?: string; status: RequestStatus; offers: Offer[]; acceptedBy?: string }
export interface Message { id: string; from: "customer" | "provider"; text: string; ts: number }
