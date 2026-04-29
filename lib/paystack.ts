const BASE_URL = "https://api.paystack.co";

export async function verifyPaystackTransaction(reference: string) {
  const res = await fetch(`${BASE_URL}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Paystack verification failed");
  return res.json() as Promise<{
    status: boolean;
    data: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      channel: string;
      metadata: Record<string, string>;
    };
  }>;
}
