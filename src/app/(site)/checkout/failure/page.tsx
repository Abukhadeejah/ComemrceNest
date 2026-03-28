import { redirect } from 'next/navigation'

export default function CheckoutFailureAliasPage() {
  redirect('/checkout/cancel')
}
