import { redirect } from 'next/navigation'

export default function CheckoutFailedAliasPage() {
  redirect('/checkout/cancel')
}
